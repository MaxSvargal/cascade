import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CascadeGraph',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'esm' : format}.js`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@reactflow/core',
        '@reactflow/background',
        '@reactflow/controls',
        '@reactflow/minimap',
        'reactflow',
        'elkjs',
        'jotai',
        'yaml',
        'zod',
        'highlight.js',
        'react-highlight',
        'react-hook-form',
        'react-json-view',
        '@rjsf/core',
        '@rjsf/utils',
        '@rjsf/validator-ajv8'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'react/jsx-runtime',
          reactflow: 'ReactFlow',
          elkjs: 'ELK',
          jotai: 'jotai',
          yaml: 'YAML',
          zod: 'z'
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