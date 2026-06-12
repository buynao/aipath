import { useState } from 'react'
import { Lsec, SliderRow, Pill, QuizItem } from '../components/ui.jsx'

// ============================================================
// 温度与采样抽签机
// ============================================================
const TOKENS = [
  { w: '好', z: 2.6 }, { w: '不错', z: 1.9 }, { w: '晴朗', z: 1.5 }, { w: '舒服', z: 1.1 },
  { w: '糟糕', z: 0.3 }, { w: '冷', z: 0.0 }, { w: '热', z: -0.3 }, { w: '怪', z: -1.2 },
]
const BASE_Y = 246, MAX_H = 176
const COL_X = [30, 82, 134, 186, 238, 290, 342, 394]

function softmaxT(T) {
  const exps = TOKENS.map((t) => Math.exp(t.z / T))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}
function keepMask(probs, mode) {
  if (mode === 'topk') return probs.map((_, i) => i < 3)
  if (mode === 'topp') {
    const m = probs.map(() => false)
    let cum = 0
    for (let i = 0; i < probs.length; i++) { m[i] = true; cum += probs[i]; if (cum >= 0.9) break }
    return m
  }
  return probs.map(() => true)
}
function fmt(p) {
  if (p >= 0.995) return '100%'
  if (p >= 0.015) return Math.round(p * 100) + '%'
  if (p >= 0.001) return (p * 100).toFixed(1) + '%'
  return '≈0%'
}
function tempText(T) {
  if (T <= 0.3) return '分布几乎全压在「好」上 —— 接近贪心：连抽十次，大概率十次都是它。'
  if (T <= 0.8) return '前几名瓜分了绝大部分概率，偶尔轮到二三名 —— 稳中带变。'
  if (T <= 1.3) return '接近模型的原始判断：第一名占优但不垄断，长尾有微小机会。'
  return '分布被抹平，连「怪」都分到可观概率 —— 多抽几次，怪词必现。'
}
function cutText(keep, mode) {
  const n = keep.filter(Boolean).length
  if (mode === 'topk') return 'top-k = 3：永远只留前 3 名，其余 ' + (TOKENS.length - 3) + ' 个清零（灰色）—— 不管分布尖平，一刀切。'
  if (mode === 'topp') return 'top-p = 0.9：从第一名累加到 90% 即停，当前保留 ' + n + ' 个词 —— 分布越平，留得越多。'
  return '截断：关闭 —— 全部 ' + TOKENS.length + ' 个词都参与抽签。'
}

