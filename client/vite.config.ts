import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@musica/shared': path.resolve(import.meta.dirname, '../shared/src/index.ts'),
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})

