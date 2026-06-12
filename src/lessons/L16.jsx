import { useState } from 'react'
import { Lsec, Pill, FlipCard, QuizItem } from '../components/ui.jsx'

// ============================================================
// ① 续写区"圈地机"
// ============================================================
const STYLES = [
  { key: 'wiki', label: '百科条目式', base: 34, preview: '「量子计算是一种利用量子力学原理进行信息处理的计算范式，其基本单元为量子比特……」' },
  { key: 'paper', label: '学术综述式', base: 20, preview: '「近年来，随着量子比特相干时间的延长与纠错码的进展，含噪中等规模量子（NISQ）器件……」' },
  { key: 'pop', label: '高中科普式', base: 15, preview: '「想象一枚还在空中旋转的硬币 —— 它既不是正面也不是反面，而是两种可能同时存在……」' },
  { key: 'forum', label: '论坛抖机灵式', base: 17, preview: '「简单说：就是快，快得离谱。具体多快？反正你家 Wi-Fi 密码顶不住。懂？」' },
  { key: 'hype', label: '营销热文式', base: 14, preview: '「量子计算！下一个十年最大的风口！现在看懂的人，相当于 1999 年就看懂了互联网……」' },
]
const ING = {
  role: { mult: { pop: 2.8, wiki: 0.65, paper: 0.35, forum: 0.5, hype: 0.85 }, mech: '「科普专栏作者」六个字，把分布从“全网平均”拽向训练数据里科普作者笔下的那片文本区 —— 百科腔和论文腔应声下跌。' },
  aud: { mult: { pop: 2.2, wiki: 0.55, paper: 0.18, forum: 0.75, hype: 0.7 }, mech: '受众词决定“写给谁看”：「没学过物理的高中生」一出现，多比喻、少术语的文本区被抬高，学术综述几乎出局。' },
  fmt: { mult: { pop: 1.8, wiki: 0.65, paper: 0.25, forum: 0.85, hype: 0.75 }, mech: '格式约束是上下文里的硬锚点：「不出现公式」直接封死论文区的路，「300 字以内」剪掉长篇百科的尾巴。' },
  bnd: { mult: { pop: 1.2, wiki: 1.0, paper: 1.05, forum: 0.6, hype: 0.18 }, mech: '边界句给“不吹”留出路：营销热文区靠夸大为生，这句话一出，它的概率被压到地板 —— 这正是技法⑤降幻觉的原理。' },
}
const DEFAULT_STATUS = '不加任何条件时，“百科条目式”是最安全的延续 —— 这就是答案“又水又泛”的来源：不是模型不行，是续写范围太宽，它只能取平均。'
const PR_BAR_MAX = 270
const PF_ROWS = [['role', '＋ 你是科普专栏作者，', 73], ['aud', '＋ 讲给完全没学过物理的高中生听：', 94], ['fmt', '＋ 多用比喻，不出现公式，300 字以内。', 115], ['bnd', '＋ 拿不准的进展直说“尚无定论”，不要夸大。', 136]]
const PR_ROW_Y = { wiki: 171, paper: 201, pop: 231, forum: 261, hype: 291 }

function computePr(active) {
  let sum = 0
  const probs = {}
  STYLES.forEach((s) => {
    let w = s.base
    for (const k in ING) if (active[k]) w *= ING[k].mult[s.key]
    probs[s.key] = w; sum += w
  })
  let top = STYLES[0], sumSq = 0
  STYLES.forEach((s) => {
    const p = probs[s.key] / sum
    probs[s.key] = p; sumSq += p * p
    if (p > probs[top.key]) top = s
  })
  return { probs, top, eff: 1 / sumSq }
}

