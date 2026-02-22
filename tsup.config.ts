import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  target: 'es2022',
  platform: 'neutral', // Works in both browser and Node.js
  outDir: 'dist',
  treeshake: true,
  // Don't bundle external dependencies
  external: ['fs', 'path', 'url'],
  // Preserve dynamic imports for Node.js-only features
  esbuildOptions: (options) => {
    options.banner = {
      js: '"use strict";',
    };
  },
});
