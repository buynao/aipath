import { useState } from 'react'
import { Lsec, Pill, FlipCard, QuizItem } from '../components/ui.jsx'

const REDUCED =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function Code({ html }) {
  return (
    <pre className="code">
      <code dangerouslySetInnerHTML={{ __html: html }} />
    </pre>
  )
}

// ============================================================
// 演示一：六步管线步进图
// ============================================================
const PL_NODES = [
  { step: 1, x: 14,  y: 32,  w: 86, tx: 57,  ty: 54,  fs: 11,   label: '📄 原始文档' },
  { step: 1, x: 118, y: 32,  w: 86, tx: 161, ty: 54,  fs: 11,   label: '✂️ 切块' },
  { step: 2, x: 222, y: 32,  w: 86, tx: 265, ty: 54,  fs: 11,   label: '🔢 每块变向量' },
  { step: 2, x: 326, y: 32,  w: 86, tx: 369, ty: 54,  fs: 11,   label: '🗂 存进 list' },
  { step: 3, x: 14,  y: 126, w: 70, tx: 49,  ty: 148, fs: 10.5, label: '❓ 问题' },
  { step: 3, x: 97,  y: 126, w: 70, tx: 132, ty: 148, fs: 10.5, label: '🧭 变向量' },
  { step: 4, x: 180, y: 126, w: 70, tx: 215, ty: 148, fs: 10.5, label: '🔍 取 top-k' },
  { step: 5, x: 263, y: 126, w: 70, tx: 298, ty: 148, fs: 10.5, label: '📋 拼 prompt' },
  { step: 6, x: 346, y: 126, w: 70, tx: 381, ty: 148, fs: 10.5, label: '🤖 生成回答' },
]
const PL_ARROWS = [
  { step: 1, d: 'M100 50 H110', poly: '118,50 110,46 110,54' },
  { step: 2, d: 'M204 50 H214', poly: '222,50 214,46 214,54' },
  { step: 2, d: 'M308 50 H318', poly: '326,50 318,46 318,54' },
  { step: 4, d: 'M369 68 V96 H215 V114', poly: '215,122 211,114 219,114', text: '在 list 里逐块比相似度', tx: 298, ty: 90 },
  { step: 3, d: 'M84 144 H89', poly: '97,144 89,140 89,148' },
  { step: 3, d: 'M167 144 H172', poly: '180,144 172,140 172,148' },
  { step: 4, d: 'M250 144 H255', poly: '263,144 255,140 255,148' },
  { step: 5, d: 'M333 144 H338', poly: '346,144 338,140 338,148' },
]
const PL_INFO = [
  { t: '总览：一张图，两条流水线', code: null,
    d: '上排「建库」对整个文档库只跑一次，产物是一个存满向量的 list；下排「问答」每次提问都完整跑一遍。第 18 课的 6 步图原样回归 —— 区别是这次每一步都要写成代码。' },
  { t: '第 ① 步 · 切块', code: '对应代码第 ① 段',
    d: '把长文档切成几百字一块，相邻块留一段重叠，避免句子被拦腰斩断。块是检索的最小单位 —— 它的大小直接决定后面找得准不准。' },
  { t: '第 ② 步 · 向量化，存进 list', code: '对应代码第 ② 段',
    d: '每一块调一次 embedding API，把"意思"变成一串数字坐标（第 8 课）。所谓"向量库"，今天就是一个按顺序存坐标的 Python list。' },
  { t: '第 ③ 步 · 问题变向量', code: '对应代码第 ④ 段',
    d: '用户提问后，用同一个 embedding 模型把问题也变成坐标。必须是同一个 —— 两套坐标系之间没法比距离。' },
  { t: '第 ④ 步 · 余弦相似度，取 top-k', code: '对应代码第 ③④ 段',
    d: '给库里每一块打一个相似度分：夹角越小越相似（第 8 课的几何直觉）。排序、取前 k 块 —— 向量数据库再花哨，干的本质就是这一步。' },
  { t: '第 ⑤ 步 · 拼 prompt', code: '对应代码第 ⑤ 段',
    d: '把指令写死：「仅根据以下资料回答，资料里没有就说不知道」，再接上命中的 k 块和问题。第 16 课的划边界技法，在这里变成一个字符串。' },
  { t: '第 ⑥ 步 · 生成回答', code: '对应代码第 ⑤ 段',
    d: '一次普通的对话 API 调用，第 26 课的代码原样照搬。模型并不知道向量库的存在 —— 它只是做了一场"带资料的阅读理解"。' },
]

