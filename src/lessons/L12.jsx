import { useEffect, useRef, useState } from 'react'
import { Lsec, SliderRow, Pill, QuizItem } from '../components/ui.jsx'

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ============================================================
// ① 接龙训练台
// ============================================================
const NT_SENTS = {
  poem: { ctx: '床前明月光，疑是地上____', tokens: ['霜', '雪', '水', '猫'], correct: 0,
    probs: [[25, 25, 25, 25], [31, 28, 25, 16], [48, 30, 17, 5], [80, 13, 6, 1], [97, 2, 0.7, 0.3]],
    note: '古诗是“原文级”的记忆：正确接法只有一种，模型要在语料里见过足够多遍，才敢把概率全押上去。' },
  grammar: { ctx: '他学习非常努力，因此成绩____', tokens: ['提高了', '下降了', '一般', '苹果'], correct: 0,
    probs: [[25, 25, 25, 25], [46, 24, 19, 11], [71, 15, 11, 3], [89, 6, 4, 1], [96, 2, 1.5, 0.5]],
    note: '语法和常识因果在语料里铺天盖地，所以学得最早 —— 训练量不大时它就能接对这类题。' },
  fact: { ctx: '法国的首都是____', tokens: ['巴黎', '伦敦', '里昂', '香蕉'], correct: 0,
    probs: [[25, 25, 25, 25], [32, 27, 22, 19], [55, 25, 14, 6], [83, 10, 6, 1], [95, 3, 1.5, 0.5]],
    note: '“巴黎”这类世界事实要见过很多遍才能存进参数 —— 比语法学得慢，冷门事实更慢，太冷门的甚至永远记不牢。' },
  code: { ctx: 'def add(a, b): return ____', tokens: ['a + b', 'a - b', 'print(a)', '你好'], correct: 0,
    probs: [[25, 25, 25, 25], [27, 26, 24, 23], [41, 29, 21, 9], [73, 17, 9, 1], [94, 4, 1.5, 0.5]],
    note: '代码套路要等语料里的代码仓库被大量消化后才上道 —— 这就是“多喂代码，逻辑更强”的由来。' },
}
const NT_LEVELS = [
  { val: '0', name: '刚出厂：参数全随机', period: '训练量 · 0 token', desc: '千亿个旋钮还停在出厂的随机位置，它对语言一无所知，每个候选都是纯瞎猜。从这里到 ChatGPT，差的就是上万亿次“猜 → 对答案 → 拧参数”。' },
  { val: '百万级', name: '读了几书架的书', period: '训练量 · 百万级 token', desc: '最常见的规律先冒头：哪些字总挨在一起、句子大概长什么形状。但事实、诗句、代码这些“要见得多才记得住”的内容，还远远不够。' },
  { val: '十亿级', name: '读了一座图书馆', period: '训练量 · 十亿级 token', desc: '语法基本过关，常见事实开始记住。来回切换四道题对比一下 —— 进步速度明显不同：语料里越常见的规律，学得越早。' },
  { val: '万亿级', name: '读了半个互联网', period: '训练量 · 万亿级 token', desc: '冷门事实、代码套路也渐渐到位。每次比对答案只把参数拧一点点，但乘以万亿次，量变硬是堆出了质变。' },
  { val: '十万亿级', name: '读完整个互联网', period: '训练量 · 十万亿级 token', desc: '四道题全都接得又稳又准 —— 语法、事实、记忆、编程，没有一样是单独教的，全是把接龙玩到极致之后的副产品。' },
]
const BAR_X = 104, BAR_W = 244
const pctText = (p) => (p < 1 ? '<1%' : Math.round(p) + '%')

