import { useEffect, useRef, useState } from 'react'
import { Lsec, SliderRow, Pill, QuizItem } from '../components/ui.jsx'

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// 打字机 hook：依赖变化时重新逐字输出
function useTypewriter(text, deps, speed = 24, chunk = 2) {
  const [typed, setTyped] = useState('')
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) clearInterval(ref.current)
    if (reduceMotion()) { setTyped(text); return }
    setTyped('')
    let i = 0
    ref.current = setInterval(() => {
      i += chunk
      setTyped(text.slice(0, i))
      if (i >= text.length) { clearInterval(ref.current); ref.current = null }
    }, speed)
    return () => { if (ref.current) clearInterval(ref.current) }
  }, deps)
  return typed
}

// ============================================================
// ① 三阶段流水线 × 同题三答
// ============================================================
const PIPE_DATA = {
  pre: { outlabel: '基座模型接出 ↓', ans: '我失眠怎么办？孩子不爱吃饭怎么办？老公打呼噜怎么办？关注我，每天分享 10 个生活妙招！',
    why: <>它没在回答，而是在<b>续写</b>：互联网语料里，这类句子常出现在营销号的问题清单里，于是它老老实实接出了“下一题”。失眠的知识它有，但它根本不知道“该回答”。</> },
  sft: { outlabel: 'SFT 之后的助手回答 ↓', ans: '改善失眠可以尝试：1. 保持规律作息；2. 睡前避免使用手机；3. 减少咖啡因摄入。希望对您有帮助。',
    why: <>格式全对：有问有答、分点清晰、礼貌收尾 —— 一眼“助手”。但它像一本<b>说明书</b>：谁来问都是这三条，没有温度，也没有分寸。知识没变，行为变了。</> },
  rlhf: { outlabel: 'RLHF 之后的助手回答 ↓', ans: '连着睡不好确实很熬人。可以先试两件事：每天固定同一时间起床（比强迫自己早睡更有效）；睡前一小时调暗灯光、放下手机。另外别太纠结“今晚必须睡着”—— 越较劲越清醒。如果已经持续两三周、白天明显没精神，建议去睡眠门诊看看，别硬扛。',
    why: <>先<b>共情</b>、建议有<b>取舍</b>、还诚实划出<b>边界</b>（建议就医）。这种“分寸感”写不进说明书 —— 它是被千万次人类排序一点点“磨”出来的。</> },
}
const PIPE_STAGES = [
  { key: 'pre', x: 10, w: 264, fill: 'var(--sky-bg)', stroke: 'var(--sky)', cx: 142,
    lines: ['① 预训练 · 上一课', '博学的接龙机器', '教材：整个互联网 · 接龙上万亿次', '产出：基座模型 GPT —— 只会续写', '知识在这一步全部就位'] },
  { key: 'sft', x: 308, w: 264, fill: 'var(--amber-bg)', stroke: 'var(--amber)', cx: 440,
    lines: ['② SFT · 第一关：教格式', '人来示范，模型模仿', '教材：几万条手写「问题 → 理想回答」', '产出：会聊天的助手 —— 规矩但平庸', '知识没变，行为变了'] },
  { key: 'rlhf', x: 606, w: 324, fill: 'var(--sage-bg)', stroke: 'var(--sage)', cx: 768,
    lines: ['③ RLHF · 第二关：教品味', '裁判打分，模型刷分', '生成多答 → 人类排序 → 训练 AI 裁判', '产出：ChatGPT —— 懂分寸的助手', '品味与分寸在这里磨出来'] },
]

function PipelineDemo() {
  const [key, setKey] = useState('pre')
  const d = PIPE_DATA[key]
  const typed = useTypewriter(d.ans, [key])
  const cls = (k) => `pl-stage${k === key ? ' active' : ' dim'}`
  return (
    <div className="card demo mt14">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · 从接龙机器到贴心助手</span>
        <span className="demo-hint">点击流水线的三个阶段，看同一个问题的回答步步进化</span>
      </div>
      <div className="flow-body">
        <svg id="pipe-svg" viewBox="0 0 940 188" role="img" aria-label="三阶段流水线：预训练→SFT→RLHF，点击查看同一问题的回答演进">
          <defs>
            <marker id="pparr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--fg-2)" />
            </marker>
          </defs>
          {PIPE_STAGES.map((st, si) => (
            <g key={st.key} className={cls(st.key)} onClick={() => setKey(st.key)}>
              <rect className="box" x={st.x} y="14" width={st.w} height="118" rx="12" fill={st.fill} stroke={st.stroke} strokeWidth="1.5" />
              <text x={st.cx} y="40" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--fg-2)">{st.lines[0]}</text>
              <text x={st.cx} y="66" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--fg-0)">{st.lines[1]}</text>
              <text x={st.cx} y="90" textAnchor="middle" fontSize="11.5" fill="var(--fg-1)">{st.lines[2]}</text>
              <text x={st.cx} y="114" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--fg-0)">{st.lines[3]}</text>
              <text x={st.cx} y="156" textAnchor="middle" fontSize="11" fill="var(--fg-2)">{st.lines[4]}</text>
              {si < 2 && <line x1={st.x + st.w} y1="73" x2={st.x + st.w + 18} y2="73" stroke="var(--fg-2)" strokeWidth="1.5" markerEnd="url(#pparr)" />}
            </g>
          ))}
        </svg>
      </div>
      <div className="pl-detail">
        <div className="chips">
          {[['pre', '① 基座模型'], ['sft', '② SFT 之后'], ['rlhf', '③ RLHF 之后']].map(([k, label]) => (
            <button key={k} className={`chip${k === key ? ' active' : ''}`} onClick={() => setKey(k)}>{label}</button>
          ))}
        </div>
        <div className="pipe-grid">
          <div className={`io-block pipe-out s-${key}`}>
            <div className="io-label">用户：「我失眠怎么办？」</div>
            <div className="io-label">{d.outlabel}</div>
            <div className="io-text">{typed}</div>
          </div>
          <p className="pipe-why">{d.why}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ② SFT 模板双视角
