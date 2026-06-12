import { Link } from 'react-router-dom'
import { lessonById } from '../data/lessons.js'

// 上下课导航。首课的“上一课”指向课程目录。
export default function Pager({ lesson }) {
  const prev = lessonById(lesson.id - 1)
  const next = lessonById(lesson.id + 1)

  return (
    <div className="pager">
      {prev ? (
        <Link className="card prev" to={`/lesson/${prev.slug}`}>
          <div className="dir">← 上一课</div>
          <div className="name">{String(prev.id).padStart(2, '0')} {prev.title}</div>
        </Link>
      ) : (
        <Link className="card prev" to="/#path">
          <div className="dir">← 课程目录</div>
          <div className="name">学习路线 · 6 阶段 30 课</div>
        </Link>
      )}
      {next ? (
        <Link className="card next" to={`/lesson/${next.slug}`}>
          <div className="dir">下一课 →</div>
          <div className="name">{String(next.id).padStart(2, '0')} {next.title}</div>
        </Link>
      ) : (
        <Link className="card next" to="/#path">
          <div className="dir">课程目录 →</div>
          <div className="name">回到学习路线</div>
        </Link>
      )}
    </div>
  )
}
