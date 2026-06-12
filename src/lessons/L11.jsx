import { useState } from 'react'
import { Lsec, FlipCard, QuizItem } from '../components/ui.jsx'

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ============================================================
// ① BPE 焊接步进器
// ============================================================
const CHARS = ['今', '天', '天', '气', '真', '好', '，', '我', '们', '一', '起', '学', '习', '人', '工', '智', '能']
const MERGES = [
  { a: '今', b: '天', note: '扫遍语料：「今」和「天」相邻出现的次数名列前茅（几十亿次的量级），第一批被焊成整块。注意第二个「天」没被动到 —— 它后面跟的是「气」，不是这对组合。' },
  { a: '天', b: '气', note: '「天」「气」也是黄金搭档（天气、天气预报、坏天气……），焊！从此「天气」整块出场，不再拆开。' },
  { a: '我', b: '们', note: '「们」几乎只出现在「我 / 你 / 他」这类字后面，这种强绑定组合最容易被焊死。' },
  { a: '一', b: '起', note: '「一起」在日常语料里高频出现，顺利入表。注意逗号「，」一直独立成块 —— 标点也是 token。' },
  { a: '学', b: '习', note: '「学习」同理 —— 高频双字词一个接一个被焊成整块，句子越来越短。' },
  { a: '人', b: '工', note: '「人工」先入表。此刻「智」「能」还是两个散块，别急。' },
  { a: '智', b: '能', note: '「智能」也入表。关键的事情发生了：现在「人工」和「智能」变成了一对高频相邻的“块”。' },
  { a: '人工', b: '智能', note: '焊接的原料不一定是单字 —— 已焊成的块还能再焊！「人工」+「智能」相邻频率够高，于是四个字的「人工智能」整块入表。17 块就这样缩成了 9 块；真实训练会重复几万轮，直到词表达到预定大小。' },
]
const START_NOTE = '起点：词表里只有最小单元 —— 单个字（和字节）。任何句子都拼得出来，但切得最碎：这句话要 17 块，连逗号也算一块。点「下一步」开始焊接。'

function tokensAt(n) {
  let arr = CHARS.slice()
  let fresh = []
  for (let m = 0; m < n; m++) {
    const mg = MERGES[m]
    const res = []
    fresh = []
    for (let i = 0; i < arr.length; i++) {
      if (i < arr.length - 1 && arr[i] === mg.a && arr[i + 1] === mg.b) {
        res.push(mg.a + mg.b)
        if (m === n - 1) fresh.push(res.length - 1)
        i++
      } else {
        res.push(arr[i])
      }
    }
    arr = res
  }
  return { arr, fresh }
}

