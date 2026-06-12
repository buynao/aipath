import { useEffect, useRef, useState } from 'react'
import { Lsec, Pill, QuizItem } from '../components/ui.jsx'

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ============================================================
// ① Transformer 流水线分层图
// ============================================================
const TF_DATA = {
  input: { title: '① 输入文本', period: '起点 · 一切从一句话开始',
    desc: '模型收到「今天天气真」，整条流水线只为回答一个问题：下一个词最可能是什么？注意，此刻它还只是一串字符 —— 机器并不“认识”汉字，接下来的每一层都在把它翻译成机器能算的东西。', tags: ['「今天天气真」', '任务：续写'] },
  token: { title: '② 分词 Tokenize', period: '切成模型认识的最小单位',
    desc: '句子被切成 token：今天 / 天气 / 真，每个 token 对应词表里的一个编号。大模型的“字典”里装的不是汉字而是 token —— 具体怎么切、为什么按 token 计费，第 11 课专门拆解。', tags: ['token', '词表编号', '第 11 课预告'] },
  embed: { title: '③ 向量化 + 位置编码', period: '变成数字，再补回语序',
    desc: '每个 token 换成一个高维语义向量 —— 就是第 8 课的 Embedding，意思相近的词向量也相近。但 Transformer 整句并行处理，天生不知道词的先后，「我打他」会等于「他打我」。所以每个向量还要叠加位置信息，把并行丢掉的语序补回来。', tags: ['Embedding（第 8 课）', '位置编码'] },
  block: { title: '④ Transformer 块 ×N', period: '流水线的心脏 · 反复加工几十轮',
    desc: '每个块两道工序：先过自注意力 —— 所有词开圆桌会、交换信息，就是第 9 课的“划重点”；再过前馈网络 —— 每个词带着新情报各自深加工。旁边绕行的虚线是残差连接：输出 = 原件 + 本层批注，哪怕某层没学到东西也不碍事，所以叠几十层照样训得动。GPT-3 叠了 96 个这样的块 —— 块内细节见下一节“发动机舱”。', tags: ['自注意力（第 9 课）', '前馈网络', '残差连接'] },
  softmax: { title: '⑤ 输出层 Softmax', period: '把打分压成概率',
    desc: '反复加工后的向量交给输出层，给词表里几万个 token 各打一个分数；softmax 是一个“压分器”，把这串杂乱分数压成一组加起来正好 100% 的百分比 —— 这就是模型对“下一个词是谁”的全部判断，没有别的秘密。', tags: ['词表打分', '概率分布'] },
  predict: { title: '⑥ 预测下一个 token', period: '好 58% · 不错 21% · 冷 9%',
    desc: '从概率分布里挑一个词（怎么挑、“温度”如何影响选择，第 14 课讲），接到句尾变成「今天天气真好」—— 然后整条流水线对新句子再跑一遍，预测下下个词。ChatGPT 逐字往外蹦，就是这么来的 —— 下面的“自回归生成器”可以亲手玩这件事。', tags: ['自回归', '第 14 课预告'] },
}
const TF_ORDER = ['input', 'token', 'embed', 'block', 'softmax', 'predict']

