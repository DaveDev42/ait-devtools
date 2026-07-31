---
'@ait-co/devtools': patch
---

THROTTLED 시뮬레이션 다이얼을 추가한다 (#834).

실기기 네이티브 브리지는 같은 메서드를 짧은 간격으로 연타하면 `APP_BRIDGE_THROTTLED`로 거부하는데, 그 코드는 `NativeErrorCode` 유니온과 `CODE_META`에 인벤토리로만 등재돼 있었고 이 코드로 reject하는 mock은 한 곳도 없었다. `failureModes.throttled = { methods, intervalMs }`로 그 rate limit을 env1에서 opt-in 재현한다 — 다이얼 미설정이 기본이라 기존 동작은 그대로다.

거부된 호출은 창을 갱신하지 않으므로 연타 중에도 최초 허용 시점 기준으로 풀린다. 훅은 `observe()`가 아니라 각 mock 본문 안에 넣었다 — `observe()`는 원 함수 호출 *전에* 감싸므로 거기서 던지면 Promise를 반환해야 할 API가 동기 throw로 바뀌고, `threwSync`는 env1↔env3 동치 diff의 관측 축이라 그 차이가 곧 가짜 불일치가 된다.
