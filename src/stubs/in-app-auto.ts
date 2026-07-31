/**
 * TRANSITION STUB — REMOVE IN 1.0.0.
 *
 * `@ait-co/devtools/in-app/auto` moved to `@ait-co/debug-console/auto` (#818).
 *
 * A side-effect import (`import '@ait-co/devtools/in-app/auto';`) in a shipped
 * mini-app entry point. **Must never throw** — see `src/stubs/in-app.ts` for
 * why the in-app surface is the one place a throw would reach a real user.
 *
 * The pre-split entry self-gated on `?debug=1` + `?relay=` + DEV before doing
 * anything. This stub keeps the same gate before printing, so a normal
 * production load stays completely silent: someone opening the deployed app
 * has no debug intent and should see nothing in their console. The notice
 * appears only for the developer who actually asked for a debug session and is
 * therefore the person who needs to know the package moved.
 */

import { DEBUG_CONSOLE_PACKAGE, movedMessage } from './moved.js';

if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search);
  if (params.get('debug') === '1' && params.get('relay')) {
    // SECRET-HANDLING: only the fixed migration sentence is printed. The
    // `relay` param value (which carries the tunnel host) is read for the gate
    // and never logged.
    console.error(
      movedMessage(
        '@ait-co/devtools/in-app/auto',
        `${DEBUG_CONSOLE_PACKAGE}/auto`,
        `pnpm add ${DEBUG_CONSOLE_PACKAGE}`,
      ),
    );
  }
}
