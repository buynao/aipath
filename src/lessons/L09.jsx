import { useState } from 'react'
import { Lsec, Pill, QuizItem } from '../components/ui.jsx'

// 词块居中布局：返回 [{x, w, cx}]
function layout(words, viewW, gap, charW, pad) {
  const widths = words.map((w) => w.length * charW + pad)
  const total = widths.reduce((s, w) => s + w, 0) + gap * (widths.length - 1)
  let x = (viewW - total) / 2
  return widths.map((w) => {
    const box = { x, w, cx: x + w / 2 }
    x += w + gap
    return box
  })
}
const selfArc = (c, y, up) => `M ${c - 12} ${y} C ${c - 28} ${y - up} ${c + 28} ${y - up} ${c + 12} ${y}`
const qArc = (x1, x2, y, h) => `M ${x1} ${y} Q ${(x1 + x2) / 2} ${y - h} ${x2} ${y}`

// ============================================================
// ① 传话游戏 vs 圆桌会议
// ============================================================
const RELAY_WORDS = ['小明', '说', '周末', '他', '要', '回家']
const RELAY_FOCUS = 3
const DECAY = [100, 70, 49, 34, 24, 17]
const RELAY_ATTN = [0.44, 0.1, 0.12, 0.2, 0.08, 0.06]
const RELAY_MODES = {
  relay: { title: '传话游戏：一张纸条传到底',
    desc: '老方法（RNN）从左到右逐词读：全句记忆压在一张小纸条上，一棒一棒往右传，每传一棒丢一点。轮到「他」想找主人时，「小明」只剩三成 —— 句子越长，开头忘得越干净。更糟的是：第 4 棒必须等第 3 棒，永远没法并行。',
    tags: ['长句必忘事', '必须排队算'] },
  attn: { title: '圆桌会议：人人直连，一步到位',
    desc: '注意力把“接力”改成“圆桌”：「他」想找主人，直接回头看「小明」—— 中间隔 3 个词还是 3 万个词，都是一步直达、零磨损。并且每个词的环顾互不等待、同时开工 —— 正合 GPU 的胃口，大模型训得动全靠这一点。',
    tags: ['距离不衰减', '全员并行'] },
}

function RelayDemo() {
  const [mode, setMode] = useState('relay')
  const VIEW_W = 440, WORD_Y = 128, WORD_H = 36, GAP = 14, PCT_Y = 190
  const boxes = layout(RELAY_WORDS, VIEW_W, GAP, 20, 18)
  const m = RELAY_MODES[mode]
  const maxA = Math.max(...RELAY_ATTN)

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · 「他」是谁？两种读法的命运</span>
        <span className="demo-hint">点按钮切换读法 · 数值为教学示意</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="relay-svg" viewBox="0 0 440 200" width="420" aria-label="对比演示：老方法逐词传递信息逐渐衰减，注意力让「他」直接连线「小明」">
            {mode === 'relay' ? (
              <>
                <text x={VIEW_W / 2} y="22" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--fg-2)">圆点 = 纸条里「小明」信息的残留浓度</text>
                {boxes.map((box, i) => (
                  <g key={'d' + i}>
                    <circle className="attn-arc" cx={box.cx} cy={WORD_Y - 56} r="10" fill="var(--terracotta)" fillOpacity={(DECAY[i] / 100).toFixed(2)} stroke="var(--terracotta)" strokeOpacity="0.5" />
                    <text x={box.cx} y={WORD_Y - 34} textAnchor="middle" fontSize="11" fontWeight={i === RELAY_FOCUS ? 700 : 500} fill={i === RELAY_FOCUS ? 'var(--terracotta)' : 'var(--fg-2)'}>{DECAY[i]}%</text>
                  </g>
                ))}
                {boxes.slice(0, -1).map((box, i) => {
                  const y = WORD_Y + WORD_H / 2
                  const x1 = box.x + box.w + 2, x2 = boxes[i + 1].x - 2
                  return (
                    <g key={'a' + i}>
                      <line className="attn-arc" x1={x1} y1={y} x2={x2 - 6} y2={y} stroke="var(--fg-2)" strokeWidth="2" />
                      <path className="attn-arc" d={`M ${x2 - 7} ${y - 5} L ${x2} ${y} L ${x2 - 7} ${y + 5} Z`} fill="var(--fg-2)" />
                    </g>
                  )
                })}
              </>
            ) : (
              <>
                {RELAY_ATTN.map((w, j) => {
                  const sw = (1 + w * 16).toFixed(1)
                  const op = Math.min(0.95, 0.2 + w * 1.6).toFixed(2)
                  const d = j === RELAY_FOCUS ? selfArc(boxes[j].cx, WORD_Y, 38)
                    : qArc(boxes[RELAY_FOCUS].cx, boxes[j].cx, WORD_Y, 32 + Math.abs(boxes[j].cx - boxes[RELAY_FOCUS].cx) * 0.32)
                  return <path key={j} className="attn-arc" d={d} fill="none" stroke="var(--sky)" strokeWidth={sw} strokeLinecap="round" opacity={op} />
                })}
                {boxes.map((box, j) => (
                  <text key={'p' + j} x={box.cx} y={PCT_Y} textAnchor="middle" fontSize="11" fontWeight={RELAY_ATTN[j] === maxA ? 700 : 500} fill={RELAY_ATTN[j] === maxA ? 'var(--fg-0)' : 'var(--fg-2)'}>{Math.round(RELAY_ATTN[j] * 100)}%</text>
                ))}
              </>
            )}
            {RELAY_WORDS.map((word, i) => {
              const box = boxes[i]
              const sel = i === RELAY_FOCUS
              return (
                <g key={'w' + i}>
                  <rect x={box.x} y={WORD_Y} width={box.w} height={WORD_H} rx="9" fill={sel ? 'var(--accent)' : 'var(--bg-inset)'} stroke={sel ? 'var(--accent)' : 'var(--hairline-strong)'} strokeWidth="1.2" />
                  <text x={box.cx} y={WORD_Y + 24} textAnchor="middle" fontSize="15" fontWeight="600" fill={sel ? 'var(--on-accent)' : 'var(--fg-0)'}>{word}</text>
                </g>
              )
            })}
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            {[['relay', '传话游戏 · 老方法 RNN'], ['attn', '圆桌会议 · 注意力']].map(([k, label]) => (
              <button key={k} className={`chip${k === mode ? ' active' : ''}`} onClick={() => setMode(k)}>{label}</button>
            ))}
          </div>
          <h4 style={{ marginTop: 14 }}>{m.title}</h4>
          <p>{m.desc}</p>
          <div className="tags">{m.tags.map((t) => <Pill key={t} type="ink">{t}</Pill>)}</div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ② 注意力透视镜
