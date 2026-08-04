import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({mode}) => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'es2020',
      cssMinify: 'lightningcss',
      // Sem sourcemaps em produção: menos arquivos publicados e nada de código-fonte exposto.
      sourcemap: false,
      reportCompressedSize: false,
      rollupOptions: {
        output: {
          // React e os ícones em chunks próprios: mudam pouco e permanecem
          // em cache do navegador entre um deploy e outro.
          manualChunks(id: string) {
            if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
              return 'react';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'icons';
            }
            return undefined;
          },
        },
      },
    },
    esbuild: {
      // Remove logs de desenvolvimento do bundle publicado.
      drop: mode === 'production' ? ['console', 'debugger'] : [],
      legalComments: 'none',
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
