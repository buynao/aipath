import { useState } from 'react'
import { Lsec, QuizItem } from '../components/ui.jsx'
import { useLang } from '../i18n/LangContext.jsx'

// ============================================================
// L32 · 番外篇 · 拆解 Cursor:AI 怎么读懂你的整个代码库
// 双语内容层;事实依据均来自 cursor.com 官方博客/文档与创始人访谈,
// 关键数字经核验(向量索引 + Merkle 增量、Apply ~1000 token/s、
// Tab 日请求 4 亿、Series D 估值 $29.3B 等)。
// ============================================================

// 演示用的玩具"代码库"与查询(语义相似度用关键词重叠示意)
const TOTAL_TOKENS = 48000 // 整库塞进上下文的示意 token 量
const RETRIEVED_TOKENS = 1200 // 检索后注入的示意 token 量

const C = {
  zh: {
    // ---- 核心概念 ----
    conceptTitle: '💡 核心概念:它强在「模型之外」',
    conceptLead: 'Cursor 是这两年最火的 AI 代码编辑器 —— 一个 VS Code 的分叉版,却让无数程序员用上就回不去。最常见的吐槽是:"不就是把 ChatGPT 塞进编辑器、套了层壳吗?" 这句话错得很典型,也正是这一课要拆穿的地方 ——',
    contrastTag1: '直觉印象',
    contrastBig1: <>Cursor 就是<span className="gap">套了壳的 ChatGPT</span></>,
    contrastNote1: '好像换个更强的通用大模型,谁都能做一个。',
    contrastTag2: '真实机制',
    contrastBig2: <>Cursor 是<span className="hl">一组自研小模型 + 代码版 RAG + 推理加速</span>,前沿大模型只负责最需要推理的那部分</>,
    contrastNote2: '“快”和“懂你的库”这两种体验,是工程堆出来的,不是换个模型就能得到的。',
    exampleEn: <>联合创始人 Aman Sanger 的原话:<span className="hl">“Cursor 真正的运转,靠的是我们训练的一组自研模型,与前沿模型协同工作。”</span> 它把"写代码"这件事拆成一串延迟敏感的子任务,每一环都单独优化。</>,
    exampleZh: <>这正接上 L18「RAG:给 AI 外挂知识库」和 L20「Agent」—— Cursor 把这些课堂概念,落到了一个你每天都在用的真实产品里。</>,
    // ---- 事实卡 ----
    factsTitle: '🧩 先认清 Cursor:四张事实卡',
    factsLead: '动手拆原理前,先用四张经核实的卡片摆清底细:',
    facts: [
      { label: '出身 · Anysphere', term: <>VS Code <b>分叉版</b></>, body: <>由 Anysphere 开发,基于开源的 VS Code 二次开发,可一键导入你原来的配置与插件。底层<b>同时用第三方前沿模型</b>(Claude / GPT / Gemini)<b>和自研模型</b>。</> },
      { label: '体量 · 2025/11', term: <>估值 <b>$293 亿</b></>, body: <>D 轮估值约 293 亿美元,年化营收突破 10 亿美元 —— 一个编辑器能长这么大,靠的不是某个模型,是体验。光 Tab 补全<b>每天就处理超 4 亿次请求</b>。</> },
      { label: '读库 · 代码版 RAG', term: <><b>索引 + 检索</b></>, body: <>它不会把整个仓库硬塞进上下文(装不下),而是给代码库<b>建向量索引</b>,提问时只<b>检索出相关片段</b>注入上下文 —— 这就是 L18 的 RAG,搬到了代码上。</> },
      { label: '隐私 · 不留明文', term: <>只存 <b>向量</b></>, body: <>官方说明:用来算向量的明文代码<b>只在请求期间驻留内存、随后即丢弃</b>;长期存的是 embedding 向量 + 加密后的文件路径。开隐私模式则绝不用于训练。</> },
    ],
    factsSourceNote: (
      <>
        体量与隐私据 Cursor 官方{' '}
        <a href="https://cursor.com/blog/series-d" target="_blank" rel="noreferrer">Series D 公告</a>(2025-11)与{' '}
        <a href="https://cursor.com/docs/context/codebase-indexing" target="_blank" rel="noreferrer">代码库索引文档</a>
        ;"自研 + 第三方模型"据{' '}
        <a href="https://cursor.com/docs/models" target="_blank" rel="noreferrer">官方模型文档</a>
        。
      </>
    ),
    // ---- 三大子系统 ----
    sysTitle: '📖 三大子系统:把"写代码"拆成可优化的零件',
    sysLead: 'Cursor 的聪明,在于它没把"写代码"当成一个笼统的大任务丢给大模型,而是拆成三个延迟与体验各异的子任务,每一个都单独做了工程优化。下面每条配一个生活类比。',
    sys: [
      { n: '01', term: '读懂你的库:代码版 RAG', tag: '懂你',
        body: <>大模型的上下文窗口再大,也塞不下一个几十万行的仓库,硬塞既贵又稀释重点。Cursor 的办法是<b>给代码库建索引</b>:把代码切成有意义的块(函数、类),每块转成一个<b>向量(embedding)</b>存进向量库;你提问时,它把问题也转成向量,<b>只检索出最相关的几块</b>注入上下文。改动文件后,用 <b>Merkle 树</b>哈希精确找出变了哪些块、只重算这部分。</>,
        analogy: <><b>类比:</b>你不会把整座图书馆搬到书桌上,而是查目录、只抽出相关的几本。代码库索引就是那本"语义目录"。</> },
      { n: '02', term: 'Tab 补全:预测你的下一个编辑', tag: '快',
        body: <>普通补全只猜"下一个字符";Cursor 的 <b>Tab 是一个自研模型</b>,猜的是<b>"你下一步要做的整个编辑,以及光标该跳到哪"</b>。它在海量真实编辑上训练、还用<b>在线强化学习</b>每天滚动更新,所以越用越贴你的习惯 —— 它每天要处理<b>超 4 亿次</b>这样的预测。</>,
        analogy: <><b>类比:</b>像一个看了你一整天代码的结对搭档,你刚改完一处,他已经指着下一处说"这里也得跟着改",而不是逐字帮你打字。</> },
      { n: '03', term: 'Apply 套改:秒级把大段改动落地', tag: '更快',
        body: <>让大模型直接逐字重写整个文件又慢又容易抄错。Cursor 用一个<b>专门的"应用模型"</b>,配上自研的<b>推测式解码(speculative edits)</b>:因为它对"改完长什么样"已有强先验,可以跳着预测后续内容、再校验,把套用速度做到<b>约每秒 1000 个 token</b>(比常规推理快十几倍)。</>,
        analogy: <><b>类比:</b>熟练编辑改稿,不会逐字重抄全文,而是扫一眼就知道哪几处要动、刷刷改完 —— 速度来自"我大概知道结果"。</> },
    ],
    sysSourceNote: (
      <>
        三项机制据 Cursor 官方博客:{' '}
        <a href="https://cursor.com/blog/codebase-indexing" target="_blank" rel="noreferrer">代码库索引</a>、{' '}
        <a href="https://cursor.com/blog/tab-update" target="_blank" rel="noreferrer">Tab 模型</a> 与{' '}
        <a href="https://cursor.com/blog/tab-rl" target="_blank" rel="noreferrer">Tab 在线 RL</a>、{' '}
        <a href="https://cursor.com/blog/instant-apply" target="_blank" rel="noreferrer">每秒 1000 token 的 Apply</a>(2024–2025)。
      </>
    ),
    // ---- 交互演示 ----
    demoSecTitle: '🎛️ 交互演示:AI 不是"读完整个库",而是"检索几块"',
    demoSecLead: '这就是第一条子系统的手感。下面是一个玩具代码库的 8 个文件,选一个真实问题,看 Cursor 会从整库里"检索"出哪几块喂给大模型 —— 注意右边的账单:整库塞进上下文又贵又装不下,检索后只喂相关几块,又准又便宜。这正是 L18 的 RAG。',
    demo: {
      title: '🎛️ 代码版 RAG · 检索演示',
      hint: '选一个问题,看检索出哪几块',
      queryLabel: '你的问题:',
      retrievedTag: '✓ 检索进上下文',
      scoreLabel: '相关度',
      libTokens: '整库塞进上下文',
      injTokens: '检索后实际注入',
      tooBig: '✗ 装不下 / 又贵',
      justRight: '✓ 又准又便宜',
      note: (k) => `只把最相关的 ${k} 块喂给大模型,而不是整个仓库 —— 上下文又干净又省钱。`,
      queries: [
        { q: '用户登录为什么总是失败?', keys: ['登录', '鉴权', 'token', '用户'] },
        { q: '给支付流程加一个退款功能', keys: ['支付', '退款', '订单'] },
        { q: '改一下注册成功后的欢迎邮件', keys: ['邮件', '通知', '用户', '发送'] },
      ],
    },
    chunks: [
      { file: 'auth.js', desc: '登录与 JWT 鉴权', keys: ['登录', '鉴权', 'token', '密码'] },
      { file: 'user_api.js', desc: '用户增删改查接口', keys: ['用户', '接口', '数据库', '查询'] },
      { file: 'db.js', desc: '数据库连接与查询', keys: ['数据库', '查询', '连接'] },
      { file: 'payment.js', desc: '支付与退款逻辑', keys: ['支付', '退款', '订单'] },
      { file: 'cart.js', desc: '购物车与下单', keys: ['购物车', '订单', '商品'] },
      { file: 'email.js', desc: '发送邮件通知', keys: ['邮件', '通知', '发送'] },
      { file: 'utils.js', desc: '日期/字符串工具', keys: ['工具', '格式化'] },
      { file: 'styles.css', desc: '页面样式表', keys: ['样式', '颜色'] },
    ],
    // ---- 误区 ----
    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      {
        bad: 'Cursor 就是把 ChatGPT 套进 VS Code,没什么技术含量',
        good: '它是一组自研小模型(Tab / Apply / Composer)+ 代码版 RAG + 推理加速;前沿模型只做最重的推理',
        why: <><b>病因:</b>因为它确实会把高难度推理外包给 Claude / GPT,看上去像"套壳"。但让它好用的那些体验 —— 补全跟手、改动秒落地、能从几十万行里精准找到相关代码 —— 没有一个是"换个更强的通用模型"能白送的,全是工程:自研专用小模型、自建向量检索、推测式解码做低延迟。护城河在模型之外。</>,
      },
      {
        bad: 'AI 编程就是把我的整个代码库一股脑读进上下文',
        good: '上下文窗口装不下整库;Cursor 走的是"建索引 → 只检索相关几块"的代码版 RAG',
        why: <><b>病因:</b>"它好像什么都知道"会让人以为它把整个仓库都读了。其实几十万行代码远超任何上下文窗口,硬塞还会冲淡重点、暴涨成本。真实做法是 L18 的 RAG:预先把代码切块、转成向量建索引,提问时只检索出最相关的少数几块。它不是"读完了",而是"查得准"。</>,
      },
      {
        bad: 'Cursor 把我的源代码永久上传、还拿去训练模型',
        good: '官方称算向量的明文代码只在请求期驻留内存随后丢弃,长期只存向量;隐私模式下绝不用于训练',
        why: <><b>病因:</b>"代码要上云算 embedding"听着吓人。按官方说明:用于计算 embedding 的明文代码在请求结束后即不复存在,服务器长期保存的是 embedding 向量 + 加密后的文件路径,而非你的源码;开启隐私模式时代码绝不被用于训练。把"上传以处理"与"永久留存/拿去训练"分清,是关键。<span className="footnote">(以上为厂商公开声明,涉及敏感代码请仍以你所在组织的合规要求为准。)</span></>,
      },
    ],
    // ---- 小测 ----
    quizTitle: '✍️ 小练习',
    quiz: [
      {
        q: '1. 朋友说:"Cursor 不就是 VS Code 里塞了个 ChatGPT 吗?" 用本课"子任务拆分"的视角,指出他漏看了什么。',
        a: <>他只看到了"调用前沿大模型"这一层,漏看了 Cursor 在模型之外的工程。它把写代码拆成三个延迟敏感的子任务,各配<b>自研专用模型</b>:① <b>Tab</b> 预测你的下一个编辑;② <b>Apply</b> 用推测式解码把改动秒级落地(~1000 token/s);③ <b>代码库索引</b>(代码版 RAG)让它从几十万行里只检索相关片段。前沿模型只负责最需要推理的部分。"快"和"懂你的库"是这些工程堆出来的,不是套壳能给的。</>,
      },
      {
        q: '2. 一个仓库有几十万行代码,远超任何上下文窗口。Cursor 怎么让 AI "懂"它?用 L18 的 RAG 解释。',
        a: <>用<b>代码版 RAG</b>:预先把代码切成有意义的块(函数、类),每块转成一个<b>向量(embedding)</b>存进向量库,建好索引;你提问时把问题也转成向量,做语义匹配,<b>只检索出最相关的少数几块</b>注入上下文,而不是塞整库。文件改动后用 <b>Merkle 树</b>哈希精确定位变化、只重算这部分。所以它不是"读完整库",而是"每次只查相关的几块"。</>,
      },
      {
        q: '3. 为什么 Cursor 要专门训一个"Apply 模型"、还做推测式解码,而不直接让 GPT 把整个文件重写一遍?',
        a: <>让通用大模型逐字重写整个文件<b>又慢又容易抄错</b>(把没改的地方也改了)。Apply 这一步的特点是:<b>对"改完长什么样"已有很强的先验</b>(模型已经给出了要改的片段)。于是 Cursor 用专门的应用模型 + <b>推测式解码</b>——跳着预测后续 token 再校验,把吞吐做到约<b>每秒 1000 token</b>、比常规推理快十几倍。这是"延迟敏感的子任务值得专门优化"的典型例子。</>,
      },
    ],
    // ---- 收尾 ----
    finalTitle: '🔭 番外·第二篇:看懂了 Cursor,你就看懂了"模型之外的护城河"',
    finalP1: <>把 Manus 和 Cursor 放一起看,会发现同一个母题:<b>当前沿大模型变成大家都能调的公共电力,产品的高下,落在模型之外的工程</b> —— Manus 拼的是上下文工程,Cursor 拼的是"把任务拆成可优化的子系统 + 代码版 RAG + 推理加速"。</>,
    finalP2: <>这也让你手里多了一把尺子:下次看任何一个惊艳的 AI 产品,别只问"它用了哪个模型",更要问 —— 它为哪些子任务训了专用模型?它怎么把海量信息检索进上下文?它的延迟是怎么压下去的?番外篇会继续用这把尺子,拆解更多真实系统。下一站,我们聊聊"为什么有人能用几分之一的钱训出顶尖大模型"。</>,
  },

  en: {
    // ---- Core Idea ----
    conceptTitle: '💡 Core Idea: its strength lies "outside the model"',
    conceptLead: 'Cursor is the hottest AI code editor of the past two years — a fork of VS Code, yet once programmers try it they can\'t go back. The most common jab is: "Isn\'t it just ChatGPT stuffed into an editor, a thin wrapper?" That line is wrong in a very instructive way — and taking it apart is exactly what this lesson does —',
    contrastTag1: 'Gut impression',
    contrastBig1: <>Cursor is just<span className="gap">a wrapper around ChatGPT</span></>,
    contrastNote1: 'As if swapping in a stronger general model would let anyone build one.',
    contrastTag2: 'Real mechanism',
    contrastBig2: <>Cursor is<span className="hl">an ensemble of in-house small models + code-flavored RAG + inference acceleration</span>, with the frontier model handling only the parts that truly need reasoning</>,
    contrastNote2: 'The "fast" and "knows your codebase" feel is built by engineering, not handed over by swapping models.',
    exampleEn: <>Co-founder Aman Sanger\'s own words: <span className="hl">"Cursor really works via this ensemble of custom models that we\'ve trained alongside the frontier models."</span> It splits "writing code" into a chain of latency-sensitive subtasks, each optimized on its own.</>,
    exampleZh: <>This connects right to L18 "RAG" and L20 "Agents" — Cursor grounds those classroom concepts in a real product you use every day.</>,
    // ---- Facts ----
    factsTitle: '🧩 Know Cursor First: four fact cards',
    factsLead: 'Before taking the principles apart, four verified cards to lay out the basics:',
    facts: [
      { label: 'Origin · Anysphere', term: <>A VS Code <b>fork</b></>, body: <>Built by Anysphere on the open-source VS Code, with one-click import of your old settings and extensions. Underneath it uses <b>both third-party frontier models</b> (Claude / GPT / Gemini) <b>and in-house models</b>.</> },
      { label: 'Scale · 2025/11', term: <>Valued at <b>$29.3B</b></>, body: <>A Series D valuation around $29.3B, with annualized revenue past $1B — an editor grown this big not on some model, but on experience. Tab completion alone <b>handles 400M+ requests a day</b>.</> },
      { label: 'Reading code · RAG', term: <><b>Index + retrieve</b></>, body: <>It won't cram the whole repo into the context (won't fit); it <b>builds a vector index</b> of the codebase and, on a question, <b>retrieves only the relevant snippets</b> into context — L18's RAG, moved onto code.</> },
      { label: 'Privacy · no plaintext', term: <>Stores only <b>vectors</b></>, body: <>Per the official docs: the plaintext code used to compute vectors <b>lives only in memory during the request, then is discarded</b>; what's stored long-term is the embedding vector + an encrypted file path. With Privacy Mode on, code is never used for training.</> },
    ],
    factsSourceNote: (
      <>
        Scale and privacy per Cursor's{' '}
        <a href="https://cursor.com/blog/series-d" target="_blank" rel="noreferrer">Series D announcement</a> (2025-11) and{' '}
        <a href="https://cursor.com/docs/context/codebase-indexing" target="_blank" rel="noreferrer">codebase indexing docs</a>
        ; "in-house + third-party models" per the{' '}
        <a href="https://cursor.com/docs/models" target="_blank" rel="noreferrer">official model docs</a>
        .
      </>
    ),
    // ---- Subsystems ----
    sysTitle: '📖 Three Subsystems: splitting "writing code" into optimizable parts',
    sysLead: 'Cursor\'s cleverness is that it didn\'t hand "writing code" to the model as one vague big task, but split it into three subtasks with different latency and feel, each engineered separately. Each comes with an everyday analogy.',
    sys: [
      { n: '01', term: 'Read your codebase: RAG for code', tag: 'knows you',
        body: <>However large the context window, it can't hold a repo of hundreds of thousands of lines; cramming it is expensive and dilutes focus. Cursor's approach is to <b>index the codebase</b>: cut code into meaningful chunks (functions, classes), turn each into a <b>vector (embedding)</b> in a vector store; when you ask, it vectorizes the question too and <b>retrieves only the most relevant chunks</b> into context. After edits, a <b>Merkle tree</b> of hashes pinpoints which chunks changed and recomputes only those.</>,
        analogy: <><b>Analogy:</b> you don't move the whole library onto your desk; you check the catalog and pull out only the relevant books. The codebase index is that "semantic catalog."</> },
      { n: '02', term: 'Tab completion: predict your next edit', tag: 'fast',
        body: <>Ordinary autocomplete only guesses the "next character"; Cursor's <b>Tab is an in-house model</b> that guesses <b>"the whole next edit you're about to make, and where the cursor should jump"</b>. Trained on huge amounts of real edits and updated daily with <b>online reinforcement learning</b>, it fits your habits better the more you use it — handling <b>400M+</b> such predictions a day.</>,
        analogy: <><b>Analogy:</b> like a pair-programmer who's watched your code all day: the moment you change one spot, they point at the next saying "this needs to change too," rather than typing for you character by character.</> },
      { n: '03', term: 'Apply: land big edits in a snap', tag: 'faster',
        body: <>Having the big model rewrite a whole file character by character is slow and error-prone. Cursor uses a <b>dedicated "apply model"</b> with in-house <b>speculative edits</b>: because it already has a strong prior for "what the result looks like," it can predict ahead and verify, pushing apply speed to <b>~1000 tokens per second</b> (over 10x faster than vanilla inference).</>,
        analogy: <><b>Analogy:</b> a seasoned editor doesn't re-copy the whole draft; one glance and they know which few spots to change, then do it fast — the speed comes from "I roughly know the result."</> },
    ],
    sysSourceNote: (
      <>
        The three mechanisms per Cursor's official blog:{' '}
        <a href="https://cursor.com/blog/codebase-indexing" target="_blank" rel="noreferrer">codebase indexing</a>,{' '}
        <a href="https://cursor.com/blog/tab-update" target="_blank" rel="noreferrer">the Tab model</a> and{' '}
        <a href="https://cursor.com/blog/tab-rl" target="_blank" rel="noreferrer">Tab online RL</a>,{' '}
        <a href="https://cursor.com/blog/instant-apply" target="_blank" rel="noreferrer">Apply at 1000 tokens/s</a> (2024–2025).
      </>
    ),
    // ---- Interactive demo ----
    demoSecTitle: '🎛️ Interactive Demo: AI doesn\'t "read the whole repo," it "retrieves a few chunks"',
    demoSecLead: 'Here\'s the feel of the first subsystem. Below is a toy codebase of 8 files; pick a real question and watch which chunks Cursor "retrieves" from the whole repo to feed the model — note the bill on the right: cramming the whole repo is expensive and won\'t fit, while retrieving only the relevant chunks is accurate and cheap. This is L18\'s RAG.',
    demo: {
      title: '🎛️ RAG for Code · Retrieval Demo',
      hint: 'pick a question, see which chunks get retrieved',
      queryLabel: 'Your question:',
      retrievedTag: '✓ retrieved into context',
      scoreLabel: 'relevance',
      libTokens: 'Whole repo into context',
      injTokens: 'Actually injected after retrieval',
      tooBig: '✗ won\'t fit / costly',
      justRight: '✓ accurate & cheap',
      note: (k) => `Feed only the ${k} most relevant chunks to the model, not the whole repo — a clean, cheap context.`,
      queries: [
        { q: 'Why does user login keep failing?', keys: ['登录', '鉴权', 'token', '用户'] },
        { q: 'Add a refund feature to the payment flow', keys: ['支付', '退款', '订单'] },
        { q: 'Tweak the welcome email after signup', keys: ['邮件', '通知', '用户', '发送'] },
      ],
    },
    chunks: [
      { file: 'auth.js', desc: 'Login & JWT auth', keys: ['登录', '鉴权', 'token', '密码'] },
      { file: 'user_api.js', desc: 'User CRUD endpoints', keys: ['用户', '接口', '数据库', '查询'] },
      { file: 'db.js', desc: 'DB connection & queries', keys: ['数据库', '查询', '连接'] },
      { file: 'payment.js', desc: 'Payment & refund logic', keys: ['支付', '退款', '订单'] },
      { file: 'cart.js', desc: 'Cart & checkout', keys: ['购物车', '订单', '商品'] },
      { file: 'email.js', desc: 'Send email notifications', keys: ['邮件', '通知', '发送'] },
      { file: 'utils.js', desc: 'Date/string helpers', keys: ['工具', '格式化'] },
      { file: 'styles.css', desc: 'Page stylesheet', keys: ['样式', '颜色'] },
    ],
    // ---- Misconceptions ----
    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      {
        bad: 'Cursor is just ChatGPT wrapped in VS Code, no real tech to it',
        good: 'It\'s an ensemble of in-house small models (Tab / Apply / Composer) + RAG for code + inference acceleration; the frontier model only does the heaviest reasoning',
        why: <><b>Cause:</b> it does outsource hard reasoning to Claude / GPT, so it looks like a "wrapper." But the experiences that make it good — completion that keeps up, edits that land instantly, finding the right code among hundreds of thousands of lines — none come free from "a stronger general model." They're all engineering: in-house specialized models, a self-built vector retrieval system, speculative decoding for low latency. The moat is outside the model.</>,
      },
      {
        bad: 'AI coding just reads my entire codebase into the context',
        good: 'The context window can\'t hold a whole repo; Cursor uses "index → retrieve only the relevant chunks," RAG for code',
        why: <><b>Cause:</b> "it seems to know everything" makes people think it read the whole repo. But hundreds of thousands of lines far exceed any context window, and cramming dilutes focus and balloons cost. The real approach is L18's RAG: pre-chunk the code, embed it into an index, and on a question retrieve only the few most relevant chunks. It didn't "read it all"; it "looks it up well."</>,
      },
      {
        bad: 'Cursor permanently uploads my source code and trains models on it',
        good: 'Per the docs, plaintext code for embedding lives only in memory during the request then is discarded; only vectors are stored long-term; in Privacy Mode code is never used for training',
        why: <><b>Cause:</b> "code goes to the cloud to compute embeddings" sounds scary. Per the official docs: the plaintext code used to compute embeddings ceases to exist after the request; what the server keeps long-term is the embedding vector + an encrypted file path, not your source; with Privacy Mode on, code is never used for training. The key is to separate "uploaded to be processed" from "kept forever / used to train." <span className="footnote">(The above are vendor statements; for sensitive code, still follow your organization's compliance requirements.)</span></>,
      },
    ],
    // ---- Quiz ----
    quizTitle: '✍️ Quick Quiz',
    quiz: [
      {
        q: '1. A friend says: "Isn\'t Cursor just ChatGPT stuffed into VS Code?" Using this lesson\'s "subtask splitting" lens, point out what he\'s missing.',
        a: <>He only saw the "call a frontier model" layer and missed Cursor's engineering around the model. It splits coding into three latency-sensitive subtasks, each with an <b>in-house specialized model</b>: ① <b>Tab</b> predicts your next edit; ② <b>Apply</b> uses speculative decoding to land changes in a snap (~1000 tokens/s); ③ <b>codebase indexing</b> (RAG for code) retrieves only the relevant snippets from hundreds of thousands of lines. The frontier model only handles the parts that truly need reasoning. "Fast" and "knows your codebase" are built by this engineering, not by a wrapper.</>,
      },
      {
        q: '2. A repo has hundreds of thousands of lines, far beyond any context window. How does Cursor make the AI "understand" it? Explain with L18\'s RAG.',
        a: <>With <b>RAG for code</b>: pre-chunk the code into meaningful pieces (functions, classes), turn each into a <b>vector (embedding)</b> stored in a vector database, building an index; when you ask, vectorize the question too, do semantic matching, and <b>retrieve only the few most relevant chunks</b> into context rather than the whole repo. After edits, a <b>Merkle tree</b> of hashes pinpoints changes and recomputes only those. So it doesn't "read the whole repo"; it "looks up just the relevant chunks each time."</>,
      },
      {
        q: '3. Why does Cursor train a dedicated "Apply model" and do speculative decoding, instead of just letting GPT rewrite the whole file?',
        a: <>Having a general model rewrite a whole file character by character is <b>slow and error-prone</b> (it changes parts that shouldn't change). The Apply step has a special trait: it already holds a <b>strong prior for "what the result looks like"</b> (the model already produced the snippet to change). So Cursor uses a dedicated apply model + <b>speculative decoding</b> — predicting ahead then verifying — to push throughput to <b>~1000 tokens/s</b>, over 10x faster than vanilla inference. A textbook case of "a latency-sensitive subtask is worth optimizing specially."</>,
      },
    ],
    // ---- Closing ----
    finalTitle: '🔭 Extras · Part Two: understand Cursor and you understand "the moat outside the model"',
    finalP1: <>Put Manus and Cursor side by side and the same theme emerges: <b>once frontier models become electricity anyone can call, a product's edge lies in the engineering outside the model</b> — Manus competes on context engineering, Cursor on "splitting the task into optimizable subsystems + RAG for code + inference acceleration."</>,
    finalP2: <>This hands you a ruler too: next time you see a stunning AI product, don't just ask "which model does it use," ask — which subtasks did it train dedicated models for? how does it retrieve massive information into context? how did it drive latency down? The extras will keep using this ruler to tear apart more real systems. Next stop: "why can some teams train a top model for a fraction of the cost?"</>,
  },
}

// ---- 代码版 RAG 检索演示 ----
function CodebaseRetrievalDemo({ c }) {
  const d = c.demo
  const chunks = c.chunks
  const [qi, setQi] = useState(0)
  const query = d.queries[qi]

  // 玩具语义相似度:关键词重叠数
  const scored = chunks.map((ch) => ({
    ...ch,
    score: ch.keys.filter((k) => query.keys.includes(k)).length,
  }))
  const ranked = [...scored].sort((a, b) => b.score - a.score)
  const TOPK = 3
  const retrievedFiles = new Set(ranked.slice(0, TOPK).filter((x) => x.score > 0).map((x) => x.file))
  const maxScore = Math.max(1, ...scored.map((s) => s.score))

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{d.title}</span>
        <span className="demo-hint">{d.hint}</span>
      </div>
      <div style={{ padding: '24px', display: 'grid', gap: 22 }}>
        {/* 查询选择 */}
        <div>
          <div className="label" style={{ marginBottom: 8 }}>{d.queryLabel}</div>
          <div className="chips">
            {d.queries.map((q, i) => (
              <button key={i} className={`chip${i === qi ? ' active' : ''}`} onClick={() => setQi(i)}>{q.q}</button>
            ))}
          </div>
        </div>

        {/* 代码库网格 */}
        <div className="use-grid cols-4">
          {scored.map((ch) => {
            const hit = retrievedFiles.has(ch.file)
            return (
              <div key={ch.file} style={{
                border: `1px solid ${hit ? 'var(--sage)' : 'var(--hairline)'}`,
                borderRadius: 12,
                background: hit ? 'var(--sage-bg)' : 'var(--bg-inset)',
                padding: '14px 16px',
                opacity: hit ? 1 : 0.5,
                transition: 'all .25s ease',
                display: 'flex', flexDirection: 'column', gap: 6, minHeight: 92,
              }}>
                <code style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-0)' }}>{ch.file}</code>
                <div style={{ fontSize: 12.5, color: 'var(--fg-1)', lineHeight: 1.35 }}>{ch.desc}</div>
                {hit && <div style={{ fontSize: 11.5, color: 'var(--sage)', fontWeight: 700, marginTop: 'auto' }}>{d.retrievedTag} · {d.scoreLabel} {ch.score}/{maxScore}</div>}
              </div>
            )
          })}
        </div>

        {/* 成本对比 */}
        <div className="use-grid cols-2">
          <div style={{ border: '1px solid var(--terracotta)', borderRadius: 12, background: 'var(--terracotta-bg)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 12.5, color: 'var(--fg-2)', fontWeight: 600 }}>{d.libTokens}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--fg-0)' }}>≈ {TOTAL_TOKENS.toLocaleString()} <span style={{ fontSize: 13 }}>token</span></div>
            <div style={{ fontSize: 12, color: 'var(--terracotta)', fontWeight: 700 }}>{d.tooBig}</div>
          </div>
          <div style={{ border: '1px solid var(--sage)', borderRadius: 12, background: 'var(--sage-bg)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 12.5, color: 'var(--fg-2)', fontWeight: 600 }}>{d.injTokens}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--fg-0)' }}>≈ {RETRIEVED_TOKENS.toLocaleString()} <span style={{ fontSize: 13 }}>token</span></div>
            <div style={{ fontSize: 12, color: 'var(--sage)', fontWeight: 700 }}>{d.justRight}</div>
          </div>
        </div>
        <p style={{ margin: 0, fontWeight: 600, lineHeight: 1.7, color: 'var(--fg-1)' }}>{d.note(retrievedFiles.size)}</p>
      </div>
    </div>
  )
}

export default function L32() {
  const { lang } = useLang()
  const c = C[lang] || C.zh

  return (
    <>
      <Lsec title={c.conceptTitle} lead={c.conceptLead}>
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
        <div className="example mt14">
          <div className="en">{c.exampleEn}</div>
          <div className="zh">{c.exampleZh}</div>
        </div>
      </Lsec>

      <Lsec title={c.factsTitle} lead={c.factsLead}>
        <div className="use-grid cols-4">
          {c.facts.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.term}</div><div className="zh">{u.body}</div></div>
          ))}
        </div>
        <p className="footnote source-note">{c.factsSourceNote}</p>
      </Lsec>

      <Lsec title={c.sysTitle} lead={c.sysLead}>
        <div className="card row-list">
          {c.sys.map((l, i) => (
            <div className="example" key={i}>
              <div className="en">
                <span className="pill pill-ink" style={{ marginRight: 8 }}>{l.n}</span>
                <b>{l.term}</b>
                <span className="pill pill-sky" style={{ marginLeft: 8 }}>{l.tag}</span>
              </div>
              <div className="zh" style={{ marginTop: 6 }}>{l.body}</div>
              <div className="zh" style={{ marginTop: 6, color: 'var(--fg-2)' }}>{l.analogy}</div>
            </div>
          ))}
        </div>
        <p className="footnote source-note">{c.sysSourceNote}</p>
      </Lsec>

      <Lsec title={c.demoSecTitle} lead={c.demoSecLead}>
        <CodebaseRetrievalDemo c={c} />
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

      <Lsec title={c.quizTitle}>
        <div className="card quiz row-list">
          {c.quiz.map((qz, i) => (
            <QuizItem key={i} q={qz.q}>{qz.a}</QuizItem>
          ))}
        </div>
      </Lsec>

      <Lsec title={c.finalTitle}>
        <div className="card card-pad">
          <p style={{ fontSize: 16, lineHeight: 1.9 }}>{c.finalP1}</p>
          <p style={{ fontSize: 16, lineHeight: 1.9, marginTop: 12 }}>{c.finalP2}</p>
        </div>
      </Lsec>
    </>
  )
}
