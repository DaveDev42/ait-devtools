/**
 * Unit tests for the project-local ephemeral URL store's WRITE/DELETE half
 * (#424 file-based runtime-URL discovery; relocated to `src/unplugin/` in #818
 * because the vite dev-server plugin is the only writer — the READ half moved
 * out with the MCP daemon into `@ait-co/debugger`).
 *
 * All tests use injected stubs — no real disk I/O. The repo root contains a
 * package.json, so every test MUST inject `projectRoot` + a stub
 * `existsSync`/`fs` to avoid short-circuiting on the real filesystem.
 *
 * SECRET-HANDLING: URL values carry the relay/tunnel host — the same
 * sensitivity class as the relay secret. Only test-fixture URLs appear here.
 */

import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  deleteRelayUrls,
  nearestPackageJsonDir,
  type RelayUrlDeleteFs,
  type RelayUrlWriteFs,
  URLS_FILE_NAME,
  urlsFilePath,
  writeRelayUrls,
} from '../unplugin/relay-url-store.js';

const PROJECT_ROOT = '/home/testuser/my-mini-app';
const URLS_PATH = join(PROJECT_ROOT, URLS_FILE_NAME);

// Fixture URLs — test-only values, never real tunnel hosts.
const RELAY_URL = 'https://relay-test.trycloudflare.com';
const RELAY_LOCAL_URL = 'http://127.0.0.1:45231';
const TUNNEL_URL = 'https://tunnel-test.trycloudflare.com';

/** existsSync that reports a package.json only in the listed directories. */
function makeProjectExistsSync(packageJsonDirs: string[] = [PROJECT_ROOT]) {
  return (path: string): boolean => packageJsonDirs.some((d) => path === join(d, 'package.json'));
}

interface WriteFsCaptures {
  _written: Map<string, { data: string; options: { mode: number; flag: string } }>;
}

function makeWriteFs(): RelayUrlWriteFs & WriteFsCaptures {
  const files = new Map<string, string>();
  const written = new Map<string, { data: string; options: { mode: number; flag: string } }>();
  return {
    _written: written,
    writeFileSync(path, data, options) {
      files.set(path, data);
      written.set(path, { data, options });
    },
    existsSync: (path) => files.has(path),
  };
}

function makeDeleteFs(files: Map<string, string>): RelayUrlDeleteFs & { _unlinked: string[] } {
  const unlinked: string[] = [];
  return {
    _unlinked: unlinked,
    existsSync: (path) => files.has(path),
    unlinkSync(path) {
      if (!files.has(path)) {
        throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
      }
      files.delete(path);
      unlinked.push(path);
    },
  };
}

describe('nearestPackageJsonDir', () => {
  it('walks upward to the closest directory holding a package.json', () => {
    const start = join(PROJECT_ROOT, 'src', 'deep', 'nested');
    expect(nearestPackageJsonDir(start, makeProjectExistsSync())).toBe(PROJECT_ROOT);
  });

  it('prefers the nearest package.json in a monorepo sub-package', () => {
    const pkgDir = join(PROJECT_ROOT, 'packages', 'app');
    const start = join(pkgDir, 'src');
    const existsSync = makeProjectExistsSync([PROJECT_ROOT, pkgDir]);
    expect(nearestPackageJsonDir(start, existsSync)).toBe(pkgDir);
  });

  it('falls back to the start dir when no package.json exists above it', () => {
    const start = join(PROJECT_ROOT, 'src');
    expect(nearestPackageJsonDir(start, () => false)).toBe(start);
  });
});

describe('urlsFilePath', () => {
  it('joins the nearest package.json dir with .ait_urls', () => {
    const start = join(PROJECT_ROOT, 'packages', 'app', 'src');
    expect(urlsFilePath(start, makeProjectExistsSync([PROJECT_ROOT]))).toBe(URLS_PATH);
  });
});

describe('writeRelayUrls', () => {
  it('writes the present URLs as JSON at mode 0600, overwriting', async () => {
    const fs = makeWriteFs();
    await writeRelayUrls({
      projectRoot: PROJECT_ROOT,
      relayBaseUrl: RELAY_URL,
      relayLocalUrl: RELAY_LOCAL_URL,
      tunnelBaseUrl: TUNNEL_URL,
      fs,
      existsSync: makeProjectExistsSync(),
    });

    const record = fs._written.get(URLS_PATH);
    expect(record).toBeDefined();
    expect(JSON.parse(record?.data ?? '{}')).toEqual({
      relayBaseUrl: RELAY_URL,
      relayLocalUrl: RELAY_LOCAL_URL,
      tunnelBaseUrl: TUNNEL_URL,
    });
    // Overwrite (not O_EXCL) — URLs are ephemeral and refreshed every boot.
    expect(record?.options).toEqual({ mode: 0o600, flag: 'w' });
  });

  it('omits absent and blank keys rather than writing empty strings', async () => {
    const fs = makeWriteFs();
    await writeRelayUrls({
      projectRoot: PROJECT_ROOT,
      relayBaseUrl: '',
      tunnelBaseUrl: TUNNEL_URL,
      fs,
      existsSync: makeProjectExistsSync(),
    });

    expect(JSON.parse(fs._written.get(URLS_PATH)?.data ?? '{}')).toEqual({
      tunnelBaseUrl: TUNNEL_URL,
    });
  });
});

describe('deleteRelayUrls', () => {
  it('unlinks the file when present', async () => {
    const files = new Map<string, string>([[URLS_PATH, '{}']]);
    const fs = makeDeleteFs(files);
    await deleteRelayUrls({
      projectRoot: PROJECT_ROOT,
      fs,
      existsSync: makeProjectExistsSync(),
    });
    expect(fs._unlinked).toEqual([URLS_PATH]);
    expect(files.has(URLS_PATH)).toBe(false);
  });

  it('is a silent no-op when the file is absent', async () => {
    const fs = makeDeleteFs(new Map());
    await expect(
      deleteRelayUrls({ projectRoot: PROJECT_ROOT, fs, existsSync: makeProjectExistsSync() }),
    ).resolves.toBeUndefined();
    expect(fs._unlinked).toEqual([]);
  });

  it('swallows unlink errors so teardown always completes', async () => {
    const fs: RelayUrlDeleteFs = {
      existsSync: () => true,
      unlinkSync() {
        throw new Error('EPERM');
      },
    };
    await expect(
      deleteRelayUrls({ projectRoot: PROJECT_ROOT, fs, existsSync: makeProjectExistsSync() }),
    ).resolves.toBeUndefined();
  });
});
