import { describe, it, expect, vi } from 'vitest';
import { createMockProxy } from '../mock/proxy.js';

// NOTE: WARNED set in proxy.ts is module-level global — use unique module names per test to avoid interference
describe('createMockProxy', () => {
  it('구현된 프로퍼티는 정상적으로 접근 가능하다', () => {
    const mock = createMockProxy('TestModuleAccess', {
      hello: () => 'world',
    });
    expect(mock.hello()).toBe('world');
  });

  it('미구현 프로퍼티 접근 시 경고를 출력하고 no-op 함수를 반환한다', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const mock = createMockProxy('TestModuleWarn', { existing: () => 42 });
    const fn = (mock as Record<string, unknown>)['unknownMethod'] as () => Promise<undefined>;

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('TestModuleWarn.unknownMethod is not mocked yet'));

    const result = await fn();
    expect(result).toBeUndefined();
  });

  it('같은 미구현 프로퍼티에 대해 경고는 한 번만 출력된다', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const mock = createMockProxy('WarnOnce', {});
    (mock as Record<string, unknown>)['foo'];
    (mock as Record<string, unknown>)['foo'];

    const fooWarnings = warnSpy.mock.calls.filter(c =>
      (c[0] as string).includes('WarnOnce.foo'),
    );
    expect(fooWarnings).toHaveLength(1);
  });
});