function PipelineDemo() {
  const [key, setKey] = useState('input')
  const [walking, setWalking] = useState(false)
  const walkRef = useRef(null)
  const idxRef = useRef(0)
  const pulseRef = useRef(null)
  const reduced = reduceMotion()

  function stopWalk() {
    if (walkRef.current) clearInterval(walkRef.current)
    walkRef.current = null
    setWalking(false)
  }
  function startWalk() {
    idxRef.current = 0
    setKey(TF_ORDER[0])
    setWalking(true)
    walkRef.current = setInterval(() => {
      idxRef.current += 1
      if (idxRef.current >= TF_ORDER.length) { stopWalk(); return }
      setKey(TF_ORDER[idxRef.current])
    }, 2200)
  }
  const pick = (k) => { stopWalk(); setKey(k) }

  // 信号脉冲：一粒数据自下而上跑完流水线
  useEffect(() => {
    if (reduced) return
    const dot = pulseRef.current
    if (!dot) return
    const Y0 = 596, Y1 = 18, PERIOD = 5600
    let raf = 0
    const frame = (t) => {
      const p = (t % PERIOD) / PERIOD
      dot.setAttribute('cy', (Y0 + (Y1 - Y0) * p).toFixed(1))
      dot.setAttribute('opacity', p < 0.03 || p > 0.97 ? '0' : '0.9')
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])
  useEffect(() => () => { if (walkRef.current) clearInterval(walkRef.current) }, [])

  const cls = (k) => `tf-layer${k === key ? ' active' : ' dim'}`
  const d = TF_DATA[key]

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🏭 Transformer 流水线 · 自下而上</span>
        <span className="demo-hint">点击图中各层或右侧按钮切换</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="tf-svg" viewBox="0 0 340 612" width="340" aria-label="Transformer 流水线分层图：自下而上依次是输入文本、分词、向量化加位置编码、N 个 Transformer 块、Softmax 输出层、预测下一个 token">
            <defs>
              <marker id="tfarr" markerWidth="9" markerHeight="9" refX="6" refY="4" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M0 0 L8 4 L0 8 Z" fill="var(--fg-2)" />
              </marker>
            </defs>
            <g stroke="var(--fg-2)" strokeWidth="1.5">
              <path d="M170 551 L170 538" markerEnd="url(#tfarr)" />
              <path d="M170 473 L170 461" markerEnd="url(#tfarr)" />
              <path d="M170 397 L170 383" markerEnd="url(#tfarr)" />
              <path d="M170 175 L170 161" markerEnd="url(#tfarr)" />
              <path d="M170 109 L170 95" markerEnd="url(#tfarr)" />
            </g>
            <g className={cls('predict')} onClick={() => pick('predict')}>
              <rect className="lr" x="36" y="12" width="268" height="78" rx="10" fill="var(--glass)" stroke="var(--hairline-strong)" strokeWidth="1.5" />
              <text x="170" y="33" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="var(--fg-0)">⑥ 预测下一个 token</text>
              <rect x="46" y="44" width="88" height="32" rx="8" fill="var(--sage-bg)" stroke="var(--sage)" />
              <text x="90" y="64" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="var(--fg-0)">好 58%</text>
              <rect x="142" y="44" width="80" height="32" rx="8" fill="var(--bg-inset)" stroke="var(--hairline-strong)" />
              <text x="182" y="64" textAnchor="middle" fontSize="11.5" fill="var(--fg-1)">不错 21%</text>
              <rect x="230" y="44" width="64" height="32" rx="8" fill="var(--bg-inset)" stroke="var(--hairline-strong)" />
              <text x="262" y="64" textAnchor="middle" fontSize="11.5" fill="var(--fg-1)">冷 9%</text>
            </g>
            <g className={cls('softmax')} onClick={() => pick('softmax')}>
              <rect className="lr" x="36" y="112" width="268" height="44" rx="9" fill="var(--terracotta-bg)" stroke="var(--terracotta)" strokeWidth="1.5" />
              <text x="170" y="130" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="var(--fg-0)">⑤ 输出层 · Softmax</text>
              <text x="170" y="147" textAnchor="middle" fontSize="10.5" fill="var(--fg-1)">给词表里每个 token 打分 → 压成概率</text>
            </g>
            <g className={cls('block')} onClick={() => pick('block')}>
              <rect className="lr" x="36" y="178" width="268" height="200" rx="12" fill="var(--glass)" stroke="var(--sage)" strokeWidth="1.5" />
              <text x="50" y="199" fontSize="13" fontWeight="700" fill="var(--fg-0)">④ Transformer 块</text>
              <rect x="254" y="184" width="40" height="20" rx="10" fill="var(--sage)" />
              <text x="274" y="198" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--bg-0)">×N</text>
              <path d="M172 366 C 292 360, 292 292, 179 288" fill="none" stroke="var(--sage)" strokeWidth="1.3" strokeDasharray="4 3" />
              <path d="M178 283 C 292 276, 292 218, 179 212" fill="none" stroke="var(--sage)" strokeWidth="1.3" strokeDasharray="4 3" />
              <g stroke="var(--fg-2)" strokeWidth="1.5">
                <path d="M170 372 L170 356" markerEnd="url(#tfarr)" />
                <path d="M170 308 L170 270" markerEnd="url(#tfarr)" />
                <path d="M170 222 L170 182" />
              </g>
              <circle cx="170" cy="286" r="7" fill="var(--bg-card)" stroke="var(--sage)" strokeWidth="1.3" />
              <text x="170" y="290" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--sage)">+</text>
              <circle cx="170" cy="211" r="7" fill="var(--bg-card)" stroke="var(--sage)" strokeWidth="1.3" />
              <text x="170" y="215" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--sage)">+</text>
              <text x="156" y="290" textAnchor="end" fontSize="9.5" fill="var(--sage)">残差连接 →</text>
              <rect x="80" y="222" width="180" height="42" rx="8" fill="var(--amber-bg)" stroke="var(--amber)" />
              <text x="170" y="240" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--fg-0)">前馈网络 FFN</text>
              <text x="170" y="255" textAnchor="middle" fontSize="10" fill="var(--fg-1)">每个词各自深加工</text>
              <rect x="80" y="308" width="180" height="42" rx="8" fill="var(--sky-bg)" stroke="var(--sky)" />
              <text x="170" y="326" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--fg-0)">自注意力</text>
              <text x="170" y="341" textAnchor="middle" fontSize="10" fill="var(--fg-1)">所有词互看一眼 · 交换信息（第 9 课）</text>
            </g>
            <g className={cls('embed')} onClick={() => pick('embed')}>
              <rect className="lr" x="36" y="400" width="268" height="56" rx="9" fill="var(--amber-bg)" stroke="var(--amber)" strokeWidth="1.5" />
              <text x="170" y="419" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="var(--fg-0)">③ 向量化 + 位置编码</text>
              <text x="170" y="435" textAnchor="middle" fontSize="10.5" fill="var(--fg-1)">token → 语义向量（第 8 课 Embedding）</text>
              <text x="170" y="449" textAnchor="middle" fontSize="10.5" fill="var(--fg-1)">＋ 位置戳 ① ② ③，把语序补回来</text>
            </g>
            <g className={cls('token')} onClick={() => pick('token')}>
              <rect className="lr" x="36" y="476" width="268" height="54" rx="9" fill="var(--sky-bg)" stroke="var(--sky)" strokeWidth="1.5" />
              <text x="170" y="494" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="var(--fg-0)">② 分词 Tokenize</text>
              <rect x="86" y="501" width="52" height="22" rx="6" fill="var(--bg-card)" stroke="var(--sky)" />
              <text x="112" y="516" textAnchor="middle" fontSize="11.5" fontWeight="600" fill="var(--fg-0)">今天</text>
              <rect x="152" y="501" width="52" height="22" rx="6" fill="var(--bg-card)" stroke="var(--sky)" />
              <text x="178" y="516" textAnchor="middle" fontSize="11.5" fontWeight="600" fill="var(--fg-0)">天气</text>
              <rect x="218" y="501" width="36" height="22" rx="6" fill="var(--bg-card)" stroke="var(--sky)" />
              <text x="236" y="516" textAnchor="middle" fontSize="11.5" fontWeight="600" fill="var(--fg-0)">真</text>
            </g>
            <g className={cls('input')} onClick={() => pick('input')}>
              <rect className="lr" x="36" y="554" width="268" height="46" rx="9" fill="var(--bg-inset)" stroke="var(--hairline-strong)" strokeWidth="1.5" />
              <text x="170" y="572" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="var(--fg-0)">① 输入文本</text>
              <text x="170" y="589" textAnchor="middle" fontSize="11" fill="var(--fg-1)">「今天天气真」→ 请预测下一个词</text>
            </g>
            {!reduced && <circle ref={pulseRef} cx="170" cy="596" r="4" fill="var(--terracotta)" opacity="0" />}
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            {[['input', '① 输入'], ['token', '② 分词'], ['embed', '③ 向量+位置'], ['block', '④ Transformer 块'], ['softmax', '⑤ Softmax'], ['predict', '⑥ 预测']].map(([k, label]) => (
              <button key={k} className={`chip${k === key ? ' active' : ''}`} onClick={() => pick(k)}>{label}</button>
            ))}
          </div>
          {!reduced && (
            <div className="chips" style={{ marginTop: 8 }}>
              <button className={`chip${walking ? ' active' : ''}`} onClick={() => (walking ? stopWalk() : startWalk())}>{walking ? '⏸ 暂停' : '▶ 自动走一遍流水线'}</button>
            </div>
          )}
          <h4 style={{ marginTop: 14 }}>{d.title}</h4>
          <div className="period">{d.period}</div>
          <p>{d.desc}</p>
          <div className="tags">{d.tags.map((t) => <Pill key={t} type="ink">{t}</Pill>)}</div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ② 自回归生成器
