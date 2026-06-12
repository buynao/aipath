import { useState } from 'react'
import { Lsec, Pill, QuizItem } from '../components/ui.jsx'

function Code({ html }) {
  return (
    <pre className="code">
      <code dangerouslySetInnerHTML={{ __html: html }} />
    </pre>
  )
}

const CODE_RUN = `<span class="cm"># ① 安装：打开 ollama.com 下载安装包，一路下一步（macOS / Windows / Linux 都有）</span>

<span class="cm"># ② 拉起一个模型 —— 一条命令，下载和运行全包了</span>
ollama run qwen3:8b

<span class="cm"># ③ 没有第三步，已经可以聊了：</span>
>>> 帮我把这段话翻译成英文：今天天气不错
Sure! "The weather is nice today."`

const CODE_SWITCH = `client = OpenAI(
    base_url=<span class="str">"http://localhost:11434/v1"</span>,  <span class="cm"># ← 原来指向云端，现在指向你自己的电脑</span>
    api_key=<span class="str">"ollama"</span>,                      <span class="cm"># ← 本地不计费也不验身份，填个非空字符串即可</span>
)
<span class="cm"># 再把 model 改成 "qwen3:8b"，流式输出、messages 列表……一切照常工作</span>`

// ============================================================
// 演示一：量化显微镜
// ============================================================
const QMODES = {
  fp16: {
    bits: 16, val: '0.2731934', size: 14, savedTxt: '',
    title: 'FP16 · 出厂原版',
    period: '每参数 16 位（2 字节）· 7B 本体 ≈ 14 GB',
    analogy: '🎧 类比：录音棚无损 WAV —— 一点不丢，体积最大',
    desc: '模型出厂时，每个参数都是一个 16 位的小数，精度拉满。但 7B 模型光本体就要 14 GB，多数笔记本直接装不下 —— 所以本地玩家几乎不跑原版，先压缩再说。',
    tags: ['体积 100%', '精度损失：无'],
  },
  q8: {
    bits: 8, val: '≈ 0.273', size: 7, savedTxt: '已省下 ≈ 7 GB',
    title: 'Q8 · 体积砍半',
    period: '每参数 8 位（1 字节）· 7B 本体 ≈ 7 GB',
    analogy: '🎧 类比：高码率 mp3 —— 体积减半，耳朵基本听不出',
    desc: '把每个参数压到 8 位，整个模型体积砍半，回答质量几乎无损 —— 内存富余时的稳妥之选。',
    tags: ['体积 50%', '精度损失：几乎无感'],
  },
  q4: {
    bits: 4, val: '≈ 0.27', size: 3.5, savedTxt: '已省下 ≈ 10.5 GB',
    title: 'Q4 · 本地玩家默认档',
    period: '每参数 4 位（0.5 字节）· 7B 本体 ≈ 3.5 GB',
    analogy: '🎧 类比：普通 mp3 —— 体积只剩 1/4，日常听照样香',
    desc: '压到 4 位，体积只剩 1/4，精度损一点点 —— 日常对话、翻译、总结基本无感。省下的内存还能换大一号的模型，这正是 Q4 成为默认选择的原因。',
    tags: ['体积 25%', '精度损失：一点点'],
  },
}

