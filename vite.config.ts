import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Hosted on GitHub Pages at tnargy.github.io/kittyApp/ (no custom domain),
// so the build must use root-relative-to-subpath asset URLs.
export default defineConfig({
  base: '/kittyApp/',
  plugins: [react()],
  test: {
    environment: 'node',
  },
})