function NextTokenTrainer() {
  const [cur, setCur] = useState('poem')
  const [lvl, setLvl] = useState(0)
  const s = NT_SENTS[cur]
  const probs = s.probs[lvl]
  const L = NT_LEVELS[lvl]
  const pc = probs[s.correct]
  let grade, color
  if (pc >= 85) { grade = '接近零 —— 这道题它吃透了'; color = 'var(--sage)' }
  else if (pc >= 55) { grade = '不算高 —— 参数只需轻轻再拧几把'; color = 'var(--amber)' }
  else if (pc >= 35) { grade = '还很高 —— 每次比对都要狠拧参数'; color = 'var(--amber)' }
  else { grade = '爆表 —— 全靠瞎蒙，参数被狠狠地拧'; color = 'var(--terracotta)' }

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · 亲手把模型“喂”大</span>
        <span className="demo-hint">选接龙题 + 拖动训练量滑块</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="nt-svg" viewBox="0 0 440 318" width="420" role="img" aria-label="文字接龙训练演示：给定一段前文，模型对四个候选 token 报出概率">
            <text x="220" y="28" textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--fg-0)">{s.ctx}</text>
            <text x="220" y="52" textAnchor="middle" fontSize="11.5" fill="var(--fg-2)">模型报出的概率表（押注越高，越相信它是下一个 token）</text>
            {[0, 1, 2, 3].map((i) => {
              const y = 70 + i * 50
              const isC = i === s.correct
              return (
                <g key={i}>
                  <text x="4" y={y + 14} fontSize="13" fontWeight={isC ? 700 : 400} fill="var(--fg-0)">{s.tokens[i]}{isC ? ' ✓' : ''}</text>
                  <rect x={BAR_X} y={y} width={BAR_W} height="20" rx="10" fill="var(--bg-inset)" />
                  <rect className="bar-fill" x={BAR_X} y={y} width={(probs[i] / 100) * BAR_W} height="20" rx="10" fill={isC ? 'var(--sage)' : 'var(--sky)'} fillOpacity={isC ? 0.95 : 0.55} />
                  <text x="356" y={y + 15} fontSize="12.5" fontWeight="600" fill={isC ? 'var(--sage)' : 'var(--fg-1)'}>{pctText(probs[i])}</text>
                </g>
              )
            })}
            <text x="220" y="292" textAnchor="middle" fontSize="12" fill="var(--fg-2)">标准答案「{s.tokens[s.correct]}」就在原文里 —— 不需要任何人来标注</text>
            <text x="220" y="311" textAnchor="middle" fontSize="12.5" fontWeight="600" fill={color}>此刻的“离谱度”：{grade}</text>
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            {[['poem', '床前明月光'], ['grammar', '因果常识'], ['fact', '世界事实'], ['code', '写代码']].map(([k, label]) => (
              <button key={k} className={`chip${k === cur ? ' active' : ''}`} onClick={() => setCur(k)}>{label}</button>
            ))}
          </div>
          <SliderRow label="训练量" min={0} max={4} step={1} value={lvl} onChange={(v) => setLvl(Math.round(v))} format={() => L.val} />
          <h4>{L.name}</h4>
          <div className="period">{L.period}</div>
          <p>{L.desc}</p>
          <p>{s.note}</p>
          <p style={{ fontWeight: 600, color: 'var(--fg-0)' }}>它给标准答案「{s.tokens[s.correct]}」报的概率：{pctText(pc)}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ② 预训练流水线
// ============================================================
const PL_DATA = {
  raw: { title: '① 原料：把互联网装上卡车', desc: '主力是公开网页的全网快照（业内常用 Common Crawl，可以理解成“互联网的定期备份”），再配上书籍、百科、论文和代码仓库。生数据以数十万亿 token 计 —— 但其中大半是广告、乱码和垃圾站的胡话，远没有听上去那么美好。' },
  clean: { title: '② 清洗：最脏的活，最值钱的活', desc: '去重（同一篇爆款被转载几万次）、剥广告和导航模板、滤掉有害与隐私内容、按质量打分整页淘汰，最后像调配方一样决定代码、多语言、百科各占几成。生数据在这一步被淘汰掉一大半 —— 模型的上限就在这里定下（第 5 课“数据为王”的工业现场）。' },
  tok: { title: '③ 分词：切成模型认识的样子', desc: '干净文本被切成 token 流（第 11 课）。从这一刻起，模型眼里不再有“文章”和“句子”，只有一条几十万亿节的 token 长链，等着被一段一段截下来出接龙题。' },
  train: { title: '④ 训练：一个循环连跑几个月', desc: '截一段前文 → 猜下一个 token → 比对原文 → 反向传播拧参数。这个第 4、6 课的循环，在数万张 GPU 上昼夜连转数月、重复上万亿次。中途机器崩了，就从最近的“存档点”爬起来接着跑。' },
  base: { title: '⑤ 成品：基座模型（毛坯房）', desc: '读完了整个互联网，满腹经纶 —— 但只会续写，不会对话。它是 ChatGPT 的“毛坯房”：知识、语法、推理都已浇筑在参数里，“精装修”（调教成听话的助手）是下一课 SFT 与 RLHF 的工作。' },
}