// ============================================================
const SENTS = {
  a: { name: '例句 A · 「苹果 发布 了 新 手机」', words: ['苹果', '发布', '了', '新', '手机'], defaultIdx: 0,
    weights: [[0.3, 0.28, 0.04, 0.08, 0.3], [0.3, 0.3, 0.06, 0.1, 0.24], [0.12, 0.45, 0.25, 0.06, 0.12], [0.1, 0.14, 0.06, 0.25, 0.45], [0.22, 0.18, 0.04, 0.28, 0.28]],
    desc: ['它把最重的注意力分给了「发布」和「手机」。这两个邻居告诉它：这里的苹果是一家科技公司 —— 吸收之后，它的新表示明显偏向“公司”。', '动词在找自己的搭档：重点看「苹果」（谁发布）和「手机」（发布什么）—— 主语和宾语各拉一条粗线。', '虚词没什么独立含义，几乎贴着「发布」—— 它的任务只是给动词补上“已完成”的信息。', '形容词死死盯住「手机」—— 它在确认自己修饰的名词是谁。', '它看「新」（被谁修饰），也回看「苹果」「发布」—— 确认自己是这场发布会的主角。'] },
  b: { name: '例句 B · 「这个 苹果 真 甜」', words: ['这个', '苹果', '真', '甜'], defaultIdx: 1,
    weights: [[0.3, 0.45, 0.08, 0.17], [0.18, 0.3, 0.1, 0.42], [0.07, 0.18, 0.25, 0.5], [0.08, 0.4, 0.22, 0.3]],
    desc: ['指示词紧贴「苹果」—— 它的职责就是宣告：我说的是眼前这一个。', '换了一句话，它把最重的注意力压在「甜」上 —— 只有水果才会甜，公司不会。对比例句 A：同一个词，因为邻居不同，吸收后的新表示完全不同。', '程度副词盯着「甜」—— 它修饰的是“甜”到什么程度。', '它回头看「苹果」确认是谁甜，顺便接收「真」递来的加强语气。'] },
  c: { name: '例句 C · 「小猫 追 蝴蝶 ，它 跑得 飞快」', words: ['小猫', '追', '蝴蝶', '它', '跑得', '飞快'], defaultIdx: 3,
    weights: [[0.3, 0.26, 0.12, 0.16, 0.1, 0.06], [0.3, 0.24, 0.3, 0.06, 0.06, 0.04], [0.1, 0.38, 0.3, 0.08, 0.08, 0.06], [0.42, 0.08, 0.14, 0.22, 0.08, 0.06], [0.26, 0.1, 0.06, 0.26, 0.2, 0.12], [0.1, 0.12, 0.06, 0.16, 0.34, 0.22]],
    desc: ['主角在确认自己的动作：重点看「追」—— 我在干什么；也分一份给「它」，因为后半句还会再提到自己。', '动词照例找搭档：左手「小猫」（谁在追），右手「蝴蝶」（追什么）—— 各拉一条粗线，句子骨架就立住了。', '被追的一方紧盯「追」—— 确认自己在这个动作里当宾语。', '本句的明星：「它」把最重的 42% 压回「小猫」—— 跑得飞快的是小猫。注意「蝴蝶」也分到 14%：指代有歧义时，权重也会犹豫着分裂，不会全押一边。这就是 Q/K/V 那场“图书馆借书”的最终账单。', '动作在找主人：看「它」，再顺着「它」回看「小猫」—— 一层层叠起来，远亲也能连上。', '程度词看着「跑得」—— 我修饰的是跑的速度；顺带看一眼「它」，确认这速度属于谁。'] },
}

