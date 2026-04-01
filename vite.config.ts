import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages: stránka běží pod /nazev-repo/, ne v kořeni domény.
const repo = 'periodickatabulka'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? `/${repo}/` : '/',
  plugins: [react()],
}))