function PipelineDemo() {
  const [key, setKey] = useState('raw')
  const cls = (k) => `pl-stage${k === key ? ' active' : ' dim'}`
  const on = (k) => ({ onClick: () => setKey(k) })
  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · 预训练流水线</span>
        <span className="demo-hint">点击图中任意一站，或下方按钮</span>
      </div>
      <div className="flow-body">
        <svg id="pl-svg" viewBox="0 0 940 220" role="img" aria-label="预训练流水线：网页书籍代码经过清洗和分词，进入预测下一个词的训练循环，产出基座模型">
          <defs>
            <marker id="plarr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--fg-2)" />
            </marker>
          </defs>
          <g className={cls('raw')} {...on('raw')}>
            <text x="69" y="24" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--fg-2)">① 原料</text>
            <rect x="10" y="46" width="118" height="36" rx="8" fill="var(--sky-bg)" stroke="var(--sky)" strokeWidth="1" />
            <text x="69" y="69" textAnchor="middle" fontSize="13" fill="var(--fg-0)">🌐 网页</text>
            <rect x="10" y="92" width="118" height="36" rx="8" fill="var(--sky-bg)" stroke="var(--sky)" strokeWidth="1" />
            <text x="69" y="115" textAnchor="middle" fontSize="13" fill="var(--fg-0)">📚 书籍 · 百科</text>
            <rect x="10" y="138" width="118" height="36" rx="8" fill="var(--sky-bg)" stroke="var(--sky)" strokeWidth="1" />
            <text x="69" y="161" textAnchor="middle" fontSize="13" fill="var(--fg-0)">💻 代码 · 论文</text>
            <text x="69" y="203" textAnchor="middle" fontSize="11" fill="var(--fg-2)">数十万亿 token 的生数据</text>
          </g>
          <line x1="134" y1="118" x2="154" y2="118" stroke="var(--fg-2)" strokeWidth="1.5" markerEnd="url(#plarr)" />
          <g className={cls('clean')} {...on('clean')}>
            <text x="232" y="24" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--fg-2)">② 清洗</text>
            <rect x="160" y="58" width="144" height="120" rx="10" fill="var(--bg-inset)" stroke="var(--hairline-strong)" strokeWidth="1" />
            <text x="232" y="84" textAnchor="middle" fontSize="13.5" fontWeight="700" fill="var(--fg-0)">数据清洗</text>
            <text x="232" y="108" textAnchor="middle" fontSize="11.5" fill="var(--fg-1)">去重 · 去广告</text>
            <text x="232" y="128" textAnchor="middle" fontSize="11.5" fill="var(--fg-1)">过滤有害内容</text>
            <text x="232" y="148" textAnchor="middle" fontSize="11.5" fill="var(--fg-1)">配比：代码 · 多语言</text>
            <text x="232" y="203" textAnchor="middle" fontSize="11" fill="var(--fg-2)">脏活累活 · 决定上限</text>
          </g>
          <line x1="308" y1="118" x2="328" y2="118" stroke="var(--fg-2)" strokeWidth="1.5" markerEnd="url(#plarr)" />
          <g className={cls('tok')} {...on('tok')}>
            <text x="392" y="24" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--fg-2)">③ 分词</text>
            <rect x="334" y="70" width="116" height="96" rx="10" fill="var(--amber-bg)" stroke="var(--amber)" strokeWidth="1" />
            <text x="392" y="102" textAnchor="middle" fontSize="13.5" fontWeight="700" fill="var(--fg-0)">分词</text>
            <text x="392" y="126" textAnchor="middle" fontSize="11.5" fill="var(--fg-1)">切成 token 流</text>
            <text x="392" y="144" textAnchor="middle" fontSize="11" fill="var(--fg-2)">（第 11 课）</text>
          </g>
          <line x1="454" y1="118" x2="474" y2="118" stroke="var(--fg-2)" strokeWidth="1.5" markerEnd="url(#plarr)" />
          <g className={cls('train')} {...on('train')}>
            <text x="593" y="24" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--fg-2)">④ 训练</text>
            <rect x="480" y="50" width="226" height="136" rx="12" fill="var(--sage-bg)" stroke="var(--sage)" strokeWidth="1.5" />
            <text x="593" y="78" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--fg-0)">「预测下一个词」循环</text>
            <text x="593" y="106" textAnchor="middle" fontSize="12.5" fill="var(--fg-0)">猜 → 比对原文 → 微调参数</text>
            <path d="M 584 146 A 16 16 0 1 1 568 130" fill="none" stroke="var(--sage)" strokeWidth="1.8" markerEnd="url(#plarr)" />
            <text x="594" y="150" fontSize="11.5" fontWeight="600" fill="var(--fg-1)">× 上万亿次</text>
            <text x="593" y="203" textAnchor="middle" fontSize="11" fill="var(--fg-2)">第 4 / 6 课的循环 · 互联网尺度</text>
          </g>
          <line x1="710" y1="118" x2="730" y2="118" stroke="var(--fg-2)" strokeWidth="1.5" markerEnd="url(#plarr)" />
          <g className={cls('base')} {...on('base')}>
            <text x="810" y="24" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--fg-2)">⑤ 成品</text>
            <rect x="736" y="62" width="148" height="112" rx="12" fill="var(--bg-inset)" stroke="var(--fg-0)" strokeWidth="1.5" />
            <text x="810" y="96" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--fg-0)">基座模型</text>
            <text x="810" y="116" textAnchor="middle" fontSize="11" fill="var(--fg-2)">Base Model</text>
            <text x="810" y="142" textAnchor="middle" fontSize="11.5" fill="var(--fg-1)">满腹经纶 · 只会续写</text>
            <text x="810" y="203" textAnchor="middle" fontSize="11" fill="var(--fg-2)">调教成助手 → 第 13 课</text>
          </g>
        </svg>
      </div>
      <div className="pl-detail">
        <div className="chips">
          {[['raw', '① 原料'], ['clean', '② 清洗'], ['tok', '③ 分词'], ['train', '④ 训练'], ['base', '⑤ 成品']].map(([k, label]) => (
            <button key={k} className={`chip${k === key ? ' active' : ''}`} onClick={() => setKey(k)}>{label}</button>
          ))}
        </div>
        <h4>{PL_DATA[key].title}</h4>
        <p>{PL_DATA[key].desc}</p>
      </div>
    </div>
  )
}

