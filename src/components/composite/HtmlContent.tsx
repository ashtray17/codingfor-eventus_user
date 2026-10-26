import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';

export interface HtmlContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 표시할 콘텐츠 (HTML 또는 일반 텍스트)
   */
  content?: string;

  /**
   * 레이아웃 JSON에서 text 속성으로 전달되는 콘텐츠 — content 보다 우선
   */
  text?: string;

  /**
   * HTML 렌더링 여부 (false면 일반 텍스트, 줄바꿈 보존)
   * @default true
   */
  isHtml?: boolean;

  /**
   * DOMPurify 설정 오버라이드 (isHtml=true일 때만 사용)
   */
  purifyConfig?: any;
}

/**
 * 게시글 본문 등 서버 콘텐츠를 안전하게 렌더링하는 컴포넌트.
 * - isHtml=true: DOMPurify로 위험 태그/속성을 차단한 뒤 innerHTML 렌더링
 * - isHtml=false: 일반 텍스트 (whitespace-pre-wrap)
 */
export const HtmlContent: React.FC<HtmlContentProps> = ({
  content,
  text,
  isHtml = true,
  className = '',
  purifyConfig,
  id,
  ...rest
}) => {
  const actualContent = text ?? content ?? '';

  // 빈 값 처리
  if (!actualContent || actualContent.trim() === '') {
    return null;
  }

  // 일반 텍스트 모드
  if (!isHtml) {
    return (
      <div
        id={id}
        className={`whitespace-pre-wrap text-ink-2 ${className}`.trim().replace(/\s+/g, ' ')}
        {...rest}
      >
        {actualContent}
      </div>
    );
  }

  // FORBID 방식: 위험 태그/속성만 차단, 나머지는 허용 (게시판 본문 편집기 출력 보존)
  const defaultConfig: any = {
    FORBID_TAGS: [
      'script', 'noscript',
      'iframe', 'frame', 'frameset', 'object', 'embed', 'applet', 'portal',
      'form', 'input', 'textarea', 'select', 'button',
      'style', 'link', 'meta', 'base',
      'body', 'head', 'html', 'title',
      'svg', 'math',
      'audio', 'video', 'source', 'track', 'canvas',
      'details', 'dialog',
      'plaintext', 'xmp', 'listing',
      'marquee', 'noframes', 'noembed', 'template', 'slot',
    ],
    FORBID_ATTR: [
      'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur',
      'ontoggle', 'oncanplay', 'onloadstart',
      'formaction', 'xlink:href', 'action',
    ],
    ALLOW_DATA_ATTR: true,
    ADD_ATTR: ['target'],
  };

  const sanitizedHtml = useMemo(() => {
    const config = purifyConfig
      ? {
          ...defaultConfig,
          ...purifyConfig,
          // 보안 기본값은 항상 유지
          FORBID_TAGS: [...defaultConfig.FORBID_TAGS, ...(purifyConfig.FORBID_TAGS || [])],
          FORBID_ATTR: [...defaultConfig.FORBID_ATTR, ...(purifyConfig.FORBID_ATTR || [])],
        }
      : defaultConfig;

    const cleaned = DOMPurify.sanitize(actualContent, config) as unknown as string;

    // target="_blank" 링크에 rel 추가 (보안)
    return cleaned.replace(
      /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi,
      (match: string, before: string, href: string, after: string) => {
        if (href.startsWith('http://') || href.startsWith('https://')) {
          if (!match.includes('rel=')) {
            return `<a ${before}href="${href}"${after} rel="noopener noreferrer">`;
          }
        }
        return match;
      }
    );
  }, [actualContent, purifyConfig]);

  return (
    <div
      id={id}
      className={`rich-html whitespace-pre-line ${className}`.trim().replace(/\s+/g, ' ')}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      {...rest}
    />
  );
};

HtmlContent.displayName = 'HtmlContent';