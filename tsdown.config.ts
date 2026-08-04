import { defineConfig, type Options } from 'tsdown';
import pkg from './package.json' with { type: 'json' };

// __VERSION__ is defined in all entries so any source file can reference it as
// a bare identifier (NOT via `globalThis` — `define` only substitutes the bare
// token; a `globalThis.__VERSION__` property access reads `undefined`, the root
// cause of issue #361).
//
// The former `__MCP_SDK_VERSION__` define went away with the MCP daemon (#818):
// it reported `@modelcontextprotocol/sdk`'s version, and that package is now
// `@ait-co/debugger`'s dependency, not this one's.
//
// Note: there is no `__DEBUG_BUILD__` define here either. That constant belongs
// to the CONSUMER's build, not this package's — the consumer folds it in their
// own bundler to DCE their `import('@ait-co/debug-console')` call site.
const define = {
  __VERSION__: JSON.stringify(pkg.version),
};

// `package.json` exports expect `.js` (ESM) and `.cjs` (CJS) extensions,
// so override tsdown's default `.mjs` / `.cjs` mapping under `"type": "module"`.
const outExtensions: Options['outExtensions'] = ({ format }) => {
  if (format === 'cjs') return { js: '.cjs', dts: '.d.cts' };
  return { js: '.js', dts: '.d.ts' };
};

// Each entry lives in its own config object so Rolldown does not emit a
// shared hashed chunk at `dist/` root (every entry is self-contained).
const common = {
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  outExtensions,
  define,
} as const;

export default defineConfig([
  {
    ...common,
    entry: { 'mock/index': 'src/mock/index-3x.ts' },
    format: ['esm'],
  },
  {
    ...common,
    entry: { 'mock/2x': 'src/mock/index-2x.ts' },
    format: ['esm'],
  },
  {
    ...common,
    entry: { 'mock/3x': 'src/mock/index-3x.ts' },
    format: ['esm'],
  },
  {
    ...common,
    // Panel is a client-side React 19 tree (JSX). React is BUNDLED here (no
    // `external`), so the published `dist/panel/index.js` is self-contained and
    // react never reaches consumers' graphs or this package's `dependencies`.
    entry: { 'panel/index': 'src/panel/index.tsx' },
    format: ['esm'],
  },
  {
    ...common,
    entry: { 'unplugin/index': 'src/unplugin/index.ts' },
    format: ['esm', 'cjs'],
  },
  {
    // Lazy-loaded by unplugin/index only when the `tunnel` option is on, so the
    // cloudflared / qrcode-terminal deps stay off the graph otherwise.
    ...common,
    entry: { 'unplugin/tunnel': 'src/unplugin/tunnel.ts' },
    format: ['esm', 'cjs'],
  },
  // ── Transition stubs (#818) — REMOVE IN 1.0.0 ───────────────────────────────
  // The debug surface moved to `@ait-co/debugger` / `@ait-co/debug-console`.
  // These entries exist only so a stale import lands on a migration message
  // instead of a bare resolver error. The `/mcp/*` + `/test-runner` stubs throw;
  // the `/in-app*` stubs must NOT (they can be in a shipped app bundle).
  {
    ...common,
    platform: 'node',
    entry: { 'mcp/server': 'src/stubs/mcp-server.ts' },
    format: ['esm'],
  },
  {
    ...common,
    platform: 'node',
    entry: { 'mcp/cli': 'src/stubs/mcp-cli.ts' },
    format: ['esm'],
  },
  {
    ...common,
    platform: 'node',
    entry: { 'test-runner/config': 'src/stubs/test-runner.ts' },
    format: ['esm'],
  },
  {
    ...common,
    entry: { 'in-app/index': 'src/stubs/in-app.ts' },
    format: ['esm'],
  },
  {
    ...common,
    entry: { 'in-app/auto': 'src/stubs/in-app-auto.ts' },
    format: ['esm'],
  },
  {
    ...common,
    // Old `devtools-mcp` bin. Shebang via banner only — the source must not
    // carry its own or the build emits a doubled shebang (line 2 then parses as
    // invalid syntax and the bin fails to start).
    platform: 'node',
    entry: { 'stubs/bin-devtools-mcp': 'src/stubs/bin-devtools-mcp.ts' },
    format: ['esm'],
    banner: { js: '#!/usr/bin/env node' },
  },
  {
    ...common,
    // Old `devtools-test` bin. Shebang via banner only — see the note above.
    platform: 'node',
    entry: { 'stubs/bin-devtools-test': 'src/stubs/bin-devtools-test.ts' },
    format: ['esm'],
    banner: { js: '#!/usr/bin/env node' },
  },
]);
