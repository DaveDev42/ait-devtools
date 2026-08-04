/** Fail when a supported SDK runtime export is absent from its mock facade. */

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const repoRoot = resolve(import.meta.dirname, '..');

interface Line {
  label: string;
  packageName: string;
  mockSource: string;
}

const lines: Line[] = [
  {
    label: '2.10.8',
    packageName: '@apps-in-toss/web-framework-2x',
    mockSource: 'src/mock/index-2x.ts',
  },
  {
    label: '3.0.1',
    packageName: '@apps-in-toss/web-framework',
    mockSource: 'src/mock/index-3x.ts',
  },
];

function declarationEntry(packageName: string): string {
  const packageJsonPath = require.resolve(`${packageName}/package.json`);
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
    types?: string;
  };
  if (!packageJson.types) throw new Error(`${packageName} has no types entry`);
  return resolve(dirname(packageJsonPath), packageJson.types);
}

function runtimeExports(program: ts.Program, fileName: string): Set<string> {
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(fileName);
  if (!source) throw new Error(`TypeScript did not load ${fileName}`);
  const moduleSymbol = checker.getSymbolAtLocation(source);
  if (!moduleSymbol) throw new Error(`TypeScript did not resolve module ${fileName}`);

  return new Set(
    checker
      .getExportsOfModule(moduleSymbol)
      .filter((symbol) => {
        const resolved =
          symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
        return (resolved.flags & ts.SymbolFlags.Value) !== 0;
      })
      .map((symbol) => symbol.name),
  );
}

let failed = false;
for (const line of lines) {
  const sdkEntry = declarationEntry(line.packageName);
  const mockEntry = resolve(repoRoot, line.mockSource);
  const program = ts.createProgram([sdkEntry, mockEntry], {
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022,
    strict: true,
    skipLibCheck: true,
  });
  const sdkExports = runtimeExports(program, sdkEntry);
  const mockExports = runtimeExports(program, mockEntry);
  const missing = [...sdkExports].filter((name) => !mockExports.has(name)).sort();

  if (missing.length > 0) {
    failed = true;
    console.error(`${line.label}: mock is missing ${missing.length} runtime exports:`);
    for (const name of missing) console.error(`  - ${name}`);
  } else {
    console.log(`${line.label}: all ${sdkExports.size} SDK runtime exports are present.`);
  }
}

if (failed) process.exit(1);
