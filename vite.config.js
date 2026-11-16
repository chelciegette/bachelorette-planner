import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths: the built site works from any folder or sub-path
  // (GitHub Pages project sites, Netlify, a plain file server…). Routing uses
  // the URL hash, so no server rewrite rules are needed either.
  base: './',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
  },
})