function AttnLensDemo() {
  const [curKey, setCurKey] = useState('a')
  const [curIdx, setCurIdx] = useState(SENTS.a.defaultIdx)
  const VIEW_W = 440, WORD_Y = 152, WORD_H = 36, GAP = 14, PCT_Y = 208
  const sent = SENTS[curKey]
  const boxes = layout(sent.words, VIEW_W, GAP, 20, 18)
  const weights = sent.weights[curIdx]
  const maxW = Math.max(...weights)
  const ranked = weights.map((w, j) => ({ w, label: j === curIdx ? '自己' : sent.words[j] })).sort((p, q) => q.w - p.w).slice(0, 3)

  const select = (key) => { setCurKey(key); setCurIdx(SENTS[key].defaultIdx) }

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 同一个「苹果」，两种眼神；一个「它」，当场认主</span>
        <span className="demo-hint">点击词块切换视角 · 权重为教学示意值</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="attn-svg" viewBox="0 0 440 224" width="420" aria-label="注意力权重示意图：从选中的词向句中所有词画弧线，线越粗表示注意力权重越大">
            {weights.map((w, j) => {
              const sw = (1 + w * 16).toFixed(1)
              const op = Math.min(0.95, 0.2 + w * 1.6).toFixed(2)
              const d = j === curIdx ? selfArc(boxes[j].cx, WORD_Y, 40)
                : qArc(boxes[curIdx].cx, boxes[j].cx, WORD_Y, 36 + Math.abs(boxes[j].cx - boxes[curIdx].cx) * 0.34)
              return <path key={j} className="attn-arc" d={d} fill="none" stroke="var(--sky)" strokeWidth={sw} strokeLinecap="round" opacity={op} />
            })}
            {sent.words.map((word, i) => {
              const box = boxes[i]
              const sel = i === curIdx
              const strongest = weights[i] === maxW
              return (
                <g key={i} className="attn-word" tabIndex={0} role="button" aria-label={`选中「${word}」，查看它的注意力分布`}
                  onClick={() => setCurIdx(i)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCurIdx(i) } }}>
                  <rect x={box.x} y={WORD_Y} width={box.w} height={WORD_H} rx="9" fill={sel ? 'var(--accent)' : 'var(--bg-inset)'} stroke={sel ? 'var(--accent)' : 'var(--hairline-strong)'} strokeWidth="1.2" />
                  <text x={box.cx} y={WORD_Y + 24} textAnchor="middle" fontSize="15" fontWeight="600" fill={sel ? 'var(--on-accent)' : 'var(--fg-0)'}>{word}</text>
                  <text x={box.cx} y={PCT_Y} textAnchor="middle" fontSize="11" fontWeight={strongest ? 700 : 500} fill={strongest ? 'var(--fg-0)' : 'var(--fg-2)'}>{Math.round(weights[i] * 100)}%</text>
                </g>
              )
            })}
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            {[['a', '苹果发布了新手机'], ['b', '这个苹果真甜'], ['c', '小猫追蝴蝶，它跑得飞快']].map(([k, label]) => (
              <button key={k} className={`chip${k === curKey ? ' active' : ''}`} onClick={() => select(k)}>{label}</button>
            ))}
          </div>
          <h4 style={{ marginTop: 14 }}>「{sent.words[curIdx]}」在看谁？</h4>
          <div className="period">{sent.name}</div>
          <p>{sent.desc[curIdx]}</p>
          <div className="tags">{ranked.map((t, k) => <Pill key={k} type={k === 0 ? 'sage' : 'ink'}>{t.label} {Math.round(t.w * 100)}%</Pill>)}</div>
          <p className="footnote">权重由本课手工设计、用于演示直觉；真实模型的权重由训练得出，且每层每头都不同。</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ③ 多头注意力
// ============================================================
const HEAD_WORDS = ['苹果', '发布', '了', '新', '手机', '它', '很', '轻薄']
const HEADS = {
  syntax: { color: 'var(--amber)', arcs: [[3, 4, 0.9], [1, 0, 0.75], [1, 4, 0.7], [6, 7, 0.85]], title: '语法头 · 搭句子骨架',
    desc: '它盯“谁修饰谁、谁是谁的主语宾语”：「新」挂上「手机」、「发布」左手牵「苹果」右手牵「手机」、「很」黏住「轻薄」。这类头先把句子的承重墙立起来。', tags: ['新 → 手机', '发布 → 苹果·手机', '很 → 轻薄'] },
  coref: { color: 'var(--terracotta)', arcs: [[5, 4, 0.95], [5, 0, 0.3]], title: '指代头 · 「它」指谁',
    desc: '最重的一条线把「它」连回「手机」—— 轻薄的是手机，不是苹果公司。注意它还试探地看了一眼「苹果」：指代常有歧义，这个头的权重也不会全押一边。', tags: ['它 → 手机（重）', '它 → 苹果（轻）'] },
  sem: { color: 'var(--sage)', arcs: [[0, 4, 0.85], [0, 1, 0.6], [4, 7, 0.6], [0, 7, 0.35]], title: '语义头 · 谁和谁一伙',
    desc: '「苹果」「发布」「手机」「轻薄」互相拉紧成“科技一伙”—— 正是这股拉力，把这一句里的「苹果」拽向科技公司，而不是水果摊。', tags: ['苹果 ↔ 手机', '科技一伙抱团'] },
  all: { title: '三个头拼起来 = 多头注意力',
    desc: '三个头各画各的线、互不商量，各得一份小笔记；最后拼接、融合成这一层的输出。真实大模型一层往往就有几十个头、再叠几十层 —— 没有哪个头看见全貌，拼起来才是“理解”。', tags: ['语法头', '指代头', '语义头', '拼接融合'] },
}

