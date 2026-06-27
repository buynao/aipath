import { Link } from "react-router-dom";
import Nav from "../components/Nav.jsx";
import Footer from "../components/Footer.jsx";
import { Pill, Dots } from "../components/ui.jsx";
import LLMHero from "../lessons/viz/LLMHero.jsx";
import { stages, lessons } from "../data/lessons.js";
import { useLang, useUI } from "../i18n/LangContext.jsx";
import { pick } from "../i18n/pick.js";

// 四项统计的数值（与语言无关，标签来自字典 t.home.statLabels）
const STAT_NUMS = [
  "7",
  "34",
  (
    <>
      10–30<span style={{ fontSize: 15 }}>min</span>
    </>
  ),
  "0",
];

function LessonRow({ lesson, lang }) {
  const no = String(lesson.id).padStart(2, "0");
  return (
    <Link className="lesson" to={`/lesson/${lesson.slug}`}>
      <span className="lesson-no">{no}</span>
      <span className="lesson-title">
        {pick(lesson.title, lang)}
        {lesson.tags.map((t, i) => (
          <Pill key={i} type={t.type}>
            {pick(t.text, lang)}
          </Pill>
        ))}
      </span>
      <span className="lesson-meta">
        <span className="footnote">{pick(lesson.level, lang)}</span>
        <Dots n={lesson.dots} />
      </span>
      <span className="lesson-desc">{pick(lesson.desc, lang)}</span>
    </Link>
  );
}

export default function Home() {
  const { lang } = useLang();
  const t = useUI();
  const h = t.home;

  return (
    <>
      <Nav />

      <header className="hero container">
        <span className="eyebrow">{h.eyebrow}</span>
        <h1>
          {h.h1a}
          <br />
          {h.h1b}
        </h1>
        <p className="subhead">{h.subhead}</p>
        <div className="hero-cta">
          <a
            className="btn btn-primary"
            href="#path"
            onClick={(e) => {
              e.preventDefault()
              document.getElementById('path')?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            {h.ctaPath}
          </a>
          <Link className="btn btn-glass" to="/lesson/01-ai-ml-dl">
            {h.ctaStart}
          </Link>
        </div>
        <div className="hero-viz card">
          <LLMHero />
          <div className="viz-caption">
            {h.vizCap.pre}
            <span className="lh-cap-alt">{h.vizCap.amber}</span>
            {h.vizCap.mid}
            <span className="lh-cap-wild">{h.vizCap.wild}</span>
            {h.vizCap.post}
          </div>
        </div>
        <div className="stats">
          {STAT_NUMS.map((num, i) => (
            <div className="stat" key={i}>
              <div className="num">{num}</div>
              <div className="lbl">{h.statLabels[i]}</div>
            </div>
          ))}
        </div>
      </header>

      <section className="section container" id="idea">
        <div className="section-head">
          <span className="eyebrow">{h.ideaEyebrow}</span>
          <h2>{h.ideaH2}</h2>
          <p className="subhead">{h.ideaSub}</p>
        </div>
        <div className="idea-grid">
          {h.ideas.map((idea) => (
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
          <span className="eyebrow">{h.pathEyebrow}</span>
          <h2>{h.pathH2}</h2>
          <p className="subhead">{h.pathSub}</p>
        </div>

        {stages.map((stage, si) => (
          <div className="stage" key={si}>
            <div className="stage-head">
              <span className="stage-num">{pick(stage.num, lang)}</span>
              <h3>{pick(stage.title, lang)}</h3>
              <Pill type="ink">{h.stageCount(stage.count)}</Pill>
              <span className="goal">{pick(stage.goal, lang)}</span>
            </div>
            <div className="card row-list">
              {lessons
                .filter((l) => l.stage === si)
                .map((l) => (
                  <LessonRow key={l.id} lesson={l} lang={lang} />
                ))}
            </div>
          </div>
        ))}
      </section>

      <section className="section container" id="usage">
        <div className="section-head">
          <span className="eyebrow">{h.usageEyebrow}</span>
          <h2>{h.usageH2}</h2>
          <p className="subhead">{h.usageSub}</p>
        </div>
        <div className="usage-flow">
          {h.usageSteps.map((step, i) => (
            <span className="usage-step-wrap" key={i} style={{ display: "contents" }}>
              <span className="usage-step">
                {step.icon} <b>{step.label}</b>&nbsp;{step.desc}
              </span>
              {i < h.usageSteps.length - 1 && <span className="usage-arrow">→</span>}
            </span>
          ))}
        </div>
        <p className="footnote" style={{ marginTop: 22 }}>
          {h.usageFootnote}
        </p>
      </section>

      <Footer />
    </>
  );
}