function QaDemo() {
  const [key, setKey] = useState('fp16')
  const m = QMODES[key]
  const wf = (340 * m.size) / 14
  return (
    <div className="card demo" style={{ marginTop: 14 }}>
      <div className="demo-head">
        <span className="demo-title">🎛️ 小演示 · 量化显微镜</span>
        <span className="demo-hint">点按钮切换压缩档位，看体积和精度怎么变</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="qa-svg" viewBox="0 0 400 250" width="390" aria-label="量化示意：一个参数占用的二进制位数，以及整个 7B 模型的内存占用变化">
            <text x="30" y="22" fontSize="11" fontWeight="600" fill="var(--fg-2)">🔬 显微镜下：一个参数（权重）占多少位</text>
            <g>
              {Array.from({ length: 16 }, (_, i) =>
                i < m.bits ? (
                  <rect key={i} x={30 + i * 21.4} y="34" width="18" height="22" rx="4" fill="var(--sky)" fillOpacity="0.85" />
                ) : (
                  <rect key={i} x={30 + i * 21.4} y="34" width="18" height="22" rx="4" fill="none" stroke="var(--fg-2)" strokeDasharray="3 3" opacity="0.4" />
                )
              )}
            </g>
            <text x="30" y="92" fontSize="12" fill="var(--fg-0)">{'这个参数存下的数值：' + m.val + (key === 'fp16' ? '' : '（示意）')}</text>
            <text x="30" y="124" fontSize="11" fontWeight="600" fill="var(--fg-2)">🗺️ 拉远看：整个 7B 模型占多少内存</text>
            <g>
              <rect x="30" y="134" width={wf} height="26" rx="5" fill="var(--sky)" fillOpacity="0.8" />
              {m.size < 14 && (
                <rect x={30 + wf + 3} y="134" width={340 - wf - 3} height="26" rx="5" fill="none" stroke="var(--fg-2)" strokeDasharray="4 4" opacity="0.45" />
              )}
            </g>
            <text x="30" y="182" fontSize="11.5" fill="var(--fg-0)">{'7B 模型本体 ≈ ' + m.size + ' GB'}</text>
            <text x="370" y="182" textAnchor="end" fontSize="11.5" fill="var(--sage)">{m.savedTxt}</text>
            <text x="30" y="218" fontSize="12.5" fill="var(--fg-1)">{m.analogy}</text>
            <text x="30" y="240" fontSize="10" fill="var(--fg-2)">位块与数值为示意 · 真实量化按块混合进行</text>
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            {[['fp16', 'FP16 原版'], ['q8', '压成 Q8'], ['q4', '压成 Q4']].map(([k, label]) => (
              <button key={k} className={`chip${k === key ? ' active' : ''}`} onClick={() => setKey(k)}>{label}</button>
            ))}
          </div>
          <h4 style={{ marginTop: 14 }}>{m.title}</h4>
          <div className="period">{m.period}</div>
          <p>{m.desc}</p>
          <div className="tags">{m.tags.map((t) => <Pill key={t} type="ink">{t}</Pill>)}</div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 演示二：内存计算器
// ============================================================
const CONFIGS = [8, 16, 32, 64]
const V = {
  ok:    { t: '能跑',   c: 'var(--sage)',       pill: 'sage' },
  tight: { t: '吃力',   c: 'var(--amber)',      pill: 'amber' },
  no:    { t: '跑不动', c: 'var(--terracotta)', pill: 'terracotta' },
}
const xOf = (gb) => {
  const v = Math.min(Math.max(gb, 2), 512)
  return 30 + ((Math.log2(v) - 1) / 8) * 340
}
const verdictOf = (need, mem) => {
  const r = need / mem
  return r <= 0.8 ? 'ok' : r <= 1.1 ? 'tight' : 'no'
}
const fmt = (n) => {
  const r = Math.round(n * 10) / 10
  return r % 1 === 0 ? String(r) : r.toFixed(1)
}

function CalcDemo() {
  const [p, setP] = useState(14)
  const [q, setQ] = useState(1)
  const need = p * q * 1.2
  let minOk = null
  const rows = CONFIGS.map((mem) => {
    const v = verdictOf(need, mem)
    if (v === 'ok' && minOk === null) minOk = mem
    return { mem, v }
  })
  const note =
    minOk === 8  ? '入门甜点档：近几年的主流电脑基本都能跑。'
    : minOk === 16 ? '16GB 内存的主流笔记本即可胜任。'
    : minOk === 32 ? '得上 32GB 内存 —— 进阶玩家的配置。'
    : minOk === 64 ? '只有 64GB 级别的大内存机器（如高配 Mac）才稳得住。'
    : '家用电脑基本无缘 —— 这个档位属于工作站和机房。'

  return (
    <div className="card demo" style={{ marginTop: 16 }}>
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · 本地模型内存计算器</span>
        <span className="demo-hint">选参数量 × 量化档，看标尺上的圆点变色</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="calc-svg" viewBox="0 0 400 240" width="400" aria-label="内存需求估算：所需内存在 8GB 到 64GB 常见配置标尺上的位置">
            <text x="200" y="52" textAnchor="middle" fontSize="30" fontWeight="700" fill="var(--fg-0)">{'≈ ' + fmt(need) + ' GB'}</text>
            <text x="200" y="76" textAnchor="middle" fontSize="11.5" fill="var(--fg-2)">{p + '（十亿参数）× ' + q + ' 字节 × 1.2 开销'}</text>
            <g id="calc-needle" transform={`translate(${xOf(need).toFixed(1)},0)`}>
              <line x1="0" y1="92" x2="0" y2="136" stroke="var(--fg-0)" strokeWidth="1.5" strokeDasharray="3 3" />
              <path d="M -6 136 L 6 136 L 0 148 Z" fill="var(--fg-0)" />
            </g>
            <line x1="30" y1="150" x2="370" y2="150" stroke="var(--hairline-strong)" strokeWidth="1.5" />
            <g>
              {rows.map(({ mem, v }) => {
                const x = xOf(mem)
                return (
                  <g key={mem}>
                    <line x1={x} y1="144" x2={x} y2="156" stroke="var(--fg-2)" strokeWidth="1.5" />
                    <text x={x} y="172" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="var(--fg-1)">{mem + 'GB'}</text>
                    <circle cx={x} cy="186" r="4.5" fill={V[v].c} />
                  </g>
                )
              })}
            </g>
            <text x="200" y="212" textAnchor="middle" fontSize="10.5">
              <tspan fill="var(--sage)">● 能跑</tspan>
              <tspan dx="14" fill="var(--amber)">● 吃力（卡线）</tspan>
              <tspan dx="14" fill="var(--terracotta)">● 跑不动</tspan>
            </text>
            <text x="200" y="232" textAnchor="middle" fontSize="10" fill="var(--fg-2)">常见内存配置标尺（对数刻度）· 圆点 = 该配置跑不跑得动</text>
          </svg>
        </div>
        <div className="demo-side">
          <div className="opt-label">① 选参数量（模型名里的数字）</div>
          <div className="chips">
            {[7, 14, 32, 70].map((v) => (
              <button key={v} className={`chip${p === v ? ' active' : ''}`} onClick={() => setP(v)}>{v}B</button>
            ))}
          </div>
          <div className="opt-label">② 选量化档（每参数字节数）</div>
          <div className="chips">
            {[[0.5, 'Q4 · 0.5 字节'], [1, 'Q8 · 1 字节'], [2, 'FP16 · 2 字节']].map(([v, label]) => (
              <button key={v} className={`chip${q === v ? ' active' : ''}`} onClick={() => setQ(v)}>{label}</button>
            ))}
          </div>
          <div className="opt-label">③ 看哪台机器跑得动</div>
          <div className="stat-pills">
            {rows.map(({ mem, v }) => <Pill key={mem} type={V[v].pill}>{mem + 'GB → ' + V[v].t}</Pill>)}
          </div>
          <p style={{ fontSize: 13 }}>{note}</p>
          <p className="footnote" style={{ marginTop: 10 }}>粗略估算：长对话的 KV cache 会再吃几 GB，"吃力"档需要关闭大程序、调小上下文碰运气。以实测为准。</p>
        </div>
      </div>
    </div>
  )
}

export default function L27() {
  return (
    <>
      <Lsec title="🎯 你将学会">
        <div className="card goals">
          <div className="goal-item"><span className="tick">✓</span>三步把一个开源大模型跑在自己电脑上 —— 不要 API key、不要网络、不要钱</div>
          <div className="goal-item"><span className="tick">✓</span>看懂模型下载页上的黑话：7B 是参数量、Q4/Q8 是量化档、GGUF 是文件格式</div>
          <div className="goal-item"><span className="tick">✓</span>学会口算"我的电脑能跑多大的模型"：参数量 × 量化字节数，再加两成开销</div>
          <div className="goal-item"><span className="tick">✓</span>给本地模型摆正预期：哪些活交给它、哪些活仍然留给云端旗舰</div>
        </div>
      </Lsec>

      <Lsec
        title='💡 核心概念：把大模型"请回家"的三个理由'
        lead='上一课的聊天机器人有两根"脐带"：网线和账单 —— 每句话都要发去云端，每个 token 都在计费。这一课我们把脐带剪了：模型整个搬进你的电脑。值得这么折腾的理由有三个。'
      >
        <div className="use-grid">
          <div className="card use-card">
            <div className="label">理由一 · 隐私</div>
            <div className="en">数据<b>不出门</b></div>
            <div className="zh">病历、合同、日记、公司代码 —— 推理全程发生在你的内存里，断网照样跑，一个字节都不上传。这是任何云端条款都给不了的硬保证。</div>
          </div>
          <div className="card use-card">
            <div className="label">理由二 · 成本</div>
            <div className="en">账单<b>归零</b></div>
            <div className="zh">第 26 课算过：全量重发让重度使用越聊越贵，Agent 一跑账单起飞。本地模型下载一次随便造 —— 电费就是全部成本。</div>
          </div>
          <div className="card use-card">
            <div className="label">理由三 · 乐趣</div>
            <div className="en">完全<b>属于你</b></div>
            <div className="zh">换模型、改人设、拆开 API 做实验，没有限速、没有审核、没有"服务调整公告"。第 25 课的开源版图，从这里开始变成你的玩具。</div>
          </div>
        </div>
        <p>这扇门是被<b>开源权重模型</b>（第 25 课）推开的：Llama、Qwen、DeepSeek 们把训练好的参数公开放出来，任何人都能下载。于是问题只剩一个 —— 动辄几百亿参数的庞然大物，怎么塞进你这台内存有限的电脑？这正是本课的主线。</p>
      </Lsec>

      <Lsec
        title="🚀 三行命令，模型进家门"
        lead={<>先尝到甜头再讲原理。<b>Ollama</b> 是目前最省心的本地模型管家：下载、运行、管理一条龙，三步开聊（其实要敲的只有一条命令）。</>}
      >
        <div className="card demo">
          <div className="demo-head">
            <span className="demo-title">⌨️ 终端 · 从零到开聊</span>
            <span className="demo-hint">首次运行会自动下载几个 GB 的模型文件</span>
          </div>
          <Code html={CODE_RUN} />
        </div>
        <p className="footnote" style={{ marginTop: 10 }}>模型名会不断更新换代（写到这里时 qwen3 系列是热门选择），跑之前去 Ollama 官网的模型库抄最新名字。完全不想碰命令行？LM Studio 提供同样能力的图形界面，鼠标点点即可。</p>
        <p style={{ marginTop: 20 }}>接着是本课最爽的一刻：<b>Ollama 装好后，会在你电脑的 11434 端口常驻一个服务，对外说的正是"OpenAI 兼容 API"这门普通话</b>。也就是说，第 26 课那 30 行 chat.py，改两行就从云端切到了本地：</p>
        <div className="card demo" style={{ marginTop: 14 }}>
          <div className="demo-head">
            <span className="demo-title">📄 chat.py · 只改两行，云端切本地</span>
            <span className="demo-hint">其余 28 行原封不动</span>
          </div>
          <Code html={CODE_SWITCH} />
        </div>
        <p>这就是"OpenAI 兼容"五个字的全部含义：<b>应用代码一行不改，模型随便换</b>。开发调试用本地模型免费试错，上线再换回云端旗舰；下一课搭 RAG，这个开关还会再扳一次。</p>
      </Lsec>

      <Lsec
        title="🔤 黑话解码：7B、Q4、GGUF 是什么意思"
        lead="打开 Ollama 的模型库，你会看到一排让人头大的名字：qwen3:8b、llama3.3:70b-q4_K_M……别慌，黑话总共就四个，这张表是本课的核心价值："
      >
        <div className="card">
          <table className="match">
            <thead><tr><th>黑话</th><th>一句话人话</th><th>多说一句</th></tr></thead>
            <tbody>
              <tr><td className="be">7B / 70B</td><td>参数量：70 亿 / 700 亿个可调"旋钮"</td><td className="ex">B = Billion（十亿）。第 15 课的规模法则在此兑现：参数越多通常越聪明 —— 也越吃内存。挑模型先看这个数。</td></tr>
              <tr><td className="be">Q4 / Q8</td><td>量化：每个参数从 16 位压到 4 / 8 位</td><td className="ex">相当于把无损音乐压成 mp3：Q4 体积只剩 1/4，精度只损一点点。下面的"量化显微镜"亲手压给你看。</td></tr>
              <tr><td className="be">GGUF</td><td>本地推理通用的模型文件格式</td><td className="ex">你下载的那个几 GB 的文件就是它。源自 llama.cpp 生态，Ollama、LM Studio 都认 —— 模型界的"通用集装箱"。</td></tr>
              <tr><td className="be">上下文 32K</td><td>能记多长的对话 —— 这也吃内存</td><td className="ex">聊得越长，KV cache（第 17 课）越大，内存占用在模型本体之上继续涨。内存吃紧时，调小上下文是隐藏的省内存开关。</td></tr>
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: 20 }}>四个黑话里，<b>量化</b>最值得亲眼看一遍。模型出厂时每个参数都是一个 16 位的小数；量化就是"砍位数"—— 位数减半，整个模型体积就减半。点下面的按钮，把一个 7B 模型从原版一路压到 Q4：</p>
        <QaDemo />
        <p className="footnote" style={{ marginTop: 10 }}>为什么敢砍？因为模型的"知识"分摊在几十亿个参数的整体分布里，单个参数粗一点，大局几乎不受影响 —— 和 mp3 砍掉人耳不敏感的细节是同一种聪明。</p>
      </Lsec>

      <Lsec
        title="🎛️ 交互演示：我的电脑能跑哪个模型？"
        lead={<>本地跑模型的第一道门槛不是显卡多强，而是<b>模型能不能整个装进内存</b>。好消息：看名字就能口算。本课唯一的式子 ——</>}
      >
        <div className="card l26-formula">所需内存（GB）≈ 参数量（B）× 每参数字节数 × 1.2</div>
        <p>三个数各是什么：<b>参数量</b>就是名字里的 7、14、70（单位十亿）；<b>每参数字节数</b>由量化档决定 —— FP16 是 2 字节、Q8 是 1 字节、Q4 是 0.5 字节；<b>× 1.2</b> 是给运行时开销留的两成余量。例：7B 的 Q4 版 ≈ 7 × 0.5 × 1.2 ≈ 4.2 GB —— 8GB 内存的电脑就能跑。下面的计算器替你算全了：</p>
        <CalcDemo />
        <p>标尺上还藏着一个反常识：跑本地模型，<b>Mac 反而是甜点机器</b>。台式机的独立显卡，显存和内存是两块分开的（显卡标 12GB 显存，那就是上限）；而 Mac 的<b>统一内存显存内存一体</b>，买 64GB 就能拿出一大半喂给模型 —— 这正是上面 64GB 那一档常被 Mac 玩家点亮的原因。</p>
      </Lsec>

      <Lsec
        title="🪞 诚实预期：跑得起 ≠ 跑得好"
        lead="第 25 课说过开源在追赶，但请认清：你电脑里跑的 7B 量化版，既不是开源最强（最强的那档你也装不下），更不是云端前沿 —— 中间隔着明显的代差。它像一台家用打印机：印作业、印合同利索得很，别指望印出版级画册。"
      >
        <div className="contrast">
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">交给本地</span></div>
            <div className="big">量大、简单、<span className="hl">敏感</span>的活</div>
            <p className="note">批量打标签、抽取信息、改写润色、总结隐私文档 —— 不限量、不要钱、数据不出门。还有最重要的一项：随便折腾着学。</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-ink">留给云端</span></div>
            <div className="big">复杂、烧脑、<span className="gap">要质量</span>的活</div>
            <p className="note">多步推理、长程 Agent 任务、高质量长文 —— 这些是前沿模型的主场。本地 7B 硬刚，只会刷新你对"幻觉"的认识。</p>
          </div>
        </div>
        <p>幸运的是，你已经掌握了两全的姿势：同一份代码，<b>base_url 一换就能在本地和云端之间切换</b>。敏感数据走本地，硬骨头丢云端 —— 这才是工程师的答案，而不是站队。</p>
      </Lsec>

      <Lsec title="⚠️ 常见误区">
        <div className="card alert-card row-list">
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">装上 Ollama，等于白嫖了一个 ChatGPT</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">本地小模型和云端前沿模型有明显代差 —— 它是"够用的助手"，不是免费的 Claude / GPT</span></div>
            </div>
            <p className="why"><b>病因：</b>都叫"大模型"，名字相似掩盖了规模差距。你跑的是 7B 量化版，云端旗舰的参数量大它一到两个数量级，身后还站着整个机房。翻译、总结这类简单任务感觉不出差距，一到复杂推理、长链路任务就原形毕露。预期摆正了，它反而处处是惊喜。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">没有 NVIDIA 显卡，本地大模型与我无缘</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">Mac 统一内存是公认甜点，纯 CPU 也能跑 —— 区别只是每秒吐字的速度</span></div>
            </div>
            <p className="why"><b>病因：</b>把"训练"和"推理"混为一谈。训练确实离不开机房级显卡（第 12 课），但推理只要模型装得进内存就能算。llama.cpp 生态把 CPU 推理优化到了可用的程度；Mac 的统一内存更是让"显存不够"这个老大难直接消失。没有独显的电脑跑 7B Q4，慢一点，但门是开着的。</p>
          </div>
        </div>
      </Lsec>

      <Lsec
        title="✍️ 小练习"
        lead="前两题口算就行，第三题留给你的终端。"
      >
        <div className="card quiz row-list">
          <QuizItem q="1. 朋友的笔记本有 16GB 内存，想本地跑某个 32B 模型的 Q4 版。帮他口算一下，可行吗？不行的话退到哪一档？">
            <b>32 × 0.5 × 1.2 ≈ 19.2 GB，超过 16GB —— 跑不动。</b>退一档：14B 的 Q4 版 ≈ 14 × 0.5 × 1.2 ≈ 8.4 GB，16GB 机器能跑且留有余量。这就是黑话的实用价值：不用下载、不用试错，看名字就能下结论。
          </QuizItem>
          <QuizItem q="2. 同一个模型有 Q4 和 Q8 两个版本，你的内存两个都装得下，该选哪个？">
            这是道权衡题，<b>没有标准答案</b>：Q8 更接近原版精度；Q4 省下的内存可以换更长的上下文（KV cache）、更流畅的多任务，甚至直接换大一号的模型 —— 同样约 8.4 GB，14B Q4 通常比 7B Q8 更聪明（参数量优先于精度，这是本地圈的常见经验）。多数人默认 Q4，不满意再升。
          </QuizItem>
          <QuizItem q='3. 动手题：把第 26 课的 chat.py 接到本地 Ollama 上，一共要改哪几处？改完怎么验证"数据不出门"？'>
            三处：① <b>base_url</b> 改为 http://localhost:11434/v1；② <b>model</b> 改成本地模型名（以你 ollama list 列出的为准）；③ <b>api_key</b> 填任意非空字符串（本地不验证）。其余代码一行不动，流式输出照常工作。验证方式简单粗暴：<b>拔掉网线（或关 Wi-Fi）再聊一句</b> —— 还能回答，就证明推理真的发生在你的电脑里。
          </QuizItem>
        </div>
      </Lsec>
    </>
  )
}
