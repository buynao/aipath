import { useState } from 'react'
import { Lsec, Pill, QuizItem } from '../components/ui.jsx'

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ============================================================
// ① 三路汇流
// ============================================================
const MM_DATA = {
  all: { title: '万物皆可 token 化', period: '三路汇流 · 注意力照常工作',
    desc: '三种输入各自经过自己的编码器，变成同规格的向量，排进同一条序列。从这一刻起，Transformer 不知道也不关心谁来自照片、谁来自键盘、谁来自麦克风 —— 第 9 课的注意力在它们之间照常计算：“天气”这个词可以直接注意到天空的 patch。', tags: ['第 9 课 · 注意力', '第 10 课 · Transformer', '第 11 课 · token'] },
  img: { title: '图像 → patch token', period: 'ViT 思想 · 切块再压缩',
    desc: '照片先缩放到固定尺寸，再切成一个个小方块（patch），每块压成一个向量。一张图通常折合几百个“图像 token”。注意：进入模型的不是像素，是这串向量 —— AI 看见的不是图，是几百个向量。', tags: ['patch 网格', '视觉编码器', '一图 ≈ 几百 token'] },
  txt: { title: '文本 → 文字 token', period: '第 11 课的老朋友',
    desc: '分词器把句子切成 token，再查嵌入表换成向量（第 8 课）。注意图中的切法：“是什 / 么天”—— token 边界不按词义走，这正是第 11 课讲过的怪现象，多模态时代它依然在。', tags: ['分词器', '嵌入表', '第 8 课 · 向量'] },
  aud: { title: '音频 → 音频 token', period: '波形切片 · 几十毫秒一段',
    desc: '声音是一条连续波形，按几十毫秒一段切片，每段编码成一个向量。音量、语速、语气、停顿都藏在这些向量里 —— 这是原生语音对话能“听出情绪”的物质基础。', tags: ['波形切片', '音频编码器', '语气随向量保留'] },
}
const IMG_PATCHES = [
  [57, 26, 'sky', 0.55], [71.5, 26, 'sky', 0.45], [86, 26, 'sky', 0.5], [100.5, 26, 'amber', 0.6],
  [57, 40.5, 'sky', 0.3], [71.5, 40.5, 'sky', 0.25], [86, 40.5, 'sage', 0.35], [100.5, 40.5, 'sky', 0.3],
  [57, 55, 'sage', 0.5], [71.5, 55, 'sage', 0.45], [86, 55, 'amber', 0.4], [100.5, 55, 'sage', 0.5],
  [57, 69.5, 'fg-2', 0.25], [71.5, 69.5, 'fg-2', 0.2], [86, 69.5, 'fg-2', 0.25], [100.5, 69.5, 'fg-2', 0.2],
]
const TXT_BOXES = [[171, 32, '图里'], [233, 32, '是什'], [171, 58, '么天'], [233, 58, '气？']]
const AUD_BARS = [[350, 52, 8], [354, 49, 14], [358, 45, 22], [362, 41, 30], [366, 47, 18], [370, 51, 10], [374, 48, 16], [378, 43, 26], [382, 46, 20], [386, 50, 12], [390, 44, 24], [394, 49, 14], [398, 52, 8]]
const OUT_TOK = { img: [52.5, 69.5, 86.5, 103.5], txt: [197.5, 214.5, 231.5, 248.5], aud: [342.5, 359.5, 376.5, 393.5] }
const COL_FILL = { img: 'var(--sky)', txt: 'var(--amber)', aud: 'var(--sage)' }
const MERGED = { img: [135, 151, 167, 183], txt: [199, 215, 231, 247], aud: [263, 279, 295, 311] }

