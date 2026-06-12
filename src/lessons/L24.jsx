import { useState } from 'react'
import { Lsec, Pill, FlipCard, QuizItem } from '../components/ui.jsx'

// ============================================================
// 蜘蛛网 vs 总线连线演示
// ============================================================
const APPS = ['聊天应用', 'IDE 助手', 'Agent 产品', '办公插件']
const TOOLS = ['文件系统', '数据库', '浏览器', 'GitHub', '日历']
const EXTRA = '搜索引擎'

function spread(n, top, bottom) {
  const ys = []
  for (let i = 0; i < n; i++) ys.push(n === 1 ? (top + bottom) / 2 : top + (i * (bottom - top)) / (n - 1))
  return ys
}

function EcoNode({ x, cy, w, label, fill, stroke, type, idx, sel, onSel }) {
  const isSel = sel && sel.type === type && (type === 'bus' || sel.idx === idx)
  return (
    <g className={`eco-node${isSel ? ' sel' : ''}`} onClick={(e) => { e.stopPropagation(); onSel({ type, idx }) }}>
      <rect x={x} y={cy - 15} width={w} height="30" rx="8" fill={fill} stroke={stroke} />
      <text x={x + w / 2} y={cy + 4.5} textAnchor="middle" fontSize="12.5" fontWeight="600" fill="var(--fg-0)">{label}</text>
    </g>
  )
}

