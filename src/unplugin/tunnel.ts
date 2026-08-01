/**
 * Cloudflare quick-tunnel helper for the devtools unplugin.
 *
 * Loaded lazily (`await import('./tunnel.js')`) only when the `tunnel` option is
 * on, so `cloudflared` / `qrcode-terminal` are never pulled in for the common
 * case. This is the one place in `@ait-co/devtools` that depends on Node-only
 * APIs (`child_process` via the `cloudflared` wrapper) — keep it thin and out of
 * jsdom unit tests; the spawn path is verified by hand / e2e (same spirit as the
 * "web 모드는 e2e" rule in CLAUDE.md). The pure helpers below
 * (`parseTrycloudflareUrl`, `printTunnelBanner`) are unit-tested.
 */

import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { DEBUGGER_DEV_BRIDGE_ID } from './optional-peers.js';

/** Matches the public URL cloudflared prints for an unauthenticated quick tunnel. */
const TRYCLOUDFLARE_RE = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i;

/**
 * Extract the `https://<sub>.trycloudflare.com` URL from a line of cloudflared
 * output, or `null` if the line doesn't contain one. Pulled out as a pure
 * function so it can be unit-tested without spawning anything.
 */
export function parseTrycloudflareUrl(line: string): string | null {
  const m = line.match(TRYCLOUDFLARE_RE);
  return m ? m[0] : null;
}

export interface PrintTunnelBannerOptions {
  /** Print an ASCII QR encoding the tunnel URL (default: true). */
  qr?: boolean;
  /** Sink for the banner text (default: `console.log`). Injected for testing. */
  log?: (msg: string) => void;
  /**
   * The `wss://` relay URL of the env-2 CDP tunnel, if `tunnel.cdp` is on. When
   * present the QR deep-link additionally carries `&debug=1&relay=<wss>` so the
   * framed PWA passes the in-app debug gate and attaches a Chii target — the
   * same single scan opens screen preview *and* CDP debugging.
   */
  relayWssUrl?: string;
  /**
   * Human-readable app name to embed as `name=` in the launcher deep-link (#498).
   * When provided (non-blank), the launcher partner bar shows this name instead of
   * the generic default.
   */
  name?: string;
  /**
   * The miniapp's webViewType. When `'game'`, the deep-link carries `&navBarType=game`
   * so the launcher enters game nav chrome automatically on scan (#584).
   * `'partner'` (the default) is the launcher's implicit default — not added to
   * keep the URL clean.
   */
  webViewType?: 'partner' | 'game';
  /**
   * Whether the miniapp's navigationBar has `transparentBackground: true`
   * (granite.config `navigationBar.transparentBackground`, SDK 2.8.0, #587).
   * When `true`, the deep-link carries `&navBarTransparent=1` so the launcher
   * partner bar renders with a transparent background (content shows through).
   * `false` / omitted → not added (URL clean, back-compat).
   */
  navBarTransparent?: boolean;
  /**
   * The miniapp's navigationBar theme (`granite.config `navigationBar.theme`,
   * SDK 2.8.0, #587). When `'light'` or `'dark'`, the deep-link carries
   * `&navBarTheme=<v>` so the launcher partner bar uses the matching foreground
   * colour. Omitted / other values → not added (URL clean, back-compat).
   */
  navBarTheme?: 'light' | 'dark';
}

// EOL note: this host is decommissioned along with the `aitc.dev` domain, and
// there is no replacement. The constant is left as-is on purpose — changing it
// cannot help versions already published or launchers already installed on a
// phone, and env-2 has no other entry point.
const LAUNCHER_URL = 'https://devtools.aitc.dev/launcher/';

/**
 * Options for {@link buildLauncherDeepLink}.
 */
export interface BuildLauncherDeepLinkOptions {
  /**
   * `wss://` relay URL for env-2 CDP wiring. When present the deep-link carries
   * `&debug=1&relay=<wss>`.
   */
  relayWssUrl?: string;
  /**
   * Human-readable app name shown in the partner nav bar (`name=` param, #498).
   * Blank / whitespace-only values are not added.
   */
  name?: string;
  /**
   * The miniapp's webViewType. When `'game'`, adds `&navBarType=game` to the
   * deep-link so the launcher enters game nav chrome automatically on scan (#584).
   * `'partner'` (the launcher's implicit default) is not added to keep the URL
   * clean.
   */
  webViewType?: 'partner' | 'game';
  /**
   * Whether the miniapp's navigationBar has `transparentBackground: true`
   * (granite.config `navigationBar.transparentBackground`, SDK 2.8.0, #587).
   * When `true`, adds `&navBarTransparent=1` to the deep-link so the launcher
   * partner bar renders with a transparent background. Omitted when `false` /
   * undefined to keep the URL clean (back-compat).
   */
  navBarTransparent?: boolean;
  /**
   * The miniapp's navigationBar theme (granite.config `navigationBar.theme`,
   * SDK 2.8.0, #587). When `'light'` or `'dark'`, adds `&navBarTheme=<v>` to
   * the deep-link so the launcher partner bar uses the matching foreground colour.
   * Omitted when undefined / other values to keep the URL clean (back-compat).
   */
  navBarTheme?: 'light' | 'dark';
}

