import { useState } from 'react'
import { Lsec, QuizItem } from '../components/ui.jsx'
import { useLang } from '../i18n/LangContext.jsx'

// ============================================================
// L31 · Manus 拆解:顶尖 Agent 的上下文工程(全课压轴 / 终章)
// 双语内容层:结构 / class / 数值 / 交互逻辑均不变,仅文本按语言取用。
// 事实依据:季逸超(Yichao "Peak" Ji)官方博客《Context Engineering for
// AI Agents: Lessons from Building Manus》(manus.im, 2025-07-18)及
// MIT Technology Review 人物特写等;关键数字均经对抗式核验。
// ============================================================

// KV-Cache 价格(写作时点 Claude Sonnet 报价,USD / 百万 token)
const PRICE_CACHED = 0.3
const PRICE_UNCACHED = 3.0
const TOK_PER_ROUND = 2000 // 单轮新增上下文 token(示意)

const C = {
  zh: {
    // ---- 核心概念 ----
    conceptTitle: '💡 核心概念:护城河不在模型,在上下文',
    conceptLead: '2025 年 3 月,一个叫 Manus 的「通用 AI Agent」突然刷屏:它能像数字员工一样,给个目标就自己筛简历、做调研、写网站,邀请码一度被炒到上万元。第一反应几乎人人相同 —— 它背后一定藏着某个我们还不知道的超强模型。但真相恰恰相反,也正是这一课最值钱的地方 ——',
    contrastTag1: '直觉印象',
    contrastBig1: <>Manus 这么强,一定<span className="gap">用了某个秘密的超强模型</span></>,
    contrastNote1: '好像只要模型够神,Agent 就自然神了。',
    contrastTag2: '真实机制',
    contrastBig2: <>Manus 底层就是<span className="hl">公开可调的 Claude + 微调版 Qwen</span> —— 真正的差距,在「怎么组织上下文」</>,
    contrastNote2: '同样的模型,大家都能调;它赢在模型之外那圈功夫 —— 上下文工程。',
    exampleEn: <>官方把这套哲学浓缩成一句标语:<span className="hl">Less structure, more intelligence(少结构,多智能)</span>。它刻意不去堆复杂架构,而是把心思全花在「每一轮该把哪些信息、以什么顺序放进上下文窗口」。</>,
    exampleZh: <>这正好接上 L20 那句最重要的话:<b>模型在自己的足迹上持续决策</b>。Manus 没改造模型的大脑,它只是把「足迹」(也就是上下文)经营到了工业级。</>,
    // ---- 背景事实 ----
    factsTitle: '🧩 先认清 Manus:四张事实卡',
    factsLead: '动手拆原理前,先用四张经过核实的卡片,把这个产品的底细摆清楚 —— 后面六条经验,都是从这些约束里逼出来的:',
    facts: [
      { label: '出身 · 2025/3', term: <><b>蝴蝶效应</b> 出品</>, body: <>开发商蝴蝶效应(Butterfly Effect),与浏览器插件 Monica 同一团队;肖弘任 CEO,<b>季逸超(Peak)任首席科学家</b>。2025 年 3 月以邀请制内测亮相。</> },
      { label: '形态 · 云端', term: <>一台<b>云端虚拟机</b></>, body: <>每个任务分配一台完全隔离的云端沙箱(Linux),内含浏览器、文件系统和开发工具,可<b>异步长跑</b>:自己浏览网页、写并运行代码、读写文件。</> },
      { label: '大脑 · 借力', term: <><b>Claude + 微调 Qwen</b></>, body: <>底层调用的是公开可用的大模型 —— 季逸超公开确认:用 Claude,搭配多个微调版 Qwen。<b>没有自研的「超强秘密模型」</b>。</> },
      { label: '规模 · 胜负手', term: <>~50 次 / <b>100:1</b></>, body: <>官方自述:典型任务平均约 <b>50 次工具调用</b>,平均输入:输出 token 比约 <b>100:1</b>。任务越长,「输入上下文」越是成本与稳定性的命门。</> },
    ],
    factsSourceNote: (
      <>
        公司与产品背景参考 MIT Technology Review 对季逸超的人物特写(2025-09)及多家媒体报道;「底层使用 Claude + 微调 Qwen」为季逸超
        {' '}
        <a href="https://www.recodechinaai.com/p/is-manus-the-deepseek-moment-in-ai" target="_blank" rel="noreferrer">公开确认、经媒体转述</a>
        。Manus 产品形态变化很快,以官网为准。
      </>
    ),
    // ---- 六条经验 ----
    lessonsTitle: '📖 六条实战经验:Manus 是怎么经营上下文的',
    lessonsLead: 'Manus 联合创始人季逸超在官方博客里,把团队反复重写过几次架构后沉淀的经验,总结成六条。下面每一条都配一个生活类比 —— 你会发现,它们全都绕着同一个目标转:让上下文又稳、又准、又便宜。',
    lessons: [
      { n: '01', term: '围绕 KV-Cache 设计:前缀要稳', tag: '省钱',
        body: <>Agent 每一轮都要把越滚越长的上下文整个重读一遍。模型有个「缓存」:只要上下文开头<b>一字不变</b>,已读的部分能跳读、便宜十倍。所以 Manus 让前缀<b>逐字稳定、只追加不修改</b> —— 连在开头放个当前时间戳都坚决不干,因为一个 token 的变化就会让整段缓存作废。</>,
        analogy: <><b>类比:</b>让助理一次次重读同一本卷宗。封面一个字没改,他就能从上次读到的地方接着看;你要是在封面盖个实时时间戳,他每次都得从第一页重头逐字读 —— 又慢又贵。</> },
      { n: '02', term: 'Mask,而不是删除工具', tag: '稳缓存',
        body: <>任务中途想「临时禁用某个工具」,直觉是把它从工具列表里删掉。Manus 偏不 —— 工具定义就在上下文靠前的位置,一删就击穿后面全部缓存,还会让模型困惑(历史里还引用着这个刚消失的工具)。它的做法是在模型选词时<b>对该工具的 token 打掩码(masking)</b>,工具列表本身一字不动。</>,
        analogy: <><b>类比:</b>菜单印好就别撕页 —— 撕一页整本要重排重印。想暂时不让点某道菜,就在点单时把它划掉,而不是把它从菜单里抹除。</> },
      { n: '03', term: '把文件系统当上下文', tag: '扩容',
        body: <>上下文窗口再大也有上限,长网页、长文档很快就把它撑爆。Manus 把<b>文件系统当成无限大、永久、可直接读写的外部记忆</b>:大段内容落盘,上下文里只留一个文件路径或 URL,要用时再读回来 —— 这叫<b>可恢复的压缩</b>(只丢内容、留指针)。</>,
        analogy: <><b>类比:</b>你不会把整份报告背在脑子里,而是记一句「在 D 盘 report.md」,要用再翻。脑容量有限,硬盘几乎无限。</> },
      { n: '04', term: '用「复述」操纵注意力', tag: '不跑题',
        body: <>一个任务平均 ~50 步,最初的目标会被越来越长的足迹挤到上下文中段,模型「读着读着忘了要干嘛」(业内叫 lost-in-the-middle)。Manus 的招很朴素:维护一个 <code>todo.md</code>,<b>每完成一步就把待办清单重写一遍、推到上下文最末尾</b> —— 等于把全局目标反复「背诵」进模型的最近注意力。</>,
        analogy: <><b>类比:</b>长会议里,主持人每隔一阵就重念一遍「今天就定三件事」,免得大家越聊越偏。复述,是把目标拉回眼前最便宜的办法。</> },
      { n: '05', term: '把错误留在上下文里', tag: '会纠错',
        body: <>动作失败了、报错了,直觉是把这些「脏东西」擦干净再继续。Manus 反其道而行:<b>把失败的动作和报错原样留在上下文里</b>。模型读着自己刚踩过的坑,会悄悄更新内部判断,下一轮自然绕开 —— 把错误抹掉,等于剥夺了它从错误中学习的唯一线索。</>,
        analogy: <><b>类比:</b>踩过的坑要留个疤。疤还在,下次路过才记得绕;伤好得一点痕迹不剩,你就会原地再摔一次。</> },
      { n: '06', term: '别被 few-shot 带进沟里', tag: '保持灵活',
        body: <>在上下文里塞很多「范例」(few-shot)本是好习惯,但 Manus 发现:如果这些范例<b>格式过于整齐划一</b>,模型会陷入惯性、机械照抄套路,该变通时不变通。它的对策是<b>故意在结构里引入一点受控的变化</b>,打破模仿惯性,让模型保持灵活。</>,
        analogy: <><b>类比:</b>例题给得一个模子,学生就只会套那一种解法;稍微换换题型和措辞,他才被逼着真正理解,而不是背模板。</> },
    ],
    lessonsSourceNote: (
      <>
        本节六条经验与文中数字,均据 Manus 联合创始人季逸超(Yichao "Peak" Ji)官方博客{' '}
        <a href="https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus" target="_blank" rel="noreferrer">
          《Context Engineering for AI Agents: Lessons from Building Manus》
        </a>
        (manus.im,2025-07-18)逐字核对。
      </>
    ),
    // ---- 交互演示 ----
    demoSecTitle: '🎛️ 交互演示:一个时间戳,凭什么贵这么多',
    demoSecLead: '把第一条经验玩成手感。下面模拟 Manus 跑一个长任务:你能拨动「前缀是否稳定」「工具是否中途改动」两个开关,再拖动心跳轮数,实时看缓存命中率、有效单价和总账单怎么跳变。记住那条铁律:缓存命中 $0.30 / 未命中 $3.00 每百万 token —— 相差 10 倍。',
    demo: {
      title: '🎛️ KV-Cache 命中率 · 成本演示',
      hint: '命中 $0.30 vs 未命中 $3.00 / 百万 token(10×)',
      tgPrefixLabel: 'Prompt 前缀',
      tgPrefixStable: '✓ 稳定(只追加)',
      tgPrefixStamp: '✗ 开头放时间戳',
      tgToolsLabel: '工具列表',
      tgToolsStable: '✓ 全程不动',
      tgToolsMutate: '✗ 中途增删',
      roundsLabel: (r) => `心跳轮数:${r}`,
      statHit: '缓存命中率',
      statEff: '有效单价 / 百万 token',
      statTokens: '累计输入 token',
      statCost: '本次任务总成本',
      statMult: '相对「全程稳定」',
      verdictGood: '✓ 这就是 Manus 的默认姿势:前缀稳、工具不动,绝大多数 token 命中缓存,成本压到最低。',
      verdictStamp: '✗ 开头那个时间戳,让每一轮的缓存全部作废 —— 整段按未命中价重算,账单几倍地涨。',
      verdictMutate: '✗ 中途动了工具列表 —— 它之后的缓存被击穿,命中率大跌,成本明显上扬。',
      verdictBoth: '✗✗ 前缀和工具都在变:缓存几乎全废,这是最烧钱的跑法。',
      multUnit: (x) => `${x}×`,
    },
    // ---- 常见误区 ----
    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      {
        bad: 'Manus 这么强,一定是偷偷用了某个比 GPT、Claude 更强的秘密模型',
        good: '它底层就是公开可调的 Claude + 微调 Qwen;强的是模型之外的上下文工程',
        why: <><b>病因:</b>我们太习惯「能力 = 模型大小」的叙事,看到惊艳的 Agent,第一反应就是「模型一定更猛」。但当顶尖模型变成大家都能按量付费的公共电力,真正拉开差距的,是你怎么在每一轮里组织上下文 —— 缓存怎么命中、目标怎么不被挤掉、错误怎么留作教训。这不是玄学:命中率、token 成本、注意力位置,每一条都能测、能算、能优化。</>,
      },
      {
        bad: 'Manus 是一套复杂的多智能体系统(规划者 / 执行者 / 验证者协作)',
        good: '官方强调的是「少结构」的单 Agent + 上下文工程;多智能体那套主要出自第三方逆向分析,不是官方定论',
        why: <><b>病因:</b>网上不少拆解文把 Manus 画成 planner / executor / verifier 三个智能体协作的架构图,看着很专业。但这些是<b>第三方逆向猜测</b>,并非官方说法。季逸超本人的博客通篇讲的是<b>单个 Agent 的「行动—观察」循环</b>,核心是上下文工程;官方标语恰恰是「Less structure, more intelligence(少结构,多智能)」。引用时务必分清:哪些是一手原文,哪些是二手脑补。</>,
      },
    ],
    // ---- 小练习 ----
    quizTitle: '✍️ 小练习',
    quiz: [
      {
        q: '1. 为什么 Manus 连「在 prompt 开头放上当前时间」这种小事都坚决避免?用 KV-Cache 解释。',
        a: <>因为缓存的前提是<b>前缀逐字不变</b>。开头哪怕只变一个 token(时间每秒都在变),都会让整段上下文的缓存<b>全部作废</b>,后面只能按未命中价重算 —— 单价差 10 倍($0.30→$3.00 每百万 token)。再叠加上一个任务平均 ~50 次心跳、上下文越滚越长,成本会成倍飙升。所以 Manus 让前缀稳定、只追加不修改,把命中率拉满。</>,
      },
      {
        q: '2. 任务跑到一半,想「临时禁用某个工具」。为什么 Manus 选择「掩码」而不是「从工具列表里删掉」?',
        a: <>工具定义通常排在上下文靠前的位置。<b>删改它会击穿其后的全部缓存</b>,还可能让模型困惑 —— 历史足迹里还引用着这个刚刚消失的工具。Manus 的做法是在模型解码(选下一个词)时,<b>对该工具对应的 token 打掩码</b>,只是临时不让它被选中;工具列表本身一字不动,缓存和历史都保持稳定。一句话:<b>要禁用就「划掉」,而不是「抹除」</b>。</>,
      },
      {
        q: '3. todo.md 被反复重写、推到上下文末尾,究竟解决了什么问题?',
        a: <>解决<b>长任务里「目标被遗忘在中间」</b>的问题。一个任务平均 ~50 步,最初写下的目标会被越来越长的足迹挤到上下文中段,而模型对中段内容的注意力最弱(lost-in-the-middle),容易越走越偏。把待办清单不断重写、<b>推到上下文最末尾</b>,等于把全局目标反复「背诵」进模型的最近注意力,持续把它拉回正轨。</>,
      },
    ],
    // ---- 番外·第一篇收尾 ----
    finalTitle: '🔭 番外·第一篇:看懂上下文工程,你就看懂了下一个 Manus',
    finalP1: <>这是「番外篇」的第一篇 —— 主课 30 讲带你从一个神经元一路走到亲手构建应用,而番外要做的,是把这些原理放到真实世界的明星产品上验货。Manus 交出的第一个结论是:<b>当顶尖模型变成人人可用的公共电力,真正的差距,落在你怎么把上下文喂给它。</b></>,
    finalP2: <>这正是 L20 那句洞察的工业级回响 —— <b>模型在自己的足迹上持续决策</b>,而上下文工程,就是经营这串足迹的手艺。往后你再看任何一个刷屏的 Agent 新品,都能一眼穿过营销话术,问出对的问题:它的前缀稳不稳?错误留不留?目标会不会被挤掉?番外篇还会陆续拆解更多真实系统 —— 下一个会是谁,我们路上见。</>,
  },

  en: {
    // ---- Core Idea ----
    conceptTitle: '💡 Core Idea: the moat isn\'t the model, it\'s the context',
    conceptLead: 'In March 2025 a "general AI agent" called Manus suddenly took over everyone\'s feed: hand it a goal and, like a digital employee, it would screen résumés, run research, and build websites on its own — invite codes were once scalped for thousands of dollars. Nearly everyone\'s first reaction was the same — there must be some super-powerful model we don\'t know about behind it. But the truth is exactly the opposite, and that\'s where this lesson earns its keep —',
    contrastTag1: 'Gut impression',
    contrastBig1: <>Manus is this good, it must<span className="gap">use some secret super-model</span></>,
    contrastNote1: 'As if a divine enough model makes the agent divine by itself.',
    contrastTag2: 'Real mechanism',
    contrastBig2: <>Underneath, Manus runs<span className="hl">the publicly callable Claude + a fine-tuned Qwen</span> — the real edge is in "how it organizes the context"</>,
    contrastNote2: 'The same models everyone can call; it wins on the craft around the model — context engineering.',
    exampleEn: <>The team distills this philosophy into one slogan:<span className="hl">Less structure, more intelligence</span>. It deliberately avoids piling on complex architecture, pouring its effort instead into "which information, in what order, goes into the context window each round."</>,
    exampleZh: <>This connects right back to the key line of L20: <b>the model keeps deciding on top of its own footprint</b>. Manus didn\'t remodel the model\'s brain; it just engineered that "footprint" — the context — to an industrial grade.</>,
    // ---- Facts ----
    factsTitle: '🧩 Know Manus First: four fact cards',
    factsLead: 'Before taking the principles apart, four verified cards to lay out what this product actually is — the six lessons that follow are all forced out of these constraints:',
    facts: [
      { label: 'Origin · 2025/3', term: <>By <b>Butterfly Effect</b></>, body: <>The maker is Butterfly Effect, the same team behind the browser extension Monica; Xiao Hong is CEO, <b>Yichao "Peak" Ji is Chief Scientist</b>. Debuted as an invite-only beta in March 2025.</> },
      { label: 'Form · Cloud', term: <>A <b>cloud virtual machine</b></>, body: <>Each task gets a fully isolated cloud sandbox (Linux) with a browser, file system, and dev tools, able to <b>run long and async</b>: browse the web, write and run code, read and write files on its own.</> },
      { label: 'Brain · Borrowed', term: <><b>Claude + fine-tuned Qwen</b></>, body: <>The underlying calls go to publicly available models — Ji has confirmed: Claude, paired with several fine-tuned Qwen variants. <b>No in-house "secret super-model."</b></> },
      { label: 'Scale · Decider', term: <>~50 calls / <b>100:1</b></>, body: <>By the team's own account: a typical task averages about <b>50 tool calls</b>, with an average input-to-output token ratio around <b>100:1</b>. The longer the task, the more the "input context" becomes the crux of cost and stability.</> },
    ],
    factsSourceNote: (
      <>
        Company and product background draw on MIT Technology Review's profile of Yichao Ji (2025-09) and multiple news reports; "underlying use of Claude + fine-tuned Qwen" was{' '}
        <a href="https://www.recodechinaai.com/p/is-manus-the-deepseek-moment-in-ai" target="_blank" rel="noreferrer">confirmed by Ji and relayed by the press</a>
        . Manus's product form changes fast; defer to the official site.
      </>
    ),
    // ---- Six lessons ----
    lessonsTitle: '📖 Six Hands-On Lessons: how Manus engineers its context',
    lessonsLead: 'In the official blog, Manus co-founder Yichao Ji distills the experience his team accreted after rebuilding the architecture several times into six lessons. Each one below comes with an everyday analogy — and you\'ll notice they all orbit the same goal: keep the context stable, sharp, and cheap.',
    lessons: [
      { n: '01', term: 'Design around the KV-cache: keep the prefix stable', tag: 'cheaper',
        body: <>Every round, the agent has to re-read the whole, ever-growing context. The model has a "cache": as long as the start of the context is <b>byte-for-byte unchanged</b>, the already-read part can be skimmed — ten times cheaper. So Manus keeps the prefix <b>byte-stable and append-only</b> — it won't even put a current timestamp at the start, because a single changed token invalidates the entire cache.</>,
        analogy: <><b>Analogy:</b> an assistant re-reading the same case file over and over. If the cover hasn't changed a word, he picks up where he left off; stamp a live timestamp on the cover and he must re-read from page one every time — slow and expensive.</> },
      { n: '02', term: 'Mask, don\'t remove tools', tag: 'cache-safe',
        body: <>To "temporarily disable a tool" mid-task, the instinct is to delete it from the tool list. Manus refuses — tool definitions sit near the front of the context, so deleting one shatters all the cache after it and confuses the model (the history still references the tool that just vanished). Instead, at decoding time it <b>masks the tokens for that tool</b>, leaving the tool list itself untouched.</>,
        analogy: <><b>Analogy:</b> once the menu is printed, don't tear out a page — ripping one means resetting and reprinting the whole thing. To stop a dish from being ordered for now, cross it out at order time, don't erase it from the menu.</> },
      { n: '03', term: 'Use the file system as context', tag: 'scale-up',
        body: <>However large the context window, it has a ceiling, and long pages and documents blow past it fast. Manus treats the <b>file system as unlimited, persistent, directly read-writable external memory</b>: big content goes to disk, the context keeps only a file path or URL, read back when needed — a <b>restorable compression</b> (drop the content, keep the pointer).</>,
        analogy: <><b>Analogy:</b> you don't memorize a whole report; you note "it's at D:\report.md" and open it when needed. Brain capacity is limited; the disk is nearly infinite.</> },
      { n: '04', term: 'Manipulate attention through recitation', tag: 'stay on track',
        body: <>A task averages ~50 steps, and the original goal gets squeezed into the middle of an ever-longer footprint, where the model "forgets what it was doing" (the industry calls it lost-in-the-middle). Manus's move is plain: keep a <code>todo.md</code> and, <b>after each step, rewrite the checklist and push it to the very end of the context</b> — reciting the global goal back into the model's recent attention.</>,
        analogy: <><b>Analogy:</b> in a long meeting, the chair re-reads "we're deciding just three things today" every so often, so the room doesn't drift. Recitation is the cheapest way to pull the goal back in front of everyone.</> },
      { n: '05', term: 'Keep the wrong stuff in', tag: 'self-correcting',
        body: <>When an action fails or errors out, the instinct is to wipe the "mess" clean before continuing. Manus does the reverse: <b>leave the failed action and the error message in the context as-is</b>. Reading the pit it just stepped in, the model quietly updates its internal beliefs and routes around it next round — erasing the error robs it of its only clue for learning from it.</>,
        analogy: <><b>Analogy:</b> a stumble should leave a scar. While the scar is there you remember to step around next time; heal it without a trace and you'll trip in the same spot again.</> },
      { n: '06', term: 'Don\'t few-shot yourself into a rut', tag: 'stay flexible',
        body: <>Stuffing the context with "examples" (few-shot) is usually good practice, but Manus found: if the examples are <b>too uniform in format</b>, the model falls into a rut, mechanically aping the pattern and failing to adapt when it should. Its fix is to <b>deliberately introduce a little controlled variation</b> into the structure, breaking the mimicry and keeping the model flexible.</>,
        analogy: <><b>Analogy:</b> give worked examples all in one mold and the student only learns to plug into that one template; vary the problem types and wording a bit and he's forced to actually understand rather than memorize a template.</> },
    ],
    lessonsSourceNote: (
      <>
        The six lessons and the figures in this section are checked word-for-word against Manus co-founder Yichao "Peak" Ji's official blog{' '}
        <a href="https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus" target="_blank" rel="noreferrer">
          "Context Engineering for AI Agents: Lessons from Building Manus"
        </a>
        {' '}(manus.im, 2025-07-18).
      </>
    ),
    // ---- Interactive demo ----
    demoSecTitle: '🎛️ Interactive Demo: how can one timestamp cost so much more',
    demoSecLead: 'Turn the first lesson into a feel. Below simulates Manus running a long task: flip the two switches — "is the prefix stable" and "do tools change mid-task" — then drag the heartbeat rounds, and watch the cache hit rate, effective unit price, and total bill jump in real time. Remember the iron rule: cache hit $0.30 / miss $3.00 per million tokens — a 10x gap.',
    demo: {
      title: '🎛️ KV-Cache Hit Rate · Cost Demo',
      hint: 'hit $0.30 vs miss $3.00 / M tokens (10x)',
      tgPrefixLabel: 'Prompt prefix',
      tgPrefixStable: '✓ Stable (append-only)',
      tgPrefixStamp: '✗ Timestamp at start',
      tgToolsLabel: 'Tool list',
      tgToolsStable: '✓ Untouched',
      tgToolsMutate: '✗ Changed mid-task',
      roundsLabel: (r) => `Heartbeat rounds: ${r}`,
      statHit: 'Cache hit rate',
      statEff: 'Effective price / M tokens',
      statTokens: 'Cumulative input tokens',
      statCost: 'Total task cost',
      statMult: 'vs. "all stable"',
      verdictGood: '✓ This is Manus\'s default stance: stable prefix, untouched tools, most tokens hit the cache, cost squeezed to the floor.',
      verdictStamp: '✗ That timestamp at the start invalidates every round\'s cache — the whole thing is recomputed at the miss price, and the bill multiplies.',
      verdictMutate: '✗ Touching the tool list mid-task shatters the cache after it, the hit rate drops, and cost climbs noticeably.',
      verdictBoth: '✗✗ Both prefix and tools changing: cache almost entirely wasted — the most expensive way to run.',
      multUnit: (x) => `${x}x`,
    },
    // ---- Misconceptions ----
    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      {
        bad: 'Manus is this strong, it must secretly use some model more powerful than GPT or Claude',
        good: 'Underneath it\'s the publicly callable Claude + fine-tuned Qwen; the strength is the context engineering around the model',
        why: <><b>Cause:</b> we're too used to the "capability = model size" narrative, so a stunning agent makes us think "the model must be fiercer." But once top models become public electricity billed by usage, what actually opens a gap is how you organize the context each round — how the cache hits, how the goal avoids being squeezed out, how errors are kept as lessons. This isn't mysticism: hit rate, token cost, attention position — each can be measured, computed, and optimized.</>,
      },
      {
        bad: 'Manus is a complex multi-agent system (planner / executor / verifier collaborating)',
        good: 'The team emphasizes a "less structure" single agent + context engineering; the multi-agent picture is mostly third-party reverse-engineering, not an official claim',
        why: <><b>Cause:</b> plenty of teardown articles draw Manus as a planner / executor / verifier multi-agent architecture diagram — it looks professional. But these are <b>third-party guesses</b>, not the official account. Ji's own blog talks throughout about <b>a single agent's "act–observe" loop</b>, centered on context engineering; the official slogan is precisely "Less structure, more intelligence." When citing, be clear about which is the primary source and which is secondary speculation.</>,
      },
    ],
    // ---- Quiz ----
    quizTitle: '✍️ Quick Quiz',
    quiz: [
      {
        q: '1. Why does Manus firmly avoid even something as small as "putting the current time at the start of the prompt"? Explain with the KV-cache.',
        a: <>Because caching depends on the prefix being <b>byte-for-byte unchanged</b>. Even one changed token at the start (the time changes every second) <b>invalidates the entire</b> context cache, forcing a recompute at the miss price — a 10x unit-price gap ($0.30→$3.00 per million tokens). Stack on ~50 heartbeats per task and an ever-growing context, and cost multiplies. So Manus keeps the prefix stable and append-only to max out the hit rate.</>,
      },
      {
        q: '2. Mid-task you want to "temporarily disable a tool." Why does Manus mask it rather than delete it from the tool list?',
        a: <>Tool definitions usually sit near the front of the context. <b>Deleting or editing one shatters all the cache after it</b>, and can confuse the model — the footprint still references the tool that just vanished. Manus instead <b>masks the tokens for that tool</b> at decoding time, just temporarily preventing it from being chosen; the tool list itself is untouched, so cache and history stay stable. In a phrase: <b>to disable, "cross it out," don't "erase it."</b></>,
      },
      {
        q: '3. What problem does rewriting todo.md and pushing it to the end of the context actually solve?',
        a: <>It solves <b>"the goal getting forgotten in the middle" on long tasks</b>. A task averages ~50 steps, and the goal written at the start gets squeezed into the middle of an ever-longer footprint — exactly where the model's attention is weakest (lost-in-the-middle), so it drifts. Continuously rewriting the checklist and <b>pushing it to the very end of the context</b> recites the global goal back into the model's recent attention, repeatedly pulling it back on track.</>,
      },
    ],
    // ---- Extras · Part One closing ----
    finalTitle: '🔭 Extras · Part One: understand context engineering and you understand the next Manus',
    finalP1: <>This is the first piece of "Extras" — the main 30 lessons carried you from a single neuron all the way to building your own apps; what the extras do is stress-test those principles against real-world star products. Manus's first takeaway: <b>once top models become electricity anyone can use, the real gap lies in how you feed them context.</b></>,
    finalP2: <>This is the industrial-grade echo of L20's insight — <b>the model keeps deciding on top of its own footprint</b>, and context engineering is the craft of curating that footprint. From now on, whenever some viral agent product appears, you can see straight through the marketing and ask the right questions: is its prefix stable? does it keep errors? can its goal get squeezed out? More real systems will be torn apart in the extras to come — see you on the road for whoever's next.</>,
  },
}

// ---- KV-Cache 命中率 / 成本演示 ----
function KvCacheDemo({ c }) {
  const d = c.demo
  const [stamp, setStamp] = useState(false) // 开头放时间戳 → 前缀不稳
  const [mutate, setMutate] = useState(false) // 中途改工具
  const [rounds, setRounds] = useState(20)

  // 命中率:前缀不稳→0;只改工具→0.30;都稳→0.90
  const hit = stamp ? 0 : mutate ? 0.3 : 0.9
  const eff = PRICE_UNCACHED - hit * (PRICE_UNCACHED - PRICE_CACHED) // 有效单价 $/MTok
  // 总输入 token:每轮重读越滚越长的上下文,累计 ≈ Σ i·TOK_PER_ROUND
  const tokens = ((rounds * (rounds + 1)) / 2) * TOK_PER_ROUND
  const cost = (tokens / 1e6) * eff
  const baseEff = PRICE_UNCACHED - 0.9 * (PRICE_UNCACHED - PRICE_CACHED) // 全程稳定基准
  const baseCost = (tokens / 1e6) * baseEff
  const mult = cost / baseCost

  const verdict = stamp && mutate ? d.verdictBoth : stamp ? d.verdictStamp : mutate ? d.verdictMutate : d.verdictGood
  const verdictClass = stamp || mutate ? 'fail' : 'good'

  const tokM = (tokens / 1e6).toFixed(2)
  const stats = [
    { label: d.statEff, value: `$${eff.toFixed(2)}` },
    { label: d.statTokens, value: `${tokM}M` },
    { label: d.statCost, value: `$${cost.toFixed(2)}` },
    { label: d.statMult, value: d.multUnit(mult.toFixed(1)), color: mult > 1.01 ? 'var(--terracotta)' : 'var(--sage)' },
  ]
  const Tg = ({ onLabel, offLabel, set, val }) => (
    <div className="chips">
      <button className={`chip${!val ? ' active' : ''}`} onClick={() => set(false)}>{onLabel}</button>
      <button className={`chip${val ? ' active' : ''}`} onClick={() => set(true)}>{offLabel}</button>
    </div>
  )

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{d.title}</span>
        <span className="demo-hint">{d.hint}</span>
      </div>
      <div style={{ padding: '24px', display: 'grid', gap: 26 }}>
        {/* 控制区 */}
        <div style={{ display: 'grid', gap: 18 }}>
          <div>
            <div className="label" style={{ marginBottom: 8 }}>{d.tgPrefixLabel}</div>
            <Tg val={stamp} set={setStamp} onLabel={d.tgPrefixStable} offLabel={d.tgPrefixStamp} />
          </div>
          <div>
            <div className="label" style={{ marginBottom: 8 }}>{d.tgToolsLabel}</div>
            <Tg val={mutate} set={setMutate} onLabel={d.tgToolsStable} offLabel={d.tgToolsMutate} />
          </div>
          <div className="slider-row">
            <label>{d.roundsLabel(rounds)}</label>
            <input type="range" min={1} max={50} step={1} value={rounds} onChange={(e) => setRounds(parseInt(e.target.value, 10))} />
            <span className="val">{rounds}</span>
          </div>
        </div>

        {/* 命中率条 */}
        <div>
          <div className="footnote" style={{ marginBottom: 8 }}>{d.statHit}：<b style={{ color: 'var(--fg-0)' }}>{Math.round(hit * 100)}%</b></div>
          <div style={{ height: 14, borderRadius: 8, background: 'var(--bg-inset)', overflow: 'hidden', border: '1px solid var(--hairline)' }}>
            <div style={{ width: `${hit * 100}%`, height: '100%', background: hit >= 0.9 ? 'var(--sage)' : hit > 0 ? 'var(--amber)' : 'var(--terracotta)', transition: 'width .35s ease' }} />
          </div>
        </div>

        {/* 数字面板 */}
        <div className="use-grid cols-4">
          {stats.map((s, i) => (
            <div key={i} style={{ border: '1px solid var(--hairline)', borderRadius: 12, background: 'var(--bg-inset)', padding: '16px 18px', minHeight: 92, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
              <div style={{ fontSize: 12.5, color: 'var(--fg-2)', fontWeight: 600, lineHeight: 1.35 }}>{s.label}</div>
              <div style={{ fontSize: 23, fontWeight: 800, color: s.color || 'var(--fg-0)', lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* 结论 */}
        <p style={{ margin: 0, fontWeight: 600, lineHeight: 1.7, color: verdictClass === 'good' ? 'var(--sage)' : 'var(--terracotta)' }}>{verdict}</p>
      </div>
    </div>
  )
}

export default function L31() {
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

      <Lsec title={c.lessonsTitle} lead={c.lessonsLead}>
        <div className="card row-list">
          {c.lessons.map((l, i) => (
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
        <p className="footnote source-note">{c.lessonsSourceNote}</p>
      </Lsec>

      <Lsec title={c.demoSecTitle} lead={c.demoSecLead}>
        <KvCacheDemo c={c} />
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
