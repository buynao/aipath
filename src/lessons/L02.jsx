import { useEffect, useRef, useState } from 'react'
import { Lsec, Chips, FlipCard, QuizItem } from '../components/ui.jsx'

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ============================================================
// 交互一：可转动的学习循环
// ============================================================
const STEPS = [
  { title: '① 喂数据', sub: '原料进场 · 只在开局发生一次', desc: '把 10 万封邮件连同人工标好的“垃圾 / 正常”一起交给模型。此刻它的参数还是随机数，对垃圾邮件一无所知 —— 1000 封试卷大约要错 493 封。' },
  { title: '② 模型预测', sub: '用当前参数，硬着头皮猜', desc: '对每封邮件给出判断：“是垃圾邮件吗？”参数有多离谱，猜得就有多离谱 —— 开局基本等于抛硬币。' },
  { title: '③ 与正确答案比对', sub: '量出“错了多少”', desc: '把猜测和人工标注一对，数出错题数：误差就是一个实打实的数字。没有玄学，只有对与错。' },
  { title: '④ 微调参数', sub: '朝更准的方向，拧一点点', desc: '照着误差，把参数往“下次能少错几封”的方向轻轻拧一下，然后立刻回到第 ② 步再猜一遍。单圈进步小得可怜 —— 但它一秒能转几千圈。' },
  { title: '✓ 误差足够小：训练完成', sub: '跳出循环 · 规则到手', desc: '误差降到可接受，循环停止。此刻固化在参数里的那套判断方式，就是机器“自己找出的规则”。上线之后它默认不再学习，只负责执行（见小练习第 3 题）。' },
]
const ROUNDS = [
  { label: '第 1 圈', err: 471 }, { label: '第 2 圈', err: 455 }, { label: '第 3 圈', err: 440 },
  { label: '第 10 圈', err: 392 }, { label: '第 100 圈', err: 241 }, { label: '第 1000 圈', err: 118 },
  { label: '第 1 万圈', err: 46 }, { label: '第 100 万圈', err: 12 },
]
const START_ERR = 493
const LAST = ROUNDS.length - 1