function EcoDemo() {
  const [mode, setMode] = useState('mess')
  const [extra, setExtra] = useState(false)
  const [sel, setSel] = useState(null)

  const tools = extra ? [...TOOLS, EXTRA] : TOOLS
  const N = APPS.length
  const M = tools.length
  const aY = spread(N, 50, 312)
  const tY = spread(M, 50, 312)

  const wireCls = (a, t) => {
    let hot = false
    if (sel) {
      if (sel.type === 'bus') hot = true
      else if (sel.type === 'app') hot = a === sel.idx
      else if (sel.type === 'tool') hot = t === sel.idx
    }
    return `wire${hot ? ' hot' : ''}${sel && !hot ? ' dimmed' : ''}`
  }

  // 右侧文案
  let title, formula, desc
  if (mode === 'mess') {
    title = '没有标准：蜘蛛网'
    formula = <>{N} 个应用 × {M} 个工具 = <b>{N * M}</b> 条专线{extra ? `（新工具 +${N} 条）` : ''}</>
  } else {
    title = '有了 MCP：总线'
    formula = <>{N} 个应用 + {M} 个工具 = <b>{N + M}</b> 条接入{extra ? '（新工具 +1 条）' : ''}</>
  }
  if (!sel || sel.type === 'bus') {
    if (sel && sel.type === 'bus') desc = 'MCP 总线本身不含任何模型 —— 它只是一份“怎么对话”的协议，像 USB-C 插口不发电，却让所有设备互通。'
    else if (mode === 'mess') desc = '每家应用为每个工具单独写接入代码：连线 = 应用数 × 工具数。点击任意节点，看它背着多少条专线。'
    else desc = '中间是 MCP 总线：工具方写一次 server、应用方接一次 client，即插即用 —— 连线 = 应用数 + 工具数。'
  } else if (sel.type === 'app') {
    const name = APPS[sel.idx]
    desc = mode === 'mess'
      ? `「${name}」要用 ${M} 个工具，就得写 ${M} 套接入代码；任何一个工具升级，这些代码都可能要跟着改。`
      : `「${name}」只接 1 条线（实现一次 MCP client），就能即插即用全部 ${M} 个工具。`
  } else {
    const name = tools[sel.idx]
    const isNew = extra && sel.idx === TOOLS.length
    if (isNew) {
      desc = mode === 'mess'
        ? `新工具「${name}」上线：${N} 家应用每家都得再写一套接入 —— 蜘蛛网一下子多了 ${N} 条线。`
        : `新工具「${name}」上线：工具方写 1 个 MCP server 挂上总线，${N} 个应用立刻全部可用 —— 只多 1 条线。`
    } else {
      desc = mode === 'mess'
        ? `「${name}」要服务 ${N} 个应用，就要被接入 ${N} 次 —— 每家一套，谁来维护？`
        : `「${name}」方只写了 1 个 MCP server，${N} 个应用全部即插即用。`
    }
  }

  const toggleExtra = () => {
    const ne = !extra
    setExtra(ne)
    setSel(ne ? { type: 'tool', idx: TOOLS.length } : null)
  }

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · 集成数量大对比</span>
        <span className="demo-hint">切换模式 · 点击节点高亮连线</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="eco-svg" viewBox="0 0 460 352" width="430" aria-label="AI 应用与工具的连线对比图：没有标准时两两连线，有了 MCP 总线后只需 N+M 条" onClick={() => setSel(null)}>
            <text x="80" y="18" textAnchor="middle" fontSize="11.5" fill="var(--fg-2)">AI 应用 × {N}</text>
            <text x="380" y="18" textAnchor="middle" fontSize="11.5" fill="var(--fg-2)">工具 / 数据源 × {M}</text>
            {/* 连线 */}
            {mode === 'mess'
              ? APPS.flatMap((_, a) => tools.map((__, t) => (
                  <line key={`${a}-${t}`} className={wireCls(a, t)} x1="134" y1={aY[a]} x2="326" y2={tY[t]} />
                )))
              : [
                  ...APPS.map((_, a) => <line key={`a${a}`} className={wireCls(a, null)} x1="134" y1={aY[a]} x2="216" y2={aY[a]} />),
                  ...tools.map((_, t) => <line key={`t${t}`} className={wireCls(null, t)} x1="244" y1={tY[t]} x2="326" y2={tY[t]} />),
                ]}
            {/* MCP 总线 */}
            {mode === 'mcp' && (
              <g className={`eco-node${sel && sel.type === 'bus' ? ' sel' : ''}`} onClick={(e) => { e.stopPropagation(); setSel({ type: 'bus', idx: 0 }) }}>
                <rect x="216" y="34" width="28" height="293" rx="14" fill="var(--sage-bg)" stroke="var(--sage)" />
                {['M', 'C', 'P'].map((c, i) => <text key={c} x="230" y={166 + i * 18} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--fg-0)">{c}</text>)}
              </g>
            )}
            {/* 节点 */}
            {APPS.map((label, a) => <EcoNode key={`app${a}`} x={26} cy={aY[a]} w={108} label={label} fill="var(--sky-bg)" stroke="var(--sky)" type="app" idx={a} sel={sel} onSel={setSel} />)}
            {tools.map((label, t) => <EcoNode key={`tool${t}`} x={326} cy={tY[t]} w={108} label={label} fill="var(--amber-bg)" stroke="var(--amber)" type="tool" idx={t} sel={sel} onSel={setSel} />)}
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            {[['mess', '没有标准'], ['mcp', '有了 MCP']].map(([k, label]) => (
              <button key={k} className={`chip${k === mode ? ' active' : ''}`} onClick={() => { setMode(k); setSel(null) }}>{label}</button>
            ))}
          </div>
          <h4>{title}</h4>
          <div className="period" id="mcp-formula">{formula}</div>
          <p>{desc}</p>
          <div className="chips mt14">
            <button className={`chip${extra ? ' active' : ''}`} onClick={toggleExtra}>{extra ? '－ 下线这个新工具（搜索引擎）' : '＋ 上线一个新工具（搜索引擎）'}</button>
          </div>
          <p className="footnote mt14">提示：再点一次可以下线新工具；点击空白处取消高亮。</p>
        </div>
      </div>
    </div>
  )
}

