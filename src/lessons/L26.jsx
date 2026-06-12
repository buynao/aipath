import { useState, useRef, useEffect } from 'react'
import { Lsec, QuizItem } from '../components/ui.jsx'

const REDUCED =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// 静态高亮代码块：内容由本课作者掌控，安全
function Code({ html }) {
  return (
    <pre className="code">
      <code dangerouslySetInnerHTML={{ __html: html }} />
    </pre>
  )
}

const CODE_FULL = `import os
from openai import OpenAI                <span class="cm"># ① 先 pip install openai</span>

client = OpenAI(
    api_key=os.environ[<span class="str">"API_KEY"</span>],       <span class="cm"># ① key 读自环境变量，绝不写死在代码里</span>
    <span class="cm"># base_url="https://…/v1",           # 想连别家模型？通常改这行 + key 即可</span>
)

messages = [                             <span class="cm"># ③ 对话历史，从"人物小传"开始</span>
    {<span class="str">"role"</span>: <span class="str">"system"</span>, <span class="str">"content"</span>: <span class="str">"你是一位耐心的中文 AI 助教，回答简洁。"</span>}
]

print(<span class="str">"开始聊天吧（输入 quit 退出）"</span>)
while True:                              <span class="cm"># ④ 多轮对话 = 一个循环 + 一个 list</span>
    user_input = input(<span class="str">"\\n你："</span>)
    if user_input.strip() == <span class="str">"quit"</span>:
        break
    messages.append({<span class="str">"role"</span>: <span class="str">"user"</span>, <span class="str">"content"</span>: user_input})

    stream = client.chat.completions.create(
        model=<span class="str">"gpt-4o-mini"</span>,             <span class="cm"># ② 用哪个模型，写名字就行</span>
        messages=messages,               <span class="cm"># ④ 注意：每轮都发"全部"历史</span>
        stream=True,                     <span class="cm"># ⑤ 流式：边生成边返回</span>
    )

    reply = <span class="str">""</span>
    print(<span class="str">"AI："</span>, end=<span class="str">""</span>)
    for chunk in stream:                 <span class="cm"># ⑤ 一小块一小块地收</span>
        piece = chunk.choices[0].delta.content or <span class="str">""</span>
        print(piece, end=<span class="str">""</span>, flush=True)
        reply += piece

    messages.append({<span class="str">"role"</span>: <span class="str">"assistant"</span>, <span class="str">"content"</span>: reply})  <span class="cm"># ④ 回复也存进历史</span>
    print()`

const CODE_1 = `<span class="cm"># 终端里执行：</span>
pip install openai                       <span class="cm"># 装官方 SDK，一行搞定</span>

<span class="cm"># macOS / Linux：把 key 存进环境变量（仅当前终端生效）</span>
export API_KEY=<span class="str">"sk-…你的密钥…"</span>
<span class="cm"># Windows PowerShell 写法：$env:API_KEY = "sk-…"</span>`

const CODE_2 = `resp = client.chat.completions.create(
    model=<span class="str">"gpt-4o-mini"</span>,                <span class="cm"># 点哪道"菜"：模型名（能力、价格各不同）</span>
    messages=[
        {<span class="str">"role"</span>: <span class="str">"user"</span>, <span class="str">"content"</span>: <span class="str">"用一句话解释 token 是什么"</span>}
    ],
)
print(resp.choices[0].message.content)   <span class="cm"># 模型的回复藏在这里</span>`

const CODE_3 = `messages = [
    {<span class="str">"role"</span>: <span class="str">"system"</span>,    <span class="str">"content"</span>: <span class="str">"你是一位毒舌影评人，嘴狠但在理。"</span>},
    {<span class="str">"role"</span>: <span class="str">"user"</span>,      <span class="str">"content"</span>: <span class="str">"《流浪地球》好看吗？"</span>},
    {<span class="str">"role"</span>: <span class="str">"assistant"</span>, <span class="str">"content"</span>: <span class="str">"特效在线。剧本嘛……我们还是聊特效吧。"</span>},
    {<span class="str">"role"</span>: <span class="str">"user"</span>,      <span class="str">"content"</span>: <span class="str">"那第二部呢？"</span>},
]`

