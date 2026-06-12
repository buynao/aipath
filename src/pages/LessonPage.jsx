import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import LessonNav from '../components/LessonNav.jsx'
import Footer from '../components/Footer.jsx'
import Pager from '../components/Pager.jsx'
import { Pill, Dots } from '../components/ui.jsx'
import { stageOf } from '../data/lessons.js'

// 已迁移课程按需加载：three.js / recharts 等重依赖只在进入对应课时才下载
const REGISTRY = {
  '01-ai-ml-dl': lazy(() => import('../lessons/L01.jsx')),
  '02-how-machines-learn': lazy(() => import('../lessons/L02.jsx')),
  '03-a-single-neuron': lazy(() => import('../lessons/L03.jsx')),
  '04-gradient-descent': lazy(() => import('../lessons/L04.jsx')),
  '05-data-and-overfitting': lazy(() => import('../lessons/L05.jsx')),
  '06-deep-networks-backprop': lazy(() => import('../lessons/L06.jsx')),
  '07-cnn-how-computers-see': lazy(() => import('../lessons/L07.jsx')),
  '08-embeddings-vector-space': lazy(() => import('../lessons/L08.jsx')),
  '09-attention': lazy(() => import('../lessons/L09.jsx')),
  '10-transformer': lazy(() => import('../lessons/L10.jsx')),
  '11-tokens': lazy(() => import('../lessons/L11.jsx')),
  '12-pretraining': lazy(() => import('../lessons/L12.jsx')),
  '13-sft-rlhf': lazy(() => import('../lessons/L13.jsx')),
  '14-temperature-sampling': lazy(() => import('../lessons/L14.jsx')),
  '15-scaling-laws': lazy(() => import('../lessons/L15.jsx')),
  '16-prompt-engineering': lazy(() => import('../lessons/L16.jsx')),
  '17-context-window': lazy(() => import('../lessons/L17.jsx')),
  '18-rag': lazy(() => import('../lessons/L18.jsx')),
  '19-function-calling': lazy(() => import('../lessons/L19.jsx')),
  '20-agents': lazy(() => import('../lessons/L20.jsx')),
  '21-diffusion-models': lazy(() => import('../lessons/L21.jsx')),
  '22-multimodal': lazy(() => import('../lessons/L22.jsx')),
  '23-reasoning-models': lazy(() => import('../lessons/L23.jsx')),
  '24-mcp-ecosystem': lazy(() => import('../lessons/L24.jsx')),
  '25-open-vs-closed': lazy(() => import('../lessons/L25.jsx')),
  '26-first-api-call': lazy(() => import('../lessons/L26.jsx')),
  '27-local-llms': lazy(() => import('../lessons/L27.jsx')),
  '28-build-rag': lazy(() => import('../lessons/L28.jsx')),
  '29-evals-and-safety': lazy(() => import('../lessons/L29.jsx')),
  '30-learning-map': lazy(() => import('../lessons/L30.jsx')),
}

// 尚未迁移课程的占位内容
function Placeholder({ lesson }) {
  return (
    <div className="card card-pad" style={{ marginTop: 32 }}>
      <p className="lead" style={{ marginBottom: 8 }}>
        本课正在从原静态页面迁移到 React 架构中。
      </p>
      <p className="footnote">
        原课程内容与交互演示完整保存在 <code>legacy/lessons/{lesson.slug}.html</code>，
        迁移后将拥有与 L01 / L04 相同的组件化交互体验。
      </p>
    </div>
  )
}

export default function LessonPage({ lesson }) {
  const Body = REGISTRY[lesson.slug]
  const stage = stageOf(lesson)

  return (
    <>
      <Nav />
      <LessonNav currentSlug={lesson.slug} />
      <main className="container-narrow">
        <header className="lesson-hero">
          <div className="crumb">
            <Link to="/">课程</Link> / <span>{stage.num} · {stage.title.split(' · ')[0]}</span> /{' '}
            <span>第 {lesson.id} 课</span>
          </div>
          <h1>{lesson.title}</h1>
          <p className="subhead">{lesson.desc}</p>
          <div className="meta">
            <Pill type="ink">{lesson.level}</Pill>
            <Dots n={lesson.dots} />
            {lesson.tags.map((t, i) => (
              <Pill key={i} type={t.type}>{t.text}</Pill>
            ))}
            <span className="footnote">约 20 分钟</span>
          </div>
        </header>

        {Body ? (
          <Suspense fallback={<div className="footnote" style={{ marginTop: 32 }}>加载中…</div>}>
            <Body />
          </Suspense>
        ) : (
          <Placeholder lesson={lesson} />
        )}

        <Pager lesson={lesson} />
      </main>
      <Footer />
    </>
  )
}
