import { default as React } from 'react';
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
export declare const HtmlContent: React.FC<HtmlContentProps>;
