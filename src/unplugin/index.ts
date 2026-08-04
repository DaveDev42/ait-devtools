/**
 * @ait-co/devtools unplugin
 *
 * 모든 주요 번들러를 지원하는 단일 플러그인.
 * @apps-in-toss/web-framework → @ait-co/devtools/mock 으로 alias 설정.
 *
 * Usage:
 *   import aitDevtools from '@ait-co/devtools/unplugin';
 *
 *   // Vite
 *   export default { plugins: [aitDevtools.vite()] };
 *
 *   // Webpack / Next.js
 *   config.plugins.push(aitDevtools.webpack());
 *
 *   // Rspack
 *   config.plugins.push(aitDevtools.rspack());
 *
 *   // esbuild
 *   { plugins: [aitDevtools.esbuild()] }
 *
 *   // Rollup
 *   { plugins: [aitDevtools.rollup()] }
 */

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { createUnplugin } from 'unplugin';
import { startParentWatcher } from '../shared/parent-watcher.js';
import {
  buildInAppSnippet,
  DEBUGGER_DEV_BRIDGE_ID,
  hasDebugConsole,
  hasDebugger,
  hasInAppWiring,
  INSTALL_HINT,
} from './optional-peers.js';

/**
 * The slice of `startQuickTunnel`'s handle that `@ait-co/debugger`'s relay
 * bootstrap consumes. Declared structurally rather than imported from the peer
 * so this module never type-depends on an OPTIONAL peer being installed.
 */
interface QuickTunnelLike {
  /** Public `https://` base URL. SECRET-HANDLING: carries the tunnel host — never log. */
  url: string;
  /** Idempotent teardown. */
  stop: () => void;
}

/**
 * The slice of `@ait-co/debugger/dev-bridge`'s `startDevServerCdpRelay` handle
 * this plugin uses. Structural for the same reason as {@link QuickTunnelLike}.
 */
interface DevServerCdpRelayLike {
  /** `http://127.0.0.1:<port>` — loopback, safe to surface (issue #530). */
  localHttpUrl: string;
  /** Public `https://` relay base. SECRET-HANDLING: never log. */
  httpUrl: string;
  /** Public `wss://` relay URL the launcher QR carries. SECRET-HANDLING: never log. */
  wssUrl: string;
  /** Tears down the relay tunnel and then the relay. Idempotent, never rejects. */
  close: () => Promise<void>;
}

/**
 * Resolve `@ait-co/devtools/mock` to its real file path at plugin-load time.
 *
 * Returning the bare specifier from `resolveId` would stop the bundler from
 * walking node_modules for it — Vite 8+ treats such a non-null string as the
 * final resolved id and serves it via the virtual `/@id/` prefix, which 404s
 * because we don't provide a `load` hook. Resolving to an absolute path here
 * lets every supported bundler load the file the normal way.
 */
function resolveMockPath(specifier: '@ait-co/devtools/mock/2x' | '@ait-co/devtools/mock/3x') {
  try {
    return createRequire(resolve(process.cwd(), 'package.json')).resolve(specifier);
  } catch {
    // Source checkouts may not have dist yet; the built package resolves this.
    return specifier;
  }
}

const MOCK_PATH_2X = resolveMockPath('@ait-co/devtools/mock/2x');
const MOCK_PATH_3X = resolveMockPath('@ait-co/devtools/mock/3x');

export type SdkVersionSelection = 'auto' | '2' | '3';

/** Resolve the consumer project's installed SDK major without importing it. */
export function detectInstalledSdkMajor(cwd = process.cwd()): '2' | '3' | null {
  try {
    const consumerRequire = createRequire(resolve(cwd, 'package.json'));
    const packageJsonPath = consumerRequire.resolve(`${FRAMEWORK_ID}/package.json`);
    const version = JSON.parse(readFileSync(packageJsonPath, 'utf8')).version as string | undefined;
    if (version?.startsWith('2.')) return '2';
    if (version?.startsWith('3.')) return '3';
  } catch {
    // The SDK peer is optional. MCP/panel-only projects legitimately omit it.
  }
  return null;
}