function ZoneDemo() {
  const [active, setActive] = useState({ role: false, aud: false, fmt: false, bnd: false })
  const [last, setLast] = useState(null) // {key, turnedOn}
  const { probs, top, eff } = computePr(active)
  const count = Object.values(active).filter(Boolean).length

  const toggle = (key) => {
    const on = !active[key]
    setActive((a) => ({ ...a, [key]: on }))
    setLast({ key, turnedOn: on })
  }
  const reset = () => { setActive({ role: false, aud: false, fmt: false, bnd: false }); setLast(null) }

  let status
  if (last && last.turnedOn) {
    status = ING[last.key].mech
    if (count === 4) status += ' 四味配料齐活：续写范围收成一条窄缝，输出基本“指哪打哪” —— 剩下的随机性，交给第 14 课的温度。'
  } else if (last && !last.turnedOn) {
    status = '撤掉一味配料，分布立刻弹回去 —— prompt 里每个字都在给续写“投票”，字没了，票就没了。'
  } else status = DEFAULT_STATUS

  const gaugeW = Math.max(12, ((eff - 1) / 4) * PR_BAR_MAX)
  const gaugeWord = eff >= 3 ? '宽 · 全网平均' : eff >= 1.8 ? '收窄中' : '窄 · 指哪打哪'

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · 续写区“圈地机”</span>
        <span className="demo-hint">点右侧配料增删 · 左图分布实时联动</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="pr-svg" viewBox="0 0 460 352" width="440" aria-label="交互图：当前 prompt 与五种续写文体的概率条">
            <text x="20" y="20" fontSize="12" fill="var(--fg-2)">你写下的 prompt（灰色 = 还没加上）</text>
            <rect x="20" y="28" width="420" height="112" rx="8" fill="var(--bg-inset)" />
            <text className="pf on" x="32" y="52" fontSize="12.5" fill="var(--fg-0)">解释一下量子计算。</text>
            {PF_ROWS.map(([k, txt, y]) => (
              <text key={k} className={`pf${active[k] ? ' on' : ''}`} x="32" y={y} fontSize="12.5" fill={active[k] ? 'var(--fg-0)' : 'var(--fg-2)'}>{txt}</text>
            ))}
            <text x="20" y="164" fontSize="12" fill="var(--fg-2)">接下来最可能续写成 ——</text>
            {STYLES.map((s) => {
              const y = PR_ROW_Y[s.key]
              const pc = probs[s.key]
              return (
                <g key={s.key}>
                  <text x="20" y={y + 13} fontSize="12.5" fill="var(--fg-1)">{s.label}</text>
                  <rect className="bar" x="124" y={y} width={Math.max(2, pc * PR_BAR_MAX)} height="18" rx="4" fill={s.key === top.key ? 'var(--sage)' : 'var(--sky)'} fillOpacity="0.78" />
                  <text x="440" y={y + 13} textAnchor="end" fontSize="11.5" fill="var(--fg-1)">{pc < 0.005 ? '≈0%' : Math.round(pc * 100) + '%'}</text>
                </g>
              )
            })}
            <text x="20" y="338" fontSize="12" fill="var(--fg-2)">续写范围</text>
            <rect x="124" y="330" width="270" height="9" rx="4.5" fill="var(--hairline)" />
            <rect className="gauge-fill" x="124" y="330" width={gaugeW} height="9" rx="4.5" fill="var(--amber)" />
            <text x="440" y="338" textAnchor="end" fontSize="11.5" fill="var(--fg-1)">{gaugeWord}</text>
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            {[['role', '① 角色'], ['aud', '② 受众'], ['fmt', '③ 格式'], ['bnd', '④ 边界']].map(([k, label]) => (
              <button key={k} className={`chip${active[k] ? ' active' : ''}`} onClick={() => toggle(k)}>{label}</button>
            ))}
            <button className="chip" onClick={reset}>↺ 全部撤掉</button>
          </div>
          <h4>续写头名：{top.label}</h4>
          <div className="period">概率约 {Math.round(probs[top.key] * 100)}% · 已加 {count} / 4 味配料</div>
          <div className="pr-preview">{top.preview}</div>
          <p>{status}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ② 约束放 user 还是 system
// ============================================================
const SU_TURNS = [
  { u: '《Rust 入门》这本多少钱？', user: { t: '定价 79 元，本周新课首发 5 折，39.5 元。需要帮你下单吗？', n: 2 }, sys: { t: '定价 79 元，本周新课首发 5 折，39.5 元。需要帮你下单吗？', n: 2 } },
  { u: '顺便聊聊，你觉得 Rust 难学吗？', user: { t: 'Rust 的学习曲线确实偏陡。不过理解所有权之后就会顺很多。我们的课程是专为零基础设计的。建议你先试试免费的第一章。', n: 4 }, sys: { t: '上手有门槛，但课程从所有权讲起，零基础能跟上。先试试免费的第一章？', n: 2 } },
  { u: '帮我推荐 5 本进阶书，每本都详细介绍一下。', user: { t: '好的！第一本《Rust 程序设计语言》是官方教程，从变量讲到并发，适合系统过一遍。第二本《Rust for Rustaceans》面向进阶开发者……第三本……第四本……（一口气讲了 9 句）', n: 9 }, sys: { t: '篇幅所限挑 3 本最值得的：官方书打底、《Rust for Rustaceans》进阶、《Programming Rust》当工具书。想要更细的对比再告诉我。', n: 2 } },
  { u: '对了，买了能退吗？', user: { t: '当然可以退款！我们的政策是：开课 7 天内可无理由退款。超过 7 天但未学完第二章也可以协商。另外结课后还有奖学金返现活动。具体规则是这样的……', n: 5 }, sys: { t: '可以，开课 7 天内未学完第二章可全额退。在订单页点“申请退款”即可。', n: 2 } },
]
const SU_EXPL = {
  user: ['第 1 轮：约束就在眼前，模型乖乖 2 句答完。目前看不出差别 —— 差别在后面。', '第 2 轮：新话题一展开，“3 句”的票数开始被稀释 —— 已经悄悄多出一句了。', '第 3 轮：约束被压在三轮对话底下，「逐本介绍 5 本」这种强势续写直接把它淹了：9 句。', '第 4 轮：彻底忘了。user 里的约束只是众多历史消息之一，越聊越往后排，影响力被新内容一轮轮稀释。'],
  sys: ['第 1 轮：同样 2 句 —— 但原因不同：这次是“人物小传”在压阵。', '第 2 轮：话题展开，依然不超过 3 句。system 不随对话滚动，永远排在最前面。', '第 3 轮：面对「逐本介绍 5 本」的强势请求，它选择只挑 3 本 —— 对齐训练教过它：system 的规矩优先于 user 的要求。', '第 4 轮：全程没破功。全局约束放 system，靠的不是玄学，是“位置固定 + 指令层级训练”的双保险。'],
}

function SuMsg({ cls, role, text, badge }) {
  return (
    <div className={`su-msg ${cls}`}>
      <span className="su-role">{role}</span>
      <span className="su-text">{text}</span>
      {badge && <span className={`su-badge ${badge.n <= 3 ? 'ok' : 'over'}`}>{badge.n <= 3 ? '✓ ' : '✗ '}{badge.n} 句</span>}
    </div>
  )
}

function SystemDemo() {
  const [mode, setMode] = useState('user')
  const [step, setStep] = useState(1)

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · 约束放哪才“管用”</span>
        <span className="demo-hint">切换约束位置 · 点「再聊一轮」步进对比</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <div className="su-chat" aria-label="模拟对话记录">
            {mode === 'sys'
              ? <SuMsg cls="sys" role="system" text='你是“云帆书店”客服助手，友好简洁，每次回答不超过 3 句。' />
              : <SuMsg cls="user" role="user" text="记住：接下来每次回答都不要超过 3 句。" />}
            {SU_TURNS.slice(0, step).map((turn, i) => (
              <SuMsg.Fragment key={i}>
                <SuMsg cls="user" role="user" text={turn.u} />
                <SuMsg cls="asst" role="assistant" text={turn[mode].t} badge={turn[mode]} />
              </SuMsg.Fragment>
            ))}
          </div>
        </div>
        <div className="demo-side">
          <div className="chips">
            {[['user', '约束写进 user'], ['sys', '约束写进 system']].map(([k, label]) => (
              <button key={k} className={`chip${k === mode ? ' active' : ''}`} onClick={() => setMode(k)}>{label}</button>
            ))}
          </div>
          <h4>第 {step} 轮 / 共 {SU_TURNS.length} 轮</h4>
          <p>{SU_EXPL[mode][step - 1]}</p>
          <div className="su-where">
            {mode === 'sys' ? '约束的位置：system · 不随对话滚动，永远压在每次续写上' : `约束的位置：user 历史第 1 条 · 已被压在 ${step} 轮对话之下`}
          </div>
          <div className="demo-actions">
            <button className="chip" disabled={step >= SU_TURNS.length} onClick={() => setStep((s) => Math.min(SU_TURNS.length, s + 1))}>
              {step >= SU_TURNS.length ? '聊完了 · 换个位置再试' : '▸ 再聊一轮'}
            </button>
            <button className="chip" onClick={() => setStep(1)}>↺ 重新开始</button>
          </div>
        </div>
      </div>
    </div>
  )
}
// 允许在 map 中渲染相邻两条消息
SuMsg.Fragment = ({ children }) => <>{children}</>

