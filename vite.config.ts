import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// The site lives at /serene-heights-nathiagali inside the Serene Heights Group site (Multi-Zones: the
// group site forwards that path here), so every page and file is served under it, locally and on Vercel.
// VITE_BASE_PATH=/ builds it for a domain root instead.
export default defineConfig(({ mode }) => {
  const BASE_PATH = (loadEnv(mode, '.', 'VITE_').VITE_BASE_PATH ?? '/serene-heights-nathiagali').replace(/\/$/, '')
  return {
    base: `${BASE_PATH}/`,
    plugins: [react()],
    server: { port: 5500 },
    // pre-bundle the 3D libraries when the dev server starts, instead of on first request
    optimizeDeps: { include: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'] },
    preview: { port: 5500 },
    build: {
      // built into dist/<base path>/ so files sit at the same paths on Vercel as the browser asks for
      outDir: `dist${BASE_PATH}`,
      emptyOutDir: true,
      // three.js and the 3D scenes load on demand in their own chunks
      chunkSizeWarningLimit: 1200,
    },
  }
})
