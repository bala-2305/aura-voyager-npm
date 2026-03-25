import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src'],
      exclude: ['node_modules', 'dist'],
      rollupTypes: true
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'AuraVoyager',
      fileName: (format) => `index.${format === 'es' ? 'es' : 'js'}`
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'lucide-react',
        'react-markdown',
        'rehype-highlight',
        'remark-gfm'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          'lucide-react': 'LucideReact',
          'react-markdown': 'ReactMarkdown',
          'rehype-highlight': 'rehypeHighlight',
          'remark-gfm': 'remarkGfm'
        }
      }
    },

    sourcemap: true
  }
});