/**
 * Build the deep-link URL that QR codes encode: when the launcher PWA is
 * already on the phone's home screen, scanning this opens it directly into the
 * live view for `tunnelUrl` (the launcher consumes `?url=` and clears it).
 * Plain-text raw URL is no longer enough — the launcher gates its setup UI to
 * the installed PWA, so a raw tunnel URL opened in a normal browser tab would
 * land on a "please install" screen.
 *
 * When `opts.relayWssUrl` is given (env-2 CDP wiring), the deep-link also carries
 * `&debug=1&relay=<wss>`; the launcher folds those onto the framed tunnel URL so
 * the in-app debug gate's Layer C (`debug=1` opt-in + `relay=<wss>`) is met and
 * a Chii target.js is injected into the live view.
 *
 * When `opts.name` is given (non-blank), it is added as `&name=` so the launcher
 * partner bar shows the app name instead of the generic default (#498).
 *
 * When `opts.webViewType` is `'game'`, `&navBarType=game` is appended so the
 * launcher enters game nav chrome (floating capsule, no full bar) automatically
 * on scan. `'partner'` is the launcher's implicit default and is not added to
 * keep the URL clean (#584).
 *
 * When `opts.navBarTransparent` is `true`, `&navBarTransparent=1` is appended
 * so the launcher partner bar renders with a transparent background (#587).
 *
 * When `opts.navBarTheme` is `'light'` or `'dark'`, `&navBarTheme=<v>` is
 * appended so the launcher partner bar uses the matching foreground colour (#587).
 *
 * Back-compat: the second argument may also be a plain string (`relayWssUrl`)
 * for callers that haven't migrated to the options object yet.
 */
export function buildLauncherDeepLink(
  tunnelUrl: string,
  optsOrRelay?: string | BuildLauncherDeepLinkOptions,
): string {
  // Normalise the overloaded second argument.
  const opts: BuildLauncherDeepLinkOptions =
    typeof optsOrRelay === 'string' ? { relayWssUrl: optsOrRelay } : (optsOrRelay ?? {});

  const base = `${LAUNCHER_URL}?url=${encodeURIComponent(tunnelUrl)}`;
  let url = base;
  if (opts.relayWssUrl) {
    url += `&debug=1&relay=${encodeURIComponent(opts.relayWssUrl)}`;
  }
  if (opts.name !== undefined && opts.name.trim() !== '') {
    url += `&name=${encodeURIComponent(opts.name.trim())}`;
  }
  if (opts.webViewType === 'game') {
    url += '&navBarType=game';
  }
  if (opts.navBarTransparent === true) {
    url += '&navBarTransparent=1';
  }
  if (opts.navBarTheme === 'light' || opts.navBarTheme === 'dark') {
    url += `&navBarTheme=${opts.navBarTheme}`;
  }
  return url;
}

/**
 * Print the terminal banner announcing the live tunnel: the public URL, an ASCII
 * QR encoding a launcher deep-link, and a one-line note that quick tunnels are
 * ephemeral, unauthenticated and not for production. Pure w.r.t. side effects
 * other than the injected `log` sink and `qrcode-terminal` — unit-tested.
 */
export async function printTunnelBanner(
  url: string,
  opts: PrintTunnelBannerOptions = {},
): Promise<void> {
  const log = opts.log ?? ((m: string) => console.log(m));
  const deepLink = buildLauncherDeepLink(url, {
    relayWssUrl: opts.relayWssUrl,
    name: opts.name,
    webViewType: opts.webViewType,
    navBarTransparent: opts.navBarTransparent,
    navBarTheme: opts.navBarTheme,
  });
  const lines: string[] = [
    '',
    '  ┌─ @ait-co/devtools · live tunnel ────────────────────────────',
    `  │  ${url}`,
    '  │',
    `  │  Install the launcher PWA once:  ${LAUNCHER_URL}`,
    '  │  Then scan the QR below — it opens the launcher directly',
    '  │  into this tunnel URL (no manual paste needed).',
    ...(opts.relayWssUrl
      ? [
          '  │  The same scan also attaches CDP — connect your AI host',
          '  │  to the relay and debug the live view on-device.',
        ]
      : []),
    '  │  Quick tunnels are unauthenticated, change every run, and are',
    '  │  not for production use.',
    '  └──────────────────────────────────────────────────────────────',
    '',
  ];
  log(lines.join('\n'));

  if (opts.qr !== false) {
    // qrcode-terminal is only pulled in on this code path (ambient types live
    // in src/qrcode-terminal.d.ts).
    const qrcode = (await import('qrcode-terminal')).default;
    await new Promise<void>((resolve) => {
      qrcode.generate(deepLink, { small: true }, (out) => {
        log(out);
        resolve();
      });
    });
  }
}

