/**
 * Shared copy for the transition stubs left behind by the debug-surface split
 * (#818).
 *
 * TRANSITION — REMOVE IN 1.0.0. Everything in `src/stubs/` exists only so a
 * consumer still on a pre-0.2.0 wiring gets a sentence telling them where the
 * code went, instead of a bare `ERR_PACKAGE_PATH_NOT_EXPORTED`. Once 1.0.0
 * drops them, the same import fails with the resolver's own error — which is
 * the correct end state, just a worse first encounter.
 *
 * Two stub shapes, and the difference between them is a safety property, not a
 * style choice:
 *
 *   - Node-side tooling subpaths (`/mcp/server`, `/mcp/cli`, `/test-runner`)
 *     THROW on import. They only ever run in a developer's terminal, so failing
 *     loudly at the earliest possible moment is right.
 *   - The in-app subpaths (`/in-app`, `/in-app/auto`) MUST NOT throw. That code
 *     could be sitting in a shipped production bundle; a throw there takes the
 *     user's mini-app down. They degrade to a no-op plus one `console.error`.
 */

/** The package that now owns the MCP daemon, test runner, and dev bridge. */
export const DEBUGGER_PACKAGE = '@ait-co/debugger';

/** The package that now owns the on-device attach + eruda console. */
export const DEBUG_CONSOLE_PACKAGE = '@ait-co/debug-console';

/**
 * Builds the migration sentence for a moved subpath.
 *
 * SECRET-HANDLING: fixed text plus the two specifiers only — no paths, hosts,
 * URLs, or environment values.
 */
export function movedMessage(oldSubpath: string, newPackage: string, install: string): string {
  return [
    `[@ait-co/devtools] '${oldSubpath}' 는 0.2.0에서 제거되었습니다.`,
    `이 기능은 '${newPackage}' 로 이동했습니다.`,
    `설치: ${install}`,
  ].join(' ');
}
