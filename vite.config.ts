import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Hostinger/Apache deploy typically runs from domain root.
export default defineConfig({
  base: '/',
  plugins: [react()],
})