const RULER = [
  { q: '「答对了给你 100 美元小费，答得好还有奖金」', pill: { type: 'terracotta', text: '玄学 · 偏方' }, why: '模型没有账户，只有分布。这句话没增加任何关于任务的信息，蹭到的统计相关性弱且不稳 —— 换个模型、换轮训练就失灵。' },
  { q: '「你是有 20 年经验的儿科医生，面对一位焦虑的新手妈妈」', pill: { type: 'sage', text: '工程 · 稳定' }, why: '技法①：角色 + 受众两个词，把续写分布对齐到“儿科医生安抚家长”的文本区 —— 口吻、详略、术语密度全跟着换。' },
  { q: '「深呼吸，一步一步慢慢来」', pill: { type: 'amber', text: '一半一半' }, why: '“深呼吸”对没有肺的模型毫无意义，纯属玄学；“一步一步来”却实打实激活思维链（技法③）。那个著名的“深呼吸提示词”实验有效，功劳多半在后半句。' },
  { q: '「资料里没提的就直说"没提"，不要编」', pill: { type: 'sage', text: '工程 · 稳定' }, why: '技法⑤：训练数据里“中途承认不会”的下文极少，这句话把“说不知道”这条低概率出路明确抬起来，幻觉率实打实下降。' },
  { q: '「答错了我会丢掉工作，求求你认真一点」', pill: { type: 'terracotta', text: '玄学 · 偏方' }, why: '情绪施压没有信息增量 —— “认真”到底指什么，模型无从知晓。不如把它翻译成具体要求：检查哪几项、按什么格式、漏了怎么办。' },
  { q: '「给你两个我满意的范例，照这个风格来」', pill: { type: 'sage', text: '工程 · 稳定' }, why: '技法②（few-shot）：范例在上下文里划出一片窄分布，模式延续是模型最强的本事 —— 连你说不清的“feel”都能学走。' },
]