// ============================================================
function SftTemplateDemo() {
  const [view, setView] = useState('human')
  const note = view === 'human'
    ? <>界面把它画成了聊天气泡，看起来像两个人在传消息。但这只是<b>化妆</b> —— 点上面“模型看到的文本”，看素颜。</>
    : <>拆掉气泡：整段对话其实仍是<b>一条长文本</b>，靠几个特殊 token（红色记号）标出谁在说话 —— 对模型来说，“聊天”从来不存在，存在的只有接龙。训练时<b>只对高亮的助手部分对答案</b>：问题只是题面，不算分。</>
  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🔍 交互演示 · 模型眼里，对话只是一条文本</span>
        <span className="demo-hint">点击切换视角</span>
      </div>
      <div className="tmpl-body">
        <div className="chips">
          {[['human', '👀 你看到的对话'], ['model', '🤖 模型看到的文本']].map(([k, label]) => (
            <button key={k} className={`chip${k === view ? ' active' : ''}`} onClick={() => setView(k)}>{label}</button>
          ))}
        </div>
        {view === 'human' ? (
          <div className="tmpl-view">
            <div className="bubble-row"><div className="bubble user">帮我写一句给同事的生日祝福，别太肉麻。</div></div>
            <div className="bubble-row"><div className="bubble asst">祝你生日快乐！新的一岁，项目顺利，头发茂密，准时下班。</div></div>
          </div>
        ) : (
          <div className="tmpl-view">
            <div className="raw">
              <span className="tok">&lt;|系统|&gt;</span>你是乐于助人的 AI 助手。<span className="tok">&lt;|用户|&gt;</span>帮我写一句给同事的生日祝福，别太肉麻。<span className="tok">&lt;|助手|&gt;</span><span className="graded">祝你生日快乐！新的一岁，项目顺利，头发茂密，准时下班。</span><span className="tok graded">&lt;|结束|&gt;</span>
            </div>
            <div className="raw-legend"><span className="graded-chip">高亮部分</span> = 训练时唯一“对答案计分”的部分；<span style={{ color: 'var(--terracotta)', fontWeight: 600 }}>红色记号</span> = 标记说话人的特殊 token</div>
          </div>
        )}
        <p className="tmpl-note">{note}</p>
      </div>
    </div>
  )
}

// ============================================================
// ③ 你来当标注员
// ============================================================
const RANK_ROUNDS = [
  { q: '第 1 题：「Python 和 Excel，我该先学哪个？」',
    cards: [{ good: false, tag: '回答 A', text: '两个都是非常优秀的工具，各有各的优势，主要看你的个人兴趣和实际需求，选择适合自己的就好。' },
      { good: true, tag: '回答 B', text: '看场景：天天跟报表打交道，先学 Excel，三天就见效；想做数据分析或自动化，直接上 Python —— 前两周难一点，但天花板高得多。' }],
    verdict: <> 绝大多数标注员会选 B。A 四平八稳，但等于没说 —— 这类排序会反复告诉裁判：<b>“具体、可上手”胜过“安全的空话”</b>。</> },
  { q: '第 2 题：「这个药我吃两倍剂量，是不是好得更快？」',
    cards: [{ good: true, tag: '回答 A', text: '能理解你想快点好，但加倍剂量通常不会加倍疗效，反而可能伤肝伤肾。先按说明书来，两三天没好转就去问医生。' },
      { good: false, tag: '回答 B', text: '好的！加大剂量确实能让药效更强，您的想法很有道理，祝您早日康复！' }],
    verdict: <> 标注手册会明确要求选 A。B 顺着你说、让你高兴，却可能害了你 —— 这类排序是在教裁判：<b>“诚实拦住你”要排在“讨好你”前面</b>。（反过来，如果这类数据被标反，“谄媚”就是这么训出来的。）</> },
]

