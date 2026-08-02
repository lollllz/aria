import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// `base` is "/" in dev and set to "/<repo>/" by CI for GitHub Pages project sites.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react(), tailwindcss()],
  server: { port: 5180, strictPort: true },
})