function SamplerDemo() {
  const [temp, setTemp] = useState(1)
  const [mode, setMode] = useState('none')
  const [slot, setSlot] = useState('__')
  const [picked, setPicked] = useState(-1)
  const [history, setHistory] = useState([])

  const probs = softmaxT(temp)
  const keep = keepMask(probs, mode)

  function sample() {
    const kept = probs.map((p, i) => (keep[i] ? p : 0))
    const sum = kept.reduce((a, b) => a + b, 0)
    let r = Math.random() * sum
    let idx = kept.length - 1
    for (let i = 0; i < kept.length; i++) {
      if (kept[i] <= 0) continue
      r -= kept[i]
      if (r <= 0) { idx = i; break }
    }
    setPicked(idx)
    setSlot(TOKENS[idx].w)
    setHistory((h) => [...h, TOKENS[idx].w].slice(-24))
  }
  function clearAll() { setHistory([]); setSlot('__'); setPicked(-1) }

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · 「今天天气真__」抽签机</span>
        <span className="demo-hint">滑块调温度 · 胶囊切截断 · 按钮抽词</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="ts-svg" viewBox="0 0 460 292" width="440" aria-label="柱状图：8 个候选词在当前温度下的概率分布，被截断的词显示为灰色">
            <text x="26" y="22" fontSize="12" fill="var(--fg-2)">8 个候选词的概率（合计 100%，已四舍五入）</text>
            <line x1="22" y1="246" x2="448" y2="246" stroke="var(--hairline-strong)" strokeWidth="1" />
            {TOKENS.map((t, i) => {
              const h = probs[i] * MAX_H
              const x = COL_X[i]
              const cx = x + 19
              const colCls = `ts-col${!keep[i] ? ' cut' : ''}${picked === i ? ' picked' : ''}`
              return (
                <g key={i} className={colCls}>
                  <rect className="bar" x={x} y={BASE_Y - h} width="38" height={h} rx="3" />
                  <text className="pct" x={cx} y={Math.min(BASE_Y - 6, BASE_Y - h - 6)} textAnchor="middle" fontSize="11.5" fill="var(--fg-1)">{fmt(probs[i])}</text>
                  <text className="tok" x={cx} y="268" textAnchor="middle" fontSize="13" fill="var(--fg-0)">{t.w}</text>
                </g>
              )
            })}
          </svg>
        </div>
        <div className="demo-side">
          <SliderRow label="temperature" min={0.1} max={2} step={0.05} value={temp} onChange={setTemp} format={(v) => v.toFixed(2)} />
          <div className="chips">
            {[['none', '关闭截断'], ['topk', 'top-k = 3'], ['topp', 'top-p = 0.9']].map(([k, label]) => (
              <button key={k} className={`chip${k === mode ? ' active' : ''}`} onClick={() => setMode(k)}>{label}</button>
            ))}
          </div>
          <p>{tempText(temp)}<br />{cutText(keep, mode)}</p>
          <div className="ts-sentence">今天天气真<span className="slot">{slot}</span></div>
          <div className="ts-actions">
            <button className="chip ts-primary" onClick={sample}>🎲 采样一个</button>
            <button className="chip" onClick={clearAll}>清空记录</button>
          </div>
          <div className="ts-history">
            {history.map((w, i) => <Pill key={i} type={i === history.length - 1 ? 'amber' : 'ink'}>{w}</Pill>)}
          </div>
          <p className="ts-note">被截掉的词概率清零（灰色柱），幸存的词按比例分摊后参与抽签。</p>
        </div>
      </div>
    </div>
  )
}