function PipelineDemo() {
  const [step, setStep] = useState(REDUCED ? 6 : 0)
  const inf = PL_INFO[step]
  return (
    <div className="card demo" style={{ marginTop: 16 }}>
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · RAG 六步管线，步步对应代码</span>
        <span className="demo-hint">点「下一步」步进，或直接点图上的方块</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="pl-svg" viewBox="0 0 430 200" width="440" aria-label="RAG 六步管线：上排离线建库，下排在线问答">
            <text x="14" y="22" fontSize="10" fontWeight="600" fill="var(--fg-2)">离线 · 建库（整库只跑一次）</text>
            <text x="14" y="116" fontSize="10" fontWeight="600" fill="var(--fg-2)">在线 · 问答（每次提问都跑）</text>
            {PL_ARROWS.map((a, i) => {
              const on = step > 0 && a.step <= step
              return (
                <g key={'a' + i} className={`pl-arrow${on ? ' on' : ''}`}>
                  <path d={a.d} />
                  <polygon points={a.poly} />
                  {a.text && <text x={a.tx} y={a.ty} textAnchor="middle" fontSize="8.5" fill="var(--fg-2)" stroke="none">{a.text}</text>}
                </g>
              )
            })}
            {PL_NODES.map((n, i) => {
              const cur = step > 0 && n.step === step
              const done = step > 0 && n.step < step
              return (
                <g key={'n' + i} className={`pl-node${cur ? ' cur' : ''}${done ? ' done' : ''}`} onClick={() => setStep(n.step)}>
                  <rect x={n.x} y={n.y} width={n.w} height="36" rx="9" />
                  <text x={n.tx} y={n.ty} textAnchor="middle" fontSize={n.fs}>{n.label}</text>
                </g>
              )
            })}
            <text x="215" y="186" textAnchor="middle" fontSize="9.5" fill="var(--fg-2)">上排产物（向量 list）是下排每次检索的"货架"</text>
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            <button className="chip" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step <= 0}>◂ 上一步</button>
            <button className="chip" onClick={() => setStep((s) => Math.min(6, s + 1))} disabled={step >= 6}>▸ 下一步</button>
            <button className="chip" onClick={() => setStep(0)}>↺ 总览</button>
          </div>
          <h4 style={{ marginTop: 14 }}>{inf.t}</h4>
          <div className="period">{step === 0 ? '总览 · 0 / 6 步' : '第 ' + step + ' / 6 步'}</div>
          <p>{inf.d}</p>
          <div className="tags">
            {inf.code ? <Pill type="amber">{inf.code}</Pill> : <Pill type="ink">6 步 ↔ 下文 5 段代码</Pill>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 演示二：亲手切一篇文档
// ============================================================
const DOC = 1200, CK_X = 14, CK_W = 392

function ChunkDemo() {
  const [size, setSize] = useState(300)
  const [ovRaw, setOvRaw] = useState(50)
  const ov = Math.min(ovRaw, size - 20)

  const rects = []
  let n = 0
  for (let start = 0; start < DOC; start += size - ov) {
    const end = Math.min(start + size, DOC)
    rects.push(
      <rect
        key={n}
        x={(CK_X + (start / DOC) * CK_W).toFixed(1)}
        y={n % 2 ? 84 : 52}
        width={Math.max(2, ((end - start) / DOC) * CK_W).toFixed(1)}
        height="26" rx="5"
        fill={n % 2 ? 'var(--sage-bg)' : 'var(--sky-bg)'}
        stroke={n % 2 ? 'var(--sage)' : 'var(--sky)'}
        strokeWidth="1"
      />
    )
    n++
    if (end >= DOC) break
  }

  const verdict =
    size <= 100 ? '太碎：一块只剩半句话的量，检索常常"命中了词、丢掉了上下文"，拼出来的资料读不成完整意思。'
    : size <= 420 ? '比较舒服：一块约一个段落，语义完整；top-3 进窗也不挤。记住这只是起点，最优值长在你自己的文档上。'
    : '偏大：一块混进多个话题，相似度被无关内容稀释、容易拿错块；top-3 命中就塞进 ' + 3 * size + ' 字，开始挤占上下文窗口（第 17 课）。'

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · 亲手切一篇文档</span>
        <span className="demo-hint">拖动两个滑块，看块数和块的"成色"怎么变</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="ck-svg" viewBox="0 0 420 150" width="420" aria-label="切块演示：滑块控制 chunk_size 与 overlap，下方交错的方块表示切出的块">
            <text x="14" y="14" fontSize="10" fill="var(--fg-2)">一篇 1200 字的文档（示意）</text>
            <rect x="14" y="22" width="392" height="16" rx="5" fill="var(--bg-inset)" stroke="var(--hairline)" />
            <g>{rects}</g>
            <text x="14" y="142" fontSize="9.5" fill="var(--fg-2)">块上下交错摆放，横向重叠的部分就是 overlap</text>
          </svg>
        </div>
        <div className="demo-side">
          <div className="slider-row">
            <label htmlFor="ck-size">chunk_size</label>
            <input type="range" id="ck-size" min="60" max="600" step="20" value={size} onChange={(e) => setSize(+e.target.value)} />
            <span className="val">{size}</span>
          </div>
          <div className="slider-row">
            <label htmlFor="ck-ov">overlap</label>
            <input type="range" id="ck-ov" min="0" max="120" step="10" value={ov} onChange={(e) => setOvRaw(+e.target.value)} />
            <span className="val">{ov}</span>
          </div>
          <div className="cost-stats">
            <div><span>切出块数</span><b>{n} 块</b></div>
            <div><span>每块字数</span><b>约 {size} 字</b></div>
            <div><span>top-3 命中进窗</span><b>约 {Math.min(3, n) * size} 字</b></div>
          </div>
          <p style={{ fontSize: 13 }}>{verdict}</p>
        </div>
      </div>
    </div>
  )
}

const CODE_1 = `def load_chunks(path, chunk_size=300, overlap=50):
    text = open(path, encoding=<span class="str">"utf-8"</span>).read()      <span class="cm"># 整篇读进来</span>
    chunks, start = [], 0
    while start &lt; len(text):
        chunks.append(text[start:start + chunk_size])  <span class="cm"># 切下一块</span>
        start += chunk_size - overlap                  <span class="cm"># 前进时留 50 字重叠</span>
    return chunks

chunks = load_chunks(<span class="str">"docs.txt"</span>)                     <span class="cm"># 换成你的任何 txt 文档</span>
print(f<span class="str">"共切出 {len(chunks)} 块"</span>)`

const CODE_2 = `import os
from openai import OpenAI

client = OpenAI(api_key=os.environ[<span class="str">"API_KEY"</span>])      <span class="cm"># key 只放环境变量（第 26 课的纪律）</span>

def embed(text):
    resp = client.embeddings.create(
        model=<span class="str">"text-embedding-3-small"</span>,            <span class="cm"># 中文场景请换中文效果好的模型</span>
        input=text)
    return resp.data[0].embedding                  <span class="cm"># 一串一千多个数字 —— 第 8 课的"坐标"</span>

vectors = [embed(c) for c in chunks]               <span class="cm"># 所谓"向量库"，今天就是这个 list</span>`

const CODE_3 = `import math

def cos_sim(a, b):                                 <span class="cm"># 余弦相似度：夹角越小，值越接近 1</span>
    dot = sum(x * y for x, y in zip(a, b))         <span class="cm"># 点积：方向越一致越大</span>
    na  = math.sqrt(sum(x * x for x in a))         <span class="cm"># 向量 a 的长度</span>
    nb  = math.sqrt(sum(x * x for x in b))         <span class="cm"># 向量 b 的长度</span>
    return dot / (na * nb)                         <span class="cm"># 除掉长度 —— 只比方向，不比长短</span>`

const CODE_4 = `def search(question, k=3):
    q_vec = embed(question)                        <span class="cm"># 问题也变坐标：必须用同一个 embedding 模型！</span>
    scored = [(cos_sim(q_vec, v), c)               <span class="cm"># 给库里每一块打相似度分</span>
              for v, c in zip(vectors, chunks)]
    scored.sort(key=lambda t: t[0], reverse=True)  <span class="cm"># 按分数从高到低排</span>
    return [c for _, c in scored[:k]]              <span class="cm"># 取前 k 块 —— 这就是"检索"</span>`

const CODE_5 = `def ask(question):
    pieces = search(question)                      <span class="cm"># 先检索，拿到最相关的 k 块</span>
    context = <span class="str">"\\n---\\n"</span>.join(pieces)
    prompt = (<span class="str">"仅根据下面提供的资料回答问题；"</span>      <span class="cm"># 划边界：第 16 课的技法</span>
              <span class="str">"资料里没有的信息，直接回答「我不知道」。\\n\\n"</span>
              f<span class="str">"【资料】\\n{context}\\n\\n【问题】{question}"</span>)
    resp = client.chat.completions.create(         <span class="cm"># 第 26 课的调用代码原样照搬</span>
        model=<span class="str">"gpt-4o-mini"</span>,
        messages=[{<span class="str">"role"</span>: <span class="str">"user"</span>, <span class="str">"content"</span>: prompt}])
    return resp.choices[0].message.content

while True:
    q = input(<span class="str">"\\n问："</span>)                            <span class="cm"># 最朴素的问答循环</span>
    if q.strip() == <span class="str">"quit"</span>:
        break
    print(<span class="str">"答："</span>, ask(q))`

const DEBUG = [
  { q: '症状一：检索回来的 k 块全都不相关，跟问题八竿子打不着', pill: { type: 'terracotta', text: '先怀疑 embedding' },
    why: '把 top-k 片段连同相似度分数打印出来人眼看。中文文档配了英文为主的 embedding 模型是头号嫌犯 —— 换中文效果好的；再查文件编码：乱码进了库，向量全是噪声，怎么搜都歪。' },
  { q: '症状二：片段明明相关，回答却答非所问', pill: { type: 'amber', text: '打印拼好的 prompt' },
    why: '别猜，print(prompt)！看看到底塞了什么给模型：片段被截断、塞进重复块、资料太长把问题挤出注意力焦点（第 17 课）…… 十有八九，病灶就明晃晃躺在你打印出来的字符串里。' },
  { q: '症状三：资料里明明没有，它还是一本正经地编', pill: { type: 'sky', text: '把边界写死在提示词里' },
    why: '检查 prompt 是否白纸黑字写了「资料里没有就回答不知道」—— 这是第 18 课误区②的解药，漏写它模型必然用预训练记忆补位。还不行就把这条指令挪到资料之后、问题之前，再强调一遍。' },
]

export default function L28() {
  return (
    <>
      <Lsec title="🎯 你将学会">
        <div className="card goals">
          <div className="goal-item"><span className="tick">✓</span>把第 18 课的 6 步流程图逐步翻译成约 60 行 Python：不装框架、不建向量数据库，一个 list 跑通完整 RAG</div>
          <div className="goal-item"><span className="tick">✓</span>读懂并敢改代码五段：切块、向量化、余弦相似度、top-k 检索、拼 prompt 生成</div>
          <div className="goal-item"><span className="tick">✓</span>建立 chunk_size / overlap / top-k 的调参直觉，知道每个旋钮拧大拧小各付什么代价</div>
          <div className="goal-item"><span className="tick">✓</span>掌握三种翻车现场的 debug 套路：第一反应永远是"打印出来看"，而不是瞎换模型</div>
        </div>
      </Lsec>

      <Lsec
        title="💡 核心概念：先把 6 步图挂回墙上"
        lead="第 18 课你看懂了 RAG 的原理图，这一课把它一步一步变成能跑的代码。动手之前，先纠正一个普遍的想象："
      >
        <div className="contrast">
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-ink">想象中</span></div>
            <div className="big">做 RAG <span className="gap">=</span> 学一套重型框架 ＋ 部署向量数据库</div>
            <p className="note">框架和向量库当然有用，但第一天就上它们，你只学会了"调包"，没学会 RAG。</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">实际上</span></div>
            <div className="big">做 RAG <span className="gap">=</span> <span className="hl">约 60 行 Python ＋ 一个 list</span></div>
            <p className="note">向量存 list、检索靠排序、生成靠第 26 课的那次 API 调用 —— 麻雀虽小，五脏俱全。</p>
          </div>
        </div>
        <p>这就是本课的工程化目标：<b>60 行、零框架、不用任何向量数据库</b> —— 先懂原理，再上工具。下面是第 18 课那张 6 步图的"工程版"：点「下一步」步进，或直接点任何方块，右侧会告诉你这一步对应下文哪段代码。</p>
        <PipelineDemo />
      </Lsec>

      <Lsec
        title="🧩 代码五段：60 行，从文档到答案"
        lead="下面五段自上而下拼进一个文件，就是完整的 rag.py —— 约 60 行，比这页讲解还短。每段先上代码（行内有中文注释），再说人话。"
      >
        <div className="seg">
          <h3><span className="num">①</span>读入文档，切成块</h3>
          <Code html={CODE_1} />
          <p><b>块（chunk）是检索的最小单位</b>，chunk_size=300 表示一块约 300 字 —— 大致一个段落的量。<b>overlap=50</b> 让相邻两块共享 50 字：没有它，一句关键的话恰好被切口拦腰斩断，两边各拿半句，检索时谁也对不上。第 18 课说过，正经做法是按标题和段落边界切；这里用固定长度版本，因为它最短、最能看清本质 —— 切块策略以后随时可以单独升级，不影响其余四段。</p>
        </div>

        <div className="seg">
          <h3><span className="num">②</span>循环调 embedding API，向量存进 list</h3>
          <Code html={CODE_2} />
          <p>embedding 是与对话 API 并列的另一种接口：发进去一段文字，返回一串数字坐标 —— <b>意思相近的文字，坐标就相近</b>（第 8 课的全部家底）。最后一行把每块都向量化，按顺序存进 list：<b>这个 list 就是你的"向量库"</b>，几千块以内毫无压力。两个工程提示：embedding 按 token 计费但比对话便宜得多（具体以官网为准）；整库向量化要花几分钟，算完用 json 存盘，下次直接读 —— 别每次启动都重算。</p>
        </div>

        <div className="seg">
          <h3><span className="num">③</span>余弦相似度：四行纯 Python</h3>
          <Code html={CODE_3} />
          <p>第 8 课的口诀在这里落地：<b>语义即坐标，夹角越小越相似</b>。这个函数比的是两个向量的"方向"是否一致 —— 完全同向得 1，毫不相干趋近 0。用 numpy 可以写成一行（np.dot(a, b) / (norm(a) * norm(b))），向量数据库里那些花哨的索引，最终算的也是同一个数。四行代码，整条管线的数学就到顶了。</p>
        </div>

        <div className="seg">
          <h3><span className="num">④</span>检索：问题变向量，排序取 top-k</h3>
          <Code html={CODE_4} />
          <p>检索的全部秘密：<b>问题向量化 → 逐块打分 → 排序 → 取前 k</b>。注意第一行的铁律 —— 问题必须用<b>建库时同一个</b> embedding 模型变向量，两套坐标系之间没法比距离。这里是朴素的暴力遍历，几百几千块文档，Python 排序绰绰有余；向量数据库做的本质就是这件事，只是用专门的索引让它在上亿向量上依然毫秒级返回。</p>
        </div>

        <div className="seg">
          <h3><span className="num">⑤</span>拼 prompt，调对话 API</h3>
          <Code html={CODE_5} />
          <p>最后一段把所有零件接上电：检索到的 k 块拼进一个 prompt，开头那两句指令是整段的灵魂 —— <b>"仅根据资料回答"划定边界，"没有就说不知道"堵死编造</b>（第 18 课误区②的解药，必须白纸黑字写进字符串）。然后就是第 26 课你写过的那次普通 API 调用。模型并不知道向量库的存在，它只是做了一场"带资料的阅读理解" —— 但对提问的人来说，它突然"懂了"你的私人文档。</p>
        </div>

        <p className="footnote" style={{ marginTop: 18 }}>示例沿用第 26 课的 OpenAI 兼容写法，多数国产模型直接兼容这套接口；注意个别厂商不提供 embedding 接口（如 Anthropic 官方推荐用第三方），届时 embedding 和对话可以来自两家 —— 只要建库和提问用同一个 embedding 模型即可。还想完全离线？第 27 课的 Ollama 同样提供 embedding 与对话两种接口，把 base_url 指过去，这 60 行就变成一个不联网的私人知识库。</p>
      </Lsec>

      <Lsec
        title="🎚️ 调参直觉：每个旋钮都有代价"
        lead={<>代码里有三个不起眼的数字：chunk_size=300、overlap=50、k=3。它们不是真理，是<b>跷跷板的支点</b> —— 拧向任何一头都要付代价。先在下面亲手切一篇文档找找感觉：</>}
      >
        <ChunkDemo />
        <p><b>chunk 太小</b>：每块只剩半句话，检索常常"命中了词、丢掉了上下文"，模型拿到一堆碎片读不成完整意思；<b>chunk 太大</b>：一块混进多个话题，相似度被无关内容稀释、容易拿错块，命中后还整块塞进上下文窗口 —— 第 17 课说过，窗内噪声越多，注意力越散、钱也越冤。</p>
        <p><b>top-k 同理</b>：k 太小，答案恰好散在多处时关键证据捞不全；k 太大，窗口里挤满半相关的块，噪声反而淹没正确答案。k=3～5 起步，遇到"一个问题的答案分散在好几份文档"再调大。最重要的一句：<b>这些参数没有万能值，最优解长在你自己的文档上</b> —— 改一个参数、跑十个真实问题、看答案变好还是变坏，这个土办法胜过一切教程。</p>
      </Lsec>

      <Lsec
        title="🛠️ 翻车诊室：三种症状，先打印再 debug"
        lead={<>RAG 是一条管线，debug 第一原则是<b>先定位坏在哪一段，再动手修</b>。而定位最强的工具不是什么观测平台，是 print()。下面三种最常见的翻车现场 —— 先想想你会先查哪里，再点开看套路：</>}
      >
        <div className="flip-grid">
          {DEBUG.map((d, i) => <FlipCard key={i} q={d.q} pill={d.pill} why={d.why} />)}
        </div>
      </Lsec>

      <Lsec title="🚀 升级路线：60 行如何长成生产系统">
        <p>今天这 60 行就是所有生产级 RAG 的骨架 —— 后面的一切都是<b>换零件，不是换图纸</b>。文档涨到几十万块、list 遍历变慢？把 list 换成 <b>pgvector</b> 或专用向量数据库，它们只是把"存向量 + 找最近邻"做快、做稳。检索想再准一截？加<b>重排序（rerank）</b>：先粗捞 50 块，再用更强的模型精排出最好的 5 块；或者上<b>混合检索</b>：向量负责"按意思找"、关键词负责"按字面找"，互补短板。无论装备升到哪一级，流程仍然是你刚刚亲手写完的这六步。</p>
      </Lsec>

      <Lsec title="⚠️ 常见误区">
        <div className="card alert-card row-list">
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">RAG 工程 = 调个库，一行 .query() 就搞定了</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">检索质量才是 80% 的功夫所在：切块策略、embedding 选型、top-k、提示词边界，每一环都要亲手调</span></div>
            </div>
            <p className="why"><b>病因：</b>框架的官方 demo 五分钟就能跑通，造成"RAG 很简单"的错觉。但跑通 ≠ 答得准：demo 用的是干净数据和简单问题，你的真实文档一上来就会翻车 —— 而要调的，恰恰是本课这五段代码里暴露出来的参数和指令。框架封装得越深，你越不知道该去哪儿拧。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">embedding 模型随便挑一个就行，反正都是变向量</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">中文场景必须选中文效果好的模型，并用自己的真实问答跑个小评测再定</span></div>
            </div>
            <p className="why"><b>病因：</b>embedding 决定"按意思找"找不找得准，是整条管线的地基 —— 地基歪了，后面排序、拼 prompt 全白搭。不同模型的中文能力差距明显：公开榜单（如 MTEB 的中文榜）可做初筛，但最作数的是拿你自己的几十条真实"问题 → 应命中片段"跑一遍，数一数命中率再拍板。</p>
          </div>
        </div>
      </Lsec>

      <Lsec
        title="✍️ 小练习"
        lead="三道题都建议先动手再看答案 —— 完整代码就在上面，复制下来就能跑。"
      >
        <div className="card quiz row-list">
          <QuizItem q="1. 把 chunk_size 从 300 改成 50，再改成 2000，分别预测问答质量会怎么变？为什么？">
            <b>两头都变差。</b>50：块碎成半句话，检索常命中只言片语，模型拿到的上下文读不通；2000：一块混多个话题，相似度被稀释、容易拿错块，且 top-3 一进窗就是几千字，噪声挤占注意力（第 17 课）。几百字附近通常最稳 —— 但最优值取决于你的文档结构，亲手扫一遍参数最作数。
          </QuizItem>
          <QuizItem q="2. 你问了一个文档里明确有答案的问题，它却答错了。给出 5 分钟内的 debug 三步。">
            ① <b>打印 top-k 片段</b>：人眼判断相关吗？不相关 → 检索 / embedding 的锅（换模型、查编码、调 chunk）；② 相关 → <b>打印完整 prompt</b>：片段有没有被截断、指令和问题还在不在；③ 都没问题 → 检查"不知道就说不知道"是否写死，再换更强的对话模型对照一次。先定位，再修 —— 顺序不能反。
          </QuizItem>
          <QuizItem q="3. 知识库新增了一份文档。需要重新训练什么吗？最少要重算哪些向量？">
            <b>什么都不用训练</b> —— RAG 的知识在库里、不在模型参数里（第 18 课）。只需把新文档切块、逐块 embedding、append 进 list；旧向量一个都不用动。这正是 RAG 知识更新近乎零成本的原因，也是知识注入场景下它几乎一边倒胜过微调的理由。
          </QuizItem>
        </div>
      </Lsec>
    </>
  )
}
