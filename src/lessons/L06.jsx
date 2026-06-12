import { useEffect, useRef, useState } from 'react'
import { Lsec, SliderRow, Pill, QuizItem } from '../components/ui.jsx'

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ============================================================
// ① 识猫流水线：逐层抽象（点击/悬停 + 自动走一遍）
// ============================================================
const ABS_KEYS = ['input', 'l1', 'l2', 'l3', 'out']
const ABS_DATA = {
  input: { title: '输入：一张照片', period: '在网络眼里 = 一大堆数字',
    desc: '照片在计算机里只是几十万个像素亮度值。网络看不见“猫”，只看见数字 —— 抽象之旅从零开始。', tags: ['像素值', '没有语义'] },
  l1: { title: '第 1 层：边缘', period: '像素 → 短线条',
    desc: '每个神经元只盯一小块像素，发现“这边亮、那边暗”就报告一条边。单个神经元只会画直线（第 3 课），但探测一小段边缘，恰好够用。', tags: ['横线', '竖线', '斜线'] },
  l2: { title: '第 2 层：纹理与曲线', period: '短线条 → 花纹',
    desc: '这一层不再看像素，只看上一层报告的边缘。几条边拼起来就是弧线、折角、毛发条纹 —— 抽象升了一级。', tags: ['弧线', '折角', '条纹'] },
  l3: { title: '第 3 层：部件', period: '花纹 → 零件',
    desc: '弧线 + 三角 = 耳朵，圆形 + 竖瞳 = 猫眼。每升一层，神经元“看到”的范围更大、概念更抽象。', tags: ['尖耳朵', '竖瞳眼睛', '胡须'] },
  out: { title: '输出：下结论', period: '零件 → 物体',
    desc: '尖耳朵、竖瞳、胡须同时出现，“猫”的输出神经元被强烈激活：92%。如果这次答错了，接下来就轮到反向传播登场。', tags: ['猫 92%', '逐层投票'] },
}

