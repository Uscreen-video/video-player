import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: 'video-player',
      formats: ['es'],
    },
  }
}))