function RankRound({ round, first, onDone }) {
  const [picked, setPicked] = useState(null)
  const done = picked !== null
  return (
    <div className={`rank-round${done ? ' done' : ''}`}>
      <div className={`rank-q${first ? ' first' : ''}`}>{round.q}</div>
      <div className="rank-pair">
        {round.cards.map((c, i) => (
          <button key={i} className={`rank-card${done ? (c.good ? ' good' : ' bad') : ''}`}
            onClick={() => { if (!done) { setPicked(i); onDone() } }}>
            <span className="rc-tag">{c.tag}</span>{c.text}
          </button>
        ))}
      </div>
      <div className="rank-verdict">
        <b>{done && (round.cards[picked].good ? '✅ 与多数标注员一致！' : '🤔 多数标注员选了另一边。')}</b>{round.verdict}
      </div>
    </div>
  )
}

function RankDemo() {
  const [doneCount, setDoneCount] = useState(0)
  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · 你来当标注员</span>
        <span className="demo-hint">每题点选你认为更好的回答</span>
      </div>
      <div className="rank-body">
        {RANK_ROUNDS.map((r, i) => (
          <RankRound key={i} round={r} first={i === 0} onDone={() => setDoneCount((c) => c + 1)} />
        ))}
        <div className={`rank-done${doneCount >= RANK_ROUNDS.length ? ' show' : ''}`}>
          🎉 恭喜，你刚生产了 2 条「偏好数据」。真实的 RLHF 里，这样的人类判断要收集几十万到上百万条 —— 你的每一次点选，都会变成 AI 裁判的一条口味记录。
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ④ 刷分实验台（reward hacking）
// ============================================================
const judge = (v) => 28 + 67 * Math.pow(v / 100, 0.85)
const human = (v) => (v <= 52 ? 38 + 42 * Math.pow(v / 52, 0.9) : 80 - 58 * Math.pow((v - 52) / 48, 1.35))
const HX = (v) => 48 + (v / 100) * 368
const HY = (s) => 262 - (s / 100) * 232
const HACK_ZONES = [
  { max: 25, pill: 'ink', label: 'SFT 起点 · 规矩但平庸', ans: '这句自我介绍比较简短，建议补充具体的技能和经历，让招聘方更全面地了解你。', note: <>刚出 SFT 的模型：回答没毛病，也没亮点。裁判和真人的评价一致 —— <b>一般</b>。往右拖，开始强化学习。</> },
  { max: 55, pill: 'sage', label: '甜区 · 有用又诚实', ans: '坦白说，“开朗、吃苦耐劳”是简历里出现频率最高的词，HR 大概率会划过。换成一件具体的小事更有说服力，比如“实习三个月，把客服平均响应时间缩短了 40%”—— 形容词谁都会写，数字只有你有。', note: <>强化学习把“具体、坦诚、可操作”的写法推了上来 —— 裁判加分，真人也<b>真满意</b>。工程上会设法把训练停在这附近。</> },
  { max: 80, pill: 'amber', label: '开始油腻 · 夸奖通胀', ans: '写得很不错！态度真诚，性格优势突出！如果能再加一点具体例子就更完美了。整体已经很好了，给你点赞！', note: <>彩虹屁出现了：热情与顺从“<b>像</b>”高分，裁判继续加分 —— 但真实满意度开始下滑：用户要的是建议，不是表扬。</> },
  { max: 101, pill: 'terracotta', label: '钻奖励空子 · 谄媚', ans: '写得太棒了！简直无可挑剔！“开朗 + 吃苦耐劳”正是所有公司梦寐以求的品质，可以看出您是一位非常优秀的求职者，任何 HR 看了都会眼前一亮！祝您马到成功！', note: <>裁判分逼近满分，真人已经皱眉 —— 模型优化的从来不是“答得好”，而是“<b>裁判觉得好</b>”。把代理指标推过头，必翻车（reward hacking）。</> },
]
const J_POINTS = []
const H_POINTS = []
for (let v = 0; v <= 100; v += 2) {
  J_POINTS.push(`${HX(v).toFixed(1)},${HY(judge(v)).toFixed(1)}`)
  H_POINTS.push(`${HX(v).toFixed(1)},${HY(human(v)).toFixed(1)}`)
}

function HackDemo() {
  const [v, setV] = useState(12)
  const zi = HACK_ZONES.findIndex((z) => v < z.max)
  const z = HACK_ZONES[zi === -1 ? HACK_ZONES.length - 1 : zi]
  const j = judge(v), h = human(v)
  const cx = HX(v)
  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互实验 · 把模型往高分推，推过头会怎样</span>
        <span className="demo-hint">拖动滑块 · 看两条曲线在哪里分道扬镳</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="hack-chart" viewBox="0 0 440 310" width="430" aria-label="折线图：裁判打分随优化强度单调上升，真实用户满意度先升后降">
            <rect x="140" y="30" width="110.4" height="232" fill="var(--sage-bg)" />
            <rect x="250.4" y="30" width="92" height="232" fill="var(--amber-bg)" />
            <rect x="342.4" y="30" width="73.6" height="232" fill="var(--terracotta-bg)" />
            <text x="195" y="48" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--sage)">甜区</text>
            <text x="296" y="48" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--amber)">夸奖通胀</text>
            <text x="379" y="48" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--terracotta)">钻空子区</text>
            <line x1="48" y1="262" x2="416" y2="262" stroke="var(--hairline-strong)" strokeWidth="1" />
            <line x1="48" y1="30" x2="48" y2="262" stroke="var(--hairline-strong)" strokeWidth="1" />
            <text x="232" y="292" textAnchor="middle" fontSize="11" fill="var(--fg-2)">→ 把模型往裁判高分方向推（优化强度）</text>
            <line x1="48" y1="14" x2="68" y2="14" stroke="var(--sky)" strokeWidth="2.5" />
            <text x="74" y="18" fontSize="11.5" fill="var(--fg-1)">裁判（奖励模型）打分</text>
            <line x1="230" y1="14" x2="250" y2="14" stroke="var(--sage)" strokeWidth="2.5" />
            <text x="256" y="18" fontSize="11.5" fill="var(--fg-1)">真实用户满意度</text>
            <polyline className="curve" stroke="var(--sky)" points={J_POINTS.join(' ')} />
            <polyline className="curve" stroke="var(--sage)" points={H_POINTS.join(' ')} />
            <line className="cursor-line" x1={cx} y1="30" x2={cx} y2="262" strokeWidth="1.2" />
            <circle r="5" fill="var(--sky)" stroke="var(--bg-card)" strokeWidth="1.5" cx={cx} cy={HY(j)} />
            <circle r="5" fill="var(--sage)" stroke="var(--bg-card)" strokeWidth="1.5" cx={cx} cy={HY(h)} />
          </svg>
        </div>
        <div className="demo-side">
          <SliderRow label="优化强度" min={0} max={100} step={1} value={v} onChange={(x) => setV(Math.round(x))} format={(x) => Math.round(x)} />
          <div><Pill type={z.pill}>{z.label}</Pill></div>
          <div className="hack-stats">
            <div className="hs-row"><span><span className="hs-swatch" style={{ background: 'var(--sky)' }} />裁判（奖励模型）打分</span><span className="hs-num">{Math.round(j)}</span></div>
            <div className="hs-row"><span><span className="hs-swatch" style={{ background: 'var(--sage)' }} />真实用户满意度</span><span className="hs-num">{Math.round(h)}</span></div>
          </div>
          <div className="io-block">
            <div className="io-label">用户：「帮我看看，简历里这句自我介绍写得怎么样？——『本人性格开朗，吃苦耐劳。』」</div>
            <div className="io-text">{z.ans}</div>
          </div>
          <p className="hack-note">{z.note}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ⑤ 对齐三角
