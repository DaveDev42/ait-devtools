/**
 * Project-local ephemeral URL store — WRITE/DELETE half (#424, relocated #818).
 *
 * Environment-2 ("AITC Sandbox PWA") cold-start needs two ephemeral URLs that
 * change on every run: the CDP relay's https base and the app tunnel's https
 * base. Rather than making the developer copy-paste them into env vars each
 * time, the dev server writes them to `<project>/.ait_urls` and the MCP daemon
 * (`@ait-co/debugger`) discovers them from there.
 *
 * Why this module is here and not in `@ait-co/debugger`: the writer IS the vite
 * dev-server plugin. `@ait-co/debugger` owns the READ half only — its daemon
 * reads `.ait_urls` read-only and never writes it. Splitting the file that way
 * matches who is allowed to mutate it, and it keeps the write path available
 * when `@ait-co/debugger` is not installed at all. The file format is the
 * contract between the two packages; changing it requires changing both sides.
 *
 * Kept deliberately minimal compared with the pre-split `src/mcp/relay-url-store.ts`
 * (that module now lives in `@ait-co/debugger` as
 * `packages/debugger/src/mcp/relay-url-store.ts`):
 * the read path (`readRelayUrls`) moved out with the daemon, so only
 * {@link writeRelayUrls} and {@link deleteRelayUrls} remain.
 *
 * SECRET-HANDLING: `relayBaseUrl` and `tunnelBaseUrl` carry the tunnel host —
 * the same sensitivity class as the `.ait_relay` TOTP secret. The raw values,
 * partial values, and the resolved file path MUST NOT appear in any log, error
 * message, stdout, stderr, or assertion output here or at any call site. Only
 * boolean pass/fail signals are safe to surface. The file is written mode 0600.
 */

import { dirname, join } from 'node:path';

/** Project-local ephemeral URL file name (single file, not a directory). */
export const URLS_FILE_NAME = '.ait_urls';

/** Minimal fs subset needed by {@link writeRelayUrls} — injectable for tests. */
export interface RelayUrlWriteFs {
  writeFileSync(path: string, data: string, options: { mode: number; flag: string }): void;
  existsSync(path: string): boolean;
}

/** Minimal fs subset needed by {@link deleteRelayUrls} — injectable for tests. */
export interface RelayUrlDeleteFs {
  existsSync(path: string): boolean;
  unlinkSync(path: string): void;
}

/**
 * Walks upward from `start` and returns the nearest directory containing a
 * `package.json`. Falls back to `start` when none is found, so a write still
 * lands somewhere deterministic.
 *
 * The writer (this module) and the reader (`@ait-co/debugger`'s daemon) use the
 * SAME anchor rule, so URLs written by `pnpm dev` are the ones the daemon finds:
 * real mini-apps keep `vite.config.ts` and `package.json` in one directory, so
 * `server.config.root === package.json-dir`. In a monorepo subdir the anchor is
 * the package's own directory — the one the daemon also reaches via its
 * per-session projectRoot.
 */