// ============================================================
const PROMPT = ['今天', '天气', '真']
const GEN_STEPS = [
  { pick: '好', cands: [['好', 58], ['不错', 21], ['冷', 9], ['热', 5], ['差', 3]], note: '「真」后面大概率接形容词 —— 训练语料里这种搭配出现过亿万次。这次掷骰子选中了概率最高的「好」。注意：此刻它对再下一个字毫无概念。' },
  { pick: '，', cands: [['，', 46], ['啊', 22], ['。', 14], ['！', 9], ['呀', 4]], note: '标点也是 token！「今天天气真好」说完，最自然的是停顿一下接后半句 —— 逗号胜出。整句话刚刚从底到顶重新跑了一遍流水线。' },
  { pick: '适合', cands: [['适合', 34], ['我们', 19], ['阳光', 14], ['出去', 11], ['心情', 8]], note: '注意分布变平了：逗号之后路有很多条，模型的把握没有刚才大。这种“分布平缓处”正是 AI 回答多样性的来源 —— 同题重问，常在这里走岔。' },
  { pick: '出去', cands: [['出去', 42], ['散步', 17], ['晒太阳', 13], ['出门', 11], ['郊游', 6]], note: '「适合」一出，后面大概率接动作。模型自己生成的「好」「，」「适合」此刻也通过自注意力参与了这次预测 —— 它在接自己的龙。' },
  { pick: '走走', cands: [['走走', 47], ['玩', 24], ['散步', 12], ['逛逛', 7], ['透气', 4]], note: '「出去走走」是高频搭配，分布又变陡了。每生成一个 token，流水线就完整重跑一遍 —— 没有缓存、没有腹稿。' },
  { pick: '。', cands: [['。', 61], ['！', 15], ['，', 11], ['吧', 7], ['呀', 3]], note: '句号概率最高 —— 模型判断这句话说完了。真实的大模型里还有一个看不见的「结束」token，生成到它，回答就停笔。' },
]