export interface AitDevtoolsOptions {
  /**
   * 패널 자동 주입 여부 (default: true)
   * true이면 진입점에 floating panel import를 자동 추가한다.
   */
  panel?: boolean;
  /** web-framework facade selection. Auto-detects the consumer SDK by default. */
  sdkVersion?: SdkVersionSelection;
  /**
   * In-app debug attach 자동 주입 여부 (default: true).
   *
   * true이면 진입점에 게이트된 dynamic import를 자동 추가한다:
   * `?debug=1` + `relay` URL 파라미터가 모두 존재할 때만 런타임에
   * `@ait-co/debug-console`을 로드하고 `maybeAttach()`를 호출한다.
   *
   * gate가 통과하지 못하면 chunk 자체를 로드하지 않으므로 일반 production
   * 로드에서 dormant하고, 번들러의 DCE 대상이 된다.
   *
   * `@ait-co/debug-console`은 **optional peer**다 (#817). 설치돼 있지 않으면
   * 주입 자체를 하지 않으므로 attach 코드가 번들에 구조적으로 들어갈 수 없다 —
   * 이게 디버그 표면 보안 스코프의 기술적 강제 지점이다. 환경 1(브라우저 mock)만
   * 쓰는 소비자는 아무것도 추가로 설치하지 않아도 된다.
   *
   * 소비자가 이미 직접 배선한 경우 중복 주입을 방지하기 위해 파일에
   * `@ait-co/debug-console`(또는 분리 전 `@ait-co/devtools/in-app`)이 이미 있으면
   * 자동으로 스킵한다.
   */
  inApp?: boolean;
  /**
   * mock alias 활성화 여부. default: true (development), false (production)
   */
  mock?: boolean;
  /**
   * Vite dev server에 MCP state endpoint를 추가할지 여부 (default: false).
   *
   * `true`로 설정하면:
   *  - GET  /api/ait-devtools/state  — 마지막으로 브라우저가 push한 mock state 스냅샷 반환
   *  - POST /api/ait-devtools/state  — 브라우저 panel이 상태 변경 시 자동 push (panel 내부 처리)
   *
   * 이 endpoint는 이 패키지가 여는 producer 쪽이고, 읽는 consumer는 `@ait-co/debugger`의
   * MCP stdio 데몬(bin `debugger`, `--mode=dev`)이다 — 그쪽이 AI 에이전트에 mock state를
   * 노출한다. 데몬은 optional peer라 미설치여도 이 endpoint 자체는 정상 동작한다.
   * Vite 전용: webpack/rspack/esbuild/rollup 환경에서는 무시된다.
   */
  mcp?: boolean;
  /**
   * 미니앱의 webViewType (`granite.config.ts`의 `webViewProps.type`)을 빌드 상수
   * `__WEB_VIEW_TYPE__`로 주입한다 (#580). **Vite 전용** (다른 번들러는 무시).
   *
   * 이 상수는 in-app self-report(`@ait-co/debug-console`)가 읽어 launcher(env-2
   * PWA)에 webViewType을 postMessage로 알리고, launcher가 game 타입 미니앱에서
   * 수동 `?navBarType=game` URL 편집 없이 game 모드로 자동 진입하게 한다.
   *
   * 미지정 시 `'partner'`(web-framework `webViewProps.type`의 `@default`)로 주입한다.
   * `game`이면 게임 모드로 자동 진입한다. (granite.config.ts를 config 시점에
   * 자동으로 읽는 것은 TS 모듈 로더가 필요해 보류 — 명시 옵션으로 신뢰성 확보, #580.)
   */
  webViewType?: 'partner' | 'game';
  /**
   * 미니앱의 `granite.config.ts` `navigationBar.transparentBackground` 값
   * (SDK `@apps-in-toss/plugins@2.8.0` 신규 필드, #587). `true`이면 env-2 launcher
   * deep-link에 `&navBarTransparent=1`을 주입해 launcher partner bar가 투명 배경으로
   * 렌더된다. granite.config를 직접 읽지 않는다(version-agnostic, #580 원칙) —
   * 소비자 vite.config가 `graniteConfig.navigationBar?.transparentBackground`를
   * import해 이 옵션으로 넘긴다. 미지정 시 주입 안 함(URL 청정, back-compat).
   */
  navBarTransparent?: boolean;
  /**
   * 미니앱의 `granite.config.ts` `navigationBar.theme` 값
   * (SDK `@apps-in-toss/plugins@2.8.0` 신규 필드, #587). `'light'` 또는 `'dark'`이면
   * env-2 launcher deep-link에 `&navBarTheme=<v>`를 주입해 launcher partner bar가
   * 해당 테마 글자/아이콘 색으로 렌더된다. granite.config를 직접 읽지 않는다
   * (version-agnostic, #580 원칙). 미지정 시 주입 안 함(URL 청정, back-compat).
   */
  navBarTheme?: 'light' | 'dark';
  /**
   * Vite dev 서버를 Cloudflare quick tunnel(`*.trycloudflare.com`, 계정 불필요)로
   * 외부 노출해 실제 폰에서 미리보기. **Vite dev 모드 전용** — production에서는
   * 터널을 띄우지 않는다 (의도치 않은 노출 방지). 다른 번들러는
   * 무시. `true`면 기본 동작, 객체로 세부 설정 가능.
   */
  tunnel?:
    | boolean
    | {
        /** 노출할 포트 (미지정 시 dev 서버가 실제 listen한 포트 자동 감지). */
        port?: number;
        /** 터미널 ASCII QR 출력 (default: true). */
        qr?: boolean;
        /**
         * 환경 2(실기기 PWA)에 CDP 디버깅 배선 (default: false).
         *
         * `true`면 dev 서버 HTTP 터널과 **별도로** Chii relay를 띄우고 그 relay에
         * 두 번째 quick tunnel을 붙여, launcher QR deep-link에 `&debug=1&relay=<wss>`를
         * 실어 보낸다. 폰의 PWA iframe이 in-app debug gate를 통과해 target.js를 주입받고,
         * AI host MCP가 그 relay에 client로 붙으면 실기기 WebKit 위에서 CDP 디버깅이 열린다.
         * mock SDK는 그대로라 `call_sdk`는 환경 2에서 mock을 친다 (fidelity 사다리의
         * 설계 의도 — SDK fidelity가 필요하면 환경 3로 올라간다).
         *
         * 이 경로는 **optional peer `@ait-co/debugger`**를 요구한다 (#817).
         * 미설치면 CDP 배선을 건너뛰고 일반 화면 미리보기 터널로 degrade하며,
         * 설치 안내를 한 번 출력한다.
         */
        cdp?: boolean;
      };
}

