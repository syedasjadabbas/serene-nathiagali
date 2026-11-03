import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5500 },
  // pre-bundle the 3D libraries when the dev server starts, instead of on first request
  optimizeDeps: { include: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'] },
  preview: { port: 5500 },
  build: {
    // three.js and the 3D scenes load on demand in their own chunks
    chunkSizeWarningLimit: 1200,
  },
})
