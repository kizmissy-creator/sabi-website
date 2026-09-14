import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/follow-up/',
  plugins: [react()],
  build: {
    outDir: '../client/cl-2026-001/follow-up',
    emptyOutDir: true,
  },
})