function TrainingLoopDemo() {
  const [cur, setCur] = useState(0)
  const [round, setRound] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [finished, setFinished] = useState(false)
  const timerRef = useRef(null)
  // 用 ref 保存最新状态，供 interval 回调读取
  const stateRef = useRef({ cur: 0, round: -1 })
  stateRef.current = { cur, round }

  const err = (r) => (r < 0 ? START_ERR : ROUNDS[r].err)
  const isDone = (c, r) => c === 4 && r === LAST

  function stopPlay() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setPlaying(false)
  }

  function advance() {
    const { cur: c, round: r } = stateRef.current
    if (c === 4) return
    if (c === 0) { setCur(1); return }
    if (c === 3) {
      const nr = r + 1
      if (nr >= LAST) { setRound(LAST); setCur(4); setFinished(true); stopPlay(); return }
      setRound(nr); setCur(1); return
    }
    setCur(c + 1)
  }

  function jump(step) { stopPlay(); setCur(step) }
  function reset() { stopPlay(); setRound(-1); setCur(0); setFinished(false) }

  function togglePlay() {
    if (finished) return
    if (timerRef.current) { stopPlay(); return }
    setPlaying(true)
    timerRef.current = setInterval(advance, 560)
  }

  useEffect(() => {
    if (reduceMotion()) { setRound(LAST); setCur(4); setFinished(true) }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const done = isDone(cur, round)
  const errN = err(round)
  const nodeCls = (k) => `ln${k === cur ? ' active' : ' dim'}`

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · 一次完整的学习循环</span>
        <span className="demo-hint">点击节点看每一步在干嘛 · 或点“自动转圈”看误差一路下降</span>
      </div>
      <div className="demo-body single">
        <div className="demo-stage">
          <svg id="loop-svg" viewBox="0 0 680 368" width="660" role="img" aria-label="机器学习训练循环流程图">
            <defs>
              <marker id="arr" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 z" fill="var(--fg-2)" />
              </marker>
              <marker id="arr-sage" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 z" fill="var(--sage)" />
              </marker>
            </defs>
            <g className={nodeCls(0)} onClick={() => jump(0)}>
              <rect x="16" y="140" width="132" height="84" rx="12" fill="var(--bg-inset)" stroke="var(--hairline-strong)" strokeWidth="1.5" />
              <text x="82" y="178" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--fg-0)">① 数据</text>
              <text x="82" y="198" textAnchor="middle" fontSize="11" fill="var(--fg-1)">10 万封已标注邮件</text>
            </g>
            <g className={nodeCls(1)} onClick={() => jump(1)}>
              <rect x="212" y="48" width="172" height="84" rx="12" fill="var(--sky-bg)" stroke="var(--sky)" strokeWidth="1.5" />
              <text x="298" y="86" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--fg-0)">② 模型预测</text>
              <text x="298" y="106" textAnchor="middle" fontSize="11" fill="var(--fg-1)">“这封是垃圾邮件吗？”</text>
            </g>
            <g className={nodeCls(2)} onClick={() => jump(2)}>
              <rect x="468" y="48" width="196" height="84" rx="12" fill="var(--amber-bg)" stroke="var(--amber)" strokeWidth="1.5" />
              <text x="566" y="86" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--fg-0)">③ 与正确答案比对</text>
              <text x="566" y="106" textAnchor="middle" fontSize="11" fill="var(--fg-1)">量出“错了多少” = 误差</text>
            </g>
            <g className={nodeCls(3)} onClick={() => jump(3)}>
              <rect x="468" y="232" width="196" height="84" rx="12" fill="var(--terracotta-bg)" stroke="var(--terracotta)" strokeWidth="1.5" />
              <text x="566" y="270" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--fg-0)">④ 微调参数</text>
              <text x="566" y="290" textAnchor="middle" fontSize="11" fill="var(--fg-1)">朝更准的方向拧一点点</text>
            </g>
            <path d="M 148 166 C 184 166, 176 90, 206 90" fill="none" stroke="var(--fg-2)" strokeWidth="1.6" markerEnd="url(#arr)" />
            <path d="M 384 90 L 462 90" fill="none" stroke="var(--fg-2)" strokeWidth="1.6" markerEnd="url(#arr)" />
            <path d="M 566 132 L 566 225" fill="none" stroke="var(--fg-2)" strokeWidth="1.6" markerEnd="url(#arr)" />
            <path d="M 468 274 C 350 274, 298 212, 298 138" fill="none" stroke="var(--fg-2)" strokeWidth="1.6" markerEnd="url(#arr)" />
            <text x="392" y="182" textAnchor="middle" fontSize="13.5" fontWeight="700" fill="var(--fg-0)">
              {done ? '✓ 100 万圈转完' : round < 0 ? '🔁 还没开始转' : '🔁 ' + ROUNDS[round].label}
            </text>
            <text x="392" y="202" textAnchor="middle" fontSize="11" fill="var(--fg-1)">1000 封试卷 · 错 {errN} 封</text>
            <path d="M 462 300 C 390 300, 320 306, 246 308" fill="none" stroke="var(--sage)" strokeWidth="1.6" strokeDasharray="5 4" markerEnd="url(#arr-sage)" />
            <g className={nodeCls(4)} onClick={() => jump(4)}>
              <rect x="16" y="272" width="222" height="76" rx="12" fill="var(--sage-bg)" stroke="var(--sage)" strokeWidth="1.5" strokeDasharray="5 4" />
              <text x="127" y="304" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--fg-0)">✓ 误差足够小：训练完成</text>
              <text x="127" y="324" textAnchor="middle" fontSize="11" fill="var(--fg-1)">学到的参数 = 它找到的规则</text>
            </g>
          </svg>
        </div>
      </div>
      <div className="demo-foot">
        <div>
          <Chips
            options={[
              { key: 0, label: '① 喂数据' }, { key: 1, label: '② 预测' }, { key: 2, label: '③ 比对' },
              { key: 3, label: '④ 微调' }, { key: 4, label: '✓ 出口' },
            ]}
            value={cur}
            onChange={jump}
          />
          <div className="loop-controls">
            <button className="chip" onClick={() => { stopPlay(); advance() }}>▸ 走一步</button>
            <button className={`chip${playing ? ' active' : ''}`} disabled={finished} onClick={togglePlay}>
              {finished ? '✓ 已转完' : playing ? '⏸ 暂停' : '▶ 自动转圈'}
            </button>
            <button className="chip" onClick={reset}>↺ 重置</button>
          </div>
          <div className={`errbar${done ? ' done' : ''}`}>
            <div className="errbar-top"><span>误差：1000 封试卷里猜错</span><b>{errN} 封</b></div>
            <div className="errbar-track"><div className="errbar-fill" style={{ width: (errN / 1000) * 100 + '%' }} /></div>
          </div>
        </div>
        <div>
          <h4>{STEPS[cur].title}</h4>
          <div className="period">{STEPS[cur].sub}</div>
          <p>{STEPS[cur].desc}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 交互二：大模型的练习册（猜下一个词）
