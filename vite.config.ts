import { defineConfig, type PluginOption } from 'vite'
import markrPlugin from 'markr/vite'

export default defineConfig({
  base: '/',
  server: {
    port: 3456,
  },
  plugins: [markrPlugin() as PluginOption],
})
