/**
 * TRANSITION STUB — REMOVE IN 1.0.0.
 *
 * The `devtools-mcp` bin moved to `@ait-co/debugger`, where it is named
 * `debugger` (#818). The rename is why this stub can exist at all: had the new
 * package kept the old bin name, both packages installed side by side would
 * fight over the same `node_modules/.bin/devtools-mcp` symlink and whichever
 * won would be arbitrary. Different names, no collision.
 *
 * Prints the migration notice to stderr (not stdout — an MCP host may be
 * reading stdout as a JSON-RPC stream) and exits non-zero so a script that
 * still calls the old bin fails rather than silently continuing.
 */

import { DEBUGGER_PACKAGE, movedMessage } from './moved.js';

process.stderr.write(
  `${movedMessage('devtools-mcp', `${DEBUGGER_PACKAGE} (bin: debugger)`, `pnpm add -D ${DEBUGGER_PACKAGE}`)}\n`,
);
process.exit(1);
