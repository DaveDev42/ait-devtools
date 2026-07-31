---
'@ait-co/devtools': patch
---

영어 README에 빠져 있던 `toss-gated 동작을 dev에서 시험하기` 섹션을 채운다 (#826).

`README.md`(ko)와 `README.en.md`(en)는 동등 정본인데 이 섹션만 en에 없어서, 영어 독자는 `getOperationalEnvironment() === 'toss'`로 게이트된 코드 경로를 토스 앱 없이 검증하는 방법을 안내받지 못했다. Environment 탭의 Navigation 섹션이 `setIosSwipeGestureEnabled` 같은 no-op API의 마지막 호출값을 비춘다는 사실 자체가 en에서는 12-탭 표에서도 빠져 있었다 — 표 행도 함께 맞췄다.

두 README 모두 npm 타르볼에 실리므로 패키지 페이지에 반영된다. 코드 변경은 없다.