/** Handle returned by {@link startTunnelDashboard}. */
export interface TunnelDashboard {
  /** `http://127.0.0.1:<port>` — the local dashboard URL opened in the browser. */
  url: string;
  /** Tear down the local HTTP server. Idempotent via the underlying server. */
  close: () => Promise<void>;
}

export interface StartTunnelDashboardOptions {
  /** The public `https://*.trycloudflare.com` app tunnel URL the launcher frames. */
  tunnelUrl: string;
  /** The `wss://` relay URL of the env-2 CDP tunnel. REQUIRED — the dashboard is a CDP-only UX. */
  relayWssUrl: string;
  /** Mirror of `tunnel.qr` — when `false` the dashboard is skipped (no browser open). */
  qr?: boolean;
  /**
   * Override the GUI/opt-out gate (testing only). When omitted the real
   * `canOpenBrowser()` + `AIT_AUTO_DEVTOOLS` checks decide.
   */
  shouldOpen?: () => boolean;
  /** Sink for the one-line "opened in browser" note (default: `console.log`). Injected for testing. */
  log?: (msg: string) => void;
  /**
   * Human-readable app name to embed as `name=` in the launcher deep-link (#498).
   * When provided (non-blank), the launcher partner bar shows this name instead of
   * the generic default.
   */
  name?: string;
}

/**
 * Env-2 UX parity with env 3 (issue #408): when CDP wiring is on and a GUI is
 * available, start the SAME `127.0.0.1` HTML dashboard (QR image + connect steps
 * + FAQ) the debug daemon's `start_attach` path serves, and auto-open it in the
 * browser. headless / opt-out falls back to the terminal ASCII QR (printed
 * separately by {@link printTunnelBanner}).
 *
 * DELEGATED (issue #817): the implementation now lives in `@ait-co/debugger`'s
 * `/dev-bridge` subpath — the one cross-repo code delegation of the package
 * split. The dashboard needs the daemon's QR HTTP server, deep-link builder and
 * TOTP minting, all of which moved into that package; keeping a second copy here
 * would fork them. `@ait-co/debugger` is an OPTIONAL peer, so a consumer who
 * never asks for env-2 CDP installs nothing extra.
 *
 * Why this is not a separate plugin: the relay `wss://` URL must exist BEFORE
 * the QR banner is printed (the launcher QR carries `&relay=`), so the relay and
 * the dashboard are order-dependent and stay one composed call in the dev loop.
 *
 * Degradation: when `@ait-co/debugger` is not installed the import fails and we
 * return `undefined` — exactly the same "no dashboard" outcome as a closed GUI
 * gate, with the terminal ASCII QR standing alone. We do NOT fall back to a
 * local copy of the daemon code. The caller (`./index.ts`) prints the install
 * hint once when CDP was requested without the package.
 *
 * SECRET-HANDLING: the tunnel host, relay wssUrl, TOTP code, and `.ait_relay`
 * value/path are NEVER written to stdout/stderr/logs — neither here nor in the
 * delegate. The only thing opened/logged is `http://127.0.0.1:<port>` (local).
 *
 * @returns the dashboard handle when it started (caller wires `close()` into the
 *   tunnel cleanup), or `undefined` when skipped (package absent, no relay,
 *   `qr:false`, headless, opt-out, or a start failure) — in which case the ASCII
 *   QR fallback stands alone.
 */
export async function startTunnelDashboard(
  opts: StartTunnelDashboardOptions,
): Promise<TunnelDashboard | undefined> {
  // Gate: dashboard is a CDP-only UX (needs a relay to attach to). Checked here
  // as well as in the delegate so an absent relay never even probes the package.
  if (!opts.relayWssUrl) return undefined;
  // Opt-out via `tunnel.qr:false` (same toggle that suppresses the ASCII QR).
  if (opts.qr === false) return undefined;

  let devBridge: { startTunnelDashboard: typeof startTunnelDashboard };
  try {
    devBridge = (await import(DEBUGGER_DEV_BRIDGE_ID)) as {
      startTunnelDashboard: typeof startTunnelDashboard;
    };
  } catch {
    // Not installed (or an unexpected load failure) — degrade to ASCII QR only.
    // SECRET-HANDLING: the error is not surfaced (it can embed local paths).
    return undefined;
  }
  return devBridge.startTunnelDashboard(opts);
}

