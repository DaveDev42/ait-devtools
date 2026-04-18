# E2E testid Contract & devtools E2E Rewrite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** sdk-example의 공통 컴포넌트에 최소 `data-testid` 계약을 추가하고(PR #1), devtools `e2e/panel.test.ts`를 새 sdk-example 아키텍처에 맞춰 21개 테스트로 재작성해 로컬에서 green 달성(PR #2).

**Architecture:** 2-PR serial. sdk-example PR #1은 `PageHeader`/`ApiCard`/`ResultView`/`EventSubscriberCard`/`HistoryLog`에 testid를 부착하고 16개 도메인 페이지에서 `PageHeader`에 `testId` prop 전달. 독립 merge. devtools PR #2는 PR #1 merge 이후 `e2e/panel.test.ts` 전체를 Smoke(1) + Layer A 도메인 smoke(12) + Layer B 패널 UX(4) + Layer C 패널↔앱 bridge(4) = 21개로 재작성.

**Tech Stack:** TypeScript (strict), React 19 + Vite (sdk-example), Playwright 1.59 (devtools), pnpm 10.33.0, Node 24.

**Base branch:**
- PR #1: sdk-example `main` (work branch: `feat/testid-contract`)
- PR #2: devtools `main` (현재 작업 브랜치: `test-e2e-selector-audit`에 이어서 커밋)

**Spec:** `docs/superpowers/specs/2026-04-18-e2e-testid-contract-design.md`

**대체되는 plan:** `docs/superpowers/plans/2026-04-18-A-e2e-selector-audit.md` (마지막 Task에서 삭제).

---

## File Structure

### sdk-example repo (PR #1)

절대 경로: `/Users/dave/Projects/github.com/apps-in-toss-community/sdk-example`

**Modify (공통 컴포넌트 5개):**
- `src/components/PageHeader.tsx` — `testId` 필수 prop 추가, `data-testid={\`page-${testId}\`}` 부착
- `src/components/ApiCard.tsx` — 루트 `data-testid={\`api-card-${name}\`}`, 실행 버튼 `data-testid={\`api-card-${name}-run\`}`
- `src/components/ResultView.tsx` — status 뱃지 `data-testid="result-status"`, `<pre>` `data-testid="result-data"`
- `src/pages/EventsPage.tsx` — `EventSubscriberCard`에 `testId` prop 도입, 카드 루트 `data-testid={\`event-card-${testId}\`}` + 토글 버튼 `data-testid={\`event-card-${testId}-toggle\`}`. 4개 카드 호출부에 `testId="backEvent"` 등 전달
- `src/components/HistoryLog.tsx` — entry div에 `data-testid="history-entry"`

**Modify (16개 도메인 페이지 — `PageHeader`에 `testId` 전달):**
- `src/pages/AuthPage.tsx` → `testId="auth"`
- `src/pages/NavigationPage.tsx` → `testId="navigation"`
- `src/pages/EnvironmentPage.tsx` → `testId="environment"`
- `src/pages/PermissionsPage.tsx` → `testId="permissions"`
- `src/pages/StoragePage.tsx` → `testId="storage"`
- `src/pages/LocationPage.tsx` → `testId="location"`
- `src/pages/CameraPage.tsx` → `testId="camera"`
- `src/pages/ContactsPage.tsx` → `testId="contacts"`
- `src/pages/ClipboardPage.tsx` → `testId="clipboard"`
- `src/pages/HapticPage.tsx` → `testId="haptic"`
- `src/pages/IAPPage.tsx` → `testId="iap"`
- `src/pages/AdsPage.tsx` → `testId="ads"`
- `src/pages/GamePage.tsx` → `testId="game"`
- `src/pages/AnalyticsPage.tsx` → `testId="analytics"`
- `src/pages/PartnerPage.tsx` → `testId="partner"`
- `src/pages/EventsPage.tsx` → `testId="events"` (EventsPage는 위 공통 수정과 같은 파일)

**HomePage는 수정 안 함** — PageHeader를 쓰지 않고 자체 헤더. Layer A 테스트는 홈에서 `getByRole('link', { name })`로 도메인 카드 클릭.

### devtools repo (PR #2)

절대 경로: `/Users/dave/Projects/github.com/apps-in-toss-community/devtools-test-e2e-selector-audit`

**Rewrite:**
- `e2e/panel.test.ts` — 21개 테스트로 전면 재작성. 기존 848줄 → 예상 ~500줄.

**Delete:**
- `docs/superpowers/plans/2026-04-18-A-e2e-selector-audit.md` — 대체됨.

**Unchanged:**
- `playwright.config.ts` — clone URL, webServer 설정 그대로.
- `src/` — 전부.

---

## 두 repo에서의 작업 순서

**Phase A** — sdk-example PR #1 (Task 1~6). 독립 merge.
**User merge checkpoint** — 사용자가 PR #1 merge.
**Phase B** — devtools PR #2 (Task 7~11). PR #1 merge 이후 진행.

로컬에서 PR #2의 테스트를 PR #1 merge 이전에 증명하려면: Task 7 전에 `playwright.config.ts`를 **임시로** `/Users/dave/Projects/github.com/apps-in-toss-community/sdk-example`(로컬 체크아웃)를 가리키도록 바꿔 1회 green 확인 후 원상복구. 원상복구 여부를 Task 11 자기검토에서 재확인.

---

## Phase A — sdk-example testid 계약 (PR #1)

### Task 1: sdk-example 작업 브랜치 세팅

**Files:** 없음 (환경 설정만)