// ============================================================
// ③ 调戏一下基座模型
// ============================================================
const BP_PROMPTS = {
  q1: { input: '中国的首都是哪里？',
    base: { out: '这是小学二年级《思维训练》里的常见考题。请从下列选项中选出正确答案：A. 上海　B. 北京　C. 广州……', why: '它在续写，不是在回答：训练语料里这句话最常出现在考卷里，后面跟着的往往是选项和说明，而不是答案。' },
    asst: { out: '北京。', why: '经过下一课的调教，它理解了“这是一个提问，我该直接回答”这个社交契约。' } },
  q2: { input: '中国的首都是',
    base: { out: '北京。北京是中华人民共和国的首都，也是全国的政治和文化中心……', why: '看！知识其实早就在参数里了。把输入摆成“顺着写下去就是答案”的形状，它立刻接得又快又准 —— 问题从来不是“不知道”，而是“不听话”。' },
    asst: { out: '北京。', why: '助手模型无所谓输入的形状 —— 半句话、完整提问，怎么来都答。' } },
  q3: { input: '怎么煮溏心蛋？',
    base: { out: '怎么煎牛排？怎么烤吐司？怎么调一杯像样的油醋汁？—— 厨房新手最常搜的 20 个问题', why: '它把你的问题当成了某份“问题清单”的第一行，于是续写出第二行、第三行。对文档补全器来说，这完全合理。' },
    asst: { out: '冷水下锅，水开后转中火煮 6 分钟，捞出立刻过冰水 —— 蛋白凝固、蛋黄流心。', why: '助手模型把它当成求助，给出步骤 —— 这种“有问必答”的行为是下一课调教出来的。' } },
  q4: { input: '问：中国的首都是哪里？\n答：',
    base: { out: '北京。', why: '妙！把输入排成“问答体文档”，基座模型为了把这篇文档续写得像样，只能顺着格式写出答案 —— 这个骗术就是提示工程的雏形（第 16 课）。' },
    asst: { out: '北京。', why: '对助手模型来说这个模板属于多此一举 —— 它本来就会回答。' } },
}

function BaseModelDemo() {
  const [curP, setCurP] = useState('q1')
  const [curM, setCurM] = useState('base')
  const [typed, setTyped] = useState('')
  const timerRef = useRef(null)
  const d = BP_PROMPTS[curP][curM]

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    const text = d.out
    if (reduceMotion()) { setTyped(text); return }
    setTyped('')
    let i = 0
    timerRef.current = setInterval(() => {
      i++
      setTyped(text.slice(0, i))
      if (i >= text.length) { clearInterval(timerRef.current); timerRef.current = null }
    }, 26)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [curP, curM])

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · 调戏一下基座模型</span>
        <span className="demo-hint">换输入、换模型，看它接什么</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage io-stage">
          <div className="io-stack">
            <div className="io-block">
              <div className="io-label">你输入的文字</div>
              <div className="io-text">{BP_PROMPTS[curP].input}</div>
            </div>
            <div className={`io-block out${curM === 'asst' ? ' asst' : ''}`}>
              <div className="io-label">{curM === 'base' ? '基座模型接出 ↓' : '助手模型回答 ↓'}</div>
              <div className="io-text"><span>{typed}</span><span className="bp-caret" aria-hidden="true" /></div>
            </div>
          </div>
        </div>
        <div className="demo-side">
          <div className="side-step first">第一步 · 选一种输入</div>
          <div className="chips">
            {[['q1', '① 直接提问'], ['q2', '② 留半句话'], ['q3', '③ 求教程'], ['q4', '④ 问答模板骗术']].map(([k, label]) => (
              <button key={k} className={`chip${k === curP ? ' active' : ''}`} onClick={() => setCurP(k)}>{label}</button>
            ))}
          </div>
          <div className="side-step">第二步 · 选模型</div>
          <div className="chips">
            {[['base', '基座模型'], ['asst', '调教后的助手']].map(([k, label]) => (
              <button key={k} className={`chip${k === curM ? ' active' : ''}`} onClick={() => setCurM(k)}>{label}</button>
            ))}
          </div>
          <p>{d.why}</p>
        </div>
      </div>
    </div>
  )
}

