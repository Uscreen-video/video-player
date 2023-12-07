import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  // build: {
    
  //   rollupOptions: {
  //     input: resolve(__dirname, 'src/index.ts'),
  //     output: {
  //       chunkFileNames: '[name].js',
  //       entryFileNames: '[name].js',
  //     },
  //   }
  // }
}))