export default function L16() {
  return (
    <>
      <Lsec title="🎯 你将学会">
        <div className="card goals">
          <div className="goal-item"><span className="tick">✓</span>一句话说清 prompt 的本质：给“文字接龙”设定续写条件 —— 从此能自己鉴别任何提示技巧是工程还是玄学</div>
          <div className="goal-item"><span className="tick">✓</span>掌握五大技法：设角色受众、给示例、给步骤、定格式、划边界 —— 每一招都知道它为什么有效</div>
          <div className="goal-item"><span className="tick">✓</span>分清 system 和 user 两类提示词：全局约束放哪、为什么放那里更“管用”</div>
          <div className="goal-item"><span className="tick">✓</span>会写结构化长 prompt（信息分区 + 重点放两头），并能亲手把「帮我写点东西」改造成能直接交付的好 prompt</div>
        </div>
      </Lsec>

      <Lsec
        title="💡 核心概念：你打出的每个字，都在给 AI 划“续写区”"
        lead="网上流传着无数“ChatGPT 神级咒语大全”，仿佛和 AI 对话靠的是背口诀。先把底牌亮出来：第 12 课你已经知道，大模型唯一会做的事是接着前文往下接龙 —— 每生成一个 token 之前，它都要对词表里几万个候选算一遍概率（第 14 课）。那么 prompt 是什么？它不是“命令”，而是接龙的前文。你写下的每一个字，都在改变“接下来最可能出现什么”的概率表。"
      >
        <div className="contrast">
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-ink">直觉印象</span></div>
            <div className="big">prompt 是下给 AI 的命令 <span className="gap">→</span> 措辞够“讨喜”，它就愿意好好干</div>
            <p className="note">按这个理解，提示工程就是揣摩 AI 的“心情”，自然会滑向收集咒语、迷信话术。</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">真实机制</span></div>
            <div className="big">prompt 是续写的条件 <span className="gap">→</span> 每个字都把后文分布<span className="hl">推向某片训练数据区</span></div>
            <p className="note">提示工程 = 用文字给模型“圈地”：把它的续写范围从“全网平均”收窄到你想要的那片文本区域。</p>
          </div>
        </div>
        <p className="lead mt14">用这个视角看一个你大概率用过的技巧：</p>
        <div className="example">
          <div className="en">「假装你是一位<span className="hl">资深合同律师</span>，帮我审一下这份租房合同。」—— 为什么这一句立刻让回答变专业？</div>
          <div className="zh">不是模型“入戏了”这种魔法。训练数据里，“资深律师”这个词周围聚集着海量法律文本：合同条款、法律意见书、风险提示。这句话一出，后续 token 的概率分布就<b>对齐到那片区域</b> —— 措辞变严谨、主动逐条找风险、引用条款编号，全是那片文本区的统计特征。角色扮演有效，原理就这么朴素。</div>
        </div>
        <p className="lead mt14">光看例子不过瘾，亲手“圈”一次。同一个问题「解释一下量子计算」，右侧四味配料随意增删，左图实时显示两件事：模型接下来<b>最可能续写成哪种文体</b>，以及续写范围被收得多窄。建议玩法：先全关，看“全网平均”长什么样；再一味一味加上去；最后随手撤掉一味 —— 看分布立刻弹回去。</p>
        <ZoneDemo />
        <p className="lead mt14">把你平时在 ChatGPT / Claude 里见过的现象，和这条机制连上线：</p>
        <div className="card">
          <table className="match">
            <thead><tr><th>你在对话里看到的现象</th><th>背后的机制</th></tr></thead>
            <tbody>
              <tr><td><b>同一个问题，加一句“你是儿科医生”，答案立刻变专业</b></td><td className="ex">角色词把续写分布推向训练数据中“医生文本”的区域</td></tr>
              <tr><td><b>问题写得含糊，答案也跟着又水又泛</b></td><td className="ex">含糊前文对应“什么都能接”的宽分布，输出只能取平均 —— 套话是最安全的延续</td></tr>
              <tr><td><b>给了一两个范例，输出风格和格式立刻整齐</b></td><td className="ex">范例在上下文里划出一片窄分布，“照着范例续写”是概率最高的路径</td></tr>
              <tr><td><b>用中文问编程问题，回答里总夹着英文术语</b></td><td className="ex">训练数据里编程讨论以英文为主，那片区域的统计特征跟着渗了出来</td></tr>
            </tbody>
          </table>
        </div>
        <p className="lead mt14">理解到这一层，你手里就有了一把<b>万能检验尺</b>：以后再看到任何“提示词技巧”，先问一句 —— <b>它有没有把分布推向我想要的区域？</b>讲得通，才值得收藏；讲不通，多半是时灵时不灵的偏方。还有一个细节先埋下：prompt 不只是你刚打的那行字，<b>整个对话历史（包括模型自己之前的回答）都是续写条件</b> —— 这件事的代价和边界，第 17 课讲上下文窗口时算总账。</p>
      </Lsec>

      <Lsec
        title="📖 五大技法：每一招都讲得通，才招招稳定"
        lead="这五招覆盖日常九成的场景。每招给你三样东西：一个反例、一个正例、一句“为什么有效”。注意一个共同点：正例里没有任何花哨措辞，全是朴素的信息增量 —— 你是谁、给谁看、长什么样、什么不能做。改变信息而不是改变语气，这正是工程和玄学的分界线。"
      >
        <div className="card row-list">
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">「解释一下量子计算。」</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">「你是科普专栏作者，向完全没学过物理的高中生解释量子计算：多用比喻，不出现公式，800 字以内。」</span></div>
            </div>
            <p className="why"><b>技法 ① 设定角色与受众。</b>角色定“谁在写”（口吻、用词、知识深度），受众定“写给谁”（详略、比喻多少）。两头都不说，模型只能落在“百科条目式平均答案”上 —— 那是分布最宽、最平庸的位置。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">「帮商品起名，要高级感但不浮夸、朗朗上口、有记忆点、最好带点东方意境……」（形容词堆到第十个，输出依然各凭运气）</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">「帮商品起名。参考两个我满意的：山茶序（护手霜）、栖云盏（香薰蜡烛）。现在给一款檀香木梳起 3 个名字。」</span></div>
            </div>
            <p className="why"><b>技法 ② 给示例（few-shot）。</b>与其描述要求，不如给两个范本：形容词人人理解不同，范例没有歧义。模型最强的本事恰恰是<b>模式延续</b> —— 上文出现几个风格一致的“输入 → 输出”对，续写时它会自动沿用同一套隐含规则。这叫 few-shot / 上下文内学习，是 GPT-3 论文最重要的发现之一。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">「这道行程应用题，直接告诉我答案。」</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">「请一步步思考：先列出已知条件，再写计算过程，最后单独一行给出答案。」</span></div>
            </div>
            <p className="why"><b>技法 ③ 给步骤（激活思维链）。</b>第 15 课见过多步推理“走钢丝”：一步踩空，满盘皆输。让模型把中间步骤写出来，后面的 token 就是在“已写出的前几步”这个条件下生成的 —— 相当于把心算变笔算。这就是思维链（CoT）。第 23 课的推理模型干脆把“先打草稿”训练成了默认动作。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">「把这些信息整理成结构化数据给我。」</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">「严格按这个格式输出，不要输出其他内容：{`{"name": "商品名", "price": 数字, "tags": ["标签"]}`}」</span></div>
            </div>
            <p className="why"><b>技法 ④ 定格式（要 JSON 就给 JSON 模板）。</b>“结构化”有一万种长法：表格？列表？字段叫什么？分布太宽，输出就随机。模板是上下文里最强的锚点。当输出要交给程序处理时（第 19 课工具调用、第 26 课写代码），这招从“加分项”变成“必需品”。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">「我们公司 2025 年 Q3 的退货率是多少？」（模型不知道，也会一本正经编一个）</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">「根据我贴的这份报表回答；如果报表里没有这个数字，直接回答"报表中未提供"，不要估算。」</span></div>
            </div>
            <p className="why"><b>技法 ⑤ 划边界（给“不知道”留一条出路）。</b>训练数据里，流畅自信的下文远多于“中途承认不会” —— 你不开口子，“说不知道”这条路在分布里几乎不存在，模型只能硬编（幻觉的重要来源，第 29 课细讲）。明确许可“承认不确定”，等于把这条出路的概率抬起来，幻觉率显著下降。</p>
          </div>
        </div>
      </Lsec>

      <Lsec
        title="📖 system 提示词：导演递给演员的人物小传"
        lead="打开任何一个大模型 API（第 26 课你会亲手调），你会发现发给模型的消息分成三种角色：system、user、assistant。一个比喻就够了：这是一出戏 —— system 是开拍前导演递给演员的人物小传（你是谁、什么性格、哪些事绝不能做），user 是开拍后观众递上来的一句句台词。"
      >
        <div className="use-grid cols-2">
          <div className="card use-card"><div className="label">幕后 · 整场有效</div><div className="en">system：<b>人物小传</b></div><div className="zh">放<b>全局行为约束</b>：身份与口吻、做事准则、安全红线、固定的输出格式。先入为主、压在每一次续写上，普通用户通常看不见它。</div></div>
          <div className="card use-card"><div className="label">台前 · 随对话流动</div><div className="en">user：<b>台词</b></div><div className="zh">放<b>当前这一件事</b>：具体问题、材料、临时要求。每一轮都在变，跟着对话往前滚动。</div></div>
        </div>
        <p className="lead mt14">看一段真实风格的人物小传：</p>
        <div className="example">
          <div className="en">system：「你是‘云帆书店’的客服助手。只回答与本店订单、配送、退换货相关的问题；语气友好简洁，每次回答不超过 3 句；查不到订单时引导用户提供订单号，<span className="hl">绝不编造物流信息</span>。」</div>
          <div className="zh">之后用户无论怎么聊，这些约束都压在每一次续写上。你在各种产品里见过的“人设”：客服、毒舌影评人、苏格拉底式导师，本质都是一段你看不见的 system prompt。ChatGPT 的“自定义指令”、Claude 的项目设定，填的也是这个字段。</div>
        </div>
        <p className="lead mt14">为什么全局约束放 system 比塞进 user 里更“管用”？两个原因。其一是位置：system 永远排在对话最前面，整场不动。其二更关键 —— <b>训练使然</b>：第 13 课的对齐阶段，模型被专门调教成按“system 要求优先于 user 要求”的层级行事（厂商管这叫指令层级）。所以同一句“回答不超过 3 句”，写在 user 里聊几轮就可能被冲淡，写在 system 里要稳得多。</p>
        <p className="lead mt14">空口无凭，做个对照实验：同一条约束「每次回答不超过 3 句」，一次写进 user 的第一句话，一次写进 system，然后往下多聊几轮 —— 看哪边先失效：</p>
        <SystemDemo />
      </Lsec>

      <Lsec
        title="🧱 长 prompt 结构化：把提示词当文档写，而不是当聊天发"
        lead="任务一复杂，prompt 就会长到几百上千字：背景、要求、材料、范例搅成一锅粥。这时最常见的失败不是“模型不会”，而是“模型没注意到” —— 你明明写了“别超过 100 字”，它就是当没看见。两条结构原则，治的就是这个病："
      >
        <div className="use-grid cols-2">
          <div className="card use-card"><div className="label">原则一</div><div className="en">信息<b>分区</b></div><div className="zh">背景 / 任务 / 约束 / 示例各立门户，用小标题或分隔线隔开。结构清晰的前文对应训练数据里说明书、需求文档那片“高质量后文”区域；分区也让模型生成时更容易“回头对照”相应区块（注意力的拿手活，第 9 课）。</div></div>
          <div className="card use-card"><div className="label">原则二</div><div className="en">重点放<b>两头</b></div><div className="zh">对很长的上下文，模型对<b>中间部分</b>的内容利用得最差 —— 研究者称之为 lost in the middle（第 17 课拆它的机制）。所以关键约束开头定调、结尾重申，别埋在第三段中间等着被“看丢”。</div></div>
        </div>
        <p className="lead mt14">两条原则合起来，一个像样的长 prompt 长这样：</p>
        <div className="doc-prompt">
          <span className="sec">【背景】</span>我们是面向程序员的在线教育公司，下周发布新课《Rust 入门》。<br />
          <span className="sec">【任务】</span>写 3 条课程预告文案，发在技术社区。<br />
          <span className="sec">【约束】</span>每条不超过 60 字；语气专业、克制；不出现“家人们”等口水词；不承诺“轻松速成”。<br />
          <span className="sec">【示例】</span>上次效果最好的一条：「指针让你头疼了十年？Rust 用所有权换你一夜安眠。新课上线，首周 5 折。」<br />
          <span className="sec">【再次强调】</span>只输出 3 条文案本身，不要解释。
        </div>
        <p className="footnote mt14">注意最后一行 —— 把最在乎的要求在结尾重申一遍，这就是“重点放两头”。这份模板眼熟吗？它就是把五大技法装进了一个有秩序的容器里。</p>
      </Lsec>

      <Lsec
        title="🛠️ 实战改造：从「帮我写点东西」到能直接交付"
        lead="把全课串起来。真实场景：你帮一家咖啡馆运营公众号，想让 AI 写新品推送。看一个烂 prompt 如何四步进化 —— 每一步只用本课讲过的技法，没有一句咒语。"
      >
        <div className="card card-pad">
          <div className="step">
            <div className="step-head"><Pill type="terracotta">第 0 版 · 碰运气</Pill><span className="step-name">什么条件都没给</span></div>
            <div className="example"><div className="en">「帮我写点东西。」</div></div>
            <p className="verdict"><b>输出质量：</b>一篇不知道给谁看的通用小作文。分布全开 —— 写什么、给谁、多长，全靠模型猜，它只能交出“全网平均水平”的安全答案。<b>这不是模型不行，是你什么续写条件都没设。</b></p>
          </div>
          <div className="step">
            <div className="step-head"><Pill type="amber">第 1 版 · 技法①</Pill><span className="step-name">加角色与受众</span></div>
            <div className="example"><div className="en">「<span className="hl">你是一家社区咖啡馆的主理人。给常来的老顾客</span>写一条微信推送，介绍下周一上新的桂花拿铁。」</div></div>
            <p className="verdict"><b>输出质量：</b>口吻和对象立住了 —— 开始有“街坊熟客”的亲近感，还会自然带出“秋天第一杯”这类应景表达。但长度忽长忽短、重点忽左忽右：<b>你还没示范“好”长什么样。</b></p>
          </div>
          <div className="step">
            <div className="step-head"><Pill type="sky">第 2 版 · 技法②④</Pill><span className="step-name">加示例与格式</span></div>
            <div className="example"><div className="en">前文 + 「<span className="hl">参考这条上次反响最好的推送：『天冷了，焦糖云朵降落本店☁️ 老位置给你留着。』格式：第一行 8 字以内标题，正文不超过 80 字，结尾一个 emoji。</span>」</div></div>
            <p className="verdict"><b>输出质量：</b>有了范本和模板，文风与结构一次到位，八成可以直接发。剩下两个小毛病：偶尔<b>编造不存在的优惠</b>，而且每次只给一个版本，不合心意就得重抽。</p>
          </div>
          <div className="step">
            <div className="step-head"><Pill type="sage">第 3 版 · 技法⑤</Pill><span className="step-name">加边界与评判标准</span></div>
            <div className="example"><div className="en">前文 + 「<span className="hl">只提我给的信息，没提的优惠活动不要编。给 3 个备选，每条后面用一句话注明主打角度（怀旧 / 限时 / 口感），方便我选。</span>」</div></div>
            <p className="verdict"><b>输出质量：</b>「不要编」封掉幻觉出口；「3 个备选 + 注明角度」把<b>挑选成本</b>也交给了模型 —— 从“能用”升级到“好选”。回看全程：增加的全是<b>信息</b>。这就是提示工程的全部秘密 —— <b>模型的能力一直都在，prompt 决定它发挥出几成。</b></p>
          </div>
        </div>
      </Lsec>

      <Lsec
        title="🧪 检验尺上手：工程还是玄学？"
        lead="开课时发的那把检验尺，现在拿出来用：下面 6 条网上流传的提示技巧，先自己判断 —— 它有没有把分布推向想要的区域？有没有增加真实的信息？想好了再点卡片对答案。"
      >
        <div className="flip-grid">
          {RULER.map((r, i) => <FlipCard key={i} q={r.q} pill={r.pill} why={r.why} />)}
        </div>
      </Lsec>

      <Lsec title="⚠️ 常见误区">
        <div className="card alert-card row-list">
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">“给你 100 美元小费”“深呼吸再回答”这类网传咒语是提示工程的精髓，照抄就灵</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">能从分布角度讲通的技巧才稳定；讲不通的偏方时灵时不灵，换个模型、换个版本就失效</span></div>
            </div>
            <p className="why"><b>病因：</b>把个例当规律。这类偏方多半源于某人某次测试的截图，效应弱、不同模型表现两极。五大技法之所以跨模型稳定，是因为它们改变的是<b>信息本身</b>（角色、范例、步骤、格式、边界），而不是玄学措辞。拿出那把检验尺：讲不通分布的，别收藏。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">只要 prompt 写得够好，模型什么问题都能答对</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">prompt 只能引导分布，不能注入模型没有的知识 —— 知识边界要靠 RAG（第 18 课）和工具调用（第 19 课）来补</span></div>
            </div>
            <p className="why"><b>病因：</b>把“措辞问题”和“知识问题”混为一谈。模型不知道你公司上周的会议结论、今天的股价、内部价格表，prompt 再精妙它也只能编。一个实用的判断法：<b>换十种问法都答错或编造的，不是 prompt 的锅</b>，该去第 18、19 课找答案了。</p>
          </div>
        </div>
      </Lsec>

      <Lsec title="✍️ 小练习">
        <div className="card quiz row-list">
          <QuizItem q="1. 同事的 prompt 是「帮我总结这份报告」，结果输出又长又泛。请用五大技法至少改三处，并用“分布”的语言说明每一处为什么有效。">
            参考改法：<b>① 加角色与受众</b>「你是给 CEO 写周报的分析师，读者只有 30 秒」—— 把分布从“通用摘要”收窄到“高管摘要”那片简洁、结论先行的文本区；<b>② 定格式</b>「输出 3 条要点，每条不超过 20 字，最后附 1 条风险提示」—— 模板锚点让结构不再随机；<b>③ 划边界</b>「只用报告里出现的信息，报告没提的不要推测」—— 给“不写”留出路，防止编造。
          </QuizItem>
          <QuizItem q="2. 为什么“请一步步思考”能让数学题正确率明显上升？它和第 23 课要讲的推理模型是什么关系？">
            <b>把心算变笔算。</b>多步推理像走钢丝，一步错全盘输；让模型先写出中间步骤，每一步都踩在纸面上，错误率自然下降 —— 这就是思维链。<b>与推理模型的关系：</b>思维链原本是用户手动触发的 prompt 技巧；推理模型通过训练把“先打草稿再作答”内化成了默认行为 —— 同一个思想，从“提示技巧”升级成了“模型能力”。
          </QuizItem>
          <QuizItem q="3. 判断：模型总答不对你们公司内部的产品价格表，该继续打磨 prompt，还是该换方案？为什么？">
            <b>换方案。</b>内部价格表不在训练数据里 —— prompt 只能引导模型已有知识的发挥，无法注入新知识，逼问下去只会得到一本正经的编造。正确做法：用 RAG 把价格表检索后放进上下文（第 18 课），或让模型调用查价工具（第 19 课）。检验口诀：<b>换十种问法都治不好的，是知识问题，不是措辞问题。</b>
          </QuizItem>
        </div>
      </Lsec>
    </>
  )
}
