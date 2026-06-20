import { useState } from 'react'
import { Lsec, Pill, FlipCard, QuizItem } from '../components/ui.jsx'
import { useLang } from '../i18n/LangContext.jsx'

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

// 双语内容层：结构 / class / 交互 / SVG 几何与数值均不变，仅文本按语言取用。
// 代码块标识符、API、函数名逐字不变；仅中文注释与中文展示字符串双语化。
const C = {
  zh: {
    // 演示一：六步管线步进图 —— 节点 label、箭头文字、信息面板
    plNodeLabels: ['📄 原始文档', '✂️ 切块', '🔢 每块变向量', '🗂 存进 list', '❓ 问题', '🧭 变向量', '🔍 取 top-k', '📋 拼 prompt', '🤖 生成回答'],
    plArrowText: '在 list 里逐块比相似度',
    plInfo: [
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
    ],
    plDemoTitle: '🎛️ 交互演示 · RAG 六步管线，步步对应代码',
    plDemoHint: '点「下一步」步进，或直接点图上的方块',
    plSvgAria: 'RAG 六步管线：上排离线建库，下排在线问答',
    plLaneOffline: '离线 · 建库（整库只跑一次）',
    plLaneOnline: '在线 · 问答（每次提问都跑）',
    plBottomNote: '上排产物（向量 list）是下排每次检索的"货架"',
    plBtnPrev: '◂ 上一步',
    plBtnNext: '▸ 下一步',
    plBtnOverview: '↺ 总览',
    plOverviewStep: '总览 · 0 / 6 步',
    plStepA: '第 ',
    plStepB: ' / 6 步',
    plPillFallback: '6 步 ↔ 下文 5 段代码',

    // 演示二：亲手切一篇文档
    ckDemoTitle: '🎛️ 交互演示 · 亲手切一篇文档',
    ckDemoHint: '拖动两个滑块，看块数和块的"成色"怎么变',
    ckSvgAria: '切块演示：滑块控制 chunk_size 与 overlap，下方交错的方块表示切出的块',
    ckDocLabel: '一篇 1200 字的文档（示意）',
    ckOverlapNote: '块上下交错摆放，横向重叠的部分就是 overlap',
    ckChunkCount: '切出块数',
    ckChunkCountUnit: ' 块',
    ckPerChunk: '每块字数',
    ckPerChunkA: '约 ',
    ckPerChunkB: ' 字',
    ckTopHit: 'top-3 命中进窗',
    ckTopHitA: '约 ',
    ckTopHitB: ' 字',
    ckVerdictSmall: '太碎：一块只剩半句话的量，检索常常"命中了词、丢掉了上下文"，拼出来的资料读不成完整意思。',
    ckVerdictMid: '比较舒服：一块约一个段落，语义完整；top-3 进窗也不挤。记住这只是起点，最优值长在你自己的文档上。',
    ckVerdictBigA: '偏大：一块混进多个话题，相似度被无关内容稀释、容易拿错块；top-3 命中就塞进 ',
    ckVerdictBigB: ' 字，开始挤占上下文窗口（第 17 课）。',

    // 代码五段（标识符 / API 不译；仅中文注释与展示字符串双语化）
    code1: `def load_chunks(path, chunk_size=300, overlap=50):
    text = open(path, encoding=<span class="str">"utf-8"</span>).read()      <span class="cm"># 整篇读进来</span>
    chunks, start = [], 0
    while start &lt; len(text):
        chunks.append(text[start:start + chunk_size])  <span class="cm"># 切下一块</span>
        start += chunk_size - overlap                  <span class="cm"># 前进时留 50 字重叠</span>
    return chunks

chunks = load_chunks(<span class="str">"docs.txt"</span>)                     <span class="cm"># 换成你的任何 txt 文档</span>
print(f<span class="str">"共切出 {len(chunks)} 块"</span>)`,
    code2: `import os
from openai import OpenAI

client = OpenAI(api_key=os.environ[<span class="str">"API_KEY"</span>])      <span class="cm"># key 只放环境变量（第 26 课的纪律）</span>

def embed(text):
    resp = client.embeddings.create(
        model=<span class="str">"text-embedding-3-small"</span>,            <span class="cm"># 中文场景请换中文效果好的模型</span>
        input=text)
    return resp.data[0].embedding                  <span class="cm"># 一串一千多个数字 —— 第 8 课的"坐标"</span>

vectors = [embed(c) for c in chunks]               <span class="cm"># 所谓"向量库"，今天就是这个 list</span>`,
    code3: `import math

def cos_sim(a, b):                                 <span class="cm"># 余弦相似度：夹角越小，值越接近 1</span>
    dot = sum(x * y for x, y in zip(a, b))         <span class="cm"># 点积：方向越一致越大</span>
    na  = math.sqrt(sum(x * x for x in a))         <span class="cm"># 向量 a 的长度</span>
    nb  = math.sqrt(sum(x * x for x in b))         <span class="cm"># 向量 b 的长度</span>
    return dot / (na * nb)                         <span class="cm"># 除掉长度 —— 只比方向，不比长短</span>`,
    code4: `def search(question, k=3):
    q_vec = embed(question)                        <span class="cm"># 问题也变坐标：必须用同一个 embedding 模型！</span>
    scored = [(cos_sim(q_vec, v), c)               <span class="cm"># 给库里每一块打相似度分</span>
              for v, c in zip(vectors, chunks)]
    scored.sort(key=lambda t: t[0], reverse=True)  <span class="cm"># 按分数从高到低排</span>
    return [c for _, c in scored[:k]]              <span class="cm"># 取前 k 块 —— 这就是"检索"</span>`,
    code5: `def ask(question):
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
    print(<span class="str">"答："</span>, ask(q))`,

    // 翻车诊室
    debug: [
      { q: '症状一：检索回来的 k 块全都不相关，跟问题八竿子打不着', pill: { type: 'terracotta', text: '先怀疑 embedding' },
        why: '把 top-k 片段连同相似度分数打印出来人眼看。中文文档配了英文为主的 embedding 模型是头号嫌犯 —— 换中文效果好的；再查文件编码：乱码进了库，向量全是噪声，怎么搜都歪。' },
      { q: '症状二：片段明明相关，回答却答非所问', pill: { type: 'amber', text: '打印拼好的 prompt' },
        why: '别猜，print(prompt)！看看到底塞了什么给模型：片段被截断、塞进重复块、资料太长把问题挤出注意力焦点（第 17 课）…… 十有八九，病灶就明晃晃躺在你打印出来的字符串里。' },
      { q: '症状三：资料里明明没有，它还是一本正经地编', pill: { type: 'sky', text: '把边界写死在提示词里' },
        why: '检查 prompt 是否白纸黑字写了「资料里没有就回答不知道」—— 这是第 18 课误区②的解药，漏写它模型必然用预训练记忆补位。还不行就把这条指令挪到资料之后、问题之前，再强调一遍。' },
    ],

    goalsTitle: '🎯 你将学会',
    goals: [
      <>把第 18 课的 6 步流程图逐步翻译成约 60 行 Python：不装框架、不建向量数据库，一个 list 跑通完整 RAG</>,
      <>读懂并敢改代码五段：切块、向量化、余弦相似度、top-k 检索、拼 prompt 生成</>,
      <>建立 chunk_size / overlap / top-k 的调参直觉，知道每个旋钮拧大拧小各付什么代价</>,
      <>掌握三种翻车现场的 debug 套路：第一反应永远是"打印出来看"，而不是瞎换模型</>,
    ],

    conceptTitle: '💡 核心概念：先把 6 步图挂回墙上',
    conceptLead: '第 18 课你看懂了 RAG 的原理图，这一课把它一步一步变成能跑的代码。动手之前，先纠正一个普遍的想象：',
    contrastTag1: '想象中',
    contrastBig1: <>做 RAG <span className="gap">=</span> 学一套重型框架 ＋ 部署向量数据库</>,
    contrastNote1: '框架和向量库当然有用，但第一天就上它们，你只学会了"调包"，没学会 RAG。',
    contrastTag2: '实际上',
    contrastBig2: <>做 RAG <span className="gap">=</span> <span className="hl">约 60 行 Python ＋ 一个 list</span></>,
    contrastNote2: '向量存 list、检索靠排序、生成靠第 26 课的那次 API 调用 —— 麻雀虽小，五脏俱全。',
    conceptP: <>这就是本课的工程化目标：<b>60 行、零框架、不用任何向量数据库</b> —— 先懂原理，再上工具。下面是第 18 课那张 6 步图的"工程版"：点「下一步」步进，或直接点任何方块，右侧会告诉你这一步对应下文哪段代码。</>,

    segTitle: '🧩 代码五段：60 行，从文档到答案',
    segLead: '下面五段自上而下拼进一个文件，就是完整的 rag.py —— 约 60 行，比这页讲解还短。每段先上代码（行内有中文注释），再说人话。',
    seg1H: <>读入文档，切成块</>,
    seg1P: <><b>块（chunk）是检索的最小单位</b>，chunk_size=300 表示一块约 300 字 —— 大致一个段落的量。<b>overlap=50</b> 让相邻两块共享 50 字：没有它，一句关键的话恰好被切口拦腰斩断，两边各拿半句，检索时谁也对不上。第 18 课说过，正经做法是按标题和段落边界切；这里用固定长度版本，因为它最短、最能看清本质 —— 切块策略以后随时可以单独升级，不影响其余四段。</>,
    seg2H: <>循环调 embedding API，向量存进 list</>,
    seg2P: <>embedding 是与对话 API 并列的另一种接口：发进去一段文字，返回一串数字坐标 —— <b>意思相近的文字，坐标就相近</b>（第 8 课的全部家底）。最后一行把每块都向量化，按顺序存进 list：<b>这个 list 就是你的"向量库"</b>，几千块以内毫无压力。两个工程提示：embedding 按 token 计费但比对话便宜得多（具体以官网为准）；整库向量化要花几分钟，算完用 json 存盘，下次直接读 —— 别每次启动都重算。</>,
    seg3H: <>余弦相似度：四行纯 Python</>,
    seg3P: <>第 8 课的口诀在这里落地：<b>语义即坐标，夹角越小越相似</b>—— 这把"量夹角"的尺子叫余弦相似度（cosine similarity）。这个函数比的是两个向量的"方向"是否一致 —— 完全同向得 1，毫不相干趋近 0。用 numpy 可以写成一行（np.dot(a, b) / (norm(a) * norm(b))），向量数据库里那些花哨的索引，最终算的也是同一个数。四行代码，整条管线的数学就到顶了。</>,
    seg4H: <>检索：问题变向量，排序取 top-k</>,
    seg4P: <>检索的全部秘密：<b>问题向量化 → 逐块打分 → 排序 → 取前 k</b>。注意第一行的铁律 —— 问题必须用<b>建库时同一个</b> embedding 模型变向量，两套坐标系之间没法比距离。这里是朴素的暴力遍历，几百几千块文档，Python 排序绰绰有余；向量数据库做的本质就是这件事，只是用专门的索引让它在上亿向量上依然毫秒级返回。</>,
    seg5H: <>拼 prompt，调对话 API</>,
    seg5P: <>最后一段把所有零件接上电：检索到的 k 块拼进一个 prompt，开头那两句指令是整段的灵魂 —— <b>"仅根据资料回答"划定边界，"没有就说不知道"堵死编造</b>（第 18 课误区②的解药，必须白纸黑字写进字符串）。然后就是第 26 课你写过的那次普通 API 调用。模型并不知道向量库的存在，它只是做了一场"带资料的阅读理解" —— 但对提问的人来说，它突然"懂了"你的私人文档。</>,
    segFootnote: '示例沿用第 26 课的 OpenAI 兼容写法，多数国产模型直接兼容这套接口；注意个别厂商不提供 embedding 接口（如 Anthropic 官方推荐用第三方），届时 embedding 和对话可以来自两家 —— 只要建库和提问用同一个 embedding 模型即可。还想完全离线？第 27 课的 Ollama 同样提供 embedding 与对话两种接口，把 base_url 指过去，这 60 行就变成一个不联网的私人知识库。',

    tuneTitle: '🎚️ 调参直觉：每个旋钮都有代价',
    tuneLead: <>代码里有三个不起眼的数字：chunk_size=300、overlap=50、k=3。它们不是真理，是<b>跷跷板的支点</b> —— 拧向任何一头都要付代价。先在下面亲手切一篇文档找找感觉：</>,
    tuneP1: <><b>chunk 太小</b>：每块只剩半句话，检索常常"命中了词、丢掉了上下文"，模型拿到一堆碎片读不成完整意思；<b>chunk 太大</b>：一块混进多个话题，相似度被无关内容稀释、容易拿错块，命中后还整块塞进上下文窗口 —— 第 17 课说过，窗内噪声越多，注意力越散、钱也越冤。</>,
    tuneP2: <><b>top-k 同理</b>：k 太小，答案恰好散在多处时关键证据捞不全；k 太大，窗口里挤满半相关的块，噪声反而淹没正确答案。k=3～5 起步，遇到"一个问题的答案分散在好几份文档"再调大。最重要的一句：<b>这些参数没有万能值，最优解长在你自己的文档上</b> —— 改一个参数、跑十个真实问题、看答案变好还是变坏，这个土办法胜过一切教程。</>,

    debugTitle: '🛠️ 翻车诊室：三种症状，先打印再 debug',
    debugLead: <>RAG 是一条管线，debug 第一原则是<b>先定位坏在哪一段，再动手修</b>。而定位最强的工具不是什么观测平台，是 print()。下面三种最常见的翻车现场 —— 先想想你会先查哪里，再点开看套路：</>,

    upgradeSourceNote: (
      <>
        挑选 embedding 模型可参考公开评测基准 MTEB，Muennighoff 等 2022{' '}
        <a href="https://arxiv.org/abs/2210.07316" target="_blank" rel="noreferrer">
          MTEB: Massive Text Embedding Benchmark
        </a>
        （含中文榜单，但最终仍以你自己的真实问答实测为准）。
      </>
    ),
    bridgeTitle: '➡️ 下一课怎么接上',
    bridgeLead: '你已经能搭出一个会查私有文档的 RAG 应用了。但“跑起来”和“能上线”之间还差关键一步：你怎么知道它答得对、答得好？改了切块参数到底是变好还是变坏？上线之后又有哪些安全红线不能碰？下一课讲评估与安全：怎么给模型“体检”、幻觉/提示注入/越狱这些坑怎么防——上线之前必须补的最后一课。',
    bridgeSteps: ['RAG 应用搭好了', '但怎么知道它答得好？', '上线前还有安全红线', '下一课：评估与安全'],
    upgradeTitle: '🚀 升级路线：60 行如何长成生产系统',
    upgradeP: <>今天这 60 行就是所有生产级 RAG 的骨架 —— 后面的一切都是<b>换零件，不是换图纸</b>。文档涨到几十万块、list 遍历变慢？把 list 换成 <b>pgvector</b> 或专用向量数据库，它们只是把"存向量 + 找最近邻"做快、做稳。检索想再准一截？加<b>重排序（rerank）</b>：先粗捞 50 块，再用更强的模型精排出最好的 5 块；或者上<b>混合检索</b>：向量负责"按意思找"、关键词负责"按字面找"，互补短板。无论装备升到哪一级，流程仍然是你刚刚亲手写完的这六步。</>,

    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      {
        bad: 'RAG 工程 = 调个库，一行 .query() 就搞定了',
        good: '检索质量才是 80% 的功夫所在：切块策略、embedding 选型、top-k、提示词边界，每一环都要亲手调',
        why: <><b>病因：</b>框架的官方 demo 五分钟就能跑通，造成"RAG 很简单"的错觉。但跑通 ≠ 答得准：demo 用的是干净数据和简单问题，你的真实文档一上来就会翻车 —— 而要调的，恰恰是本课这五段代码里暴露出来的参数和指令。框架封装得越深，你越不知道该去哪儿拧。</>,
      },
      {
        bad: 'embedding 模型随便挑一个就行，反正都是变向量',
        good: '中文场景必须选中文效果好的模型，并用自己的真实问答跑个小评测再定',
        why: <><b>病因：</b>embedding 决定"按意思找"找不找得准，是整条管线的地基 —— 地基歪了，后面排序、拼 prompt 全白搭。不同模型的中文能力差距明显：公开榜单（如 MTEB 的中文榜）可做初筛，但最作数的是拿你自己的几十条真实"问题 → 应命中片段"跑一遍，数一数命中率再拍板。</>,
      },
    ],

    quizTitle: '✍️ 小练习',
    quizLead: '三道题都建议先动手再看答案 —— 完整代码就在上面，复制下来就能跑。',
    quiz: [
      {
        q: '1. 把 chunk_size 从 300 改成 50，再改成 2000，分别预测问答质量会怎么变？为什么？',
        a: <><b>两头都变差。</b>50：块碎成半句话，检索常命中只言片语，模型拿到的上下文读不通；2000：一块混多个话题，相似度被稀释、容易拿错块，且 top-3 一进窗就是几千字，噪声挤占注意力（第 17 课）。几百字附近通常最稳 —— 但最优值取决于你的文档结构，亲手扫一遍参数最作数。</>,
      },
      {
        q: '2. 你问了一个文档里明确有答案的问题，它却答错了。给出 5 分钟内的 debug 三步。',
        a: <>① <b>打印 top-k 片段</b>：人眼判断相关吗？不相关 → 检索 / embedding 的锅（换模型、查编码、调 chunk）；② 相关 → <b>打印完整 prompt</b>：片段有没有被截断、指令和问题还在不在；③ 都没问题 → 检查"不知道就说不知道"是否写死，再换更强的对话模型对照一次。先定位，再修 —— 顺序不能反。</>,
      },
      {
        q: '3. 知识库新增了一份文档。需要重新训练什么吗？最少要重算哪些向量？',
        a: <><b>什么都不用训练</b> —— RAG 的知识在库里、不在模型参数里（第 18 课）。只需把新文档切块、逐块 embedding、append 进 list；旧向量一个都不用动。这正是 RAG 知识更新近乎零成本的原因，也是知识注入场景下它几乎一边倒胜过微调的理由。</>,
      },
    ],
  },

  en: {
    plNodeLabels: ['📄 Raw document', '✂️ Chunk it', '🔢 Each chunk → vector', '🗂 Store in list', '❓ Question', '🧭 → vector', '🔍 Take top-k', '📋 Build prompt', '🤖 Generate answer'],
    plArrowText: 'Score similarity chunk by chunk in the list',
    plInfo: [
      { t: 'Overview: one diagram, two pipelines', code: null,
        d: 'The top row, "indexing," runs only once over the whole document library; its product is a list packed with vectors. The bottom row, "Q&A," runs in full every time you ask. Lesson 18\'s 6-step diagram returns as-is — the difference is that this time every step has to be written as code.' },
      { t: 'Step ① · Chunking', code: 'Maps to code section ①',
        d: 'Cut a long document into chunks of a few hundred characters each, leaving an overlap between adjacent chunks so sentences don\'t get cut in half. The chunk is the smallest unit of retrieval — its size directly determines how accurately you can find things later.' },
      { t: 'Step ② · Vectorize, store in list', code: 'Maps to code section ②',
        d: 'Call the embedding API once per chunk, turning "meaning" into a string of numeric coordinates (Lesson 8). The so-called "vector store," today, is just a Python list holding coordinates in order.' },
      { t: 'Step ③ · Question → vector', code: 'Maps to code section ④',
        d: 'After the user asks, use the same embedding model to turn the question into coordinates too. It must be the same one — you can\'t measure distance between two different coordinate systems.' },
      { t: 'Step ④ · Cosine similarity, take top-k', code: 'Maps to code sections ③④',
        d: 'Give every chunk in the store a similarity score: the smaller the angle, the more similar (Lesson 8\'s geometric intuition). Sort, take the top k — however fancy a vector database is, this is essentially all it does.' },
      { t: 'Step ⑤ · Build the prompt', code: 'Maps to code section ⑤',
        d: 'Hard-code the instruction: "Answer only based on the material below; if it\'s not in the material, say you don\'t know," then append the k matched chunks and the question. Lesson 16\'s boundary-drawing technique becomes a single string here.' },
      { t: 'Step ⑥ · Generate the answer', code: 'Maps to code section ⑤',
        d: 'One ordinary chat API call, the Lesson 26 code copied verbatim. The model has no idea the vector store exists — it just did a piece of "reading comprehension with supplied material."' },
    ],
    plDemoTitle: '🎛️ Interactive · the RAG 6-step pipeline, each step mapped to code',
    plDemoHint: 'Click "Next" to step through, or click a box on the diagram directly',
    plSvgAria: 'RAG 6-step pipeline: top row offline indexing, bottom row online Q&A',
    plLaneOffline: 'Offline · indexing (runs once over the whole library)',
    plLaneOnline: 'Online · Q&A (runs on every question)',
    plBottomNote: 'The top row\'s product (the vector list) is the "shelf" the bottom row searches every time',
    plBtnPrev: '◂ Previous',
    plBtnNext: '▸ Next',
    plBtnOverview: '↺ Overview',
    plOverviewStep: 'Overview · 0 / 6 steps',
    plStepA: 'Step ',
    plStepB: ' / 6',
    plPillFallback: '6 steps ↔ 5 code sections below',

    ckDemoTitle: '🎛️ Interactive · chunk a document yourself',
    ckDemoHint: 'Drag the two sliders to see how the chunk count and chunk "quality" change',
    ckSvgAria: 'Chunking demo: sliders control chunk_size and overlap; the staggered boxes below represent the chunks produced',
    ckDocLabel: 'A 1200-character document (illustrative)',
    ckOverlapNote: 'Chunks are staggered up and down; the horizontally overlapping part is the overlap',
    ckChunkCount: 'Chunks produced',
    ckChunkCountUnit: ' chunks',
    ckPerChunk: 'Chars per chunk',
    ckPerChunkA: 'about ',
    ckPerChunkB: ' chars',
    ckTopHit: 'top-3 hits into the window',
    ckTopHitA: 'about ',
    ckTopHitB: ' chars',
    ckVerdictSmall: 'Too fragmented: a chunk holds only half a sentence\'s worth, so retrieval often "hits the word but loses the context," and the assembled material can\'t be read as a complete meaning.',
    ckVerdictMid: 'Fairly comfortable: a chunk is about one paragraph, semantically complete; the top-3 fit into the window without crowding. Remember this is only a starting point — the optimal value grows out of your own documents.',
    ckVerdictBigA: 'On the large side: a chunk mixes in multiple topics, similarity gets diluted by irrelevant content and you easily grab the wrong chunk; a top-3 hit stuffs in ',
    ckVerdictBigB: ' chars, starting to crowd the context window (Lesson 17).',

    code1: `def load_chunks(path, chunk_size=300, overlap=50):
    text = open(path, encoding=<span class="str">"utf-8"</span>).read()      <span class="cm"># read the whole thing in</span>
    chunks, start = [], 0
    while start &lt; len(text):
        chunks.append(text[start:start + chunk_size])  <span class="cm"># cut the next chunk</span>
        start += chunk_size - overlap                  <span class="cm"># advance, leaving 50 chars of overlap</span>
    return chunks

chunks = load_chunks(<span class="str">"docs.txt"</span>)                     <span class="cm"># swap in any txt document of yours</span>
print(f<span class="str">"Cut {len(chunks)} chunks in total"</span>)`,
    code2: `import os
from openai import OpenAI

client = OpenAI(api_key=os.environ[<span class="str">"API_KEY"</span>])      <span class="cm"># key stays in env vars only (Lesson 26's discipline)</span>

def embed(text):
    resp = client.embeddings.create(
        model=<span class="str">"text-embedding-3-small"</span>,            <span class="cm"># for Chinese, switch to a model that handles Chinese well</span>
        input=text)
    return resp.data[0].embedding                  <span class="cm"># a string of a thousand-plus numbers — Lesson 8's "coordinates"</span>

vectors = [embed(c) for c in chunks]               <span class="cm"># the so-called "vector store" is just this list today</span>`,
    code3: `import math

def cos_sim(a, b):                                 <span class="cm"># cosine similarity: smaller angle, value closer to 1</span>
    dot = sum(x * y for x, y in zip(a, b))         <span class="cm"># dot product: larger as directions align</span>
    na  = math.sqrt(sum(x * x for x in a))         <span class="cm"># length of vector a</span>
    nb  = math.sqrt(sum(x * x for x in b))         <span class="cm"># length of vector b</span>
    return dot / (na * nb)                         <span class="cm"># divide out length — compare direction only, not magnitude</span>`,
    code4: `def search(question, k=3):
    q_vec = embed(question)                        <span class="cm"># question → coordinates too: must use the SAME embedding model!</span>
    scored = [(cos_sim(q_vec, v), c)               <span class="cm"># score every chunk in the store for similarity</span>
              for v, c in zip(vectors, chunks)]
    scored.sort(key=lambda t: t[0], reverse=True)  <span class="cm"># sort by score, highest first</span>
    return [c for _, c in scored[:k]]              <span class="cm"># take the top k chunks — this is "retrieval"</span>`,
    code5: `def ask(question):
    pieces = search(question)                      <span class="cm"># retrieve first, get the k most relevant chunks</span>
    context = <span class="str">"\\n---\\n"</span>.join(pieces)
    prompt = (<span class="str">"Answer the question based only on the material below; "</span>      <span class="cm"># draw the boundary: Lesson 16's technique</span>
              <span class="str">"if the info isn't in the material, just answer \\"I don't know.\\"\\n\\n"</span>
              f<span class="str">"[Material]\\n{context}\\n\\n[Question]{question}"</span>)
    resp = client.chat.completions.create(         <span class="cm"># Lesson 26's call code copied verbatim</span>
        model=<span class="str">"gpt-4o-mini"</span>,
        messages=[{<span class="str">"role"</span>: <span class="str">"user"</span>, <span class="str">"content"</span>: prompt}])
    return resp.choices[0].message.content

while True:
    q = input(<span class="str">"\\nQ: "</span>)                            <span class="cm"># the most bare-bones Q&A loop</span>
    if q.strip() == <span class="str">"quit"</span>:
        break
    print(<span class="str">"A: "</span>, ask(q))`,

    debug: [
      { q: 'Symptom 1: the k retrieved chunks are all irrelevant, miles away from the question', pill: { type: 'terracotta', text: 'Suspect the embedding first' },
        why: 'Print the top-k snippets along with their similarity scores and eyeball them. A Chinese document paired with an English-first embedding model is the prime suspect — switch to one that handles Chinese well; then check the file encoding: garbled text in the store means all-noise vectors, and no search will land right.' },
      { q: 'Symptom 2: the snippets are clearly relevant, but the answer is off-topic', pill: { type: 'amber', text: 'Print the assembled prompt' },
        why: 'Don\'t guess — print(prompt)! See what actually got stuffed into the model: snippets truncated, duplicate chunks slipped in, material so long it pushes the question out of the attention focus (Lesson 17)… nine times out of ten, the culprit is lying right there in plain sight in the string you printed.' },
      { q: 'Symptom 3: it\'s plainly not in the material, yet it makes things up with a straight face', pill: { type: 'sky', text: 'Hard-code the boundary into the prompt' },
        why: 'Check whether the prompt says in black and white "if it\'s not in the material, answer that you don\'t know" — this is the cure for Lesson 18\'s misconception ②; leave it out and the model will inevitably fill in with pretraining memory. Still failing? Move that instruction to after the material and before the question, and emphasize it once more.' },
    ],

    goalsTitle: '🎯 What You\'ll Learn',
    goals: [
      <>Translate Lesson 18\'s 6-step flow, step by step, into about 60 lines of Python: no framework, no vector database, a full RAG running on a single list</>,
      <>Read — and dare to modify — the five code sections: chunking, vectorizing, cosine similarity, top-k retrieval, and prompt-assembled generation</>,
      <>Build intuition for tuning chunk_size / overlap / top-k, knowing the cost of turning each knob up or down</>,
      <>Master the debug routine for three failure scenes: the first instinct is always "print it and look," not blindly swapping models</>,
    ],

    conceptTitle: '💡 Core Idea: first, hang the 6-step diagram back on the wall',
    conceptLead: 'In Lesson 18 you understood the principle diagram of RAG; this lesson turns it, step by step, into runnable code. Before getting hands-on, let\'s correct one common picture:',
    contrastTag1: 'Imagined',
    contrastBig1: <>Doing RAG <span className="gap">=</span> learning a heavyweight framework ＋ deploying a vector database</>,
    contrastNote1: 'Frameworks and vector stores are useful, of course, but adopt them on day one and you\'ve only learned to "call a library," not learned RAG.',
    contrastTag2: 'In reality',
    contrastBig2: <>Doing RAG <span className="gap">=</span> <span className="hl">about 60 lines of Python ＋ one list</span></>,
    contrastNote2: 'Vectors stored in a list, retrieval by sorting, generation by that one API call from Lesson 26 — small but complete, every organ in place.',
    conceptP: <>This is the engineering goal of the lesson: <b>60 lines, zero framework, no vector database whatsoever</b> — understand the principle first, then bring in the tools. Below is the "engineering version" of that 6-step diagram from Lesson 18: click "Next" to step through, or click any box directly, and the right side will tell you which code section below this step maps to.</>,

    segTitle: '🧩 Five Code Sections: 60 lines, from document to answer',
    segLead: 'The five sections below, assembled top to bottom into one file, are the complete rag.py — about 60 lines, shorter than this page of explanation. Each section shows the code first (with inline comments), then plain talk.',
    seg1H: <>Read in the document, cut it into chunks</>,
    seg1P: <>The <b>chunk is the smallest unit of retrieval</b>; chunk_size=300 means a chunk is about 300 characters — roughly one paragraph\'s worth. <b>overlap=50</b> lets adjacent chunks share 50 characters: without it, a key sentence cut right at the seam leaves half on each side, and at retrieval time neither matches. Lesson 18 noted that the proper approach is to cut along heading and paragraph boundaries; here we use the fixed-length version because it\'s the shortest and shows the essence most clearly — the chunking strategy can be upgraded separately anytime later, without affecting the other four sections.</>,
    seg2H: <>Loop the embedding API, store vectors in a list</>,
    seg2P: <>The embedding API is another interface alongside the chat API: send in a chunk of text, get back a string of numeric coordinates — <b>texts close in meaning get close coordinates</b> (the whole of Lesson 8). The last line vectorizes every chunk and stores them in order in a list: <b>this list is your "vector store,"</b> no trouble at all under a few thousand chunks. Two engineering tips: embedding is billed per token but is far cheaper than chat (check the official site for specifics); vectorizing a whole library takes a few minutes, so save the result to disk as json and just read it next time — don\'t recompute on every startup.</>,
    seg3H: <>Cosine similarity: four lines of pure Python</>,
    seg3P: <>Lesson 8\'s mantra lands here: <b>meaning is coordinates, and the smaller the angle, the more similar</b>. This function compares whether the "direction" of two vectors agrees — perfectly aligned gives 1, totally unrelated approaches 0. With numpy it can be one line (np.dot(a, b) / (norm(a) * norm(b))), and all those fancy indexes in a vector database ultimately compute the same number. Four lines of code, and the math of the whole pipeline tops out here.</>,
    seg4H: <>Retrieval: vectorize the question, sort, take top-k</>,
    seg4P: <>The whole secret of retrieval: <b>vectorize the question → score every chunk → sort → take the top k</b>. Note the iron rule on the first line — the question must be vectorized with <b>the same</b> embedding model used at indexing time; you can\'t measure distance between two coordinate systems. This is a naive brute-force scan; for a few hundred or few thousand chunks, Python\'s sort is more than enough. A vector database does essentially this same thing, only using a dedicated index to keep returns at millisecond speed even over hundreds of millions of vectors.</>,
    seg5H: <>Build the prompt, call the chat API</>,
    seg5P: <>The last section wires all the parts to power: the k retrieved chunks are assembled into one prompt, and the two opening instructions are the soul of the whole thing — <b>"answer only based on the material" draws the boundary, "if it\'s not there, say you don\'t know" blocks fabrication</b> (the cure for Lesson 18\'s misconception ②, which must be written into the string in black and white). Then comes that ordinary API call you wrote in Lesson 26. The model has no idea the vector store exists; it just did a piece of "reading comprehension with supplied material" — but to the person asking, it suddenly "understands" their private documents.</>,
    segFootnote: 'The example continues Lesson 26\'s OpenAI-compatible style, and most domestic models are directly compatible with this interface; note that a few vendors don\'t offer an embedding interface (e.g., Anthropic officially recommends a third party), in which case embedding and chat can come from two different vendors — as long as indexing and querying use the same embedding model. Want to go fully offline? Lesson 27\'s Ollama also offers both embedding and chat interfaces; point base_url at it and these 60 lines become an offline private knowledge base.',

    tuneTitle: '🎚️ Tuning Intuition: every knob has a cost',
    tuneLead: <>There are three unremarkable numbers in the code: chunk_size=300, overlap=50, k=3. They aren\'t truths, they\'re <b>the fulcrum of a seesaw</b> — turn toward either end and you pay a cost. First get a feel for it by chunking a document yourself below:</>,
    tuneP1: <><b>Chunk too small</b>: each chunk holds only half a sentence, so retrieval often "hits the word but loses the context," and the model gets a pile of fragments that don\'t read as a whole; <b>chunk too large</b>: a chunk mixes in multiple topics, similarity gets diluted by irrelevant content and you easily grab the wrong chunk, and once hit the whole thing gets stuffed into the context window — as Lesson 17 said, the more noise in the window, the more scattered the attention and the more wasted the money.</>,
    tuneP2: <><b>top-k is the same</b>: too small a k and you can\'t scoop up all the key evidence when the answer happens to be scattered across places; too large a k and the window fills with semi-relevant chunks, the noise drowning out the right answer. Start at k=3–5, and turn it up only when you hit "the answer to one question is scattered across several documents." The most important line: <b>these parameters have no universal value; the optimal solution grows out of your own documents</b> — change one parameter, run ten real questions, see whether the answers get better or worse; this homely method beats every tutorial.</>,

    debugTitle: '🛠️ Failure Clinic: three symptoms, print before you debug',
    debugLead: <>RAG is a pipeline, and the first principle of debugging is to <b>locate which section is broken before you touch anything</b>. And the strongest tool for locating it isn\'t some observability platform — it\'s print(). Here are the three most common failure scenes — think about where you\'d look first, then open them to see the routine:</>,

    upgradeSourceNote: (
      <>
        For choosing an embedding model, see the public benchmark MTEB, Muennighoff et al. 2022,{' '}
        <a href="https://arxiv.org/abs/2210.07316" target="_blank" rel="noreferrer">
          MTEB: Massive Text Embedding Benchmark
        </a>
        (it includes a Chinese leaderboard, but go by testing on your own real Q&A in the end).
      </>
    ),
    bridgeTitle: '➡️ How This Leads to Lesson 29',
    bridgeLead: 'You can now build a RAG app that queries private documents. But between "it runs" and "it can ship" lies a crucial step: how do you know it answers correctly and well? When you tweak the chunking parameters, did it actually get better or worse? And what safety red lines must you not cross in production? The next lesson covers evaluation and safety: how to give a model a "checkup," and how to guard against hallucination, prompt injection, and jailbreaks — the last lesson you must take before shipping.',
    bridgeSteps: ['RAG app is built', 'But how good are its answers?', 'Safety red lines before launch', 'Next: Evaluation & Safety'],
    upgradeTitle: '🚀 The Upgrade Path: how 60 lines grow into a production system',
    upgradeP: <>Today\'s 60 lines are the skeleton of every production-grade RAG — everything that follows is <b>swapping parts, not changing the blueprint</b>. Documents grow to hundreds of thousands of chunks and the list scan slows down? Swap the list for <b>pgvector</b> or a dedicated vector database; they just make "store vectors + find nearest neighbors" fast and robust. Want retrieval a notch more accurate? Add <b>reranking</b>: scoop up 50 chunks coarsely first, then use a stronger model to finely rank out the best 5; or go <b>hybrid retrieval</b>: vectors handle "find by meaning," keywords handle "find by literal text," each covering the other\'s weakness. No matter how far the gear is upgraded, the flow is still these six steps you just wrote by hand.</>,

    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      {
        bad: 'RAG engineering = call a library, one line of .query() and you\'re done',
        good: 'Retrieval quality is where 80% of the work is: chunking strategy, embedding choice, top-k, prompt boundary — every link has to be tuned by hand',
        why: <><b>Cause:</b> a framework\'s official demo runs in five minutes, creating the illusion that "RAG is simple." But running ≠ answering accurately: the demo uses clean data and simple questions, while your real documents blow up the moment they arrive — and what needs tuning is exactly the parameters and instructions exposed in this lesson\'s five code sections. The deeper a framework wraps things, the less you know where to turn the knob.</>,
      },
      {
        bad: 'Just pick any embedding model, they all just make vectors anyway',
        good: 'For Chinese you must pick a model that handles Chinese well, and decide only after running a small evaluation with your own real Q&A',
        why: <><b>Cause:</b> the embedding decides whether "finding by meaning" finds accurately; it\'s the foundation of the whole pipeline — a crooked foundation makes the later sorting and prompt-building all for nothing. Different models differ markedly in Chinese ability: public leaderboards (like MTEB\'s Chinese board) work for an initial screen, but what counts most is taking a few dozen of your own real "question → should-hit snippet" pairs, running them through, counting the hit rate, and only then calling it.</>,
      },
    ],

    quizTitle: '✍️ Quick Quiz',
    quizLead: 'For all three, get hands-on before looking at the answer — the full code is right above, copy it and it runs.',
    quiz: [
      {
        q: '1. Change chunk_size from 300 to 50, then to 2000, and predict how Q&A quality changes in each case. Why?',
        a: <><b>Both ends get worse.</b> 50: chunks fragment into half-sentences, retrieval often hits only fragments, and the context the model gets doesn\'t read coherently; 2000: a chunk mixes multiple topics, similarity gets diluted and you easily grab the wrong chunk, and a top-3 fills the window with thousands of characters, noise crowding attention (Lesson 17). Around a few hundred characters is usually most stable — but the optimal value depends on your document structure, and a hands-on sweep of the parameter counts most.</>,
      },
      {
        q: '2. You asked a question the document clearly has an answer to, yet it answered wrong. Give a three-step debug within 5 minutes.',
        a: <>① <b>Print the top-k snippets</b>: do they look relevant to the eye? Irrelevant → it\'s retrieval / embedding\'s fault (swap the model, check the encoding, adjust the chunk); ② relevant → <b>print the full prompt</b>: were the snippets truncated, are the instruction and question still there; ③ all fine → check whether "say you don\'t know if you don\'t know" is hard-coded, then swap in a stronger chat model for a comparison run. Locate first, fix second — the order can\'t be reversed.</>,
      },
      {
        q: '3. A new document is added to the knowledge base. Does anything need retraining? What\'s the minimum set of vectors to recompute?',
        a: <><b>Nothing needs training</b> — RAG\'s knowledge is in the store, not in the model parameters (Lesson 18). Just chunk the new document, embed it chunk by chunk, and append to the list; not a single old vector needs to move. This is exactly why RAG\'s knowledge updates cost next to nothing, and why for knowledge-injection scenarios it almost lopsidedly beats fine-tuning.</>,
      },
    ],
  },
}

