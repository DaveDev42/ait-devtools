/**
 * TRANSITION STUB — REMOVE IN 1.0.0.
 *
 * The `devtools-test` bin moved to `@ait-co/debugger`, where it is named
 * `debugger-test` (#818). See `src/stubs/bin-devtools-mcp.ts` for why the
 * rename is what makes a stub bin safe to keep.
 *
 * Prints the migration notice to stderr and exits non-zero so a CI step still
 * calling the old bin fails loudly instead of reporting a vacuous success.
 */

import { DEBUGGER_PACKAGE, movedMessage } from './moved.js';

process.stderr.write(
  `${movedMessage('devtools-test', `${DEBUGGER_PACKAGE} (bin: debugger-test)`, `pnpm add -D ${DEBUGGER_PACKAGE}`)}\n`,
);
process.exit(1);
