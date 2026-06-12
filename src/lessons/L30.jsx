import { useState, useRef, useLayoutEffect } from 'react'
import { Lsec, Pill, QuizItem } from '../components/ui.jsx'

// ============================================================
// 交互演示一：三十课登山图
// ============================================================
const TRAIL_D = 'M150,525 Q280,538 340,448 Q255,420 150,365 Q235,332 340,285 Q255,252 150,200 Q240,162 330,115 Q362,96 370,62'
const NODES = [
  { i: 0, cx: 150, cy: 525, anchor: 'end',   lx: 124, label: '直觉篇 · 1–5',   k1: '三个圈 · 喂数据 · 神经元', k2: '梯度下山 · 过拟合' },
  { i: 1, cx: 340, cy: 448, anchor: 'start', lx: 366, label: '原理篇 · 6–10',  k1: '反向传播 · CNN · 词向量', k2: '注意力 · Transformer' },
  { i: 2, cx: 150, cy: 365, anchor: 'end',   lx: 124, label: '大模型篇 · 11–15', k1: 'Token · 预训练 · RLHF', k2: '温度采样 · Scaling Laws' },
  { i: 3, cx: 340, cy: 285, anchor: 'start', lx: 366, label: '应用篇 · 16–20', k1: '提示词 · 上下文 · RAG', k2: '工具调用 · Agent' },
  { i: 4, cx: 150, cy: 200, anchor: 'end',   lx: 124, label: '前沿篇 · 21–25', k1: '扩散模型 · 多模态 · 推理', k2: 'MCP · 开源版图' },
  { i: 5, cx: 330, cy: 115, anchor: 'start', lx: 356, label: '实战篇 · 26–30', k1: 'API · 本地模型 · RAG', k2: '评估安全 · 学习地图' },
]
const STAGES = [
  { title: '第一阶段 · 直觉篇', period: '第 1–5 课 · 不写代码、不碰公式',
    desc: '你在这一站学会了：AI ⊃ 机器学习 ⊃ 深度学习的三圈关系（1），"从数据找规则"这一根本转变（2）；亲手拨过一个神经元的权重（3），看懂训练就是在损失地形上摸索下山（4），还认识了过拟合 —— AI"背答案"的噩梦（5）。',
    tags: ['三个圈', '喂数据', '神经元', '梯度下山', '过拟合'] },
  { title: '第二阶段 · 原理篇', period: '第 6–10 课 · 深度学习四大基石',
    desc: '多层网络靠反向传播把错误一层层"追责"回去（6）；CNN 用滑动小窗看懂图像（7）；词语变成向量、住进语义空间（8）；注意力让每个词环顾四周（9）—— 最后这一切被组装成 Transformer 流水线（10）。',
    tags: ['反向传播', 'CNN', 'Embedding', '注意力', 'Transformer'] },
  { title: '第三阶段 · 大模型篇', period: '第 11–15 课 · LLM 的诞生全程',
    desc: '大模型眼里只有 token（11）；九成能力来自"预测下一个词"的万亿次接龙（12）；SFT 和 RLHF 把接龙机器调教出"人样"（13）；温度旋钮控制严谨与放飞（14）；Scaling Laws 解释了"大力出奇迹"（15）。',
    tags: ['Token', '预训练', 'RLHF', '温度采样', 'Scaling Laws'] },
  { title: '第四阶段 · 应用篇', period: '第 16–20 课 · 应用层技术栈',
    desc: '提示词是有原理的工程而非玄学（16）；上下文窗口是 AI 唯一的工作记忆（17）；RAG 给它外挂知识库（18）；Function Calling 让它长出双手（19）；装上"感知—规划—行动"的循环，它就成了 Agent（20）。',
    tags: ['提示工程', '上下文', 'RAG', '工具调用', 'Agent'] },
  { title: '第五阶段 · 前沿篇', period: '第 21–25 课 · 看懂新闻里的热词',
    desc: '扩散模型从纯噪点里一步步"擦"出一幅画（21）；多模态把图像声音也变成 token（22）；推理模型先打草稿再回答（23）；MCP 是 AI 应用的"USB 接口"（24）；开源闭源版图教你按需选型（25）。',
    tags: ['扩散模型', '多模态', '推理模型', 'MCP', '开源 / 闭源'] },
  { title: '第六阶段 · 实战篇', period: '第 26–30 课 · 从学习者到构建者',
    desc: '你用 30 行代码调通了第一个 API（26），在自己电脑上跑起开源模型（27），把 RAG 流程图写成真代码（28），懂得了上线前的体检与红线（29）—— 现在你正站在第 30 课，山顶就在眼前。',
    tags: ['API 调用', 'Ollama', 'RAG 实战', '评估与安全'] },
  { title: '🏁 构建者', period: '三十课 · 一条完整走通的路',
    desc: '六个阶段、三十课、几个亲手跑通的程序 —— 你已经不是 AI 新闻的围观者了。从这面旗帜开始，任何新名词出现，你都能把它放进地图的某一格：它动的是架构、训练方法，还是应用层的包装？这就是"地图"的全部意义。',
    tags: ['动手 > 围观', '构建 > 收藏'] },
]

