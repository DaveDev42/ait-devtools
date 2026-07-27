import { describe, expect, it } from 'vitest';
import {
  buildInAppSnippet,
  canResolveOptionalPeer,
  DEBUG_CONSOLE_ID,
  DEBUGGER_DEV_BRIDGE_ID,
  hasDebugConsole,
  hasDebugger,
  hasInAppWiring,
  INSTALL_HINT,
  LEGACY_IN_APP_ID,
} from '../unplugin/optional-peers.js';
import { startTunnelDashboard } from '../unplugin/tunnel.js';

// ---------------------------------------------------------------------------
// Optional-peer resolution gates (#817)
//
// The two debug packages (`@ait-co/debugger`, `@ait-co/debug-console`) are
// OPTIONAL peers: a consumer who only uses environment 1 (browser + mock SDK +
// panel) must install neither, and every call site has to degrade rather than
// throw. These tests pin the probe's semantics and the two pure helpers the
// transform hook depends on.
// ---------------------------------------------------------------------------

describe('canResolveOptionalPeer', () => {
  it('returns true for a package that is installed', () => {
    // vitest itself is always present in this repo's dev graph.
    expect(canResolveOptionalPeer('vitest')).toBe(true);
  });

  it('returns false (never throws) for a package that is absent', () => {
    expect(canResolveOptionalPeer('@ait-co/definitely-not-installed-xyz')).toBe(false);
  });

  it('returns false (never throws) for a subpath outside a package exports map', () => {
    expect(canResolveOptionalPeer('vitest/definitely-not-an-export')).toBe(false);
  });

  it('both debug packages resolve in this repo (devDependencies)', () => {
    // The repo installs both so the fixtures / e2e exercise the wired path.
    // A consumer without them takes the degraded path instead.
    expect(hasDebugger()).toBe(true);
    expect(hasDebugConsole()).toBe(true);
  });
});

describe('hasInAppWiring (dedupe)', () => {
  it('recognises the current specifier', () => {
    expect(hasInAppWiring(`import('${DEBUG_CONSOLE_ID}')`)).toBe(true);
  });

  it('recognises the pre-split specifier so a hand-wired consumer is not doubled', () => {
    expect(hasInAppWiring(`import('${LEGACY_IN_APP_ID}')`)).toBe(true);
  });

  it('returns false for an entry point with no debug wiring', () => {
    expect(hasInAppWiring("import './app.js';\ncreateRoot(el).render(<App />);")).toBe(false);
  });
});

describe('buildInAppSnippet', () => {
  it('injects the debug-console specifier behind the runtime gate', () => {
    const snippet = buildInAppSnippet();
    expect(snippet).toContain(`import('${DEBUG_CONSOLE_ID}')`);
    expect(snippet).toContain("get('debug') === '1'");
    expect(snippet).toContain("get('relay')");
    expect(snippet).toContain('maybeAttach');
  });

  it('is idempotent under its own dedupe predicate', () => {
    expect(hasInAppWiring(buildInAppSnippet())).toBe(true);
  });
});

describe('INSTALL_HINT', () => {
  it('names both optional peers in one copy-pasteable command', () => {
    expect(INSTALL_HINT).toContain('@ait-co/debugger');
    expect(INSTALL_HINT).toContain('@ait-co/debug-console');
  });
});

// ---------------------------------------------------------------------------
// startTunnelDashboard delegation (#817)
//
// The dashboard implementation now lives in `@ait-co/debugger/dev-bridge`. The
// wrapper keeps the cheap local gates (no relay / qr:false) so an absent relay
// never probes the package at all, then forwards. The full dashboard behaviour
// (GUI gate, served HTML, TOTP freshness, SECRET-HANDLING) is covered by
// unplugin-tunnel.test.ts against the delegated implementation.
// ---------------------------------------------------------------------------

describe('startTunnelDashboard delegation', () => {
  it('delegates to the @ait-co/debugger dev-bridge subpath', () => {
    expect(DEBUGGER_DEV_BRIDGE_ID).toBe('@ait-co/debugger/dev-bridge');
  });

  it('short-circuits before probing the package when no relay is wired', async () => {
    await expect(
      startTunnelDashboard({ tunnelUrl: 'https://example.invalid', relayWssUrl: '' }),
    ).resolves.toBeUndefined();
  });

  it('short-circuits before probing the package when qr:false', async () => {
    await expect(
      startTunnelDashboard({
        tunnelUrl: 'https://example.invalid',
        relayWssUrl: 'wss://example.invalid',
        qr: false,
      }),
    ).resolves.toBeUndefined();
  });
});