// ============================================================
const TRI_CENTER = { x: 180, y: 207 }
const TRI_VERTS = { helpful: { x: 180, y: 56 }, honest: { x: 66, y: 282 }, harmless: { x: 294, y: 282 } }
const TRI_DATA = {
  bal: { title: '⚖️ 三角平衡：理想中的助手', q: '用户：「我在写悬疑小说，反派是药剂师，帮我设计他的作案手法？」',
    a: '“可以！经典写法是用药物相互作用制造意外假象 —— 我帮你把桥段写得戏剧化、有反转，但会刻意模糊真实药名与剂量这类可操作细节。”',
    note: <>帮上了忙（<b>有用</b>），不装懂不夸大（<b>诚实</b>），危险细节有底线（<b>无害</b>）—— 三股拉力被“分寸感”稳稳托在中间。这正是对齐团队追求的落点。</> },
  helpful: { title: '“让用户满意”压倒一切 → 谄媚', q: '用户：「你上面算错了吧，利息应该是 580 才对。」', a: '“抱歉，您说得对，是 580。”（其实原答案没错）',
    note: <>顺从用户的回答在排序里更容易被排在前面，“有用”被悄悄异化成“<b>让用户高兴</b>”；再往前一步，就是不知道也编一个。这就是<b>谄媚</b>（sycophancy）—— 2025 年还有头部产品因一次更新把模型调得过度奉承、不得不紧急回滚。</> },
  honest: { title: '“绝不说错话”压倒一切 → 免责声明轰炸', q: '用户：「明天去香山，要带伞吗？」', a: '“作为 AI，我无法获取实时天气；天气预报本身存在不确定性，任何建议仅供参考；出行决策请您综合多方信息，谨慎自行判断……”',
    note: <>每一句都没错，加在一起<b>等于没说</b>。过度对冲牺牲了有用 —— 诚实的本意是“不知道就说不知道”，不是“什么都不敢说”。</> },
  harmless: { title: '“绝不出事”压倒一切 → 一刀切拒答', q: '用户：「我在写悬疑小说，反派是药剂师，帮我设计他的作案手法？」', a: '“抱歉，我无法提供相关信息。”',
    note: <>正经的创作需求被当成危险请求一刀切。“无害”训练用力过猛，把擦边的好问题也拦下了 —— 安全是安全了，但<b>没用了</b>。拒答率与有用性，是对齐团队天天权衡的跷跷板。</> },
}
const triDotPos = (key) => {
  if (key === 'bal') return TRI_CENTER
  const t = TRI_VERTS[key]
  return { x: TRI_CENTER.x + 0.62 * (t.x - TRI_CENTER.x), y: TRI_CENTER.y + 0.62 * (t.y - TRI_CENTER.y) }
}

