import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import aitDevtools from 'ait-devtools/unplugin';

const aitRoot = resolve(__dirname, 'node_modules/ait-devtools');
const mockEntry = resolve(aitRoot, 'dist/mock/index.js');
const panelEntry = resolve(aitRoot, 'dist/panel/index.js');

export default defineConfig({
  plugins: [
    // In file:-linked packages, bare specifiers like 'ait-devtools/mock'
    // may fail to resolve. Map all relevant IDs to absolute paths.
    {
      name: 'ait-devtools-resolve',
      enforce: 'pre',
      resolveId(id) {
        if (
          id === 'ait-devtools/mock' ||
          id === '@apps-in-toss/web-framework' ||
          id === '@apps-in-toss/web-bridge' ||
          id === '@apps-in-toss/web-analytics'
        ) {
          return mockEntry;
        }
        if (id === 'ait-devtools/panel') return panelEntry;
        return null;
      },
    },
    react(),
    aitDevtools.vite({ panel: false }),
  ],
});
