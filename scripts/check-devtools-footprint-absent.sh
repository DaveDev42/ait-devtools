#!/usr/bin/env bash
# Build-time absence guard for the devtools runtime footprint (issue #818).
#
# `@ait-co/devtools` is a devDependency whose contribution to a production
# mini-app bundle must be ZERO BYTES. The unplugin runs host-side during the
# build (SDK aliasing, panel injection, tunnel wiring) and the panel is
# consumed behind `import.meta.env.DEV`; a production build must therefore
# dead-code-eliminate the entire mock + panel graph. This script is the
# mechanical proof of that claim.
#
# It replaces the four guards the split (#818) removed along with the surfaces
# they watched — check-debug-surface-absent.sh, check-mcp-react-free.sh,
# check-test-runner-dist.sh and check-dashboard-html-fresh.sh all guarded code
# that now lives in `@ait-co/debugger` / `@ait-co/debug-console`. What is left
# in this package is exactly mock + panel + unplugin, so what is left to guard
# is exactly their footprint.
#
# Three checks:
#   1. This package's own `dist/` carries none of the MOVED implementation.
#      The transition stubs (src/stubs/) deliberately keep the old subpaths
#      alive, so their presence is expected; what must not come back is the
#      implementation behind them — the relay/attach internals, the eruda
#      console, the MCP SDK.
#   2. RELEASE fixture build (minified, `import.meta.env.DEV` false) contains
#      no devtools runtime sentinels — proves DCE works for a real consumer.
#   3. POSITIVE CONTROL: FORCED fixture build (AIT_FOOTPRINT_FORCE=1) DOES
#      contain them — proves the grep can see devtools code when it is present,
#      so a green check 2 means something. Without this, a fixture that
#      silently stopped importing anything would pass check 2 forever.
#
# IMPORTANT: the release build MUST be minified. With minify off, a dead
# `if(false){ … }` husk survives as text and its identifier strings match the
# grep — a false positive. Vite production builds minify by default; do not
# pass --minify=false here.
set -euo pipefail

cd "$(dirname "$0")/.."

# ── Sentinels ────────────────────────────────────────────────────────────────
#
# Runtime footprint (checks 2/3): string literals from the mock and panel that
# survive minification. Identifiers get mangled; these do not.
#   __aitDevtoolsStateSingleton__  mock state singleton key (mock + panel)
#   __ait_device_id               mock storage key (mock + panel)
#   ait-home-indicator            panel CSS class (panel only)
RUNTIME_PATTERN='__aitDevtoolsStateSingleton__|__ait_device_id|ait-home-indicator'

# Moved implementation (check 1): things that exist ONLY in the real debug
# surface, never in the stubs that replaced it.
#
# The third-party packages are matched as QUOTED MODULE SPECIFIERS, not as bare
# words. `dist/` is unminified, so JSDoc survives — and the stubs legitimately
# name `eruda` in prose ("the eruda overlay moved with the attach surface"),
# while the in-app stub still exports `mountEruda`/`unmountEruda` so a stale
# call site keeps type-checking. A bare-word grep fails on correct code; only
# an actual `import 'eruda'` is a regression.
Q="['\"]"
MOVED_PATTERN="deriveTargetScriptUrl|installRelayWsObserver|${Q}eruda${Q}|${Q}@modelcontextprotocol/"

FIXTURE_CONFIG="scripts/footprint-fixture/vite.config.ts"
OUT_DIR="scripts/footprint-fixture/dist/assets"

fail=0

# ── Check 1: this package's dist carries none of the moved implementation ────
if [[ ! -d dist ]]; then
  echo "✗ dist/ missing — run 'pnpm build' first" >&2
  fail=1
elif grep -rlE "$MOVED_PATTERN" dist --include='*.js' --include='*.cjs' >/dev/null 2>&1; then
  echo "✗ SPLIT REGRESSION: dist/ contains moved debug-surface implementation" >&2
  echo "  Files:" >&2
  grep -rlE "$MOVED_PATTERN" dist --include='*.js' --include='*.cjs' | sed 's/^/    /' >&2
  echo "  The relay/attach internals, eruda console and MCP SDK moved to" >&2
  echo "  @ait-co/debugger / @ait-co/debug-console (#818). Only the transition" >&2
  echo "  stubs in src/stubs/ may occupy those subpaths here." >&2
  fail=1
else
  echo "✓ dist/ is free of the moved debug-surface implementation"
fi

# ── Check 2: RELEASE fixture build has zero devtools footprint ───────────────
echo "› Building fixture in RELEASE mode (minified, DEV=false)…"
rm -rf "$OUT_DIR"
NODE_ENV=production pnpm exec vite build --config "$FIXTURE_CONFIG" >/dev/null 2>&1
if [[ ! -d "$OUT_DIR" ]]; then
  echo "✗ $OUT_DIR missing after the release build — the fixture did not build" >&2
  echo "  Re-run without the output redirect to see vite's error." >&2
  fail=1
elif grep -rlE "$RUNTIME_PATTERN" "$OUT_DIR" >/dev/null 2>&1; then
  echo "✗ FOOTPRINT LEAK: release bundle contains devtools runtime code" >&2
  echo "  Files:" >&2
  grep -rlE "$RUNTIME_PATTERN" "$OUT_DIR" | sed 's/^/    /' >&2
  echo "  The mock + panel graph must DCE in production builds. Check the" >&2
  echo "  unplugin's shouldEnable gate and the consumer's import.meta.env.DEV" >&2
  echo "  guard." >&2
  fail=1
else
  echo "✓ release fixture bundle is devtools-free (0 bytes)"
fi

# ── Check 3: POSITIVE CONTROL — forced build DOES carry the footprint ────────
echo "› Building fixture in FORCED mode (AIT_FOOTPRINT_FORCE=1) for positive control…"
rm -rf "$OUT_DIR"
AIT_FOOTPRINT_FORCE=1 NODE_ENV=production pnpm exec vite build --config "$FIXTURE_CONFIG" >/dev/null 2>&1
if [[ ! -d "$OUT_DIR" ]]; then
  echo "✗ $OUT_DIR missing after the forced build — the fixture did not build" >&2
  fail=1
elif grep -rlE "$RUNTIME_PATTERN" "$OUT_DIR" >/dev/null 2>&1; then
  echo "✓ forced fixture bundle contains the devtools footprint (grep is alive)"
else
  echo "✗ POSITIVE-CONTROL FAILURE: forced build has NO devtools footprint" >&2
  echo "  Either the sentinels no longer match the shipped mock/panel code or" >&2
  echo "  the fixture stopped importing the panel. Check 2 above is meaningless" >&2
  echo "  until this passes." >&2
  fail=1
fi

# Leave the tree in the default (release) state.
rm -rf "$OUT_DIR"

exit "$fail"