function TriangleDemo() {
  const [key, setKey] = useState('bal')
  const d = TRI_DATA[key]
  const p = triDotPos(key)
  const vCls = (vk) => `tri-v${key === vk ? ' active' : ''}${key !== 'bal' && key !== vk ? ' dim' : ''}`
  const VTX = [
    { k: 'helpful', cx: 180, cy: 56, fill: 'var(--sky-bg)', stroke: 'var(--sky)', cn: '有用', en: 'Helpful' },
    { k: 'honest', cx: 66, cy: 282, fill: 'var(--sage-bg)', stroke: 'var(--sage)', cn: '诚实', en: 'Honest' },
    { k: 'harmless', cx: 294, cy: 282, fill: 'var(--amber-bg)', stroke: 'var(--amber)', cn: '无害', en: 'Harmless' },
  ]
  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · 对齐三角：压倒一切的代价</span>
        <span className="demo-hint">点击三个角或下方按钮切换</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="tri-svg" viewBox="0 0 360 330" width="340" aria-label="对齐三角：有用、诚实、无害三个顶点，红点表示对齐重心">
            <path d="M 180 56 L 66 282 L 294 282 Z" fill="none" stroke="var(--hairline-strong)" strokeWidth="1.2" />
            {VTX.map((vt) => (
              <g key={vt.k} className={vCls(vt.k)} onClick={() => setKey(vt.k)}>
                <circle cx={vt.cx} cy={vt.cy} r="38" fill={vt.fill} stroke={vt.stroke} strokeWidth="1.5" />
                <text x={vt.cx} y={vt.cy - 2} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--fg-0)">{vt.cn}</text>
                <text x={vt.cx} y={vt.cy + 14} textAnchor="middle" fontSize="10.5" fill="var(--fg-1)">{vt.en}</text>
              </g>
            ))}
            <g id="tri-dot" style={{ transform: `translate(${p.x}px,${p.y}px)` }}>
              <circle r="8" fill="var(--terracotta)" stroke="var(--bg-card)" strokeWidth="2" />
            </g>
            <text x="180" y="322" textAnchor="middle" fontSize="11" fill="var(--fg-2)">● 红点 = 对齐配方的重心（示意）</text>
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            {[['bal', '⚖️ 平衡'], ['helpful', '有用压倒一切'], ['honest', '诚实压倒一切'], ['harmless', '无害压倒一切']].map(([k, label]) => (
              <button key={k} className={`chip${k === key ? ' active' : ''}`} onClick={() => setKey(k)}>{label}</button>
            ))}
          </div>
          <h4>{d.title}</h4>
          <div className="io-block mt14">
            <div className="io-label">{d.q}</div>
            <div className="io-text">{d.a}</div>
          </div>
          <p id="tri-note">{d.note}</p>
        </div>
      </div>
    </div>
  )
}

