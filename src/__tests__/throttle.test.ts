import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadFullScreenAd } from '../mock/ads/index.js';
import { getClipboardText, setClipboardText } from '../mock/device/clipboard.js';
import type { NativeErrorEnvelope } from '../mock/native-error.js';
import { aitState } from '../mock/state.js';
import { THROTTLE_INSTRUMENTED_METHODS } from '../mock/throttle.js';

/**
 * THROTTLED 시뮬레이션 (devtools#834 — #770 §3 분리).
 *
 * 시간 축이 판정에 직접 들어가므로 fake timer로 시계를 고정한다. 실시간 sleep에
 * 의존하면 CI 지터가 그대로 테스트 실패가 된다.
 */
describe('THROTTLED 다이얼 (devtools#834)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    aitState.reset();
    aitState.patch('deviceModes', { clipboard: 'mock' });
  });

  afterEach(() => {
    vi.useRealTimers();
    aitState.reset();
  });

  describe('다이얼 미설정 = zero behavior change', () => {
    it('연타해도 전부 resolve한다', async () => {
      await expect(setClipboardText('a')).resolves.toBeDefined();
      await expect(setClipboardText('b')).resolves.toBeDefined();
      await expect(setClipboardText('c')).resolves.toBeDefined();
      await expect(getClipboardText()).resolves.toBe('c');
    });

    it('failureModes 기본값에 throttled 축이 없다', () => {
      expect(aitState.state.failureModes.throttled).toBeUndefined();
    });
  });

  describe('다이얼 설정', () => {
    beforeEach(() => {
      aitState.patch('failureModes', {
        throttled: { methods: ['setClipboardText'], intervalMs: 1_000 },
      });
    });

    it('첫 호출은 통과하고 intervalMs 안의 재호출은 APP_BRIDGE_THROTTLED로 reject한다', async () => {
      await expect(setClipboardText('first')).resolves.toBeDefined();

      vi.setSystemTime(new Date('2026-01-01T00:00:00.500Z'));
      await expect(setClipboardText('second')).rejects.toMatchObject({
        code: 'APP_BRIDGE_THROTTLED',
      });
    });

    it('2.x 라인에서 native envelope 필드를 전부 싣는다', async () => {
      await setClipboardText('first');
      vi.setSystemTime(new Date('2026-01-01T00:00:00.500Z'));

      const err = (await setClipboardText('second').catch((e: unknown) => e)) as Error &
        NativeErrorEnvelope;

      expect(err).toBeInstanceOf(Error);
      expect(err.code).toBe('APP_BRIDGE_THROTTLED');
      expect(err.userInfo).toEqual({});
      expect(err.moduleName).toBe('RNBridge');
      expect(err.__isError).toBe(true);
      expect(err.message.length).toBeGreaterThan(0);
    });

    it('sdkLine이 3.x면 같은 실패가 맨 Error로 평탄화된다', async () => {
      aitState.patch('failureModes', { sdkLine: '3.x' });
      await setClipboardText('first');
      vi.setSystemTime(new Date('2026-01-01T00:00:00.500Z'));

      const err = (await setClipboardText('second').catch((e: unknown) => e)) as Error &
        Partial<NativeErrorEnvelope>;

      expect(err).toBeInstanceOf(Error);
      expect(err.message.length).toBeGreaterThan(0);
      expect(err.code).toBeUndefined();
      expect(err.userInfo).toBeUndefined();
      expect(err.moduleName).toBeUndefined();
      expect(err.__isError).toBeUndefined();
    });

    it('intervalMs가 지나면 다시 통과한다', async () => {
      await setClipboardText('first');
      vi.setSystemTime(new Date('2026-01-01T00:00:01.000Z'));
      await expect(setClipboardText('second')).resolves.toBeDefined();
    });

    it('거부된 호출은 창을 갱신하지 않는다 — 연타 중에도 최초 허용 시점 기준으로 풀린다', async () => {
      await setClipboardText('first'); // t=0, 허용

      vi.setSystemTime(new Date('2026-01-01T00:00:00.900Z'));
      await expect(setClipboardText('blocked')).rejects.toMatchObject({
        code: 'APP_BRIDGE_THROTTLED',
      });

      // 거부된 t=900ms 호출이 창을 밀었다면 t=1000ms는 아직 막혀 있어야 한다.
      // 허용된 호출(t=0)만 기록되므로 여기서 풀린다.
      vi.setSystemTime(new Date('2026-01-01T00:00:01.000Z'));
      await expect(setClipboardText('allowed')).resolves.toBeDefined();
    });

    it('methods 목록 밖의 메서드는 영향받지 않는다', async () => {
      await setClipboardText('x');
      vi.setSystemTime(new Date('2026-01-01T00:00:00.100Z'));
      // getClipboardText는 목록에 없다
      await expect(getClipboardText()).resolves.toBe('x');
      await expect(getClipboardText()).resolves.toBe('x');
    });

    it('메서드별로 창이 독립적이다', async () => {
      aitState.patch('failureModes', {
        throttled: { methods: ['setClipboardText', 'getClipboardText'], intervalMs: 1_000 },
      });

      await expect(setClipboardText('x')).resolves.toBeDefined();
      // 같은 시각이라도 getClipboardText는 자기 창의 첫 호출이라 통과한다
      await expect(getClipboardText()).resolves.toBe('x');
      await expect(getClipboardText()).rejects.toMatchObject({ code: 'APP_BRIDGE_THROTTLED' });
    });

    it('aitState.reset()이 throttle 창까지 비운다', async () => {
      await setClipboardText('first');

      aitState.reset();
      aitState.patch('deviceModes', { clipboard: 'mock' });
      aitState.patch('failureModes', {
        throttled: { methods: ['setClipboardText'], intervalMs: 1_000 },
      });

      // 시계는 그대로인데 레지스트리가 비었으므로 첫 호출로 취급된다
      await expect(setClipboardText('second')).resolves.toBeDefined();
    });
  });

  describe('콜백형 API', () => {
    it('loadFullScreenAd는 throw가 아니라 onError로 흘린다', () => {
      aitState.patch('failureModes', {
        throttled: { methods: ['loadFullScreenAd'], intervalMs: 1_000 },
      });

      const firstError = vi.fn();
      loadFullScreenAd({
        options: { adGroupId: 'mock-group' },
        onEvent: vi.fn(),
        onError: firstError,
      });
      vi.runAllTimers();
      expect(firstError).not.toHaveBeenCalled();

      vi.setSystemTime(new Date('2026-01-01T00:00:00.500Z'));
      const secondError = vi.fn();
      loadFullScreenAd({
        options: { adGroupId: 'mock-group' },
        onEvent: vi.fn(),
        onError: secondError,
      });
      vi.runAllTimers();

      expect(secondError).toHaveBeenCalledTimes(1);
      expect(secondError.mock.calls[0][0]).toMatchObject({ code: 'APP_BRIDGE_THROTTLED' });
    });
  });

  it('훅이 삽입된 메서드 목록이 정본으로 노출된다', () => {
    expect([...THROTTLE_INSTRUMENTED_METHODS]).toEqual([
      'getClipboardText',
      'setClipboardText',
      'getCurrentLocation',
      'loadAppsInTossAdMob',
      'loadFullScreenAd',
    ]);
  });

  it('methods를 빠뜨린 다이얼은 throw가 아니라 no-op이다 (#836)', async () => {
    // __ait.patch는 콘솔에서 손으로 치는 무타입 표면이라 이런 값이 실제로 들어온다.
    aitState.patch('failureModes', {
      throttled: { intervalMs: 1_000 } as unknown as { methods: string[]; intervalMs: number },
    });

    await expect(setClipboardText('a')).resolves.toBeDefined();
    await expect(setClipboardText('b')).resolves.toBeDefined();
  });

  /**
   * tsdown이 mock/panel/unplugin entry를 각각 self-contained로 빌드하므로 소비자가 두
   * entry를 동시에 import하면 이 모듈이 entry당 하나씩 복제된다. `vi.resetModules()` +
   * 재-import로 그 복제를 재현해, globalThis 싱글턴 가드가 Map을 공유시키는지 본다 (#836).
   */
  it('entry가 복제돼도 레지스트리 Map을 공유한다 (#836)', async () => {
    const first = await import('../mock/throttle-registry.js');
    vi.resetModules();
    const second = await import('../mock/throttle-registry.js');

    // 복제를 실제로 재현했는지 먼저 확인한다 — 모듈 인스턴스는 서로 달라야 한다.
    expect(second).not.toBe(first);
    // 그런데 Map은 같은 인스턴스여야 한다.
    expect(second.lastAllowedAt).toBe(first.lastAllowedAt);

    first.lastAllowedAt.set('probe', 123);
    expect(second.lastAllowedAt.get('probe')).toBe(123);

    // 한쪽에서 reset하면 다른 쪽에서도 비워진다 — aitState.reset()이 어느 번들의
    // resetThrottleRegistry를 붙잡고 있든 결과가 같아야 한다.
    second.resetThrottleRegistry();
    expect(first.lastAllowedAt.size).toBe(0);
  });
});