// ============================================================
// 演示一：六步管线步进图
// ============================================================
const PL_NODES = [
  { step: 1, x: 14,  y: 32,  w: 86, tx: 57,  ty: 54,  fs: 11 },
  { step: 1, x: 118, y: 32,  w: 86, tx: 161, ty: 54,  fs: 11 },
  { step: 2, x: 222, y: 32,  w: 86, tx: 265, ty: 54,  fs: 11 },
  { step: 2, x: 326, y: 32,  w: 86, tx: 369, ty: 54,  fs: 11 },
  { step: 3, x: 14,  y: 126, w: 70, tx: 49,  ty: 148, fs: 10.5 },
  { step: 3, x: 97,  y: 126, w: 70, tx: 132, ty: 148, fs: 10.5 },
  { step: 4, x: 180, y: 126, w: 70, tx: 215, ty: 148, fs: 10.5 },
  { step: 5, x: 263, y: 126, w: 70, tx: 298, ty: 148, fs: 10.5 },
  { step: 6, x: 346, y: 126, w: 70, tx: 381, ty: 148, fs: 10.5 },
]
const PL_ARROWS = [
  { step: 1, d: 'M100 50 H110', poly: '118,50 110,46 110,54' },
  { step: 2, d: 'M204 50 H214', poly: '222,50 214,46 214,54' },
  { step: 2, d: 'M308 50 H318', poly: '326,50 318,46 318,54' },
  { step: 4, d: 'M369 68 V96 H215 V114', poly: '215,122 211,114 219,114', hasText: true, tx: 298, ty: 90 },
  { step: 3, d: 'M84 144 H89', poly: '97,144 89,140 89,148' },
  { step: 3, d: 'M167 144 H172', poly: '180,144 172,140 172,148' },
  { step: 4, d: 'M250 144 H255', poly: '263,144 255,140 255,148' },
  { step: 5, d: 'M333 144 H338', poly: '346,144 338,140 338,148' },
]

