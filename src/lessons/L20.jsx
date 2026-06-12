import { useEffect, useRef, useState } from 'react'
import { Lsec, QuizItem } from '../components/ui.jsx'

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ============================================================
// Agent 循环步进演示
// ============================================================
const SCRIPT = [
  { cap: '① 感知与规划：把大目标拆成子任务清单', t: '第 1 轮 · 规划也是接龙出来的',
    d: '“拆成三个子任务”看着像深思熟虑，其实就是一次普通的文本生成（第 16 课思维链的近亲）。计划写进上下文，立刻变成后面每一轮都会读到的路标。', seq: ['think', 'act', 'observe'],
    lines: [['think', '目标：「调研三款降噪耳机并给出购买建议」。拆成三个子任务：① 找出当前口碑前三的型号 ② 逐一收集价格与评测要点 ③ 汇总对比写建议。先做 ①。'], ['act', 'search("降噪耳机 口碑排行 评测")', true], ['obs', '多篇文章反复点名三款：A 牌旗舰款、B 牌轻巧款、C 牌性价比款。子任务 ① 完成 ✓']] },
  { cap: '标准一轮：思考 → 行动 → 观察，足迹 +3 条', t: '第 2 轮 · 标准节拍',
    d: '思考 → 开申请单（第 19 课原封不动）→ 宿主执行 → 结果回填。注意日志里的“要点入笔记”：工作记忆在累积 —— 这就是四件套里的“工作台”（第 17 课）。', seq: ['think', 'act', 'observe'],
    lines: [['think', '进入子任务 ②，先查 A 牌旗舰款 —— 需要价格档位、降噪、佩戴、续航四项要点。'], ['act', 'open_page("A牌旗舰款深度评测.html")', true], ['obs', '页面读取成功。要点入笔记：降噪最强、佩戴舒适、约两千元档；短板是机身偏重。']] },
  { cap: '观察到失败：404 —— 失败信息也会回填上下文', t: '第 3 轮 · 现实开始反击',
    d: '404 了。这正是循环必须存在的理由：页面打不打得开，是“走到这一步才知道”的信息，事先写好的完美计划料不到。失败结果照样回填进上下文 —— 关键看它下一轮怎么办。', seq: ['think', 'act', 'observe'],
    lines: [['think', '如法炮制，查 B 牌轻巧款的评测页。'], ['act', 'open_page("B牌轻巧款评测.html")', true], ['obs', '请求失败：404，页面不存在。这条路走不通。', false, true]] },
  { cap: '反思修正：读着失败足迹，换一条路再来', t: '第 4 轮 · 反思修正（本剧高光）',
    d: '失败记录躺在上下文里，模型读着自己的失败足迹，生成了新策略 —— 换搜索词绕路，全程无人介入。这就是“上一轮的输出成为下一轮的输入”最值钱的一幕：报错也是养料。', seq: ['reflect', 'act', 'observe'],
    lines: [['ref', '上一轮失败 —— 别再撞同一堵墙。换策略：不开具体页面，改用搜索词直接要结论。'], ['act', 'search("B牌轻巧款 降噪耳机 评测 优缺点")', true], ['obs', '搜索摘要给出要点：降噪接近 A、重量轻不少、约一千五百元档；短板是续航一般。进度 2/3。']] },
  { cap: '上一轮的成功策略被继承 —— 足迹在发挥作用', t: '第 5 轮 · 经验被继承',
    d: '注意措辞：“沿用刚验证过的策略”。第 4 轮的成功经验也留在足迹里，影响了这一轮的选择 —— agent 在任务内是会“长记性”的。但只在本次上下文内有效，关窗即忘（第 17 课）。', seq: ['think', 'act', 'observe'],
    lines: [['think', '还差 C 牌性价比款。沿用刚验证过的搜索词策略，更稳。'], ['act', 'search("C牌性价比款 降噪耳机 评测")', true], ['obs', '要点：降噪弱一档、几百元档，通勤场景够用。子任务 ② 完成（3/3）✓']] },
  { cap: '交付前自查：可验证的中间产物', t: '第 6 轮 · 自查 = 可验证的中间产物',
    d: '交付前先核对清单 —— 这就是上一节的解法三：让中间成果可检查，错误当场拦截，而不是带病冲到终点。很多 agent 框架会把“自查”固定写进流程里。', seq: ['think', 'act', 'observe'],
    lines: [['think', '进入子任务 ③。先自查：三款 × 四项要点（价格 / 降噪 / 佩戴 / 续航）的笔记是否齐全？'], ['act', 'read_notes() → 逐格核对清单', true], ['obs', '12 格信息全部在位，无缺漏 —— 可以写结论了。']] },
  { cap: '判断目标达成 → 退出循环，任务结束 ✓', t: '第 7 轮 · 判断完成，退出循环',
    d: '“目标达成”同样是模型生成的一个判断 —— 它也可能判错，所以成熟产品常在这里设人工验收。循环退出，球回到你手里。复盘这一生：7 轮、5 次工具调用、1 次失败重试。', seq: ['think', 'act', 'observe', 'done'],
    lines: [['think', '信息齐全，目标可以收口：生成购买建议，结束任务。'], ['act', '不再调用工具 —— 直接生成最终回答（这一步就是普通的文本生成）'], ['obs', '建议已交付：预算充足选 A（降噪最强）/ 通勤优先选 B（轻便均衡）/ 预算有限选 C（够用就好）。目标达成 → 退出循环 ✓']] },
]
const CAP0 = '目标已写进上下文，工具清单已就位 —— 等待第一轮心跳'
const INFO0 = { t: '开局：目标进场', d: '此刻“目标”只是一段写进上下文的文字。宿主还把工具清单（search / open_page / read_notes）一并发给了模型（第 19 课）。接下来的每一轮，都是同一台接龙机器在读上下文、续写下一段 —— 点「下一轮」开始。' }
const TOTAL = SCRIPT.length
const TAG = { think: ['lt-think', '思考'], act: ['lt-act', '行动'], obs: ['lt-obs', '观察'], ref: ['lt-ref', '反思'] }

