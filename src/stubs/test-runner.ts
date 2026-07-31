/**
 * TRANSITION STUB — REMOVE IN 1.0.0.
 *
 * `@ait-co/devtools/test-runner` moved to `@ait-co/debugger/test-runner` (#818).
 *
 * Throws at module evaluation. This entry is imported from a Vitest config,
 * which Node evaluates in the developer's terminal — never in a shipped app
 * bundle — so a loud failure is the helpful behaviour.
 */

import { DEBUGGER_PACKAGE, movedMessage } from './moved.js';

throw new Error(
  movedMessage(
    '@ait-co/devtools/test-runner',
    `${DEBUGGER_PACKAGE}/test-runner`,
    `pnpm add -D ${DEBUGGER_PACKAGE}`,
  ),
);
