/**
 * Codingfor Community User Template
 *
 * 커뮤니티/게시판 중심 신규 사용자 템플릿.
 * Basic 10개 + HtmlContent composite 포함.
 */

// Hallmark design system — Cobalt tokens + Tailwind utilities compiled for layout JSON
import './styles/main.css';

// Dark mode — apply saved/system theme (html.dark) before the template UI paints.
import { initTheme, toggleTheme } from './components/common/ThemeToggle';
import { initGallerySwipe } from './gallerySwipe';
initTheme();
initGallerySwipe();

const handlerMap = {
  toggleTheme: async () => {
    toggleTheme();
  },
};

if (typeof window !== 'undefined') {
  (window as any).G7TemplateHandlers = handlerMap;
}

// Logger (G7Core 초기화 전에도 동작하도록 폴백 포함)
const logger = ((window as any).G7Core?.createLogger?.('Template:codingfor-community_user')) ?? {
    log: (...args: unknown[]) => console.log('[Template:codingfor-community_user]', ...args),
    warn: (...args: unknown[]) => console.warn('[Template:codingfor-community_user]', ...args),
    error: (...args: unknown[]) => console.error('[Template:codingfor-community_user]', ...args),
};

// Basic 10개 컴포넌트
export { Div, type DivProps } from './components/basic/Div';
export { Button, type ButtonProps } from './components/basic/Button';
export { H1, type H1Props } from './components/basic/H1';
export { H2, type H2Props } from './components/basic/H2';
export { H3, type H3Props } from './components/basic/H3';
export { A, type AProps } from './components/basic/A';
export { Span, type SpanProps } from './components/basic/Span';
export { Img, type ImgProps } from './components/basic/Img';
export { Input, type InputProps } from './components/basic/Input';
export { Textarea, type TextareaProps } from './components/basic/Textarea';
export { HtmlContent, type HtmlContentProps } from './components/composite/HtmlContent';
export { ImageUploader, type ImageUploaderProps } from './components/composite/ImageUploader';

export function initTemplate(): void {
  if (typeof window === 'undefined') return;

  let retryCount = 0;
  const maxRetries = 50;

  const registerHandlers = () => {
    const actionDispatcher = (window as any).G7Core?.getActionDispatcher?.();
    if (actionDispatcher) {
      Object.entries(handlerMap).forEach(([name, handler]) => {
        actionDispatcher.registerHandler(name, handler);
      });
      logger.log(`${Object.keys(handlerMap).length} custom handler(s) registered:`, Object.keys(handlerMap));
      return;
    }
    retryCount += 1;
    if (retryCount <= maxRetries) {
      setTimeout(registerHandlers, 100);
    } else {
      logger.error('Failed to register handlers: ActionDispatcher not available');
    }
  };

  if (document.readyState === 'complete') {
    registerHandlers();
  } else {
    window.addEventListener('load', registerHandlers);
  }
}

initTemplate();
