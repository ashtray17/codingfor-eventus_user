import { describe, expect, it } from 'vitest';
import baseLayout from '../layouts/_user_base.json';
import homeLayout from '../layouts/home.json';

type AnyNode = Record<string, any>;

// 게스트 접속(/)이 로그인으로 튕기지 않아야 한다: 전 페이지 공통 조회인
// current_user는 토큰이 있을 때만 실어 보내고, 비회원은 조용히 null로 둔다.
describe('base current_user gate', () => {
  it('fetches current user with optional auth so guests stay on the page', () => {
    const sources = (baseLayout as AnyNode).data_sources as AnyNode[];
    const currentUser = sources.find((s) => s?.id === 'current_user');
    expect(currentUser?.endpoint).toBe('/api/auth/user');
    expect(currentUser?.auth_mode).toBe('optional');
    expect(currentUser?.fallback).toEqual({ data: null });
    expect(currentUser?.errorHandling?.['401']?.handler).toBe('suppress');
  });

  it('uses optional auth and suppresses 401/403 on all base and home widget data sources', () => {
    const baseSources = (baseLayout as AnyNode).data_sources as AnyNode[];
    const homeSources = (homeLayout as AnyNode).data_sources as AnyNode[];
    for (const id of ['boards', 'current_user', 'sidebar_notice', 'sidebar_column']) {
      const ds = baseSources.find((s) => s?.id === id);
      expect(ds?.auth_mode).toBe('optional');
      expect(ds?.errorHandling?.['401']?.handler).toBe('suppress');
      expect(ds?.errorHandling?.['403']?.handler).toBe('suppress');
    }
    for (const id of ['latest', 'popular', 'notice_photos', 'baseball_photos']) {
      const ds = homeSources.find((s) => s?.id === id);
      expect(ds?.auth_mode).toBe('optional');
      expect(ds?.errorHandling?.['401']?.handler).toBe('suppress');
      expect(ds?.errorHandling?.['403']?.handler).toBe('suppress');
    }
  });

  it('leaves no required-auth datasource in the shared base layout', () => {
    const sources = (baseLayout as AnyNode).data_sources as AnyNode[];
    expect(
      sources.filter((s) => s?.auth_mode === 'required').map((s) => s?.id)
    ).toEqual([]);
  });
});