function AbstractionDemo() {
  const [key, setKey] = useState('input')
  const [playing, setPlaying] = useState(false)
  const timerRef = useRef(null)

  function stop() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    setPlaying(false)
  }
  function play() {
    if (timerRef.current) { stop(); return }
    let idx = 0
    setPlaying(true)
    const tick = () => {
      setKey(ABS_KEYS[idx])
      idx += 1
      if (idx >= ABS_KEYS.length) stop()
    }
    tick()
    timerRef.current = setInterval(tick, 1300)
  }
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const cls = (k) => `abs-layer${k === key ? ' active' : ' dim'}`
  const on = (k) => ({ onClick: () => { stop(); setKey(k) }, onMouseEnter: () => setKey(k) })
  const d = ABS_DATA[key]

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🔍 图解 · 识猫网络的逐层抽象之旅</span>
        <span className="demo-hint">悬停或点击任意一层查看说明</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="abstraction" viewBox="0 0 320 448" width="320" aria-label="识猫网络逐层抽象示意图">
            <defs>
              <marker id="arr6" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 z" fill="var(--fg-2)" />
              </marker>
            </defs>
            <g className={cls('input')} {...on('input')}>
              <rect className="layer-box" x="18" y="8" width="284" height="64" rx="12" fill="var(--bg-inset)" stroke="var(--hairline-strong)" />
              <text x="34" y="36" fontSize="13" fontWeight="700" fill="var(--fg-0)">输入 · 一张照片</text>
              <text x="34" y="54" fontSize="11" fill="var(--fg-1)">几十万个像素亮度值</text>
              <rect x="226" y="16" width="62" height="48" rx="6" fill="var(--bg-card)" stroke="var(--hairline-strong)" />
              <polygon points="244,39 250,25 257,34" fill="var(--amber)" />
              <polygon points="259,34 266,25 272,39" fill="var(--amber)" />
              <circle cx="258" cy="45" r="12" fill="var(--amber)" fillOpacity="0.9" />
              <circle cx="253" cy="43" r="1.7" fill="var(--fg-0)" />
              <circle cx="263" cy="43" r="1.7" fill="var(--fg-0)" />
              <line x1="226" y1="32" x2="288" y2="32" stroke="var(--hairline-strong)" />
              <line x1="226" y1="48" x2="288" y2="48" stroke="var(--hairline-strong)" />
              <line x1="247" y1="16" x2="247" y2="64" stroke="var(--hairline-strong)" />
              <line x1="268" y1="16" x2="268" y2="64" stroke="var(--hairline-strong)" />
            </g>
            <line x1="160" y1="76" x2="160" y2="90" stroke="var(--fg-2)" strokeWidth="1.5" markerEnd="url(#arr6)" />
            <g className={cls('l1')} {...on('l1')}>
              <rect className="layer-box" x="18" y="96" width="284" height="64" rx="12" fill="var(--bg-inset)" stroke="var(--hairline-strong)" />
              <text x="34" y="124" fontSize="13" fontWeight="700" fill="var(--fg-0)">第 1 层 · 边缘</text>
              <text x="34" y="142" fontSize="11" fill="var(--fg-1)">像素拼成短线条</text>
              <line x1="196" y1="142" x2="210" y2="114" stroke="var(--sky)" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="222" y1="114" x2="236" y2="142" stroke="var(--sky)" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="248" y1="128" x2="270" y2="128" stroke="var(--sky)" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="282" y1="114" x2="282" y2="142" stroke="var(--sky)" strokeWidth="3.5" strokeLinecap="round" />
            </g>
            <line x1="160" y1="164" x2="160" y2="178" stroke="var(--fg-2)" strokeWidth="1.5" markerEnd="url(#arr6)" />
            <g className={cls('l2')} {...on('l2')}>
              <rect className="layer-box" x="18" y="184" width="284" height="64" rx="12" fill="var(--bg-inset)" stroke="var(--hairline-strong)" />
              <text x="34" y="212" fontSize="13" fontWeight="700" fill="var(--fg-0)">第 2 层 · 纹理与曲线</text>
              <text x="34" y="230" fontSize="11" fill="var(--fg-1)">边缘拼成花纹</text>
              <path d="M192,234 Q206,202 220,234" fill="none" stroke="var(--sage)" strokeWidth="3" strokeLinecap="round" />
              <path d="M232,232 l7,-13 l7,13 l7,-13" fill="none" stroke="var(--sage)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="266" y1="210" x2="288" y2="210" stroke="var(--sage)" strokeWidth="3" strokeLinecap="round" />
              <line x1="266" y1="219" x2="288" y2="219" stroke="var(--sage)" strokeWidth="3" strokeLinecap="round" />
              <line x1="266" y1="228" x2="288" y2="228" stroke="var(--sage)" strokeWidth="3" strokeLinecap="round" />
            </g>
            <line x1="160" y1="252" x2="160" y2="266" stroke="var(--fg-2)" strokeWidth="1.5" markerEnd="url(#arr6)" />
            <g className={cls('l3')} {...on('l3')}>
              <rect className="layer-box" x="18" y="272" width="284" height="64" rx="12" fill="var(--bg-inset)" stroke="var(--hairline-strong)" />
              <text x="34" y="300" fontSize="13" fontWeight="700" fill="var(--fg-0)">第 3 层 · 部件</text>
              <text x="34" y="318" fontSize="11" fill="var(--fg-1)">花纹拼成耳朵、眼睛、胡须</text>
              <polygon points="206,326 217,296 228,326" fill="var(--amber)" fillOpacity="0.9" />
              <circle cx="248" cy="311" r="10" fill="none" stroke="var(--sky)" strokeWidth="2.5" />
              <ellipse cx="248" cy="311" rx="2.6" ry="6" fill="var(--sky)" />
              <line x1="268" y1="304" x2="292" y2="298" stroke="var(--fg-2)" strokeWidth="2" strokeLinecap="round" />
              <line x1="268" y1="311" x2="294" y2="311" stroke="var(--fg-2)" strokeWidth="2" strokeLinecap="round" />
              <line x1="268" y1="318" x2="292" y2="324" stroke="var(--fg-2)" strokeWidth="2" strokeLinecap="round" />
            </g>
            <line x1="160" y1="340" x2="160" y2="354" stroke="var(--fg-2)" strokeWidth="1.5" markerEnd="url(#arr6)" />
            <g className={cls('out')} {...on('out')}>
              <rect className="layer-box" x="18" y="360" width="284" height="80" rx="12" fill="var(--bg-inset)" stroke="var(--hairline-strong)" />
              <text x="34" y="392" fontSize="13" fontWeight="700" fill="var(--fg-0)">输出 · 下结论</text>
              <text x="34" y="410" fontSize="11" fill="var(--fg-1)">部件拼成物体</text>
              <text x="140" y="379" fontSize="12" fontWeight="700" fill="var(--fg-0)">猫</text>
              <rect x="158" y="370" width="96" height="9" rx="4.5" fill="var(--hairline)" />
              <rect x="158" y="370" width="88" height="9" rx="4.5" fill="var(--sage)" />
              <text x="260" y="379" fontSize="11" fontWeight="700" fill="var(--sage)">92%</text>
              <text x="140" y="403" fontSize="12" fill="var(--fg-1)">狗</text>
              <rect x="158" y="394" width="96" height="9" rx="4.5" fill="var(--hairline)" />
              <rect x="158" y="394" width="7" height="9" rx="3.5" fill="var(--fg-2)" />
              <text x="260" y="403" fontSize="11" fill="var(--fg-1)">6%</text>
              <text x="140" y="427" fontSize="12" fill="var(--fg-1)">兔</text>
              <rect x="158" y="418" width="96" height="9" rx="4.5" fill="var(--hairline)" />
              <rect x="158" y="418" width="4" height="9" rx="2" fill="var(--fg-2)" />
              <text x="260" y="427" fontSize="11" fill="var(--fg-1)">2%</text>
            </g>
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            {[['input', '照片'], ['l1', '第 1 层'], ['l2', '第 2 层'], ['l3', '第 3 层'], ['out', '输出']].map(([k, label]) => (
              <button key={k} className={`chip${k === key ? ' active' : ''}`} onClick={() => { stop(); setKey(k) }}>{label}</button>
            ))}
          </div>
          {!reduceMotion() && (
            <div className="chips" style={{ marginTop: 8 }}>
              <button className={`chip${playing ? ' active' : ''}`} onClick={play}>{playing ? '⏸ 停止' : '▶ 自动走一遍'}</button>
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
// ② 大模型“脑部扫描”：深度滑块
// ============================================================
const TOTAL = 32
const ZONES = {
  shallow: { title: '浅层（约第 1–10 层）：把字读顺', period: '对应识猫网络的「边缘层」',
    desc: '底层干的是粗活：认词形、判词性、把相邻的词配上对 ——「追」前后多半接名词。它看到的还只是文字的“表面”。', tags: ['词形', '词性', '邻近搭配'], jump: 5 },
  mid: { title: '中层（约第 11–22 层）：把话读懂', period: '对应识猫网络的「纹理 / 部件层」',
    desc: '中层开始拼装语义：把「它」和「猫」连起来（指代消解），分清谁追谁、谁饿了。可解释性研究发现，这类句内关系大多在中间层浮现。', tags: ['指代消解', '谁在做什么', '句内关系'], jump: 16 },
  deep: { title: '深层（约第 23–32 层）：把理想通', period: '对应识猫网络的「输出层」',
    desc: '深层在做最抽象的事：串起「因为饿 → 所以追」的因果链，调用学到的世界知识，为预测下一个词做最后准备。层越深，概念越抽象。', tags: ['因果链', '世界知识', '准备输出'], jump: 28 },
}
const HOT = { shallow: [0, 1, 2, 5, 6], mid: [0, 5], deep: [1, 6] }
const TOKENS = [
  { x: 22, w: 34, cx: 39, t: '猫' }, { x: 61, w: 34, cx: 78, t: '追' }, { x: 100, w: 48, cx: 124, t: '老鼠' },
  { x: 153, w: 20, cx: 163, t: '，' }, { x: 178, w: 48, cx: 202, t: '因为' }, { x: 231, w: 34, cx: 248, t: '它' }, { x: 270, w: 48, cx: 294, t: '饿了' },
]
const zoneOf = (n) => (n <= 10 ? 'shallow' : n <= 22 ? 'mid' : 'deep')

function LLMScanDemo() {
  const [n, setN] = useState(() => (reduceMotion() ? 28 : 3))
  const zone = zoneOf(n)
  const d = ZONES[zone]
  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · 给大模型做一次“脑部扫描”</span>
        <span className="demo-hint">拖动深度滑块，或点按钮直达某一段</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="llm-scan" viewBox="0 0 340 240" width="340" aria-label="大模型逐层扫描示意图">
            <g id="llm-gauge">
              {Array.from({ length: TOTAL }, (_, i) => (
                <rect key={i} x={(22 + i * 9.2).toFixed(1)} y="30" width="7" height="16" rx="2"
                  fill={i < 10 ? 'var(--sky)' : i < 22 ? 'var(--amber)' : 'var(--sage)'}
                  fillOpacity={i < n ? 0.9 : 0.18} />
              ))}
            </g>
            <text x="314" y="22" textAnchor="end" fontSize="11" fontWeight="700" fill="var(--fg-0)">第 {n} / 32 层</text>
            <text x="22" y="22" fontSize="11" fill="var(--fg-2)">深度 →（共 32 层）</text>
            <text x="22" y="62" fontSize="10" fill="var(--sky)">浅层 · 把字读顺</text>
            <text x="116" y="62" fontSize="10" fill="var(--amber)">中层 · 把话读懂</text>
            <text x="226" y="62" fontSize="10" fill="var(--sage)">深层 · 把理想通</text>
            <text x="22" y="86" fontSize="11" fill="var(--fg-2)">输入句子 · 正被逐层加工：</text>
            <g id="llm-arcs" className={`z-${zone}`}>
              <g className="llm-arc" data-zone="shallow">
                <path d="M39,194 Q58.5,160 78,194" fill="none" stroke="var(--sky)" strokeWidth="2" />
                <path d="M78,194 Q101,160 124,194" fill="none" stroke="var(--sky)" strokeWidth="2" />
                <path d="M248,194 Q271,160 294,194" fill="none" stroke="var(--sky)" strokeWidth="2" />
                <text x="81" y="152" textAnchor="middle" fontSize="10" fill="var(--sky)">相邻词怎么搭配</text>
              </g>
              <g className="llm-arc" data-zone="mid">
                <path d="M248,194 Q143,90 39,194" fill="none" stroke="var(--amber)" strokeWidth="2.2" />
                <text x="143" y="130" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--amber)">「它」指的是猫</text>
              </g>
              <g className="llm-arc" data-zone="deep">
                <path d="M294,194 Q186,70 78,194" fill="none" stroke="var(--sage)" strokeWidth="2.4" />
                <text x="186" y="116" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--sage)">因为饿 → 所以追</text>
              </g>
            </g>
            {TOKENS.map((tk, i) => (
              <g key={i} className={`llm-tok${HOT[zone].includes(i) ? ' hot' : ''}`}>
                <rect x={tk.x} y="196" width={tk.w} height="28" rx="7" />
                <text x={tk.cx} y="215" textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--fg-0)">{tk.t}</text>
              </g>
            ))}
          </svg>
        </div>
        <div className="demo-side">
          <SliderRow label="观察深度" min={1} max={32} step={1} value={n} onChange={(v) => setN(Math.round(v))} format={(v) => `第 ${Math.round(v)} 层`} />
          <div className="chips">
            {['shallow', 'mid', 'deep'].map((z) => (
              <button key={z} className={`chip${z === zone ? ' active' : ''}`} onClick={() => setN(ZONES[z].jump)}>
                {z === 'shallow' ? '浅层' : z === 'mid' ? '中层' : '深层'}
              </button>
            ))}
          </div>
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
// ③ 反向传播步进播放器
// ============================================================
const BP_LAYERS = [
  { x: 44, ys: [78, 150, 222] }, { x: 134, ys: [78, 150, 222] },
  { x: 224, ys: [78, 150, 222] }, { x: 318, ys: [108, 192] },
]
const resp = (l, i, j) => {
  const v = Math.sin((l * 7 + i * 3 + j * 5 + 1) * 12.9898) * 43758.5453
  return 0.15 + 0.85 * (v - Math.floor(v))
}
const BP_EDGES = []
for (let l = 0; l < 3; l++) {
  for (let i = 0; i < BP_LAYERS[l].ys.length; i++) {
    for (let j = 0; j < BP_LAYERS[l + 1].ys.length; j++) {
      BP_EDGES.push({ x1: BP_LAYERS[l].x, y1: BP_LAYERS[l].ys[i], x2: BP_LAYERS[l + 1].x, y2: BP_LAYERS[l + 1].ys[j], l, r: resp(l, i, j) })
    }
  }
}
const BP_STEPS = [
  { t: '第 0 幕 · 出厂状态', p: '公司剧情：新团队刚组建，怎么干全凭瞎蒙', d: '权重全是随机数，网络对“猫”一无所知 —— 把猫认成狗是常态。这正是训练的起点。点「下一步」，喂它一张猫的照片。' },
  { t: '第 ① 幕 · 前向传播：算出预测', p: '公司剧情：全员层层协作，把项目交付出去', d: '像素值从左往右一层层流过去，每层都基于上一层的结果继续加工，最后交出答卷：「狗 71%」。答错了。' },
  { t: '第 ② 幕 · 对答案：得到损失', p: '公司剧情：复盘会上，算清这单亏了多少', d: '正确答案是「猫」。预测与答案的差距被压缩成一个数 —— 损失，也就是第 4 课那座山的“当前高度”。' },
  { t: '第 ③ 幕 · 反向传播：逐层追责', p: '公司剧情：从 CEO 逐级问责到每个执行人', d: '误差从输出层往输入层逐层回传，每个参数分到一份“责任大小”—— 梯度，线越粗责任越大。逐层算清责任，靠的就是那句“复合函数求导的链条”。' },
  { t: '第 ④ 幕 · 按责任微调', p: '公司剧情：责任大的大改，责任小的微调', d: '梯度下降登场（第 4 课的老朋友）：每个权重朝着减小损失的方向挪一小步。谁影响大，谁改得多 —— 反向传播的全部精神。' },
  { t: '第 ⑤ 幕 · 重复亿万次', p: '公司剧情：无数次复盘之后，团队成了行家', d: '一批批数据反复走这套流程，权重一点点成形：网络从瞎猜变成识猫高手（92%）。ChatGPT 的上万亿参数，也是被这同一套机械流程挨个调出来的。' },
]