export interface QuickTunnel {
  /** The public `https://*.trycloudflare.com` URL. */
  url: string;
  /** Stop the underlying `cloudflared` process. Idempotent. */
  stop: () => void;
}

/**
 * Sanitize cloudflared stderr output for error diagnostics (#421).
 *
 * Masks `*.trycloudflare.com` hostnames and full `https://` / `wss://` URLs
 * that carry those hostnames so tunnel host values never appear in error
 * messages. Diagnostic content (error codes, reasons, JSON blobs) is preserved.
 *
 * SECRET-HANDLING: tunnel host is SECRET-class per harness policy — only
 * placeholder text is emitted.
 */
export function sanitizeCloudflaredOutput(line: string): string {
  // Full URL forms: https://xxx.trycloudflare.com/… and wss://xxx.trycloudflare.com/…
  let s = line.replace(/(?:https?|wss?):\/\/[a-z0-9-]+\.trycloudflare\.com(?:\/[^\s]*)*/gi, (m) =>
    m.replace(/[a-z0-9-]+\.trycloudflare\.com/i, '<HOST>.trycloudflare.com'),
  );
  // Bare hostname without scheme (e.g. printed in cloudflared JSON logs)
  s = s.replace(/[a-z0-9-]+\.trycloudflare\.com/gi, '<HOST>.trycloudflare.com');
  return s;
}

const URL_TIMEOUT_MS = 20_000;

/**
 * Start an unauthenticated Cloudflare quick tunnel to `http://localhost:<port>`
 * and resolve once the public URL is known. Downloads the `cloudflared` binary
 * on first use if it is not already installed. Rejects with a friendly error if
 * no URL appears within {@link URL_TIMEOUT_MS}.
 */
export async function startQuickTunnel(port: number): Promise<QuickTunnel> {
  const cloudflared = await import('cloudflared');
  const { bin, install, Tunnel } = cloudflared;

  if (!existsSync(bin)) {
    await mkdir(dirname(bin), { recursive: true });
    await install(bin);
  }

  const tunnel = Tunnel.quick(`http://localhost:${port}`);
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    try {
      tunnel.stop();
    } catch {
      // process may already be gone
    }
  };

  return new Promise<QuickTunnel>((resolve, reject) => {
    // #421: accumulate stderr to attach as diagnostics on failure.
    // SECRET-HANDLING: lines are sanitized before inclusion in error messages.
    const stderrLines: string[] = [];

    /**
     * Format the last `n` sanitized stderr lines as a diagnostic appendix.
     * Returns an empty string when no lines have been collected.
     */
    const stderrTail = (n = 15): string => {
      if (stderrLines.length === 0) return '';
      const tail = stderrLines.slice(-n).map(sanitizeCloudflaredOutput).join('');
      return `\ncloudflared 출력 (마지막 ${Math.min(n, stderrLines.length)}줄):\n${tail}`;
    };

    const timer = setTimeout(() => {
      cleanup();
      stop();
      reject(
        new Error(
          `[@ait-co/devtools] cloudflared did not report a tunnel URL within ${
            URL_TIMEOUT_MS / 1000
          }s. Check your network connection, or run \`cloudflared tunnel --url http://localhost:${port}\` manually.${stderrTail()}`,
        ),
      );
    }, URL_TIMEOUT_MS);

    const onUrl = (line: string) => {
      const found = parseTrycloudflareUrl(line);
      if (!found) return;
      clearTimeout(timer);
      // Stop scanning further output once we have the URL.
      cleanup();
      resolve({ url: found, stop });
    };

    // Accumulate stderr lines for diagnostics (#421). Named so it can be
    // removed from the listener list when cleanup() runs.
    const pushStderr = (line: string) => {
      stderrLines.push(line);
    };

    const cleanup = () => {
      tunnel.off('stdout', onUrl);
      tunnel.off('stderr', onUrl);
      tunnel.off('stderr', pushStderr);
    };

    // The library emits a parsed `url` event; we also scan raw stdout/stderr in
    // case the output format shifts.
    tunnel.once('url', onUrl);
    tunnel.on('stdout', onUrl);
    tunnel.on('stderr', onUrl);
    // Second stderr listener: accumulate all lines for error diagnostics.
    tunnel.on('stderr', pushStderr);
    tunnel.once('error', (err: Error) => {
      clearTimeout(timer);
      cleanup();
      stop();
      reject(err);
    });
    tunnel.once('exit', (code: number | null) => {
      if (stopped) return;
      clearTimeout(timer);
      cleanup();
      reject(
        new Error(
          `[@ait-co/devtools] cloudflared exited (code ${code ?? 'null'}) before reporting a tunnel URL.${stderrTail()}`,
        ),
      );
    });
  });
}