// ============================================================
const SENTS = [
  { prompt: '床前明月＿', note: '✓ 答案自带：原文下一个词就是「光」—— 没人标注，原文就是答案。',
    toks: [{ t: '光', p: 0.78 }, { t: '色', p: 0.1 }, { t: '影', p: 0.06 }, { t: '饼', p: 0.04 }, { t: '鸭', p: 0.02 }] },
  { prompt: '今天天气真＿', note: '✓ 这题没有唯一答案：「好」「不错」「冷」都常见，它学的是一整张概率表。',
    toks: [{ t: '好', p: 0.45 }, { t: '不错', p: 0.24 }, { t: '冷', p: 0.17 }, { t: '差', p: 0.1 }, { t: '香蕉', p: 0.04 }] },
  { prompt: '猫蹲在＿', note: '✓ 概率里藏着常识：猫不爱下水、也上不了月亮 —— 全是从文本统计里白捡的。',
    toks: [{ t: '窗台上', p: 0.41 }, { t: '键盘上', p: 0.27 }, { t: '沙发上', p: 0.22 }, { t: '水里', p: 0.06 }, { t: '月亮上', p: 0.04 }] },
]
const STAGES = [
  { max: 8, data: '0 字', title: '刚出厂 · 纯乱猜', desc: '参数全是随机数，五个候选的概率几乎一样。这时它连“你好”都接不顺 —— 所谓“语言天赋”，一点也没有。' },
  { max: 50, data: '几亿字', title: '训练中 · 循环疯转', desc: '每道填空题都自带答案：猜 → 对答案 → 微调，同一个循环在海量文本上日夜重复。常见说法的概率被一点点推高，离谱选项被一点点压低。' },
  { max: 88, data: '一座图书馆', title: '规律开始沉淀', desc: '语言的套路、常识、甚至整首唐诗，都以“谁更可能接在谁后面”的形式压进参数。没有谁教它语法 —— 统计本身就够了。' },
  { max: 1e9, data: '整个互联网', title: '训练完成 · 概率笃定', desc: '分布已经非常笃定。但注意：它并没有“理解”月光，只是「光」接在这句诗后面的统计证据压倒性地多 —— 这正是下面误区 ③ 要拆的。' },
]

function NextTokenDemo() {
  const [cur, setCur] = useState(0)
  const [v, setV] = useState(() => (reduceMotion() ? 100 : 0))
  const s = SENTS[cur]
  const t = v / 100
  const e = t * t * (3 - 2 * t)
  const probs = s.toks.map((tk) => 0.2 + (tk.p - 0.2) * e)
  const mx = Math.max(...probs)
  const peaked = mx - Math.min(...probs) > 0.04
  const st = STAGES.filter((x) => v < x.max)[0] || STAGES[STAGES.length - 1]

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · 大模型的练习册：猜下一个词</span>
        <span className="demo-hint">换一句话 · 拖动“训练量”，看概率怎么被一口一口喂出来</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="tok-svg" viewBox="0 0 440 292" width="420" role="img" aria-label="下一个词概率演示">
            <text x="16" y="34" fontSize="19" fontWeight="700" fill="var(--fg-0)">{s.prompt}</text>
            <text x="16" y="56" fontSize="11" fill="var(--fg-2)">模型的任务：猜下一个词是什么（5 个候选）</text>
            {s.toks.map((tk, i) => {
              const y = 76 + i * 38
              const top = peaked && probs[i] === mx
              return (
                <g key={i}>
                  <text x="16" y={y + 14} fontSize="13" fontWeight="600" fill="var(--fg-0)">{tk.t}</text>
                  <rect x="86" y={y} width="288" height="18" rx="6" fill="var(--bg-inset)" stroke="var(--hairline)" />
                  <rect className="bar" x="86" y={y} width={Math.min(288, 6 + probs[i] * 340)} height="18" rx="6" fill={top ? 'var(--sage)' : 'var(--sky)'} />
                  <text x="430" y={y + 13} textAnchor="end" fontSize="12" fontWeight="700" fill={top ? 'var(--sage)' : 'var(--fg-1)'}>{Math.round(probs[i] * 100)}%</text>
                </g>
              )
            })}
            <text id="tok-note" x="16" y="280" fontSize="11.5" fontWeight="600" fill="var(--sage)" opacity={v >= 88 ? 1 : 0}>{s.note}</text>
          </svg>
        </div>
        <div className="demo-side">
          <Chips
            options={SENTS.map((x, i) => ({ key: i, label: x.prompt }))}
            value={cur}
            onChange={setCur}
          />
          <div className="slider-row">
            <label>训练量</label>
            <input type="range" min={0} max={100} step={1} value={v} onChange={(ev) => setV(+ev.target.value)} />
            <span className="val" id="tok-stage-val">{st.data}</span>
          </div>
          <h4>{st.title}</h4>
          <p>{st.desc}</p>
        </div>
      </div>
    </div>
  )
}