const Fill = () => <span className="fill" />

export default function L12() {
  return (
    <>
      <Lsec title="🎯 你将学会">
        <div className="card goals">
          <div className="goal-item"><span className="tick">✓</span>一句话说清预训练在干什么：预测下一个 token，猜错就微调参数，重复上万亿次</div>
          <div className="goal-item"><span className="tick">✓</span>理解“自监督”为什么是规模的钥匙：文本自带答案，省掉人工标注，才敢拿整个互联网当教材</div>
          <div className="goal-item"><span className="tick">✓</span>想明白“压缩即智能”：为什么把接龙玩到极致，语法、事实、推理、编程全成了副产品</div>
          <div className="goal-item"><span className="tick">✓</span>看穿几个日常现象：ChatGPT 逐字蹦出文字、每次回答不一样、知识有截止日期 —— 全都对应一条本课机制</div>
          <div className="goal-item"><span className="tick">✓</span>认清刚出炉的“基座模型”：满腹经纶却只会续写 —— 并亲手“调戏”它一次，体会什么叫“知识在，但不听话”</div>
        </div>
      </Lsec>

      <Lsec
        title="💡 核心概念：一个游戏，玩上万亿次"
        lead="上一课说过，大模型眼中的世界是一串 token。这一课回答下一个问题：拿到几十万亿个 token 之后，它到底在学什么？答案朴素得让人不敢相信 —— 整个预训练只做一件事，玩文字接龙。"
      >
        <div className="use-grid">
          <div className="card use-card"><div className="label">第一步 · 出题</div><div className="en">给一段<b>前文</b></div><div className="zh">从语料里随手截一段：“床前明月光，疑是地上”—— 让模型猜下一个 token 是什么。它输出的不是一个词，而是一张<b>概率表</b>：霜 92%、雪 3%、水 1%……每个候选都有一个押注。</div></div>
          <div className="card use-card"><div className="label">第二步 · 对答案</div><div className="en">答案<b>就在原文里</b></div><div className="zh">原文的下一个字“霜”就是标准答案 —— 不用出题老师，不用阅卷员。文本的每个位置都天然自带答案，这叫<b>自监督学习</b>。</div></div>
          <div className="card use-card"><div className="label">第三步 · 微调</div><div className="en">错了就<b>拧参数</b></div><div className="zh">猜偏了？用反向传播算出每个参数该负多少责，各拧一点点 —— 正是第 4、6 课那套“猜 → 比对 → 微调”的循环。然后换下一段文字，重复上万亿次。</div></div>
        </div>
        <div className="example mt14">
          <div className="en">全部训练目标，一行就写完：把 <b>P(下一个 token | 前文)</b> 推得越高越好</div>
          <div className="zh">这是全课唯一的式子，逐个符号翻译：<b>P</b> 就是“概率”；中间那根竖线 <b>|</b> 读作“在……条件下”。整句人话：看着这段前文，原文里真正出现的那个词，你给它报的概率要越来越高。猜得越离谱，参数就拧得越狠。整个预训练，没有第二个目标。</div>
        </div>
        <p className="lead mt14">空说无凭 —— 下面这个训练台让你亲手体验一回。选一道接龙题，然后拖动“训练量”滑块，看模型怎么从纯瞎猜一步步变成押注 95% 的老手。注意一个细节：<b>四道题进步的速度不一样</b>，语料里越常见的规律，学得越早。</p>
        <NextTokenTrainer />
        <p className="lead mt14">这个游戏真正的妙处在第二步。第 2 课说过，监督学习最贵的环节是<b>人工标注答案</b> —— 标一百万张猫片就要雇一支队伍，而且标到一百万张就到头了。文字接龙的答案是文本自带的，标注成本直接归零；于是训练规模的天花板，从“雇得起多少标注员”一下子变成了“互联网有多大”。这就是大模型能“大”起来的第一个秘密：<b>不是游戏多高级，而是这个游戏可以无限供货。</b>换别的任务都做不到 —— 让模型学“翻译”，你得先雇人配好百万句对照；学“摘要”，你得先雇人写百万篇摘要；只有“预测下一个词”，整个互联网每一句话都是现成考题。</p>
      </Lsec>

      <Lsec
        title="📖 压缩即智能：接龙怎么就接出了“理解”"
        lead="一个合理的怀疑：这么简单的游戏，怎么可能玩出智能？关键在“接对”二字。互联网语料无奇不有，想把各种句子都接对，光靠背是不够的 —— 每类接龙题，都在逼模型学会一种真本事："
      >
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="match">
            <thead><tr><th>语料里真实会遇到的接龙题</th><th>想接对，就必须……</th></tr></thead>
            <tbody>
              <tr><td className="ex">“他学习非常努力，因此成绩<Fill />”</td><td><b>掌握语法和常识因果</b> —— 接“提高了”，而不是“下降了”</td></tr>
              <tr><td className="ex">“法国的首都是<Fill />”</td><td><b>记住世界事实</b> —— 肚子里必须存着“巴黎”这条知识</td></tr>
              <tr><td className="ex">侦探小说最后一页：“凶手就是<Fill />”</td><td><b>长程推理</b> —— 读懂前文几万字的伏笔，自己破一次案</td></tr>
              <tr><td className="ex">“def add(a, b): return <Fill />”</td><td><b>会写代码</b> —— 看懂函数名和参数，接出 a + b</td></tr>
            </tbody>
          </table>
        </div>
        <p className="lead mt14">现在把尺度拉满：几十万亿 token 的语料，要装进只有千亿级参数的“脑容量”里 —— 差着两个数量级，原文根本存不下。想象一个学霸备考：教科书三千页，小抄只许带一页。他不可能把原文缩印上去，只能<b>提炼</b>：把一万道例题浓缩成几条解法，把整章史实浓缩成因果脉络。模型面对的正是同一道选择题，而且它别无选择 —— 与其背下一万种“巴黎是法国首都”的说法，不如存一条事实；与其背下 GitHub 上的所有代码，不如学会语法和套路。</p>
        <p className="lead">为什么非压缩不可，还有更深一层：<b>死记硬背在这个游戏里根本拿不到高分。</b>语料里的句子千变万化，明天截出来的前文几乎必然是没见过的 —— 背原文的模型一出考场就露馅（第 5 课的过拟合）。只有提炼出规律，才能在没见过的句子上照样接对。预测得越准，说明提炼得越深 —— 这就是那句行话<b>“压缩即智能”</b>。</p>
        <p className="lead">这也解释了一个你天天在用、却很少细想的现象：让 ChatGPT“用李白的风格写一首关于程序员的诗”，互联网上并不存在这篇诗，它却能写出来 —— 因为参数里存的不是哪首诗的原文，而是“李白风格”这条<b>规律本身</b>。语法、事实、逻辑、翻译、编程，没有一样是单独教的课程，全是把一个游戏玩到极致之后的副产品。当然，硬币有反面：压缩是<b>有损</b>的，细节会被揉在一起记混 —— 这笔账先记下，到“常见误区”再算。</p>
      </Lsec>

      <Lsec
        title="📖 逐字蹦出的秘密：接龙的现场直播"
        lead="训练时玩接龙，用的时候 —— 还是玩接龙，只是反着玩：这回没有原文对答案了，模型从自己的概率表里挑一个词接上去，再把这个词贴回前文末尾，整个重算一遍、接下一个……一个字一个字往外滚，直到接出“该停了”的信号。这个“自己接自己”的玩法叫自回归生成。记住它，你在 ChatGPT 里看到的好几个“怪现象”瞬间全通了："
      >
        <div className="use-grid cols-2">
          <div className="card use-card"><div className="label">你看到的现象</div><div className="en">回答<b>一个字一个字蹦</b>出来</div><div className="zh"><b>背后机制：</b>不是打字机特效。每个 token 都是一轮完整的接龙 —— 算完一个才有下一个，你看到的是生成现场的实时直播。</div></div>
          <div className="card use-card"><div className="label">你看到的现象</div><div className="en">同一个问题，<b>每次回答不一样</b></div><div className="zh"><b>背后机制：</b>模型输出的是概率表，不是唯一答案 —— 产品按概率“抽签”挑词，抽签自然每次不同。怎么控制这个随机性，第 14 课的温度专讲。</div></div>
          <div className="card use-card"><div className="label">你看到的现象</div><div className="en">长回答有时<b>越写越跑偏</b></div><div className="zh"><b>背后机制：</b>一步错，步步错 —— 接错的词会被贴回前文，后续接龙把它当真，顺着错误继续编。它没有“反悔键”，写出去的字收不回来。</div></div>
          <div className="card use-card"><div className="label">你看到的现象</div><div className="en">输出越长<b>越慢、越贵</b></div><div className="zh"><b>背后机制：</b>接第 1000 个字时，前面 999 个字要全部重看一遍 —— 每个 token 都是一轮全量计算。这也是 API 按 token 计费的根源（第 11 课）。</div></div>
        </div>
        <p className="lead mt14">顺着这条机制还能看清它的一个天生局限：接龙模型<b>没有全局提纲</b>。它不是先打腹稿再下笔，而是写一个字算一步 —— 所以偶尔会写到一半发现前后矛盾，只能硬着头皮往回圆。怎么让模型“先打草稿、想清楚再回答”？这正是推理模型要解决的问题，第 23 课见。</p>
      </Lsec>

      <Lsec
        title="🏭 数据车间：脏活累活与天文数字"
        lead="“用整个互联网训练”听着浪漫，车间现场全是脏活累活。下面的流水线现在是可以点的 —— 从生数据到基座模型一共五站，点击任何一站看看它在干什么，然后我们放大看最脏的那一步。"
      >
        <PipelineDemo />
        <p className="lead mt14">第 ② 站最不起眼，却最要命。原始网页里满是广告、乱码、模板文字、垃圾站自动生成的胡话 —— 直接喂进去，模型学到的就是这些。各家实验室在这一步投入的工程量，不比训练本身少：</p>
        <div className="use-grid cols-2">
          <div className="card use-card"><div className="label">脏活 1</div><div className="en"><b>去重</b></div><div className="zh">同一篇爆款文被转载几万次，不去重模型就会把它死记硬背下来 —— 第 5 课的过拟合换了个马甲。</div></div>
          <div className="card use-card"><div className="label">脏活 2</div><div className="en"><b>过滤</b></div><div className="zh">剥掉广告和导航模板，剔除有害内容与隐私信息，质量分太低的页面整页扔掉 —— 互联网生数据的淘汰率高得惊人。</div></div>
          <div className="card use-card"><div className="label">细活</div><div className="en"><b>配比</b></div><div className="zh">像调配方一样决定代码、多语言、百科、对话各占几成。多喂代码，模型的逻辑推理通常更强 —— 这是业内公认的经验。</div></div>
          <div className="card use-card"><div className="label">结论</div><div className="en"><b>数据定上限</b></div><div className="zh">第 5 课说过“数据为王”，在这里应验：同样的架构与算力，数据更干净的那家赢。模型的天花板，在清洗这一步就定下了。</div></div>
        </div>
        <p className="lead mt14">最后感受一下这场游戏的尺度 —— 为什么说预训练是“巨头的游戏”：</p>
        <div className="use-grid cols-4">
          <div className="card use-card"><div className="label">训练数据</div><div className="en">十万亿级 <b>token</b></div><div className="zh">一个人每天读 8 小时，要读上几万年 —— 模型几个月“读”完。</div></div>
          <div className="card use-card"><div className="label">参数规模</div><div className="en">千亿级<b>参数</b></div><div className="zh">千亿个可学习的“旋钮”（第 3 课的权重），共同决定下一个词接什么。</div></div>
          <div className="card use-card"><div className="label">训练时长</div><div className="en">连跑<b>数月</b></div><div className="zh">数以万计的顶级 GPU 昼夜连轴转，中途崩了还得从检查点爬起来重跑。</div></div>
          <div className="card use-card"><div className="label">训练成本</div><div className="en">百万美元级<b>电费</b></div><div className="zh">仅电费就以百万美元计，整体成本更是高出一个量级 —— 牌桌上只剩少数玩家。</div></div>
        </div>
        <p className="footnote mt14">※ 以上为 2025 年前后旗舰模型的<b>数量级示意</b>，不同模型差异巨大，具体数字以各家官方披露为准。</p>
      </Lsec>

      <Lsec
        title="📖 刚出炉的基座模型：满腹经纶，却不会聊天"
        lead="烧掉几个月电费之后，你得到的并不是 ChatGPT，而是一个“基座模型”。给它一个最准确的心智模型：宇宙文档补全器 —— 无论你输入什么，它都假设这是互联网上某篇文档的开头，然后竭尽全力把这篇文档“写完”。它读完了整个互联网，但行为模式只有这一种。不信你问它一个问题 ——"
      >
        <div className="contrast">
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-ink">你以为它会答</span></div>
            <div className="big">“中国的首都是哪里？”<br />—— <span className="hl">北京。</span></div>
            <p className="note">有问有答，这是“助手”的行为。可惜，助手不是预训练直接产出的。</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-terracotta">基座模型可能接</span></div>
            <div className="big">“中国的首都是哪里？”<br />—— <span className="gap">这是小学二年级的试题。</span></div>
            <p className="note">它在老老实实地续写：训练语料里，这句话后面更常跟着考卷说明和选项 ABCD，而不是答案。</p>
          </div>
        </div>
        <p className="lead mt14">注意，问题不在于它<b>不知道</b>，而在于它<b>不听话</b>：它只有“续写”这一种行为模式，根本不懂“你在提问、我该回答”这个社交契约。下面这个试玩间里有四种输入 —— 自己换着喂喂看，重点试试第 ② 和第 ④ 种，你会亲眼看到“知识早就在参数里了，只是要摆对姿势才掏得出来”：</p>
        <BaseModelDemo />
        <p className="lead mt14">第 ④ 种输入值得多看一眼：早期玩家发现，把输入排成“问：……”换行“答：”，基座模型为了把这篇“问答体文档”续写得像样，只能乖乖写出答案 —— 这个骗术正是<b>提示工程的雏形</b>（第 16 课）。但骗术终究是骗术：它时灵时不灵，而且骗不出“礼貌”“拒绝有害请求”“承认不知道”这些助手品质。把接龙机器真正调教成有问必答、还懂规矩的助手，靠的是另一套手术：监督微调与人类反馈强化学习 —— 下一课的主角。</p>
      </Lsec>

      <Lsec title="⚠️ 常见误区">
        <div className="card alert-card row-list">
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">大模型内部存了一个原文数据库，回答问题就是去里面“查资料”</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">参数里没有一篇原文，只有有损压缩后的统计规律 —— 回答是现场生成的，不是查出来的</span></div>
            </div>
            <p className="why"><b>病因：</b>把模型当成了搜索引擎。几十万亿 token 压进千亿参数，注定是有损压缩：好处是学会了举一反三，代价是细节会“记混”—— 把相似的人名、日期、论文标题揉在一起，一本正经地编出不存在的东西。幻觉的一大根源就在这里（第 29 课细讲）。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">模型每天都在联网冲浪，持续学习新知识</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">训练截止那一刻参数就被冻结了 —— 之后发生的新闻、新梗，它一概不知道</span></div>
            </div>
            <p className="why"><b>病因：</b>把产品的“联网搜索”功能当成了模型本身的能力。重新训练一次贵到没法天天做，所以每个模型都有“知识截止日期”。想让它聊最新消息，得把资料现场喂进上下文里 —— 这套“外挂知识库”的玩法叫 RAG，第 18 课专讲。</p>
          </div>
        </div>
      </Lsec>

      <Lsec title="✍️ 小练习">
        <div className="card quiz row-list">
          <QuizItem q="1. 预训练号称“不需要人工标注”，可它明明在不停地对答案 —— 这和第 2 课“监督学习需要标注”矛盾吗？">
            <b>不矛盾。</b>预训练仍然是“有答案的学习”，只是答案不用人写 —— 原文的下一个 token 就是现成的标准答案，所以叫<b>自监督</b>。正因为省掉了人工标注这个最贵的瓶颈，数据规模才能从“百万级标注样本”推到“十万亿级 token”。
          </QuizItem>
          <QuizItem q="2. 朋友说：“它背了整个互联网，肚子里肯定存着维基百科原文，回答就是查出来的。”请用“压缩”二字反驳，并顺手解释幻觉。">
            <b>存不下。</b>几十万亿 token 的语料对千亿级参数来说大了两个数量级，模型只能做有损压缩 —— 提炼规律、丢掉原文。所以回答是“现场重新生成”而非“查找原文”；又因为压缩有损，相似的细节会被记混，于是它能一本正经地编出不存在的引文 —— 这就是幻觉的一大来源。
          </QuizItem>
          <QuizItem q="3. 给刚预训练完的基座模型输入“怎么煮溏心蛋？”，猜猜它最可能输出什么？为什么？">
            很可能<b>不是教程，而是续写</b> —— 比如接出“怎么煎牛排？怎么烤吐司？”（把它当成一份美食问题清单继续列），或者续写成论坛帖子的口吻。因为它学的是“这段文字后面最可能跟什么”，而不是“回答提问”。把它调教成有问必答的助手，是下一课 SFT 与 RLHF 的工作。
          </QuizItem>
          <QuizItem q="4. ChatGPT 的回答总是一个字一个字往外蹦 —— 这是产品经理加的“打字机特效”，还是机制使然？">
            <b>机制使然。</b>生成是自回归接龙：接出一个 token，贴回前文末尾，重算一遍再接下一个 —— 算完一个才有下一个，你看到的是现场直播。这也顺带解释了为什么输出越长越慢、API 按输出 token 计费，以及为什么它一旦接错一个词，后面会顺着错的继续编。
          </QuizItem>
        </div>
      </Lsec>
    </>
  )
}