function MultimodalDemo() {
  const [key, setKey] = useState('all')
  const d = MM_DATA[key]
  const dim = (k) => (key === 'all' || key === k ? '' : ' mm-dim')
  const lineCls = (k) => `mm-line mm-group${dim(k)}${key === k && key !== 'all' && !reduceMotion() ? ' flowing' : ''}`

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · 图、文、音变成同一串 token</span>
        <span className="demo-hint">点击三路输入或右侧按钮</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="mm-svg" viewBox="0 0 460 398" width="430" aria-label="三路汇流图：图像切 patch、文本切 token、音频切片，各自编码后排进同一条序列">
            <defs>
              <marker id="mm-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
                <path d="M0 0 L8 4 L0 8 z" fill="var(--fg-2)" />
              </marker>
            </defs>
            {/* 图像列 */}
            <g className={`mm-col mm-group${dim('img')}`} onClick={() => setKey('img')}>
              <text x="85" y="14" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="var(--fg-0)">图像</text>
              {IMG_PATCHES.map(([x, y, c, op], i) => <rect key={i} x={x} y={y} width="13" height="13" rx="2" fill={`var(--${c})`} fillOpacity={op} />)}
              <line x1="85" y1="90" x2="85" y2="100" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#mm-arr)" />
              <rect x="30" y="102" width="110" height="28" rx="6" fill="var(--bg-inset)" stroke="var(--hairline-strong)" />
              <text x="85" y="120" textAnchor="middle" fontSize="10.5" fill="var(--fg-0)">视觉编码器 ViT</text>
              <line x1="85" y1="134" x2="85" y2="142" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#mm-arr)" />
              {OUT_TOK.img.map((x, i) => <rect key={i} x={x} y="146" width="14" height="14" rx="3" fill="var(--sky)" fillOpacity="0.85" />)}
              <rect x="23" y="2" width="124" height="160" fill="transparent" />
            </g>
            {/* 文本列 */}
            <g className={`mm-col mm-group${dim('txt')}`} onClick={() => setKey('txt')}>
              <text x="230" y="14" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="var(--fg-0)">文本</text>
              {TXT_BOXES.map(([x, y, t], i) => (
                <g key={i}>
                  <rect x={x} y={y} width="56" height="20" rx="5" fill="var(--bg-inset)" stroke="var(--hairline-strong)" />
                  <text x={x + 28} y={y + 13.5} textAnchor="middle" fontSize="10.5" fill="var(--fg-0)">{t}</text>
                </g>
              ))}
              <line x1="230" y1="90" x2="230" y2="100" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#mm-arr)" />
              <rect x="175" y="102" width="110" height="28" rx="6" fill="var(--bg-inset)" stroke="var(--hairline-strong)" />
              <text x="230" y="120" textAnchor="middle" fontSize="10.5" fill="var(--fg-0)">分词器 + 嵌入表</text>
              <line x1="230" y1="134" x2="230" y2="142" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#mm-arr)" />
              {OUT_TOK.txt.map((x, i) => <rect key={i} x={x} y="146" width="14" height="14" rx="3" fill="var(--amber)" fillOpacity="0.85" />)}
              <rect x="168" y="2" width="124" height="160" fill="transparent" />
            </g>
            {/* 音频列 */}
            <g className={`mm-col mm-group${dim('aud')}`} onClick={() => setKey('aud')}>
              <text x="375" y="14" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="var(--fg-0)">音频</text>
              <rect x="347" y="28" width="56" height="56" rx="4" fill="var(--bg-inset)" stroke="var(--hairline-strong)" />
              {AUD_BARS.map(([x, y, h], i) => <rect key={i} x={x} y={y} width="2.6" height={h} rx="1.3" fill="var(--sage)" fillOpacity="0.8" />)}
              {[361, 375, 389].map((x) => <line key={x} x1={x} y1="30" x2={x} y2="82" stroke="var(--fg-2)" strokeWidth="0.8" strokeDasharray="3 3" />)}
              <line x1="375" y1="90" x2="375" y2="100" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#mm-arr)" />
              <rect x="320" y="102" width="110" height="28" rx="6" fill="var(--bg-inset)" stroke="var(--hairline-strong)" />
              <text x="375" y="120" textAnchor="middle" fontSize="10.5" fill="var(--fg-0)">音频编码器</text>
              <line x1="375" y1="134" x2="375" y2="142" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#mm-arr)" />
              {OUT_TOK.aud.map((x, i) => <rect key={i} x={x} y="146" width="14" height="14" rx="3" fill="var(--sage)" fillOpacity="0.85" />)}
              <rect x="313" y="2" width="124" height="160" fill="transparent" />
            </g>
            {/* 汇流线 */}
            <path className={lineCls('img')} d="M85 164 C 85 182 166 176 166 192" stroke="var(--sky)" strokeWidth="1.6" />
            <path className={lineCls('txt')} d="M230 164 L230 192" stroke="var(--amber)" strokeWidth="1.6" />
            <path className={lineCls('aud')} d="M375 164 C 375 182 294 176 294 192" stroke="var(--sage)" strokeWidth="1.6" />
            {/* 合并序列 */}
            {['img', 'txt', 'aud'].flatMap((k) => MERGED[k].map((x, i) => (
              <rect key={k + i} className={`mm-mtok${dim(k)}`} x={x} y="198" width="14" height="14" rx="3" fill={COL_FILL[k]} fillOpacity="0.85" />
            )))}
            <path className="mm-att" d="M158 216 Q 190 238 222 216" fill="none" stroke="var(--terracotta)" strokeWidth="1.2" strokeDasharray="4 3" style={{ opacity: key === 'all' ? 1 : 0.15 }} />
            <path className="mm-att" d="M222 216 Q 254 238 286 216" fill="none" stroke="var(--terracotta)" strokeWidth="1.2" strokeDasharray="4 3" style={{ opacity: key === 'all' ? 1 : 0.15 }} />
            <text x="230" y="254" textAnchor="middle" fontSize="10.5" fill="var(--fg-2)">排进同一条序列 —— 注意力在三种 token 之间来回看（第 9 课）</text>
            <line x1="230" y1="260" x2="230" y2="272" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#mm-arr)" />
            <rect x="110" y="276" width="240" height="44" rx="10" fill="var(--glass)" stroke="var(--hairline-strong)" />
            <text x="230" y="295" textAnchor="middle" fontSize="13.5" fontWeight="700" fill="var(--fg-0)">Transformer</text>
            <text x="230" y="311" textAnchor="middle" fontSize="10" fill="var(--fg-1)">不检查 token 的出身，注意力照常计算</text>
            <line x1="230" y1="326" x2="230" y2="338" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#mm-arr)" />
            <rect x="88" y="342" width="284" height="46" rx="10" fill="var(--bg-inset)" stroke="var(--hairline-strong)" />
            <text x="230" y="360" textAnchor="middle" fontSize="10" fill="var(--fg-2)">输出：文字回答（逐 token 接龙，第 12 课）</text>
            <text x="230" y="377" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="var(--fg-0)">「刚下过雨的街口 —— 他还说“快到家了”。」</text>
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            {[['all', '全部汇流'], ['img', '图像'], ['txt', '文本'], ['aud', '音频']].map(([k, label]) => (
              <button key={k} className={`chip${k === key ? ' active' : ''}`} onClick={() => setKey(k)}>{label}</button>
            ))}
          </div>
          <h4>{d.title}</h4>
          <div className="period">{d.period}</div>
          <p>{d.desc}</p>
          <div className="tags">{d.tags.map((t) => <Pill key={t} type="ink">{t}</Pill>)}</div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ② 语音链路对比
// ============================================================
const VP_DATA = {
  a: { title: '三段式流水线（外挂拼接）', period: '听写员 → 笔杆子 → 播音员',
    desc: '三个独立模型接力：语音识别先把你的话听写成文字，LLM 只读文字稿想答案，再交给语音合成配音。每一棒都要等上一棒跑完，总延迟是三段相加；更糟的是第一棒只交“字”—— 你叹的那口气根本到不了模型耳朵里。这就是老一代语音助手永远慢半拍、永远播音腔的原因。', tags: ['延迟：三段相加', '语气：进门即丢', '传统语音助手路线'] },
  b: { title: '原生语音（端到端）', period: '语音 token 直进直出',
    desc: '你的声音切成音频 token 直接进模型，回答也以语音 token 直接“说”出来 —— 中间没有文字稿这一站。一句话记住差别：三段式听到的是你说了什么字，原生听到的是你怎么说这些字。所以它能察觉你在笑、能压低声音回你，还能在你插话时立刻停下。', tags: ['延迟：大幅下降', '语气：进出都保留', 'GPT-4o / Gemini 路线'] },
}

function VoiceDemo() {
  const [key, setKey] = useState('a')
  const d = VP_DATA[key]
  return (
    <div className="card demo demo-slim">
      <div className="demo-head">
        <span className="demo-title">🎛️ 小实验 · 语音对话的两代链路</span>
        <span className="demo-hint">点右侧按钮切换新旧方案</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="vp-svg" viewBox="0 0 440 112" width="430" aria-label="语音对话两代架构对比">
            <defs>
              <marker id="vp-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
                <path d="M0 0 L8 4 L0 8 z" fill="var(--fg-2)" />
              </marker>
            </defs>
            {key === 'a' ? (
              <g>
                <rect className="vp-box" x="4" y="22" width="70" height="30" rx="7" />
                <text x="39" y="41" textAnchor="middle" fontSize="10" fill="var(--fg-0)">你的语音</text>
                <line x1="74" y1="37" x2="83" y2="37" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#vp-arr)" />
                <rect className="vp-box" x="83" y="22" width="84" height="30" rx="7" />
                <text x="125" y="41" textAnchor="middle" fontSize="10" fill="var(--fg-0)">① 听写成文字</text>
                <line x1="167" y1="37" x2="176" y2="37" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#vp-arr)" />
                <rect x="176" y="22" width="96" height="30" rx="7" fill="var(--amber-bg)" stroke="var(--amber)" />
                <text x="224" y="41" textAnchor="middle" fontSize="9.5" fill="var(--fg-0)">② LLM 只读文字稿</text>
                <line x1="272" y1="37" x2="281" y2="37" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#vp-arr)" />
                <rect className="vp-box" x="281" y="22" width="84" height="30" rx="7" />
                <text x="323" y="41" textAnchor="middle" fontSize="10" fill="var(--fg-0)">③ 文字配音</text>
                <line x1="365" y1="37" x2="374" y2="37" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#vp-arr)" />
                <rect className="vp-box" x="374" y="22" width="62" height="30" rx="7" />
                <text x="405" y="41" textAnchor="middle" fontSize="10" fill="var(--fg-0)">AI 的语音</text>
                <text x="125" y="74" textAnchor="middle" fontSize="10" fill="var(--terracotta)">✗ 语气、笑声、停顿在这一步被丢掉</text>
                <text x="220" y="96" textAnchor="middle" fontSize="10" fill="var(--fg-2)">总延迟 = 三段相加：体感等一两秒才开口，说话时不能被打断</text>
              </g>
            ) : (
              <g>
                <rect className="vp-box" x="4" y="20" width="84" height="36" rx="7" />
                <text x="46" y="42" textAnchor="middle" fontSize="10" fill="var(--fg-0)">你的语音</text>
                <line x1="88" y1="38" x2="112" y2="38" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#vp-arr)" />
                <rect x="114" y="20" width="212" height="36" rx="7" fill="var(--sage-bg)" stroke="var(--sage)" />
                <text x="220" y="35" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--fg-0)">原生多模态 LLM（同一个大脑）</text>
                <text x="220" y="49" textAnchor="middle" fontSize="9" fill="var(--fg-1)">语音 token 直进 · 语音 token 直出</text>
                <line x1="326" y1="38" x2="350" y2="38" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#vp-arr)" />
                <rect className="vp-box" x="352" y="20" width="84" height="36" rx="7" />
                <text x="394" y="42" textAnchor="middle" fontSize="10" fill="var(--fg-0)">AI 的语音</text>
                <text x="220" y="76" textAnchor="middle" fontSize="10" fill="var(--sage)">✓ 听得出你在笑、在犹豫 —— 也能用语气和笑声回答</text>
                <text x="220" y="98" textAnchor="middle" fontSize="10" fill="var(--fg-2)">延迟大幅下降：即时接话、可随时打断（GPT-4o / Gemini Live 这一路线）</text>
              </g>
            )}
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            {[['a', '① 三段式（老）'], ['b', '② 原生语音（新）']].map(([k, label]) => (
              <button key={k} className={`chip${k === key ? ' active' : ''}`} onClick={() => setKey(k)}>{label}</button>
            ))}
          </div>
          <h4>{d.title}</h4>
          <div className="period">{d.period}</div>
          <p>{d.desc}</p>
          <div className="tags">{d.tags.map((t) => <Pill key={t} type="ink">{t}</Pill>)}</div>
        </div>
      </div>
    </div>
  )
}