function BpeDemo() {
  const [step, setStep] = useState(() => (reduceMotion() ? MERGES.length : 0))
  const state = tokensAt(step)
  const count = state.arr.length
  const mg = step > 0 ? MERGES[step - 1] : null

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · BPE 焊接步进器</span>
        <span className="demo-hint">点「下一步」逐轮焊接，红圈是本轮新块</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <div className="bpe-stage-inner">
            <div className="bpe-blocks" aria-label="当前句子的 token 切分状态">
              {state.arr.map((t, i) => (
                <span key={i} className={`mini-tok tkc${i % 4}${state.fresh.includes(i) ? ' bpe-new' : ''}`}>{t}</span>
              ))}
            </div>
            <div className="bpe-meter">
              <div className="bm-label"><span>这句话的 token 数</span><span>{count} 块（起点 17）</span></div>
              <div className="bm-track"><div className="bm-fill" style={{ width: (count / CHARS.length) * 100 + '%' }} /></div>
            </div>
          </div>
        </div>
        <div className="demo-side">
          {step === 0 ? (
            <>
              <h4>第 0 轮 · 起点</h4>
              <div className="period">词表 = 单字与字节</div>
              <div className="bpe-formula"><span className="footnote">尚未焊接 —— 一切还是单字。</span></div>
              <p aria-live="polite">{START_NOTE}</p>
            </>
          ) : (
            <>
              <h4>第 {step} 轮 · 共 {MERGES.length} 轮</h4>
              <div className="period">本轮新块入表，获得一个新编号</div>
              <div className="bpe-formula">
                <span className="mini-tok tkc0">{mg.a}</span> + <span className="mini-tok tkc1">{mg.b}</span> → <span className="mini-tok tkc3">{mg.a + mg.b}</span>
              </div>
              <p aria-live="polite">{mg.note}</p>
            </>
          )}
          <div className="bpe-ctrl">
            <button className="chip" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>◀ 上一步</button>
            <button className="chip" disabled={step === MERGES.length} onClick={() => setStep((s) => Math.min(MERGES.length, s + 1))}>下一步 ▶</button>
            <button className="chip" disabled={step === MERGES.length} onClick={() => setStep(MERGES.length)}>⏭ 一键焊完</button>
            <button className="chip" disabled={step === 0} onClick={() => setStep(0)}>↺ 重置</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ② 示意版分词器
// ============================================================
const CN_WORDS = new Set(['今天', '明天', '今晚', '天气', '我们', '你们', '他们', '大家', '学习', '人工', '智能', '模型', '语言', '数据', '训练', '机器', '计算', '时间', '工作', '喜欢', '什么', '怎么', '哪个', '可以', '不是', '没有', '知道', '现在', '已经', '因为', '所以', '但是', '如果', '一起', '老师', '学生', '朋友', '世界', '问题', '开心', '火锅', '中文', '英文', '汉字'])
const EN_VOCAB = ['ligence', 'ization', 'ificial', 'intel', 'token', 'break', 'berry', 'trans', 'model', 'learn', 'izer', 'able', 'tion', 'love', 'chat', 'form', 'good', 'the', 'and', 'art', 'gpt', 'str', 'ing', 'day', 'you', 'aw', 'un', 'er', 'ed', 'ly', 're', 'in', 'is', 'it', 'an', 'on', 'at', 'or', 'to', 'of'].sort((a, b) => b.length - a.length)
const PRESETS = ['今天天气真好，我们一起学习人工智能。', 'The unbreakable tokenizer loves strawberry!', '我们用 ChatGPT 学习 token 化。', '9.11 和 9.9 哪个大？3.14159 呢？', '今晚吃火锅🍲，开心😄🎉']
const PRESET_LABELS = [['0', '中文句'], ['1', '英文句'], ['2', '中英混合'], ['3', '一串数字'], ['4', 'emoji']]

const isCJK = (ch) => /[一-鿿]/.test(ch)
const isLatin = (ch) => /[A-Za-z]/.test(ch)
const isDigit = (ch) => /[0-9]/.test(ch)
function fakeId(s) {
  let h = 7
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 99991
  return 100 + (h % 89000)
}
function segmentEnglish(word) {
  const toks = []
  const lower = word.toLowerCase()
  let i = 0
  while (i < lower.length) {
    let matched = null
    for (let k = 0; k < EN_VOCAB.length; k++) {
      if (lower.startsWith(EN_VOCAB[k], i)) { matched = EN_VOCAB[k]; break }
    }
    const len = matched ? matched.length : 1
    toks.push({ t: word.slice(i, i + len), n: 1 })
    i += len
  }
  return toks
}
function tokenize(text) {
  const chars = Array.from(text)
  let toks = []
  let i = 0
  while (i < chars.length) {
    const ch = chars[i]
    const cp = ch.codePointAt(0)
    if (/\s/.test(ch) || cp === 0xfe0f || cp === 0x200d) { i++; continue }
    if (isCJK(ch)) {
      const two = ch + (chars[i + 1] || '')
      if (CN_WORDS.has(two)) { toks.push({ t: two, n: 1 }); i += 2 } else { toks.push({ t: ch, n: 1 }); i += 1 }
      continue
    }
    if (isLatin(ch)) {
      let j = i
      while (j < chars.length && isLatin(chars[j])) j++
      toks = toks.concat(segmentEnglish(chars.slice(i, j).join('')))
      i = j; continue
    }
    if (isDigit(ch)) {
      let dd = i
      while (dd < chars.length && isDigit(chars[dd])) dd++
      const run = chars.slice(i, dd).join('')
      for (let p = 0; p < run.length; p += 2) toks.push({ t: run.slice(p, p + 2), n: 1 })
      i = dd; continue
    }
    if (cp > 0xffff || (cp >= 0x2600 && cp <= 0x27bf)) { toks.push({ t: ch, n: 2, byte: true }); i++; continue }
    toks.push({ t: ch, n: 1 }); i++
  }
  return toks
}

function TokenizerDemo() {
  const [text, setText] = useState(PRESETS[0])
  const [active, setActive] = useState('0')
  const toks = tokenize(text)
  const total = toks.reduce((s, t) => s + t.n, 0)
  const charCount = Array.from(text.replace(/\s/g, '')).length
  const ratio = charCount ? `，平均每个字符约 ${(total / charCount).toFixed(1)} 个 token` : ''

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · 示意版分词器</span>
        <span className="demo-hint">输入或点击例句，实时查看切分结果</span>
      </div>
      <div className="tok-body">
        <div className="chips">
          {PRESET_LABELS.map(([i, label]) => (
            <button key={i} className={`chip${active === i ? ' active' : ''}`} onClick={() => { setActive(i); setText(PRESETS[+i]) }}>{label}</button>
          ))}
        </div>
        <textarea className="tok-input" rows="3" aria-label="输入要切分的文字" placeholder="在这里输入任何文字…"
          value={text} onChange={(e) => { setActive(null); setText(e.target.value) }} />
        <div className="tok-out" aria-live="polite">
          {toks.length === 0 ? (
            <span className="tok-empty">输入点什么，这里会实时显示切分结果…</span>
          ) : (
            toks.map((tk, i) => (
              <span key={i} className={`tok tkc${i % 4}`}>
                <span className="tt">{tk.t}</span>
                <span className="tid">{tk.byte ? `字节 ×${tk.n}` : `#${fakeId(tk.t)}`}</span>
              </span>
            ))
          )}
        </div>
        <div className="tok-stats">{toks.length > 0 && <>共 <b>{total}</b> 个 token（{charCount} 个字符，不含空格{ratio}）</>}</div>
        <p className="footnote">块下方的编号是示意值，不对应任何真实模型。空格在真实分词器中通常并入后面的词块，这里为直观起见直接省略；标着 ×2 的 emoji 表示它按字节拆成约 2 块。试着对比“中文句”和“英文句”的 token 数，亲眼看看密度差异。</p>
      </div>
    </div>
  )
}

