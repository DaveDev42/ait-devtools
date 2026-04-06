import { describe, it, expect, beforeEach, vi } from 'vitest';
import { aitState } from '../mock/state.js';

describe('AitStateManager', () => {
  beforeEach(() => {
    aitState.reset();
    // reset()은 shallow copy이므로 analyticsLog 배열을 직접 비워준다
    aitState.state.analyticsLog.length = 0;
  });

  it('update: 상태를 부분 업데이트한다', () => {
    aitState.update({ platform: 'android' });
    expect(aitState.state.platform).toBe('android');
    // 다른 필드는 유지
    expect(aitState.state.locale).toBe('ko-KR');
  });

  it('patch: 중첩 객체를 부분 업데이트한다', () => {
    aitState.patch('auth', { isLoggedIn: false });
    expect(aitState.state.auth.isLoggedIn).toBe(false);
    // 기존 값은 유지
    expect(aitState.state.auth.isTossLoginIntegrated).toBe(true);
  });

  it('subscribe: 상태 변경 시 리스너가 호출된다', () => {
    const listener = vi.fn();
    const unsub = aitState.subscribe(listener);

    aitState.update({ locale: 'en-US' });
    expect(listener).toHaveBeenCalledTimes(1);

    aitState.patch('brand', { displayName: 'Test' });
    expect(listener).toHaveBeenCalledTimes(2);

    unsub();
    aitState.update({ locale: 'ja-JP' });
    expect(listener).toHaveBeenCalledTimes(2); // 구독 해제 후 호출 안 됨
  });

  it('trigger: CustomEvent를 dispatch한다', () => {
    const handler = vi.fn();
    window.addEventListener('__ait:backEvent', handler);

    aitState.trigger('backEvent');
    expect(handler).toHaveBeenCalledTimes(1);

    window.removeEventListener('__ait:backEvent', handler);
  });

  it('logAnalytics: 분석 로그에 타임스탬프와 함께 추가된다', () => {
    aitState.logAnalytics({ type: 'screen', params: { page: 'home' } });
    const logs = aitState.state.analyticsLog;
    expect(logs).toHaveLength(1);
    expect(logs[0].type).toBe('screen');
    expect(logs[0].params).toEqual({ page: 'home' });
    expect(typeof logs[0].timestamp).toBe('number');
  });

  it('reset: 상태를 초기값으로 되돌린다 (deviceId는 유지)', () => {
    const deviceId = aitState.state.deviceId;
    aitState.update({ platform: 'android', locale: 'en-US' });

    aitState.reset();
    expect(aitState.state.platform).toBe('ios');
    expect(aitState.state.locale).toBe('ko-KR');
    expect(aitState.state.deviceId).toBe(deviceId);
  });
});
