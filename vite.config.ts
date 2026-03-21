import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  base: '/',
  server: {
    port: 3001,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
