/**
 * Optional-peer resolution gates for the debug surface (issue #817).
 *
 * The debug surface now ships as two SEPARATE packages, declared here as
 * OPTIONAL peerDependencies of `@ait-co/devtools`:
 *
 *   - `@ait-co/debugger`      — MCP daemon / test runner / dev-bridge. devDependency
 *                               or `npx` only; never part of an app bundle.
 *   - `@ait-co/debug-console` — on-device attach + eruda console. The ONLY debug
 *                               package that can legitimately enter an app bundle.
 *
 * Neither may become a hard dependency. The overwhelming majority of consumers
 * use environment 1 only (browser + mock SDK + panel) and must install NOTHING
 * extra — that is the whole point of splitting the packages apart. So every
 * call site reaches them through the resolution gates below and degrades
 * gracefully when they are absent:
 *
 *   - env-2 CDP wiring (`tunnel.cdp`) → falls back to the plain screen-preview
 *     tunnel (no relay, no dashboard) and prints {@link INSTALL_HINT}.
 *   - in-app attach injection → the snippet is simply not injected, so the
 *     attach code is STRUCTURALLY ABSENT from the bundle rather than merely
 *     gated at runtime. This gate is the technical enforcement point of the
 *     debug surface's security scope: no `@ait-co/debug-console` installed
 *     means no attach code can reach a bundle at all.
 *
 * The `import.meta.resolve` probe follows the `MOCK_PATH` precedent in
 * `./index.ts`: resolution is attempted once at plugin-load time and a failure
 * is a plain "not installed" signal, never an error.
 *
 * SECRET-HANDLING: nothing here touches a relay URL, tunnel host, TOTP secret
 * or code. The only strings emitted are fixed specifiers and the install hint.
 */

/** Subpath of `@ait-co/debugger` that the unplugin's dev loop delegates to. */
export const DEBUGGER_DEV_BRIDGE_ID = '@ait-co/debugger/dev-bridge';

/** The on-device attach package injected into a consumer entry point. */
export const DEBUG_CONSOLE_ID = '@ait-co/debug-console';

/**
 * The pre-split in-app specifier. Still recognised for DEDUPE only — a consumer
 * who wired `@ait-co/devtools/in-app` by hand must not also receive the new
 * auto-injected snippet. It is never injected any more.
 */
export const LEGACY_IN_APP_ID = '@ait-co/devtools/in-app';

/** One-line install hint printed whenever a gate closes on a missing package. */
export const INSTALL_HINT = 'pnpm add -D @ait-co/debugger @ait-co/debug-console';

/**
 * Returns whether `specifier` resolves from this package's location.
 *
 * `import.meta.resolve` throws (rather than returning a falsy value) for an
 * unresolvable specifier, and is itself absent on a few older runtimes — both
 * are treated as "not installed", which is the safe direction: the caller then
 * takes the degraded path instead of importing something that is not there.
 */
export function canResolveOptionalPeer(specifier: string): boolean {
  try {
    return typeof import.meta.resolve(specifier) === 'string';
  } catch {
    return false;
  }
}

/** Whether `@ait-co/debugger`'s dev-bridge is installed (env-2 CDP path). */
export function hasDebugger(): boolean {
  return canResolveOptionalPeer(DEBUGGER_DEV_BRIDGE_ID);
}

/** Whether `@ait-co/debug-console` is installed (in-app attach injection). */
export function hasDebugConsole(): boolean {
  return canResolveOptionalPeer(DEBUG_CONSOLE_ID);
}

/**
 * Whether `code` already wires the in-app debug attach itself.
 *
 * Both the current (`@ait-co/debug-console`) and the pre-split
 * (`@ait-co/devtools/in-app`) specifier count, so a consumer who wired either
 * one by hand never gets a duplicate auto-injection.
 */
export function hasInAppWiring(code: string): boolean {
  return code.includes(DEBUG_CONSOLE_ID) || code.includes(LEGACY_IN_APP_ID);
}

/**
 * The gated dynamic-import snippet prepended to a consumer entry point.
 *
 * The runtime gate (`?debug=1` + a `relay` param) keeps the chunk unloaded on a
 * normal page load, and a production build dead-code-eliminates it. The
 * build-time gate is {@link hasDebugConsole} at the call site: when the package
 * is absent this snippet is never produced, so the attach code cannot be in the
 * bundle at all.
 */
export function buildInAppSnippet(): string {
  return [
    '// @ait-co/devtools: in-app attach auto-injected by unplugin — 수동 배선 불필요',
    "if (typeof window !== 'undefined') {",
    '  const __ait_p = new URLSearchParams(window.location.search);',
    "  if (__ait_p.get('debug') === '1' && __ait_p.get('relay')) {",
    `    void import('${DEBUG_CONSOLE_ID}').then((m) => m.maybeAttach());`,
    '  }',
    '}',
  ].join('\n');
}