function GenDemo() {
  const [step, setStep] = useState(0)
  const [auto, setAuto] = useState(false)
  const autoRef = useRef(null)
  const stepRef = useRef(0)
  stepRef.current = step
  const reduced = reduceMotion()

  function stopAuto() {
    if (autoRef.current) clearInterval(autoRef.current)
    autoRef.current = null
    setAuto(false)
  }
  function startAuto() {
    if (stepRef.current >= GEN_STEPS.length) return
    setAuto(true)
    setStep((s) => Math.min(GEN_STEPS.length, s + 1))
    autoRef.current = setInterval(() => {
      if (stepRef.current >= GEN_STEPS.length) { stopAuto(); return }
      setStep((s) => Math.min(GEN_STEPS.length, s + 1))
    }, 1400)
  }
  const next = () => { stopAuto(); setStep((s) => Math.min(GEN_STEPS.length, s + 1)) }
  const reset = () => { stopAuto(); setStep(0) }

  useEffect(() => {
    if (reduced) setStep(GEN_STEPS.length)
    return () => { if (autoRef.current) clearInterval(autoRef.current) }
  }, [])

  const done = step >= GEN_STEPS.length
  const cur = step > 0 ? GEN_STEPS[step - 1] : null

  // 右侧文案
  let side
  if (step === 0) side = { title: '第 0 步 · 一切就绪', period: '提示词：「今天天气真」', desc: '点左边的按钮，让模型完整跑一遍流水线：给词表里所有 token 打分、压成概率，再从中挑一个接到句尾。每点一次 = 一次完整的前向计算。（概率为教学示意，量级参考真实模型的典型行为。）', tags: ['提示词 3 个 token', '待生成'] }
  else if (done) side = { title: '生成结束 · 6 次独立预测', period: '今天天气真好，适合出去走走。', desc: '整句话是 6 次互相独立的预测拼出来的：写「好」的时候，模型并不知道后面会出现「走走」。这就是 ChatGPT 逐字蹦出回答的真正原因 —— 不是打字机动画，是它真实的工作节奏。点「重来」可以再看一遍。', tags: ['自回归', '无腹稿', '第 14 课：换种掷法'] }
  else side = { title: `第 ${step} 步 · 蹦出「${cur.pick}」`, period: `已生成 ${step} / 6 个 token · 流水线已完整运转 ${step} 次`, desc: cur.note, tags: ['打分 → 压成概率 → 掷骰子'] }

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">⌨️ 文字接龙 · 一次一个 token</span>
        <span className="demo-hint">点「蹦出下一个字」逐步生成</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage stage-col">
          <div className="gen-sent" aria-live="polite">
            {PROMPT.map((t, i) => <span key={'p' + i} className="gtoken">{t}</span>)}
            {GEN_STEPS.slice(0, step).map((s, i) => (
              <span key={'g' + i} className={`gtoken gen${i === step - 1 ? ' latest' : ''}`}>{s.pick}</span>
            ))}
            {!done && <span className="gcursor">▌</span>}
          </div>
          <div className="gen-bars">
            {cur ? cur.cands.map((c, i) => {
              const picked = c[0] === cur.pick
              return (
                <div key={i} className={`gbar${picked ? ' pick' : ''}`}>
                  <span className="gtok">{c[0]}</span>
                  <div className="gtrack"><div className="gfill" style={{ width: c[1] + '%' }} /></div>
                  <span className="gpct">{c[1]}%{picked ? ' ✓' : ''}</span>
                </div>
              )
            }) : <p className="ghint">模型已就位 —— 点「蹦出下一个字」，看它先给候选词打分、再挑一个</p>}
          </div>
          <div className="gen-ctrl">
            <button className="chip" disabled={done} onClick={next}>▸ 蹦出下一个字</button>
            {!reduced && <button className={`chip${auto ? ' active' : ''}`} disabled={done} onClick={() => (auto ? stopAuto() : startAuto())}>{auto ? '⏸ 暂停' : '▶▶ 自动生成'}</button>}
            <button className="chip" onClick={reset}>⟲ 重来</button>
          </div>
        </div>
        <div className="demo-side">
          <h4>{side.title}</h4>
          <div className="period">{side.period}</div>
          <p>{side.desc}</p>
          <div className="tags">{side.tags.map((t) => <Pill key={t} type="ink">{t}</Pill>)}</div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ③ BERT / GPT 视野对比
// ============================================================
const SCOPE_WORDS = ['猫', '把', '鱼', '叼', '回', '了', '窝', '里']

function ScopeDemo() {
  const [mode, setMode] = useState('bert')
  const [pos, setPos] = useState(2)
  const w = SCOPE_WORDS[pos]

  let side
  if (mode === 'bert') {
    side = {
      title: 'BERT · 完形填空式阅读', period: `正在预测第 ${pos + 1} 个词「${w}」`,
      desc: `「${w}」被挖掉了，但 BERT 左右两边共 ${SCOPE_WORDS.length - 1} 个词全部看得见 —— 像做完形填空，前后线索一起用。这种双向全局视野让它特别擅长判断、分类、找相关；代价是它没法从左到右流畅地“写”出一篇长文。`,
      tags: [['sage', '双向视野'], ['ink', '理解型任务']],
    }
  } else {
    side = {
      title: 'GPT · 文字接龙式阅读', period: `正在预测第 ${pos + 1} 个词「${w}」`,
      desc: (pos === 0
        ? '预测开头第一个词时，GPT 左边一个字都没有 —— 全凭训练语料里“句子通常怎么开头”的统计直觉。'
        : `预测「${w}」时，GPT 只看得见左边 ${pos} 个词，右边 ${SCOPE_WORDS.length - 1 - pos} 个词对它来说还不存在。`) +
        ' 看似瞎了一只眼，但正因为永远只看左边，它才能一个字一个字把句子写出来 —— 这就是今天所有对话大模型的工作方式。',
      tags: [['sky', '单向视野'], ['ink', '生成型任务']],
    }
  }

  const tokClass = (i) => {
    if (i === pos) return 'stok cur'
    if (mode === 'bert') return 'stok vis'
    return i < pos ? 'stok vis' : 'stok blind'
  }

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">👀 视野对比 · 同一句话，两种读法</span>
        <span className="demo-hint">先选家族，再点任意一个词</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage stage-col">
          <div className="chips" style={{ justifyContent: 'center' }}>
            {[['bert', 'BERT · 完形填空'], ['gpt', 'GPT · 文字接龙']].map(([k, label]) => (
              <button key={k} className={`chip${k === mode ? ' active' : ''}`} onClick={() => setMode(k)}>{label}</button>
            ))}
          </div>
          <div className="scope-row" aria-label="句子：猫把鱼叼回了窝里，点击任意词查看模型视野">
            {SCOPE_WORDS.map((word, i) => (
              <button key={i} className={tokClass(i)} onClick={() => setPos(i)}>{i === pos ? '？' : word}</button>
            ))}
          </div>
          <div className="scope-legend">
            <span><span className="sw" style={{ background: 'var(--sage-bg)', border: '1px solid var(--sage)' }} />看得见</span>
            <span><span className="sw" style={{ background: 'var(--terracotta-bg)', border: '1px dashed var(--terracotta)' }} />正在预测</span>
            <span><span className="sw" style={{ background: 'var(--bg-inset)', border: '1px solid var(--hairline-strong)', opacity: 0.4 }} />看不见</span>
          </div>
        </div>
        <div className="demo-side">
          <h4>{side.title}</h4>
          <div className="period">{side.period}</div>
          <p>{side.desc}</p>
          <div className="tags">{side.tags.map(([t, label], i) => <Pill key={i} type={t}>{label}</Pill>)}</div>
        </div>
      </div>
    </div>
  )
}

