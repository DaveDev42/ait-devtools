/** Injected by tsdown at build time from package.json version */
declare const __VERSION__: string;

// Note: no `__DEBUG_BUILD__` global is declared here. That is a CONSUMER-build
// constant — the consumer guards `import('@ait-co/debug-console')` with
// `if (__DEBUG_BUILD__)` so their release build DCEs the attach graph. This
// package's own source never references it.
//
// `__MCP_SDK_VERSION__` was removed in #818 along with the MCP daemon: it
// reported `@modelcontextprotocol/sdk`'s version, which is now a dependency of
// `@ait-co/debugger` rather than of this package.

/**
 * Consumer-build constant injected by the devtools unplugin (#580) from the
 * mini-app's `granite.config.ts` `webViewProps.type` (`@default 'partner'`).
 *
 * Like `__DEBUG_BUILD__`, this is a CONSUMER-build define — it does NOT exist
 * in devtools' own build/test runs. Source that reads it MUST guard with
 * `typeof __WEB_VIEW_TYPE__ !== 'undefined'` so a bare reference never throws a
 * ReferenceError where the define was not injected. Declared here only so the
 * `typeof` guard and the read narrow correctly under `tsc --noEmit`.
 *
 * `'external'` is the SDK's deprecated alias of `'partner'` (web-framework
 * 2.6.1); the in-app self-report maps it to `'partner'` before posting.
 */
declare const __WEB_VIEW_TYPE__: 'partner' | 'external' | 'game' | undefined;

interface Window {
  __ait?: import('./mock/state.js').AitStateManager;
}
