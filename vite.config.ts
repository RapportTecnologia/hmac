import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // No CI (GitHub Pages) o site vive em /<repo>/ — definido via VITE_BASE_PATH.
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react()],
})
