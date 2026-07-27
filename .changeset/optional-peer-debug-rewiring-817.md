---
'@ait-co/devtools': patch
---

unplugin이 분리된 디버깅 패키지를 optional peer로 소비 (#817)

`@ait-co/debugger`·`@ait-co/debug-console`을 optional peer로 선언하고, unplugin의
디버그 경로를 두 패키지로 재배선했다. 순수 additive 변경이라 devtools 자체의
`in-app`·`mcp`·`test-runner` 표면은 그대로 남는다.

- env-2 CDP QR 대시보드(`startTunnelDashboard`)를 `@ait-co/debugger/dev-bridge`에
  위임. 미설치면 대시보드 없이 터미널 ASCII QR로 degrade하고, `tunnel: { cdp: true }`
  경로는 CDP 배선을 건너뛴 뒤 설치 안내를 한 번 출력한다.
- in-app attach 자동 주입 대상을 `@ait-co/debug-console`로 교체. 패키지가 없으면
  주입 자체를 하지 않으므로 attach 코드가 번들에 구조적으로 들어갈 수 없다. dedupe는
  분리 전 `@ait-co/devtools/in-app` 배선도 계속 인정한다.
- 환경 1(브라우저 mock + 패널)만 쓰는 소비자는 아무것도 추가로 설치하지 않아도 되고,
  기본 경로에서 어떤 안내도 출력되지 않는다.
