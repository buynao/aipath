import { lazy, Suspense, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import LessonNav from '../components/LessonNav.jsx'
import Footer from '../components/Footer.jsx'
import Pager from '../components/Pager.jsx'
import LessonErrorBoundary from '../components/LessonErrorBoundary.jsx'
import { Pill, Dots } from '../components/ui.jsx'
import { stageOf } from '../data/lessons.js'
import { useLang, useUI } from '../i18n/LangContext.jsx'
import { META } from '../i18n/strings.js'
import { pick } from '../i18n/pick.js'

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
function Placeholder({ lesson, t }) {
  return (
    <div className="card card-pad" style={{ marginTop: 32 }}>
      <p className="lead" style={{ marginBottom: 8 }}>
        {t.lesson.placeholderLead}
      </p>
      <p className="footnote">
        {t.lesson.placeholderNotePre}<code>legacy/lessons/{lesson.slug}.html</code>{t.lesson.placeholderNoteSuf}
      </p>
    </div>
  )
}

export default function LessonPage({ lesson }) {
  const Body = REGISTRY[lesson.slug]
  const stage = stageOf(lesson)
  const { lang } = useLang()
  const t = useUI()
  const title = pick(lesson.title, lang)

  // 课程页标题带课名：「<课题> | AI 通识」（英文界面回退 AI Path），随语言切换更新（在 LangProvider 的全站 title 之后覆写）
  useEffect(() => {
    const base = (META[lang] || META.zh).title.split(' · ')[0] // zh→"AI 通识" / en→"AI Path"
    document.title = `${title} | ${base}`
    return () => { document.title = (META[lang] || META.zh).title }
  }, [lang, title])

  return (
    <>
      <Nav />
      <LessonNav currentSlug={lesson.slug} />
      <main className="container-narrow">
        <header className="lesson-hero">
          <div className="crumb">
            <Link to="/">{t.lesson.crumbHome}</Link> /{' '}
            <span>{pick(stage.num, lang)} · {pick(stage.title, lang).split(' · ')[0]}</span> /{' '}
            <span>{t.lesson.lessonN(lesson.id)}</span>
          </div>
          <h1>{title}</h1>
          <p className="subhead">{pick(lesson.desc, lang)}</p>
          <div className="meta">
            <Pill type="ink">{pick(lesson.level, lang)}</Pill>
            <Dots n={lesson.dots} />
            {lesson.tags.map((tag, i) => (
              <Pill key={i} type={tag.type}>{pick(tag.text, lang)}</Pill>
            ))}
            <span className="footnote">{t.lesson.minutes}</span>
          </div>
        </header>

        {Body ? (
          <LessonErrorBoundary
            resetKey={lesson.slug}
            fallback={
              <div className="card card-pad" style={{ marginTop: 32 }}>
                <p className="lead" style={{ marginBottom: 12 }}>{t.lesson.bodyError}</p>
                <button className="btn" onClick={() => window.location.reload()}>{t.lesson.reload}</button>
              </div>
            }
          >
            <Suspense key={lesson.slug} fallback={<div className="footnote" style={{ marginTop: 32 }}>{t.lesson.loading}</div>}>
              <Body />
            </Suspense>
          </LessonErrorBoundary>
        ) : (
          <Placeholder lesson={lesson} t={t} />
        )}

        <Pager lesson={lesson} />
      </main>
      <Footer />
    </>
  )
}
