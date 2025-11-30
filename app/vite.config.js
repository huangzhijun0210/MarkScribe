import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  publicDir: false,
  build: {
    lib: {
      entry: resolve(__dirname, 'package/src/util/MarkScribe.ts'),
      name: 'ReactMarkdownCore',
      formats: ['es', 'cjs', 'umd'],
      fileName: (fmt) => `index.${fmt}.js`
    },
    outDir: 'dist',
    rollupOptions: {
      external: [] //  完全清空
    },
    sourcemap: true,
    minify: 'esbuild'
  }
});