const AG_NODES = [
  { k: 'goal', x: 10, y: 20, w: 104, h: 44, fill: 'var(--bg-inset)', stroke: 'var(--hairline-strong)', sw: 1.4, t: '🎯 目标', sub: '一段 prompt 文字', tx: 62, ty1: 40, ty2: 55 },
  { k: 'think', x: 254, y: 36, w: 132, h: 48, fill: 'var(--sky-bg)', stroke: 'var(--sky)', sw: 1.4, t: '🧠 思考 / 规划', sub: '下一步干什么？', tx: 320, ty1: 57, ty2: 73 },
  { k: 'done', x: 540, y: 20, w: 106, h: 44, fill: 'var(--sage-bg)', stroke: 'var(--sage)', sw: 1.4, t: '✓ 完成', sub: '交付最终答案', tx: 593, ty1: 40, ty2: 55 },
  { k: 'act', x: 472, y: 136, w: 132, h: 48, fill: 'var(--amber-bg)', stroke: 'var(--amber)', sw: 1.4, t: '🔧 行动 · 调工具', sub: '开申请单 → 宿主执行', tx: 538, ty1: 157, ty2: 173 },
  { k: 'reflect', x: 36, y: 136, w: 132, h: 48, fill: 'var(--terracotta-bg)', stroke: 'var(--terracotta)', sw: 1.4, t: '🔄 反思修正', sub: '成了吗？要换路吗？', tx: 102, ty1: 157, ty2: 173 },
  { k: 'observe', x: 254, y: 236, w: 132, h: 48, fill: 'var(--sage-bg)', stroke: 'var(--sage)', sw: 1.4, t: '👀 观察结果', sub: '结果回填上下文', tx: 320, ty1: 257, ty2: 273 },
]

