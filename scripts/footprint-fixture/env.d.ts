/// <reference types="vite/client" />

// Fixture-scoped build constant injected by this fixture's vite.config.ts
// `define` (#818). It exists only to drive the guard's positive control;
// devtools `src/` must never reference it, so it is deliberately absent from
// `src/env.d.ts`.
declare const __FOOTPRINT_FORCE__: boolean;