export function nearestPackageJsonDir(
  start: string,
  existsSyncFn: (path: string) => boolean,
): string {
  let dir = start;
  // Stop at the filesystem root (dirname of root === root).
  while (true) {
    if (existsSyncFn(join(dir, 'package.json'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return start;
    dir = parent;
  }
}

/**
 * Absolute path to the project-local `.ait_urls` file for a given start
 * directory (resolved against the nearest package.json directory).
 *
 * Exported so tests can compute the expected path without duplicating the
 * resolution logic.
 */
export function urlsFilePath(start: string, existsSyncFn: (path: string) => boolean): string {
  return join(nearestPackageJsonDir(start, existsSyncFn), URLS_FILE_NAME);
}

export interface WriteRelayUrlsDeps {
  /** Project root (typically Vite `server.config.root`). */
  projectRoot: string;
  /**
   * The CDP relay's https base URL. Omit when the relay was not started.
   * SECRET-HANDLING: never log this value.
   */
  relayBaseUrl?: string;
  /**
   * The CDP relay's LOCAL http base URL (`http://127.0.0.1:<relay-port>`), used
   * by the daemon to build the Chii inspector URL without a tunnel round-trip
   * (issue #530). Loopback only — no tunnel host, safe to surface.
   */
  relayLocalUrl?: string;
  /**
   * The app tunnel's https base URL. Omit when unavailable.
   * SECRET-HANDLING: never log this value.
   */
  tunnelBaseUrl?: string;
  /** Filesystem operations. Defaults to node:fs synchronous functions. */
  fs?: RelayUrlWriteFs;
  /** existsSync used to resolve the nearest package.json directory. Defaults to node:fs. */
  existsSync?: (path: string) => boolean;
}

/**
 * Writes the present URL keys to `<projectRoot>/.ait_urls` (mode 0600),
 * overwriting (`flag: 'w'`) because the URLs are ephemeral — a fresh URL
 * replaces the previous one on every boot.
 *
 * Unlike the `.ait_relay` secret store this does NOT use `O_EXCL` (`'wx'`):
 * only the dev server writes this file, so there is no race to guard, and the
 * value must be fresh on every cold-start.
 *
 * SECRET-HANDLING: URL values are never logged.
 */
export async function writeRelayUrls(deps: WriteRelayUrlsDeps): Promise<void> {
  const {
    projectRoot,
    relayBaseUrl,
    relayLocalUrl,
    tunnelBaseUrl,
    fs: fsDep,
    existsSync: existsSyncDep,
  } = deps;

  const fs: RelayUrlWriteFs = fsDep ?? (await import('node:fs'));
  const existsSyncFn: (path: string) => boolean = existsSyncDep ?? fs.existsSync;

  const filePath = urlsFilePath(projectRoot, existsSyncFn);

  // Build the payload — omit keys whose values are absent or blank.
  const payload: { relayBaseUrl?: string; relayLocalUrl?: string; tunnelBaseUrl?: string } = {};
  if (typeof relayBaseUrl === 'string' && relayBaseUrl !== '') payload.relayBaseUrl = relayBaseUrl;
  if (typeof relayLocalUrl === 'string' && relayLocalUrl !== '') {
    payload.relayLocalUrl = relayLocalUrl;
  }
  if (typeof tunnelBaseUrl === 'string' && tunnelBaseUrl !== '') {
    payload.tunnelBaseUrl = tunnelBaseUrl;
  }

  // SECRET-HANDLING: the JSON content (which includes URL values) goes to the
  // file only — never to any log, stdout, or stderr.
  fs.writeFileSync(filePath, JSON.stringify(payload), { mode: 0o600, flag: 'w' });
}

export interface DeleteRelayUrlsDeps {
  /** Project root. */
  projectRoot: string;
  /** Filesystem operations. Defaults to node:fs (existsSync + unlinkSync). */
  fs?: RelayUrlDeleteFs;
  /** existsSync used to resolve the nearest package.json directory. */
  existsSync?: (path: string) => boolean;
}

/**
 * Removes `<projectRoot>/.ait_urls` if present, swallowing every error so
 * cleanup always succeeds.
 *
 * Called from the unplugin's `cleanup()` on `httpServer 'close'` + signals. A
 * stale `.ait_urls` pointing at a dead tunnel would make the daemon attempt a
 * doomed attach on the next cold-start — deletion is non-negotiable.
 *
 * SECRET-HANDLING: the file path is never logged.
 */
export async function deleteRelayUrls(deps: DeleteRelayUrlsDeps): Promise<void> {
  const { projectRoot, fs: fsDep, existsSync: existsSyncDep } = deps;

  const fs: RelayUrlDeleteFs = fsDep ?? (await import('node:fs'));
  const existsSyncFn: (path: string) => boolean = existsSyncDep ?? fs.existsSync;

  const filePath = urlsFilePath(projectRoot, existsSyncFn);

  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // Swallow ENOENT and any other error — cleanup is best-effort.
    // SECRET-HANDLING: the path is not logged.
  }
}
