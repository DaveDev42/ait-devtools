import { defineConfig } from 'tsdown';
import pkg from './package.json' with { type: 'json' };

// __VERSION__ is defined in all entries so any source file can reference it
const define = {
  __VERSION__: JSON.stringify(pkg.version),
};

// `package.json` exports expect `.js` (ESM) and `.cjs` (CJS) extensions,
// so override tsdown's default `.mjs` / `.cjs` mapping under `"type": "module"`.
const outExtensions = ({ format }: { format: string }) => {
  if (format === 'cjs') return { js: '.cjs', dts: '.d.cts' };
  return { js: '.js', dts: '.d.ts' };
};

export default defineConfig([
  {
    entry: {
      'mock/index': 'src/mock/index.ts',
      'panel/index': 'src/panel/index.ts',
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: false,
    target: 'es2022',
    outExtensions,
    define,
  },
  {
    entry: {
      'unplugin/index': 'src/unplugin/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: false,
    target: 'es2022',
    outExtensions,
    define,
  },
]);
