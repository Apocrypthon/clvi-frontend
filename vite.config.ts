import { defineConfig } from 'vite';

/**
 * Build stamp is baked in at build time so the deployed page can prove which
 * commit/deploy it is. `__BUILD_TIME__` is declared in src/env.d.ts.
 */
export default defineConfig({
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  build: {
    target: 'es2022',
    // Keep the shell auditable: no obfuscation beyond minification.
    sourcemap: true,
  },
});