- [ ] **Step 1: main 최신화 후 feature 브랜치 생성**

Run:
```bash
cd /Users/dave/Projects/github.com/apps-in-toss-community/sdk-example
git fetch origin
git checkout main
git pull --ff-only
git checkout -b feat/testid-contract
```

Expected: 브랜치 전환 성공. `git status` clean.

- [ ] **Step 2: 의존성 설치 + baseline typecheck/build 확인**

Run:
```bash
pnpm install
pnpm typecheck
pnpm build
```

Expected: 모두 성공. 이로써 작업 전 기준선이 green임을 확인.

---

### Task 2: `PageHeader`에 `testId` prop 추가

**Files:**
- Modify: `/Users/dave/Projects/github.com/apps-in-toss-community/sdk-example/src/components/PageHeader.tsx`

- [ ] **Step 1: 파일 교체**

현재 파일 전체 내용:
```tsx
import { useNavigate } from 'react-router-dom';

export function PageHeader({ title }: { title: string }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 py-3 border-b border-gray-100">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="뒤로가기"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
    </header>
  );
}
```

새 내용:
```tsx
import { useNavigate } from 'react-router-dom';

export function PageHeader({ title, testId }: { title: string; testId: string }) {
  const navigate = useNavigate();

  return (
    <header
      data-testid={`page-${testId}`}
      className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 py-3 border-b border-gray-100"
    >
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="뒤로가기"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
    </header>
  );
}
```

- [ ] **Step 2: typecheck가 실패하는지 확인 (의도적 실패 — 16개 페이지가 testId를 안 넘김)**

Run:
```bash
pnpm typecheck
```

Expected: FAIL. 오류 메시지는 각 도메인 페이지에서 `Property 'testId' is missing in type '{ title: string; }'` 형태. 이 실패는 Task 3에서 일괄 해결된다.

- [ ] **Step 3: 아직 커밋하지 않는다** — Task 3 이후에 함께 커밋.

---

### Task 3: 16개 도메인 페이지에서 `testId` 전달

**Files (modify — 각 파일에서 `<PageHeader title="..."/>` → `<PageHeader title="..." testId="..."/>`):**

매핑표:

| 파일 | 현재 title | 추가할 testId |
|---|---|---|
| `src/pages/AuthPage.tsx` | `Auth` | `auth` |
| `src/pages/NavigationPage.tsx` | `Navigation` | `navigation` |
| `src/pages/EnvironmentPage.tsx` | `Environment` | `environment` |
| `src/pages/PermissionsPage.tsx` | `Permissions` | `permissions` |
| `src/pages/StoragePage.tsx` | `Storage` | `storage` |
| `src/pages/LocationPage.tsx` | `Location` | `location` |
| `src/pages/CameraPage.tsx` | `Camera & Photos` (또는 `Camera`) | `camera` |
| `src/pages/ContactsPage.tsx` | `Contacts` | `contacts` |
| `src/pages/ClipboardPage.tsx` | `Clipboard` | `clipboard` |
| `src/pages/HapticPage.tsx` | `Haptic` | `haptic` |
| `src/pages/IAPPage.tsx` | `IAP` | `iap` |
| `src/pages/AdsPage.tsx` | `Ads` | `ads` |
| `src/pages/GamePage.tsx` | `Game` | `game` |
| `src/pages/AnalyticsPage.tsx` | `Analytics` | `analytics` |
| `src/pages/PartnerPage.tsx` | `Partner` | `partner` |
| `src/pages/EventsPage.tsx` | `Events` | `events` |

- [ ] **Step 1: 각 페이지 파일에서 PageHeader 호출에 testId 추가**

각 파일을 Read로 열고, `<PageHeader title="X" />` 또는 `<PageHeader title="X"/>`를 `<PageHeader title="X" testId="<slug>" />`로 바꾼다. title 문자열은 그대로 유지한다. Edit 도구로 파일당 1회 치환.

예시 (AuthPage.tsx):
```tsx
// 변경 전:
<PageHeader title="Auth" />
// 변경 후:
<PageHeader title="Auth" testId="auth" />
```

16개 파일 모두 동일 패턴. title에 공백이나 특수문자가 있어도 그대로 둔다 — testId는 별도 slug.

- [ ] **Step 2: typecheck 재실행**

Run:
```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 3: 커밋 (Task 2 + 3 합쳐서)**

Run:
```bash
git add src/components/PageHeader.tsx src/pages/
git commit -m "feat(testid): add testId prop to PageHeader and wire all pages"
```

Expected: 17개 파일 커밋 (components/PageHeader.tsx + 16 pages).

---

### Task 4: `ApiCard`에 testid 부착

**Files:**
- Modify: `/Users/dave/Projects/github.com/apps-in-toss-community/sdk-example/src/components/ApiCard.tsx`

- [ ] **Step 1: 루트 div 와 실행 버튼에 testid 추가**

파일 104~135줄(현재 JSX 블록)에서 아래 두 곳을 수정한다.

변경 전 (루트 div):
```tsx
    <div className="rounded-xl border border-gray-200 bg-white p-4">
```
변경 후:
```tsx
    <div data-testid={`api-card-${name}`} className="rounded-xl border border-gray-200 bg-white p-4">
```

변경 전 (실행 버튼):
```tsx
      <button
        type="button"
        onClick={handleExecute}
        disabled={status === 'loading'}
        className="mt-3 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        실행
      </button>
```
변경 후:
```tsx
      <button
        type="button"
        data-testid={`api-card-${name}-run`}
        onClick={handleExecute}
        disabled={status === 'loading'}
        className="mt-3 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        실행
      </button>