const FLIPS = [
  { q: '各家大模型的官方 API（按 token 计费的那个接口）', pill: { type: 'terracotta', text: '模型层' }, why: '智能的源头。第 26 课你将第一次直接调用它 —— 没有这层，上面三层全是空架子。' },
  { q: 'ChatGPT 网页版', pill: { type: 'sky', text: '应用层' }, why: '注意区分：ChatGPT 是包装好的产品，背后的 GPT 模型 API 才在模型层 —— 一字之差，隔了三层。' },
  { q: 'LangChain（把“检索→拼提示→调模型”串成流水线的库）', pill: { type: 'amber', text: '框架层' }, why: '编排框架：帮开发者少写样板代码的脚手架，最终用户看不见它。' },
  { q: 'GitHub 官方提供的 MCP server', pill: { type: 'sage', text: '协议层（工具方）' }, why: '工具方按 MCP 协议把能力挂出来 —— 写一次，所有支持 MCP 的应用即插即用。' },
  { q: 'Cursor（IDE 里的 AI 编程助手）', pill: { type: 'sky', text: '应用层' }, why: '你直接使用的产品都在应用层。它同时也是 MCP 里的 Host —— 可以装各种 server 来扩展能力。' },
  { q: 'Anthropic / OpenAI 的官方 Python SDK', pill: { type: 'amber', text: '框架层' }, why: 'SDK 把 HTTP 请求包装成几行代码，是通往模型层的便桥 —— 第 26 课会用到。' },
]

