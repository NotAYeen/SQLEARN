import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: '.', // Output to the root directory
    emptyOutDir: false,
    sourcemap: false, // Ensure no source maps are generated
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Strip console logs in production
        drop_debugger: true
      }
    },
    rollupOptions: {
      input: 'src/main.js',
      output: {
        entryFileNames: 'bundle.js',
        format: 'iife',
        name: 'SqlApp'
      }
    }
  },
  esbuild: {
    drop: ['console', 'debugger']
  }
});