const FLIPS = [
  { q: '大模型预训练：把整个互联网切成“猜下一个词”的填空题', pill: { type: 'sage', text: '自监督（监督学习的免费版）' },
    why: '题目和答案都来自原文本身，零人工标注 —— 这正是它能吃下万亿个词的原因。' },
  { q: 'ChatGPT 训练的最后一关：人类给回答打分，好评加分、差评扣分', pill: { type: 'terracotta', text: '强化学习' },
    why: '没有标准答案，只有事后的奖惩 —— 这就是 RLHF 里那个“RL”。' },
  { q: '房产 App 用历史成交记录，预测你家小区的房子能卖多少万', pill: { type: 'sky', text: '监督学习 · 回归' },
    why: '历史成交自带标准答案（真实价格），猜的是一个连续的数 —— 填数字题就是回归。' },
  { q: '音乐 App 把口味相近的听众自动聚成圈子，事先没人规定分几类', pill: { type: 'amber', text: '无监督学习 · 聚类' },
    why: '没有任何标准答案，机器自己在数据里找结构 —— 典型的聚类。' },
  { q: '指令微调：人工写好一万条“问题 + 模范回答”喂给大模型', pill: { type: 'sky', text: '监督学习' },
    why: '模范回答就是人标的标准答案 —— 和垃圾邮件那本“练习册”本质相同，只是题目换成了对话。' },
  { q: '游戏 AI 自己跟自己下一亿盘棋：赢了加分，输了扣分', pill: { type: 'terracotta', text: '强化学习' },
    why: 'AlphaGo 同款配方：试错 + 奖励，在海量对局里摸出拿高分的策略。' },
]