export default function L14() {
  return (
    <>
      <Lsec title="🎯 你将学会">
        <div className="card goals">
          <div className="goal-item"><span className="tick">✓</span>看穿「重新生成」按钮的本质：模型每步交出的是全词表的概率分布，回答是被“抽”出来的</div>
          <div className="goal-item"><span className="tick">✓</span>用“调对比度”的直觉吃透 temperature：低温放大差距趋向贪心，高温抹平差距让冷门词翻身</div>
          <div className="goal-item"><span className="tick">✓</span>分清 top-k 与 top-p：都是先剪掉长尾再抽签 —— 一个定额，一个自适应</div>
          <div className="goal-item"><span className="tick">✓</span>学会按任务拧旋钮：写代码低温、头脑风暴高温、聊天居中，并能识破“温度 = 创造力”的话术</div>
        </div>
      </Lsec>

      <Lsec
        title="💡 核心概念：答案不是“想”出来的，是“抽”出来的"
        lead="你一定见过这个现象：同一个问题问 ChatGPT 两遍，得到两版不同的回答；不满意还能点「重新生成」，它又换个说法再来一版。程序不是“同样输入、同样输出”吗？谜底其实在第 10 课的结尾就埋好了 —— Transformer 一路加工到最后，交出来的不是一个词，而是一张概率表：词表里十几万个 token，每个都分到一份概率，加起来正好 100%。模型的工作到此为止。「接下来选哪个词」是另一道独立的工序，叫采样（sampling）—— 同一张概率表，抽签方式不同，模型表现出的“性格”就完全不同。"
      >
        <div className="contrast">
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-ink">直觉印象</span></div>
            <div className="big">想好答案 <span className="gap">→</span> 逐字打出来</div>
            <p className="note">按这个理解，同样的问题就该有一字不差的回答 ——「重新生成」按钮根本不该存在。</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">真实机制</span></div>
            <div className="big">每个词，都是按概率<span className="hl">抽签</span>抽出来的</div>
            <p className="note">模型每步只交概率表；从表里怎么挑词（贪心、抽签、截断）由应用方设定。回答不同，只因这次的签抽得不同。</p>
          </div>
        </div>
        <p className="lead mt14">本课全程用一个具体场景：让模型续写「<b>今天天气真__</b>」。它交出的概率表，前 8 名大概长这样（已四舍五入）：</p>
        <div className="example">
          <div className="en">好 43% · 不错 22% · 晴朗 14% · 舒服 10% · 糟糕 4% · 冷 3% · 热 2% · 怪 1%</div>
          <div className="zh">这就是模型的全部输出：一张“看好程度”清单。「今天天气真」后面本来就没有唯一正确答案，这张表是模型对语言多样性的诚实刻画。注意「怪」只是<b>长尾的开始</b> —— 真实词表里，它后面还排着十几万个更冷门的词。</div>
        </div>
        <p className="lead mt14">先把“现象”和“机制”连上线 —— 你在产品里见过的这些事，背后全是同一件事：</p>
        <div className="card">
          <table className="match">
            <thead><tr><th>你在 ChatGPT / Claude 里看到的</th><th>背后的机制</th></tr></thead>
            <tbody>
              <tr><td><b>点「重新生成」，答案变了</b></td><td className="ex">同一张概率表，重新抽了一次签</td></tr>
              <tr><td><b>同一个模型，写代码严谨、聊天活泼</b></td><td className="ex">应用方在不同场景下用了不同的采样设置 —— 模型本体没换</td></tr>
              <tr><td><b>API 文档里的 temperature 和 top_p 参数</b></td><td className="ex">抽签前对概率表做的两步加工：调形状、剪长尾 —— 本课的两位主角</td></tr>
              <tr><td><b>网页版找不到任何旋钮</b></td><td className="ex">厂商替你选好了一组折中值，藏在了幕后</td></tr>
            </tbody>
          </table>
        </div>
        <p className="lead mt14">接下来两节分别拆这两步加工：<b>温度</b>管概率表的形状，<b>top-k / top-p</b> 管概率表的边界。</p>
      </Lsec>

      <Lsec
        title="📖 温度：给概率表“调对比度”"
        lead="想象修图软件里的对比度滑块：往右拉，亮处更亮、暗处更暗，主角从画面里跳出来；往左拉，整张图灰成一片，谁也不比谁突出。temperature（温度）就是概率表的对比度滑块，只是方向相反 —— 温度越低，对比越强。它的全部动作只有一步：在 softmax 把分数变成概率之前，先把每个候选词的分数除以 T。"
      >
        <div className="example">
          <div className="en">新概率表 = softmax（ 原始分数 ÷ T ）</div>
          <div className="zh">全课唯一的式子，三个零件全是熟人：<b>原始分数</b>，模型给每个候选词打的“看好程度”（第 10 课叫 logits）；<b>÷ T</b>，温度做的唯一动作 —— 一步除法；<b>softmax</b>，把任意一串分数压成总和 100% 的概率（第 10 课讲过）。没有新数学，只是在老流程里插了一步除法。</div>
        </div>
        <p className="lead mt14">为什么一步除法就能改变“性格”？关键在 softmax 的脾气：它对<b>分数差</b>极其敏感 —— 分数差稍微拉大，概率差就被成倍放大。拿真实数字说话：场景里「好」比「怪」高 3.8 分，softmax 端出的概率比约为 45 : 1。把 T 调到 0.5，所有分数除以 0.5 等于翻倍，差距变成 7.6 分，概率比骤增到约 2000 : 1 ——「怪」彻底出局，模型趋向“每步必选第一名”的<b>贪心模式</b>。反过来把 T 调到 2，分数全体减半，差距缩成 1.9 分，概率比缩到约 7 : 1 —— 冷门词翻身，怪话开始登场。</p>
        <div className="use-grid">
          <div className="card use-card"><div className="label">T &lt; 1 · 降温</div><div className="en">强者<b>愈强</b></div><div className="zh">分数差被放大，第一名碾压全场。T 趋近 0 就是贪心：每步必选最高分，同样输入几乎同样输出 —— 稳，但呆。</div></div>
          <div className="card use-card"><div className="label">T = 1 · 不动</div><div className="en">原样<b>输出</b></div><div className="zh">分数原封不动交给 softmax，端出的概率表就是模型的“原始判断”—— 不加戏，也不收敛。</div></div>
          <div className="card use-card"><div className="label">T &gt; 1 · 升温</div><div className="en">冷门<b>翻身</b></div><div className="zh">分数差被抹平，概率趋向“人人有份”。T 极大时接近均匀抽签 —— 鲜活，但随时口吐怪词。</div></div>
        </div>
        <p className="lead mt14"><b>为什么非要这颗旋钮不可？</b>因为两个极端各有各的死法。先看“永远选第一名”：研究者很早就发现，贪心写出的长文僵硬、空洞，还特别爱复读 —— 一句话一旦出现过，它就进入了上下文，反过来抬高自己再次出现的概率，模型于是陷进「我觉得很好。我觉得很好。我觉得很好。」式的死循环。再看另一头，“完全照原始概率抽”：每一步都给长尾留着门，长文写下来迟早抽中一个胡话词（下一节细讲）。一头是复读机，一头是醉汉 —— 所以才需要一颗<b>连续可调的旋钮</b>，让你在「稳」和「活」之间自己挑位置。</p>
        <p className="lead">它具体怎么改写概率表？同一个「今天天气真__」，三档温度下的对比（数字与下方交互演示一致，待会儿可以亲手验证）：</p>
        <div className="card">
          <table className="match">
            <thead><tr><th>温度</th><th>第一名「好」</th><th>第八名「怪」</th><th>体感</th></tr></thead>
            <tbody>
              <tr><td className="be">T = 0.1</td><td>≈100%</td><td>≈0%</td><td className="ex">复读机：抽一百次，基本一百次都是「好」</td></tr>
              <tr><td className="be">T = 1.0</td><td>43%</td><td>1%</td><td className="ex">原始判断：稳中有变，偶尔换个说法</td></tr>
              <tr><td className="be">T = 2.0</td><td>27%</td><td>4%</td><td className="ex">放飞：连抽几次，「怪」「糟糕」就可能蹦出来</td></tr>
            </tbody>
          </table>
        </div>
        <p className="lead mt14">最后划清边界：<b>温度改变的只是“怎么抽”，不是“模型知道什么”。</b>你拧动旋钮时，模型的参数、知识、推理能力一丝一毫没变 —— 升温逼不出它没有的知识，降温也补不上它缺的能力。它只是同一颗大脑的两种出牌方式。另有一个工程冷知识：哪怕 T 压到 0，两次输出也可能有微小差异 —— GPU 并行计算时浮点加法的顺序不固定，会带来极细微的数值抖动，偶尔恰好翻转两个得分接近的词的排名。所以 T = 0 是“接近确定”，别指望逐字复现。</p>
      </Lsec>

      <Lsec
        title="📖 top-k 与 top-p：先剪掉胡话，再抽签"
        lead="温度有个管不住的死角：长尾。演示里只画了 8 个词，但真实概率表上「怪」后面还排着十几万个词 ——「葡萄糖」「函数」「申报单」…… 每一个的概率都微乎其微，可十几万个“微乎其微”加在一起，常常凑出好几个百分点。而一篇 500 字的回答意味着连抽几百次签：单次 1% 的事故率，几百次下来踩雷几乎是必然。更糟的是错误会滚雪球 —— 抽中的怪词立刻成为上下文的一部分，后面所有抽签都建立在它之上："
      >
        <div className="example">
          <div className="en">红烧肉做法：五花肉切块、冷水下锅焯水，加冰糖炒出糖色，然后倒入<b>……海关申报单</b>。</div>
          <div className="zh">一次长尾事故毁掉整段专业感 —— 而且模型接下来还会一本正经地把「海关申报单」圆下去，越走越偏。截断策略要做的，就是把这类事故的概率<b>直接清零</b>。</div>
        </div>
        <p className="lead mt14">思路简单粗暴：抽签之前，先把概率表的尾巴剪掉，只在“靠谱区”里抽。剪法有两种：</p>
        <div className="use-grid cols-2">
          <div className="card use-card"><div className="label">定额截断</div><div className="en">top-k <b>留前 k 名</b></div><div className="zh">只保留概率<b>最高的 k 个</b>词（实际系统常用 40、50，本课演示用 3 方便观察），其余全部清零，剩下的按比例重新分摊概率再抽签。规则简单，但“一刀切”—— 不看分布长什么样。</div></div>
          <div className="card use-card"><div className="label">自适应截断</div><div className="en">top-p <b>留到累计 p</b></div><div className="zh">从第一名往下<b>累加概率，刚凑够 p（比如 90%）就停</b>，圈外全部清零。又叫核采样（nucleus sampling）：分布尖时圈子自动收紧，分布平时自动放宽 —— 跟着模型的“把握”走。</div></div>
        </div>
        <p className="lead mt14">两种剪法的差别，在极端分布下看得最清楚：</p>
        <div className="card">
          <table className="match">
            <thead><tr><th>情形</th><th>top-k = 3</th><th>top-p = 0.9</th></tr></thead>
            <tbody>
              <tr><td className="be">分布很尖<div className="footnote">T = 0.3，「好」独占近九成</div></td><td className="ex">仍留 3 个 —— 第 3 名只剩 2%，留着也几乎抽不到</td><td className="ex">自动只留 2 个 —— 前两名已凑够 90%</td></tr>
              <tr><td className="be">分布被抹平<div className="footnote">T = 2，「好」仅占 27%</div></td><td className="ex">仍留 3 个 —— 第 4 名「舒服」13% 的合理机会被硬砍</td><td className="ex">自动放宽到 7 个 —— 合理候选都保住，只剪最尾巴</td></tr>
            </tbody>
          </table>
        </div>
        <p className="lead mt14">这正是 top-p 后来居上、成为多数系统默认的原因：它不数人头，而是看把握 —— 模型有把握时收紧候选，没把握时放宽候选。实际系统里，温度和 top-p 几乎总是搭着用，完整流水线四步：<b>调形状（温度）→ 剪长尾（top-p）→ 幸存的词重新归一化 → 抽签</b>。两颗旋钮分管两件事：温度管“敢不敢冒险”，top-p 管“底线在哪”。常见做法是温度按任务调，top-p 固定在 0.9 ~ 1.0 附近小动 —— 各家 API 的默认值与推荐组合不一样，动手前以官方文档为准。</p>
        <p className="lead">截断也有它的局限：它防得住“明显的胡话词”，防不住“流畅的错话”。一句概率很高、语法完美的错误陈述，能轻松穿过所有截断 —— 这就是后面第 29 课要讲的“幻觉”：截断管得住怪词，管不住一本正经的胡说。</p>
      </Lsec>

      <Lsec
        title="🎛️ 交互演示：亲手拧一拧温度旋钮"
        lead="理论齐了，上手验证。建议按顺序做三个实验：① 把 T 拉到 0.1，连点十次「采样」—— 几乎次次都是「好」；② 拉到 2.0 再连点 ——「怪」「糟糕」开始出没；③ 保持高温，切换 top-k / top-p —— 看被截掉的柱子变灰，再调温度，观察 top-p 的圈子如何自动伸缩。"
      >
        <SamplerDemo />
      </Lsec>

      <Lsec
        title="🧭 实战：这颗旋钮该拧到哪"
        lead="没有“最佳温度”，只有“合适的温度”。拧之前先问一句：这个任务要的是「对」、「自然」，还是「广」？"
      >
        <div className="use-grid">
          <div className="card use-card"><div className="label">低温 0 ~ 0.3</div><div className="en">求<b>对</b> · 代码与事实</div><div className="zh">改 bug、翻译合同、按格式提取数据 —— 这些任务答案空间小、容错低，要的是稳定可复现，不需要“妙笔”。</div></div>
          <div className="card use-card"><div className="label">中温 ≈ 0.5 ~ 0.8</div><div className="en">求<b>自然</b> · 日常对话</div><div className="zh">聊天、写邮件、总结文章 —— 既要靠谱，又不想每句话都像模板。多数对话产品的默认档位就落在这一带。</div></div>
          <div className="card use-card"><div className="label">高温 0.8 ~ 1.2</div><div className="en">求<b>广</b> · 头脑风暴</div><div className="zh">起名字、想 slogan、编故事开头 —— 一次让它出 20 个，人来挑。高温负责发散，把关交还给人。</div></div>
        </div>
        <p className="footnote mt14">两个提醒：① 各家 API 的默认值和取值范围不一样（有的默认 1.0、最高可调到 2.0），动手前以官方文档为准；② 网页版 ChatGPT / Claude 不开放这颗旋钮，厂商已替你选好折中值 —— 所以“同一个模型”在不同产品里手感不同，往往不是模型变了，是采样设置变了。</p>
      </Lsec>

      <Lsec title="⚠️ 常见误区">
        <div className="card alert-card row-list">
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">temperature 是“创造力”开关，调高 AI 就更有创意</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">它只调概率表的平滑度 —— 高温让冷门词更容易被抽中，不会带来任何新知识</span></div>
            </div>
            <p className="why"><b>病因：</b>“创造力”是厂商和自媒体爱用的拟人词。模型的知识和能力在预训练时已经定型（第 12 课），温度只改变“从已有判断里怎么抽”。高温下的“惊喜”全部来自长尾词 —— 惊喜和胡话，本来就是同一批词。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">T = 0 时模型最严谨，答案一定正确</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">T = 0 只保证“每步选概率最高的词”—— 概率高不等于事实对，错也错得更自信</span></div>
            </div>
            <p className="why"><b>病因：</b>把“确定性”误当“准确性”。如果模型对某个错误说法本来就最看好（比如训练语料里错误写法更常见），T = 0 反而保证它<b>每次都犯同一个错</b>。温度解决的是“稳定”，从来解决不了“正确”。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">每次回答不一样，说明 AI 有情绪、有自由意志</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">只是从同一张概率表里重新抽了一次签 —— 随机数不同，词就不同</span></div>
            </div>
            <p className="why"><b>病因：</b>拟人化投射。人类行为多变源于心情和想法，于是我们把模型的多变也归因于“它在想”。验证很简单：把温度调到接近 0，“自由意志”立刻消失 —— 真正的心情可没有开关。</p>
          </div>
        </div>
      </Lsec>

      <Lsec title="✍️ 小练习">
        <div className="card quiz row-list">
          <QuizItem q="1. 同事用 API 给商品批量生成文案，抱怨“每次生成的都差不多，换汤不换药”。该把 temperature 往哪边调？要不要顺手关掉 top-p？">
            <b>调高</b>（比如 1.0 ~ 1.2），让冷门表达有机会被抽中，一次多生成几版供人挑。top-p 建议<b>保留</b>（0.9 上下）：高温恰恰把长尾抬了起来，正需要它兜底防胡话 —— 温度管发散，top-p 管底线，两者分工不冲突。
          </QuizItem>
          <QuizItem q="2. 朋友说：“我把 temperature 设成 0 了，所以这份 AI 生成的合同摘要肯定没错。”这句话哪里有问题？">
            T = 0 只保证<b>稳定</b>（每步选最高概率词），不保证<b>正确</b>。模型若本来就“最看好”某个错误表述，T = 0 会让它每次都自信地输出同一个错误。事实正确性要靠人工核对或外接资料来兜底（应用篇会讲）。顺带一提：严格说 T = 0 也可能有浮点抖动带来的微小差异，连“逐字复现”都不绝对。
          </QuizItem>
          <QuizItem q="3. 用本课的概念解释：为什么诗歌生成器敢把温度开到 1.2，而客服机器人通常压在 0.3 以下？">
            诗歌要的是<b>广</b>：冷门词翻身正是新鲜意象的来源，偶尔的怪词读者还会当成“诗意”，事故成本约等于零。客服要的是<b>对</b>：答案空间小、容错极低，一次长尾事故（报错价格、编个不存在的政策）的代价远大于“说话呆板”。同一颗旋钮的两端，是两种职业性格。
          </QuizItem>
        </div>
      </Lsec>
    </>
  )
}
