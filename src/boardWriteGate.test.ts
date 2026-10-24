import { describe, expect, it } from 'vitest';
import boardLayout from '../layouts/board.json';
import routes from '../routes.json';

type AnyNode = Record<string, any>;

function findById(nodes: AnyNode[] | undefined, id: string): AnyNode | undefined {
  for (const node of nodes ?? []) {
    if (node?.id === id) return node;
    const found = findById(node?.children as AnyNode[] | undefined, id);
    if (found) return found;
  }
  return undefined;
}

describe('board write permission gate', () => {
  it('routes keep server-side auth on write/edit pages', () => {
    const entries = (routes as AnyNode).routes as AnyNode[];
    const write = entries.find((r) => r.path === '/board/:slug/write');
    const edit = entries.find((r) => r.path === '/board/:slug/:id/edit');
    expect(write?.auth_required).toBe(true);
    expect(edit?.auth_required).toBe(true);
  });

  it('board_write button has no disabled gate so every switch branch is reachable', () => {
    const button = findById(
      (boardLayout as AnyNode).slots?.content as AnyNode[],
      'board_write'
    );
    expect(button?.name).toBe('Button');
    expect(button?.props ?? {}).not.toHaveProperty('disabled');
  });

  it('board_write click switch covers allowed, no_permission, and not_logged_in', () => {
    const button = findById(
      (boardLayout as AnyNode).slots?.content as AnyNode[],
      'board_write'
    );
    const click = (button?.actions as AnyNode[]).find((a) => a?.type === 'click');
    expect(click?.handler).toBe('switch');
    expect(String(click?.params?.value)).toContain('can_write');
    expect(String(click?.params?.value)).toContain('currentUser');
    expect(Object.keys(click?.cases ?? {}).sort()).toEqual([
      'allowed',
      'no_permission',
      'not_logged_in',
    ]);
    expect(click?.cases?.allowed?.handler).toBe('navigate');
    expect(String(click?.cases?.allowed?.params?.path ?? '')).toContain('/write');
    expect(click?.cases?.no_permission?.handler).toBe('toast');
    expect(String(click?.cases?.no_permission?.params?.message ?? '')).toContain(
      'community.write.no_permission'
    );
    const loginStep = (click?.cases?.not_logged_in?.actions as AnyNode[]).find(
      (a) => a?.handler === 'navigate'
    );
    expect(loginStep?.params?.path).toBe('/login');
  });
});
