/**
 * TRANSITION STUB — REMOVE IN 1.0.0.
 *
 * `@ait-co/devtools/mcp/server` moved to `@ait-co/debugger/mcp/server` (#818).
 *
 * Throws at module evaluation: this entry only ever loads inside a developer's
 * MCP host / terminal, never in a shipped app bundle, so failing immediately
 * and loudly is the helpful behaviour. Contrast with `src/stubs/in-app.ts`,
 * which must not throw.
 */

import { DEBUGGER_PACKAGE, movedMessage } from './moved.js';

throw new Error(
  movedMessage(
    '@ait-co/devtools/mcp/server',
    `${DEBUGGER_PACKAGE}/mcp/server`,
    `pnpm add -D ${DEBUGGER_PACKAGE}`,
  ),
);
