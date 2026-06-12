import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'

// 全局设计系统（暖纸 + 墨色单色品牌，自动深色模式）
import './styles/style.css'
import './styles/lesson.css'
import './styles/app.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)
