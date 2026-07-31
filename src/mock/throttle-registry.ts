/**
 * throttle 레지스트리 (devtools#834).
 *
 * 메서드별 마지막 *허용* 호출 시각만 담는 leaf 모듈이다. `state.ts`가 `reset()`에서
 * 이걸 비워야 하는데, 로직 본체(`throttle.ts`)는 거꾸로 `state.ts`를 읽는다 —
 * 그래서 **의존이 없는 이 파일로 레지스트리를 분리해** 순환 import를 피한다.
 */

/** 메서드별 마지막 *허용* 호출 시각(ms). */
export const lastAllowedAt = new Map<string, number>();

/**
 * throttle 레지스트리를 비운다. `aitState.reset()`이 호출한다 — 상태를 되돌렸는데
 * 직전 세션의 호출 시각이 남아 있으면 첫 호출이 이유 없이 거부된다.
 */
export function resetThrottleRegistry(): void {
  lastAllowedAt.clear();
}