function MultiHeadDemo() {
  const [key, setKey] = useState('syntax')
  const VIEW_W = 480, WORD_Y = 150, WORD_H = 34, GAP = 10
  const boxes = layout(HEAD_WORDS, VIEW_W, GAP, 18, 16)
  const head = HEADS[key]

  const arcPaths = []
  const involved = {}
  const pushArcs = (arcs, color, thin) => {
    arcs.forEach((a, i) => {
      const x1 = boxes[a[0]].cx, x2 = boxes[a[1]].cx, w = a[2]
      const h = 26 + Math.abs(x2 - x1) * 0.3
      arcPaths.push({
        key: color + i + a[0] + a[1], d: qArc(x1, x2, WORD_Y, h), color,
        sw: ((thin ? 1 : 1.5) + w * (thin ? 4 : 5.5)).toFixed(1), op: (0.35 + w * 0.55).toFixed(2),
      })
    })
  }
  if (key === 'all') {
    ['syntax', 'coref', 'sem'].forEach((k) => pushArcs(HEADS[k].arcs, HEADS[k].color, true))
  } else {
    pushArcs(head.arcs, head.color, false)
    head.arcs.forEach((a) => { involved[a[0]] = head.color; involved[a[1]] = head.color })
  }

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎭 交互演示 · 一句话，三种划重点的方式</span>
        <span className="demo-hint">点按钮切换“头” · 连线为教学示意</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="head-svg" viewBox="0 0 480 200" width="460" aria-label="多头注意力演示：同一句话，语法头、指代头、语义头各自画出不同的关注连线">
            {arcPaths.map((p) => (
              <path key={p.key} className="attn-arc" d={p.d} fill="none" stroke={p.color} strokeWidth={p.sw} strokeLinecap="round" opacity={p.op} />
            ))}
            {HEAD_WORDS.map((word, i) => {
              const box = boxes[i]
              const hl = involved[i]
              return (
                <g key={i}>
                  <rect x={box.x} y={WORD_Y} width={box.w} height={WORD_H} rx="8" fill="var(--bg-inset)" stroke={hl || 'var(--hairline-strong)'} strokeWidth={hl ? 1.8 : 1.2} />
                  <text x={box.cx} y={WORD_Y + 23} textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--fg-0)">{word}</text>
                </g>
              )
            })}
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            {[['syntax', '语法头'], ['coref', '指代头'], ['sem', '语义头'], ['all', '三头拼起来']].map(([k, label]) => (
              <button key={k} className={`chip${k === key ? ' active' : ''}`} onClick={() => setKey(k)}>{label}</button>
            ))}
          </div>
          <h4 style={{ marginTop: 14 }}>{head.title}</h4>
          <p>{head.desc}</p>
          <div className="tags">{head.tags.map((t) => <Pill key={t} type="ink">{t}</Pill>)}</div>
        </div>
      </div>
    </div>
  )
}

