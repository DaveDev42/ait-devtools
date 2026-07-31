/**
 * THROTTLED 시뮬레이션 (devtools#834 — #770 §3 분리).
 *
 * 실기기 네이티브 브리지는 같은 메서드를 짧은 간격으로 연타하면
 * `APP_BRIDGE_THROTTLED`로 거부한다. 이 모듈은 그 per-method rate limit을
 * env1(mock)에서 **opt-in으로** 재현한다 — 다이얼(`failureModes.throttled`)이
 * 미설정이면 아무 일도 하지 않으므로 zero behavior change다.
 *
 * 설계 메모 두 가지:
 *
 * 1. **거부된 호출은 창을 갱신하지 않는다.** 마지막 *허용된* 호출 시각만 기록하므로,
 *    `intervalMs` 안에서 계속 연타해도 창이 밀려나지 않고 최초 허용 시점 기준으로
 *    풀린다. 네이티브 rate limit의 통상 동작이자, 연타 중 영원히 막히는(창이 계속
 *    갱신되는) 반-패턴을 피한다.
 * 2. **`observe()`에 걸지 않는다.** `observe()`는 `fn`을 호출하기 *전에* 감싸므로
 *    거기서 throw하면 원래 Promise를 반환하는 API가 **동기 throw**로 바뀐다.
 *    `threwSync`는 env1↔env3 동치 diff의 관측 축이라 그 차이가 곧 가짜 불일치가 된다.
 *    그래서 각 mock 구현 본문 안(= 그 API 자신의 sync/async 계약 안)에 수동 삽입한다.
 */

import { buildNativeError } from './native-error.js';
import { aitState } from './state.js';
import { lastAllowedAt } from './throttle-registry.js';

export { resetThrottleRegistry } from './throttle-registry.js';

/**
 * throttle 훅이 실제로 삽입된 메서드 목록.
 *
 * `failureModes.throttled.methods`에 여기 없는 이름을 넣어도 아무 효과가 없다 —
 * 다이얼은 훅이 있는 자리에서만 동작한다. 목록은 실기기에서 burst가 실제로
 * 일어나는 지점(클립보드·위치 폴링, 광고 로드 재시도)을 기준으로 골랐다.
 */
export const THROTTLE_INSTRUMENTED_METHODS = [
  'getClipboardText',
  'setClipboardText',
  'getCurrentLocation',
  'loadAppsInTossAdMob',
  'loadFullScreenAd',
] as const;

/**
 * `method`가 지금 throttle에 걸리면 네이티브 실패 에러를 돌려주고, 아니면
 * 호출 시각을 기록한 뒤 `undefined`를 돌려준다.
 *
 * 반환된 에러를 **호출부가 자신의 계약대로** 흘려보낸다 — async mock은 `throw`
 * (= reject), 콜백형 mock은 `onError(err)`. 그래서 이 함수 자체는 던지지 않는다.
 */
export function throttleErrorFor(method: string): Error | undefined {
  // `methods`까지 optional-chain으로 받는다 (#836). `__ait.patch`는 콘솔에서 손으로
  // 치는 무타입 표면이라, `methods`를 빠뜨린 다이얼이 mock 안에서 TypeError로 터지는
  // 대신 no-op이어야 한다 — 주변 다이얼(`getPermission?.[…]`)과 같은 방어 수준.
  const dial = aitState.state.failureModes.throttled;
  if (!dial?.methods?.includes(method)) return undefined;

  const now = Date.now();
  const prev = lastAllowedAt.get(method);
  if (prev !== undefined && now - prev < dial.intervalMs) {
    return buildNativeError('APP_BRIDGE_THROTTLED');
  }

  lastAllowedAt.set(method, now);
  return undefined;
}

/**
 * `throttleErrorFor`의 throw 버전 — async mock 본문에서 한 줄로 쓴다.
 * async 함수 안에서 던지므로 호출자에게는 rejection으로 도달한다.
 */
export function checkThrottle(method: string): void {
  const err = throttleErrorFor(method);
  if (err) throw err;
}