function edgeStyle(e, s, reduced) {
  let stroke = 'var(--fg-2)', w = 1.2, op = 0.25, delay = 0
  if (s === 1 || s === 2) { stroke = 'var(--sky)'; w = 1.8; op = s === 1 ? 0.85 : 0.4; delay = e.l * 220 }
  else if (s === 3) { stroke = 'var(--terracotta)'; w = 1 + e.r * 4; op = 0.25 + 0.7 * e.r; delay = (2 - e.l) * 220 }
  else if (s === 4) { stroke = 'var(--sage)'; w = 1 + e.r * 2.4; op = 0.8 }
  else if (s === 5) { stroke = 'var(--fg-2)'; w = 0.8 + e.r * 2; op = 0.5 }
  return { stroke, strokeWidth: w.toFixed(2), opacity: op.toFixed(2), transitionDelay: reduced ? '0ms' : delay + 'ms' }
}

function BackpropDemo() {
  const [cur, setCur] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timerRef = useRef(null)
  const curRef = useRef(0)
  curRef.current = cur
  const reduced = reduceMotion()

  useEffect(() => {
    if (reduced) setCur(BP_STEPS.length - 1)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const go = (s) => setCur(Math.max(0, Math.min(BP_STEPS.length - 1, s)))
  function stopPlay() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    setPlaying(false)
  }
  function togglePlay() {
    if (timerRef.current) { stopPlay(); return }
    setPlaying(true)
    if (curRef.current >= BP_STEPS.length - 1) setCur(0)
    timerRef.current = setInterval(() => {
      if (curRef.current >= BP_STEPS.length - 1) { stopPlay(); return }
      setCur((c) => c + 1)
    }, 1800)
  }

  const s = cur
  const d = BP_STEPS[s]
  const catPct = s === 0 ? '—' : s === 5 ? '92%' : '23%'
  const dogPct = s === 0 ? '—' : s === 5 ? '6%' : '71%'
  const outDogActive = s >= 1 && s < 5
  const outCatWin = s === 5

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · 追责现场：一次完整的训练步</span>
        <span className="demo-hint">点「下一步」逐幕看，或直接自动播放</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="bp-net" viewBox="0 0 400 304" width="400" aria-label="四层小网络的训练过程演示">
            <text x="44" y="34" textAnchor="middle" fontSize="12" fill="var(--fg-2)">输入</text>
            <text x="44" y="48" textAnchor="middle" fontSize="10" fill="var(--fg-2)">像素</text>
            <text x="134" y="34" textAnchor="middle" fontSize="12" fill="var(--fg-2)">隐藏 1</text>
            <text x="134" y="48" textAnchor="middle" fontSize="10" fill="var(--fg-2)">边缘</text>
            <text x="224" y="34" textAnchor="middle" fontSize="12" fill="var(--fg-2)">隐藏 2</text>
            <text x="224" y="48" textAnchor="middle" fontSize="10" fill="var(--fg-2)">部件</text>
            <text x="318" y="34" textAnchor="middle" fontSize="12" fill="var(--fg-2)">输出</text>
            <text x="318" y="48" textAnchor="middle" fontSize="10" fill="var(--fg-2)">结论</text>
            <g id="bp-edges">
              {BP_EDGES.map((e, i) => {
                const st = edgeStyle(e, s, reduced)
                return <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={st.stroke} strokeWidth={st.strokeWidth} opacity={st.opacity} style={{ transitionDelay: st.transitionDelay }} />
              })}
            </g>
            <g id="bp-nodes">
              {BP_LAYERS.flatMap((L, li) =>
                L.ys.map((y, ni) => {
                  const isOut = li === 3
                  let stroke = 'var(--hairline-strong)', fill = 'var(--bg-inset)'
                  if (isOut && ni === 1) { stroke = outDogActive ? 'var(--terracotta)' : 'var(--hairline-strong)'; fill = outDogActive ? 'var(--terracotta-bg)' : 'var(--bg-inset)' }
                  if (isOut && ni === 0) { stroke = outCatWin ? 'var(--sage)' : 'var(--hairline-strong)'; fill = outCatWin ? 'var(--sage-bg)' : 'var(--bg-inset)' }
                  return (
                    <g key={`${li}-${ni}`}>
                      <circle cx={L.x} cy={y} r="13" fill={fill} stroke={stroke} strokeWidth="1.5" />
                      {isOut && <text x={L.x} y={y + 4.5} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--fg-0)">{ni === 0 ? '猫' : '狗'}</text>}
                    </g>
                  )
                }),
              )}
            </g>
            <text x="338" y="113" fontSize="12" fontWeight="700" fill={outCatWin ? 'var(--sage)' : 'var(--fg-1)'}>{catPct}</text>
            <text x="338" y="197" fontSize="12" fontWeight="700" fill={s >= 2 && s < 5 ? 'var(--terracotta)' : 'var(--fg-1)'}>{dogPct}</text>
            <text className="bp-fade" x="318" y="260" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--sage)" opacity={s >= 2 ? 1 : 0}>正确答案：猫 ✓</text>
            <text className="bp-fade" x="134" y="260" textAnchor="middle" fontSize="11" fill="var(--terracotta)" opacity={s === 3 || s === 4 ? 1 : 0}>线越粗 = 责任（梯度）越大</text>
            <text x="44" y="287" fontSize="12" fill="var(--fg-2)">损失</text>
            <rect x="84" y="276" width="200" height="12" rx="6" fill="var(--hairline)" />
            <rect id="bp-loss-fill" x="84" y="276" width={s < 2 ? 0 : s === 5 ? 14 : 170} height="12" rx="6" fill="var(--terracotta)" />
            <text x="292" y="287" fontSize="11" fontWeight="700" fill="var(--fg-1)">{s < 2 ? '' : s === 5 ? '很小' : '巨大'}</text>
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            <button className="chip" onClick={() => { stopPlay(); go(cur - 1) }}>◀ 上一步</button>
            <button className="chip" onClick={() => { stopPlay(); go(cur + 1) }}>下一步 ▶</button>
            {!reduced && <button className={`chip${playing ? ' active' : ''}`} onClick={togglePlay}>{playing ? '⏸ 暂停' : '▶ 自动播放'}</button>}
          </div>
          <div className="bp-stepbar" role="group" aria-label="选择步骤">
            {BP_STEPS.map((_, i) => (
              <button key={i} type="button" className={i === cur ? 'on' : ''} aria-label={`跳到第 ${i} 步`} onClick={() => { stopPlay(); go(i) }}>{i}</button>
            ))}
          </div>
          <h4>{d.t}</h4>
          <div className="period">{d.p}</div>
          <p>{d.d}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ④ 梯度消失实验台
// ============================================================
const VG_MODES = {
  plain: { title: '梯度消失：底层学不动了', period: '深度的代价', factor: 0.6,
    desc: (n, pct) => `追责信号每过一层就打个六折，${n} 层之后只剩 <b>${pct}</b> —— 底层参数几乎听不到指令，学不动了。这就是<b>梯度消失</b>。试试把深度拉到 16 层，再点「装上残差连接」看解法。` },
  res: { title: '残差连接：给信号修高速路', period: '大模型的标配', factor: 0.96,
    desc: (n, pct) => `误差沿“跳层高速路”绕过中间层直达底层，${n} 层之后仍有 <b>${pct}</b>。Transformer 的每一层都内置残差连接 —— 没有这条高速路，就没有上百层的大模型。` },
}
const VG_BASE_Y = 200, VG_MAX_H = 140, VG_X0 = 20, VG_X1 = 320
const fmtPct = (p) => (p >= 10 ? Math.round(p) + '%' : p >= 1 ? p.toFixed(1) + '%' : p.toFixed(2) + '%')

function VanishingGradientDemo() {
  const [n, setN] = useState(12)
  const [mode, setMode] = useState('plain')
  const m = VG_MODES[mode]
  const gap = 6
  const bw = (VG_X1 - VG_X0 - (n - 1) * gap) / n
  const bars = []
  let firstCx = 0, lastCx = 0, lastH = 0, lastPct = 0
  for (let i = 0; i < n; i++) {
    const ratio = Math.pow(m.factor, i)
    const h = Math.max(VG_MAX_H * ratio, 1.5)
    const x = VG_X0 + i * (bw + gap)
    bars.push({ x, y: VG_BASE_Y - h, w: bw, h, fill: mode === 'res' ? 'var(--sage)' : ratio < 0.05 ? 'var(--terracotta)' : 'var(--sky)' })
    const cx = x + bw / 2
    if (i === 0) firstCx = cx
    if (i === n - 1) { lastCx = cx; lastH = h; lastPct = ratio * 100 }
  }

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · 追责的声音，传到底层还剩多少？</span>
        <span className="demo-hint">拖动深度滑块，再给网络装上残差连接</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="vg" viewBox="0 0 340 232" width="340" aria-label="梯度消失演示">
            <g id="vg-bars">
              {bars.map((b, i) => (
                <rect key={i} x={b.x.toFixed(1)} y={b.y.toFixed(1)} width={b.w.toFixed(1)} height={b.h.toFixed(1)} rx="3" fill={b.fill} fillOpacity="0.85" />
              ))}
            </g>
            {mode === 'res' && (
              <>
                <path fill="none" stroke="var(--sage)" strokeWidth="2" strokeDasharray="6 4"
                  d={`M${firstCx.toFixed(1)},52 Q170,18 ${lastCx.toFixed(1)},${(VG_BASE_Y - lastH - 22).toFixed(1)}`} />
                <text x="170" y="14" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--sage)">跳层高速路（残差连接）</text>
              </>
            )}
            <text x={Math.min(lastCx, 312).toFixed(1)} y={(VG_BASE_Y - lastH - 10).toFixed(1)} textAnchor="middle" fontSize="11" fontWeight="700"
              fill={mode === 'res' ? 'var(--sage)' : 'var(--terracotta)'}>剩 {fmtPct(lastPct)}</text>
            <text x="20" y="218" fontSize="10" fill="var(--fg-2)">输出层 · 追责从这里开始</text>
            <text x="320" y="218" textAnchor="end" fontSize="10" fill="var(--fg-2)">底层</text>
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            <button className={`chip${mode === 'plain' ? ' active' : ''}`} onClick={() => setMode('plain')}>普通深网络</button>
            <button className={`chip${mode === 'res' ? ' active' : ''}`} onClick={() => setMode('res')}>装上残差连接</button>
          </div>
          <SliderRow label="网络深度" min={6} max={16} step={1} value={n} onChange={(v) => setN(Math.round(v))} format={(v) => `${Math.round(v)} 层`} />
          <h4 style={{ marginTop: 14 }}>{m.title}</h4>
          <div className="period">{m.period}</div>
          <p dangerouslySetInnerHTML={{ __html: m.desc(n, fmtPct(lastPct)) }} />
        </div>
      </div>
    </div>
  )
}

