/**
 * throttle 레지스트리 (devtools#834).
 *
 * 메서드별 마지막 *허용* 호출 시각만 담는 leaf 모듈이다. `state.ts`가 `reset()`에서
 * 이걸 비워야 하는데, 로직 본체(`throttle.ts`)는 거꾸로 `state.ts`를 읽는다 —
 * 그래서 **의존이 없는 이 파일로 레지스트리를 분리해** 순환 import를 피한다.
 *
 * `state.ts`의 `AitStateManager`와 같은 이유로 `globalThis` 싱글턴이어야 한다 (#836):
 * `tsdown.config.ts`가 mock/panel/unplugin entry를 각각 self-contained로 빌드하므로,
 * 소비자가 두 entry를 동시에 import하면 이 모듈이 entry당 하나씩 복제된다. Map을
 * 모듈 지역 변수로 두면 `aitState.reset()`이 비우는 Map(싱글턴을 먼저 생성한 번들의 것)과
 * `throttleErrorFor`가 읽는 Map(mock 번들의 것)이 갈려, 리셋 직후 첫 호출이 낡은
 * 타임스탬프 때문에 거부된다 — 이 파일이 막으려던 바로 그 증상이다.
 */

const SINGLETON_KEY = '__aitDevtoolsThrottleRegistry__';
type GlobalWithRegistry = typeof globalThis & { [SINGLETON_KEY]?: Map<string, number> };
const globalRef = globalThis as GlobalWithRegistry;
if (!globalRef[SINGLETON_KEY]) {
  globalRef[SINGLETON_KEY] = new Map<string, number>();
}

/** 메서드별 마지막 *허용* 호출 시각(ms). 페이지 안의 모든 entry가 공유한다. */
export const lastAllowedAt: Map<string, number> = globalRef[SINGLETON_KEY]!;

/**
 * throttle 레지스트리를 비운다. `aitState.reset()`이 호출한다 — 상태를 되돌렸는데
 * 직전 세션의 호출 시각이 남아 있으면 첫 호출이 이유 없이 거부된다.
 */
export function resetThrottleRegistry(): void {
  lastAllowedAt.clear();
}