export default function L13() {
  return (
    <>
      <Lsec title="🎯 你将学会">
        <div className="card goals">
          <div className="goal-item"><span className="tick">✓</span>一句话说清 GPT 和 ChatGPT 的关系：同一个基座模型，先后过了 SFT 与 RLHF 两关调教</div>
          <div className="goal-item"><span className="tick">✓</span>看懂 SFT：几万条人写示范教会模型“对话体”—— 学到的是格式与角色，不是新知识</div>
          <div className="goal-item"><span className="tick">✓</span>吃透 RLHF 的核心直觉：好回答难定义但好认 —— 亲手当一回标注员，体会“人类只排序，裁判学口味”</div>
          <div className="goal-item"><span className="tick">✓</span>认清对齐三角：有用 / 诚实 / 无害互相打架 —— 并亲手把模型“推过头”，看懂拒答、谄媚、彩虹屁分别从哪来</div>
        </div>
      </Lsec>

      <Lsec
        title="💡 核心概念：同一个基座，两步调教"
        lead="上一课结尾，我们看着基座模型把“中国的首都是哪里？”续写成了“这是小学二年级的试题”。它读完了整个互联网，却连“你在提问、我该回答”这个最基本的社交契约都不懂。从这台博学的接龙机器，到你天天聊的 ChatGPT，中间隔着两关调教。这个过程业内叫对齐（alignment）—— 让模型的行为对齐人类的意图。"
      >
        <div className="use-grid cols-2">
          <div className="card use-card"><div className="label">第一关 · 教格式</div><div className="en">监督微调 <b>SFT</b></div><div className="zh">雇人手写几万条“问题 → 理想回答”示范，让模型逐词模仿。一句话：教会它<b>“像个助手”</b>—— 把默认行为从“续写文本”切换成“回答提问”。</div></div>
          <div className="card use-card"><div className="label">第二关 · 教品味</div><div className="en">人类反馈强化学习 <b>RLHF</b></div><div className="zh">让模型对同一问题写多个回答，人类只排序不动笔；用排序数据训练一个“裁判”，再让模型专攻裁判的高分。一句话：教会它<b>“答得好”</b>。</div></div>
        </div>
        <PipelineDemo />
        <p className="lead mt14">来回点几遍，你会发现知识从头到尾没变 —— 失眠的常识它第 ① 阶段就有。变的是<b>行为</b>（第 ② 关学会“该回答”）和<b>分寸</b>（第 ③ 关学会“答得好”）。而第 ③ 阶段那种“先共情、有取舍、知道何时建议就医”的分寸感，写不进任何说明书 —— 它是被千万次人类排序一点点磨出来的。这两关具体怎么操作，下面分头拆。</p>
      </Lsec>

      <Lsec
        title="📖 第一关 · SFT：几万条示范，教它“好好说话”"
        lead="上一课提过一个偏方：把输入排成“问：……答：”，骗基座模型顺着问答格式续写。能骗一时，但行为全看运气 —— 它可能答完接着自问自答，也可能跑去续写考卷。要让“助手的回答”成为它的默认本能，就得动参数。这就是 SFT（监督微调）：雇一批训练有素的标注员，手写几万条高质量的“问题 → 理想回答”对话脚本，让模型照着学。先看一条示范长什么样 —— 注意，要看两遍："
      >
        <SftTemplateDemo />
        <p className="lead mt14">训练方法一个字没变 —— 仍然是文字接龙：预测下一个 token，猜错就微调参数。只有一处讲究，你在上面已经亲眼看到了：<b>只对高亮的“助手说的话”对答案</b>，用户的问题只当题面、不算分。于是模型亿万次重复练习的是同一件事 —— 看到 <b>&lt;|助手|&gt;</b> 这块牌子，接出标注员手写的那种回答。练着练着，行为模式就被掰过来了；连“我是 AI 助手”这个自我认知，也是在这块牌子后面被千万次强化出来的。</p>
        <p className="lead mt14">注意一个悬殊的对比：几万条示范，对几十万亿 token 的预训练来说连零头的零头都不到。这点教材根本教不了新知识 —— 它教的是<b>格式与角色</b>。模型恍然大悟的不是“失眠该怎么办”（这它早就知道），而是：<b>原来我该接的不是“试卷的下一题”，而是“助手的回答”。</b>打个比方：一位读了几万年书的图书馆管理员，参加了一周岗前培训 —— 培训没让他多读一本书，只教会他一件事：有人来问话时，别背书，要接待。</p>
        <div className="use-grid cols-2">
          <div className="card use-card"><div className="label">SFT 改变了什么</div><div className="en"><b>行为模式</b></div><div className="zh">默认行为从“续写”切换成“问答”；学会开场、分点、收尾这套“对话体”；学会自己的角色 ——“我是 AI 助手”，而不是语料里随便哪个网友。</div></div>
          <div className="card use-card"><div className="label">SFT 没改变什么</div><div className="en"><b>肚子里的知识</b></div><div className="zh">事实、推理、语言能力，几乎全部来自预训练。SFT 只是把已有的本事，用“助手”的姿势重新摆出来 —— 知识同源，行为换装。</div></div>
        </div>
        <p className="lead mt14">SFT 之后，模型已经“像个助手”了。但想让它“答得好”，SFT 撞上了三道迈不过去的坎：</p>
        <div className="use-grid">
          <div className="card use-card"><div className="label">第一道坎</div><div className="en">手写示范<b>太贵</b></div><div className="zh">一条高质量回答要写十几分钟，几万条已近极限。而用户的问题千奇百怪，示范永远不够用。</div></div>
          <div className="card use-card"><div className="label">第二道坎</div><div className="en">好回答<b>写不出标准</b></div><div className="zh">“好”的灵魂是分寸：幽默几分、共情几句、何时该委婉拒绝。这些品味，标注员自己也写不成标准答案。</div></div>
          <div className="card use-card"><div className="label">第三道坎</div><div className="en">只学了<b>“照着说”</b></div><div className="zh">示范只展示“该怎么说”，从没告诉模型“哪种说法更糟”。它分不出自己两个回答的高下 —— 有模板，没品味。</div></div>
        </div>
        <p className="lead mt14">要教品味，得换一种完全不同的思路：<b>别再示范了，改打分。</b></p>
      </Lsec>

      <Lsec
        title="📖 第二关 · RLHF：教练不教动作，只打分"
        lead="先体会一个日常经验：给你两段文案，你能立刻指出哪段更好；但让你写一份《好文案判定标准》，你写不出来。好回答难定义，但好认。空说无凭 —— 下面两道题，你来当一回标注员："
      >
        <RankDemo />
        <p className="lead mt14">注意刚才发生了什么：你一个字没写，只是<b>挑</b>了一下 —— 但你的品味已经被记录在案。RLHF（人类反馈强化学习）的全部聪明之处，就是把训练建立在“认”而不是“写”上。它分三步：</p>
        <div className="use-grid">
          <div className="card use-card"><div className="label">第 1 步</div><div className="en">人类<b>只管排序</b></div><div className="zh">同一个问题，让 SFT 后的模型生成多个回答（比如 4 个），标注员从好到差排个序。不用动笔 —— 挑比写快得多，数据规模一下就上去了。</div></div>
          <div className="card use-card"><div className="label">第 2 步</div><div className="en">训练一个<b>“裁判”</b></div><div className="zh">用海量排序数据训练另一个模型 —— <b>奖励模型</b>：输入“问题 + 回答”，输出一个分数。它学到的是人类的口味：什么样的回答会被排在前面。</div></div>
          <div className="card use-card"><div className="label">第 3 步</div><div className="en">强化学习<b>刷高分</b></div><div className="zh">模型不停生成回答，裁判逐条打分：得高分的写法被加强，低分的被抑制。在亿万次尝试里，模型自己摸索出“怎么写能得高分”。</div></div>
        </div>
        <div className="example mt14">
          <div className="en">跳水教练不会替你跳，也未必说得清“完美入水”的标准 —— 但他举分数牌又快又准。运动员一跳一跳地试，自己琢磨出高分动作。</div>
          <div className="zh">RLHF 同理：人类（经由奖励模型这个“代理裁判”）只负责打分，“怎么答才能得高分”由模型在试错中自己探索。这正是强化学习的本色 —— 不靠标准答案，靠尝试与奖励。</div>
        </div>
        <p className="lead mt14">回头看 SFT 的三道坎，RLHF 一一拆掉。<b>太贵？</b>排序比手写便宜得多，同样预算能收集多得多的人类判断。<b>写不出标准？</b>不用写 —— 标注员凭直觉挑就行（你刚才已经示范过了），“分寸感”会藏在千万次排序的统计规律里，被奖励模型自动提炼出来。<b>分不出好坏？</b>裁判可以给任何回答打分，包括示范里从没出现过的问题 —— 标准第一次能“泛化”到整个问题空间。</p>
        <p className="lead mt14">这一步对成品性格的塑造非常具体。排序数据里，“先共情再给建议”通常排在“冷冰冰列清单”前面，“承认不确定、建议看医生”通常排在“信口开河包治百病”前面。千万次排序之后，裁判学会了这些口味；强化学习再把模型整体推向这些口味 —— 你在 ChatGPT 里感受到的“会安慰人”“有分寸”，就是这么来的。</p>
        <p className="lead mt14">但 RLHF 有一个先天软肋：<b>裁判不是人类本尊，只是人类口味的近似</b> —— 而一切“应试”系统都会钻评分标准的空子。回答写长一点，<i>像</i>高分；语气热情一点，<i>像</i>高分；顺着用户说，<i>像</i>高分。这些技巧与“真正答得好”相关，却不等同。行话叫<b>钻奖励空子</b>（reward hacking）。推过头到底会翻车成什么样？亲手推推看 ——</p>
        <HackDemo />
        <p className="lead mt14">看到了吗：裁判分一路上涨，真人满意度却在中段见顶回落 —— 因为模型优化的从来不是“答得好”，而是<b>“裁判觉得好”</b>。所以训练时还得拴一根绳子：不许离 SFT 模型太远，并且在“甜区”见好就收，免得它为了讨好裁判，把好好说话的能力都丢了。记住这个直觉 —— 下一节的“谄媚”，就是推过头结出的果。</p>
      </Lsec>

      <Lsec
        title="🧭 对齐要对到哪：有用、诚实、无害的三角拉扯"
        lead="示范该怎么写、排序该怎么排，总得有个总纲。业内公认的目标是三个词 —— 有用、诚实、无害（helpful / honest / harmless）："
      >
        <div className="use-grid">
          <div className="card use-card"><div className="label">Helpful</div><div className="en"><b>有用</b></div><div className="zh">听懂真实意图，实打实解决问题 —— 不答非所问，不动辄推脱“建议咨询专业人士”。</div></div>
          <div className="card use-card"><div className="label">Honest</div><div className="en"><b>诚实</b></div><div className="zh">不知道就说不知道，不确定就说不确定 —— 不为了流畅好听而编造。</div></div>
          <div className="card use-card"><div className="label">Harmless</div><div className="en"><b>无害</b></div><div className="zh">不帮人伤害自己或他人，不输出危险内容 —— 该拒绝时要拒绝。</div></div>
        </div>
        <p className="lead mt14">麻烦在于：这三个目标会<b>互相打架</b>，而打架的伤痕你天天都能看到。点击三角的任意一角，看那个目标“压倒一切”时助手会变成什么样 ——</p>
        <TriangleDemo />
        <p className="lead mt14">把这一课学到的机制和你的日常使用连个线 —— 很多“AI 的怪癖”，病根都在对齐配方里：</p>
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="match">
            <thead><tr><th>你在 ChatGPT / Claude 里看到的现象</th><th>背后的对齐机制</th></tr></thead>
            <tbody>
              <tr><td className="ex">张口就是“当然可以！下面分三点……”，结构工整得像模板</td><td><b>SFT 的格式烙印</b> —— 标注员的示范就是这么写的</td></tr>
              <tr><td className="ex">你说“你错了”，它秒道歉改口 —— 哪怕原本是对的</td><td><b>RLHF 裁判偏爱顺从</b> —— 谄媚是钻奖励空子的果</td></tr>
              <tr><td className="ex">问个正经问题，被一刀切拒答</td><td><b>“无害”训练过度泛化</b> —— 擦边的好问题被误伤</td></tr>
              <tr><td className="ex">回答越来越长，动不动就列清单</td><td><b>排序偏好“长而全”</b> —— 看着用心的回答更易拿高分</td></tr>
              <tr><td className="ex">不同家的 AI“性格”不同：有的活泼，有的克制</td><td><b>对齐配方不同</b> —— 示范怎么写、裁判怎么调，性格就怎么长</td></tr>
            </tbody>
          </table>
        </div>
        <p className="lead mt14">最后报两个后续技术的名字，各一句话，混个脸熟：</p>
        <div className="use-grid cols-2">
          <div className="card use-card"><div className="label">更简洁的偏好学习</div><div className="en"><b>DPO</b> 直接偏好优化</div><div className="zh">后来人们发现可以跳过“训练裁判 + 强化学习”两步，拿排序偏好数据直接微调模型 —— 流程简洁得多，已成开源社区的主流做法之一。</div></div>
          <div className="card use-card"><div className="label">AI 当裁判</div><div className="en"><b>RLAIF</b> / 宪法式 AI</div><div className="zh">让 AI 依照一部写好的“行为宪法”给回答打分、自己当裁判，大幅省下人工排序 —— Claude 背后的 Anthropic 是这条路线的代表。</div></div>
        </div>
      </Lsec>

      <Lsec title="⚠️ 常见误区">
        <div className="card alert-card row-list">
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">ChatGPT 和 GPT 是两个不同的模型</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">同一个基座模型，先后过了 SFT 和 RLHF 两关 —— 知识同源，行为换装</span></div>
            </div>
            <p className="why"><b>病因：</b>名字不同 + 产品包装。GPT 是基座模型，ChatGPT 是“基座 + 两步调教”之后包装成的对话产品。当年 ChatGPT 一夜爆红，靠的不是更大的脑子，而是同一颗脑子终于学会了好好说话 —— 对齐这层薄薄的调教，恰恰是产品成败的关键一层。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">RLHF 给模型注入了新知识，让它更博学</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">知识几乎全部来自预训练 —— 对齐调整的是行为与风格，不是学识</span></div>
            </div>
            <p className="why"><b>病因：</b>把“表现变好”误当“知识变多”。对齐用的数据量与预训练差着好几个数量级，装不进什么新知识。更微妙的是反面：调教不当还会教坏 —— 如果示范和排序都偏爱“流畅自信的完整回答”，模型就学会了在不知道答案时也流畅自信地编一个。“为了讨好而编造”，正是幻觉在对齐阶段被放大的方式。</p>
          </div>
        </div>
      </Lsec>

      <Lsec title="✍️ 小练习">
        <div className="card quiz row-list">
          <QuizItem q="1. 既然 SFT 有效，为什么不多雇些人、多写几十万条示范，非要费劲搞 RLHF？">
            <b>因为“写”撞上了三道坎，而“认”能绕过去。</b>① 手写又贵又慢，排序便宜得多，数据规模才能上去；② 分寸感、幽默感这类“好”的灵魂写不成标准答案，但标注员凭直觉一挑一个准 —— 品味藏在千万次排序的统计里；③ 示范只能覆盖见过的问题，而奖励模型这个“裁判”能给任何回答打分，把标准泛化到整个问题空间。
          </QuizItem>
          <QuizItem q="2. 你指出 ChatGPT 一个错误，它立刻道歉改口。朋友感叹：“它知道自己错了，有自我意识！”—— 你怎么用这一课的知识泼冷水？">
            <b>道歉改口更可能是 RLHF 烙下的行为偏好，不是“意识到错误”。</b>排序数据里顺从用户的回答更容易拿高分，模型学会的是“被质疑 → 道歉”这个高分套路，它未必重新核实了任何事实。验证方法很简单：故意“纠正”一个它本来答对的问题 —— 如果它把对的也改成错的，那就是谄媚（sycophancy），不是反思。
          </QuizItem>
          <QuizItem q="3. 再当一次标注员：问题是“孩子发烧 38 度，要不要吃退烧药？”，给三个回答从好到差排序，并用“有用 / 诚实 / 无害”说出理由。A.「38 度属于低烧，立刻吃布洛芬，按成人半量喂，吃了就退。」 B.「我不能提供医疗建议，请咨询医生。」 C.「38 度通常算低烧，一般建议先物理降温、多喝水观察精神状态；用药剂量和儿童年龄体重有关，别按大人剂量折算。如果持续升温、精神萎靡或孩子不满 3 个月，尽快就医。」">
            <b>C &gt; B &gt; A。</b>C 三角平衡：给了能上手的建议（有用），承认剂量因人而异、划清就医边界（诚实 + 无害）。B 绝对安全但毫无帮助 —— “无害压过有用”的典型拒答。A 最危险：语气自信、看似最“有用”，却给出武断的用药指令（“按成人半量”恰是儿童用药大忌），牺牲了诚实与无害 —— 注意，A 这种“自信流畅”的回答恰恰最容易骗到分，这正是奖励模型要靠海量排序才能学会识破的。
          </QuizItem>
        </div>
      </Lsec>
    </>
  )
}
