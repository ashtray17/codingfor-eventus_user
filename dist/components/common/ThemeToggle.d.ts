import { default as React } from 'react';
/**
 * 저장된/시스템 테마를 <html> 에 적용한다.
 *
 * G7 어드민과 동일한 `html.dark` 규약을 사용한다(코어 usePreviewDarkIsolation 참조).
 * IIFE 번들 로드 시점(module scope)에 호출해 첫 페인트 전에 반영한다.
 */
export declare function applyTheme(dark: boolean): void;
export declare function initTheme(): void;
export declare function toggleTheme(): void;
export interface ThemeToggleProps {
    /** 스크린 리더용 라벨 (레이아웃 JSON에서 $t: 키로 전달) */
    ariaLabel?: string;
    className?: string;
}
/**
 * 다크 모드 전환 버튼.
 *
 * 클릭 시 html.dark 토글 + localStorage 저장. 초기 클래스는 initTheme()이
 * 이미 적용한 상태를 그대로 읽는다(이중 초기화 없음).
 */
export declare const ThemeToggle: React.FC<ThemeToggleProps>;
