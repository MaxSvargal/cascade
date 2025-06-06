import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CascadeChat',
      formats: ['es', 'cjs'],
      fileName: (format: string) => `index.${format === 'es' ? 'esm' : format}.js`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@cascade/graph',
        'react-markdown',
        'react-syntax-highlighter'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'react/jsx-runtime',
          '@cascade/graph': 'CascadeGraph',
          'react-markdown': 'ReactMarkdown',
          'react-syntax-highlighter': 'SyntaxHighlighter'
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
}); 