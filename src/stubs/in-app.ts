/**
 * TRANSITION STUB — REMOVE IN 1.0.0.
 *
 * `@ait-co/devtools/in-app` moved to `@ait-co/debug-console` (#818).
 *
 * **This stub must never throw.** Unlike the `/mcp/*` and `/test-runner`
 * subpaths, the in-app attach surface is the one piece of the old debug
 * surface that legitimately ends up inside a shipped mini-app bundle. A
 * consumer who built and deployed against `@ait-co/devtools@0.1.x` has this
 * import (or an unplugin-injected equivalent) sitting in production code; if
 * upgrading the package turned that import into a throw, their app would die
 * on a real user's phone over a developer-tools concern. So every export here
 * is an inert no-op that says its piece through `console.error` once and
 * returns the shape the old API returned.
 *
 * The surface below mirrors the pre-split `src/in-app/index.ts` exports so a
 * stale call site still type-checks and still runs; it simply does nothing.
 */

import { DEBUG_CONSOLE_PACKAGE, movedMessage } from './moved.js';

const MESSAGE = movedMessage(
  '@ait-co/devtools/in-app',
  DEBUG_CONSOLE_PACKAGE,
  `pnpm add ${DEBUG_CONSOLE_PACKAGE}`,
);

/**
 * Emits the migration notice at most once per module instance.
 *
 * Once, not per call: `maybeAttach()` can sit on a hot path, and a stub whose
 * only job is to be harmless must not turn into a console flood.
 *
 * SECRET-HANDLING: fixed text only — no URL, host, secret, or TOTP code.
 */
let warned = false;
function warnOnce(): void {
  if (warned) return;
  warned = true;
  console.error(MESSAGE);
}

/** Gate decision shape the pre-split module returned. */
export interface GateResult {
  /** Always `false` here — this stub never attaches anything. */
  attach: boolean;
  /** Why the gate did not open. */
  reason: string;
}

/** No-op. The real attach lives in `@ait-co/debug-console`. */
export function maybeAttach(): void {
  warnOnce();
}

/** No-op — there is nothing attached to detach. */
export function detachDebugSurface(): void {
  warnOnce();
}

/** No-op — the WebView type self-report moved with the attach surface. */
export function reportWebViewType(): void {
  warnOnce();
}

/** No-op — the eruda overlay moved with the attach surface. */
export async function mountEruda(): Promise<void> {
  warnOnce();
}

/** No-op counterpart to {@link mountEruda}. */
export function unmountEruda(): void {
  warnOnce();
}

/** No-op — the bridge observer moved with the attach surface. */
export function installBridgeObserver(): void {
  warnOnce();
}

/** No-op counterpart to {@link installBridgeObserver}. */
export function uninstallBridgeObserver(): void {
  warnOnce();
}

/** Always reports a closed gate — nothing can attach from this package. */
export function checkDebugGate(): GateResult {
  warnOnce();
  return { attach: false, reason: 'moved-to-debug-console' };
}