export default function L22() {
  return (
    <>
      <Lsec title="🎯 你将学会">
        <div className="card goals">
          <div className="goal-item"><span className="tick">✓</span>一句话说出全课心法：Transformer 不在乎 token 原来是什么 —— 图像切成 patch、音频切成片，都能和文字排进同一条序列（第 9、10、11 课在这里全部打通）</div>
          <div className="goal-item"><span className="tick">✓</span>完整走一遍“看图说话”的链路：照片 → 视觉编码器 → 一串图像 token → 与问题拼接 → 注意力 → 文字回答，并理解“AI 看见的不是图，是几百个向量”</div>
          <div className="goal-item"><span className="tick">✓</span>分清拼接式与原生多模态两代方案，一句话说清实时语音对话为什么不再走“听写 → 思考 → 配音”三段式</div>
          <div className="goal-item"><span className="tick">✓</span>能预判多模态的翻车点：数不清图里的 17 只鸟、读错图里的小字 —— 并知道这和第 11 课“数不清 strawberry 里的 r”是同一个病根</div>
        </div>
      </Lsec>

      <Lsec
        title="💡 核心概念：万物皆可 token 化"
        lead="前几课我们把 ChatGPT 的“读字”系统拆了个遍：第 11 课讲文字怎么切成 token，第 9、10 课讲注意力和 Transformer 怎么处理这串 token。现在问题来了：要让它看照片、听语音，是不是得另起炉灶，造一个全新的“视觉大脑”和“听觉大脑”？早年的研究者也这么以为。但答案出乎意料地省事。"
      >
        <div className="contrast">
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-ink">直觉印象</span></div>
            <div className="big">看图、听音是全新的能力 <span className="gap">→</span> 得给 AI 装“眼睛”“耳朵”，再造一个新大脑</div>
            <p className="note">按这个理解，每多一种感官就要多一套系统，图文音三个大脑还得想办法互相“开会”。</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">真实机制</span></div>
            <div className="big">Transformer 只认 token，不问出身 <span className="gap">→</span> 把图和声音<span className="hl">变成 token</span>，原来的大脑照常工作</div>
            <p className="note">不造新大脑，只造新的“入场券打印机”：每种信号配一个编码器，把自己变成 token。</p>
          </div>
        </div>
        <p className="lead mt14">为什么行得通？回想第 11 课：文字进模型之前，先被切成 token、再换成向量。也就是说，<b>Transformer 真正吃进去的从来不是“字”，而是一串向量</b>。它从头到尾不检查向量的“出身”—— 这就是突破口：只要为每种信号发明一种合适的“切法”，万物皆可 token 化。三种切法摆在一起看：</p>
        <div className="use-grid">
          <div className="card use-card"><div className="label">文字 · 第 11 课复习</div><div className="en">分词器<b>切词块</b></div><div className="zh">分词器把句子切成 token，再查嵌入表换成向量（第 8 课）。一句话 → 十几个 token。</div></div>
          <div className="card use-card"><div className="label">图像 · ViT 思想</div><div className="en">切成<b>小方块 patch</b></div><div className="zh">把图切成棋盘般的小方块（patch，常见 16×16 像素），每块压成一个向量。一张图 → 几百个“图像 token”。</div></div>
          <div className="card use-card"><div className="label">音频 · 波形切片</div><div className="en">按时间<b>切薄片</b></div><div className="zh">连续声波按几十毫秒一段切片，每段编码成一个向量。一秒钟语音 → 几十个“音频 token”。语气、停顿都藏在向量里。</div></div>
        </div>
        <p className="lead mt14">也可以不这么干 —— 给 LLM 外挂一个识图模型，先把图翻译成文字描述再喂进去（下一节细讲这条老路）。但“统一成 token”有一个无可替代的好处：<b>注意力可以跨模态直接计算</b>。你问“图里是什么天气”，“天气”这个文字 token 的注意力可以直接落在天空那几个 patch 上，中间不经过任何翻译。看一个真实风格的场景：</p>
        <div className="example">
          <div className="en">你发一张猫的照片问「它趴的键盘是什么牌子？」—— 回答精确提到了<span className="hl">键盘角落的 logo</span></div>
          <div className="zh">外挂老方案大概率答不上：识图模型给的描述如果没提 logo，LLM 就永远不知道它存在。原生方案里，“键盘”“牌子”这些文字 token 的注意力直接扫过键盘区域的 patch —— <b>你的问题引导它的眼睛往哪看</b>。</div>
        </div>
        <p className="lead mt14">这套机制的局限也埋在同一处：一张图要折成<b>几百个 token</b>，而 token 就是预算（第 17 课的“书桌”）—— 预算之外的细节会在压缩时被抹掉。这笔账先记下，误区一节算总账。下面先把“看图说话”的完整链路走一遍。</p>
      </Lsec>

      <Lsec
        title="📖 看图说话的完整链路：一张照片的旅程"
        lead="场景：你在 ChatGPT / Claude 里上传一张猫的照片，问“这只猫是什么品种？”。从你按下发送到它开口，照片经历了五步："
      >
        <div className="card flow-card">
          <div className="flow">
            <div className="flow-step"><span className="num">1</span><span className="txt"><b>预处理切块。</b>照片先被缩放到模型规定的尺寸，再切成棋盘格 —— 几百个 patch。原图再高清，超出规定尺寸的像素这一步就没了。</span></div>
            <div className="flow-step"><span className="num">2</span><span className="txt"><b>视觉编码器上场。</b>每个 patch 被压成一个向量。这一摞向量就是“图像 token”—— 规格和文字 token 完全相同，排在队伍里谁也认不出谁来自照片。</span></div>
            <div className="flow-step"><span className="num">3</span><span className="txt"><b>拼成一条序列。</b>【图像 token × 几百】＋【“这只猫是什么品种？”的文字 token × 几个】排成一队，整队送进 Transformer。<span className="footnote">对模型来说，这就是一段“长 prompt”—— 只是前几百个 token 碰巧来自照片。</span></span></div>
            <div className="flow-step"><span className="num">4</span><span className="txt"><b>注意力跨模态扫描。</b>生成回答时，“品种”相关的注意力大量落在猫脸、毛色花纹对应的 patch 上 —— 和第 9 课判断“它指代谁”的机制一模一样，只是对象从词换成了图块。</span></div>
            <div className="flow-step"><span className="num">5</span><span className="txt"><b>接龙输出文字。</b>“这是一只英国短毛猫……”逐 token 生成，第 12 课的老规矩。</span></div>
          </div>
        </div>
        <p className="lead mt14">注意第 2 步那句话的分量：<b>AI 看见的不是图，是几百个向量。</b>它没有视网膜、没有“画面感”，照片在进门时就被压缩成了一串数字印象。这个事实能一口气解释你在产品里见过的一堆现象：</p>
        <div className="card">
          <table className="match">
            <thead><tr><th>你在 ChatGPT / Claude 里看到的现象</th><th>背后的机制</th></tr></thead>
            <tbody>
              <tr><td><b>发几张图，回答明显变慢、额度掉得快</b></td><td className="ex">一张图折合几百上千 token，注意力要算的对象暴增（第 9 课），计费也按 token 算（第 11 课）</td></tr>
              <tr><td><b>长对话里塞了很多截图后，它开始忘事</b></td><td className="ex">图像 token 大口吃掉上下文窗口，早期内容被挤出“书桌”（第 17 课）</td></tr>
              <tr><td><b>把图裁剪放大再问，它突然答对了</b></td><td className="ex">裁剪 = 把同样的 token 预算集中花在关键区域，每个 patch 变“高清”了</td></tr>
              <tr><td><b>同一张图，问不同问题得到不同侧重的描述</b></td><td className="ex">注意力由问题文本引导，落在不同的 patch 上 —— 它不是“先看完再答”，是“边被问边看”</td></tr>
            </tbody>
          </table>
        </div>
        <p className="lead mt14">链路通了，下一个问题自然浮现：这条“图直接变 token”的路线，是怎么取代老办法的？两代方案的差别，正是 GPT-4o、Gemini 这一代模型的分水岭。</p>
      </Lsec>

      <Lsec
        title="📖 两代方案的分水岭：外挂翻译官，还是原生双语者"
        lead="“把图变 token”听起来顺理成章，但业界绕了一段路才走到这里。早期的“能看图的 AI”，多数是拼接出来的："
      >
        <div className="contrast">
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-ink">第一代 · 拼接式</span></div>
            <div className="big">外挂识图模型，先把图 <span className="gap">→</span> 翻成一句文字描述，再喂给 LLM</div>
            <p className="note">LLM 本体从没“见过”图。像隔着电话听朋友描述照片 —— 朋友没提的细节，你永远不知道。信息损失大，问深一点就露馅。</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">第二代 · 原生多模态</span></div>
            <div className="big">训练时图文就<span className="hl">混在一起学</span>，图直接变 token 进同一条序列</div>
            <p className="note">GPT-4o、Gemini 这一路线。看图是“亲眼看”；而且输出端同样能接龙生成图像 token、语音 token —— 理解与生成打通。</p>
          </div>
        </div>
        <p className="lead mt14">关键差别发生在<b>训练阶段</b>（第 12 课）：原生多模态在预训练时就把图文混排的数据喂给同一个模型 —— 它读网页时既读文字也“读”配图。于是“金毛”这个词的向量和金毛照片的 patch 向量，在同一个向量空间里靠在了一起（第 8 课的老地图，多了几个新大陆）。也正因为输出端同样是接龙生成 token，这类模型才能<b>反向生成</b>图像和语音 —— 看懂和画出，是同一套机制的两个方向。</p>
        <p className="lead mt14">这个分水岭在<b>语音对话</b>上的体现最戏剧化。同样是“和 AI 打电话”，两代架构的体验天差地别 —— 切换下面两条流水线感受一下：</p>
        <VoiceDemo />
        <p className="lead mt14">一句话记住两者的差别：<b>三段式听到的是你说了什么字，原生听到的是你怎么说这些字 —— 延迟和语气，输在同一个地方。</b>链路和路线都清楚了，看四个已经落地的应用，每个都能用本课的机制一句话解释：</p>
        <div className="use-grid cols-2">
          <div className="card use-card"><div className="label">教育 · 拍照解题</div><div className="en">题目照片<b>直接进序列</b></div><div className="zh">题目切成 patch，和“这道题怎么解”拼成一条序列 ——“解”的注意力直接落在算式 patch 上。手写太潦草 = patch 压缩后更模糊，先拍清楚再问，命中率高得多。</div></div>
          <div className="card use-card"><div className="label">医疗 · 影像辅助判读</div><div className="en">影像与病历<b>同窗对照</b></div><div className="zh">X 光 / CT 切成 patch，和病历文字排进同一个窗口互相印证。注意“辅助”二字：细粒度识别正是多模态的翻车区（见下节误区），结论必须由医生把关。</div></div>
          <div className="card use-card"><div className="label">视频 · 内容理解</div><div className="en">视频 = <b>帧 + 音轨</b></div><div className="zh">视频被拆成抽样的图像帧（各自切 patch）加音频切片，全排进序列。这也解释了为什么长视频常常只能“抽着看”—— token 预算装不下每一帧。</div></div>
          <div className="card use-card"><div className="label">语音 · 实时同声传译</div><div className="en">语音 token <b>直进直出</b></div><div className="zh">听中文语音 token，直接接龙吐出英文语音 token，不经文字稿中转。延迟低到能跟上对话节奏，还能保留说话人的语气起伏。</div></div>
        </div>
      </Lsec>

      <Lsec
        title="🎛️ 交互演示：三路汇流，万物归 token"
        lead="把全课压成一张图。一次提问里同时有照片、打字的问题、一段语音留言 —— 看它们如何各自 token 化、汇成同一条序列、流过同一个 Transformer。点击图中任意一路（或右侧按钮），看该模态是怎么变成 token 的。"
      >
        <MultimodalDemo />
      </Lsec>

      <Lsec title="⚠️ 常见误区">
        <div className="card alert-card row-list">
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">AI 像人一样“看见”了我的照片</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">它“看见”的是几百个 patch 压成的向量序列 —— 分辨率和细节受 token 预算的硬限制</span></div>
            </div>
            <p className="why"><b>病因：</b>把“能描述照片”等同于“拥有视觉”。照片在进门时就被缩放、切块、压缩成向量，预算之外的细节（角落的小字、远处的人脸）根本没进过它的“脑子”。所以“它怎么没看到水印上的字”不是态度问题，是 token 预算问题 —— 把关键区域裁剪放大再发，往往立竿见影。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">它能看懂图，那数清图里 17 只鸟肯定不在话下</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">细粒度计数和小字 OCR 是多模态最常见的翻车点 —— 和第 11 课“数不清 strawberry 里的 r”同一个病根</span></div>
            </div>
            <p className="why"><b>病因：</b>计数需要逐个、精确、不重不漏地对齐每只鸟，而模型拿到的是整体压缩后的向量印象 —— 挤在一起的几只鸟可能被压进同一个 patch，就像文字模型看不见字母只看见 token。它擅长“整体是什么、大概什么关系”，不擅长“精确到第几个像素、第几只”。要紧的数数和读小字任务，放大裁剪分块问，或交给专门工具核对。</p>
          </div>
        </div>
      </Lsec>

      <Lsec title="✍️ 小练习">
        <div className="card quiz row-list">
          <QuizItem q="1. 朋友说：“多模态模型能看图，原理是先把图片自动转成一段文字描述，再把描述交给语言模型。” 这句话哪里过时了？">
            他描述的是<b>第一代拼接式</b>方案。原生多模态（GPT-4o / Gemini 路线）里，图片切成 patch 后<b>直接变成 token 排进序列</b>，不经过“文字描述”这个信息瓶颈 —— 所以问“键盘上的 logo 是什么牌子”这类描述里不会出现的细节，它也答得上。
          </QuizItem>
          <QuizItem q="2. 一张图常折合几百上千个 token。用第 17 课“书桌”的比喻解释：为什么往对话里连发 30 张截图后，模型开始忘记你最早提的要求，回答还变慢、变贵？">
            图像 token 和文字 token 同住一张“书桌”（上下文窗口）。30 张截图 = 几万个图像 token，<b>把最早的对话挤出窗外</b>（忘事）；窗内 token 越多，注意力要计算的对象越多（变慢）；API 按 token 计费且每轮重发历史（变贵）。三件事是同一笔账。
          </QuizItem>
          <QuizItem q="3. 语音助手 A：你说完要等两秒它才开口，回答永远是标准播音腔；语音助手 B：几乎即时接话，你压低声音说悄悄话，它也跟着小声回。判断两者的架构，并说出 B 能“跟着小声”的物质基础。">
            A 是<b>三段式</b>（听写 → 文字思考 → 配音）：延迟三段相加，模型只见过文字稿，语气进门即丢。B 是<b>原生语音</b>：语音 token 直进直出。物质基础在于<b>音频切片向量里保留了音量、语速、语气等信息</b>，模型“听”得到你在小声说话，输出端又直接生成语音 token，所以能用同样的方式回应。
          </QuizItem>
        </div>
      </Lsec>
    </>
  )
}
