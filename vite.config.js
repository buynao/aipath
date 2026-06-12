import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 拓智 · AI Path — React 单页应用
// base 用相对路径，方便部署到任意子路径 / 静态托管
export default defineConfig({
  base: './',
  plugins: [react()],
})
