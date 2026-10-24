import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '..');
const LAYOUTS_DIR = join(ROOT, 'layouts');
const ERRORS_DIR = join(LAYOUTS_DIR, 'errors');

function collectJsonFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectJsonFiles(full));
    } else if (entry.name.endsWith('.json')) {
      files.push(full);
    }
  }
  return files;
}

interface LayoutNode {
  id?: string;
  name?: string;
  props?: Record<string, unknown>;
  children?: LayoutNode[];
}

function walkNodes(node: unknown, visit: (n: LayoutNode) => void): void {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) walkNodes(item, visit);
    return;
  }
  const n = node as LayoutNode;
  if (typeof n.name === 'string') {
    visit(n);
  }
  if (Array.isArray(n.children)) {
    for (const child of n.children) walkNodes(child, visit);
  }
  const slots = (node as { slots?: Record<string, unknown> }).slots;
  if (slots && typeof slots === 'object') {
    for (const val of Object.values(slots)) walkNodes(val, visit);
  }
}

describe('Hallmark 58-gate layout & token invariants', () => {
  const allLayoutFiles = collectJsonFiles(LAYOUTS_DIR);

  it('has tokens.css and Hallmark header stamp in main.css', () => {
    const tokensCss = readFileSync(join(ROOT, 'tokens.css'), 'utf8');
    const mainCss = readFileSync(join(ROOT, 'src', 'styles', 'main.css'), 'utf8');
    expect(tokensCss).toContain('theme: Cobalt (adapted)');
    expect(tokensCss).toContain('--color-danger:');
    expect(mainCss).toContain('theme: Cobalt (adapted)');
    expect(mainCss).toContain('--color-danger:');
  });

  it('forbids stock Tailwind palette leakage (slate-*, blue-*, red-*), outline-none, and transition-all across all layouts', () => {
    for (const file of allLayoutFiles) {
      const raw = readFileSync(file, 'utf8');
      expect(raw, `${file} contains slate-*`).not.toMatch(/\b(text|bg|border)-slate-\d+\b/);
      expect(raw, `${file} contains blue-*`).not.toMatch(/\b(text|bg|border)-blue-\d+\b/);
      expect(raw, `${file} contains red-*`).not.toMatch(/\b(text|bg|border)-red-\d+\b/);
      expect(raw, `${file} contains outline-none`).not.toMatch(/\boutline-none\b/);
      expect(raw, `${file} contains transition-all`).not.toMatch(/\btransition-all\b/);
    }
  });

  it('requires aria-label on every Input and Textarea node across all layouts', () => {
    for (const file of allLayoutFiles) {
      const parsed = JSON.parse(readFileSync(file, 'utf8'));
      walkNodes(parsed, (node) => {
        if (node.name === 'Input' || node.name === 'Textarea') {
          const ariaLabel = node.props?.['aria-label'];
          expect(
            typeof ariaLabel === 'string' && ariaLabel.trim().length > 0,
            `${file} node ${node.id ?? node.name} missing aria-label`
          ).toBe(true);
        }
      });
    }
  });

  it('uses Cobalt tokens on all 6 error layouts', () => {
    const errorFiles = collectJsonFiles(ERRORS_DIR);
    expect(errorFiles.length).toBe(6);
    for (const file of errorFiles) {
      const raw = readFileSync(file, 'utf8');
      expect(raw).toContain('text-faint');
      expect(raw).toContain('text-ink');
      expect(raw).toContain('bg-accent');
    }
  });
});
