---
'@ait-co/devtools': minor
---

디버그 표면을 이 패키지에서 제거한다 (#818). `@ait-co/devtools`에 남는 것은 **mock SDK · DevTools 패널 · unplugin** 셋뿐이고, 그게 이 패키지의 정의가 된다.

`0.1.x` patch 단계의 유일한 minor 예외다. 공개 export 5개와 bin 2개가 다른 패키지로 빠져나가므로 patch로 내보내면 소비자가 `pnpm up` 한 번에 깨진다.

**이동한 곳:**

| 이전 | 이후 |
|---|---|
| `@ait-co/devtools/mcp/server`·`/mcp/cli` | `@ait-co/debugger/mcp/server`·`/mcp/cli` |
| `@ait-co/devtools/test-runner` | `@ait-co/debugger/test-runner` |
| bin `devtools-mcp` | `@ait-co/debugger` bin `debugger` |
| bin `devtools-test` | `@ait-co/debugger` bin `debugger-test` |
| `@ait-co/devtools/in-app`·`/in-app/auto` | `@ait-co/debug-console`·`/auto` |

**전환 스텁 — 0.2.x에만 있고 1.0.0에서 제거된다.** 위 subpath와 bin은 자리를 지키며 어디로 갔는지 한 문장을 알려준다. 두 가지 모양이고, 그 차이는 스타일이 아니라 안전 속성이다: `/mcp/*`·`/test-runner`는 터미널에서만 평가되므로 import 시 **throw**해 즉시 실패하고, `/in-app`·`/in-app/auto`는 **절대 throw하지 않는다** — 그 코드는 이미 출시된 미니앱 번들 안에 있을 수 있어서, 거기서의 throw는 개발도구 사정으로 실사용자의 앱을 죽인다. 대신 모든 export가 무해한 no-op이고 `console.error` 한 줄만 남긴다. `/in-app/auto`는 기존 `?debug=1`+`?relay=` self-gate를 유지해 일반 프로덕션 로드에서는 아무 소리도 내지 않는다. 구 bin 둘은 stderr에 안내를 찍고 exit 1 한다(stdout이 아닌 이유: MCP 호스트가 stdout을 JSON-RPC 스트림으로 읽고 있을 수 있다).

bin을 같은 이름으로 옮기지 않고 개명한 것이 스텁을 남길 수 있게 한 전제다 — 이름이 같았다면 두 패키지를 함께 설치했을 때 같은 `node_modules/.bin` 심볼릭 링크를 두고 다퉜고 어느 쪽이 이기는지가 임의였을 것이다.

**소비자가 할 일:** 환경 1(브라우저 + mock + 패널)만 쓴다면 없다. on-device CDP 디버깅을 쓴다면 `pnpm add -D @ait-co/debugger @ait-co/debug-console` 후 미니앱 entry의 한 줄을 `import '@ait-co/debug-console/auto';`로 바꾼다. 둘 다 devtools의 **optional peer**라 설치하지 않으면 게이트가 닫히며 degrade한다 — `tunnel: { cdp: true }`는 화면 미리보기 터널로 내려앉고, in-app attach는 아예 주입되지 않는다. 후자가 디버그 표면의 기술적 경계다: `@ait-co/debug-console`이 없으면 attach 코드는 번들에 구조적으로 들어갈 수 없다.

**runtime dependency가 7개에서 3개로 줄었다** — `unplugin`·`cloudflared`·`qrcode-terminal`만 남고 `chii`·`ws`·`qrcode`·`ajv`·`@modelcontextprotocol/sdk`·`eruda`는 디버그 표면과 함께 떠났다.

**새 CI 가드 `check:footprint-absent`.** 이 패키지는 devDependency이고 프로덕션 번들 기여가 0 bytes여야 한다. 실제 소비자 fixture를 release로 빌드해 mock/panel sentinel이 0건임을 확인하고, `AIT_FOOTPRINT_FORCE=1` 빌드에는 그 sentinel이 **존재**함을 positive control로 확인한다(이게 없으면 fixture가 조용히 아무것도 import하지 않게 되어도 검사가 영원히 통과한다). 분리 전 가드 4종(`check:mcp-react-free`·`check:test-runner-dist`·`check:debug-surface-absent`·`check:dashboard-html-fresh`)은 각자 지키던 표면과 함께 제거됐고 이 하나가 대체한다.