const CODE_4 = `messages.append({<span class="str">"role"</span>: <span class="str">"user"</span>, <span class="str">"content"</span>: user_input})       <span class="cm"># 你说的，存进去</span>
stream = client.chat.completions.create(
    model=<span class="str">"gpt-4o-mini"</span>, messages=messages)                  <span class="cm"># 整个列表全量重发！</span>
messages.append({<span class="str">"role"</span>: <span class="str">"assistant"</span>, <span class="str">"content"</span>: reply})    <span class="cm"># 它说的，也存进去</span>`

const CODE_5 = `stream = client.chat.completions.create(
    model=<span class="str">"gpt-4o-mini"</span>, messages=messages,
    stream=True,                         <span class="cm"># 打开流式开关</span>
)
for chunk in stream:                     <span class="cm"># 每个 chunk 带着刚生成的几个字</span>
    print(chunk.choices[0].delta.content or <span class="str">""</span>, end=<span class="str">""</span>, flush=True)`

// ============================================================
// 演示一：流式 vs 非流式
// ============================================================
const FULL = '「token」是模型读写文字的最小单位。它不是想好整句话再说，而是一个 token 一个 token 地往外吐 —— 流式输出只是把这个过程原样直播给你。'
const CHARS = Array.from(FULL)
const STEP = 38, DELAY = 300
const TOTAL = DELAY + CHARS.length * STEP
const SECS = (TOTAL / 1000).toFixed(1)