function PipelineDemo({ c }) {
  const [step, setStep] = useState(REDUCED ? 6 : 0)
  const inf = c.plInfo[step]
  return (
    <div className="card demo" style={{ marginTop: 16 }}>
      <div className="demo-head">
        <span className="demo-title">{c.plDemoTitle}</span>
        <span className="demo-hint">{c.plDemoHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="pl-svg" viewBox="0 0 430 200" width="440" aria-label={c.plSvgAria}>
            <text x="14" y="22" fontSize="10" fontWeight="600" fill="var(--fg-2)">{c.plLaneOffline}</text>
            <text x="14" y="116" fontSize="10" fontWeight="600" fill="var(--fg-2)">{c.plLaneOnline}</text>
            {PL_ARROWS.map((a, i) => {
              const on = step > 0 && a.step <= step
              return (
                <g key={'a' + i} className={`pl-arrow${on ? ' on' : ''}`}>
                  <path d={a.d} />
                  <polygon points={a.poly} />
                  {a.hasText && <text x={a.tx} y={a.ty} textAnchor="middle" fontSize="8.5" fill="var(--fg-2)" stroke="none">{c.plArrowText}</text>}
                </g>
              )
            })}
            {PL_NODES.map((n, i) => {
              const cur = step > 0 && n.step === step
              const done = step > 0 && n.step < step
              return (
                <g key={'n' + i} className={`pl-node${cur ? ' cur' : ''}${done ? ' done' : ''}`} onClick={() => setStep(n.step)}>
                  <rect x={n.x} y={n.y} width={n.w} height="36" rx="9" />
                  <text x={n.tx} y={n.ty} textAnchor="middle" fontSize={n.fs}>{c.plNodeLabels[i]}</text>
                </g>
              )
            })}
            <text x="215" y="186" textAnchor="middle" fontSize="9.5" fill="var(--fg-2)">{c.plBottomNote}</text>
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            <button className="chip" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step <= 0}>{c.plBtnPrev}</button>
            <button className="chip" onClick={() => setStep((s) => Math.min(6, s + 1))} disabled={step >= 6}>{c.plBtnNext}</button>
            <button className="chip" onClick={() => setStep(0)}>{c.plBtnOverview}</button>
          </div>
          <h4 style={{ marginTop: 14 }}>{inf.t}</h4>
          <div className="period">{step === 0 ? c.plOverviewStep : c.plStepA + step + c.plStepB}</div>
          <p>{inf.d}</p>
          <div className="tags">
            {inf.code ? <Pill type="amber">{inf.code}</Pill> : <Pill type="ink">{c.plPillFallback}</Pill>}
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

function ChunkDemo({ c }) {
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
    size <= 100 ? c.ckVerdictSmall
    : size <= 420 ? c.ckVerdictMid
    : c.ckVerdictBigA + 3 * size + c.ckVerdictBigB

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.ckDemoTitle}</span>
        <span className="demo-hint">{c.ckDemoHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="ck-svg" viewBox="0 0 420 150" width="420" aria-label={c.ckSvgAria}>
            <text x="14" y="14" fontSize="10" fill="var(--fg-2)">{c.ckDocLabel}</text>
            <rect x="14" y="22" width="392" height="16" rx="5" fill="var(--bg-inset)" stroke="var(--hairline)" />
            <g>{rects}</g>
            <text x="14" y="142" fontSize="9.5" fill="var(--fg-2)">{c.ckOverlapNote}</text>
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
            <div><span>{c.ckChunkCount}</span><b>{n}{c.ckChunkCountUnit}</b></div>
            <div><span>{c.ckPerChunk}</span><b>{c.ckPerChunkA}{size}{c.ckPerChunkB}</b></div>
            <div><span>{c.ckTopHit}</span><b>{c.ckTopHitA}{Math.min(3, n) * size}{c.ckTopHitB}</b></div>
          </div>
          <p style={{ fontSize: 13 }}>{verdict}</p>
        </div>
      </div>
    </div>
  )
}

export default function L28() {
  const { lang } = useLang()
  const c = C[lang] || C.zh

  return (
    <>
      <Lsec title={c.goalsTitle}>
        <div className="card goals">
          {c.goals.map((g, i) => (
            <div className="goal-item" key={i}><span className="tick">✓</span>{g}</div>
          ))}
        </div>
      </Lsec>

      <Lsec
        title={c.conceptTitle}
        lead={c.conceptLead}
      >
        <div className="contrast">
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-ink">{c.contrastTag1}</span></div>
            <div className="big">{c.contrastBig1}</div>
            <p className="note">{c.contrastNote1}</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">{c.contrastTag2}</span></div>
            <div className="big">{c.contrastBig2}</div>
            <p className="note">{c.contrastNote2}</p>
          </div>
        </div>
        <p>{c.conceptP}</p>
        <PipelineDemo c={c} />
      </Lsec>

      <Lsec
        title={c.segTitle}
        lead={c.segLead}
      >
        <div className="seg">
          <h3><span className="num">①</span>{c.seg1H}</h3>
          <Code html={c.code1} />
          <p>{c.seg1P}</p>
        </div>

        <div className="seg">
          <h3><span className="num">②</span>{c.seg2H}</h3>
          <Code html={c.code2} />
          <p>{c.seg2P}</p>
        </div>

        <div className="seg">
          <h3><span className="num">③</span>{c.seg3H}</h3>
          <Code html={c.code3} />
          <p>{c.seg3P}</p>
        </div>

        <div className="seg">
          <h3><span className="num">④</span>{c.seg4H}</h3>
          <Code html={c.code4} />
          <p>{c.seg4P}</p>
        </div>

        <div className="seg">
          <h3><span className="num">⑤</span>{c.seg5H}</h3>
          <Code html={c.code5} />
          <p>{c.seg5P}</p>
        </div>

        <p className="footnote" style={{ marginTop: 18 }}>{c.segFootnote}</p>
      </Lsec>

      <Lsec
        title={c.tuneTitle}
        lead={c.tuneLead}
      >
        <ChunkDemo c={c} />
        <p>{c.tuneP1}</p>
        <p>{c.tuneP2}</p>
      </Lsec>

      <Lsec
        title={c.debugTitle}
        lead={c.debugLead}
      >
        <div className="flip-grid">
          {c.debug.map((d, i) => <FlipCard key={i} q={d.q} pill={d.pill} why={d.why} />)}
        </div>
      </Lsec>

      <Lsec title={c.upgradeTitle}>
        <p>{c.upgradeP}</p>
        <p className="footnote source-note">{c.upgradeSourceNote}</p>
      </Lsec>

      <Lsec title={c.pitfallsTitle}>
        <div className="card alert-card row-list">
          {c.pitfalls.map((p, i) => (
            <div className="alert-item" key={i}>
              <div className="wrong-right">
                <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">{p.bad}</span></div>
                <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">{p.good}</span></div>
              </div>
              <p className="why">{p.why}</p>
            </div>
          ))}
        </div>
      </Lsec>

      <Lsec
        title={c.quizTitle}
        lead={c.quizLead}
      >
        <div className="card quiz row-list">
          {c.quiz.map((qz, i) => (
            <QuizItem key={i} q={qz.q}>{qz.a}</QuizItem>
          ))}
        </div>
      </Lsec>

      <Lsec title={c.bridgeTitle} lead={c.bridgeLead}>
        <div className="bridge-flow">
          {c.bridgeSteps.map((step, i) => (
            <span className="bridge-flow-item" key={step}>
              <span className="bridge-flow-step">
                <b>{i + 1}</b>
                {step}
              </span>
              {i < c.bridgeSteps.length - 1 && <span className="bridge-flow-arrow">→</span>}
            </span>
          ))}
        </div>
      </Lsec>
    </>
  )
}
