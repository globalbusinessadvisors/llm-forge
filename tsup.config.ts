import { defineConfig } from 'tsup';

export default defineConfig([
  // Library build
  {
    entry: {
      index: 'src/index.ts',
    },
    format: ['esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    minify: false,
    target: 'node20',
    outDir: 'dist',
    tsconfig: 'tsconfig.json',
    shims: true,
  },
  // CLI build
  {
    entry: {
      'cli/index': 'src/cli/index.ts',
    },
    format: ['esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    minify: false,
    target: 'node20',
    outDir: 'dist',
    tsconfig: 'tsconfig.json',
    shims: true,
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);
