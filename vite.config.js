import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: '.', // Output to the root directory
    emptyOutDir: false,
    rollupOptions: {
      input: 'src/main.js',
      output: {
        entryFileNames: 'bundle.js',
        format: 'iife',
        name: 'SqlApp'
      }
    }
  }
});
