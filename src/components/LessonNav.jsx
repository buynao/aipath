import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { stages, lessons } from '../data/lessons.js'

// 课程页左侧固定目录：按六阶段分组，高亮当前课，点击直达任意一课。
export default function LessonNav({ currentSlug }) {
  const activeRef = useRef(null)

  // 进入某课时，把当前条目滚动到目录可视区中央
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'center' })
  }, [currentSlug])

  return (
    <aside className="lesson-toc" aria-label="课程目录">
      <div className="toc-head">课程目录 · 30 课</div>
      {stages.map((st, si) => (
        <div className="toc-stage" key={si}>
          <div className="toc-stage-title">{st.num} · {st.title.split(' · ')[0]}</div>
          <ul>
            {lessons
              .filter((l) => l.stage === si)
              .map((l) => {
                const active = l.slug === currentSlug
                return (
                  <li key={l.id}>
                    <Link
                      ref={active ? activeRef : null}
                      className={`toc-item${active ? ' active' : ''}`}
                      to={`/lesson/${l.slug}`}
                    >
                      <span className="toc-no">{String(l.id).padStart(2, '0')}</span>
                      <span className="toc-name">{l.title}</span>
                    </Link>
                  </li>
                )
              })}
          </ul>
        </div>
      ))}
    </aside>
  )
}
