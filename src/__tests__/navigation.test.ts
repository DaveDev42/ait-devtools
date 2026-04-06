import { describe, it, expect, beforeEach, vi } from 'vitest';
import { aitState } from '../mock/state.js';
import {
  getPlatformOS,
  getOperationalEnvironment,
  isMinVersionSupported,
  getNetworkStatus,
  getServerTime,
  graniteEvent,
} from '../mock/navigation/index.js';

describe('Navigation mock', () => {
  beforeEach(() => {
    aitState.reset();
  });

  it('getPlatformOS: 상태의 platform을 반환한다', () => {
    expect(getPlatformOS()).toBe('ios');
    aitState.update({ platform: 'android' });
    expect(getPlatformOS()).toBe('android');
  });

  it('getOperationalEnvironment: 상태의 environment를 반환한다', () => {
    expect(getOperationalEnvironment()).toBe('sandbox');
    aitState.update({ environment: 'toss' });
    expect(getOperationalEnvironment()).toBe('toss');
  });

  describe('isMinVersionSupported', () => {
    it('현재 버전이 최소 버전 이상이면 true', () => {
      // appVersion: '5.240.0'
      expect(isMinVersionSupported({ ios: '5.240.0', android: '5.240.0' })).toBe(true);
      expect(isMinVersionSupported({ ios: '5.200.0', android: '5.200.0' })).toBe(true);
    });

    it('현재 버전이 최소 버전 미만이면 false', () => {
      expect(isMinVersionSupported({ ios: '6.0.0', android: '6.0.0' })).toBe(false);
    });

    it('always는 항상 true, never는 항상 false', () => {
      expect(isMinVersionSupported({ ios: 'always', android: 'always' })).toBe(true);
      expect(isMinVersionSupported({ ios: 'never', android: 'never' })).toBe(false);
    });

    it('android 플랫폼일 때 android 버전을 비교한다', () => {
      aitState.update({ platform: 'android' });
      expect(isMinVersionSupported({ ios: '999.0.0', android: '1.0.0' })).toBe(true);
    });
  });

  it('getNetworkStatus: 상태의 networkStatus를 반환한다', async () => {
    expect(await getNetworkStatus()).toBe('WIFI');
    aitState.update({ networkStatus: 'OFFLINE' });
    expect(await getNetworkStatus()).toBe('OFFLINE');
  });

  it('getServerTime: 현재 시간을 반환한다', async () => {
    const before = Date.now();
    const time = await getServerTime();
    const after = Date.now();
    expect(time).toBeGreaterThanOrEqual(before);
    expect(time).toBeLessThanOrEqual(after);
  });

  describe('graniteEvent', () => {
    it('backEvent 리스너를 등록하고 trigger로 호출할 수 있다', () => {
      const handler = vi.fn();
      const unsub = graniteEvent.addEventListener('backEvent', { onEvent: handler });

      aitState.trigger('backEvent');
      expect(handler).toHaveBeenCalledTimes(1);

      unsub();
      aitState.trigger('backEvent');
      expect(handler).toHaveBeenCalledTimes(1); // 구독 해제 후 호출 안 됨
    });

    it('homeEvent 리스너를 등록하고 trigger로 호출할 수 있다', () => {
      const handler = vi.fn();
      const unsub = graniteEvent.addEventListener('homeEvent', { onEvent: handler });

      aitState.trigger('homeEvent');
      expect(handler).toHaveBeenCalledTimes(1);

      unsub();
    });
  });
});