export default function L06() {
  return (
    <>
      <Lsec title="🎯 你将学会">
        <div className="card goals">
          <div className="goal-item"><span className="tick">✓</span>说清“深度学习”的“深度”指什么：一条逐层抽象的流水线 —— 看图时是 像素 → 边缘 → 部件 → 物体，大模型读句子时是 文字 → 语法 → 语义 → 推理</div>
          <div className="goal-item"><span className="tick">✓</span>用“公司追责”的比喻把反向传播讲给任何人听，并且知道：ChatGPT 的上万亿参数，全是这套机械流程一遍遍调出来的</div>
          <div className="goal-item"><span className="tick">✓</span>理解为什么同样多的神经元“叠得深”赢过“铺得宽”，以及大模型为什么清一色选了“深”</div>
          <div className="goal-item"><span className="tick">✓</span>玩转本课 4 个交互演示：识猫流水线、大模型“脑部扫描”、追责现场步进器、梯度消失实验台 —— 顺便混熟 ReLU 与残差连接两个名词</div>
        </div>
      </Lsec>

      <Lsec
        title="💡 核心概念一：“深度”二字，指的是逐层抽象"
        lead="第 3 课说过：单个神经元只是一道“加权打分题”，画出的分界线永远是直线 —— 它连“圆形”都认不出来，更别提一只猫。深度学习的解法不是把单个神经元变聪明，而是叠层：每一层都站在上一层的肩膀上，把简单的发现组合成更抽象的概念。悬停或点击下图的每一层，看一张猫的照片如何被一步步“翻译”成结论。"
      >
        <AbstractionDemo />
        <p className="lead" style={{ marginTop: 16 }}>最妙的一点：<b>没有人告诉网络“第 1 层该学边缘、第 3 层该学耳朵”</b>。这套分工是训练中自己长出来的。“深度学习”的“深度”，说的就是这条抽象流水线的长度。这条流水线不只在识猫网络里 —— 接下来，我们把“扫描仪”对准 ChatGPT。</p>
      </Lsec>

      <Lsec
        title="🤖 把扫描仪对准大模型：它也在层层抽象"
        lead="ChatGPT 这类大语言模型，本质是几十到上百层网络模块的堆叠（具体长什么样，第 10 课 Transformer 细讲）。研究者像做“脑部扫描”一样逐层观察它处理句子的过程，发现了和识猫网络惊人相似的分工：浅层把字读顺，中层把话读懂，深层把理想通。拖动滑块，沿着深度往里看 —— 注意每一层“看到”的关系是怎么一步步变抽象的。"
      >
        <LLMScanDemo />
        <p className="lead" style={{ marginTop: 16 }}>两点说明：① 这套分工同样<b>不是工程师设计的</b>，是训练中自己长出来的 —— 和识猫网络一模一样；② 层与层的边界是研究者事后“解剖”模型观察到的大致趋势（这门手艺叫可解释性研究，第 29 课再见），不是精确的楼层图。但大方向非常稳定：<b>层越深，处理的概念越抽象</b>。所以“深度”对大模型是命根子 —— 层数不够，就盖不出“推理”那层楼。</p>
      </Lsec>

      <Lsec
        title="💡 核心概念二：反向传播 —— 考砸了，往回追责"
        lead="网络刚出厂时，权重全是随机数，把猫认成狗是常态。它怎么从错误中改进？靠一套固定流程，名叫反向传播（Backpropagation），分三步走："
      >
        <div className="use-grid">
          <div className="card use-card">
            <div className="label">第 ① 步 · 向前</div>
            <div className="en">前向传播，<b>算出预测</b></div>
            <div className="zh">数据从输入层一路流到输出层，网络给出答卷：“狗 71%”。</div>
          </div>
          <div className="card use-card">
            <div className="label">第 ② 步 · 对答案</div>
            <div className="en">比对答案，<b>得到损失</b></div>
            <div className="zh">正确答案是“猫”。预测与答案的差距被量化成一个数 —— 就是第 4 课那座“山”的高度。</div>
          </div>
          <div className="card use-card">
            <div className="label">第 ③ 步 · 往回</div>
            <div className="en">误差回传，<b>逐层追责</b></div>
            <div className="zh">误差从输出层往输入层逐层回传，每个参数分到自己的“责任大小”（梯度），按责任挨个微调。</div>
          </div>
        </div>
        <p className="lead" style={{ marginTop: 18 }}>光说不练假把式 —— 下面把一次完整的训练步拆成 6 幕，亲手往前点，看误差怎么“流回去”：</p>
        <BackpropDemo />
        <p className="lead" style={{ marginTop: 18 }}>整个过程像一家公司复盘失败的项目 —— 对照着看，每个术语都有人话版：</p>
        <div className="card">
          <table className="match">
            <thead><tr><th>网络里发生的事</th><th>公司里的对应剧情</th></tr></thead>
            <tbody>
              <tr><td className="be">前向传播</td><td className="ex">全公司层层协作，把项目做出来交付</td></tr>
              <tr><td className="be">损失</td><td className="ex">项目黄了，复盘会上算出总共亏了多少</td></tr>
              <tr><td className="be">反向传播</td><td className="ex">追责从 CEO 开始，逐级向下问到每个执行人</td></tr>
              <tr><td className="be">梯度</td><td className="ex">每个人的“责任大小”—— 你的决定对结果影响多大</td></tr>
              <tr><td className="be">更新权重</td><td className="ex">责任大的人大改，责任小的人微调，下个项目再战</td></tr>
            </tbody>
          </table>
        </div>
        <p className="lead" style={{ marginTop: 18 }}><b>谁影响大，谁改得多</b> —— 这就是反向传播的全部精神。数学上，“逐层把责任算清楚”靠的是<b>链式法则</b>：复合函数求导的链条，一层一层往回乘，仅此而已，本课不展开。你只需记住两点：① 它是<b>纯机械的求导计算</b>，全自动，没有任何“思考”；② 它和第 4 课的梯度下降是一对搭档 —— 反向传播负责算出每个参数脚下的坡度，梯度下降负责照着坡度往下走一步。</p>
        <p className="lead">放到大模型上，这套流程<b>一字不改</b>：ChatGPT 的训练就是亿万道「预测下一个词」的填空题（第 12 课细讲）—— 预测错了，误差就从最后一层一路回传到第 1 层，上万亿个参数人手一份责任、各自微调。你看到的每一句流畅回答，背后都是这套机械流程跑了无数遍的结果。训练大模型烧掉的天价算力，大头正是烧在这一来一回上：几万张 GPU 连转几个月，干的就是「前向 → 对答案 → 回传 → 微调」这一件事。</p>
      </Lsec>

      <Lsec
        title="📖 深一点：同样多的神经元，为什么“深”赢过“宽”"
        lead="一个自然的疑问：既然神经元多本事就大，那把 1000 个神经元铺成又宽又浅的一层，和叠成 10 层、每层 100 个，有区别吗？区别大到出乎意料。"
      >
        <div className="contrast">
          <div className="card contrast-card">
            <span className="tag pill pill-terracotta">宽而浅</span>
            <div className="big">1 层 × <span className="gap">1000</span> 个神经元</div>
            <p className="note">没有中间层可复用，每个概念都得直接从像素学起。多认一种动物，就要再砌一批全新的神经元 —— 神经元需求随任务复杂度爆炸式增长。</p>
          </div>
          <div className="card contrast-card">
            <span className="tag pill pill-sage">窄而深</span>
            <div className="big">10 层 × <span className="hl">100</span> 个神经元</div>
            <p className="note">底层零件全员共享：“斜线”既能拼猫耳朵，也能拼狗耳朵和屋顶。复用让表达效率指数级提升 —— 这是理论与实践共同的结论。</p>
          </div>
        </div>
        <p className="lead" style={{ marginTop: 16 }}>这套“复用零件”的智慧，你的母语里早就有了：</p>
        <div className="example">
          <div className="en">汉字的造字法，就是一张“深度网络”</div>
          <div className="zh">几十种笔画 → 几百个偏旁 → 几千个常用字 → 无穷的词语，每一层都复用下一层的零件。如果不分层，每个词都得发明一个独一无二的符号，你要背的符号量会爆炸。神经网络选择“深”，理由一模一样。</div>
        </div>
        <p className="lead" style={{ marginTop: 16 }}>大模型也用脚投了票，清一色选了“深”：</p>
        <div className="card" style={{ padding: '18px 22px' }}>
          <div className="model-depths">
            <Pill type="sky">GPT-2 · 48 层</Pill>
            <Pill type="amber">GPT-3 · 96 层</Pill>
            <Pill type="sage">Llama 3 405B · 126 层</Pill>
            <Pill type="ink">DeepSeek-V3 · 61 层</Pill>
          </div>
          <p style={{ fontSize: 14, color: 'var(--fg-1)', marginTop: 12 }}>每往上一层，模型就把下层攒出的“语义零件”再组装一轮 —— 浅层的语法零件被中层的语义复用，中层的语义又被深层的推理复用。第 15 课讲“规模法则”时你会看到：把大模型做强要加深加宽一起上，但<b>“深”始终是底座</b> —— 没有深度，就没有逐层抽象，再宽也只是个大号查表机。</p>
        </div>
      </Lsec>

      <Lsec
        title="📖 留个伏笔：追责的声音会越传越小"
        lead="深有深的代价：误差往回传时每过一层就衰减一截，层数一多，底层只能听到一丝耳语 —— 收不到调整信号，学不动了。这就是梯度消失，它曾让“很深的网络”多年训练不出来。在下面的实验台上亲手感受一下，再看工程师怎么修路救场："
      >
        <VanishingGradientDemo />
        <p className="lead" style={{ marginTop: 16 }}>救场的是两件工程神器 —— 点到为止，混个脸熟即可：</p>
        <div className="example">
          <div className="en">ReLU 激活函数</div>
          <div className="zh">把神经元的“开关”换成极简版：负数归零、正数直通。误差回传时衰减大大变缓，如今是各类网络的默认选择 —— 下一课的 CNN 里就会见到它。</div>
        </div>
        <div className="example">
          <div className="en">残差连接 Residual Connection</div>
          <div className="zh">就是演示里那条“跳层高速路”：让误差绕过中间层直达底层。从上百层的 ResNet 到大模型的 Transformer（第 10 课），现代深网络几乎无它不立 —— Transformer 的每一层都内置残差连接，<b>没有这条高速路，就没有上百层的大模型</b>。</div>
        </div>
        <p className="lead" style={{ marginTop: 16 }}>这两个名词后面的课程里会一再出现 —— 现在你已经知道它们是为谁、为什么而生的了。</p>
      </Lsec>

      <Lsec title="⚠️ 常见误区">
        <div className="card alert-card row-list">
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">反向传播 = AI 在“反思自己错在哪”</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">它只是自动求导：一套机械的链式计算，没有任何“思考”发生</span></div>
            </div>
            <p className="why"><b>病因：</b>“传播”“学习”“追责”这些拟人词太有画面感。实际上反向传播是固定的微积分流程，计算机按公式逐层算数而已 —— 把它想成 Excel 自动算出每个单元格该改多少，比想成“反思”更接近真相。ChatGPT 训练时也一样：没有顿悟，只有亿万次机械微调。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">层数越多，模型一定越强</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">梯度消失、过拟合和算力成本，共同给层数设了上限</span></div>
            </div>
            <p className="why"><b>病因：</b>把“深度学习”误读成“越深越好”。盲目加层，轻则训练不动（梯度消失），重则把训练集背得滚瓜烂熟、一上考场就露馅（第 5 课的过拟合），算力账单还会先把你劝退。大模型动辄上百层不假，但那是海量数据、残差连接和天价算力一起撑起来的 —— 合适的深度是试出来的工程活，不是越大越光荣。</p>
          </div>
        </div>
      </Lsec>

      <Lsec title="✍️ 小练习">
        <div className="card quiz row-list">
          <QuizItem q="1. 排序题：把这五个词按识猫网络“从输入到输出”的抽象顺序排好 —— 部件 / 像素 / 物体 / 边缘 / 纹理。再试试给大模型排一遍：推理 / 文字 / 语义 / 语法。">
            <b>像素 → 边缘 → 纹理 → 部件 → 物体；文字 → 语法 → 语义 → 推理。</b>每一层都把上一层的输出当原材料，再抽象一级 —— 图像和语言走的是同一条流水线，这就是“深度”的含义。
          </QuizItem>
          <QuizItem q="2. 用“公司追责”的比喻解释：为什么网络很深时，靠近输入的底层（基层员工）常常“听不到追责的声音”？这个现象叫什么？工程师修的那条“路”又叫什么？">
            追责从 CEO 逐级下传，每过一级声音就衰减一截，传到基层只剩耳语 —— 底层参数分到的梯度几乎为零，于是学不动。这就是<b>梯度消失</b>；那条让误差绕过中间层直达底层的“跳层高速路”叫<b>残差连接</b>，Transformer 每一层都内置了它。
          </QuizItem>
          <QuizItem q="3. 朋友 A 说：“反向传播说明 AI 已经会自我反思了。”朋友 B 说：“那我把网络加到一万层，岂不是无敌？”请各用一句话纠正。">
            对 A：反向传播只是<b>自动求导的机械计算</b>，“追责”是比喻，里面没有反思、没有意识。对 B：层数过深会撞上<b>梯度消失、过拟合和算力成本</b>三堵墙 —— 深度是工程权衡，不是越多越好。
          </QuizItem>
          <QuizItem q="4. 大模型从没上过一节语法课，为什么研究者“扫描”它内部时，会发现浅层管语法、中层管语义、深层管推理这样整齐的分工？">
            因为这套分工<b>没有人设计，是训练中自己长出来的</b>：反向传播在亿万道“预测下一个词”的考题里反复微调参数，而“分层复用、逐层抽象”恰好是把这件事做好的最省力方案 —— 和识猫网络自发学出“边缘 → 部件”是同一个道理。
          </QuizItem>
        </div>
      </Lsec>
    </>
  )
}
