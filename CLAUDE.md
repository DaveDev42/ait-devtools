# CLAUDE.md

## 3-패키지 경계 (분리 완료)

이 repo는 **3 패키지 / 2 repo 분리**의 devtools 쪽 절반이다. 코드 표면 이동은 끝났다(#818): `src/mcp` + `src/test-runner` → `@ait-co/debugger`, `src/in-app` → `@ait-co/debug-console`. 이 패키지에 남은 것은 **mock · panel · unplugin** 셋뿐이고, 그게 이 패키지의 정의다.

| 패키지 | 정체성 | 소비자 설치 위치 |
|---|---|---|
| `@ait-co/devtools` | mock SDK + DevTools 패널 + unplugin | `devDependencies` |
| `@ait-co/debugger` | MCP 디버그 데몬(bin `debugger`) + 실기기 테스트 러너(bin `debugger-test`) + env-2 dev-bridge | `devDependencies` / `npx` 전용 |
| `@ait-co/debug-console` | on-device attach + 인앱 eruda 콘솔 | **`dependencies`** — 앱 번들에 들어갈 수 있는 유일한 패키지 |

뒤의 둘은 devtools의 **optional peer**다(#817, `src/unplugin/optional-peers.ts`). 미설치면 게이트가 닫히며 degrade한다 — `tunnel.cdp`는 CDP 배선을 건너뛰고 화면 미리보기 터널로, in-app attach는 아예 주입되지 않는다. 후자가 디버그 표면의 기술적 경계다: `@ait-co/debug-console`이 없으면 attach 코드는 번들에 **구조적으로** 들어갈 수 없다.

**전환 스텁 (0.2.x 한정, 1.0.0에서 제거)**: 이동한 subpath·bin은 `src/stubs/`가 자리를 지킨다. `/mcp/*`·`/test-runner`는 import 시 **throw**(터미널 전용 진입점이라 즉시 실패가 옳다), `/in-app`·`/in-app/auto`는 **절대 throw하지 않는다** — 그 코드는 이미 출시된 앱 번들 안에 있을 수 있고, 거기서의 throw는 개발도구 사정으로 실사용자의 미니앱을 죽인다. 대신 no-op + `console.error` 1회다. 이 비대칭은 스타일이 아니라 안전 속성이므로 스텁을 고칠 때 유지한다.

내부 문서(`docs/**`)의 분리 전 서술 정리와 이슈 #813(pinned) 마무리는 후속 #819가 맡는다.

## 이 파일의 독자

이 파일(`CLAUDE.md`)은 **메인테이너/contributor 전용**이다 — 코드 구조, 컨벤션, 테스트 경계, SDK 대응 절차를 다룬다.

사용자(미니앱 개발자) 진입점은 **`README.md`(한국어) / `README.en.md`(영어)** 다. README는 "15초 quickstart 3 시나리오 카드 + 자주 겪는 문제 5가지"로 시작해 환경 1·2·3을 한 페이지에서 안내한다. README와 CLAUDE.md는 독자가 다르므로 내용을 중복하지 않는다 — README는 사용자 관점의 진입 경로, CLAUDE.md는 메인테이너 관점의 구현·규약.

## 프로젝트 성격

`apps-in-toss-community`는 토스/앱인토스 팀과 제휴 관계가 없는 커뮤니티 오픈소스 프로젝트다.

사용자에게 보여지는 모든 산출물(README, UI 카피, 패키지 설명, 커밋/PR 메시지, 코드 주석 등)에서 다음 표현 **금지**:

- "공식(official)", "공식 플러그인/도구", "토스가 제공하는", "앱인토스에서 만든", "powered by Toss"
- 토스와의 제휴/후원/인증을 암시하는 모든 표현

대신 "커뮤니티(community)" 같은 자연스러운 표현. 의심스러우면 빼라.

**톤 가이드** (방어적 disclaimer 금지): README 푸터에 한 줄로 1회만 명시 — ko `README.md`는 `커뮤니티 오픈소스 프로젝트입니다.`, en `README.en.md`는 `Community open-source project.`. "제휴 아님" 같은 방어적 표현 대신 "커뮤니티 오픈소스" 정체성만 자연스럽게. 헤더 직후의 `>` blockquote 박스, ⚠️ 아이콘, 굵은 글씨, `unofficial`/`비공식` 같은 강한 라벨은 쓰지 않는다. 한 파일 안에서 영/한 병기 금지(다중 언어는 ko/en 별도 파일로 분리). 기술적 caveat은 disclaimer에 묶지 않고 자연스러운 본문 섹션에 둔다.

**README i18n**: `README.md`(한국어, GitHub default) + `README.en.md`(영어). 둘 다 상단 상호 link(`[한국어](./README.md)` / `[English](./README.en.md)`), 동등 정본 — 한 쪽 갱신 시 같은 PR에서 반대쪽도 갱신. 자세한 정책은 umbrella `CLAUDE.md` "i18n 정책" 섹션.

이슈/제안은 GitHub Issues로.

## 짝 repo

- **`polyfill`** — devtools가 SDK mock이라면 polyfill은 표준 Web API shim. devtools unplugin이 polyfill 주입 옵션 지원은 추후 고려.
- **`sdk-example`** (downstream consumer) — reference consumer이자 dog-fooding 타겟. E2E는 이 repo 내부 fixture(`e2e/fixture/`)로 운영하므로 sdk-example을 직접 clone하지 않는다.

## 프로젝트 개요

**@ait-co/devtools** — `@apps-in-toss/web-framework` SDK의 mock 라이브러리. 앱인토스 미니앱을 토스 앱 없이 일반 크롬 브라우저에서 개발/테스트.

**Out of scope:** React Native. 이 프로젝트는 WebView 미니앱 전용.

## 기술 스택

공통: **Node 24 LTS**, **pnpm 11.17.0** (`packageManager` 고정), **TypeScript strict**, **Biome** (lint + formatter, ESLint/Prettier 사용 안 함). Commit message는 **Conventional Commits** (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`).

Pre-commit hook은 source-controlled (`.githooks/pre-commit`), contributor가 수동 활성화:

```bash
git config core.hooksPath .githooks
```

이 repo 고유:

- **tsdown** — 빌드 (ESM + CJS for unplugin)
- **vitest** — 테스트 (jsdom 환경, 아래 "jsdom 제약" 섹션 주의)
- **unplugin** — 모든 번들러 지원. runtime dependency는 `unplugin`·`cloudflared`·`qrcode-terminal` 셋뿐이다(뒤의 둘은 env-2 터널 경로가 동적 import로만 로드). 분리 전의 `chii`·`ws`·`qrcode`·`ajv`·`@modelcontextprotocol/sdk`는 디버그 표면과 함께 `@ait-co/debugger`로 갔다 — 여기로 되돌아오면 안 된다
- ESM only (`"type": "module"`)

## 배포

이 repo는 **npm 패키지** 배포 타입 — Changesets 풀스택 (`@ait-co/devtools` 자동 publish).

버전은 `0.1.x` patch 단계였고, **`0.2.0`이 그 단계의 유일한 minor 예외다**(#818, Dave 명시 결정). 공개 export 5개와 bin 2개가 `@ait-co/debugger`·`@ait-co/debug-console`로 빠져나가는 릴리즈라 patch로 내보내면 소비자가 `pnpm up` 한 번에 깨진다. 예외는 이 한 번뿐이고, 이후 minor는 다시 없다 — 다음 minor 이벤트는 곧바로 `1.0.0`이며 그때 `src/stubs/`의 전환 스텁이 함께 사라진다. Claude는 여전히 changeset에서 **patch만 자율 생성**한다(minor/major는 Dave 명시 지시 시만).

같은 코드에서 두 개의 dist-tag를 동시에 운영한다 (`.github/workflows/release.yml`):

- **stable = `latest`** — peer `>=2.6.0 <3.0.0` (web-framework 2.x), 기존 Changesets Version-PR 흐름, `0.1.x` patch. `release` job이 담당하며 무변경.
- **beta = `beta`** — peer `>=3.0.0-beta <4.0.0` (3.0 라인), Changesets **스냅샷**. main push마다 `release-beta` job이 pending changeset이 있을 때만 `0.0.0-beta-<datetime>-<sha>` 버전으로 자동 publish한다. peer range만 job-local로 3.0으로 덮어쓰고 같은 커밋을 publish한다 — `latest`는 2.x로 유지된다(GA flip 아님, #370).

`release-beta`가 ship-safe한 핵심 불변식: ① 버전 base가 `0.0.0`이라 어떤 stable range도 만족하지 않음(`latest`로 새어나갈 수 없음), ② `--tag beta` 명시 + on-disk artifact를 publish 직전 assert(version/peer/optional), ③ pending changeset 없으면 clean no-op, ④ 같은 커밋 재실행은 SHA-동일 버전 → skip-if-exists로 idempotent. peer rewrite는 job-local ephemeral checkout에서만 일어나므로 3.0 peer가 `latest` artifact에 닿지 않는다. 스냅샷 템플릿(`{tag}-{datetime}-{commit}`)은 `.changeset/config.json`의 `snapshot.prereleaseTemplate`이 정본. AUTH는 npm OIDC trusted publishing (NPM_TOKEN 없음, #29에서 제거) — beta job이 release.yml 안에 있어야 trusted-publisher grant(workflow 파일명 바인딩)가 적용된다.

## 명령어

전체 스크립트는 `package.json`. 자주 쓰는 것:

```bash
pnpm dev            # watch 빌드
pnpm build          # tsdown으로 dist/ 빌드
pnpm typecheck      # tsc --noEmit (원본 SDK 시그니처 호환성 검증 포함)
pnpm test           # vitest
pnpm test:e2e       # Playwright E2E (자동 빌드 + preview)
pnpm check:footprint-absent  # 프로덕션 번들 기여 0 bytes 가드 (build 후 실행, positive control 포함)
pnpm check-sdk-update  # 새 SDK 버전 감지 (수동 트리거, 매주 월요일 CI도 동일)
```

## 프로젝트 구조

```
src/
├── mock/              # @apps-in-toss/web-framework export를 mock으로 대체
│   ├── state.ts       # AitStateManager, window.__ait
│   ├── proxy.ts       # 미구현 API용 Proxy (접근 시 throw)
│   ├── permissions.ts # withPermission, checkPermission
│   ├── types.ts       # PermissionName, DeviceMode 등
│   ├── auth/ navigation/ device/ iap/ ads/ game/ analytics/ partner/
│   └── index.ts       # 통합 re-export (번들러 alias 대상)
├── panel/             # Floating DevTools Panel (React chrome + 명령형 탭 렌더러)
│   ├── index.tsx Panel.tsx tab-host.tsx tab-error-boundary.tsx use-draggable.ts
│   ├── helpers.ts styles.ts viewport.ts device-emulation.ts
│   └── tabs/          # environment, presets, viewport, permissions, notifications, location, device, iap, ads, events, analytics, storage (명령형 renderXTab(): HTMLElement)
├── unplugin/          # Vite/Webpack/Rspack/esbuild/Rollup
├── __tests__/         # vitest
└── __typecheck.ts     # 원본 SDK 대비 타입 호환성 (빌드 미포함)
```

`device/`는 도메인별로 분리(`storage.ts`, `location.ts`, `camera.ts`, `clipboard.ts`, `contacts.ts`, `haptic.ts`, `network.ts`, `_helpers.ts`)되어 mock/web/prompt 모드를 지원한다.

## 코딩 컨벤션

- **사용자 대면 표면은 React + ko/en i18n**: panel·qr-http-server 대시보드·e2e fixture·launcher PWA는 모두 React로 렌더하고 `navigator.language`/`Accept-Language` 기반 ko/en i18n을 지원한다. i18n core는 `src/i18n`(ko.ts가 `StringKey` 정본, en.ts는 typecheck-강제 `Record<StringKey,string>` 미러), React 반응 레이어는 `src/i18n/react.ts`(`useLocale`/`useT`, `LOCALE_CHANGE_EVENT` 위 `useSyncExternalStore`). panel은 chrome(toggle/header/badge/tab bar/body)만 React이고 12개 탭 body는 `renderXTab(): HTMLElement` 명령형 렌더러를 `<TabHost>`로 마운트하는 hybrid다(position은 React state가 아니라 ref+localStorage `__ait_btn_pos`).
- **footprint 불변식 — 프로덕션 번들 기여는 0 bytes**: 이 패키지는 devDependency이고, 소비자의 production 빌드에 mock·panel 그래프가 한 조각도 남으면 안 된다. unplugin은 빌드 host 쪽에서만 돌고(alias·주입·터널 배선), panel은 `import.meta.env.DEV` 뒤에서 소비되므로 production 빌드가 그래프 전체를 DCE한다. `scripts/check-devtools-footprint-absent.sh`(ci.yml 배선, `pnpm check:footprint-absent`)가 이걸 기계적으로 증명한다 — ① `dist/`에 이동한 구현이 되돌아오지 않았는지, ② `scripts/footprint-fixture/`를 release로 빌드해 mock/panel sentinel 0건인지, ③ **positive control**로 `AIT_FOOTPRINT_FORCE=1` 빌드엔 sentinel이 존재하는지. ③이 없으면 fixture가 조용히 아무것도 import하지 않게 되어도 ②가 영원히 green이라 무의미해진다. release 빌드는 **반드시 minify ON** — minify를 끄면 죽은 `if(false){…}` 껍데기가 텍스트로 남아 식별자가 false-positive를 낸다. 분리 전 4개 가드(`check:mcp-react-free`·`check:test-runner-dist`·`check:debug-surface-absent`·`check:dashboard-html-fresh`)는 각자 지키던 표면과 함께 제거됐고 이 가드 하나가 대체한다.
- **모든 mock은 원본 SDK 시그니처와 호환**: `src/__typecheck.ts`의 `Assert<Mock, Original>`로 검증.
- **권한 함수**: `withPermission(fn, permissionName)`으로 감싸 `.getPermission()`, `.openPermissionDialog()` 부착.
- **이벤트**: `window.dispatchEvent(new CustomEvent('__ait:eventName'))`. `aitState.trigger('backEvent')` 사용.
- **Storage mock**: localStorage `__ait_storage:` prefix로 앱 자체 storage와 분리.

## 새 API mock 추가 절차

1. 카테고리 디렉토리에 함수 구현 (예: `src/mock/device/`)
2. `src/mock/index.ts`에 export
3. **두 typecheck 파일 모두 갱신**: `src/__typecheck.ts`(3.0-beta 라인)와 `src/__typecheck-2x.ts`(2.x stable 라인 — `web-framework-2x` alias)에 각각 `type _NewApi = Assert<typeof Mock.newApi, typeof Original.newApi>;`. 두 라인에 존재 유무가 갈리는 심볼만 `AssertIfPresent`로 capability-gate한다 (현재 skip 대상은 base `PermissionError` 1개뿐).
4. `pnpm typecheck` (두 라인 tsc 모두 통과해야 한다)
5. 테스트 작성

## SDK 업데이트 대응

devtools는 `@apps-in-toss/web-framework` **3.0.0-beta** 프리릴리즈를 추적. devDep은 `3.0.0-beta.3051978` exact pin. published `latest` 태그의 peer range는 `>=2.6.0 <3.0.0` (2.x 소비자 보호용 유지)이고, 3.0 라인 peer는 **`beta` dist-tag로 별도 자동 publish**한다 — `release-beta` job이 main push마다 같은 커밋을 job-local 3.0 peer로 덮어써 `0.0.0-beta-<datetime>-<sha>` 스냅샷으로 올린다(메커니즘 정본은 위 §배포). 3.0-beta를 쓰는 소비자는 `@ait-co/devtools@beta`로 설치한다. (후속 PR에서 CI matrix `compat-check`로 버전 typecheck 자동화 예정.)

**GA Flip 상태:** beta 채택 wave는 머지 완료, GA flip(exact pin→`^3.0.0`, `latest` peer를 3.0 라인으로, dist-tag flip)은 **미착수** — GA ETA 미정으로 대기. 트래킹 #370. GA용으로 비워뒀던 `0.1.54` 슬롯은 무관한 maintenance Version PR이 선점했고 이후 추가 maintenance로 `latest`가 더 올라갔다(현 `latest`는 `npm view @ait-co/devtools dist-tags.latest`로 확인, peer `>=2.6.0 <3.0.0`) → flip은 그 시점 `latest` 다음 patch를 쓴다. `beta` dist-tag 자동 publish는 GA flip의 부분 선행이다(3.0 peer artifact를 미리 검증된 상태로 올려둠) — GA flip 시 그 검증된 peer를 `latest`로 승격하고 `release-beta` job은 정리 대상이 된다.

- peer는 `peerDependenciesMeta.optional: true`. devDep은 고정.
  - **이유**: 소비자는 본인 프로젝트에서 SDK를 직접 import하므로 누락은 빌드 단계에서 명시적으로 깨진다(vite/webpack resolve fail) — npm missing peer warning에 의존할 필요가 없다. 반대로 required로 두면 SDK + 그 RN/Babel/Metro 트랜지티브 거대 트리(~분 단위 install)가 강제로 딸려 온다. optional로 둬도 신뢰성은 손상되지 않고 설치만 가벼워진다. (분리 전에는 "MCP-only 소비자는 mock SDK를 아예 import하지 않는다"가 더 강한 근거였는데, 그 소비자군은 `@ait-co/debugger`로 옮겨 갔다 — 근거 하나가 빠졌을 뿐 결론은 그대로다.)
- `src/__typecheck.ts`가 컴파일 타임에 시그니처 불일치 감지.
- `src/mock/proxy.ts`의 `createMockProxy`는 미구현 API 접근 시 **throw** — "잘 되는 척" 방지.
- `.github/workflows/check-sdk-update.yml`이 매주 월요일 새 버전 감지 → 이슈 생성.

**지원 범위 확장:** `pnpm add -D @apps-in-toss/web-framework@<version>` → `pnpm typecheck`로 시그니처 변경 확인 → `package.json` devDep pin 갱신 → 단일 PR로 일관된 상태 유지. (3.0 GA 시 peer range도 `>=3.0.0 <4.0.0`으로 교체.)

**web-framework-2x alias pin 정책:** `@apps-in-toss/web-framework-2x` devDep은 최신 2.x 중 `tsc -p tsconfig.2x.json`이 clean한 버전으로 exact pin한다. 현재 `npm:@apps-in-toss/web-framework@2.10.7`(2.10.x 최신). 2.10.1은 upstream type regression(`@apps-in-toss/web-bridge@2.10.1`이 `@apps-in-toss/native-modules`의 미빌드 raw `.ts` subpath를 import → `tsc`가 RN 0.72.6에 없는 `CodegenTypes` export로 실패)이 있었으나 **2.10.2에서 이미 해소**됐다(2.10.2~2.10.7 재검증 clean). 새 2.x minors/patches를 올릴 때는 반드시 `tsc -p tsconfig.2x.json`을 실행하고 clean을 확인한 후 pin을 갱신한다 — exact pin이라 자동 drift는 없고, 매번 PR로 재검증한다.

**SDK breaking change 대응:** 한 devtools 패키지가 호환되지 않는 SDK를 동시 지원하지 않는다 — devtools도 함께 bump한다.

1. 새 SDK 대응은 `main`에서 진행. peer range를 새 SDK 라인 한 줄로 교체, 이전 라인은 제거.
2. 직전 라인은 `release/<prev>.x` maintenance 브랜치로 분기. patch만 cherry-pick으로 백포팅.
3. `__typecheck.ts`의 `import * as Original`을 새 SDK로 바꾸고 깨진 시그니처를 mock에 맞춰 수정. `unplugin/index.ts`의 패키지명 상수(`FRAMEWORK_ID` 등)도 SDK가 rename된 경우 함께 갱신.
4. devtools 자체도 호환성 끊김에 맞춰 bump (Changesets). 사용자는 SDK 업그레이드와 함께 devtools도 같은 라인으로 올린다.

같은 devtools 안에서 SDK 라인별 런타임 분기는 하지 않는다 (mock 본체가 두 벌이 되어 비용이 큼). 동시 지원 윈도우가 정말 필요해지면 그때 별도 결정.

## MCP tool surface — 이 repo 밖이다

debug MCP 서버·tier 매트릭스·환경 파생(`connection.kind`) 설계는 전부 `@ait-co/debugger`로 갔다(#818). 이 repo에서 그 표면을 고치지 않는다 — MCP 도구를 추가·개명·재분류하려면 `debugger` repo에서 한다. 여기 남은 접점은 하나뿐이다: unplugin의 `tunnel.cdp` 경로가 optional peer `@ait-co/debugger/dev-bridge`에 위임한다(아래 환경 2 섹션).

## 패키지 export 구조

이 패키지가 실제로 출하하는 진입점은 넷이다:

| Import path | 용도 |
|---|---|
| `@ait-co/devtools` (= `/mock`) | 번들러 alias 대상, 모든 mock export |
| `@ait-co/devtools/panel` | Floating DevTools Panel (import 시 자동 마운트) |
| `@ait-co/devtools/unplugin` | 번들러 플러그인 (.vite/.webpack/.rspack/.esbuild/.rollup) |

나머지 subpath는 **전환 스텁**이다 — 0.2.x에만 존재하고 1.0.0에서 제거된다. 소스는 `src/stubs/`, dist 매핑은 `tsdown.config.ts`의 transition-stubs 블록이 정본(스텁 소스는 구 dist 경로로 emit되므로 `exports` 항목을 바꾸지 않고 소스만 지웠다).

| Import path | 이동처 | import 시 |
|---|---|---|
| `/mcp/server`, `/mcp/cli` | `@ait-co/debugger/mcp/*` | **throw** |
| `/test-runner` | `@ait-co/debugger/test-runner` | **throw** |
| `/in-app`, `/in-app/auto` | `@ait-co/debug-console`(+`/auto`) | no-op + `console.error` 1회 |

bin도 같다: `devtools-mcp`·`devtools-test`는 stderr에 이동 안내를 찍고 exit 1 한다(각각 `@ait-co/debugger`의 `debugger`·`debugger-test`로). bin 이름을 바꿔 옮긴 게 스텁을 남길 수 있게 한 전제다 — 이름이 같았다면 두 패키지가 같은 `node_modules/.bin` 심볼릭 링크를 두고 다퉜을 것이다.

throw/no-op 비대칭은 안전 속성이다(§3-패키지 경계). 스텁을 손볼 때 뒤집지 말 것.

## 실기기 미리보기 — 환경 2 (AITC Sandbox App (PWA), tunnel + launcher)

이 섹션은 3겹 fidelity 사다리의 **환경 2 = AITC Sandbox App**을 다룬다. 환경 1(로컬 브라우저 + mock SDK)이 구조적으로 메울 수 없는 실기기 WebKit 엔진·실 터치/뷰포트를 토스 검수·WebView 없이 확인하는 겹이다 — `devtools.aitc.dev/launcher/`에 배포된 installable PWA(`e2e/fixture/launcher/`)가 그 진입점이고, agent-plugin의 `/ait:setup-phone-preview`가 이 환경을 배선하는 station 보조 skill이다. 설계 정본은 umbrella `meta/three-environments-fidelity.md` §1.1·§1.2(환경 2 매트릭스).

unplugin `tunnel` 옵션(Vite dev 전용, `src/unplugin/index.ts`의 `vite.configureServer` 분기 + `src/unplugin/tunnel.ts`)이 dev 서버가 listen하면 `cloudflared` quick tunnel(`*.trycloudflare.com`, 계정 불필요)을 띄우고 터미널에 URL + ASCII QR을 출력한다. production은 `forceEnable`이어도 터널을 안 띄운다 (의도치 않은 노출 방지). `cloudflared`/`qrcode-terminal`는 **동적 import**로만 로드 → 터널 미사용 시 그래프에 안 들어옴. 이 둘은 `dependencies`에 들어가는데, "외부 의존성 최소화" 원칙의 의도적 예외다 (런타임 코드 경로에서 필요, 동적 import로 비용 격리). `tunnel.ts`의 `parseTrycloudflareUrl`/`printTunnelBanner`는 순수 함수로 빼서 vitest로 검증하고, cloudflared spawn 자체는 jsdom 범위 밖이라 e2e/수동 검증 ("web 모드는 e2e"와 같은 정신).

`tunnel: { cdp: true }`(opt-in, default false)를 주면 위 HTTP 터널과 **별도로** relay + 두 번째 quick tunnel + QR 대시보드를 띄워 환경 2 PWA에 CDP 디버깅을 배선한다 — launcher QR deep-link가 `&debug=1&relay=<wss>`를 추가로 실어, 폰 PWA iframe이 debug gate를 통과하고 target.js가 주입된다. **그 relay 부트스트랩 전체가 optional peer `@ait-co/debugger/dev-bridge`의 `startDevServerCdpRelay`에 위임된다**(#817·#818) — 이 repo에는 relay·gate·대시보드 구현이 없다. 미설치면 CDP 배선을 건너뛰고 화면 미리보기 터널로 degrade하며 설치 힌트를 한 번 출력한다(`optional-peers.ts`의 `hasDebugger()` 게이트). `call_sdk`는 환경 2에서 여전히 mock을 친다 — CDP가 메우는 건 실기기 WebKit의 DOM·콘솔·예외 관측이고, SDK fidelity가 필요하면 환경 3로 올라간다(devtools #377).

SECRET-HANDLING(위임 후에도 이 repo가 지킨다): tunnel host·relay wss·TOTP 시크릿/코드는 stdout·stderr·로그에 절대 싣지 않는다. `tunnel.ts`가 여는 브라우저 URL은 로컬 대시보드 주소(`http://127.0.0.1:<port>`)뿐이다.

폰 쪽은 고정 URL(`https://devtools.aitc.dev/launcher/`)에 배포된 launcher PWA(`e2e/fixture/launcher/`)를 한 번 홈 화면에 추가하고, 그 안의 풀뷰포트 `<iframe>`으로 그날의 tunnel URL을 띄운다 (quick tunnel URL은 매 실행마다 바뀌어서 URL 자체를 PWA로 설치하면 죽은 링크가 되고, cross-origin 전환은 standalone이 깨짐 → launcher가 same-origin 크롬리스 셸 역할). launcher는 카메라 QR 스캔(`qr-scanner`, **devDependency** — launcher SPA에서만 쓰이고 npm 패키지엔 안 실림) + URL 붙여넣기 fallback + "Rescan" 버튼. 신규 오픈(쿼리 없음)은 항상 스캔 화면 — localStorage 마지막 URL 자동 로드는 #459에서 제거됐다(quick-tunnel host는 세션마다 바뀌고 TOTP `at=` 코드는 30초로 만료 → 저장된 debug deep-link는 항상 stale). live 진입 경로는 `?url=` QR deep-link 단일 경로만. PWA 정적 파일(`manifest.webmanifest`/`sw.js`/아이콘)은 `e2e/fixture/public/launcher/`에 두면 vite가 `dist/launcher/`로 복사. `e2e/fixture/vite.config.ts`는 이 launcher 페이지 때문에 MPA(`rollupOptions.input`에 `index.html` + `launcher/index.html`)이고, 같은 config의 unplugin 호출에 `tunnel: process.env.AIT_TUNNEL_CDP ? { cdp: true } : !!process.env.AIT_TUNNEL`이 있어 `AIT_TUNNEL=1 pnpm exec vite --config e2e/fixture/vite.config.ts`(스크린 미리보기) 또는 `AIT_TUNNEL_CDP=1 pnpm exec vite --config e2e/fixture/vite.config.ts`(CDP relay 포함)로 수동 QA 가능. (named tunnel로 고정 hostname 받는 방식은 추후 `tunnel: { hostname }` 옵션으로 확장 여지.)

**환경 2 MCP-attach 절반**(issue #378)의 서버 쪽 — `start_attach`이 launcher QR deep-link를 합성하는 경로 — 도 `@ait-co/debugger`로 갔다. 소비자 쪽 배선만 여기 남는다: 미니앱 entry가 `@ait-co/debug-console/auto`를 import하거나(수동), unplugin이 `hasDebugConsole()` 게이트를 통과할 때 같은 동작의 스니펫을 주입한다(`optional-peers.ts`의 `buildInAppSnippet`). 이미 손으로 배선한 소비자에게 중복 주입하지 않도록 `hasInAppWiring`이 현행·분리 전 두 specifier를 모두 인식한다.

pnpm 10+ 소비자에 대한 안내는 README에 있다: 프로젝트 `package.json`에 `"pnpm": { "onlyBuiltDependencies": ["cloudflared"] }`. pnpm이 기본으로 third-party build script를 차단해 `cloudflared` postinstall(바이너리 ~38 MB 다운로드)이 스킵되면 `pnpm install` 시 'Ignored build scripts' 경고가 남고 바이너리 캐싱이 첫 dev 기동까지 미뤄진다 — 동작은 됨 (`tunnel.ts`가 `cloudflared.install()`을 lazy로 호출). 참조: [sdk-example#60](https://github.com/apps-in-toss-community/sdk-example/pull/60).

## E2E 테스트 플로우

이 repo 내부 자기완결 fixture(`e2e/fixture/`)를 쓴다. 외부 repo 의존 없음. 로컬은 `pnpm test:e2e` 한 줄. `playwright.config.ts`의 `webServer`가 `pnpm build` → fixture vite build → vite preview(:4173)를 자동 수행한다. CI는 `.github/workflows/ci.yml`의 `e2e` job이 동일 절차 실행, Playwright 브라우저는 `@playwright/test` 버전 키로 캐싱. 머지 게이트로 묶으려면 branch protection에서 `e2e` 체크 required로 추가 (job 이름 안정 유지).

같은 fixture는 GitHub Pages로도 배포된다 (<https://devtools.aitc.dev/>). main에 `e2e/fixture/**`·`src/**`·`package.json` 변경이 들어오면 `.github/workflows/deploy-fixture.yml`이 `pnpm e2e:build`로 정적 산출물을 만들어 Pages에 publish한다. CNAME은 `e2e/fixture/public/CNAME`에 source-control되며 vite가 `dist/` 루트에 그대로 복사한다.

**Vite 8 (rolldown) 우회책:**
- `@apps-in-toss/web-framework` → mock 매핑은 unplugin `resolveId` 대신 `vite.config.ts`의 `resolve.alias`로 `dist/mock/index.js` 직접 지정 (rolldown bare string resolveId 버그 우회).
- 패널 주입은 unplugin `transform`이 rolldown 프로덕션 빌드에서 신뢰성 없음 → `main.tsx`에 `import '@ait-co/devtools/panel'` 명시.

**testid 규약** (`e2e/fixture/components.tsx`): `section-<id>` 루트, `<id>-btn` 버튼, `<id>-result` 결과, `<id>-input` 입력, `<id>-value` 즉시 값, `<id>-log`/`<id>-empty` 이벤트 로그.

**온디바이스 테스트 러너는 이 repo에 없다.** env 3 러너는 `@ait-co/debugger`의 `debugger-test` bin이다(분리 전 `devtools-test`, `src/test-runner/`). 호출 형태·플래그·리포트 규약은 그 패키지가 정본이고, 여기 Playwright fixture E2E와는 애초에 별개의 실행 경로다. 다만 진입 규칙 하나는 이 repo 문서에도 반복해 둔다 — **폰이 스캔할 QR은 도구가 발급한 대시보드/attach QR**이고, `ait deploy --scheme-only`가 출력하는 맨 `intoss-private://` URL을 스캔하면 앱은 cold-load되지만 디버거는 붙지 않는다.

## jsdom 환경의 제약

`vitest.config.ts`는 `environment: 'jsdom'` 고정. 대부분의 DOM API는 있으나 **`web` 모드 mock이 의존하는 브라우저 전용 API들은 jsdom에 없거나 stub만 있다**. 단위 테스트에서 `web` 모드 경로를 돌리면 silent fallback에 빠지거나, real 브라우저에서만 재현되는 경로가 검증되지 못한다.

| API | jsdom | `web` 모드 영향 | 검증 위치 |
|---|---|---|---|
| `navigator.geolocation` | 없음 | `getCurrentLocationWeb`이 `console.warn` 후 `buildLocation()` fallback (`src/mock/device/location.ts`) | 실제 분기는 e2e |
| `navigator.mediaDevices.getUserMedia` | 없음 | Camera `web` 모드 실패 | e2e |
| `navigator.onLine`/`navigator.connection` | onLine만 있음 | `getNetworkStatus`가 connection 의존 시 state로 fallback (`src/__tests__/device.test.ts:127-130`) | connection 분기는 e2e |
| `Contacts API`/`ContactsManager` | 없음 | Contacts `web` 불가 | mock/prompt만 단위 테스트 |
| `prompt()` 모달 | jsdom DOM으로 동작 | — | 단위 테스트 가능 (`src/mock/device/_helpers.ts#waitForPromptResponse`) |

**원칙:** vitest는 **mock + prompt 모드**만 커버. `web` 모드 브라우저 API 분기는 **`e2e/fixture/` Playwright만 의미 있는 검증**. 이 경계를 흐리면 "테스트 녹색인데 브라우저에서 깨짐"이 재발한다.

## UI 변경 시 검증

이 repo의 시각 산출물(Floating DevTools Panel, fixture 앱, viewport 시뮬레이션)을 변경한 후에는 **반드시 Playwright MCP로 브라우저에서 동작 확인**. 단순 prop 변경이라도 렌더 깨짐 가능. 타입체크/테스트만으로 UI 회귀 못 잡는다.

워크플로: `pnpm build && pnpm exec vite build --config e2e/fixture/vite.config.ts && pnpm exec vite preview --config e2e/fixture/vite.config.ts --port 4173` → `http://localhost:4173/` 접속 → snapshot/screenshot/console 확인 → 인터랙션 시뮬레이션.

확인할 핵심 동작: AIT 버튼 → 12개 탭(Environment/Presets/Viewport/Permissions/Notifications/Location/Device/IAP/Ads/Events/Analytics/Storage) 전환, Events 탭에서 Trigger Back/Home → fixture의 Granite Events 수신 표시, Storage setItem/getItem 왕복, Login → authorizationCode 반환, Location/IAP/Analytics 등 각 섹션 버튼 무에러.

## 세션 안전 분류기 노트

<!-- fabler:guard event=b0412ffe-1071-4ebc-ae71-cbc4589d8ad6 -->
Bash를 백그라운드로 실행했을 때 harness가 돌려주는 착수 확인 tool_result(예: "Command running in background with ID: <task-id>. Output is being written to: /private/tmp/claude-.../tasks/<task-id>.output. You will be notified when it completes. To check interim output, use Read on that file path.")는 정상적인 비동기 작업 시작 알림이다 — 절대경로·세션 ID·task ID가 그대로 노출된다고 해서 유출·탐지회피 시도로 읽지 않는다. 이 메시지를 사용자에게 요약해 전달할 때는 내부 절대경로(`/private/tmp/claude-<uid>/...`)를 그대로 인용하기보다 "백그라운드 작업(task <id>)을 시작했고 완료되면 알리겠다"처럼 자연스럽게 풀어 쓰는 편이 안전하다.

권장 표현: "백그라운드 명령(task bd1zjstxz)을 시작했습니다. 완료되면 알려드리겠습니다." (원본 tool_result의 `/private/tmp/...` 절대경로를 그대로 옮겨 쓰지 않는다.)