function AgentDemo() {
  const [step, setStep] = useState(0)
  const [lit, setLit] = useState({ goal: true })
  const logRef = useRef(null)
  const timersRef = useRef([])

  function clearTimers() { timersRef.current.forEach(clearTimeout); timersRef.current = [] }

  // 点亮当前轮的节拍（错峰）
  useEffect(() => {
    clearTimers()
    if (step === 0) { setLit({ goal: true }); return }
    const seq = SCRIPT[step - 1].seq
    if (reduceMotion()) { const o = {}; seq.forEach((k) => (o[k] = true)); setLit(o); return }
    setLit({})
    seq.forEach((k, i) => {
      timersRef.current.push(setTimeout(() => setLit((prev) => ({ ...prev, [k]: true })), i * 450))
    })
    return clearTimers
  }, [step])

  // 日志滚到底
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, [step])

  const info = step === 0 ? INFO0 : SCRIPT[step - 1]
  const cap = step === 0 ? CAP0 : SCRIPT[step - 1].cap

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · Agent 循环：调研降噪耳机的 7 轮心跳</span>
        <span className="demo-hint">蓝 = 思考 · 黄 = 行动 · 绿 = 观察 · 红 = 反思</span>
      </div>
      <div className="demo-body stack">
        <div className="demo-stage">
          <div className="demo-stage-col">
            <svg id="ag-svg" viewBox="0 0 660 320" width="680" aria-label="Agent 循环图：思考、行动、观察、反思之间循环，目标达成则退出">
              <defs>
                <marker id="ag-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 z" fill="var(--fg-2)" />
                </marker>
              </defs>
              <g fill="none" stroke="var(--fg-2)" strokeWidth="1.6">
                <path d="M 116 42 C 170 40 210 46 248 54" markerEnd="url(#ag-arr)" />
                <path d="M 388 74 C 450 92 502 110 532 132" markerEnd="url(#ag-arr)" />
                <path d="M 514 186 C 480 220 442 244 392 256" markerEnd="url(#ag-arr)" />
                <path d="M 250 262 C 195 256 140 226 110 190" markerEnd="url(#ag-arr)" />
                <path d="M 98 134 C 95 95 170 68 248 58" markerEnd="url(#ag-arr)" />
                <path d="M 388 50 C 440 38 480 36 534 38" strokeDasharray="5 4" markerEnd="url(#ag-arr)" />
              </g>
              <text x="462" y="26" textAnchor="middle" fontSize="9.5" fill="var(--fg-2)">目标达成 → 退出循环</text>
              <text x="320" y="138" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="var(--fg-1)">{step === 0 ? '—' : `第 ${step} 轮`}</text>
              <text x="320" y="158" textAnchor="middle" fontSize="10.5" fill="var(--fg-2)">上一轮的输出</text>
              <text x="320" y="172" textAnchor="middle" fontSize="10.5" fill="var(--fg-2)">= 下一轮的输入</text>
              {AG_NODES.map((n) => (
                <g key={n.k} className={`ag-node${lit[n.k] ? ' lit' : ''}`}>
                  <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="12" fill={n.fill} stroke={n.stroke} strokeWidth={n.sw} />
                  <text x={n.tx} y={n.ty1} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--fg-0)">{n.t}</text>
                  <text x={n.tx} y={n.ty2} textAnchor="middle" fontSize="9" fill="var(--fg-1)">{n.sub}</text>
                </g>
              ))}
            </svg>
            <div className="ag-caption">{cap}</div>
            <div className="ag-log" ref={logRef} aria-live="polite">
              {step === 0 ? (
                <div className="placeholder">（足迹日志为空 —— agent 还没开始干活）</div>
              ) : (
                SCRIPT.slice(0, step).map((s, ri) => (
                  <div key={ri}>
                    <div className="log-round">第 {ri + 1} 轮</div>
                    {s.lines.map((l, li) => (
                      <div key={li} className={`log-line${l[3] ? ' fail' : ''}`}>
                        <span className={`lt ${TAG[l[0]][0]}`}>{TAG[l[0]][1]}</span>
                        <span className={l[2] ? 'mono' : undefined}>{l[1]}</span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="demo-side">
          <div className="chips">
            <button className="chip" disabled={step >= TOTAL} onClick={() => setStep((s) => Math.min(TOTAL, s + 1))}>下一轮 ▸</button>
            <button className="chip" onClick={() => setStep(0)}>↺ 重置</button>
            <span className="footnote" style={{ alignSelf: 'center' }}>第 {step} / {TOTAL} 轮</span>
          </div>
          <h4 style={{ marginTop: 14 }}>{info.t}</h4>
          <p>{info.d}</p>
        </div>
      </div>
    </div>
  )
}

export default function L20() {
  return (
    <>
      <Lsec title="🎯 你将学会">
        <div className="card goals">
          <div className="goal-item"><span className="tick">✓</span>一句话分清 Chatbot 和 Agent：一个“一问一答”，一个“给定目标，自主走完多步”—— 判断标准是球在谁手里</div>
          <div className="goal-item"><span className="tick">✓</span>记住四件套：Agent = LLM（大脑）+ 工具（手脚）+ 循环（心跳）+ 记忆（工作台），每一件都来自前几课的旧零件</div>
          <div className="goal-item"><span className="tick">✓</span>看懂循环的六拍，以及全课最重要的洞察：上一步的输出就是下一步的输入 —— 模型在自己的足迹上持续决策</div>
          <div className="goal-item"><span className="tick">✓</span>诚实评估可靠性：明白错误为什么连乘累积，认得死循环 / 跑偏 / 成本爆炸三种死法，记住人机协作三件套解法</div>
        </div>
      </Lsec>

      <Lsec
        title="💡 核心概念：把“申请单回合”装进循环里"
        lead="先盘点前四课攒齐的零件：第 16 课你学会指挥模型，第 17 课摸清它的记忆边界，第 18 课给它外挂资料，第 19 课它学会开工具申请单。但这些场景有个共同点：每个回合都由你发起，答完一轮，球就回到你手里。哪怕模型再强，这种“一问一答”的形态都叫 Chatbot。Agent（智能体）改变的正是这一点 ——"
      >
        <div className="contrast">
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-ink">直觉印象</span></div>
            <div className="big">Agent 就是一个<span className="gap">更聪明的</span>聊天机器人</div>
            <p className="note">好像只要模型足够强，聊着聊着它就“升级”成了 agent。</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">真实机制</span></div>
            <div className="big">Agent 是把大模型<span className="hl">装进循环里</span>：给定目标后，它自主规划、调工具、看结果、再决策，干完才把球还给你</div>
            <p className="note">模型本身可以一模一样 —— 差别在外面那圈架构：循环、工具、记忆。</p>
          </div>
        </div>
        <div className="example mt14">
          <div className="en">最贴切的画面是<span className="hl">给实习生派活</span>：你说“调研一下竞品，周五给我报告”—— 他不会每查完一个网页就跑来问“下一步干嘛”，而是自己列提纲、自己搜资料，链接挂了自己换关键词，实在卡死才来找你。</div>
          <div className="zh">Chatbot 是“事事请示”的协作方式，Agent 是“给目标、交结果”的协作方式。注意：变化的未必是大脑的聪明程度 —— 是<b>协作方式</b>变了。</div>
        </div>
        <p className="lead mt14">拆开任何一个 agent —— 无论产品包装得多炫 —— 里面都是同一副<b>四件套</b>，而且每一件你都在前面的课里见过：</p>
        <div className="use-grid cols-4">
          <div className="card use-card"><div className="label">大脑 · 第 10–14 课</div><div className="en"><b>LLM</b> 大模型</div><div className="zh">唯一会“想”的零件。规划、选工具、读结果、做判断 —— 全是这台接龙机器在生成文本。</div></div>
          <div className="card use-card"><div className="label">手脚 · 第 19 课</div><div className="en"><b>工具</b></div><div className="zh">搜索、读网页、跑代码、写文件。仍是“模型开申请单、宿主真执行”那一套，一字未改。</div></div>
          <div className="card use-card"><div className="label">心跳 · 本课主角</div><div className="en"><b>循环</b></div><div className="zh">宿主程序里一个朴素的 while：任务没完成，就把最新结果喂回去、再跑一轮。“自主”全靠它续命。</div></div>
          <div className="card use-card"><div className="label">工作台 · 第 17 课</div><div className="en"><b>记忆</b></div><div className="zh">上下文窗口摆着目标、计划和每轮足迹；长任务还要外挂笔记和摘要，防止工作台被堆满。</div></div>
        </div>
        <p className="lead mt14">一张表把两种形态钉死 —— 顺便认认市面上的真实产品：</p>
        <div className="card">
          <table className="match">
            <thead><tr><th>维度</th><th>Chatbot · 一问一答</th><th>Agent · 给定目标自主多步</th></tr></thead>
            <tbody>
              <tr><td className="be">交互方式</td><td className="ex">你发球它接球，答完一句回合即结束</td><td>你只给目标，它连续打完整局再交付</td></tr>
              <tr><td className="be">一次任务的步数</td><td className="ex">1 步：生成一段回答</td><td>几步到几百步：规划、调工具、看结果、再决策</td></tr>
              <tr><td className="be">出错的代价</td><td className="ex">错了你当场看见，下一句就能纠正</td><td>错误发生在中间步骤，会被后续步骤继承、放大（下文细讲）</td></tr>
              <tr><td className="be">典型产品</td><td className="ex">ChatGPT / Claude 的网页对话</td><td>Claude Code（自主写代码）、Deep Research（自主调研）、Manus 类通用 agent</td></tr>
            </tbody>
          </table>
        </div>
        <p className="footnote mt14">提醒：agent 产品的格局变化极快 —— 表里点名的产品请当“形态代表”看，别当排行榜；具体能力以各家官网为准。</p>
      </Lsec>

      <Lsec
        title="📖 循环拆解：六拍心跳，一轮接一轮"
        lead="把“循环”放大到帧。每一轮心跳有六拍 —— 前两拍主要在开局走，后四拍周而复始："
      >
        <div className="card flow-card">
          <div className="flow">
            <div className="flow-step"><span className="num">1</span><span className="txt"><b>感知任务。</b>读懂目标，盘点手头有哪些工具 —— 工具清单就躺在上下文里（第 19 课）。<span className="footnote">“目标”对模型而言只是窗口顶部的一段文字。记住这个事实，误区一会用到它。</span></span></div>
            <div className="flow-step"><span className="num">2</span><span className="txt"><b>规划拆步。</b>把大目标拆成子任务清单：“先搜型号 → 再逐一查评测 → 最后汇总写建议”。<span className="footnote">计划本身就是接龙生成的一段文字（第 16 课思维链的近亲）—— 写出来后，它就成了后续每轮都会读到的路标。</span></span></div>
            <div className="flow-step"><span className="num">3</span><span className="txt"><b>行动（调用工具）。</b>从计划里取下一步，开一张工具申请单，宿主真正执行。<span className="footnote">第 19 课整套机制原封不动：模型从不亲手执行任何东西 —— agent 没有改变这条铁律，只是开单更频繁了。</span></span></div>
            <div className="flow-step"><span className="num">4</span><span className="txt"><b>观察结果。</b>执行结果回填上下文 —— 对模型来说，只是“窗里多了一段文字”。<span className="footnote">成功的结果是养料，失败的报错同样是养料 —— 演示里你会亲眼看到一次 404 如何变成转机。</span></span></div>
            <div className="flow-step"><span className="num">5</span><span className="txt"><b>反思修正。</b>符合预期吗？计划要不要改？这条路不通换哪条？<span className="footnote">“反思”听着玄，落地仍是生成文本：模型读着自己的足迹，续写一段自我评估。</span></span></div>
            <div className="flow-step"><span className="num">6</span><span className="txt"><b>循环或退出。</b>没完成 → 回到第 3 拍；完成 → 交付答案；反复碰壁 → 放弃并向人汇报。<span className="footnote">注意：判断“完没完成”也是模型生成的，它可能误判 —— 所以成熟产品常在这里设人工验收（下一节细讲）。</span></span></div>
          </div>
        </div>
        <p className="lead mt14"><b>全课最重要的一句话：上一拍的输出，就是下一拍的输入。</b>Agent 并没有长出新器官 —— 每一轮做决策的，仍是你在第 12–14 课认识的那台接龙机器：读上下文、续写下一段。唯一的变化是上下文里装的东西：不再只有你的问题，而是它自己一路留下的<b>足迹</b> —— 计划、申请单、工具结果、报错、反思。<b>模型在自己的足迹上持续决策。</b>这句话立刻解锁两个推论：① 足迹越走越长，窗口越来越挤（第 17 课）—— 长任务必须做记忆管理，否则开头的目标会被挤出窗外，agent 当场“忘了自己是谁”；② 足迹里一旦混进一个错误，后面每一轮都会把它当真去读 —— 这是下一节“错误连乘”的种子。</p>
        <p className="lead"><b>为什么非循环不可？</b>因为多步任务的关键信息是“走到那一步才出现”的。调研耳机：不先搜一次，不知道该查哪三款；不点开链接，不知道页面早已 404。再聪明的模型也无法在第 0 秒写出一份永不需要修改的完美计划 —— 计划赶不上变化时，唯一的办法是走一步、看一步、改一步。单次生成给不了“看一步”的机会，循环可以。</p>
        <p className="lead">把你围观 agent 干活时见过的现象，和循环的节拍连上线：</p>
        <div className="card">
          <table className="match">
            <thead><tr><th>你在产品里见过的现象</th><th>循环里的哪一拍</th></tr></thead>
            <tbody>
              <tr><td><b>Deep Research 一跑十几分钟，提示“已阅读 14 个来源”</b></td><td className="ex">循环跑到了第 N 轮 —— 每个来源都是一次完整的“行动 → 观察”</td></tr>
              <tr><td><b>Claude Code 改完代码自己跑测试，测试红了又接着改</b></td><td className="ex">跑测试 = 行动；报错信息 = 观察；“我哪里改错了” = 反思 —— 一轮没过就再来一轮</td></tr>
              <tr><td><b>屏幕上一行行滚过“正在思考… 正在调用工具…”</b></td><td className="ex">那不是装饰动画，是循环每一拍的实时日志 —— 产品把心跳播给你看</td></tr>
              <tr><td><b>它跑到一半，你插一句“预算改成一千以内”，它真的会调整</b></td><td className="ex">你的话也成了上下文里的新足迹 —— 下一轮决策时被一并读到</td></tr>
            </tbody>
          </table>
        </div>
      </Lsec>

      <Lsec
        title="📖 可靠性瓶颈：连乘的暴政"
        lead="到这里 agent 听起来近乎完美：会规划、会动手、还会自我纠错。是时候泼冷水了 —— 这一节是全课最诚实的部分，也是你判断“agent 新闻是突破还是吹牛”的手感来源。"
      >
        <p className="lead">病根埋在第 14 课：模型的每一次输出都是概率采样，单步再准也只是“大概率对”。聊天里这无所谓 —— 错了你看得见，下一句就纠正。但 agent 把几十步串成一条链，<b>每一步都踩在上一步的输出上</b>，麻烦就来了：错误不是平均分摊的，而是<b>连乘累积</b>的。假设 agent 每走一步都有九成五的把握做对，看看连续走下去，“全程一步不错”的把握还剩多少：</p>
        <div className="card">
          <table className="match">
            <thead><tr><th>连续步数</th><th>全程不出错的把握</th><th>体感</th></tr></thead>
            <tbody>
              <tr><td className="be">1 步</td><td>约 95%</td><td className="ex">很稳</td></tr>
              <tr><td className="be">5 步</td><td>约 77%</td><td className="ex">开始心虚</td></tr>
              <tr><td className="be">10 步</td><td>约 60%</td><td className="ex">将将过半</td></tr>
              <tr><td className="be">20 步</td><td>约 36%</td><td className="ex">大概率中途已出错</td></tr>
              <tr><td className="be">50 步</td><td>约 8%</td><td className="ex">几乎必然翻车</td></tr>
            </tbody>
          </table>
        </div>
        <p className="footnote mt14">这只是个示意模型 —— 真实任务里各步难度不同，有些错误还能被反思救回来。但量级感是对的：链路越长，“全程顺利”越接近抽奖。</p>
        <p className="lead mt14">错误累积之外，工程上还有三种常见死法 —— 每一种都在真实产品里反复上演：</p>
        <div className="use-grid">
          <div className="card use-card"><div className="label">死法一</div><div className="en"><b>死循环</b></div><div className="zh">同一个失败动作反复重试 —— 像游戏 NPC 卡在墙角原地踏步。烧着 token、产出为零；不设轮数上限，能一直卡到天亮。</div></div>
          <div className="card use-card"><div className="label">死法二</div><div className="en"><b>跑偏</b></div><div className="zh">第 3 轮一个小误读（把“降噪耳机”看成“降噪音箱”），被后面十几轮当成既定事实继承 —— 越走越远，交付时已不知所云。</div></div>
          <div className="card use-card"><div className="label">死法三</div><div className="en"><b>成本爆炸</b></div><div className="zh">每一轮都要把越滚越长的足迹整个重读一遍（第 17 课，按 token 计费）。轮数 × 足迹长度，账单飙升的速度远超直觉。</div></div>
        </div>
        <p className="lead mt14">当前工程界的三件套解法 —— 共同思路只有一个：<b>别让错误活过一轮，别让链条长到失控</b>：</p>
        <div className="use-grid">
          <div className="card use-card"><div className="label">解法一 · 人把关</div><div className="en">关键节点<b>人工确认</b></div><div className="zh">业内叫 human-in-the-loop：删文件、花钱、对外发送 —— 这些动作必须停下来等人签字。第 19 课的安全铁律，在 agent 里因步数变多而加倍重要。</div></div>
          <div className="card use-card"><div className="label">解法二 · 链条切短</div><div className="en"><b>子任务拆分</b></div><div className="zh">把 20 步长链切成几段 5 步短链，每段结束交付一个人能快速检查的小成果。连乘的链条越短，活下来的概率越高 —— 算术如此，没有魔法。</div></div>
          <div className="card use-card"><div className="label">解法三 · 当场验货</div><div className="en">可验证的<b>中间产物</b></div><div className="zh">让每一步产出“机器或人能立刻核对”的东西：写代码就跑测试，做调研就留来源链接。错误当场拦截，而不是带病再跑十几轮。</div></div>
        </div>
        <p className="lead mt14">这也顺手回答了一个现象级问题：<b>为什么写代码的 agent 最先成熟？</b>因为代码天生自带免费的验证器 —— 编译器和测试。每一轮“观察”拿到的都是客观硬信号，错误活不过一轮就被发现；改错了还能一键回滚。而“全自动炒股”“全自动谈判”这类任务，反馈慢、噪声大、错误不可逆 —— 连乘衰减无人拦截。一条好用的经验法则：<b>结果越容易被便宜地验证、错误越可逆的领域，agent 越早能用。</b>下次看 agent 新品发布，先问这两个问题，比看 demo 视频靠谱。</p>
      </Lsec>

      <Lsec
        title="🎛️ 交互演示：围观一个 agent 的一生"
        lead="任务剧本：「调研三款降噪耳机并给出购买建议」。上方是循环图，下方是 agent 的足迹日志 —— 每点一次「下一轮」，循环图点亮对应节拍，日志追加这一轮的思考 / 行动 / 观察。盯紧第 3、4 轮：一次 404 失败，和一次教科书式的反思绕路。"
      >
        <AgentDemo />
      </Lsec>

      <Lsec title="⚠️ 常见误区">
        <div className="card alert-card row-list">
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">Agent 有自主意识 —— 它“想要”完成目标，失败了还“不甘心”地重试</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">“目标”只是你写进 prompt 的一段文字，“不达目的不罢休”是程序里写死的 while 循环</span></div>
            </div>
            <p className="why"><b>病因：</b>围观 agent 连续干活十几分钟、碰壁后还会换路重试，实在太像“有意志”了。两个拆穿它的实验：① 把 prompt 里的目标换成任意别的字符串，它对新目标同样“执着”，毫无偏好；② 让宿主程序不再把结果回填回去（拔掉循环），“意志”当场消失，它退化成普通的一问一答。执着是<b>架构的属性</b>，不是心灵的属性 —— 欲望写在你的 prompt 里，毅力写在工程师的 while 里。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">Agent 已经能全自动替代人类工作了</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">长链路成功率连乘衰减，目前最稳的形态是人机协作：AI 跑短链，人把关节点</span></div>
            </div>
            <p className="why"><b>病因：</b>你刷到的 agent 演示视频，都是从无数次运行里挑出的成功案例剪的 —— 失败的那些不会出现在你的时间线上。真实工程里，长任务依旧会死循环、跑偏、烧预算，所以成熟产品全都保留着人工确认闸（Claude Code 每次删文件、跑命令都要先问你，就是明证）。当下最能打的用法不是“全自动”，而是把 agent 当一个不知疲倦的实习生：你定方向、切任务、验收中间产物 —— 它出手速，你出判断。</p>
          </div>
        </div>
      </Lsec>

      <Lsec title="✍️ 小练习">
        <div className="card quiz row-list">
          <QuizItem q="1. 朋友说：“我把聊天机器人接上了搜索工具，它现在算 agent 了吧？”用本课的四件套和“球在谁手里”标准，判断它还缺什么。">
            对照四件套：有<b>大脑</b>（LLM）、有<b>手脚</b>（一个搜索工具）—— 但如果它仍是“你问一句、它搜一次、答完即止”，那就缺<b>循环</b>（自己决定下一步、连续跑多轮）和真正被用起来的<b>记忆</b>（在足迹上持续决策）。判断标准一句话：<b>球在谁手里</b> —— 每一步都要你发起，它就还是“带工具的 Chatbot”；你只给目标、它自己走完全程，才是 agent。
          </QuizItem>
          <QuizItem q="2. 你让 agent 整理“近五年新能源车销量数据”，发现它跑到第 15 轮还在反复访问同一个打不开的网站。诊断这是哪种死法，并用本课的三件套解法各开一条整改方案。">
            <b>诊断：死循环</b> —— 同一个失败动作反复重试，token 在烧、产出为零。<b>整改：</b>① <b>人工确认</b>：设轮数上限 + 连续失败若干次即暂停上报，让人来拍板换路；② <b>子任务拆分</b>：把“近五年”切成按年份的五段短任务，每段单独跑、单独验收；③ <b>可验证中间产物</b>：要求每段先交付一张带来源链接的小表格 —— 数据真假、链接通不通，人和程序都能当场核对。
          </QuizItem>
          <QuizItem q="3. 为什么“AI 写代码”的 agent 比“AI 全自动炒股”的 agent 先成熟？用“可验证的中间产物”和“错误连乘”两个概念解释。">
            代码领域每一步都有<b>便宜又客观的验证器</b>：编译器、测试、报错信息 —— “观察”这一拍拿到的是硬信号，错误活不过一轮就被发现，相当于把每步成功率拉高、把连乘的链条切短；而且改错了能一键回滚，错误<b>可逆</b>。炒股则相反：反馈慢、噪声大、错误不可逆 —— 连乘衰减一路无人拦截。经验法则：<b>验证越便宜、错误越可逆的领域，agent 越早成熟。</b>
          </QuizItem>
        </div>
      </Lsec>
    </>
  )
}
