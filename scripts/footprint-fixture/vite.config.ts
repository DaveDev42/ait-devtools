import path from 'node:path';
import { fileURLToPath } from 'node:url';
import aitDevtools from '@ait-co/devtools/unplugin';
import { defineConfig } from 'vite';

// Vite config for the devtools footprint guard fixture (#818).
//
// The unplugin is wired here EXACTLY as a real mini-app wires it — with
// defaults, not disabled. That is the point of the guard: the plugin runs
// host-side during the build (aliasing, injection, tunnel wiring) and must
// leave nothing of itself in the emitted bundle. A config that switched it off
// would test nothing.
//
// Minification stays ON (Vite's production default). With minify off a dead
// `if(false){ … }` husk survives as text and its identifier strings would
// false-positive the sentinel scan — the same trap the pre-split
// check-debug-surface-absent.sh documented.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  define: {
    __FOOTPRINT_FORCE__: JSON.stringify(process.env.AIT_FOOTPRINT_FORCE === '1'),
  },
  plugins: [aitDevtools.vite()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