function MountainMap() {
  const [sel, setSel] = useState(6)
  const baseRef = useRef(null)
  const [trail, setTrail] = useState({ total: 0, lenAt: [] })

  useLayoutEffect(() => {
    const base = baseRef.current
    if (!base) return
    const total = base.getTotalLength()
    const lenAt = NODES.map((n) => {
      let best = 0, bd = Infinity
      for (let s = 0; s <= 600; s++) {
        const l = (total * s) / 600
        const p = base.getPointAtLength(l)
        const d = (p.x - n.cx) ** 2 + (p.y - n.cy) ** 2
        if (d < bd) { bd = d; best = l }
      }
      return best
    })
    lenAt.push(total)
    setTrail({ total, lenAt })
  }, [])

  const { total, lenAt } = trail
  const offset = total ? total - (lenAt[sel] ?? total) : 0
  const d = STAGES[sel]

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · 从神经元到构建者</span>
        <span className="demo-hint">点击山路上的里程碑或下方按钮</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="map" viewBox="0 0 480 580" width="400" aria-label="六个阶段的里程碑串成一条上山的路，山顶插着写有构建者的旗帜">
            <path ref={baseRef} id="trail-base" d={TRAIL_D} fill="none" stroke="var(--fg-2)" strokeOpacity="0.35" strokeWidth="3" strokeDasharray="1 8" strokeLinecap="round" />
            <path id="trail-progress" d={TRAIL_D} fill="none" stroke="var(--sage)" strokeWidth="4" strokeLinecap="round"
              style={{ strokeDasharray: total ? `${total} ${total}` : undefined, strokeDashoffset: offset }} />

            <g id="summit" className={sel === 6 ? 'active' : undefined} onClick={() => setSel(6)}>
              <circle className="hit" cx="385" cy="44" r="42" fill="transparent" />
              <circle cx="370" cy="62" r="5.5" fill="var(--fg-2)" />
              <line className="pole" x1="370" y1="60" x2="370" y2="18" strokeWidth="2" />
              <rect x="370" y="14" width="58" height="22" rx="3" fill="var(--terracotta)" />
              <text x="399" y="29.5" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--bg-0)">构建者</text>
            </g>

            {NODES.map((n) => {
              const done = sel === 6 ? true : n.i < sel
              const active = n.i === sel
              const todo = sel !== 6 && n.i > sel
              const cls = `map-node${done ? ' done' : ''}${active ? ' active' : ''}${todo ? ' todo' : ''}`
              return (
                <g key={n.i} className={cls} onClick={() => setSel(n.i)}>
                  <circle className="hit" cx={n.cx} cy={n.cy} r="30" />
                  <circle className="c" cx={n.cx} cy={n.cy} r="15" />
                  <text className="num" x={n.cx} y={n.cy + 4.5} textAnchor="middle" fontSize="13">{n.i + 1}</text>
                  <text className="lbl" x={n.lx} y={n.cy - 6} textAnchor={n.anchor} fontSize="12.5" fill="var(--fg-0)">{n.label}</text>
                  <text className="kws" x={n.lx} y={n.cy + 9} textAnchor={n.anchor} fontSize="9.5" fill="var(--fg-2)">{n.k1}</text>
                  <text className="kws" x={n.lx} y={n.cy + 22} textAnchor={n.anchor} fontSize="9.5" fill="var(--fg-2)">{n.k2}</text>
                </g>
              )
            })}
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            {['直觉', '原理', '大模型', '应用', '前沿', '实战', '🏁 山顶'].map((label, i) => (
              <button key={i} className={`chip${sel === i ? ' active' : ''}`} onClick={() => setSel(i)}>{label}</button>
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
// 交互演示二：四条进阶路线
// ============================================================
const ROUTES = [
  { key: 'research', chip: '我爱刨根问底', label: '研究路线 · Researcher', en: <>🔬 想弄懂<b>为什么有效</b></>,
    acts: ['补数学到"看懂论文符号"为止：线性代数 + 概率统计，不必刷题', '跟 Karpathy 的《Neural Networks: Zero to Hero》视频，亲手从零实现一遍反向传播（对照第 4、6 课）', '开始读经典论文：就从下面书单第一篇读起，先摘要后看图'] },
  { key: 'build', chip: '我想做出东西', label: '工程路线 · Builder', en: <>🛠️ 想做出<b>能跑的东西</b></>,
    acts: ['把 26–28 课的作业合并成一个完整项目：界面、错误处理、日志，一个都不能省', '学评测与部署：用第 29 课的方法给自己的应用建一套评测集，再把它放上服务器', '跟进框架与 MCP 生态（第 24 课），让应用接上真实世界的工具'] },
  { key: 'product', chip: '我想解决业务问题', label: '产品路线 · Product', en: <>📦 想用 AI <b>解决真问题</b></>,
    acts: ['找一个身边的真实场景 —— 客服、内容生产、内部流程 —— 两周内做出能演示的 MVP', '练习在 PRD 里写清"AI 能做什么 / 不能做什么"：边界感是 AI 产品人最稀缺的能力', '用第 29 课的评估思路，把"好用"定义成可测量的指标'] },
  { key: 'watch', chip: '我只想看懂不被忽悠', label: '观察者路线 · Observer', en: <>🔭 想持续<b>看懂、不被忽悠</b></>,
    acts: ['建立可靠信源：各家官方博客、论文速递、高质量技术社区，每周固定扫一遍', '用第 23、25 课的眼光过滤噪音：先问"它落在地图哪一格？改进的是哪一层？"', '每月把一个新名词讲给完全不懂的朋友 —— 讲不清楚，就回地图补那一课'] },
]
const HINTS = {
  research: <><b>研究路线</b>：本周行动 —— 打开 Karpathy 的《Zero to Hero》第一集，跟着亲手写完一个反向传播。</>,
  build: <><b>工程路线</b>：本周行动 —— 把 26 课的 30 行代码升级成带错误处理和对话记忆的"像样"项目。</>,
  product: <><b>产品路线</b>：本周行动 —— 列出工作里最烦的三个重复环节，挑一个画出 MVP 草图。</>,
  watch: <><b>观察者路线</b>：本周行动 —— 收藏三个可靠信源，取关三个只会喊"炸裂"的标题党。</>,
}

function RouteDemo() {
  const [picked, setPicked] = useState(null)
  return (
    <>
      <div className="chips" id="route-chips" style={{ marginBottom: 14 }}>
        {ROUTES.map((r) => (
          <button key={r.key} className={`chip${picked === r.key ? ' active' : ''}`} onClick={() => setPicked(r.key)}>{r.chip}</button>
        ))}
      </div>
      <div className="use-grid cols-2" id="routes">
        {ROUTES.map((r) => {
          const cls = `card use-card${picked === r.key ? ' lit' : ''}${picked && picked !== r.key ? ' dim' : ''}`
          return (
            <div key={r.key} className={cls} onClick={() => setPicked(r.key)}>
              <div className="label">{r.label}</div>
              <div className="en">{r.en}</div>
              <ul className="acts">{r.acts.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </div>
          )
        })}
      </div>
      <p id="route-hint">{picked ? HINTS[picked] : '点一条路线看看 —— 没有标准答案，而且路线随时可以换。'}</p>
    </>
  )
}

const PAPERS = [
  { en: 'Attention Is All You Need', year: '（2017）', tag: '第 9–10 课', zh: '它回答了：不用循环网络、只靠注意力，能不能搭出更强的语言模型？答案叫 Transformer —— 你学过的第 9、10 课就是它的"人话版"。' },
  { en: 'Scaling Laws for Neural Language Models', year: '（2020）', tag: '第 15 课', zh: '它回答了：把模型做大到底值不值？性能随参数、数据、算力按什么规律增长？"大力出奇迹"从玄学变成了可预测的工程。' },
  { en: 'Language Models are Few-Shot Learners', year: '（GPT-3，2020）', tag: '第 12 · 16 课', zh: '它回答了：模型足够大之后，能不能不再微调、只在提示里给几个例子就学会新任务？提示工程的时代由此开始。' },
  { en: 'Training LMs to Follow Instructions', year: '（InstructGPT，2022）', tag: '第 13 课', zh: '它回答了：怎么把"只会接龙"的 GPT-3 调教成"听得懂人话"的助手？SFT + RLHF 的成名作，ChatGPT 的直系前身。' },
  { en: 'Chain-of-Thought Prompting', year: '（2022）', tag: '第 16 · 23 课', zh: '它回答了：为什么让模型"一步一步想"，它就能解出原本不会的题？推理模型这条线的起点。' },
]
const PROJECTS = [
  { n: '①', html: <><b>性格化聊天 CLI</b>（基于 26 课）—— 给 30 行代码加上系统提示词和对话记忆，做一个有脾气的命令行伙伴。一个周末足够。</> },
  { n: '②', html: <><b>本地模型 + 语音的家庭助手</b>（基于 27 课）—— 用 Ollama 跑本地模型，接上语音转文字，全程不联网、不花钱。</> },
  { n: '③', html: <><b>个人笔记 RAG 问答</b>（基于 28 课）—— 把代码对准你自己的笔记库，反复调切块和检索，直到"真的好用" —— 这一步比想象中难。</> },
  { n: '④', html: <><b>带工具的周报 Agent</b>（基于 19、20 课）—— 让它自己读 git 提交记录、查日历，每周五自动生成周报草稿。</> },
  { n: '⑤', html: <><b>给开源 MCP server 提一个 PR</b>（基于 24 课）—— 修一个 bug 或加一个小工具。生态不是用来围观的，merge 的那一刻你就是贡献者。</> },
]

export default function L30() {
  return (
    <>
      <Lsec title="🎯 你将学会">
        <div className="card goals">
          <div className="goal-item"><span className="tick">✓</span>用一张知识地图复盘 30 课：每个概念落在哪一格、彼此怎么连成一条路</div>
          <div className="goal-item"><span className="tick">✓</span>从研究 / 工程 / 产品 / 观察者四条路线里选定下一步，拿到具体行动清单</div>
          <div className="goal-item"><span className="tick">✓</span>掌握读 AI 论文的正确姿势：先摘要、后看图 —— 外加五篇经典按图索骥</div>
          <div className="goal-item"><span className="tick">✓</span>带走五个由易到难的动手项目，从性格化 CLI 到给开源项目提 PR</div>
        </div>
      </Lsec>

      <Lsec
        title="💡 核心概念：三十课，其实是一条路"
        lead="回头看，这门课从头到尾只讲了一个故事 —— 一个只会加权打分的小零件，如何一步步长成会替你干活的智能体。先对比一下出发前和现在的你。"
      >
        <div className="contrast">
          <div className="card contrast-card">
            <div className="tag">第 1 课的你</div>
            <div className="big">每个 AI 名词都是<span className="gap">噪音</span></div>
            <div className="note">Transformer、RAG、RLHF、Agent……听起来全是别人世界的黑话，新闻越刷越焦虑。</div>
          </div>
          <div className="card contrast-card">
            <div className="tag">第 30 课的你</div>
            <div className="big">每个名词都落在<span className="hl">地图的某一格</span></div>
            <div className="note">新模型发布，你会先问：变的是架构、训练方法，还是应用层的包装？—— 这就是地图给你的底气。</div>
          </div>
        </div>
        <div className="card card-pad" style={{ marginTop: 14 }}>
          <p className="recap">从一个会打分的<b>神经元</b><span className="ln">（3）</span>出发，学会<b>下山式自我纠错</b><span className="ln">（4）</span>；让词语彼此<b>注意</b><span className="ln">（9）</span>，再组装成 <b>Transformer</b><span className="ln">（10）</span>；用整个互联网玩<b>文字接龙</b><span className="ln">（12）</span>，又被<b>对齐调教</b>出人样<span className="ln">（13）</span>；你学会与它<b>对话</b><span className="ln">（16）</span>，给它外挂<b>知识</b><span className="ln">（18 / 28）</span>，交给它<b>工具与任务</b><span className="ln">（20）</span>；最后，你<b>亲手把代码跑通</b><span className="ln">（26–28）</span>。</p>
          <p className="footnote" style={{ marginTop: 10 }}>这一句话就是 30 课的全部 —— 也是你现在拥有的完整心智地图。下面把它画出来。</p>
        </div>
      </Lsec>

      <Lsec
        title="🎛️ 交互演示：三十课登山图"
        lead={<>六个阶段化作一条上山的路，山顶的旗帜上写着这门课对你的全部期待。<b>点击任意里程碑</b>，回看你在那一站学会了什么。</>}
      >
        <MountainMap />
      </Lsec>

      <Lsec
        title="🧭 选一条路：四条进阶路线"
        lead="学完地图，下一步往哪走取决于你想成为什么样的人。先点一个最像你的描述，看看推荐路线 —— 路线之间不互斥，也随时可以换。"
      >
        <RouteDemo />
      </Lsec>

      <Lsec
        title="🎒 行囊：五篇论文与五个项目"
        lead={<>读论文不是从第一个字啃到最后一个字。正确姿势：<b>先读摘要（abstract），再把每张图看懂</b> —— 一篇论文八成的信息在这两处；公式留到最后，啃不动也不影响主线。下面五篇按时间排序，串起来正好是大模型的进化史。</>}
      >
        <div className="card row-list">
          {PAPERS.map((p, i) => (
            <div key={i} className="example">
              <div className="en">{p.en} <span style={{ color: 'var(--fg-2)' }}>{p.year}</span><span className="pill pill-ink" style={{ marginLeft: 8 }}>{p.tag}</span></div>
              <div className="zh">{p.zh}</div>
            </div>
          ))}
        </div>
        <p className="lead" style={{ marginTop: 28 }}>看十个教程，不如跑通一个项目。下面五个由易到难，每完成一个，就把它写进你的作品集。</p>
        <div className="card goals">
          {PROJECTS.map((p, i) => (
            <div key={i} className="goal-item"><span className="tick">{p.n}</span><span>{p.html}</span></div>
          ))}
        </div>
      </Lsec>

      <Lsec title="⚠️ 常见迷茫：三个最常被问到的问题">
        <div className="card quiz row-list">
          <QuizItem q="1. 数学不好，还能深入学 AI 吗？">
            <b>能，看路线。</b>工程和产品路线几乎不卡数学：调 API、做 RAG、写评测，用到的数学不超过中学水平。只有研究路线需要线代和概率 —— 而且完全可以"用到哪、补到哪"。真正危险的不是数学差，而是把"先学完数学"当成永远不出发的理由。
          </QuizItem>
          <QuizItem q="2. 现在才认真入场，是不是太晚了？">
            <b>模型层确实晚了，应用层才刚开始。</b>训练前沿大模型的门槛已高到只剩少数玩家，但"用 AI 把各行各业重做一遍"的大爆发刚刚启动 —— 绝大多数行业还没有被认真做过。况且，学完这 30 课的你，对 AI 的理解已经超过绝大多数人。
          </QuizItem>
          <QuizItem q="3. 要不要辞职全职转行 AI？">
            <b>先别裸辞。</b>用业余时间做完上面五个项目里的两三个，验证两件事：你是否真的享受这个过程？你的产出是否有人愿意用？两个答案都是"是"，再谈转行 —— 那时你手里已经有作品集，转行就不再是一场赌博。
          </QuizItem>
        </div>
      </Lsec>

      <Lsec title="✍️ 小练习">
        <div className="card quiz row-list">
          <QuizItem q="1. 复盘题：合上这一页，按顺序说出六个阶段各自解决什么问题（每个阶段一句话）。">
            <b>直觉篇</b>——AI 是什么、靠什么变聪明；<b>原理篇</b>——支撑深度学习的四大机制；<b>大模型篇</b>——一个 LLM 从生数据到 ChatGPT 的全程；<b>应用篇</b>——提示词、RAG、工具、Agent 的应用层技术栈；<b>前沿篇</b>——扩散、多模态、推理、MCP 这些新闻热词；<b>实战篇</b>——亲手把概念写成能跑的代码。说得出来，地图就真的长在你脑子里了。
          </QuizItem>
          <QuizItem q='2. 定位题：新闻标题《某公司发布新模型，靠"测试时计算"大幅提升数学能力》—— 它落在地图哪一格？你会接着问哪两个问题？'>
            落在<b>第五阶段第 23 课：推理模型</b> —— 用测试时算力换智力、先打草稿再回答的路线。值得追问：① 用什么基准测试证明"大幅提升"？有没有第三方复现？（第 29 课的评估眼光）② 相比上一代是数量级跃迁，还是几个百分点的微调？
          </QuizItem>
          <QuizItem q='3. 行动题：从五个项目里挑一个，写下"本周末能完成的最小一步"。'>
            没有标准答案，给一个示例：选项目① —— 周六上午申请 API key、跑通 26 课的 30 行代码；下午加一个系统提示词，把它变成"毒舌影评人"。检验标准只有一条：<b>这一步必须小到两小时内能看到结果</b> —— 看得到结果，才有下一步。
          </QuizItem>
        </div>
      </Lsec>

      <Lsec title="🏁 写在最后">
        <div className="card card-pad">
          <p style={{ fontSize: 16, lineHeight: 1.9 }}>这门课没有把你变成"懂 AI 的人" —— 没有任何一门课能做到。它给你的是另一样东西：<b>从今天起，你不再害怕任何 AI 新名词。</b>新东西出来，你知道它落在地图的哪一格，知道该问什么问题，知道去哪里验证。</p>
          <p style={{ fontSize: 16, lineHeight: 1.9, marginTop: 12 }}>最后只剩一句话：<b>动手 &gt; 围观，构建 &gt; 收藏。</b>收藏夹里的第 100 篇教程，不如亲手跑通的第 1 个程序。山顶的旗帜上写着"构建者" —— 去把它变成你的名字。</p>
        </div>
      </Lsec>
    </>
  )
}