export default function L10() {
  return (
    <>
      <Lsec title="🎯 你将学会">
        <div className="card goals">
          <div className="goal-item"><span className="tick">✓</span>说清 2017 年《Attention Is All You Need》为什么是 AI 史的分水岭 —— GPT 和 BERT 的 T，都是 Transformer</div>
          <div className="goal-item"><span className="tick">✓</span>沿流水线走完一遍：一句话如何被分词、变向量、反复加工，最后变成“下一个词”的概率分布</div>
          <div className="goal-item"><span className="tick">✓</span>拆开 Transformer 块的“三件套”：自注意力、前馈网络、残差连接各自是干什么的、缺了哪个都不行</div>
          <div className="goal-item"><span className="tick">✓</span>用两个硬理由解释 Transformer 为什么淘汰了 RNN：并行训练、长距离依赖</div>
          <div className="goal-item"><span className="tick">✓</span>把你在 ChatGPT / Claude 里亲眼见过的现象 —— 逐字蹦出、上下文有上限、同题不同答 —— 一一连回流水线上的具体机制</div>
        </div>
      </Lsec>

      <Lsec
        title="💡 核心概念：不要循环，注意力就够了"
        lead="2017 年，Google 的八位研究员发表了一篇论文，标题狂得像宣言 ——《Attention Is All You Need》：注意力就是你需要的一切。潜台词是：统治语言 AI 多年的循环网络（RNN）可以扔了，光靠第 9 课讲的注意力机制，就能搭出更强的架构。他们造出的新架构叫 Transformer。事实证明这不是狂言：GPT 的 T、BERT 的 T 都是它，Claude 和 Gemini 也是它的后代 —— 你今天用到的几乎每个大模型，骨架都是这一副。"
      >
        <div className="contrast">
          <div className="card contrast-card">
            <span className="tag pill pill-terracotta">2017 之前 · RNN 时代</span>
            <div className="big">像传纸条：一个词一个词往后传，<span className="gap">传到后面忘了前面</span></div>
            <p className="note">循环网络必须按顺序逐词处理，没法并行；长句子里远处的信息层层转手，传到末尾所剩无几。</p>
          </div>
          <div className="card contrast-card">
            <span className="tag pill pill-sage">2017 之后 · Transformer</span>
            <div className="big">像开圆桌会：整句话<span className="hl">同时入场，任意两词直接对话</span></div>
            <p className="note">注意力让每个词直接看到所有词；整句并行计算，GPU 火力全开 —— 这才喂得下整个互联网的文本。</p>
          </div>
        </div>
        <p className="lead" style={{ marginTop: 18 }}>它对每句话做的事，可以浓缩成四步流水线 —— 先记个轮廓，下面的交互演示会逐层拆开：</p>
        <div className="use-grid cols-4">
          <div className="card use-card"><div className="label">第 1 步 · 切</div><div className="en">分词 <b>Token</b></div><div className="zh">把句子切成 token，查词表换成编号。</div></div>
          <div className="card use-card"><div className="label">第 2 步 · 变</div><div className="en">向量 <b>+ 位置</b></div><div className="zh">每个 token 变成语义向量，再盖一个“位置戳”补回语序。</div></div>
          <div className="card use-card"><div className="label">第 3 步 · 磨</div><div className="en">N 个块 <b>反复加工</b></div><div className="zh">自注意力交换信息 + 前馈网络各自深加工，叠几十轮。</div></div>
          <div className="card use-card"><div className="label">第 4 步 · 猜</div><div className="en">输出 <b>概率分布</b></div><div className="zh">给词表里所有 token 打分：下一个词最可能是谁？</div></div>
        </div>
      </Lsec>

      <Lsec
        title="🎛️ 交互演示 · 词语加工流水线"
        lead="输入「今天天气真」，看一条 Transformer 流水线怎样把它逐层向上加工，最后给出「好 58% / 不错 21% / 冷 9%」的概率分布。流水线自下而上：从底部的输入文本开始，点击每一层（或右侧按钮）查看它的职责，也可以让它自动走一遍。"
      >
        <PipelineDemo />
      </Lsec>

      <Lsec
        title="📖 深入展开 · 拆开发动机舱：块里的三件套"
        lead="流水线第④层是整个架构的心脏：几十个一模一样的“块”首尾相接（GPT-3 叠了 96 个）。每个块里只有三样东西 —— 自注意力、前馈网络、残差连接。下面把每一件按“是什么 → 为什么非它不可 → 怎么工作 → 局限在哪”拆透。看懂这一节，你就看懂了所有大模型的发动机。"
      >
        <div className="card row-list">
          <div className="mech">
            <div className="mech-head"><span className="pill pill-sky">第 1 件 · 自注意力</span><span className="mech-name">圆桌会议：所有词互相交换情报</span></div>
            <p><span className="q">是什么。</span>第 9 课那套“划重点”机制的全员版：句子里每个词都环顾整句，决定该重点参考谁、参考多少，然后把对方的信息按比例“吸”过来更新自己。</p>
            <p><span className="q">为什么非它不可。</span>没有它，每个词只能孤零零地自我加工 —— “苹果”永远分不清自己是水果还是手机公司。语义藏在<b>词与词的关系</b>里，必须有一个交换信息的环节。</p>
            <p><span className="q">怎么工作。</span>想象每个词进会场前印好了三张名片：一张写“<b>我在找什么</b>”（行话叫 Query），一张写“<b>我能提供什么</b>”（Key），一张装着“<b>真要拿就拿这些</b>”的内容（Value）。开会时，每个词拿自己的“我在找”逐一对照所有人的“我能提供”，配对越成功，就从对方那里拿走越多内容。在「这个苹果很甜」里，“苹果”的“我在找”会和“甜”的“我能提供”一拍即合 —— 于是“苹果”的向量被掺入“甜”的信息，悄悄滑向“水果”那一侧；换成「苹果发布了新手机」，同一个词就会被“发布”“手机”拉向“公司”那一侧。而且会议不止开一场：每个块里同时开好几场（行话叫“多头”），有的场子专盯语法搭配，有的专盯“它”指代谁，有的盯情感色彩 —— 散会后各场结论汇总成一份。</p>
            <p><span className="q">局限。</span>圆桌会人人都要和人人对话：句子长一倍，对话次数翻四倍。这笔“平方账单”就是大模型上下文窗口有上限的根源（第 17 课细讲）。</p>
          </div>
          <div className="mech">
            <div className="mech-head"><span className="pill pill-amber">第 2 件 · 前馈网络 FFN</span><span className="mech-name">独立车间：每个词各自深加工</span></div>
            <p><span className="q">是什么。</span>一个小型神经网络（就是第 5、6 课那种），每个词<b>单独</b>通过它，词与词互不打扰。</p>
            <p><span className="q">为什么非它不可。</span>只开会不消化，信息就只是被反复搅拌。注意力负责“交流”，前馈网络负责“思考”：把刚收集来的情报提炼成更抽象的判断 —— 从“苹果旁边有个甜字”提炼出“这是正面评价的食物”。一收一炼，配合成一轮完整加工。</p>
            <p><span className="q">怎么工作。</span>每个词带着开会更新过的向量走进车间，过两道变换出来 —— 进去是“原料”，出来是“半成品”，交给下一个块再开会、再加工。逐块向上，特征越来越抽象：底层的块还在处理“哪个词修饰哪个词”，高层的块已经在表达“这句话在讽刺”这种级别的判断。</p>
            <p><span className="q">一个彩蛋。</span>研究者发现，模型的大量“事实记忆” —— 比如“巴黎”与“法国首都”的关联 —— 主要就存放在各层前馈网络的参数里。它不只是加工车间，还是模型的“知识仓库”，参数量占了一个块的大头。</p>
          </div>
          <div className="mech">
            <div className="mech-head"><span className="pill pill-sage">第 3 件 · 残差连接</span><span className="mech-name">直达电梯：保证叠 96 层也训得动</span></div>
            <p><span className="q">是什么。</span>每道工序旁边都留了一条绕行通道（流水线图里那两条虚线）。本课唯一值得记的“式子”，用人话写就是：<b>这一层的输出 = 原件 + 本层的批注</b>。每一层只在原文件上贴便利贴，而不是把文件重写一遍。</p>
            <p><span className="q">为什么非它不可。</span>没有它，几十层连续“重写”会把原始信息越磨越淡，训练时的纠错信号也传不回底层 —— 深网络会直接训崩。有了它，最坏情况不过是“这层的批注没价值，原件原样往上传”，深度变成了只赚不赔的买卖。这个 2015 年来自图像识别领域的发明，是 Transformer 敢叠到几十上百层的底气。</p>
            <p><span className="q">局限与代价。</span>三件套本身没有“理解”任何东西 —— 它们做的是超大规模的统计与变换，“懂语言”是这些机制堆到足够规模后<b>涌现</b>出来的表现（第 12 课细说）。另外块也不是叠得越多越好：层数翻倍，成本翻倍，效果的提升却越来越小，这正是各家公司拼“规模效率”的战场。</p>
          </div>
        </div>
      </Lsec>

      <Lsec
        title="📖 两记重拳：它凭什么淘汰 RNN"
        lead="学术界从不缺新架构，Transformer 能横扫一切，靠的不是巧思，而是两个实打实的工程优势。"
      >
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="match">
            <thead><tr><th>较量回合</th><th>🐢 RNN · 串行传纸条</th><th>⚡ Transformer · 并行圆桌会</th></tr></thead>
            <tbody>
              <tr><td className="be">训练速度</td><td className="ex">必须等上一个词算完才能算下一个，昂贵的 GPU 大部分时间在围观</td><td className="ex">整句话同时计算，GPU 的并行算力被吃满 —— 互联网级语料从“训不动”变成“训得完”</td></tr>
              <tr><td className="be">长距离依赖</td><td className="ex">第 1 个词的信息要传到第 1000 个词，像传话游戏，传着传着就忘了</td><td className="ex">第 1 个词和第 1000 个词通过注意力直接对话，距离再远也不衰减</td></tr>
              <tr><td className="be">各自的账单</td><td className="ex">结构简单、推理省内存，但优点到此为止</td><td className="ex">注意力的计算量随句长平方增长 —— 这是大模型“上下文窗口”有限的根源（第 17 课）</td></tr>
            </tbody>
          </table>
        </div>
        <p className="lead" style={{ marginTop: 14 }}>第一拳尤其致命：大模型时代的入场券是“用海量数据训练超大网络”，而 RNN 的串行天性让它根本排不进这个赛道。<b>不是 RNN 不够聪明，是它喂不饱。</b>“喂得饱”这个工程优势，最终滚成了智能上的代差 —— 这是 AI 史反复上演的剧本：赢在算力友好，而不是赢在精巧。</p>
      </Lsec>

      <Lsec
        title="🎛️ 交互演示 · 自回归生成器：亲手让模型蹦字"
        lead="流水线一次只产出一个 token。那 ChatGPT 一大段一大段的回答是哪来的？答案：选一个字接到句尾，把新句子重新跑一遍流水线，再选下一个 —— 行话叫“自回归”。下面亲手跑一遍：每点一次按钮 = 流水线完整运转一次。注意观察每一步的概率分布怎么变（数字为教学示意）。"
      >
        <GenDemo />
        <p className="lead" style={{ marginTop: 14 }}>玩到最后你会发现一件颠覆直觉的事：写「好」的那一刻，模型完全不知道后面会出现「走走」。<b>整句话是六次互相独立的预测拼出来的</b> —— ChatGPT 逐字蹦出回答，不是打字机特效，而是它真实的工作节奏。这也解释了它为什么偶尔“说到一半把自己绕进去”：每一步都只对“下一个字”负责，没有谁在监督全文。</p>
      </Lsec>

      <Lsec
        title="📖 深入展开 · 你见过的现象，背后全是它"
        lead="这一课讲的不是屠龙之技 —— 你每天在 ChatGPT、Claude 里撞见的“怪现象”，几乎条条能在流水线上找到根源。对照着读，机制才算真的学会了。"
      >
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="match map">
            <thead><tr><th>你在 ChatGPT / Claude 里看到的</th><th>流水线上的根源</th></tr></thead>
            <tbody>
              <tr><td>回答逐字逐词往外蹦，越长的回答等得越久</td><td className="ex">自回归：一次只预测一个 token，接到句尾后整条流水线重跑一遍。100 个字 = 100 次完整计算，所以字越多越慢</td></tr>
              <tr><td>聊得太长，它开始“忘记”开头说过的设定；上下文窗口有硬上限</td><td className="ex">自注意力人人对话人人，计算量随长度平方暴涨 —— 窗口必须设上限；超出的部分被截掉，模型是真的“没看见”（第 17 课）</td></tr>
              <tr><td>同一个问题问两遍，答案不一样</td><td className="ex">流水线的终点是概率分布而非唯一答案，回答是从分布里“掷骰子”挑出来的；骰子怎么掷、“温度”怎么调，第 14 课讲</td></tr>
              <tr><td>API 按 token 计费，同样的意思中文常比英文“贵”</td><td className="ex">流水线第一道工序是分词 —— 模型的账本以 token 记，而中文在多数词表里被切得更碎（第 11 课）</td></tr>
              <tr><td>让它“一步一步想”，答案明显变聪明；推理模型“思考”得越久越准</td><td className="ex">多写的每个字都是新一轮完整的流水线计算 —— 草稿纸就是追加算力。“先打草稿再回答”的全部原理，见第 23 课</td></tr>
            </tbody>
          </table>
        </div>
        <p className="lead" style={{ marginTop: 14 }}>反过来这张表也是“防忽悠指南”：下次看到“我们的 AI 会通篇构思再下笔”之类的宣传，你可以直接对照第一行 —— 只要它是 Transformer 自回归路线，就是一个字一个字蹦的。</p>
      </Lsec>

      <Lsec
        title="📖 两大家族：会读的 BERT，会写的 GPT"
        lead="原始论文里的 Transformer 是“编码器 + 解码器”两半拼成的，用来做机器翻译。后来的研究者各取一半，分出了两条路线。"
      >
        <div className="use-grid cols-2">
          <div className="card use-card">
            <div className="label">编码器路线 · 2018 · Google</div>
            <div className="en">BERT <b>理解型</b></div>
            <div className="zh">训练方式是“完形填空”：挖掉句中一个词，让模型看着<b>前后双向</b>的上下文把它填回来。擅长理解类任务 —— 搜索相关度、文本分类、情感判断，Google 搜索曾大规模用它理解你的查询。</div>
          </div>
          <div className="card use-card">
            <div className="label">解码器路线 · 2018 · OpenAI</div>
            <div className="en">GPT <b>生成型</b></div>
            <div className="zh">训练方式是“文字接龙”：只许看左边，预测下一个 token。看似比 BERT“瞎了一只眼”，但<b>会接龙就能写出一切</b> —— ChatGPT、Claude、Gemini，今天的大模型基本都是这条路线。</div>
          </div>
        </div>
        <p className="lead" style={{ marginTop: 18 }}>两条路线的全部分歧，浓缩成一个问题：<b>预测一个词时，允许看哪边？</b>点下面的词，亲眼比较两家的“视野”。</p>
        <ScopeDemo />
        <p className="lead" style={{ marginTop: 14 }}>为什么“瞎了一只眼”的生成型笑到了最后？因为“预测下一个词”逼着模型理解一切：要接好“这道题的答案是”，就得真的会做题。规模上去之后，理解类任务也能直接用“生成答案”来完成 —— 让 GPT 判断一条评论的情感，只需问它“这条评论是好评还是差评？”，它接龙写出“好评”，分类就做完了。<b>一个接龙模型通吃读写</b>，而 BERT 永远写不了长文。这背后“规模出奇迹”的故事，第 12 课预训练专门讲。</p>
      </Lsec>

      <Lsec title="⚠️ 常见误区">
        <div className="card alert-card row-list">
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">Transformer 是某个 AI 产品或某个具体模型</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">它是一张架构蓝图 —— 像“内燃机”之于汽车，GPT、BERT、Claude、Gemini 是照这张图纸造出的不同型号</span></div>
            </div>
            <p className="why"><b>病因：</b>新闻里 Transformer 总和具体产品名连在一起出现。记住三层关系：<b>架构</b>是设计图（Transformer），<b>模型</b>是按图纸训练出的成品（GPT-4、Claude），<b>产品</b>是包装好的服务（ChatGPT）。说“Transformer 发布了新版本”就像说“内燃机出了新款轿车”。顺带一提：各家模型的差异主要在块数多少、训练数据和调教方式，发动机舱里的三件套大同小异。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">GPT 回答时已经想好了整句话，逐字蹦出来只是“打字机动画”</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">它一次只预测一个 token，拼到句尾后再跑一遍流水线预测下一个 —— 逐字蹦出来就是它真实的工作节奏</span></div>
            </div>
            <p className="why"><b>病因：</b>人说话前往往有完整腹稿，于是把 AI 也想象成这样。实际上 GPT 是“自回归”生成：写第 100 个字时，它自己也不知道第 101 个字是什么 —— 上面的生成器你已经亲手验证过了。第 14 课的温度采样、第 23 课的“先打草稿再回答”，都建立在这个事实之上。</p>
          </div>
        </div>
      </Lsec>

      <Lsec title="✍️ 小练习">
        <div className="card quiz row-list">
          <QuizItem q="1. Transformer 把整句话并行处理，速度起飞 —— 那它怎么分得清「我打他」和「他打我」？">
            靠<b>位置编码</b>。并行处理本身不分先后，等于把句子拆成一袋词。所以在向量化时要给每个 token 盖一个“位置戳”（第 1 个、第 2 个……），把并行丢掉的语序信息随向量一起送进流水线。
          </QuizItem>
          <QuizItem q="2. 下面三个任务，更适合 BERT 家族还是 GPT 家族？①搜索引擎判断网页与查询是否相关 ②写作软件帮你把邮件续写完 ③和客服机器人多轮对话">
            <b>① BERT，② ③ GPT。</b>判断相关性是理解任务，能双向看全文的 BERT 是行家；续写和对话本质都是“预测下一个 token”，正是 GPT 路线的本职工作。
          </QuizItem>
          <QuizItem q="3. 朋友抱怨：“我把 300 页合同粘给 AI，它说超出长度限制了 —— 这么先进的模型连个文件都装不下？”用本课知识替模型“喊冤”。">
            根源是<b>自注意力的“平方账单”</b>：圆桌会上人人都要和人人对话，文本长一倍，计算量翻四倍。300 页合同的注意力开销是天文数字，所以上下文窗口必须设上限 —— 这不是偷工减料，是架构的固有代价。怎么缓解（检索、摘要、分段），第 17 课讲。
          </QuizItem>
          <QuizItem q="4. 有创业者宣称：“我们用 RNN 在互联网级语料上训练了一个超大模型。”用本课知识，你会提出什么疑虑？">
            最大疑虑是<b>训练速度</b>：RNN 必须逐词串行计算，GPU 的并行算力用不上，互联网级语料根本喂不进去 —— 这正是当年大家集体转向 Transformer 的原因。其次，RNN 的长距离依赖在长文档上也撑不住。除非对方有真正的架构创新（近年确有让循环结构复兴的新尝试），否则值得追问细节。
          </QuizItem>
        </div>
      </Lsec>
    </>
  )
}
