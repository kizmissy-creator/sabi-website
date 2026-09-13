import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/follow-up/',
  plugins: [react()],
  build: {
    outDir: '../tester-site/follow-up-public',
    emptyOutDir: true,
  },
})
