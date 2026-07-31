---
'@ait-co/devtools': patch
---

throttle 레지스트리를 `globalThis` 싱글턴으로 고친다 (#836 — 0.2.1 회귀).

`tsdown.config.ts`가 mock/panel/unplugin entry를 각각 self-contained로 빌드하므로 소비자가 두 entry를 동시에 import하면 모듈 상태가 entry당 하나씩 복제된다. `AitStateManager`는 이미 `globalThis` 싱글턴으로 방어돼 있었지만 0.2.1에 들어간 `throttle-registry.ts`의 Map에는 그 가드가 없어, `dist/mock/index.js`와 `dist/panel/index.js`에 따로 복제됐다.

그 결과 `aitState.reset()`은 싱글턴을 먼저 생성한 번들의 Map을 비우고, `throttleErrorFor`가 읽는 Map에는 낡은 타임스탬프가 남아 리셋 직후 첫 호출이 이유 없이 `APP_BRIDGE_THROTTLED`로 거부될 수 있었다. 복제를 재현하는 회귀 테스트를 함께 넣었다(수정 전에는 실패한다).

부수로 `throttleErrorFor`가 `dial?.methods?.includes(...)`로 두 번째 홉까지 방어한다 — `__ait.patch`는 콘솔에서 손으로 치는 무타입 표면이라 `methods` 누락이 TypeError가 아니라 no-op이어야 한다.