export default function L24() {
  return (
    <>
      <Lsec title="🎯 你将学会">
        <div className="card goals">
          <div className="goal-item"><span className="tick">✓</span>看出第 19 课留下的尾巴：模型会“开申请单”了，但每个应用接每个工具仍要单独写胶水代码 —— N 个应用 × M 个工具 = N×M 套集成，乘法让生态长不大</div>
          <div className="goal-item"><span className="tick">✓</span>一句话说清 MCP：AI 应用与外部世界之间的统一插口（比喻 USB-C）—— 工具方按协议写一次 MCP server，所有支持 MCP 的应用即插即用，乘法变加法</div>
          <div className="goal-item"><span className="tick">✓</span>分清 MCP 的三种能力（Tools / Resources / Prompts）和三个角色（Host / Client / Server），用人话说出各自是谁</div>
          <div className="goal-item"><span className="tick">✓</span>在“模型层 → 框架层 → 协议层 → 应用层”的生态地图上定位自己：第 26-28 课动手主要打交道的是模型层 API，用现成 MCP server 是低代码扩展能力的捷径</div>
        </div>
      </Lsec>

      <Lsec
        title="💡 核心概念：插口统一之前，每台设备自带一套线"
        lead="接着第 19 课往下说。那一课的结论是：模型只开“申请单”，真正执行工具的是宿主程序。但有个问题当时按下没表 —— 宿主和每个工具之间的对接代码，谁来写？查天气要对接天气 API、读文件要对接文件系统、连仓库要对接 GitHub……在没有标准的年代，每个应用团队都得为每个工具单独写一套“胶水代码”。数一数账就知道这条路走不远："
      >
        <div className="contrast">
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-ink">没有标准</span></div>
            <div className="big">N 个应用 × M 个工具 = <span className="gap">N×M</span> 套胶水代码</div>
            <p className="note">每对组合单独接：4 个应用 × 5 个工具就是 20 套。工具一升级，所有应用跟着改；新应用入场，所有工具重接一遍 —— 谁都不堪重负，生态没法长大。</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">有了统一插口</span></div>
            <div className="big">各自只接一次 = <span className="hl">N+M</span> 次接入</div>
            <p className="note">工具方写一次 server、应用方接一次 client：4+5=9。新工具上线只加 1，所有应用立刻可用 —— 增长从乘法变加法，生态才滚得起来。</p>
          </div>
        </div>
        <p className="lead mt14">这就是 <b>MCP（Model Context Protocol，模型上下文协议）</b>要解决的问题：2024 年底由 Anthropic 开源，2025 年起 OpenAI、Google 等主流玩家相继跟进，如今已是行业事实标准之一。它做的事一句话 —— <b>在 AI 应用与外部世界之间，定义一个统一插口。</b></p>
        <div className="example">
          <div className="en">MCP 之于 AI 应用，就像 <span className="hl">USB-C</span> 之于电子设备</div>
          <div className="zh">插口统一之前，每台设备配专属充电器和数据线；统一之后，设备方和配件方各自适配一次 USB-C，互相即插即用。MCP 同理：工具方按协议写一次 MCP server，所有支持 MCP 的应用都能直接用 —— 不需要认识彼此，只需要认识插口。</div>
        </div>
      </Lsec>

      <Lsec
        title="📖 拆开一个 MCP server：三种能力，三个角色"
        lead="统一插口里到底流过什么？MCP 规定 server 可以向应用提供三类东西 —— 第一类你其实已经认识了："
      >
        <div className="use-grid">
          <div className="card use-card"><div className="label">能力一 · 可调用的动作</div><div className="en">Tools <b>工具</b></div><div className="zh">发消息、查数据库、跑代码。就是第 19 课 function calling 那一套 —— 模型开申请单、宿主执行；只是工具现在长在 server 里，按统一格式自我介绍。</div></div>
          <div className="card use-card"><div className="label">能力二 · 可读取的数据</div><div className="en">Resources <b>资源</b></div><div className="zh">文档、表格、日志等数据/文件。应用把它拉进上下文（第 17 课的书桌）供模型阅读 —— 读数据不必再伪装成“调一次工具”。</div></div>
          <div className="card use-card"><div className="label">能力三 · 预置的问法</div><div className="en">Prompts <b>提示模板</b></div><div className="zh">工具方最懂“怎么问自家工具效果最好”（第 16 课的手艺），干脆把成熟问法打包成模板挂出来，用户即选即用。</div></div>
        </div>
        <p className="lead mt14">再认三个角色 —— 文档和新闻里高频出现，人话一句话就够：</p>
        <div className="card">
          <table className="match">
            <thead><tr><th>角色</th><th>人话：它是谁</th><th>例子</th></tr></thead>
            <tbody>
              <tr><td className="be">Host 宿主</td><td>你正在用的那个 AI 应用本体 —— 决定接哪些 server、放行哪些操作。第 19 课里“签字执行”的就是它</td><td className="ex">Claude Desktop、IDE 助手、Chat 产品</td></tr>
              <tr><td className="be">Client 客户端</td><td>Host 体内的“连接器”，专职和某一个 server 通话，一对一配对 —— 用户全程感觉不到它的存在</td><td className="ex">应用内置的 MCP 连接模块</td></tr>
              <tr><td className="be">Server 服务器</td><td>工具方写的“提供方”：把工具/数据/模板按协议包装好挂出来，跑在本地或远程都行</td><td className="ex">文件系统 server、GitHub server、数据库 server</td></tr>
            </tbody>
          </table>
        </div>
      </Lsec>

      <Lsec
        title="📖 生态全景：四层地图，找到你的位置"
        lead="把镜头拉远。MCP 只是 AI 工程生态里的一层 —— 从模型到你手里的产品，中间隔着清晰的四层分工。从地基往上看："
      >
        <div className="use-grid cols-4">
          <div className="card use-card"><div className="label"><Pill type="terracotta">第 1 层</Pill></div><div className="en">模型<b>层</b></div><div className="zh">各家大模型 API：GPT、Claude、Gemini、DeepSeek……智能的源头，按 token 计费（第 11 课），上面三层全建在它之上。</div></div>
          <div className="card use-card"><div className="label"><Pill type="amber">第 2 层</Pill></div><div className="en">框架<b>层</b></div><div className="zh">官方 SDK、LangChain 等编排框架 —— 把“调模型”包装成几行代码，帮开发者少写样板，用户看不见它。</div></div>
          <div className="card use-card"><div className="label"><Pill type="sage">第 3 层</Pill></div><div className="en">协议<b>层</b></div><div className="zh">MCP 等标准 —— 规定应用与工具/数据怎么对话。本课主角住在这层：它不是软件包，是一份“接口说明书”。</div></div>
          <div className="card use-card"><div className="label"><Pill type="sky">第 4 层</Pill></div><div className="en">应用<b>层</b></div><div className="zh">IDE 助手、Chat 产品、Agent 产品 —— 所有下层能力最终在这里见到用户，也是 MCP 的 Host 所在。</div></div>
        </div>
        <p className="lead mt14">给你定位两句话：<b>第 26-28 课动手时，你主要打交道的是模型层 API</b>（申请 key、发请求、读响应）；而想给手边的 AI 应用快速加能力 —— 查 GitHub、连数据库、读本地文件 —— <b>用现成的 MCP server 是低代码捷径</b>：社区已有大量现成 server（清单以官方目录为准），装上即用，一行胶水代码都不用写。</p>
        <p className="lead mt14">练练眼力：下面 6 个东西各属于哪一层？先自己判断，再点卡片揭晓。</p>
        <div className="flip-grid">
          {FLIPS.map((f, i) => <FlipCard key={i} q={f.q} pill={f.pill} why={f.why} />)}
        </div>
      </Lsec>

      <Lsec
        title="🎛️ 交互演示：数一数，蜘蛛网 vs 总线"
        lead="把核心概念那笔账画出来。左边 4 个 AI 应用，右边 5 个工具/数据源 —— 切换两种世界，点击任意节点看它背着多少条线；再试试“上线一个新工具”，感受乘法和加法的差距。"
      >
        <EcoDemo />
      </Lsec>

      <Lsec title="⚠️ 常见误区">
        <div className="card alert-card row-list">
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">MCP 是 Anthropic 发布的一个新模型</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">MCP 是协议（接口标准），里面不含任何模型 —— 它规定“怎么对话”，不负责“谁来思考”</span></div>
            </div>
            <p className="why"><b>病因：</b>名字里带 Model 二字，新闻又常把它和模型发布混在一起报道。判断方法回到比喻：USB-C 插口本身不发电、不存数据，只是让设备互通；MCP 同理 —— 换用任何支持它的模型或应用，协议本身一个字都不用改。它属于生态地图的协议层，而模型住在模型层。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">接了 MCP，AI 就能随便动我的电脑</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">AI 能做什么，由 server 暴露什么、host 授权什么共同决定 —— 权限始终在用户手里</span></div>
            </div>
            <p className="why"><b>病因：</b>把“接口打通”误当“权限全开”。回忆第 19 课的安全边界：模型只开申请单，执行前有宿主把关 —— MCP 没有改变这一点。server 只暴露被允许的目录和动作，host 对危险操作仍要弹窗让你确认，两道闸缺一不可。真正要警惕的是装来路不明的 server —— 就像别把捡来的 U 盘往电脑上插。</p>
          </div>
        </div>
      </Lsec>

      <Lsec title="✍️ 小练习">
        <div className="card quiz row-list">
          <QuizItem q="1. 公司里有 10 个 AI 应用，市面上有 8 个常用工具。没有标准时要写多少套集成？全走 MCP 呢？第 9 个工具上线时，两种世界各要做什么？">
            没有标准：10 × 8 = <b>80 套</b>胶水代码；全走 MCP：10 + 8 = <b>18 次接入</b>（应用方、工具方各接一次插口）。第 9 个工具上线：没有标准 → 10 个应用每家再写一套（+10）；MCP → 工具方写 1 个 server（+1），所有应用立刻可用。<b>增长从乘法变加法</b> —— 这就是“生态才能长大”的数学原因。
          </QuizItem>
          <QuizItem q="2. 把三样东西归入 Tools / Resources / Prompts：①“把这条消息发到团队群” ②“本季度销售数据表的内容” ③“一键生成周报的提问模板”。再答：你在 Claude Desktop 里装了一个日历 server，Host / Client / Server 各是谁？">
            ① <b>Tools</b>（可调用的动作，会改变外部世界）② <b>Resources</b>（可读取的数据，拉进上下文供模型阅读）③ <b>Prompts</b>（预置的提示模板，即选即用）。角色：<b>Host</b> = Claude Desktop（应用本体，决定授权）；<b>Client</b> = 它体内与日历 server 通话的连接器；<b>Server</b> = 日历方提供的那个小程序。
          </QuizItem>
          <QuizItem q="3. 朋友装了一个文件系统 MCP server 之后慌了：“AI 现在能删我整个硬盘了！”用本课和第 19 课的知识，给他三句安抚和一句提醒。">
            三句安抚：① <b>server 只暴露被配置的东西</b> —— 文件 server 通常只授权指定文件夹，不是整个硬盘；② <b>host 还有一道闸</b> —— 删除这类危险操作要人工确认，这是第 19 课的铁律；③ <b>模型从不亲手执行</b> —— 它只开申请单，最后签字的是宿主和你。一句提醒：这一切的前提是 server 本身可信 —— <b>别装来路不明的 server</b>，如同别乱插捡来的 U 盘。
          </QuizItem>
        </div>
      </Lsec>
    </>
  )
}
