import React, { useCallback, useState } from 'react';

/**
 * 테마 저장 키 — localStorage 'g7-theme' = 'dark' | 'light'
 * (값이 없으면 시스템 선호를 따른다)
 */
const STORAGE_KEY = 'g7-theme';

/**
 * 저장된/시스템 테마를 <html> 에 적용한다.
 *
 * G7 어드민과 동일한 `html.dark` 규약을 사용한다(코어 usePreviewDarkIsolation 참조).
 * IIFE 번들 로드 시점(module scope)에 호출해 첫 페인트 전에 반영한다.
 */
export function applyTheme(dark: boolean): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', dark);
  try {
    window.localStorage?.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
  } catch {
    /* ignore */
  }
}

export function initTheme(): void {
  if (typeof document === 'undefined') return;

  let stored: string | null = null;
  try {
    stored = window.localStorage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    stored = null;
  }

  const prefersDark =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  applyTheme(stored === 'dark' || (stored !== 'light' && prefersDark));
}

export function toggleTheme(): void {
  if (typeof document === 'undefined') return;
  applyTheme(!document.documentElement.classList.contains('dark'));
}

export interface ThemeToggleProps {
  /** 스크린 리더용 라벨 (레이아웃 JSON에서 $t: 키로 전달) */
  ariaLabel?: string;
  className?: string;
}

const MoonIcon: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const SunIcon: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

/**
 * 다크 모드 전환 버튼.
 *
 * 클릭 시 html.dark 토글 + localStorage 저장. 초기 클래스는 initTheme()이
 * 이미 적용한 상태를 그대로 읽는다(이중 초기화 없음).
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ ariaLabel, className = '' }) => {
  const [dark, setDark] = useState<boolean>(() =>
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : false
  );

  const handleClick = useCallback(() => {
    setDark(prev => {
      const next = !prev;
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', next);
      }
      try {
        window.localStorage?.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      } catch {
        /* localStorage 접근 불가 환경 — 무시 */
      }
      return next;
    });
  }, []);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      aria-pressed={dark}
      className={
        className ||
        'flex h-9 w-9 cursor-pointer items-center justify-center rounded-ctl border border-rule text-muted transition-colors duration-150 hover:border-rule-2 hover:text-ink'
      }
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
};

ThemeToggle.displayName = 'ThemeToggle';