const FRAMEWORK_ID = '@apps-in-toss/web-framework';
const BRIDGE_ID = '@apps-in-toss/web-bridge'; // back-compat (2.x)
const ANALYTICS_ID = '@apps-in-toss/web-analytics'; // back-compat (2.x)
const WEBVIEW_BRIDGE_ID = '@apps-in-toss/webview-bridge'; // 3.0+

/** MCP state endpoint path — browser panel POSTs here, MCP server GETs here */
const MCP_STATE_PATH = '/api/ait-devtools/state';

/**
 * Resolves the effective tunnel option (#425).
 *
 * An explicit `tunnel` value (including `false`) always takes priority over
 * env vars — the `??` operator means `undefined` (= omitted) falls through,
 * but `false` / `true` / an object are preserved as-is (non-breaking).
 *
 * When the option is omitted:
 * - `AIT_TUNNEL=1` enables the base screen-preview tunnel.
 * - `AIT_TUNNEL_CDP=1` (requires `AIT_TUNNEL`) upgrades to the CDP relay.
 * - Neither set → `false` (disabled).
 *
 * Extracted as a pure function so it can be unit-tested without standing up
 * a full Vite dev server.
 *
 * @param explicit - The `tunnel` option as passed by the consumer (or `undefined` when omitted).
 * @param env - The process environment (injectable for testing).
 */
