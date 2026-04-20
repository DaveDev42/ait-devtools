---
'@ait-co/devtools': patch
---

fix(panel): extend fullscreen breakpoint to 720px so panel doesn't overlap mobile containers

QA로 sdk-example을 브라우저에서 테스트하던 중, viewport 576px에서 DevTools 패널이 mobile-container(`max-w-[430px]` 중앙 정렬) 카드의 오른쪽 절반을 완전히 덮어 실행 버튼을 클릭할 수 없는 UX 이슈가 확인되었다.

기존에는 `(max-width: 480px)`에서만 패널이 fullscreen이 되어 481~720px 구간에서 360px 폭 floating 패널이 중앙 정렬된 mobile container와 겹쳤다. breakpoint를 720px로 확장해 이 구간에서도 fullscreen으로 동작하도록 한다. 진짜 tablet 이상(768+)에선 floating 모드 유지.

CSS 미디어쿼리와 `updatePanelPosition`의 JS 분기가 반드시 동일한 값을 써야 해서 `PANEL_FULLSCREEN_BREAKPOINT` 상수를 도입했다.