const GUESS = [
  { q: '「今天」会切成几块？', pill: { type: 'sage', text: '1 块 · 整词' }, why: '高频双字词，BPE 早早把它焊成一整块 —— 常见词的待遇。' },
  { q: '「unbreakable」会切成几块？', pill: { type: 'amber', text: '约 3 块 · 子词' }, why: '长词按常见子词拆开：un·break·able —— 前缀、词根、后缀正好都是高频组合。' },
  { q: '「ChatGPT」会切成几块？', pill: { type: 'sage', text: '1 到 2 块' }, why: '出镜率太高，“Chat”和“GPT”早已整块入表；更新的词表甚至把整个词收成一块。' },
  { q: '「饕餮」会切成几块？', pill: { type: 'terracotta', text: '约 4 到 6 块 · 字节碎块' }, why: '词表里没有整块，退回字节层 —— 一个冷僻汉字常被切成两三个字节块，两个字加起来约半打。' },
  { q: '「🍲」会切成几块？', pill: { type: 'terracotta', text: '2 到 3 块 · 字节碎块' }, why: '这个 emoji 本身占 4 个字节，词表多半没收录整块，只能按字节拼凑。' },
  { q: '「9.11」会切成几块？', pill: { type: 'sky', text: '3 块 · 数字分家' }, why: '数字和小数点各自成块 —— 这正是“9.11 比 9.9 大”翻车事故的第一现场。' },
]

const Mini = ({ c, children }) => <span className={`mini-tok tkc${c}`}>{children}</span>

