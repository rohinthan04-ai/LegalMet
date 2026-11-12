import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Tailwind v4 runs as a Vite plugin - no tailwind.config.js or postcss file needed.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