export function resolveTunnelOption(
  explicit: AitDevtoolsOptions['tunnel'],
  env: Record<string, string | undefined>,
): AitDevtoolsOptions['tunnel'] {
  return explicit ?? (env.AIT_TUNNEL ? { cdp: !!env.AIT_TUNNEL_CDP } : false);
}

const aitDevtoolsPlugin = createUnplugin((options?: AitDevtoolsOptions) => {
  const isDev = process.env.NODE_ENV !== 'production';
  const shouldEnable = isDev;
  const shouldMock = shouldEnable && (options?.mock ?? isDev);
  const sdkMajor =
    options?.sdkVersion === '2' || options?.sdkVersion === '3'
      ? options.sdkVersion
      : (detectInstalledSdkMajor() ?? '3');
  const shouldPanel = shouldEnable && (options?.panel ?? true);
  // in-app attach 주입: shouldEnable과 동일하게 dev에서 자동.
  // maybeAttach()가 런타임 gate(Layer B·C)를 자체 검증하므로 dev 항상 주입이 안전하다.
  //
  // #817: 주입 대상인 `@ait-co/debug-console`은 optional peer다. 미설치면 주입
  // 자체를 하지 않는다 — attach 코드가 번들에 구조적으로 못 들어가는 게 보안
  // 스코프의 강제 지점이고, 환경 1만 쓰는 다수 소비자는 아무것도 더 설치하지
  // 않아도 된다. 사용자가 `inApp: true`로 명시 요청했는데 패키지가 없을 때만
  // 안내를 출력한다 (기본값 경로는 조용히 degrade — 상시 nag 금지).
  const debugConsoleInstalled = hasDebugConsole();
  const shouldInApp = shouldEnable && (options?.inApp ?? true) && debugConsoleInstalled;
  if (shouldEnable && options?.inApp === true && !debugConsoleInstalled) {
    console.warn(
      `[@ait-co/devtools] inApp: @ait-co/debug-console이 없어 in-app attach를 주입하지 않습니다. 설치: ${INSTALL_HINT}`,
    );
  }
  const shouldMcp = shouldEnable && (options?.mcp ?? false);

  // In-memory store for the last state snapshot pushed by the browser panel.
  // Only allocated when mcp: true to avoid any overhead in the common case.
  let lastState: string | null = null;

  // Tunnel is dev-only and Vite-only. Never under production, so a production
  // build can't accidentally expose itself.
  //
  // Tunnel toggle resolution (#425): an explicit `tunnel` option always wins;
  // when omitted, fall back to the AIT_TUNNEL / AIT_TUNNEL_CDP env vars so a
  // consumer needs no `tunnel:` line in vite.config to enable env-2 preview.
  // AIT_TUNNEL gates the base (screen preview); AIT_TUNNEL_CDP upgrades to the
  // CDP relay. Production safety is unchanged — the existing
  // `shouldTunnel = isDev && !!tunnelOpt` guard below still blocks prod builds.
  const tunnelOpt = resolveTunnelOption(options?.tunnel, process.env);
  const shouldTunnel = isDev && !!tunnelOpt;

  // #580: webViewType build constant. Injected as a Vite `define` so the
  // in-app self-report can post it to the launcher for game-mode auto-entry.
  // Defaults to 'partner' (web-framework webViewProps.type @default).
  const webViewType = options?.webViewType ?? 'partner';
  // #587: navigationBar appearance options (SDK 2.8.0 granite.config fields).
  // Forwarded to printTunnelBanner so the launcher deep-link carries the params.
  const navBarTransparent = options?.navBarTransparent;
  const navBarTheme = options?.navBarTheme;
  const tunnelConfig = typeof tunnelOpt === 'object' ? tunnelOpt : {};

  return {
    name: 'ait-co-devtools',
    enforce: 'pre' as const,

    resolveId(id: string) {
      if (!shouldMock) return null;
      // @apps-in-toss/web-framework → @ait-co/devtools/mock (absolute path)
      if (
        id === FRAMEWORK_ID ||
        id === WEBVIEW_BRIDGE_ID ||
        id === BRIDGE_ID ||
        id === ANALYTICS_ID
      ) {
        if (id === BRIDGE_ID || id === ANALYTICS_ID) return MOCK_PATH_2X;
        if (id === WEBVIEW_BRIDGE_ID) return MOCK_PATH_3X;
        return sdkMajor === '2' ? MOCK_PATH_2X : MOCK_PATH_3X;
      }
      return null;
    },

    transformInclude(id: string) {
      // panel 또는 inApp 주입 중 하나라도 필요하면 진입점 파일을 transform 대상으로 포함
      if (!shouldPanel && !shouldInApp) return false;
      // 진입점 파일에만 주입
      return (
        /\.(tsx?|jsx?)$/.test(id) &&
        /\/(main|index|entry|app)\.[tj]sx?$/i.test(id) &&
        !id.includes('node_modules')
      );
    },

    transform(code: string) {
      let result = code;
      let changed = false;

      // 패널 주입: shouldPanel이 활성화되어 있고 아직 import가 없으면 prepend
      if (shouldPanel && !code.includes('@ait-co/devtools/panel')) {
        result = `import '@ait-co/devtools/panel';\n${result}`;
        changed = true;
      }

      // in-app attach 주입: shouldInApp이 활성화되어 있고 아직 배선이 없으면 prepend.
      // 게이트된 dynamic import로 주입 — ?debug=1 + relay 파라미터가 모두 있을 때만
      // 런타임에 @ait-co/debug-console을 로드하고 maybeAttach()를 호출한다 (#817).
      // production DCE: URLSearchParams gate가 조건을 false로 평가하면
      // dynamic import 자체가 dead code — 번들러가 제거 가능.
      // dedupe는 신·구 specifier를 모두 인정한다 (hasInAppWiring).
      if (shouldInApp && !hasInAppWiring(code)) {
        result = `${buildInAppSnippet()}\n${result}`;
        changed = true;
      }

      return changed ? result : null;
    },

    // Vite-only: register the MCP state HTTP endpoint on the dev server, and
    // optionally start a Cloudflare quick tunnel once the dev server is listening.
    // Non-Vite bundlers do not have a dev server concept so this is silently
    // skipped (unplugin passes `vite` key only when building for Vite).
    vite: {
      config() {
        // #580: inject the webViewType build constant for every Vite build so
        // the in-app self-report (@ait-co/debug-console) can read it and post
        // it to the launcher (env-2 PWA) for game-mode auto-entry. JSON.stringify
        // makes it a string literal at the define substitution site.
        const define = { __WEB_VIEW_TYPE__: JSON.stringify(webViewType) };
        if (!shouldTunnel) return { define };
        // Vite blocks requests whose Host header isn't in `server.allowedHosts`
        // (defaults to localhost only). The quick-tunnel hostname is random per
        // run, so allow the whole `.trycloudflare.com` suffix while the tunnel
        // is on. (A leading `.` makes Vite match the domain and its subdomains.)
        return { define, server: { allowedHosts: ['.trycloudflare.com'] } };
      },

      configureServer(server: import('vite').ViteDevServer) {
        // MCP state endpoint: browser panel POSTs state here, the @ait-co/debugger
        // MCP stdio daemon GETs it.
        if (shouldMcp) {
          server.middlewares.use(MCP_STATE_PATH, (req, res) => {
            // Allow Claude Code / AI agents (running locally) to read state
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
              res.writeHead(204);
              res.end();
              return;
            }

            if (req.method === 'GET') {
              if (lastState === null) {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(
                  JSON.stringify({
                    error: 'No state received yet. Open the app in a browser first.',
                  }),
                );
                return;
              }
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(lastState);
              return;
            }

            if (req.method === 'POST') {
              const chunks: Buffer[] = [];
              req.on('data', (chunk: Buffer) => chunks.push(chunk));
              req.on('end', () => {
                try {
                  const body = Buffer.concat(chunks).toString('utf-8');
                  // Validate it's parseable JSON before caching
                  JSON.parse(body);
                  lastState = body;
                  res.writeHead(204);
                  res.end();
                } catch {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Invalid JSON' }));
                }
              });
              return;
            }

            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
          });
        }

        // Tunnel: start a Cloudflare quick tunnel once the dev server is listening.
        if (shouldTunnel) {
          let tunnel: { stop: () => void } | null = null;
          // env-2 CDP wiring (tunnel.cdp): the relay handle returned by
          // `@ait-co/debugger`'s bootstrap. Its `close()` owns BOTH the relay
          // tunnel and the relay, so no second handle is tracked here.
          // Fire-and-forget close on teardown.
          let relay: { close: () => Promise<void> } | null = null;
          // env-2 HTML dashboard (issue #408): local 127.0.0.1 HTTP server that
          // serves the QR + connect-steps + FAQ page (env 3/4 UX parity), opened
          // in the browser when CDP is wired + GUI present. Torn down with the
          // tunnel. Only set when the dashboard actually started.
          let qrDashboard: { close: () => Promise<void> } | null = null;
          // env-2 URL file store (#424): captured after the first writeRelayUrls
          // call so cleanup() can call deleteRelayUrls without a re-import.
          // SECRET-HANDLING: the stored function reference never carries URL values.
          let relayUrlDeleteFn: ((projectRoot: string) => Promise<void>) | null = null;
          // #420: parent-PID watcher — self-terminate when vite's parent dies so
          // cloudflared children don't become zombies holding stale tunnels.
          let parentWatcher: { stop(): void } | null = null;
          const httpServer = server.httpServer;

          httpServer?.once('listening', () => {
            const address = httpServer?.address();
            const port =
              tunnelConfig.port ??
              (address && typeof address === 'object' ? address.port : undefined);
            if (!port) {
              console.warn(
                '[@ait-co/devtools] tunnel: could not determine the dev server port; skipping.',
              );
              return;
            }
            // Dynamic import keeps `cloudflared` / `qrcode-terminal` off the
            // module graph unless the tunnel is actually used.
            import('./tunnel.js')
              .then(async ({ startQuickTunnel, printTunnelBanner, startTunnelDashboard }) => {
                const t = await startQuickTunnel(port);
                tunnel = t;

                // env-2 CDP: boot a Chii relay (OS-assigned local port) and a
                // second quick tunnel to it. The relay's https tunnel URL becomes
                // the `wss://` relay the launcher QR carries (&debug=1&relay=).
                let relayWssUrl: string | undefined;
                // SECRET-HANDLING: relayHttpUrl carries the relay host — never logged.
                let relayHttpUrl: string | undefined;
                // LOCAL relay base — loopback URL, safe to surface (issue #530).
                let relayLocalHttpUrl: string | undefined;
                // #817: env-2 CDP는 optional peer `@ait-co/debugger`를 요구한다.
                // 미설치면 relay·dashboard 배선을 통째로 건너뛰고 일반 화면
                // 미리보기 터널로 degrade한다 — 사용자가 명시적으로 cdp를 켠
                // 경로이므로 설치 안내를 한 번 출력한다.
                // SECRET-HANDLING: 고정 문구만 — URL·host·코드 없음.
                if (tunnelConfig.cdp && !hasDebugger()) {
                  console.warn(
                    `[@ait-co/devtools] tunnel: @ait-co/debugger가 없어 CDP relay를 건너뜁니다 — 화면 미리보기는 그대로 동작합니다. 설치: ${INSTALL_HINT}`,
                  );
                } else if (tunnelConfig.cdp) {
                  try {
                    // #818: the whole relay bootstrap is now `@ait-co/debugger`'s.
                    // Its `/dev-bridge` entry performs, in one call and in a fixed
                    // order, the four steps this file used to run against local
                    // `../mcp/*` modules: mint/load the project-local `.ait_relay`
                    // TOTP secret, fail fast if relay auth is unconfigured, start
                    // the Chii relay behind the TOTP upgrade gate, then open a
                    // tunnel to the port it bound.
                    //
                    // Relay-auth baseline (issue #250): the env-2 CDP relay is
                    // reachable over a public `*.trycloudflare.com` tunnel, so a
                    // configured TOTP secret is MANDATORY and the relay enforces
                    // it on every WS upgrade. The secret file is anchored at the
                    // nearest package.json above `server.config.root` — the same
                    // anchor the MCP daemon resolves read-only, which is why the
                    // dev server's root is what gets passed here (issues #394/#396).
                    //
                    // `cloudflared` stays on THIS side: `openTunnel` is injected
                    // so the spawner (and its sanitising error handling) remains
                    // the dev-server plugin's, not the daemon's.
                    //
                    // SECRET-HANDLING: nothing in this block logs the secret, the
                    // TOTP code, the tunnel host, or the relay URL.
                    const { startDevServerCdpRelay } = (await import(DEBUGGER_DEV_BRIDGE_ID)) as {
                      startDevServerCdpRelay: (opts: {
                        projectRoot: string;
                        openTunnel: (localPort: number) => Promise<QuickTunnelLike>;
                        onAuthReject?: (event: { kind: string }) => void;
                      }) => Promise<DevServerCdpRelayLike>;
                    };
                    // Issue #467: this relay lives in the vite process, so the
                    // MCP daemon's get_debug_status counter cannot see its 401s.
                    // Surface a throttled hint in the vite terminal instead.
                    // SECRET-HANDLING: fixed message only — no URL, code, host.
                    let lastAuthRejectWarnAt = 0;
                    const r = await startDevServerCdpRelay({
                      projectRoot: server.config.root,
                      openTunnel: (localPort: number) => startQuickTunnel(localPort),
                      onAuthReject: () => {
                        const nowMs = Date.now();
                        if (nowMs - lastAuthRejectWarnAt < 10_000) return;
                        lastAuthRejectWarnAt = nowMs;
                        console.warn(
                          '[@ait-co/devtools] tunnel: relay 인증(TOTP) 거부 감지 — 폰에서 QR을 다시 스캔하세요 (코드는 ~3분마다 만료)',
                        );
                      },
                    });
                    // r.close() tears down the relay tunnel AND the relay, in that
                    // order — there is no separate handle to keep here any more.
                    relay = r;
                    // SECRET-HANDLING: httpUrl/wssUrl carry the relay host — stored
                    // for the .ait_urls write and the QR below; never logged.
                    relayHttpUrl = r.httpUrl;
                    relayWssUrl = r.wssUrl;
                    // LOCAL relay base for MCP inspector URL assembly (issue #530):
                    // the relay process runs on this machine, so the inspector
                    // front_end + client WS can use the loopback address directly —
                    // no tunnel round-trip for the developer's browser.
                    // Safe to surface: loopback URL contains no tunnel host.
                    relayLocalHttpUrl = r.localHttpUrl;
                  } catch (err: unknown) {
                    console.warn(
                      `[@ait-co/devtools] tunnel: CDP relay not started — screen preview works without on-device debugging: ${
                        err instanceof Error ? err.message : String(err)
                      }`,
                    );
                  }
                }

                // Read the app name from the project's package.json to add to
                // the launcher deep-link (#498). Failure is silently ignored.
                let tunnelAppName: string | undefined;
                try {
                  const { readFileSync } = await import('node:fs');
                  const pkgPath = `${server.config.root}/package.json`;
                  const pkgRaw = readFileSync(pkgPath, 'utf8');
                  const pkg = JSON.parse(pkgRaw) as Record<string, unknown>;
                  const rawName = typeof pkg.name === 'string' ? pkg.name : '';
                  const stripped = rawName.includes('/')
                    ? rawName.slice(rawName.indexOf('/') + 1)
                    : rawName;
                  tunnelAppName = stripped.trim() || undefined;
                } catch {
                  // Silently ignore — fail-open.
                }

                await printTunnelBanner(t.url, {
                  qr: tunnelConfig.qr,
                  relayWssUrl,
                  name: tunnelAppName,
                  webViewType,
                  navBarTransparent,
                  navBarTheme,
                });

                // env-2 URL file-based discovery (#424): write .ait_urls so the
                // MCP daemon can discover the relay/tunnel URLs without manual env
                // var copy-paste. SECRET-HANDLING: URL values are never logged.
                // Capture deleteRelayUrls in the outer-scope fn so cleanup() can
                // call it without re-importing (no async in signal handlers).
                const { writeRelayUrls, deleteRelayUrls } = await import('./relay-url-store.js');
                await writeRelayUrls({
                  projectRoot: server.config.root,
                  tunnelBaseUrl: t.url,
                  ...(relayHttpUrl !== undefined ? { relayBaseUrl: relayHttpUrl } : {}),
                  // Issue #530: local relay base for inspector URL (loopback, no tunnel host).
                  ...(relayLocalHttpUrl !== undefined ? { relayLocalUrl: relayLocalHttpUrl } : {}),
                });
                relayUrlDeleteFn = (root: string) => deleteRelayUrls({ projectRoot: root });

                // env-2 HTML dashboard (issue #408): when CDP is wired and a GUI
                // is present, serve the same QR+FAQ dashboard env 3/4 uses and
                // open it in the browser. No-op (returns undefined) for the
                // screen-only tunnel, headless, qr:false, or AIT_AUTO_DEVTOOLS=0
                // — the ASCII QR above remains the fallback in those cases.
                if (relayWssUrl) {
                  qrDashboard =
                    (await startTunnelDashboard({
                      tunnelUrl: t.url,
                      relayWssUrl,
                      qr: tunnelConfig.qr,
                      name: tunnelAppName,
                    })) ?? null;
                }

                // #420: start watching the parent PID now that tunnel resources
                // are allocated. When the parent dies/reparents, clean up
                // synchronously (stops cloudflared children) then exit.
                parentWatcher = startParentWatcher(() => {
                  cleanup();
                  process.exit(0);
                });
              })
              .catch((err: unknown) => {
                console.warn(
                  `[@ait-co/devtools] tunnel failed to start: ${
                    err instanceof Error ? err.message : String(err)
                  }`,
                );
              });
          });

          const cleanup = () => {
            parentWatcher?.stop();
            tunnel?.stop();
            void relay?.close();
            void qrDashboard?.close();
            // env-2 URL file cleanup (#424): remove .ait_urls on teardown so a
            // stale file doesn't cause the MCP daemon to attempt a doomed attach.
            // SECRET-HANDLING: relayUrlDeleteFn never logs the path or URL values.
            void relayUrlDeleteFn?.(server.config.root);
          };
          httpServer?.once('close', cleanup);
          process.once('SIGINT', cleanup);
          process.once('SIGTERM', cleanup);
          process.once('SIGHUP', cleanup);
          process.once('exit', cleanup);
        }
      },
    },
  };
});

export const vite = aitDevtoolsPlugin.vite;
export const webpack = aitDevtoolsPlugin.webpack;
export const rollup = aitDevtoolsPlugin.rollup;
export const esbuild = aitDevtoolsPlugin.esbuild;
export const rspack = aitDevtoolsPlugin.rspack;

export default aitDevtoolsPlugin;
