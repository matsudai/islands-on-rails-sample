import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
  },
  build: {
    lib: {
      entry: "src/index.ts",
      name: "shared-ui",
      fileName: "shared-ui",
      formats: ["es"],
    },
    rolldownOptions: {
      external: ["react", "react-dom"],
    },
    minify: "oxc",
    target: "es2020",
  },
})