function StreamDemo() {
  const [sText, setSText] = useState('（等待发送…）')
  const [nText, setNText] = useState('（等待发送…）')
  const [sStat, setSStat] = useState(null)
  const [nStat, setNStat] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [done, setDone] = useState(false)
  const timers = useRef([])
  const dotTimer = useRef(null)

  const clearAll = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    if (dotTimer.current) { clearInterval(dotTimer.current); dotTimer.current = null }
  }
  useEffect(() => clearAll, [])

  const finalState = () => {
    setSText(FULL); setNText(FULL)
    setSStat(<>首字出现：<b>约 0.3 秒</b> · 全文完成：约 {SECS} 秒</>)
    setNStat(<>首字出现：<b>约 {SECS} 秒</b> —— 全文一次到齐，前面全在干等</>)
    setDone(true); setPlaying(false)
  }

  const play = () => {
    clearAll()
    if (REDUCED) { finalState(); return }
    setPlaying(true); setDone(false)
    setSText(''); setNText('⏳ 等待响应')
    setSStat('请求已发出…'); setNStat('请求已发出…')
    let acc = ''
    CHARS.forEach((ch, i) => {
      timers.current.push(setTimeout(() => {
        acc += ch
        setSText(acc)
        if (i === 0) setSStat(<>首字出现：<b>0.3 秒</b> ✓ 已经在读了</>)
      }, DELAY + i * STEP))
    })
    let dots = 0
    dotTimer.current = setInterval(() => {
      dots = (dots + 1) % 4
      setNText('⏳ 等待响应' + '.'.repeat(dots))
    }, 350)
    timers.current.push(setTimeout(() => {
      if (dotTimer.current) { clearInterval(dotTimer.current); dotTimer.current = null }
      finalState()
    }, TOTAL + 60))
  }

  return (
    <div className="card demo" style={{ marginTop: 14 }}>
      <div className="demo-head">
        <span className="demo-title">🎛️ 小演示 · 流式 vs 非流式</span>
        <span className="demo-hint">同一个回答，两种返回方式，同时发出</span>
      </div>
      <div className="demo-pad">
        <div className="term-grid">
          <div>
            <div className="term-label">stream=True · 边生成边发</div>
            <div className="term">{sText}</div>
            <div className="term-stat">{sStat}</div>
          </div>
          <div>
            <div className="term-label">stream=False · 生成完再发</div>
            <div className="term">{nText}</div>
            <div className="term-stat">{nStat}</div>
          </div>
        </div>
        <div className="chips" style={{ marginTop: 14 }}>
          <button className="chip" onClick={play} disabled={playing}>
            {done ? '↻ 再放一遍' : '▶ 同时发出两个请求'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 演示二：算钱滑块
// ============================================================
const IN_PRICE = 2 / 1e6, OUT_PRICE = 8 / 1e6
const SYS = 50, U = 200, A = 200, MAX_N = 30
const inTok = (k) => SYS + (k - 1) * (U + A) + U
const MAX_TOK = inTok(MAX_N)
const fmtTok = (t) => (t >= 10000 ? (t / 10000).toFixed(1) + ' 万' : String(t))

function CostDemo() {
  const [n, setN] = useState(8)
  let cumIn = 0
  for (let k = 1; k <= n; k++) cumIn += inTok(k)
  const cumOut = A * n
  const fee = cumIn * IN_PRICE + cumOut * OUT_PRICE
  const feeStr = fee < 0.01 ? '≈ ¥' + fee.toFixed(4) : '≈ ¥' + fee.toFixed(2)
  const note =
    fee < 0.01 ? '不到 1 分钱 —— 单聊确实便宜。'
    : fee < 0.1 ? '几分钱量级 —— 仍然便宜，但注意柱子越长越高。'
    : '几毛钱量级 —— 想象 Agent 一天自动跑几百轮，再乘以用户数。'

  return (
    <div className="card demo" style={{ marginTop: 16 }}>
      <div className="demo-head">
        <span className="demo-title">🎛️ 算一算 · 聊到第几轮，一共花多少钱？</span>
        <span className="demo-hint">费率与 token 数均为数量级示例，以官网为准</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="cost-svg" viewBox="0 0 380 200" width="380" aria-label="柱状图：每一轮要重发的输入 token 随轮数线性增长">
            <line x1="12" y1="152" x2="372" y2="152" stroke="var(--hairline-strong)" strokeWidth="1" />
            {Array.from({ length: MAX_N }, (_, i) => {
              const k = i + 1
              const h = Math.max(4, (inTok(k) / MAX_TOK) * 132)
              const fill = k < n ? 'var(--sky)' : k === n ? 'var(--amber)' : 'var(--hairline)'
              return (
                <rect key={k} x={14 + i * 12} y={152 - h} width="9" height={h} rx="2" fill={fill}>
                  <title>{'第 ' + k + ' 轮：要重发约 ' + inTok(k) + ' token'}</title>
                </rect>
              )
            })}
            <text x="14" y="168" fontSize="9" fill="var(--fg-2)">第 1 轮</text>
            <text x="372" y="168" fontSize="9" textAnchor="end" fill="var(--fg-2)">第 30 轮</text>
            <text x="192" y="188" fontSize="10" textAnchor="middle" fill="var(--fg-2)">每根柱子 = 该轮要重发的输入 token（历史越长越贵）</text>
          </svg>
        </div>
        <div className="demo-side">
          <div className="slider-row">
            <label htmlFor="cost-rounds">对话轮数</label>
            <input type="range" id="cost-rounds" min="1" max="30" value={n} onChange={(e) => setN(+e.target.value)} />
            <span className="val">{n}</span>
          </div>
          <p style={{ fontSize: 13 }}>假设每轮你说约 200 token、AI 答约 200 token；费率取上文示例值。</p>
          <div className="cost-stats">
            <div><span>这一轮要重发的输入</span><b>约 {fmtTok(inTok(n))} token</b></div>
            <div><span>累计消耗 token</span><b>约 {fmtTok(cumIn + cumOut)} token</b></div>
            <div><span>累计估算费用</span><b>{feeStr}</b></div>
          </div>
          <p style={{ fontSize: 13 }}>{note}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 演示三：messages 列表与"失忆"实验
// ============================================================
const ROLE_STYLE = {
  system:    { fill: 'var(--bg-inset)', stroke: 'var(--hairline-strong)', limit: 12 },
  user:      { fill: 'var(--sky-bg)',   stroke: 'var(--sky)',             limit: 13 },
  assistant: { fill: 'var(--sage-bg)',  stroke: 'var(--sage)',            limit: 11 },
}
const ROUNDS = [
  { u: '我叫小拓，刚开始学 AI。', a: '你好小拓！欢迎入坑，想先聊点什么？',
    desc: '你的话和它的回复都被 append 进了 list。注意：刚才发出去的是整个列表（system + 你这句），不止一句话。' },
  { u: '我叫什么名字？', a: '你叫小拓 —— 上一句你刚说过呀。',
    desc: '它"记得"名字，不是因为记性好，而是带名字的那条消息刚刚又被你的代码原封不动重发了一遍。剪刀已解锁 ✂️' },
  { u: '再问一遍：我叫什么？', a: null, desc: null },
]
const trunc = (t, n) => (t.length > n ? t.slice(0, n) + '…' : t)

function MemDemo() {
  const [msgs, setMsgs] = useState([{ role: 'system', text: '你是一位耐心的 AI 课程助教', cut: false }])
  const [idx, setIdx] = useState(0)
  const [cut, setCut] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [title, setTitle] = useState('初始状态')
  const [desc, setDesc] = useState('messages 里只有一条 system —— 给模型的人物小传。右边的云端什么都不知道，也什么都不会记。')
  const [stats, setStats] = useState(<span className="pill pill-ink">点「发送下一轮」开始</span>)
  const [pulseKey, setPulseKey] = useState(0)
  const finishTimer = useRef(null)
  useEffect(() => () => { if (finishTimer.current) clearTimeout(finishTimer.current) }, [])

  const sendDisabled = busy || done || idx >= ROUNDS.length
  const cutDisabled = busy || done || cut || idx < 2

  const reset = () => {
    if (finishTimer.current) clearTimeout(finishTimer.current)
    setMsgs([{ role: 'system', text: '你是一位耐心的 AI 课程助教', cut: false }])
    setIdx(0); setCut(false); setBusy(false); setDone(false)
    setTitle('初始状态')
    setDesc('messages 里只有一条 system —— 给模型的人物小传。右边的云端什么都不知道，也什么都不会记。')
    setStats(<span className="pill pill-ink">点「发送下一轮」开始</span>)
  }

  const showStats = (list) => {
    const sent = list.filter((m) => !m.cut)
    const chars = sent.reduce((s, m) => s + m.text.length + 4, 0)
    setStats(
      <>
        <span className="pill pill-sky">本轮发送 {sent.length} 条消息</span>
        <span className="pill pill-amber">约 {Math.round(chars * 1.5)} token（粗算）</span>
      </>
    )
  }

  const send = () => {
    if (sendDisabled) return
    setBusy(true)
    const r = ROUNDS[idx]
    const isLast = idx === ROUNDS.length - 1
    const a = isLast ? (cut ? '抱歉，这段对话里没出现过你的名字……' : '还是小拓呀，这是你第三次问了。') : r.a
    const d = isLast
      ? (cut
        ? '失忆实锤：带名字的消息被你删了，而模型那头从来就没存过任何东西。所谓"记忆"，就是你代码里那个 list —— 第 17 课验证完毕。'
        : '历史还在 list 里，它就永远"记得"。点「重置」，这次在第 3 轮之前先点 ✂️ 砍掉历史，再看看它的反应。')
      : r.desc

    const withUser = [...msgs, { role: 'user', text: r.u, cut: false }]
    setMsgs(withUser)
    showStats(withUser)
    setTitle('第 ' + (idx + 1) + ' 轮已发送')
    if (!REDUCED) setPulseKey((k) => k + 1)

    const finish = () => {
      setMsgs([...withUser, { role: 'assistant', text: a, cut: false }])
      setDesc('AI：「' + a + '」 — ' + d)
      const ni = idx + 1
      setIdx(ni)
      if (ni >= ROUNDS.length) { setDone(true); setTitle('演示结束 · 第 ' + ni + ' 轮') }
      setBusy(false)
    }
    if (REDUCED) finish()
    else finishTimer.current = setTimeout(finish, 650)
  }

  const doCut = () => {
    if (cutDisabled) return
    setCut(true)
    setMsgs((list) => list.map((m, i) => (i > 0 ? { ...m, cut: true } : m)))
    setTitle('历史已删除')
    setDesc('✂️ 第 1、2 轮被你从 list 里删掉了（只留 system）。注意模型那边毫无反应 —— 它本来就什么都没存。现在发送第 3 轮试试。')
    setStats(<span className="pill pill-terracotta">已删除 4 条历史</span>)
  }

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · messages 列表与"失忆"实验</span>
        <span className="demo-hint">点「发送下一轮」推进剧情；第 3 轮前可以动剪刀</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="mem-svg" viewBox="0 0 400 290" width="400" aria-label="左侧为代码中的 messages 列表，右侧为无状态的云端模型，每轮请求全量重发列表">
            <text x="14" y="20" fontSize="11" fontWeight="600" fill="var(--fg-2)">你的代码里：messages = [ … ]</text>
            <g>
              {msgs.map((m, i) => {
                const y = 30 + i * 32
                const s = ROLE_STYLE[m.role]
                return (
                  <g key={i} opacity={m.cut ? 0.35 : 1}>
                    <rect x="12" y={y} width="188" height="26" rx="7" fill={s.fill} stroke={s.stroke} strokeWidth="1" />
                    <text x="22" y={y + 17} fontSize="10" fill="var(--fg-0)">{m.role + ' · ' + trunc(m.text, s.limit)}</text>
                    {m.cut && <line x1="12" y1={y + 13} x2="200" y2={y + 13} stroke="var(--terracotta)" strokeWidth="1.5" />}
                  </g>
                )
              })}
            </g>
            <g key={pulseKey} className={pulseKey ? 'pulse' : undefined}>
              <path d="M 206 112 L 252 112" stroke="var(--fg-2)" strokeWidth="1.5" fill="none" />
              <path d="M 252 112 l -7 -4 v 8 z" fill="var(--fg-2)" />
              <text x="229" y="102" textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--fg-1)">全量重发</text>
              <path d="M 252 156 L 206 156" stroke="var(--fg-2)" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
              <path d="M 206 156 l 7 -4 v 8 z" fill="var(--fg-2)" />
              <text x="229" y="172" textAnchor="middle" fontSize="9" fill="var(--fg-2)">新回复</text>
            </g>
            <rect x="258" y="94" width="130" height="84" rx="12" fill="var(--glass)" stroke="var(--hairline-strong)" />
            <text x="323" y="126" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--fg-0)">☁️ 云端模型</text>
            <text x="323" y="146" textAnchor="middle" fontSize="10" fill="var(--fg-2)">无状态 · 处理完即忘</text>
            <text x="323" y="162" textAnchor="middle" fontSize="10" fill="var(--fg-2)">什么都不存</text>
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            <button className="chip" onClick={send} disabled={sendDisabled}>▸ 发送下一轮</button>
            <button className="chip" onClick={doCut} disabled={cutDisabled}>✂️ 砍掉历史</button>
            <button className="chip" onClick={reset}>↺ 重置</button>
          </div>
          <h4 style={{ marginTop: 14 }}>{title}</h4>
          <p>{desc}</p>
          <div className="stat-pills">{stats}</div>
        </div>
      </div>
    </div>
  )
}

export default function L26() {
  return (
    <>
      <Lsec title="🎯 你将学会">
        <div className="card goals">
          <div className="goal-item"><span className="tick">✓</span>跑通人生第一次大模型 API 调用：装 SDK、配 key、发请求、收回复</div>
          <div className="goal-item"><span className="tick">✓</span>读懂 model / messages / role 三个核心参数，看穿"多轮记忆"其实是你代码里的一个 list</div>
          <div className="goal-item"><span className="tick">✓</span>会用流式输出，并能粗算一次对话大概花多少钱</div>
          <div className="goal-item"><span className="tick">✓</span>记牢 API key 的三条安全底线，避开新手最贵的翻车现场</div>
        </div>
      </Lsec>

      <Lsec
        title='💡 核心概念：所谓"做 AI 应用"，本质是发一个 HTTP 请求'
        lead={<>前 25 课你看着别人造模型：万亿 token 预训练（第 12 课）、RLHF 对齐（第 13 课）、烧掉的电够一座城用。好消息是：那都是<b>造模型的人</b>的事。<b>用模型的人</b>只需要会一件事 —— 把一段文字发给云端，把生成的文字收回来。整件事，30 行 Python 写完。</>}
      >
        <div className="contrast">
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-ink">想象中</span></div>
            <div className="big">做 AI 应用 <span className="gap">=</span> 读论文、买显卡、训练模型</div>
            <p className="note">那是第 12、13 课"造模型"的剧情 —— 烧的是大厂的钱，暂时轮不到你操心。</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">实际上</span></div>
            <div className="big">做 AI 应用 <span className="gap">=</span> <span className="hl">发一个 HTTP 请求，拿回一段文字</span></div>
            <p className="note">模型早已训练好、部署好，按 token 出租。你要做的只是"点菜"。</p>
          </div>
        </div>
        <p>先把完整代码端上来 —— 一个能在终端里持续对话的聊天机器人。看不懂没关系，下一节逐段拆：</p>
        <div className="card demo" style={{ marginTop: 14 }}>
          <div className="demo-head">
            <span className="demo-title">📄 chat.py · 完整可运行（约 30 行）</span>
            <span className="demo-hint">注释里的 ①–⑤ 对应下一节的五个段落</span>
          </div>
          <Code html={CODE_FULL} />
        </div>
        <p className="footnote" style={{ marginTop: 10 }}>本课用 Python + OpenAI 兼容风格的 SDK 演示。Anthropic 等各家官方 SDK 形态大同小异（都是"建客户端 → 传 model 和 messages → 收回复"）；DeepSeek、Qwen、Kimi 等很多国产模型直接兼容这套接口 —— 改 base_url 和 key 就能连。</p>
      </Lsec>

      <Lsec
        title="🔍 逐段拆解：30 行代码，5 个段落"
        lead="每一段先上代码，再说人话。读完这节，上面那 30 行对你就没有秘密了。"
      >
        <div className="seg">
          <h3><span className="num">①</span>装 SDK，把 key 藏进环境变量</h3>
          <Code html={CODE_1} />
          <p>先去模型厂商的开发者控制台注册、生成一个 <b>API key</b> —— 一串通常以 sk- 开头的长字符串。它同时是你的<b>身份证</b>和<b>银行卡</b>：服务器靠它认出你是谁，也靠它从你账户里扣费。所以第一条纪律现在就立下：<b>key 只放环境变量（或密钥管理服务），永远不写进代码</b>。代码里那句 <code>os.environ["API_KEY"]</code> 就是"运行时再去环境里取"的意思 —— 代码可以发给任何人看，key 不行。</p>
        </div>

        <div className="seg">
          <h3><span className="num">②</span>发起一次对话请求：model 和 messages</h3>
          <Code html={CODE_2} />
          <p>剥掉 SDK 的糖衣，这就是一个 <b>HTTPS POST 请求</b>：把一段 JSON 发到厂商的服务器，几秒后收到一段 JSON 回复，SDK 只是帮你拼参数、拆响应。必填的只有两个：<b>model</b> 是菜单上的菜名 —— 各家型号能力和价格差几十倍（第 25 课的版图派上用场了）；<b>messages</b> 是对话内容，一个列表。回复套在 <code>choices[0].message.content</code> 里，看着绕，背下来就行。</p>
        </div>

        <div className="seg">
          <h3><span className="num">③</span>messages 与三种 role：一场三人剧本</h3>
          <Code html={CODE_3} />
          <p>messages 里每条消息都标着 role —— 谁在说话：</p>
          <div className="card" style={{ marginTop: 12 }}>
            <table className="match">
              <thead><tr><th>role</th><th>谁在说话</th><th>拿来干什么</th></tr></thead>
              <tbody>
                <tr><td className="be">system</td><td>导演</td><td className="ex">给模型的"人物小传"：身份、语气、规矩。第 16 课的提示工程，主战场就在这一条。</td></tr>
                <tr><td className="be">user</td><td>用户</td><td className="ex">你（或你的用户）每一轮说的话。</td></tr>
                <tr><td className="be">assistant</td><td>模型</td><td className="ex">模型以前的回复。注意：多轮对话时，是<b>你的代码</b>把它塞回列表里的。</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="seg">
          <h3><span className="num">④</span>多轮对话的真相：自己维护 list，每轮全量重发</h3>
          <Code html={CODE_4} />
          <p>第 17 课埋的伏笔在这里兑现：<b>API 服务器完全无状态</b> —— 每个请求都是孤立的，处理完即忘，它连"上一轮"这个概念都没有。想"接着聊"，唯一的办法是你自己维护 messages 列表，<b>每一轮把全部历史原封不动重发一遍</b>。两个直接推论：一，越聊越贵（历史越长，输入 token 越多）；二，把历史从 list 里删掉，它就当场"失忆"。这两件事，下面的交互演示都能亲手验证。</p>
        </div>

        <div className="seg">
          <h3><span className="num">⑤</span>流式输出：体感快的秘密</h3>
          <Code html={CODE_5} />
          <p>第 10 课讲过：模型本来就是<b>一个 token 一个 token</b> 往外吐的。非流式 = 等它全部吐完，打包发给你；流式 = 吐一点立刻推一点。<b>总耗时几乎一样，但"第一个字出现的时间"天差地别</b> —— ChatGPT 的打字机效果不是装酷，是体验刚需。眼见为实：</p>
          <StreamDemo />
        </div>
      </Lsec>

      <Lsec
        title="💸 价格直觉，外加三条保命规则"
        lead={<>第一次绑卡充值前，先建立数量级直觉。账单只看两个数：<b>你发进去多少 token，它新生成多少 token</b>（第 11 课说过，token 是大模型世界的计量单位）。本课唯一的式子：</>}
      >
        <div className="card l26-formula">费用 ＝ 输入 token 数 × 输入单价 ＋ 输出 token 数 × 输出单价</div>
        <p><b>输入</b>指你发出的整个 messages —— 含 system 和全部历史，这就是"越聊越贵"的根源；<b>输出</b>指模型新生成的内容，单价通常比输入贵几倍。单价按"每百万 token"标价，<b>随时在变，以官网为准</b>。拿一组数量级示例算一笔：设输入 ¥2 / 百万 token、输出 ¥8 / 百万 token，一次普通问答（输入 500 + 输出 300 token）≈ 500×¥0.000002 ＋ 300×¥0.000008 ≈ <b>¥0.003，三厘钱</b>。结论：单次对话通常不到几分钱 —— 但别急着放心，拖拖下面的滑块：</p>
        <CostDemo />
        <p>看到柱子的形状了吗？因为全量重发，<b>每一轮的开销都比上一轮高</b>。即便如此，人对人聊天 30 轮也才几毛钱。真正烧钱的是第 20 课的 <b>Agent 循环</b>：一次任务自己跑几十轮，每轮还塞进大段工具结果和文档 —— 消耗直接跳一到两个数量级。写循环调 API 之前，先在控制台设好<b>用量上限</b>。</p>
        <p style={{ marginTop: 20 }}><b>然后是三条保命规则。</b>每年都有新手把 key 写进代码传上 GitHub，几分钟内被扫 key 爬虫捡走，醒来收到一张天价账单 —— 别做下一个：</p>
        <div className="use-grid" style={{ marginTop: 14 }}>
          <div className="card use-card">
            <div className="label">规则一</div>
            <div className="en">key <b>不进代码仓库</b></div>
            <div className="zh">环境变量或密钥管理服务才是 key 的家。一旦 push 到公开仓库，就当它已经泄露 —— 扫 key 的爬虫比你的同事先看到。</div>
          </div>
          <div className="card use-card">
            <div className="label">规则二</div>
            <div className="en">key <b>不进前端页面</b></div>
            <div className="zh">网页、小程序里的代码人人可看。正确姿势：前端只跟你自己的后端说话，由后端拿着 key 代发请求。</div>
          </div>
          <div className="card use-card">
            <div className="label">规则三</div>
            <div className="en">泄露<b>立刻吊销重发</b></div>
            <div className="zh">别抱侥幸。控制台里一键吊销旧 key、生成新 key，再检查账单 —— 处理流程对标"银行卡密码泄露"。</div>
          </div>
        </div>
      </Lsec>

      <Lsec
        title='🎛️ 交互演示：亲手戳破"记忆"的幻觉'
        lead={<>第 ④ 段说"记忆只是你代码里的 list"，现在亲手验证。左边是你代码里的 messages 列表，右边是云端模型。<b>推进三轮对话，在第 3 轮之前试试那把剪刀</b> —— 看看删掉 list 里的历史后，模型还"记得"你吗。</>}
      >
        <MemDemo />
      </Lsec>

      <Lsec title="⚠️ 常见误区">
        <div className="card alert-card row-list">
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">调 API 就等于把我的数据送去训练模型了</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">主流厂商的 API 数据默认不用于训练 —— 但各家政策不同，务必读数据条款</span></div>
            </div>
            <p className="why"><b>病因：</b>把"免费聊天产品"和"API"混为一谈。面向消费者的免费产品，有的确实会用对话改进模型（通常可关闭）；而 API 走的是商用条款，主流厂商默认不拿请求数据训练。涉及公司机密或用户隐私时，别靠印象 —— 打开数据政策逐条核对，必要时签企业协议。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">代码在我电脑上跑，所以模型也在我电脑上跑</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">推理发生在云端 GPU 集群，你的 30 行代码只是发了一个 HTTP 请求</span></div>
            </div>
            <p className="why"><b>病因：</b>回复打印在自己的终端里，造成"计算就在本地"的错觉。其实你的代码是"点菜"，做菜的是厂商机房里成排的 GPU —— 这也是断网就用不了、每次调用都花钱的原因。想让模型真正在自己电脑上跑？这正是下一课的主题。</p>
          </div>
        </div>
      </Lsec>

      <Lsec
        title="✍️ 小练习"
        lead="三个改造方向，每个都只动一两行代码 —— 但各自回收一节前面的课。"
      >
        <div className="card quiz row-list">
          <QuizItem q='1. 把 chat.py 第 11 行的 system 内容改成"毒舌影评人"，再聊几句电影。观察什么变了、什么没变？'>
            比如改成 <b>"你是一位毒舌影评人，嘴狠但在理，拒绝商业互吹。"</b> 你会发现整场对话的人设、语气全变了，而你每轮的提问方式完全不用改 —— 这就是 system 作为"人物小传"的威力（第 16 课）：写一次，管全场，不必每轮重复。
          </QuizItem>
          <QuizItem q="2. 在 create() 里加 temperature 参数，分别用 0.2 和 1.2，把同一个问题各问 5 次。预测一下两组答案的差别？">
            <b>低温（0.2）：5 次答案几乎一模一样</b>，稳定、保守，适合查事实、写代码；<b>高温（1.2）：5 次五花八门</b>，适合头脑风暴。原理是第 14 课的采样温度 —— 温度只改变"抽签"的胆量。注意各家参数取值范围和默认值略有差异，以文档为准。
          </QuizItem>
          <QuizItem q="3. 在发送前加一行 messages = [messages[0], messages[-1]]（只留 system 和你最新一句），它会怎样？">
            它会<b>当场"失忆"</b>：之前聊过的名字、话题全部不认账 —— 因为对模型来说，没被发来的消息从未存在过。这验证了第 17 课：模型无状态，"记忆"全在你代码的 list 里。顺带这也是最朴素的省 token 手段；正经做法叫"上下文管理"：保留 system + 摘要 + 最近几轮。
          </QuizItem>
        </div>
      </Lsec>
    </>
  )
}
