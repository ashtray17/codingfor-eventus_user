/**
 * merge-font-css.cjs — dist CSS 후처리 (vite build 이후 실행)
 *
 * 1) vite build(emptyOutDir)가 지우는 dist/fonts/wanted-sans 를 .build/fonts 원본에서 복원
 * 2) wanted-sans.css(@font-face 92개, dist/css/ 기준 상대경로)를 dist/css/components.css 앞에 병합
 *
 * package.json 에서 "vite build && node .build/merge-font-css.cjs" 로 호출됨
 */
const fs = require('fs');
const path = require('path');

const fontSrcDir = path.join(__dirname, 'fonts', 'wanted-sans');
const distFontDir = path.join(__dirname, '..', 'dist', 'fonts', 'wanted-sans');
const distCssPath = path.join(__dirname, '..', 'dist', 'css', 'components.css');

if (!fs.existsSync(fontSrcDir)) {
  console.error('[merge-font-css] font source not found:', fontSrcDir);
  process.exit(1);
}

if (!fs.existsSync(distCssPath)) {
  console.error('[merge-font-css] dist css not found — run "vite build" first.');
  process.exit(1);
}

if (!fs.existsSync(distFontDir)) {
  fs.cpSync(fontSrcDir, distFontDir, { recursive: true, preserveTimestamps: true });
  console.log('[merge-font-css] restored dist/fonts/wanted-sans');
}

const fontCss = fs.readFileSync(path.join(distFontDir, 'wanted-sans.css'), 'utf8');
const appCss = fs.readFileSync(distCssPath, 'utf8');

if (appCss.startsWith(fontCss)) {
  console.log('[merge-font-css] already merged — skipped');
} else {
  fs.writeFileSync(distCssPath, fontCss + '\n' + appCss);
  console.log('[merge-font-css] prepended wanted-sans @font-face rules to dist/css/components.css');
}
