import { Link } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import Footer from '../components/Footer.jsx'
import { Pill, Dots } from '../components/ui.jsx'
import NeuralNetViz from '../lessons/viz/NeuralNetViz.jsx'
import { stages, lessons } from '../data/lessons.js'

const STATS = [
  { num: '6', lbl: '学习阶段' },
  { num: '30', lbl: '核心课程' },
  { num: <>20<span style={{ fontSize: 15 }}>min</span></>, lbl: '单课时长' },
  { num: '0', lbl: '基础要求' },
]

const IDEAS = [
  {
    icon: '🧠',
    title: '直觉优先',
    body: '不从公式出发，从画面出发。每个概念都先给你一个心智图像 —— 训练是“摸索下山”，注意力是“划重点”，扩散模型是“从噪点里擦出一幅画”。先有直觉，术语和数学才有地方安放。',
  },
  {
    icon: '🎛️',
    title: '可视可玩',
    body: '关键概念配 2D / 3D 交互演示：拖动神经元的权重、拧动 temperature 旋钮、在三维星空里漫游词向量。标注「交互演示」的课程都能亲手操作 —— 玩过的，才真正属于你。',
  },
  {
    icon: '🛠️',
    title: '学完能上手',
    body: '最后一个阶段写真代码：调用 LLM API、在自己电脑上跑开源模型、搭一个 RAG 知识库。从“看懂 AI 新闻”到“做出 AI 应用”，这门课负责送你走完全程。',
  },
]

function LessonRow({ lesson }) {
  const no = String(lesson.id).padStart(2, '0')
  return (
    <Link className="lesson" to={`/lesson/${lesson.slug}`}>
      <span className="lesson-no">{no}</span>
      <span className="lesson-title">
        {lesson.title}
        {lesson.tags.map((t, i) => (
          <Pill key={i} type={t.type}>{t.text}</Pill>
        ))}
      </span>
      <span className="lesson-meta">
        <span className="footnote">{lesson.level}</span>
        <Dots n={lesson.dots} />
      </span>
      <span className="lesson-desc">{lesson.desc}</span>
    </Link>
  )
}

export default function Home() {
  return (
    <>
      <Nav />

      <header className="hero container">
        <span className="eyebrow">AI for Chinese Learners · 零基础友好</span>
        <h1>
          为中文学习者设计的
          <br />
          AI 入门课
        </h1>
        <p className="subhead">
          不堆公式，不灌术语。用可视化和交互演示，把 AI 的核心原理装进你的直觉 —— 从“神经网络是什么”到亲手搭出 AI 应用，每课 20 分钟。
        </p>
        <div className="hero-cta">
          <a className="btn btn-primary" href="#path">查看学习路线</a>
          <Link className="btn btn-glass" to="/lesson/01-ai-ml-dl">从第 1 课开始学 →</Link>
        </div>
        <div className="hero-viz card">
          <NeuralNetViz />
          <div className="viz-caption">
            ↑ 一个正在“思考”的神经网络 —— 信号逐层向前传播。学完这门课，你会知道它的每一个零件叫什么、为什么这样设计。
          </div>
        </div>
        <div className="stats">
          {STATS.map((s, i) => (
            <div className="stat" key={i}>
              <div className="num">{s.num}</div>
              <div className="lbl">{s.lbl}</div>
            </div>
          ))}
        </div>
      </header>

      <section className="section container" id="idea">
        <div className="section-head">
          <span className="eyebrow">Why This Course</span>
          <h2>这套课为什么不一样</h2>
          <p className="subhead">
            市面上的 AI 课要么是数学推导，要么是新闻名词轰炸。这套课只做一件事：让你真正“看见”AI 是怎么运转的。
          </p>
        </div>
        <div className="idea-grid">
          {IDEAS.map((idea) => (
            <div className="card idea-card" key={idea.title}>
              <div className="icon">{idea.icon}</div>
              <h3>{idea.title}</h3>
              <p>{idea.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section container" id="path">
        <div className="section-head">
          <span className="eyebrow">Learning Path</span>
          <h2>学习路线 · 6 阶段 30 课</h2>
          <p className="subhead">
            自下而上搭建：先建直觉，再懂原理，看清大模型全貌，最后亲手构建。建议按顺序学习。
          </p>
        </div>

        {stages.map((stage, si) => (
          <div className="stage" key={si}>
            <div className="stage-head">
              <span className="stage-num">{stage.num}</span>
              <h3>{stage.title}</h3>
              <Pill type="ink">{stage.count} 课</Pill>
              <span className="goal">{stage.goal}</span>
            </div>
            <div className="card row-list">
              {lessons.filter((l) => l.stage === si).map((l) => (
                <LessonRow key={l.id} lesson={l} />
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="section container" id="usage">
        <div className="section-head">
          <span className="eyebrow">How To Learn</span>
          <h2>每一课怎么学</h2>
          <p className="subhead">所有课程共用同一结构，20 分钟走完一个完整的学习闭环：</p>
        </div>
        <div className="usage-flow">
          <span className="usage-step">💡 <b>核心概念</b>&nbsp;直觉化讲透</span>
          <span className="usage-arrow">→</span>
          <span className="usage-step">🎛️ <b>交互演示</b>&nbsp;亲手调参数</span>
          <span className="usage-arrow">→</span>
          <span className="usage-step">⚠️ <b>常见误区</b>&nbsp;概念纠偏</span>
          <span className="usage-arrow">→</span>
          <span className="usage-step">✍️ <b>小练习</b>&nbsp;即学即测</span>
        </div>
        <p className="footnote" style={{ marginTop: 22 }}>
          建议节奏：每天 1 课，6 周完成；或每天 2 课，3 周速通。第 4、8、9、18 课是公认难关，多留一天。
        </p>
      </section>

      <Footer />
    </>
  )
}