```

- [ ] **Step 2: typecheck + build**

Run:
```bash
pnpm typecheck && pnpm build
```

Expected: 모두 PASS.

- [ ] **Step 3: 커밋**

Run:
```bash
git add src/components/ApiCard.tsx
git commit -m "feat(testid): tag ApiCard root and run button with testids"
```

---

### Task 5: `ResultView` + `HistoryLog` testid

**Files:**
- Modify: `/Users/dave/Projects/github.com/apps-in-toss-community/sdk-example/src/components/ResultView.tsx`
- Modify: `/Users/dave/Projects/github.com/apps-in-toss-community/sdk-example/src/components/HistoryLog.tsx`

- [ ] **Step 1: ResultView 수정**

현재 파일:
```tsx
interface ResultViewProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: unknown;
  error?: string;
}

export function ResultView({ status, data, error }: ResultViewProps) {
  if (status === 'idle') return null;

  if (status === 'loading') {
    return (
      <div className="mt-2 px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  const isError = status === 'error';

  return (
    <div className={`mt-2 rounded-lg border px-3 py-2 ${isError ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
      <span className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
        {isError ? 'Error' : 'Success'}
      </span>
      <pre className="mt-1 text-xs text-gray-800 whitespace-pre-wrap break-all overflow-auto max-h-64">
        {isError ? error : JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
```

변경 후 (status 뱃지 + `<pre>`에 testid 부착):
```tsx
interface ResultViewProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: unknown;
  error?: string;
}

export function ResultView({ status, data, error }: ResultViewProps) {
  if (status === 'idle') return null;

  if (status === 'loading') {
    return (
      <div className="mt-2 px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  const isError = status === 'error';

  return (
    <div className={`mt-2 rounded-lg border px-3 py-2 ${isError ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
      <span
        data-testid="result-status"
        className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
      >
        {isError ? 'Error' : 'Success'}
      </span>
      <pre
        data-testid="result-data"
        className="mt-1 text-xs text-gray-800 whitespace-pre-wrap break-all overflow-auto max-h-64"
      >
        {isError ? error : JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
```

- [ ] **Step 2: HistoryLog 수정**

현재 23~29줄:
```tsx
        {entries.map((entry, i) => (
          <div key={`${entry.timestamp}-${i}`} className="flex items-start gap-2 text-xs">
            <span className="text-gray-400 shrink-0">{formatTime(entry.timestamp)}</span>
            <span className={entry.status === 'error' ? 'text-red-600' : 'text-green-600'}>
              {entry.status === 'error' ? entry.error : entry.data === undefined ? '(no data)' : JSON.stringify(entry.data)}
            </span>
          </div>
        ))}
```

변경 후:
```tsx
        {entries.map((entry, i) => (
          <div
            key={`${entry.timestamp}-${i}`}
            data-testid="history-entry"
            className="flex items-start gap-2 text-xs"
          >
            <span className="text-gray-400 shrink-0">{formatTime(entry.timestamp)}</span>
            <span className={entry.status === 'error' ? 'text-red-600' : 'text-green-600'}>
              {entry.status === 'error' ? entry.error : entry.data === undefined ? '(no data)' : JSON.stringify(entry.data)}
            </span>
          </div>
        ))}
```

- [ ] **Step 3: typecheck + build**

Run:
```bash
pnpm typecheck && pnpm build
```

Expected: PASS.

- [ ] **Step 4: 커밋**

Run:
```bash
git add src/components/ResultView.tsx src/components/HistoryLog.tsx
git commit -m "feat(testid): tag ResultView status/data and HistoryLog entries"
```

---

### Task 6: `EventSubscriberCard` testid (EventsPage 내부 컴포넌트)

**Files:**
- Modify: `/Users/dave/Projects/github.com/apps-in-toss-community/sdk-example/src/pages/EventsPage.tsx`

- [ ] **Step 1: `EventSubscriberCardProps`에 `testId` 필수 prop 추가, 카드 루트/토글 버튼에 testid 부착**

변경 전 (6~14줄 props + 42~72줄 JSX):
```tsx
interface EventSubscriberCardProps {
  name: string;
  description: string;
  /**
   * Called once on each subscribe toggle. Callers should not rely on closure
   * stability — a new subscription is created every time the user toggles on.
   */
  subscribe: (onEvent: (payload: unknown) => void) => () => void;
}

function EventSubscriberCard({ name, description, subscribe }: EventSubscriberCardProps) {
```

변경 후:
```tsx
interface EventSubscriberCardProps {
  name: string;
  description: string;
  testId: string;
  /**
   * Called once on each subscribe toggle. Callers should not rely on closure
   * stability — a new subscription is created every time the user toggles on.
   */
  subscribe: (onEvent: (payload: unknown) => void) => () => void;
}

function EventSubscriberCard({ name, description, testId, subscribe }: EventSubscriberCardProps) {
```

변경 전 (카드 루트 div):
```tsx
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
```
변경 후:
```tsx
  return (
    <div
      data-testid={`event-card-${testId}`}
      className="rounded-xl border border-gray-200 bg-white p-4"
    >
```

변경 전 (토글 버튼):
```tsx
      <button
        type="button"
        onClick={toggle}
        className={`mt-3 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors ${
          isSubscribed
            ? 'bg-red-600 hover:bg-red-500'
            : 'bg-gray-900 hover:bg-gray-800'
        }`}
      >
        {isSubscribed ? '구독 해제' : '구독'}
      </button>
```
변경 후:
```tsx
      <button
        type="button"
        data-testid={`event-card-${testId}-toggle`}
        onClick={toggle}
        className={`mt-3 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors ${
          isSubscribed
            ? 'bg-red-600 hover:bg-red-500'
            : 'bg-gray-900 hover:bg-gray-800'
        }`}
      >
        {isSubscribed ? '구독 해제' : '구독'}
      </button>
```

- [ ] **Step 2: 4개 `<EventSubscriberCard>` 호출부에 testId 전달**

파일 79~117줄 JSX에서 각 `<EventSubscriberCard>` 호출에 다음 매핑으로 testId 추가:

- `graniteEvent — backEvent` → `testId="backEvent"`
- `graniteEvent — homeEvent` → `testId="homeEvent"`
- `tdsEvent — navigationAccessoryEvent` → `testId="navigationAccessoryEvent"`
- `onVisibilityChangedByTransparentServiceWeb` → `testId="visibilityChanged"`

예시 (첫 번째 카드):
```tsx
// 변경 전:
<EventSubscriberCard
  name="graniteEvent — backEvent"
  description="뒤로가기 버튼 이벤트 구독"
  subscribe={(onEvent) =>
    graniteEvent.addEventListener('backEvent', {
      onEvent: () => onEvent(undefined),
    })
  }
/>
// 변경 후:
<EventSubscriberCard
  name="graniteEvent — backEvent"
  description="뒤로가기 버튼 이벤트 구독"
  testId="backEvent"
  subscribe={(onEvent) =>
    graniteEvent.addEventListener('backEvent', {
      onEvent: () => onEvent(undefined),
    })
  }
/>
```

나머지 3개도 같은 패턴.

- [ ] **Step 3: typecheck + build**

Run:
```bash
pnpm typecheck && pnpm build
```

Expected: PASS.

- [ ] **Step 4: 시각 QA (Playwright MCP 선택)**

Run:
```bash
pnpm preview --port 5173
```
백그라운드 실행. Playwright MCP `browser_navigate` 로 `http://localhost:5173/events` 접속, `browser_snapshot`으로 `event-card-backEvent`, `event-card-backEvent-toggle` testid가 DOM에 존재함을 확인 후 프로세스 종료.

Playwright MCP 불가 시 수동 브라우저 DOM inspector로 확인.

- [ ] **Step 5: 커밋**

Run:
```bash
git add src/pages/EventsPage.tsx
git commit -m "feat(testid): add testId to EventSubscriberCard and wire 4 subscriber cards"
```

- [ ] **Step 6: push + PR 생성**

Run:
```bash
git push -u origin feat/testid-contract
gh pr create --title "feat(testid): add data-testid contract to shared components" --body "$(cat <<'EOF'
## Summary

`devtools` repo의 E2E 테스트(Playwright 기반)가 sdk-example을 consumer로 돌릴 수 있도록, 공통 컴포넌트에 최소 `data-testid` 계약을 추가한다. 이 PR은 purely additive — 기존 UX/레이아웃은 유지된다.

## 변경점

- `PageHeader`에 `testId: string` 필수 prop 추가 → `data-testid="page-<testId>"` 부착
- 16개 도메인 페이지에서 `PageHeader`에 `testId` 전달 (title 슬러그)
- `ApiCard` 루트/실행 버튼에 `data-testid="api-card-<name>"` / `"api-card-<name>-run"`
- `ResultView` status/pre에 `data-testid="result-status"` / `"result-data"`
- `HistoryLog` entry에 `data-testid="history-entry"`
- `EventSubscriberCard`에 `testId` 필수 prop 추가 → `data-testid="event-card-<testId>"` + 토글 버튼 `-toggle`

## 배경

devtools repo의 기존 E2E 테스트 스위트가 old sdk-example markup(존재하지 않는 per-API testid)에 대해 작성되어 있어 75/75 실패 상태다. sdk-example 전면 재작성 후 devtools 쪽에서 selector를 맞출 때 최소한의 안정된 계약이 필요하다. 관련 설계: `devtools/docs/superpowers/specs/2026-04-18-e2e-testid-contract-design.md` (브레인스토밍 결과).

## Test plan

- [ ] `pnpm typecheck` 통과
- [ ] `pnpm build` 통과
- [ ] `pnpm preview` 후 임의 도메인 페이지(`/auth`, `/events`)의 DOM inspector에서 testid 확인
EOF
)"
```

Expected: PR 생성 성공. URL 출력.

- [ ] **Step 7: Phase B로 넘어가기 전 체크포인트**

사용자에게 PR URL을 보고하고 merge 대기. PR이 merge되기 전까지 Phase B의 Task 11의 최종 green 확인은 "로컬 브랜치 pin" 절충으로만 가능하다.

---

## Phase B — devtools E2E 재작성 (PR #2)

**사전 조건:** Phase A PR #1이 sdk-example `main`에 merge되어 있어야 Task 11의 green이 자연스럽게 나온다. PR #1 merge 전이라면 Task 7a(로컬 pin)를 거쳐서만 local green 증명.

### Task 7: devtools 작업 환경 준비 + 테스트 재작성 시작

**Files:**
- 작업 디렉토리: `/Users/dave/Projects/github.com/apps-in-toss-community/devtools-test-e2e-selector-audit`
- 현재 브랜치: `test-e2e-selector-audit` (이 브랜치에 이어서 커밋. 커밋 이력에 spec 2개 이미 있음)

- [ ] **Step 1: 최신 sdk-example clone으로 캐시 정리**

Run:
```bash
cd /Users/dave/Projects/github.com/apps-in-toss-community/devtools-test-e2e-selector-audit
rm -rf .tmp/sdk-example
```

Expected: `.tmp/sdk-example` 삭제. 다음 실행 시 webServer가 새로 clone한다.

- [ ] **Step 2 (선택 — PR #1 미 merge 상태에서 local green을 증명하려는 경우): `playwright.config.ts`를 로컬 브랜치 pin으로 임시 변경**

PR #1이 이미 merge되었으면 이 step은 건너뛴다.

현재 `playwright.config.ts` webServer 배열의 git clone 줄:
```ts
'git clone --depth 1 https://github.com/apps-in-toss-community/sdk-example.git .tmp/sdk-example',
```

임시 변경:
```ts
'git clone --depth 1 --branch feat/testid-contract /Users/dave/Projects/github.com/apps-in-toss-community/sdk-example .tmp/sdk-example',
```

주의: 이 변경은 **절대 커밋하지 않는다**. Task 11 Step 4에서 원상복구 확인.

---

### Task 8: Helper 및 기본 구조 골조 작성

**Files:**
- Rewrite: `/Users/dave/Projects/github.com/apps-in-toss-community/devtools-test-e2e-selector-audit/e2e/panel.test.ts`

이 Task에서 파일 전체를 새 구조로 덮어쓴다. 기존 848줄 전부 제거.

- [ ] **Step 1: 파일을 새 골조로 교체**

`e2e/panel.test.ts`의 **전체 내용**을 아래로 교체한다:

```ts
import { test, expect, type Page, type Locator } from '@playwright/test';

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

// Navigate to home and wait for the landmark heading.
async function gotoHome(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'SDK Example' })).toBeVisible();
}

// From home, click the domain link by its visible name and wait for the page
// header landmark `page-<slug>`.
async function gotoDomain(page: Page, linkName: string | RegExp, slug: string) {
  await page.getByRole('link', { name: linkName }).click();
  await expect(page.getByTestId(`page-${slug}`)).toBeVisible();
}

// Scope selector to a single ApiCard by name.
function apiCard(page: Page, name: string): Locator {
  return page.getByTestId(`api-card-${name}`);
}

// Click the run button inside a specific ApiCard.
async function runApi(page: Page, name: string) {
  await apiCard(page, name).getByTestId(`api-card-${name}-run`).click();
}

// Wait for the ApiCard's ResultView to show Success.
async function expectApiSuccess(page: Page, name: string, opts: { timeout?: number } = {}) {
  await expect(apiCard(page, name).getByTestId('result-status')).toHaveText('Success', {
    timeout: opts.timeout,
  });
}

// Wait for the ApiCard's ResultView to show Error.
async function expectApiError(page: Page, name: string, opts: { timeout?: number } = {}) {
  await expect(apiCard(page, name).getByTestId('result-status')).toHaveText('Error', {
    timeout: opts.timeout,
  });
}

// Devtools panel helpers — the panel mounts into the document directly from
// @ait-co/devtools, so CSS-class selectors are stable across sdk-example changes.
async function openPanel(page: Page) {
  await page.locator('button.ait-panel-toggle').click();
  await expect(page.locator('.ait-panel.open')).toBeVisible();
}

async function closePanel(page: Page) {
  await page.locator('button.ait-panel-toggle').click();
  await expect(page.locator('.ait-panel.open')).not.toBeVisible();
}

async function switchTab(page: Page, tabId: string) {
  await page.locator(`.ait-panel-tab[data-tab="${tabId}"]`).click();
}

// --------------------------------------------------------------------------
// Smoke
// --------------------------------------------------------------------------

test.describe('Smoke', () => {
  test('home renders without page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await gotoHome(page);
    // Any domain link is enough to confirm the list rendered.
    await expect(page.getByRole('link', { name: 'Auth' })).toBeVisible();

    expect(errors).toHaveLength(0);
  });
});

// (Layer A / B / C test blocks are added in subsequent tasks.)
```

- [ ] **Step 2: baseline 실행으로 Smoke만 green임을 확인**

Run:
```bash
pnpm test:e2e --reporter=list --grep "Smoke"
```

Expected: 1 passed. webServer가 처음 기동할 때 sdk-example clone + build로 수 분 소요.

- [ ] **Step 3: 커밋**

Run:
```bash
git add e2e/panel.test.ts
git commit -m "test(e2e): rewrite scaffolding with new helpers and smoke test"
```

---

### Task 9: Layer A — 도메인 smoke 12개 추가

**Files:**
- Modify: `e2e/panel.test.ts` — Smoke 블록 다음에 Layer A describe 추가.

각 도메인에서 **파라미터가 필요 없는 API**를 하나 골라 실행 → Success 대기. sdk-example의 현재 ApiCard name을 기반으로 한 매핑:

| 도메인 slug | link name | API name |
|---|---|---|
| `auth` | `Auth` | `appLogin` |
| `navigation` | `Navigation` | `getTossShareLink` |
| `storage` | `Storage` | `clearItems` |
| `location` | `Location` | `getCurrentLocation` |
| `camera` | `Camera & Photos` | `fetchAlbumPhotos` |
| `contacts` | `Contacts` | `fetchContacts` |
| `haptic` | `Haptic` | `generateHapticFeedback` |
| `iap` | `IAP` | `getProductItemList` |
| `ads` | `Ads` | `loadAppsInTossAdMob` |
| `game` | `Game` | `getGameCenterGameProfile` |
| `analytics` | `Analytics` | `click` |
| `partner` | `Partner` | `addAccessoryButton` |

**주의**: 실제 매핑이 sdk-example에 존재하는 ApiCard `name` 값과 정확히 일치해야 한다. 작업 전 `grep -rn 'name=' /Users/dave/Projects/github.com/apps-in-toss-community/sdk-example/src/pages/` 등으로 확인하고, 위 목록 중 해당 페이지에 없는 API가 있으면 같은 페이지의 다른 파라미터 불필요 API로 교체. 교체 사실을 커밋 메시지에 한 줄 기록.

- [ ] **Step 1: 각 도메인의 ApiCard name 실재 확인**

Run:
```bash
grep -rn "<ApiCard" /Users/dave/Projects/github.com/apps-in-toss-community/sdk-example/src/pages/ | head -80
```

Expected: 각 페이지의 ApiCard 목록 출력. 위 매핑의 각 `API name`이 실제 존재하는지 확인. 존재하지 않으면 동일 페이지 내 **params가 빈 배열이거나 defaultValue로 실행 가능한** 다른 API로 교체.

- [ ] **Step 2: Layer A describe 블록 추가**

`e2e/panel.test.ts`의 Smoke describe 바로 다음에 아래를 삽입:

```ts
// --------------------------------------------------------------------------
// Layer A — domain smoke
// --------------------------------------------------------------------------
// One test per domain (excluding Environment, Permissions, Clipboard, Events
// which are covered by Layer C). Navigates into the domain, runs a
// parameter-free API, and expects Success.

interface DomainSmoke {
  linkName: string | RegExp;
  slug: string;
  api: string;
  timeout?: number;
}

const DOMAIN_SMOKES: DomainSmoke[] = [
  { linkName: 'Auth', slug: 'auth', api: 'appLogin' },
  { linkName: 'Navigation', slug: 'navigation', api: 'getTossShareLink' },
  { linkName: 'Storage', slug: 'storage', api: 'clearItems' },
  { linkName: 'Location', slug: 'location', api: 'getCurrentLocation' },
  { linkName: /Camera/, slug: 'camera', api: 'fetchAlbumPhotos' },
  { linkName: 'Contacts', slug: 'contacts', api: 'fetchContacts' },
  { linkName: 'Haptic', slug: 'haptic', api: 'generateHapticFeedback' },
  { linkName: 'IAP', slug: 'iap', api: 'getProductItemList' },
  { linkName: 'Ads', slug: 'ads', api: 'loadAppsInTossAdMob', timeout: 5000 },
  { linkName: 'Game', slug: 'game', api: 'getGameCenterGameProfile' },
  { linkName: 'Analytics', slug: 'analytics', api: 'click' },
  { linkName: 'Partner', slug: 'partner', api: 'addAccessoryButton' },
];

test.describe('Layer A — domain smoke', () => {
  for (const { linkName, slug, api, timeout } of DOMAIN_SMOKES) {
    test(`${slug}: ${api} runs and returns Success`, async ({ page }) => {
      await gotoHome(page);
      await gotoDomain(page, linkName, slug);
      await runApi(page, api);
      await expectApiSuccess(page, api, { timeout });
    });
  }
});
```

- [ ] **Step 3: Layer A만 실행하여 12개 green 확인**

Run:
```bash
pnpm test:e2e --reporter=list --grep "Layer A"
```

Expected: 12 passed. 실패 시 해당 도메인의 ApiCard name 또는 API가 실제로 파라미터를 요구하는지 확인하고 `DOMAIN_SMOKES` 배열을 수정.

- [ ] **Step 4: 커밋**

Run:
```bash
git add e2e/panel.test.ts
git commit -m "test(e2e): add Layer A domain smoke (12 domains)"
```

---

### Task 10: Layer B (패널 UX 4개) + Layer C (bridge 4개) 추가

**Files:**
- Modify: `e2e/panel.test.ts` — Layer A 다음에 Layer B, Layer C describe 추가.

- [ ] **Step 1: Layer B describe 추가**

Layer A describe 바로 다음에:

```ts
// --------------------------------------------------------------------------
// Layer B — panel UX
// --------------------------------------------------------------------------

test.describe('Layer B — panel UX', () => {
  test('toggle opens and closes the panel', async ({ page }) => {
    await gotoHome(page);
    const toggle = page.locator('button.ait-panel-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveText('AIT');

    await openPanel(page);
    await closePanel(page);
  });

  test('dragging changes the toggle Y position', async ({ page }) => {
    await gotoHome(page);
    const toggle = page.locator('button.ait-panel-toggle');
    const box = await toggle.boundingBox();
    expect(box).not.toBeNull();
    const startX = box!.x + box!.width / 2;
    const startY = box!.y + box!.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX - 100, startY - 80, { steps: 10 });
    await page.mouse.up();

    const newBox = await toggle.boundingBox();
    expect(newBox).not.toBeNull();
    expect(Math.abs(newBox!.y - box!.y)).toBeGreaterThan(10);
  });

  test.describe('mobile fullscreen', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('panel opens fullscreen on small viewport and close button works', async ({ page }) => {
      await gotoHome(page);
      await openPanel(page);

      const panel = page.locator('.ait-panel.open');
      const box = await panel.boundingBox();
      expect(box).not.toBeNull();
      const viewport = page.viewportSize()!;
      expect(box!.x).toBe(0);
      expect(box!.y).toBe(0);
      expect(box!.width).toBe(viewport.width);
      expect(box!.height).toBe(viewport.height);

      const closeBtn = page.locator('.ait-panel-close');
      await expect(closeBtn).toBeVisible();
      await closeBtn.click();
      await expect(page.locator('.ait-panel.open')).not.toBeVisible();
    });
  });

  test('toggle button position persists across reload', async ({ page }) => {
    await gotoHome(page);
    const toggle = page.locator('button.ait-panel-toggle');
    const box = await toggle.boundingBox();
    expect(box).not.toBeNull();

    const startX = box!.x + box!.width / 2;
    const startY = box!.y + box!.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(80, 300, { steps: 10 });
    await page.mouse.up();

    const draggedBox = await toggle.boundingBox();
    expect(draggedBox).not.toBeNull();

    const saved = await page.evaluate(() => localStorage.getItem('__ait_btn_pos'));
    expect(saved).not.toBeNull();
    const pos = JSON.parse(saved!) as Record<string, string>;
    expect(pos).toHaveProperty('left', '16px');

    await page.reload();
    await expect(page.getByRole('heading', { name: 'SDK Example' })).toBeVisible();

    const restored = page.locator('button.ait-panel-toggle');
    await expect(restored).toBeVisible();
    const restoredBox = await restored.boundingBox();
    expect(restoredBox).not.toBeNull();
    expect(restoredBox!.x).toBe(16);
    expect(Math.abs(restoredBox!.y - draggedBox!.y)).toBeLessThan(5);
  });
});
```

- [ ] **Step 2: Layer B만 green 확인**

Run:
```bash
pnpm test:e2e --reporter=list --grep "Layer B"
```

Expected: 4 passed.

- [ ] **Step 3: 커밋**

Run:
```bash
git add e2e/panel.test.ts
git commit -m "test(e2e): add Layer B panel UX (toggle, drag, fullscreen, persistence)"
```

- [ ] **Step 4: Layer C describe 추가**

Layer B 다음에:

```ts
// --------------------------------------------------------------------------
// Layer C — panel ↔ app bridge
// --------------------------------------------------------------------------

test.describe('Layer C — bridge', () => {
  test('env: panel OS change reflects in getPlatformOS', async ({ page }) => {
    await gotoHome(page);

    await openPanel(page);
    await switchTab(page, 'env');
    const osRow = page
      .locator('.ait-panel .ait-row')
      .filter({ has: page.locator('label', { hasText: /^OS$/ }) });
    await osRow.locator('select').selectOption('android');
    await closePanel(page);

    await gotoDomain(page, 'Environment', 'environment');
    await runApi(page, 'getPlatformOS');
    await expect(apiCard(page, 'getPlatformOS').getByTestId('result-data')).toContainText(
      'android',
      { timeout: 5000 },
    );
  });

  test('permissions: denied camera causes openCamera error', async ({ page }) => {
    await gotoHome(page);

    await openPanel(page);
    await switchTab(page, 'permissions');
    const cameraSelect = page
      .locator('.ait-panel .ait-row')
      .filter({ hasText: 'camera' })
      .locator('select')
      .first();
    await cameraSelect.selectOption('denied');
    await closePanel(page);

    await gotoDomain(page, /Camera/, 'camera');
    await runApi(page, 'openCamera');
    await expectApiError(page, 'openCamera', { timeout: 5000 });
    await expect(apiCard(page, 'openCamera').getByTestId('result-data')).toContainText('denied');
  });

  test('device: clipboard mock mode round-trips text', async ({ page }) => {
    await gotoHome(page);

    await openPanel(page);
    await switchTab(page, 'device');
    const clipboardSelect = page
      .locator('.ait-panel .ait-row')
      .filter({ hasText: 'Clipboard' })
      .locator('select');
    await clipboardSelect.selectOption('mock');
    await closePanel(page);

    await gotoDomain(page, 'Clipboard', 'clipboard');

    // Fill the text param on setClipboardText (ApiCard renders an input per param).
    const setCard = apiCard(page, 'setClipboardText');
    await setCard.getByRole('textbox').first().fill('hello-bridge');
    await runApi(page, 'setClipboardText');
    await expectApiSuccess(page, 'setClipboardText');

    await runApi(page, 'getClipboardText');
    await expect(apiCard(page, 'getClipboardText').getByTestId('result-data')).toContainText(
      'hello-bridge',
    );
  });

  test('events: panel trigger back event is received by subscriber', async ({ page }) => {
    await gotoHome(page);
    await gotoDomain(page, 'Events', 'events');

    // Start the subscription.
    await page.getByTestId('event-card-backEvent-toggle').click();
    await expect(
      page.getByTestId('event-card-backEvent').getByTestId('history-entry'),
    ).toHaveCount(0);

    // Trigger from the devtools panel.
    await openPanel(page);
    await switchTab(page, 'events');
    await page.locator('.ait-panel button').filter({ hasText: 'Trigger Back Event' }).click();
    await closePanel(page);

    // The subscriber card should now have at least one history entry.
    await expect(
      page.getByTestId('event-card-backEvent').getByTestId('history-entry').first(),
    ).toBeVisible({ timeout: 3000 });
  });
});
```

**참고**: Layer C Step 4의 `setClipboardText` 파라미터는 sdk-example `ClipboardPage.tsx`의 실제 param 이름에 따라 `page.getByLabel(...)`로 바꿔야 할 수 있다. 작업 시 `ClipboardPage.tsx`를 Read하여 첫 param의 label/name 확인 후 입력 셀렉터 조정.

- [ ] **Step 5: Layer C만 green 확인**

Run:
```bash
pnpm test:e2e --reporter=list --grep "Layer C"
```

Expected: 4 passed. 실패 유형별 조치:
- `getPlatformOS` 결과에 `android` 미포함 → devtools 패널 env 탭의 OS select value 이름이 바뀌었는지 확인.
- `openCamera`가 Success로 끝남 → 권한 mock이 실제 에러를 throw하는지 확인(devtools `mock/device/camera.ts`). 테스트 쪽 문제가 아니면 해당 도메인은 spec의 C4 폴백처럼 별도 이슈로 기록하고 테스트에서 `test.skip` 처리 후 커밋 메시지에 기록.
- Clipboard `set/getClipboardText` param 이름 미스매치 → sdk-example 실제 param 확인 후 수정.
- Events trigger 후 history-entry 미증가 → `backEvent` 구독이 실제로 붙었는지 구독 토글 상태 시각 확인(배지 '구독 중').

- [ ] **Step 6: 커밋**

Run:
```bash
git add e2e/panel.test.ts
git commit -m "test(e2e): add Layer C panel-app bridge (env, permissions, device, events)"
```

---

### Task 11: 전체 green + 안정성 확인 + 정리 + PR

**Files:**
- Delete: `/Users/dave/Projects/github.com/apps-in-toss-community/devtools-test-e2e-selector-audit/docs/superpowers/plans/2026-04-18-A-e2e-selector-audit.md`

- [ ] **Step 1: 전체 스위트 실행**

Run:
```bash
pnpm test:e2e --reporter=list 2>&1 | tee /tmp/e2e-final.log
```

Expected: 21 passed, 0 failed.

- [ ] **Step 2: 안정성 재확인 (2회 연속)**

Run:
```bash
pnpm test:e2e --reporter=list && pnpm test:e2e --reporter=list
```

Expected: 두 번 연속 21 passed. Flaky 테스트 발견 시 해당 테스트에 `test.describe.configure({ retries: 1 })` 대신 타임아웃만 늘려 재시도 (e.g. 특정 API timeout을 5s → 8s).

- [ ] **Step 3: 대체된 plan 삭제**

Run:
```bash
git rm docs/superpowers/plans/2026-04-18-A-e2e-selector-audit.md
```

Expected: 파일 삭제 + stage.

- [ ] **Step 4: playwright.config.ts 원상복구 확인**

Run:
```bash
git diff playwright.config.ts
```

Expected: **empty**. Task 7 Step 2의 로컬 pin이 실수로 stage되어 있지 않은지 확인. 변경사항 있으면 `git checkout -- playwright.config.ts`로 복구.

- [ ] **Step 5: 플랜 삭제 커밋**

Run:
```bash
git commit -m "docs: remove superseded selector-audit plan"
```

- [ ] **Step 6: push**

Run:
```bash
git push -u origin test-e2e-selector-audit
```

- [ ] **Step 7: PR 생성**

Run:
```bash
gh pr create --title "test(e2e): rewrite panel.test.ts for new sdk-example architecture" --body "$(cat <<'EOF'
## Summary

sdk-example이 React Router + `ApiCard` 구조로 전면 재작성되었고, 기존 E2E 스위트(75 tests)는 존재하지 않는 per-API `data-testid` 전제로 작성되어 있어 75/75 실패. 이 PR은 sdk-example의 새 testid 계약(선행 PR, apps-in-toss-community/sdk-example)에 맞춰 `e2e/panel.test.ts`를 21개 테스트로 재작성한다.

- **Smoke (1)** — 홈 페이지 렌더 + `pageerror` 0
- **Layer A 도메인 smoke (12)** — 각 도메인 진입 → 파라미터 없는 API 실행 → Success
- **Layer B 패널 UX (4)** — toggle / drag / mobile fullscreen / position persistence
- **Layer C 패널 ↔ 앱 bridge (4)** — env OS 변경 / camera permission denied / clipboard mock 왕복 / events Trigger Back

세밀 mock 반환값 검증(기존 Layer D)은 jsdom 유닛(`src/__tests__/`)에 위임.

## 선행 PR

`apps-in-toss-community/sdk-example`의 testid 계약 PR이 먼저 merge되어야 CI green. Spec: `docs/superpowers/specs/2026-04-18-e2e-testid-contract-design.md`.

## Local verification

`pnpm test:e2e`로 21 passed 2회 연속 확인. `playwright.config.ts`는 변경하지 않음 (sdk-example main clone 그대로).

## Test plan

- [ ] sdk-example testid PR merge 이후 이 PR CI에서 `build-and-test` green
- [ ] `pnpm test:e2e` 로컬에서 21 passed
EOF
)"
```

Expected: PR 생성 성공. URL 출력.

---

## Self-review 체크리스트 (Phase B 완료 시)

- [ ] `e2e/panel.test.ts`와 `docs/superpowers/plans/2026-04-18-A-e2e-selector-audit.md` 삭제 외 수정한 파일 없음
- [ ] `playwright.config.ts` diff 없음 (pin 원상복구)
- [ ] `pnpm test:e2e` 2회 연속 green
- [ ] sdk-example PR의 testid 계약이 이 테스트의 모든 `getByTestId` 호출과 일치
- [ ] Smoke 1 + Layer A 12 + Layer B 4 + Layer C 4 = 21개 테스트
- [ ] 새 helpers(`gotoHome`, `gotoDomain`, `runApi`, `expectApiSuccess`, `expectApiError`, `apiCard`) 외에는 기존 helper(`openPanel`, `closePanel`, `switchTab`) 보존