export default function L09() {
  return (
    <>
      <Lsec title="🎯 你将学会">
        <div className="card goals">
          <div className="goal-item"><span className="tick">✓</span>一句话说清注意力在干什么：每个词环顾四周，按相关性加权吸收邻居的信息</div>
          <div className="goal-item"><span className="tick">✓</span>明白它为什么非存在不可：在“传话游戏 vs 圆桌会议”演示里，亲眼看老方法怎么把长句忘光</div>
          <div className="goal-item"><span className="tick">✓</span>用一次“图书馆借书”看懂 Q、K、V 三个角色 —— 全程人话，零数学门槛</div>
          <div className="goal-item"><span className="tick">✓</span>理解多头注意力为什么要“多头”，并亲手切换语法头 / 指代头 / 语义头，看它们各划各的重点</div>
          <div className="goal-item"><span className="tick">✓</span>点开三个句子：看同一个「苹果」因上下文关注完全不同的词，看「它」如何找到自己的主人</div>
          <div className="goal-item"><span className="tick">✓</span>能解释你在 ChatGPT / Claude 里的日常体验：为什么长对话记得住开头、为什么聊得越久越慢越贵</div>
        </div>
      </Lsec>

      <Lsec
        title="💡 核心概念：固定的坐标，装不下流动的语义"
        lead="第 8 课给了每个词一个向量坐标，但那个坐标是固定的——像印进字典就不再改动。可「苹果发布了新手机」和「这个苹果真甜」里，分明是两个“苹果”：一家公司、一种水果。一个点装不下两个意思。注意力机制的使命，就是把“字典坐标”升级成“现场坐标”。"
      >
        <div className="contrast">
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-terracotta">第 8 课的困境</span></div>
            <div className="big">「苹果」永远停在<span className="gap">同一个点</span>上</div>
            <p className="note">静态 embedding 是查字典：一词一坐标，不管上下文。多义词被迫压扁成一个“平均含义”，公司和水果挤在同一个向量里。</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">注意力的解法</span></div>
            <div className="big">每个词<span className="hl">环顾四周</span>，当场重新定位</div>
            <p className="note">看见「发布」「手机」，这个「苹果」就漂向科技公司；看见「甜」，那个「苹果」就漂向水果。新表示是<b>上下文化</b>的 —— 每句话现算一次。</p>
          </div>
        </div>
        <p className="lead mt">它的做法说穿了只有三步 —— 句中<b>每个词</b>都各自做一遍：</p>
        <div className="card">
          <table className="match">
            <thead><tr><th>步骤</th><th>干什么</th><th>一句话画面</th></tr></thead>
            <tbody>
              <tr><td className="be">① 打分</td><td>对句中所有词（<b>包括自己</b>）各打一个相关性分数</td><td className="ex">“你和我有多大关系？”</td></tr>
              <tr><td className="be">② 换算</td><td>把高低不一的分数换算成一组<b>总和为 100%</b> 的“吸收比例”</td><td className="ex">“按关系亲疏分配预算”</td></tr>
              <tr><td className="be">③ 吸收</td><td>按比例把所有词的信息混合起来，得到自己的新表示</td><td className="ex">“重要的邻居多听，无关的少听”</td></tr>
            </tbody>
          </table>
        </div>
        <p className="lead mt">就这么多。所谓“划重点”，本质是一次<b>按相关性混合信息</b>的操作：比例大的词，在新表示里占的份额就大。你发给 ChatGPT 的每一句话，里面的每个词都要过这道工序 —— 而且是几十层、每层几十遍地反复过。</p>
      </Lsec>

      <Lsec
        title="🧗 为什么非它不可：从“传话游戏”到“圆桌会议”"
        lead="在注意力出现之前（2017 年以前），主流方法（RNN，循环神经网络）是从左到右逐词读的：整句话的记忆被压缩在一张“小纸条”上，一棒一棒往右传。这个设计有两处致命伤，恰好都被注意力一次治好 —— 点下面两个按钮对比："
      >
        <RelayDemo />
        <p className="lead mt">把两处治好的地方说透 ——</p>
        <div className="use-grid cols-2">
          <div className="card use-card">
            <div className="label">致命伤一 · 远距离失忆</div>
            <div className="en">纸条传得越远，<b>磨损越狠</b></div>
            <div className="zh">“我小时候在外婆家养的那只总爱晒太阳的猫……<b>它</b>”—— 传话式读法走到「它」时，开头的「猫」早被一路的新词冲淡了。注意力则让「它」直接回头看「猫」：<b>隔 3 个词和隔 3 万个词，都是一步直达、零磨损</b>。这就是大模型能“读”几十万字长文的根基。</div>
          </div>
          <div className="card use-card">
            <div className="label">致命伤二 · 必须排队</div>
            <div className="en">第 4 棒必须<b>等第 3 棒</b></div>
            <div className="zh">传话是串行的：后一个词必须等前一个词处理完，几万词的文章就得老老实实传几万棒，GPU 上千个计算单元只能干瞪眼。注意力让<b>所有词同时环顾、同时开工</b> —— 训练速度起飞，模型才堆得起后来的千亿参数（第 15 课）。</div>
          </div>
        </div>
        <p className="lead mt">一句话总结：注意力不是“锦上添花的小改进”，而是同时解决了<b>记不住</b>和<b>算不快</b>两大瓶颈的换代方案。2017 年那篇论文标题说得直白 ——《Attention Is All You Need》（注意力就是你的全部所需），它催生的架构就是下一课的主角 Transformer。</p>
      </Lsec>

      <Lsec
        title="📚 Q、K、V：到图书馆借一次书"
        lead="前面的“打分”具体怎么打？工程上，每个词的向量会分别过三道训练学出来的“变身工序”，分裂成三个角色 —— 就像同一个人在图书馆里可以既是提问的读者、又是被检索的藏书。想象你走进一座图书馆："
      >
        <div className="use-grid">
          <div className="card use-card">
            <div className="label">Q · 我想找什么</div>
            <div className="en">Query <b>提问单</b></div>
            <div className="zh">这个词作为“读者”发出的问题。比如「它」的 Query 大致在问：<b>我指代的是谁？</b></div>
          </div>
          <div className="card use-card">
            <div className="label">K · 我能被怎么找到</div>
            <div className="en">Key <b>索引标签</b></div>
            <div className="zh">每个词挂出的检索标签，声明“我这里有什么”。「小猫」的 Key 大致写着：<b>我是个动物名词、本句主角</b>。</div>
          </div>
          <div className="card use-card">
            <div className="label">V · 我实际提供什么</div>
            <div className="en">Value <b>书的内容</b></div>
            <div className="zh">真正被吸收的信息本体。匹配成功后，借走的是 Value —— 标签只用来找书，内容才是收获。</div>
          </div>
        </div>
        <p className="lead mt">拿「小猫追蝴蝶，它跑得飞快」里的「它」当读者，把借书全程走一遍 ——</p>
        <div className="use-grid cols-2">
          <div className="card use-card">
            <div className="label">第 1 步 · 递出提问单（Q）</div>
            <div className="en">「它」在找<b>一个刚出场的主角</b></div>
            <div className="zh">「它」的提问单大致写着：“我指代谁？最好是个会动的、刚被提到的家伙。” 这张单子不是谁规定的，是训练中自己学出来的提问方式。</div>
          </div>
          <div className="card use-card">
            <div className="label">第 2 步 · 逐一对标签（K）</div>
            <div className="en">挨个对照，<b>各打一个分</b></div>
            <div className="zh">拿提问单对全馆标签：「小猫」的标签“动物·本句主角”——高分；「蝴蝶」“动物·配角”——中等分；「追」“动作”——低分。提问和标签越对路，分越高。</div>
          </div>
          <div className="card use-card">
            <div className="label">第 3 步 · 换算借阅比例</div>
            <div className="en">分数 → <b>总和 100% 的比例</b></div>
            <div className="zh">高低分被换算成借阅配额：小猫 42%、蝴蝶 14%、其余拿零头。注意：<b>谁都不会被完全拒借</b> —— 分低只是借得少，这让模型不会武断地“一票否决”。</div>
          </div>
          <div className="card use-card">
            <div className="label">第 4 步 · 按比例摘抄（V）</div>
            <div className="en">汇编成「它」的<b>新笔记</b></div>
            <div className="zh">按配额从每本书摘抄内容，汇成一份新笔记 —— 这就是「它」的上下文化新表示。从这一刻起，「它」的向量里流着 42% 的「小猫」：模型“知道”了它指谁。</div>
          </div>
        </div>
        <div className="example mt">
          <div className="en formula-line">Attention(Q, K, V) = softmax( QKᵀ / √d ) · V</div>
          <div className="zh" style={{ textAlign: 'center' }}>整门课唯一的一行公式，看不懂完全不影响 —— 它说的就是上面四步，下表逐项翻译成图书馆里的动作。</div>
        </div>
        <div className="card mt">
          <table className="match">
            <thead><tr><th>公式片段</th><th>图书馆里的动作</th><th>实际在干什么</th></tr></thead>
            <tbody>
              <tr><td className="be">QKᵀ</td><td>拿提问单逐一对照所有书的索引标签</td><td className="ex">每对词打一个相关性分数 —— 第 8 课“方向越一致越相关”的直觉，在这里上岗</td></tr>
              <tr><td className="be">÷ √d</td><td>管理员把分数整体压一压</td><td className="ex">向量越长分数天然越大，先压一压，免得换算比例时一家独大、训练不稳</td></tr>
              <tr><td className="be">softmax</td><td>把对照结果换算成“借阅比例”，总和 100%</td><td className="ex">原始分数 → 一组总和为 100% 的注意力权重（“换算比例”这个动作的学名）</td></tr>
              <tr><td className="be">· V</td><td>按比例从每本书摘抄内容，汇编成笔记</td><td className="ex">把所有 Value 按比例混合 —— 这份“笔记”就是该词的新表示</td></tr>
            </tbody>
          </table>
        </div>
        <p className="footnote mt">为什么要把一个词拆成三个角色？因为“我想找什么”和“我能提供什么”经常不是一回事：「它」最想找的是别人（主语），自己能提供的信息却很少。拆开 Q 和 K，模型才能学会这种不对称的眼神。</p>
      </Lsec>

      <Lsec
        title="🎛️ 注意力透视镜：点一个词，看它在看谁"
        lead="三句话任你拆。点击任意词块，弧线会从它伸向句中所有词（含一条绕回自己的小环）——线越粗越深，注意力权重越大，词下方标出百分比，总和为 100%。建议的玩法：先对比前两句里的「苹果」，再到第三句点「它」，亲眼看刚才那场“图书馆借书”的结果。"
      >
        <AttnLensDemo />
      </Lsec>

      <Lsec
        title="🎭 多头注意力：几十位编辑，各划各的重点"
        lead="一次注意力 = 一种“看法”。可语言里值得关注的关系远不止一种：语法上谁搭配谁、指代上谁是谁、语义上谁和谁一伙……一个头忙不过来，于是把向量切成若干份，让多个“头”并行各看各的，比如："
      >
        <div className="use-grid">
          <div className="card use-card">
            <div className="label">有的头 · 盯语法搭配</div>
            <div className="en">谁修饰谁</div>
            <div className="zh">「新」该挂在哪个名词上？「发布」的主语和宾语在哪？这类头把句子的骨架搭起来。</div>
          </div>
          <div className="card use-card">
            <div className="label">有的头 · 盯指代关系</div>
            <div className="en">「它」指谁</div>
            <div className="zh">「小猫追蝴蝶，它跑得飞快」—— 这类头负责把「它」重重地连回「小猫」。</div>
          </div>
          <div className="card use-card">
            <div className="label">有的头 · 盯语义关联</div>
            <div className="en">谁和谁一伙</div>
            <div className="zh">「苹果」「甜」「手机」谁跟谁亲？多义词主要靠这类头认清自己这次是什么意思。</div>
          </div>
        </div>
        <p className="lead mt">空说不如亲手切。同一句「苹果发布了新手机，它很轻薄」，三个头各画各的线 —— 切换看看每个头眼里的句子长什么样，最后点“拼起来”：</p>
        <MultiHeadDemo />
        <p className="lead mt">每个头独立做一遍“打分 → 换算比例 → 吸收”，各得一份小笔记，最后<b>拼接起来</b>再融合成完整的新表示。GPT 级别的模型每层往往有几十个头、再叠几十层 —— 一句话被翻来覆去“划重点”的次数，远超任何人类读者。</p>
        <p className="footnote">诚实备注：头的分工是训练中自己“长”出来的，没有人规定“3 号头管指代”。研究者只是在事后分析里观察到，确实有不少头呈现出这类清晰可辨的职能 —— 也有大量头的职能至今没人看得懂。</p>
      </Lsec>

      <Lsec
        title="📖 深入展开｜在 ChatGPT 体内：你看到的“灵性瞬间”，多半是注意力在干活"
        lead="先记住一个事实：模型生成回答时，每吐一个新词，都要让它对前文的全部内容做一遍本课的“环顾” —— 你的提问、它自己刚说过的话、几十轮之前的闲聊，统统在被打分的名单上。懂了这一点，很多日常体验就有了解释："
      >
        <table className="match card">
          <thead><tr><th>你在 ChatGPT / Claude 里看到的现象</th><th>背后的注意力机制</th></tr></thead>
          <tbody>
            <tr><td className="be">聊了几十轮，它还记得你开头说的名字</td><td className="ex">生成每个新词都要环顾全部历史，名字隔得再远也是一步直达 —— 前提是还没被挤出上下文窗口（第 17 课）。</td></tr>
            <tr><td className="be">你说“把刚才第二点展开讲讲”，它知道指什么</td><td className="ex">指代头把「第二点」连回前文对应段落 —— 和「它」连回「小猫」是同一种本事，只是连线跨得更远。</td></tr>
            <tr><td className="be">你贴半截代码让它续写，命名和缩进风格保持一致</td><td className="ex">续写的每个新词都在按比例吸收前文的命名习惯、格式风格 —— “风格”就藏在注意力的权重分布里。</td></tr>
            <tr><td className="be">同一个词，放进不同问题里它理解得不一样</td><td className="ex">上下文化表示每次都现场重算：你问“苹果股价”和“苹果热量”，体内那个「苹果」吸收的邻居完全不同。</td></tr>
          </tbody>
        </table>
        <p className="lead mt">还有一层容易被忽略的纵深：注意力是<b>层层叠加</b>的。第 1 层里，「苹果」只能吸收字面邻居的信息；到第 5 层，它吸收的邻居已经各自吸收过自己的邻居 —— 信息像涟漪一样扩散；到第 20 层，它身上携带的可能是“整段话在聊产品发布会”这种段落级的理解。几十层 × 每层几十个头，一句话被划重点几百遍 —— 所谓“深度”理解，就是这么一层层垒出来的。</p>
        <div className="example mt">
          <div className="en">一个对话现场的小推论：<span className="hl">“重要的话放最后说”为什么常常有效</span></div>
          <div className="zh">注意力虽然能直连任意距离，但权重终究是分出来的 —— 上下文越长，每个词分到的关注越稀。把关键指令放在提示词的开头或结尾、而不是埋在中段，往往更容易被“划中重点”。这条提示词技巧的原理（lost in the middle 现象），第 16、17 课会专门展开。</div>
        </div>
      </Lsec>

      <Lsec
        title="📖 深入展开｜它的局限：每对词都要握手，账单按平方涨"
        lead="圆桌会议的代价是握手次数。每个词都要和每个词打一遍分：10 个词的句子要打 100 次分，100 个词要打 1 万次，10 万词的长文要打 100 亿次 —— 词数翻倍，握手账单翻四倍。这是注意力与生俱来的体质，也是你能在产品里实实在在摸到的三堵墙："
      >
        <div className="use-grid">
          <div className="card use-card">
            <div className="label">你摸到的墙 ①</div>
            <div className="en">上下文窗口<b>有上限</b></div>
            <div className="zh">不是模型“不想记”，是握手账单付不起：窗口扩一倍，计算与显存大约要翻四倍。各家拼命宣传“百万 token 长上下文”，本质是在和这张平方账单搏斗。</div>
          </div>
          <div className="card use-card">
            <div className="label">你摸到的墙 ②</div>
            <div className="en">聊得越久，<b>越慢越贵</b></div>
            <div className="zh">每生成一个新词，都要跟全部历史握一轮手 —— 对话越长，每一步越吃力。API 按 token 计费、长对话费用陡涨，根子也在这里。</div>
          </div>
          <div className="card use-card">
            <div className="label">业界的回应</div>
            <div className="en">一场“省握手”<b>军备竞赛</b></div>
            <div className="zh">只跟附近的词握手（滑动窗口）、只挑重点词握手（稀疏注意力）、把旧对话压缩成摘要……各种“偷工减料的艺术”层出不穷 —— 全是在平方账单上抠预算。</div>
          </div>
        </div>
        <div className="example mt">
          <div className="en">边界提醒：注意力<span className="hl">只负责搬运，不负责消化</span></div>
          <div className="zh">它做的事是“把相关的信息按比例搬到一起”，搬完之后真正的加工 —— 提炼、变换、记忆 —— 要靠每层后面跟着的另一个部件（前馈网络）完成。注意力是大模型的心脏，但心脏不是全身。零件怎么组装成完整的 Transformer，下一课见。</div>
        </div>
      </Lsec>

      <Lsec title="⚠️ 常见误区">
        <div className="card alert-card row-list">
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">注意力机制 = 人类的注意力，模型在“有意识地聚焦”</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">它只是按相似度混合信息 —— 一套机械的打分加权流程，没有意识，也没有“聚焦”的主观体验</span></div>
            </div>
            <p className="why"><b>病因：</b>名字起得太拟人。“Attention” 只是研究者借人类认知打的比方，机制本身就是本课那三步：打分 → 换算比例 → 加权吸收。把它当成“AI 长出了人类式注意力”，会高估模型对世界的理解。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">模型像人一样，从左往右一个词一个词地读句子</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">所有词同时并行处理；谁先谁后的顺序信息，靠“位置编码”额外补进向量里</span></div>
            </div>
            <p className="why"><b>病因：</b>把自己的阅读习惯投射给了模型。注意力对全句一视同仁、一次算完 —— 这正是本课“圆桌会议”演示的第二个卖点：能在 GPU 上大规模并行，远快于逐词传话的老方法（RNN）。顺序到底怎么补？下一课 Transformer 见分晓。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">看一张注意力权重图，就能解释模型“为什么这么回答”</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">权重只是亿万个中间计算值里的一小撮；“注意力能不能当解释”在研究界至今争论不休</span></div>
            </div>
            <p className="why"><b>病因：</b>本课的弧线图太直观，容易让人以为模型脑内真有一张“重点清单”。实际上单个头的权重和最终答案之间还隔着几十层的混合与改写 —— 拿一张权重图断言模型的“理由”，就像凭一帧监控画面给整部电影写剧情梗概。</p>
          </div>
        </div>
      </Lsec>

      <Lsec title="✍️ 小练习">
        <div className="card quiz row-list">
          <QuizItem q="1. 「苹果发布了新手机」和「这个苹果真甜」—— 两个「苹果」在第 8 课的 embedding 层输出相同吗？经过注意力层之后呢？为什么？">
            <b>embedding 层相同，注意力层之后不同。</b>静态 embedding 一词一坐标，两个「苹果」拿到同一个向量；注意力层让它们各自按比例吸收邻居 —— 一个重点吸收了「发布」「手机」，另一个重点吸收了「甜」，于是得到两个不同的上下文化向量。这正是注意力存在的意义。
          </QuizItem>
          <QuizItem q="2. 用 Q / K / V 拆解一个熟悉的场景：你在搜索引擎输入「附近的川菜馆」。Query、Key、Value 分别对应什么？">
            <b>Query = 你的搜索词</b>（我想找什么）；<b>Key = 每家店的索引信息</b>（名称、品类、标签 —— 我能被怎么搜到）；<b>Value = 店铺详情内容</b>（我实际提供什么）。打分就是搜索词和各家索引的匹配度。区别在于：搜索引擎倾向“取排名靠前的”，注意力是“按匹配度对所有 Value 加权混合”，谁都贡献一点。
          </QuizItem>
          <QuizItem q="3. 既然多头注意力最后还是要拼起来，为什么不干脆用一个“超级大头”一次算完？">
            一个头一次只能学出<b>一种看句子的方式</b>。多个头并行，各自在自己的子空间里打分：有的学语法搭配、有的学指代、有的学语义关联，拼接后视角互补 —— 好比多位编辑各划各的重点再汇总，比一位编辑用一支笔划到底，捕捉的关系更丰富。本课的“三头拼起来”演示就是这幅画面。
          </QuizItem>
          <QuizItem q="4. 朋友抱怨：“跟 AI 聊到第 200 轮，它回复越来越慢，听说费用还按对话长度涨 —— 是服务器不行吧？” 用本课的“握手账单”替 AI 喊个冤。">
            不是服务器的锅，是注意力的天性：<b>每生成一个新词，都要跟前文所有词握一遍手打分</b>。对话越长，每一步要握的手越多 —— 而且词数翻倍、握手次数大约翻四倍，速度和费用按平方恶化。这也是上下文窗口有上限的根本原因（第 17 课细讲），各家的“长上下文”竞赛，比的就是谁更会在这张账单上省钱。
          </QuizItem>
        </div>
      </Lsec>
    </>
  )
}
