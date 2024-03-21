import { resolve } from 'path'
import { defineConfig } from 'vite'


export default defineConfig(({ mode }) => ({
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  build: {
    outDir: 'lib',
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'video-player',
      fileName: 'video-player',
    },
    rollupOptions: {
      external: ['lit', 'hls.js', 'mux-embed'],
    },
  }
}))
