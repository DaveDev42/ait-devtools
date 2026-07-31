/**
 * TRANSITION STUB — REMOVE IN 1.0.0.
 *
 * `@ait-co/devtools/mcp/cli` moved to `@ait-co/debugger/mcp/cli` (#818).
 *
 * Throws at module evaluation — terminal-only entry, see `src/stubs/moved.ts`.
 */

import { DEBUGGER_PACKAGE, movedMessage } from './moved.js';

throw new Error(
  movedMessage(
    '@ait-co/devtools/mcp/cli',
    `${DEBUGGER_PACKAGE}/mcp/cli`,
    `pnpm add -D ${DEBUGGER_PACKAGE}`,
  ),
);