export default function L11() {
  return (
    <>
      <Lsec title="🎯 你将学会">
        <div className="card goals">
          <div className="goal-item"><span className="tick">✓</span>一句话说清 token 是什么：文本的“乐高积木块”，每块对应一个编号</div>
          <div className="goal-item"><span className="tick">✓</span>明白为什么必须切块：逐字看太碎、整词看会爆炸 —— token 是被两头逼出来的折中</div>
          <div className="goal-item"><span className="tick">✓</span>亲眼看 BPE 怎么把高频组合一轮轮“焊”成新块：常见词整块、生僻词拆碎</div>
          <div className="goal-item"><span className="tick">✓</span>用 token 视角解释一串怪现象：数不清字母、9.11 比 9.9 “大”、半个词往外蹦、按 token 计费</div>
          <div className="goal-item"><span className="tick">✓</span>亲手玩一个示意版分词器，再猜猜各种词会被切成几块</div>
        </div>
      </Lsec>

      <Lsec
        title="💡 核心概念：先切块，再编号"
        lead="大模型从不“看字”。你打的每句话，在进入模型前都会被切成一块块文本积木 —— token，每块对应词表里的一个编号。模型吃进去的是编号序列，吐出来的也是编号序列，最后一步才被还原成文字。"
      >
        <div className="contrast">
          <div className="card contrast-card">
            <div className="tag">你以为</div>
            <div className="big">模型在逐字阅读<span className="gap">「今天天气真好」</span></div>
            <div className="note">仿佛屏幕对面坐着一个识字的人，一笔一画都看在眼里。</div>
          </div>
          <div className="card contrast-card">
            <div className="tag">实际上</div>
            <div className="big">它收到的是 <span className="hl">[3742, 1102, 88, 451]</span></div>
            <div className="note">一串编号。哪个编号常和哪个编号搭配，它在训练中见得太多了；可“字长什么样”，它从未见过。</div>
          </div>
        </div>
      </Lsec>

      <Lsec title="📖 一句话的旅程" lead="从你按下回车，到屏幕上出现回答，文字其实经历了一趟“编号往返”。">
        <div className="card card-pad">
          <div className="pipe">
            <div className="pipe-step"><div className="ps-label">① 你打的字</div><div className="ps-val">今天天气真好</div></div>
            <div className="pipe-arrow">→</div>
            <div className="pipe-step"><div className="ps-label">② 切成 token 块</div><div className="ps-val"><Mini c={0}>今天</Mini><Mini c={1}>天气</Mini><Mini c={2}>真</Mini><Mini c={3}>好</Mini></div></div>
            <div className="pipe-arrow">→</div>
            <div className="pipe-step"><div className="ps-label">③ 变成编号</div><div className="ps-val">[3742, 1102, 88, 451]</div></div>
            <div className="pipe-arrow">→</div>
            <div className="pipe-step"><div className="ps-label">④ 模型计算</div><div className="ps-val">吐出新编号，再还原成文字给你看</div></div>
          </div>
          <p className="footnote pipe-note">负责“文字 ↔ 编号”来回翻译的程序叫<b>分词器（tokenizer）</b>。它不是模型的一部分，而是站在模型门口的翻译官 —— 编号是示意值，每家模型的词表和编号都不同。第 8 课讲过的 Embedding，正是把这些编号变成向量的下一步。</p>
        </div>
        <p className="lead" style={{ marginTop: 18 }}>这趟旅程在“出口”那头同样成立：模型每算完<b>一个</b>新编号，系统就立刻把它翻译成文字发到你屏幕上 —— 这就是 ChatGPT、Claude 回答时字一小段一小段往外“蹦”的原因。蹦出来的最小单位是 token 块，不是字，所以偶尔会先蹦出半个词，下一拍才补全。</p>
      </Lsec>

      <Lsec
        title="📖 深入展开 · 为什么非“切块”不可"
        lead="看上去“切块”像是多此一举 —— 直接逐字读、或者按词读，不行吗？还真不行。token 是被两条死路逼出来的活路。"
      >
        <div className="use-grid">
          <div className="card use-card">
            <div className="label">死路 ① · 逐字看（字符级）</div>
            <div className="en">句子变成<b>超长队列</b></div>
            <div className="zh">每个字一块，一篇千字文就是上千步。而模型内部“每块都要和每块打招呼”（第 10 课的注意力），队列一长，算力开销和工作记忆都被迅速撑爆 —— 像用米粒砌墙：什么都能砌，就是太慢太贵。</div>
          </div>
          <div className="card use-card">
            <div className="label">死路 ② · 整词看（词级）</div>
            <div className="en">词表<b>收不完</b>，新词<b>不认识</b></div>
            <div className="zh">网络新梗、人名、错别字、代码变量名……词是造不完的。凡是词表外的词，只能统统标成“不认识”，整段信息当场丢失 —— 像只用预制房间盖楼：图纸上没有的户型就盖不了。</div>
          </div>
          <div className="card use-card">
            <div className="label">活路 · 高频整块、低频拆碎</div>
            <div className="en"><b>BPE</b>：两头的好处都要</div>
            <div className="zh">常见词焊成整块（省步数），生僻词拆到字节（任何输入都拼得出来，永远不会“不认识”），词表大小还能精确控制。这正是下一节的主角。</div>
          </div>
        </div>
        <p className="lead" style={{ marginTop: 18 }}>所以“切块”不是设计者的洁癖，而是工程上的最优折中。理解了这一点，BPE 的每一步都顺理成章 —— 它要做的，无非是<b>自动找出“哪些组合值得焊成整块”</b>。</p>
      </Lsec>

      <Lsec
        title="🧱 BPE：把高频组合“焊”成积木"
        lead="切块的方案不是人拍脑袋定的，而是从海量语料里统计出来的。主流做法叫 BPE（字节对编码），思想简单到一句话：谁总挨在一起，就把谁焊成一块。"
      >
        <div className="card row-list">
          <div className="example"><div className="en">第 0 步 · 全部拆碎</div><div className="zh">词表里只有几百个最小单元（字符或字节）：<Mini c={0}>今</Mini><Mini c={1}>天</Mini><Mini c={2}>天</Mini><Mini c={3}>气</Mini><Mini c={0}>真</Mini><Mini c={1}>好</Mini> —— 任何文字都能拼出来，只是切得很碎。</div></div>
          <div className="example"><div className="en">第 1 步 · 数频率</div><div className="zh">扫一遍语料：哪两块最常相邻？「今」+「天」可能出现了几十亿次，遥遥领先。</div></div>
          <div className="example"><div className="en">第 2 步 · 焊接成新块</div><div className="zh">把<Mini c={0}>今天</Mini>注册成一个新块，发一个新编号。从此它整块出场，不再拆开。</div></div>
          <div className="example"><div className="en">第 3 步 · 重复几万次</div><div className="zh">不断“数频率 → 焊接”，最终得到几万到二十几万块的词表（数量级，各家不同）。高频的词成了整块，低频的词只能用碎块拼。</div></div>
        </div>
        <p className="lead" style={{ marginTop: 22 }}>光看文字不过瘾 —— 下面这个步进器，让你<b>一轮一轮亲眼看焊接发生</b>：同一句话从 17 块碎渣，怎么一步步缩成 9 块积木。</p>
        <BpeDemo />
        <p className="footnote" style={{ marginTop: 10 }}>焊接顺序与频次为教学示意。真实 BPE 在字节层面操作、按全部语料统计频率，焊接会重复几万到几十万轮。</p>
        <p className="lead" style={{ marginTop: 22 }}>于是出现了一条铁律：<b>越常见，块越大；越生僻，越碎。</b>这直接决定了不同语言的“token 密度”——</p>
        <div className="use-grid">
          <div className="card use-card"><div className="label">英文 · 数量级</div><div className="en">1 个 token 装下<b>约四分之三个词</b></div><div className="zh">常见词整块（the、token），长词拆成子词（un·break·able）。1000 个 token 大约能装 750 个英文词。</div></div>
          <div className="card use-card"><div className="label">中文 · 数量级</div><div className="en">1 个字花 <b>1 到 2 个 token</b></div><div className="zh">高频词可整词一块（“今天”），多数字单字一块，生僻字拆成字节碎块。不同分词器差异很大，记住数量级即可。</div></div>
          <div className="card use-card"><div className="label">生僻字与 emoji</div><div className="en">1 个字符花 <b>2 到 3 个 token</b></div><div className="zh">词表里没有整块，就退回字节层拼凑 —— 一个 emoji 或冷僻汉字常要花两三块的“运费”。</div></div>
        </div>
        <p className="lead" style={{ marginTop: 22 }}>那为什么不把块焊得更大、词表做得更猛，让一句话只占两三块？因为<b>两头都有代价</b>，BPE 的甜点区是试出来的 ——</p>
        <div className="use-grid cols-2">
          <div className="card use-card"><div className="label">块太大的代价</div><div className="en">每块的“经验”变<b>薄</b></div><div className="zh">块越长越专用，在语料里出现的次数就越少，模型攒不下足够的“语感”；而且几十万个块各自都要占一份参数，词表本身就会变得臃肿。</div></div>
          <div className="card use-card"><div className="label">块太小的代价</div><div className="en">每句话的队列变<b>长</b></div><div className="zh">块太碎就退回死路①：序列变长、每一步都更贵、工作记忆吃紧。主流词表停在几万到二十几万块 —— 不是理论推出来的真理，而是工程上反复权衡的结果。</div></div>
        </div>
      </Lsec>

      <Lsec
        title="🎛️ 亲手切一句试试"
        lead="下面是一个示意版分词器：中文优先匹配约 40 个硬编码的常见双字词、否则逐字；英文按一张小小的子词表贪心切分；数字两位一切。这是教学简化版 —— 真实 BPE 的词表有几万到几十万块，切法也更细腻，但“切块 + 编号”的感觉是一样的。"
      >
        <TokenizerDemo />
      </Lsec>

      <Lsec title="🔍 三个怪现象，一个解释" lead="很多“大模型怎么连这都不会”的新闻，换上 token 眼镜一看，立刻不奇怪了。">
        <div className="use-grid">
          <div className="card use-card"><div className="label">怪现象 ①</div><div className="en">数不清 strawberry 里有几个 <b>r</b></div><div className="zh">它看到的不是 10 个字母，而是 <Mini c={0}>str</Mini><Mini c={1}>aw</Mini><Mini c={2}>berry</Mini> 三个编号块。问它字母数，就像隔着电话问你“我刚才那句话一共多少笔画”。</div></div>
          <div className="card use-card"><div className="label">怪现象 ②</div><div className="en">认为 9.11 比 9.9 <b>大</b></div><div className="zh">切块后是 <Mini c={0}>9</Mini><Mini c={1}>.</Mini><Mini c={2}>11</Mini> 对 <Mini c={0}>9</Mini><Mini c={1}>.</Mini><Mini c={3}>9</Mini>。逐块对照时「11」压过「9」—— 像版本号、像日期，就是不像小数。数字被切块后，比较并不天然按数值进行。</div></div>
          <div className="card use-card"><div className="label">怪现象 ③</div><div className="en">为什么按 <b>token</b> 计费</div><div className="zh">token 是模型每一步计算的基本单位：吃进多少块、吐出多少块，算力就花多少。所以 API 按 token 收费，模型的“工作记忆”上限（上下文窗口）也按 token 数 —— 第 17 课细讲。</div></div>
        </div>
      </Lsec>

      <Lsec
        title="📖 深入展开 · 现象反查：你在 ChatGPT / Claude 里见过的这些事"
        lead="学会了机制，就能反过来“破案”。下面每一条你大概率亲眼见过 —— 左边是现象，右边是 token 层面的真相。"
      >
        <div className="card">
          <table className="match">
            <thead><tr><th>你看到的现象</th><th>背后的 token 机制</th></tr></thead>
            <tbody>
              <tr><td className="ph">回答一小段一小段地“蹦”，偶尔先蹦出半个词</td><td className="ex">模型一步只算出一个 token，系统算完立刻发给你（流式输出）。蹦出的最小单位是块不是字，半个词（一个子词块）先露面再正常不过。</td></tr>
              <tr><td className="ph">同样的内容，中文对话比英文“烧”额度烧得快</td><td className="ex">中文 token 密度低：一个字常花 1 到 2 块，而英文一块能装大半个词。计费和上下文额度都按块数算，中文天然要交“语言税”。</td></tr>
              <tr><td className="ph">让它倒着拼单词、数笔画、写藏头诗，常常翻车</td><td className="ex">字母和笔画在切块时就被“封进”块里了，模型看不见块的内部 —— 它靠训练时的统计印象在猜，不是在看。新一代模型常调用代码工具来绕过这个盲区。</td></tr>
              <tr><td className="ph">聊得太长，它开始忘记你开头说过什么</td><td className="ex">模型的工作记忆（上下文窗口）按 token 数设上限，挤不下的部分会被截掉。也因此“长文档问答”贵且难 —— 第 17 课展开。</td></tr>
              <tr><td className="ph">个别奇怪的字符串能让它当场胡言乱语</td><td className="ex">“故障 token”：编号在词表里、训练语料中却几乎没出现过，模型对这个编号毫无经验。早年著名的 SolidGoldMagikarp（一个论坛用户名）就是这样一块“幽灵积木”。</td></tr>
            </tbody>
          </table>
        </div>
        <p className="lead" style={{ marginTop: 18 }}>这套“现象 → token”的破案思路值得记住：以后再看到大模型犯莫名其妙的错，先问一句 ——<b>“它看到的块，和我看到的字，是一回事吗？”</b>多数谜团到这里就解开了。</p>
      </Lsec>

      <Lsec
        title="🧩 猜猜切几块"
        lead="检验一下手感：下面这些词在典型分词器里会被切成几块？先在心里报个数，再点卡片揭晓。块数因分词器而异，对上数量级就算赢。"
      >
        <div className="flip-grid">
          {GUESS.map((g, i) => <FlipCard key={i} q={g.q} pill={g.pill} why={g.why} />)}
        </div>
      </Lsec>

      <Lsec title="⚠️ 常见误区">
        <div className="card alert-card row-list">
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">一个 token 就是一个单词 / 一个汉字</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">token 可能是半个词、一个词组、一个标点，甚至只是一个字节 —— 完全由语料里的出现频率决定</span></div>
            </div>
            <p className="why"><b>病因：</b>“词元”这个译名太像“词”了。其实 BPE 只认频率不认语法：“今天”够高频就是一整块，“饕餮”太冷门就被拆成字节碎渣 —— 块的边界和人类的“词”边界经常对不上。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">模型认识每一个汉字，理解它的字形和笔画</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">模型只认识 token 编号 —— “字”这个概念对它根本不存在</span></div>
            </div>
            <p className="why"><b>病因：</b>拟人化想象。模型收到的永远是 [3742, 1102, …] 这样的编号序列，字长什么样、由几笔写成，它无从得知。它对“字”的一切感觉，都是从编号的搭配规律里间接学来的 —— 所以拆字、数笔画、玩字形谜语，恰恰是它的天然盲区。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">分词器是模型的一部分，会在使用中跟着变聪明</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">分词器在模型训练开始前就定稿冻结了 —— 它只是一张查频率定下来的“切块对照表”</span></div>
            </div>
            <p className="why"><b>病因：</b>把“翻译官”当成了“大脑”。流程上是先用语料统计出词表、冻结分词器，然后整个训练和之后的所有对话都用这同一张表。所以一个新梗火起来之后，老模型依然按旧表把它切成碎块 —— 这也是模型带“年代感”的原因之一。</p>
          </div>
        </div>
      </Lsec>

      <Lsec title="✍️ 小练习">
        <div className="card quiz row-list">
          <QuizItem q="1. 朋友吐槽：“连 strawberry 里有几个 r 都数不对，还叫人工智能？”请你用本课的知识替模型“喊冤”。">
            模型看到的不是字母，而是 <b>[str][aw][berry] 三个 token 编号</b>。字母层面的信息在切块时就被“封装”了，它只能靠训练中的统计印象猜 —— 这是分词机制的盲区，不是智力问题。（新一代模型常靠调用代码工具来绕过这个盲区。）
          </QuizItem>
          <QuizItem q="2. 同样意思的一段话，用中文写和用英文写，哪个通常消耗更多 token？这对 API 账单意味着什么？">
            通常<b>中文更多</b>：英文一个 token 平均装下大半个词，而中文一个字常要花 1 到 2 个 token，同义内容的中文 token 数往往更高。按 token 计费时，同样的话中文版常常更贵 —— 不过不同分词器对中文的优化差异很大，以实际切分为准。
          </QuizItem>
          <QuizItem q="3. 把 9.11 和 9.9 分别写成示意 token 序列，并解释模型为什么可能比错大小。">
            9.11 → <b>[9][.][11]</b>，9.9 → <b>[9][.][9]</b>。模型不是按数值比较，而是按块的统计规律“接龙”：「11」压过「9」这件事在版本号、日期、章节号里大量成立，于是它顺势答错。把问题改写成“按小数比较”或让它列竖式，正确率会明显上升。
          </QuizItem>
          <QuizItem q="4. ChatGPT 回答时，字是一小段一小段“蹦”出来的，偶尔还会先蹦出半个词。用本课的机制解释这个现象。">
            模型每一步只产出<b>一个 token 编号</b>，系统算完立刻把它还原成文字发给你 —— 这叫流式输出。蹦出来的最小单位是 token 块而不是字，所以半个词（一个子词块）先出现、下一拍再补全，完全符合机制。
          </QuizItem>
        </div>
      </Lsec>
    </>
  )
}
