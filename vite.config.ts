import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest.json';

/**
 * Vite configuration for DevInspect Chrome Extension
 * @see https://vitejs.dev/config/
 */
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    root: '.',
    plugins: [crx({ manifest })],
    
    build: {
      outDir: 'dist',
      // Disable sourcemaps in production for security and smaller bundle size
      sourcemap: !isProduction,
      // Minify in production
      minify: isProduction ? 'esbuild' : false,
      // Target modern browsers (Chrome extensions require recent Chrome versions)
      target: 'chrome96',
      // Optimize bundle size
      rollupOptions: {
        output: {
          // Clean file naming
          chunkFileNames: 'chunks/[name]-[hash].js',
          entryFileNames: '[name].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      },
      // Warn about large chunks
      chunkSizeWarningLimit: 500
    },

    // ESBuild options (Vite uses esbuild by default)
    esbuild: {
      // Drop console and debugger in production
      drop: isProduction ? ['console', 'debugger'] : []
    },

    // Development server settings
    server: {
      port: 5173,
      strictPort: true,
      hmr: {
        // Disable HMR overlay for extension development
        overlay: false
      }
    },

    // Optimize dependencies
    optimizeDeps: {
      include: ['@crxjs/vite-plugin']
    },

    // Resolve aliases (optional, for cleaner imports)
    resolve: {
      alias: {
        '@': '/src',
        '@content': '/src/content',
        '@popup': '/src/popup',
        '@background': '/src/background'
      }
    }
  };
});