export default function L02() {
  return (
    <>
      <Lsec title="🎯 你将学会">
        <div className="card goals">
          <div className="goal-item"><span className="tick">✓</span>一句话说清传统编程和机器学习的根本区别：规则到底是谁找出来的</div>
          <div className="goal-item"><span className="tick">✓</span>分清三种学习范式 —— 监督、无监督、强化，看到任何 AI 应用都能立刻归类</div>
          <div className="goal-item"><span className="tick">✓</span>亲手转动“猜 → 比对 → 微调”的训练循环，看着误差一圈一圈降下来</div>
          <div className="goal-item"><span className="tick">✓</span>看懂 ChatGPT 的配方：把互联网变成万亿道“填空题”，三种范式一条流水线用齐</div>
          <div className="goal-item"><span className="tick">✓</span>拆穿三个流行误解：“自学成精”、“数据越多越好”、“模型理解了任务”</div>
        </div>
      </Lsec>

      <Lsec
        title="💡 核心概念：把箭头掉个头"
        lead="想象你是 2002 年的工程师，老板要你写一个垃圾邮件过滤器，你手里只有一种武器：if-else。先看两条技术路线的根本差别 —— 整个 AI 时代，就藏在这两张卡片的箭头方向里。"
      >
        <div className="contrast">
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-ink">老路 · 传统编程</span></div>
            <div className="big">规则 + 数据 <span className="gap">→</span> 答案</div>
            <p className="note">人来写规则。程序员把判断逻辑一条条写成代码，数据流进来，按规则算出答案。规则说得清的任务（算个税、算运费）它又快又稳 —— 可规则说不清的呢？</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">新路 · 机器学习</span></div>
            <div className="big">数据 + 答案 <span className="gap">→</span> <span className="hl">规则</span></div>
            <p className="note">人只提供原料：一大堆数据，外加每条数据的正确答案。机器反过来<b>自己找规则</b> —— 它找出来的这套规则，就是我们常说的“模型”。</p>
          </div>
        </div>
        <div className="example mt14">
          <div className="en">if 含“中奖” → 拦截；if 含“免费” → 拦截；if 标题全是大写 → 拦截……</div>
          <div className="zh">写到第 500 条规则，骗子把“中奖”改成“中　奖”或“恭喜您獲獎”，全部失效；继续补规则，规则之间又开始互相打架，正常邮件被误杀 —— 这叫<b>规则爆炸</b>，老路的死穴。</div>
        </div>
        <p className="lead mt14">机器学习的解法干脆利落：收集 10 万封邮件，人工标好“垃圾 / 正常”，整批喂给算法，让它自己统计出“哪些特征组合最可疑”。它学出的判别规则比 500 条 if-else 细腻得多，而且骗子一变招，再喂一批新邮件重新训练就能跟上。这次掉头的真正威力在于：那些人类<b>会做、却说不清怎么做</b>的事 —— 认猫、听语音、做翻译 —— 第一次变得可解。你写不出“猫”的定义，但你拿得出一百万张猫的照片。</p>
      </Lsec>

      <Lsec
        title="📖 三种学习范式：答案从哪儿来"
        lead="“喂数据”也分三种喂法，区别只在一个问题上：正确答案从哪儿来？这三个词在 AI 新闻里出场率极高，认清它们，后面的课会轻松很多。"
      >
        <div className="use-grid">
          <div className="card use-card">
            <div className="label">范式一 · 答案人来标</div>
            <div className="en">监督学习 <b>Supervised</b></div>
            <div className="zh">拿“带答案的练习册”刷题：每条数据都配有标准答案。猜“是不是垃圾邮件”这类选择题叫<b>分类</b>，猜“这套房值多少万”这类填数字题叫<b>回归</b>。工业界落地的模型，大半是它。</div>
          </div>
          <div className="card use-card">
            <div className="label">范式二 · 没有答案</div>
            <div className="en">无监督学习 <b>Unsupervised</b></div>
            <div className="zh">只给数据、不给答案，让机器自己发现结构。最常见的是<b>聚类</b>：把千万用户按行为自动分成“剁手党”“比价党”“潜水党”—— 分几群、按什么分，事先没人规定。</div>
          </div>
          <div className="card use-card">
            <div className="label">范式三 · 试错 + 奖励</div>
            <div className="en">强化学习 <b>Reinforcement</b></div>
            <div className="zh">没有练习册，只有一个会打分的环境：做对加分、做错扣分，在海量试错里摸索出拿高分的<b>策略</b>。AlphaGo 的神之一手、打游戏的 AI、学走路的机器人，都靠它。</div>
          </div>
        </div>
        <div className="example mt14">
          <div className="en">三秒归类口诀：先问“答案从哪来？”</div>
          <div className="zh">答案是人提前标好的 → 监督学习；压根没有答案、只想找结构 → 无监督学习；答案是环境事后给的奖惩 → 强化学习。记牢这三个词 —— 待会儿你会看到，造一个 ChatGPT，三种喂法会在同一条流水线上全部登场。</div>
        </div>
      </Lsec>

      <Lsec
        title="📖 学习是个循环：猜 → 比对 → 微调"
        lead="知道了“机器自己找规则”，下一个问题自然是：它到底怎么找？答案朴素得让人意外 —— 不靠灵感，靠一个不断重复的小循环。这次别光看图，亲手转一转它："
      >
        <TrainingLoopDemo />
        <div className="card mt14">
          <table className="match">
            <thead>
              <tr><th>步骤</th><th>机器在做什么</th><th>放到垃圾邮件里看</th></tr>
            </thead>
            <tbody>
              <tr><td className="be">① 喂数据</td><td className="ex">给模型看一批样本和对应的正确答案</td><td className="ex">10 万封邮件，每封都标了“垃圾 / 正常”</td></tr>
              <tr><td className="be">② 模型预测</td><td className="ex">用当前参数硬着头皮先猜一个答案</td><td className="ex">刚开始纯属乱猜，对错大约各一半</td></tr>
              <tr><td className="be">③ 比对答案</td><td className="ex">把猜测和标准答案一比，算出误差</td><td className="ex">“这 1000 封里猜错了 380 封”</td></tr>
              <tr><td className="be">④ 微调参数</td><td className="ex">朝让误差变小的方向，把参数拧一点点</td><td className="ex">调完再猜：错 379 封 —— 进步了一丁点</td></tr>
            </tbody>
          </table>
        </div>
        <p className="lead mt14">这个“猜 → 比对 → 微调”的闭环，行话就叫<b>训练（training）</b>。你刚才亲眼看到了：单看一圈进步小得可怜，但它一秒能转成千上万圈 —— “学习”的全部秘密就是<b>笨办法 × 巨大次数</b>。至于第④步“朝哪个方向拧、拧多少”是怎么算出来的，那是深度学习最核心的魔法，留给第 4 课《训练就是下山》专门讲；下一课（第 3 课）先去认识被拧的东西 —— 参数本人。</p>
      </Lsec>

      <Lsec
        title="🤖 同一个循环，喂出 ChatGPT"
        lead="你可能想问：这套“猜 → 比对 → 微调”，跟 ChatGPT 这样的大语言模型（LLM）有什么关系？答案是：关系就是全部 —— 大模型就是这个循环开到极限的产物。变化只有两处：题目换了，规模炸了。"
      >
        <div className="example">
          <div className="en">题目：从“这封邮件是垃圾吗”，换成“<span className="hl">猜下一个词</span>”</div>
          <div className="zh">把互联网上的文本遮住一截让模型猜：“床前明月＿”。妙处在于：<b>答案自带</b> —— 下一个词就写在原文里，根本不用人工标注。机器自己出题、自己对答案，行话叫<b>自监督学习</b>，可以理解成“监督学习的免费版”。标注免费，数据规模才能从 10 万封邮件，冲到<b>万亿个词</b>。</div>
        </div>
        <p className="lead mt14">一个朴素到让人不敢信的事实：ChatGPT 写诗、写代码、答题的全部本事，都是从“猜下一个词”这一道题里长出来的 —— 题目足够简单 + 数据足够海量 + 循环转够多次，仅此而已。拖动下面的滑块，亲手“喂大”一个小模型：</p>
        <NextTokenDemo />
        <p className="lead mt14">当然，光会接话还成不了 ChatGPT。从“复读机”到“助手”，要闯三关 —— 注意看每张卡片上的范式标签：上一节的三种学法，在这条流水线里<b>全部登场</b>。</p>
        <div className="use-grid">
          <div className="card use-card">
            <div className="label">第一关 · 烧掉绝大部分算力</div>
            <div className="en">预训练 <b>Pretraining</b></div>
            <div className="zh"><span className="pill pill-sage">自监督 ≈ 监督学习的免费版</span></div>
            <div className="zh">拿海量互联网文本刷“猜下一个词”，几个月转上万亿圈。出炉时它已装下语言、知识和套路，但只会接话。第 12 课细讲。</div>
          </div>
          <div className="card use-card">
            <div className="label">第二关 · 学会“好好答题”</div>
            <div className="en">指令微调 <b>SFT</b></div>
            <div className="zh"><span className="pill pill-sky">监督学习</span></div>
            <div className="zh">人工精心写一批“问题 + 模范回答”喂给它 —— 这回答案真是人标的。它从“只会接话的复读机”，变成“会回答问题的助手”。</div>
          </div>
          <div className="card use-card">
            <div className="label">第三关 · 磨脾气</div>
            <div className="en">人类反馈强化学习 <b>RLHF</b></div>
            <div className="zh"><span className="pill pill-terracotta">强化学习</span></div>
            <div className="zh">让人给它的回答打分：有用、诚实加分，胡说、冒犯扣分。在奖惩里反复试错，把说话方式磨得让人放心。第 13 课细讲。</div>
          </div>
        </div>
      </Lsec>

      <Lsec
        title="🎛️ 动手分一分：这是哪种学法？"
        lead="下面 6 个场景分别用的哪种范式？先自己判断，再点卡片揭晓。口诀照旧：答案从哪儿来？"
      >
        <div className="flip-grid">
          {FLIPS.map((f, i) => <FlipCard key={i} q={f.q} pill={f.pill} why={f.why} />)}
        </div>
      </Lsec>

      <Lsec title="⚠️ 常见误区">
        <div className="card alert-card row-list">
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">机器学习 = 机器像人一样“自学成精”</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">它是一个纯数学的优化过程：照着误差信号，机械地把一堆数字微调到位</span></div>
            </div>
            <p className="why"><b>病因：</b>“学习”这个词太有人味。机器没有好奇心、也不会顿悟，它只是没日没夜地重复“猜 → 比对 → 微调”。ChatGPT 也不例外 —— 它的全部“学习”，就是把“猜下一个词”这道题做了上万亿遍。把它想成“自动调参的统计机器”，你对它能力和短板的预判反而会准得多。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">数据越多，模型一定越好</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">数据的质量与分布往往比数量更关键 —— 垃圾进，垃圾出</span></div>
            </div>
            <p className="why"><b>病因：</b>新闻总爱炫耀“用了多少万亿数据”。可 100 万条标错的样本，不如 1 万条标对的；只用大城市房价训练的模型，搬到县城必然失灵 —— 数据没覆盖到的情形，模型学不会。大模型厂商如今花大价钱“洗数据”、买高质量语料，正是这个道理。这个坑第 5 课细讲。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">模型答对了，说明它“理解”了任务</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">它只是拟合了统计规律：在见过的数据里，找到了特征与答案之间的相关性</span></div>
            </div>
            <p className="why"><b>病因：</b>拟人化的宣传语。一个经典翻车案例：区分狼和哈士奇的模型，实际学到的规律是“背景有雪 = 狼”—— 因为训练照片里狼总站在雪地上。换一张草地上的狼，它立刻认错。大模型的“一本正经胡说八道”（幻觉）同根同源：它输出的是“统计上最像答案的词”，而不是“查证过的事实”，第 29 课细讲。</p>
          </div>
        </div>
      </Lsec>

      <Lsec title="✍️ 小练习">
        <div className="card quiz row-list">
          <QuizItem q="1. 把三个系统归到对应范式：A. 银行用十年带结果的放贷记录，预测新申请人会不会违约；B. 电商把千万用户按购物行为自动分成几群，事先没人规定分几类；C. 游戏 AI 靠“赢了加分、输了扣分”自己练成高手。">
            <b>A 监督学习</b>（历史记录自带答案“违约 / 没违约”，是分类问题）；<b>B 无监督学习</b>（没有标准答案，自己找结构，即聚类）；<b>C 强化学习</b>（试错 + 奖励）。口诀照用：答案从哪来？
          </QuizItem>
          <QuizItem q="2. 公司有两个需求：“自动判断报销金额是否超标”和“识别发票照片上的文字”。分别该用传统编程还是机器学习？">
            金额是否超标：规则一句话就能说清（金额 &gt; 限额），<b>传统编程</b>一行 if 搞定，又快又稳还可解释；识别照片文字：规则根本写不出来，但带答案的样本好收集，该上<b>机器学习</b>。记住工程铁律：能用 if 写清楚的事，永远别先上机器学习。
          </QuizItem>
          <QuizItem q="3. 判断：一个训练完成、已经上线的垃圾邮件过滤模型，每天处理新邮件时，还在继续“学习”吗？">
            <b>默认不在。</b>训练和使用（行话叫“推理”）是两个分开的阶段：上线后参数被“冻结”，它只是在执行已经学到的规则。想让它变聪明，要收集新数据、重新训练一轮再上线 —— 这也是大模型会有“知识截止日期”的原因。
          </QuizItem>
          <QuizItem q="4. 大模型预训练吃掉了几乎整个互联网的文本，却基本不需要人工标注。它的“标准答案”是从哪来的？">
            <b>答案就藏在数据里。</b>把原文遮住一截让模型“猜下一个词”，被遮住的词本身就是标准答案 —— 机器自己出题、自己对答案（自监督学习）。标注成本约等于零，规模才能从“10 万封邮件”冲到“万亿个词”；而到了指令微调和 RLHF 阶段，就重新需要人来写答案、打分了。
          </QuizItem>
        </div>
      </Lsec>
    </>
  )
}
