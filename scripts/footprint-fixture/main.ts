// Minimal release-consumer reference for the devtools footprint guard (#818).
//
// `@ait-co/devtools` claims to be a devDependency whose contribution to a
// production bundle is zero bytes. This fixture is the smallest consumer that
// could falsify that claim: it wires devtools the two ways a real mini-app
// does — the unplugin in `vite.config.ts` (which aliases the SDK to the mock
// and injects the panel import in dev) and a dev-gated dynamic panel import in
// source — and then gets built for production.
//
// scripts/check-devtools-footprint-absent.sh builds it twice:
//   - RELEASE (default): `import.meta.env.DEV` is false and the unplugin's
//     `shouldEnable` is false, so no mock alias, no panel injection, and the
//     dynamic import below is dead-code-eliminated. The output must contain
//     none of the devtools runtime sentinels.
//   - FORCED (AIT_FOOTPRINT_FORCE=1): `__FOOTPRINT_FORCE__` folds to true and
//     the panel is pulled in unconditionally. The output MUST contain the
//     sentinels — that is the positive control proving the grep can actually
//     see devtools code when it is present, so a green release check means
//     something.
//
// The SDK import is deliberate: it is the specifier the unplugin rewrites to
// the mock. If the alias ever leaked into a production build, mock code would
// land here and the sentinel scan would catch it.
import { getPlatformOS } from '@apps-in-toss/web-framework';

// Standard dev-only consumption of the panel. A production build folds
// `import.meta.env.DEV` to false and eliminates the whole graph.
if (import.meta.env.DEV) {
  void import('@ait-co/devtools/panel');
}

// Positive-control lever — false in every real build. See the header.
if (__FOOTPRINT_FORCE__) {
  void import('@ait-co/devtools/panel');
}

document.body.textContent = `platform: ${getPlatformOS()}`;
