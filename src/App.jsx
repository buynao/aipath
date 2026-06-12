import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'
import LessonPage from './pages/LessonPage.jsx'
import { lessons } from './data/lessons.js'

// 路由切换时滚动复位（锚点跳转除外）
function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<Home />} />
        {lessons.map((l) => (
          <Route key={l.id} path={`/lesson/${l.slug}`} element={<LessonPage lesson={l} />} />
        ))}
      </Routes>
    </>
  )
}
