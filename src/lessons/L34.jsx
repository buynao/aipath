import { useState } from 'react'
import { Lsec, QuizItem } from '../components/ui.jsx'
import { useLang } from '../i18n/LangContext.jsx'

// ============================================================
// L34 · 番外篇 · 拆解 Character.AI:海量陪聊背后,成本怎么压下来
// 事实依据:Character.AI 官方工程博客《Optimizing AI Inference at
// Character.AI》(blog.character.ai,2024-06-20)。关键口径已按核验标注:
// 每秒约 2 万次查询(2024-06 快照、按请求次数粗略类比 Google 搜索)、
// MQA 比 GQA 小 8×、混合注意力每 6 层 1 全局、跨层共享再缩 2–3×、
// 三项合计 KV cache 缩 >20×、轮间缓存命中约 95%、原生 int8 训练、
// 成本较 2022 年底降 ≥33×(均为官方自述口径)。
// ============================================================

// 演示用 KV cache 压缩因子(示意,非逐字还原官方数值)
const OPTS_FACTOR = { mqa: 6, window: 2, cross: 2, int8: 2 }

const C = {
  zh: {
    // ---- 核心概念 ----
    conceptTitle: '💡 核心概念:它把"贵在哪"重新算了一遍',
    conceptLead: 'Character.AI 是全球最大的"和 AI 角色陪聊"平台之一,海量用户挂在上面没日没夜地聊。直觉会说:这么大流量,要么是砸钱堆 GPU,要么是偷偷用了个更小更差的模型。但真实答案是第三种,也正是这一课最有价值的地方 —— 它先把"AI 推理到底贵在哪"重新算了一遍 ——',
    contrastTag1: '直觉印象',
    contrastBig1: <>能扛这么多人陪聊,一定是<span className="gap">砸钱堆 GPU 或用小模型</span></>,
    contrastNote1: '好像低成本只能靠"更多硬件"或"更差的模型"二选一。',
    contrastTag2: '真实机制',
    contrastBig2: <>它把瓶颈从"算力"重新定义为<span className="hl">KV cache 的显存与带宽</span>,再用一整套手段系统性榨干这一项</>,
    contrastNote2: '对多轮陪聊,真正烧钱的不是"生成下一个字",而是存与搬越来越长的历史对话。',
    exampleEn: <>有个漂亮的闭环:联合创始人 <span className="hl">Noam Shazeer 正是 2019 年 MQA 的发明人、也是 Transformer 论文作者之一</span> —— 如今他在自己的公司,把当年发明的省显存技术大规模落了地。官方称:服务约每秒 2 万次查询,成本不到 1 美分 / 小时对话。</>,
    exampleZh: <>这一课直接接上 L31 讲的 <b>KV cache</b>:Manus 关心"前缀稳定好命中缓存",Character.AI 关心"把缓存本身压到最小、还跨轮复用"。同一个零件,两种极致玩法。</>,
    // ---- 事实卡 ----
    factsTitle: '🧩 先认清 Character.AI:四张事实卡',
    factsLead: '动手拆原理前,先用四张经核实的卡片摆清底细:',
    facts: [
      { label: '出身 · 2021', term: <>两位<b>前 Google</b>大牛</>, body: <>由 <b>Noam Shazeer</b>(Transformer 作者、MQA 发明人)与 <b>Daniel De Freitas</b> 创立 —— 一个做角色扮演 / 陪伴聊天的平台,让你和自定义 AI 角色对话。</> },
      { label: '交易 · 2024/8', term: <>Google <b>招回</b></>, body: <>2024 年 8 月,Google 拿到其技术的<b>非独家授权</b>,并把 Shazeer 等核心人员<b>招回 Google</b>。<span className="footnote">金额据媒体报道约 27 亿美元,官方未公布、非传统收购。</span></> },
      { label: '规模 · 2024/6', term: <>~2 万 <b>查询/秒</b></>, body: <>官方称约<b>每秒 2 万次推理查询</b>,粗略类比约为 Google 搜索请求量的 20%,成本不到 1 美分/小时对话。<span className="footnote">2024-06 快照;按请求次数类比,非算力对等。</span></> },
      { label: '成本 · 自述', term: <>降至 <b>1/33</b></>, body: <>官方称服务成本<b>较 2022 年底下降至少 33 倍</b>,比"用商用 API 的竞品"便宜约 13.5 倍 —— 全靠工程,不是换模型。<span className="footnote">官方自述口径,非第三方审计。</span></> },
    ],
    factsSourceNote: (
      <>
        技术与成本数字据 Character.AI 官方工程博客{' '}
        <a href="https://blog.character.ai/optimizing-ai-inference-at-character-ai/" target="_blank" rel="noreferrer">《Optimizing AI Inference at Character.AI》</a>(2024-06);与 Google 的交易据 CNBC/WSJ 等媒体报道(2024-08)。
      </>
    ),
    // ---- 拆解正文 ----
    sysTitle: '📖 一切围着 KV cache:四招把成本榨干',
    sysLead: '先记住第一句也是最关键的一句:对"多轮长对话"的陪聊,显卡的瓶颈不是"算下一个字"的计算,而是要把之前每一句话的 KV(L31 讲过的"工作记忆")都缓存住、反复搬运 —— 越聊越长,显存与带宽越吃紧。所以 Character.AI 的四招,全冲着 KV cache 去。每条配一个生活类比。',
    sys: [
      { n: '01', term: 'MQA:多个"读头"共用一份 KV', tag: '压缓存',
        body: <>标准注意力里,每个注意力头都各存一份 Key/Value,缓存很臃肿。<b>MQA(多查询注意力)</b>让所有头<b>共用同一份 KV</b> —— 官方称由此把 KV cache 压到比常见做法(GQA)<b>还小 8 倍</b>。(有趣的是,MQA 正是创始人 Shazeer 本人 2019 年提出的。)</>,
        analogy: <><b>类比:</b>一间办公室原本人手一份同样的资料,改成全组共享一份传阅 —— 信息没少,占的柜子却小得多。</> },
      { n: '02', term: '混合注意力:大多数层只看"附近"', tag: '降复杂度',
        body: <>让每个字都回看全部历史,代价随长度<b>平方级</b>暴涨。Character.AI 让<b>大多数层只用"滑动窗口"看附近一小段</b>(复杂度从 O(n²) 降到 O(n)),<b>每 6 层才留 1 层</b>纵观全局 —— 既省缓存又保住长程理解。</>,
        analogy: <><b>类比:</b>读长篇小说,你不会每读一句都从第一页重看一遍,多数时候只盯着眼前这页,偶尔才回顾全书脉络。</> },
      { n: '03', term: '跨层共享:相邻层共用一份 KV', tag: '再压一道',
        body: <>模型有很多层,每层本来各存一份 KV。Character.AI 让<b>相邻的层绑定、共用同一份 KV cache</b>,又把体积<b>再缩 2–3 倍</b>。三招叠加(MQA + 滑动窗口 + 跨层共享),KV cache <b>总共缩小 20 倍以上</b>,而且官方称不损失质量。</>,
        analogy: <><b>类比:</b>楼上楼下几层共用一套档案室,而不是每层都建一间 —— 楼还是那栋楼,占地却省下一大截。</> },
      { n: '04', term: '轮间复用 + 原生 int8:不重算、用更少比特', tag: '再省一截',
        body: <>两个收尾招:① <b>轮间缓存</b> —— 你每发一句,前面对话的 KV 不必重算,直接从缓存取,<b>命中率约 95%</b>;② <b>原生 int8 训练</b> —— 不是事后把模型压成 int8(那会掉质量),而是<b>一开始就用 int8 精度训练</b>,让"省比特"和"不掉质量"兼得。</>,
        analogy: <><b>类比:</b>① 老顾客来续聊,你不必把之前聊的重听一遍(缓存命中);② 记账一开始就用精简格式,而不是先记成长篇再压缩 —— 从源头就省。</> },
    ],
    sysSourceNote: (
      <>
        四项手段均据 Character.AI 官方博客{' '}
        <a href="https://blog.character.ai/optimizing-ai-inference-at-character-ai/" target="_blank" rel="noreferrer">《Optimizing AI Inference at Character.AI》</a>(2024-06);MQA 原始论文为 Shazeer 2019《Fast Transformer Decoding》。
      </>
    ),
    // ---- 交互演示 ----
    demoSecTitle: '🎛️ 交互演示:把 KV cache 一层层压小,能多服务多少人',
    demoSecLead: '这就是这一课的手感。下面从一个没优化的基准(KV cache = 100%)开始,逐个打开 Character.AI 的四招,看缓存体积怎么一路缩小 —— 而同样一张显卡,缓存压得越小,就能同时塞下越多人的对话。低成本陪聊,根就在这里。',
    demo: {
      title: '🎛️ KV cache 压缩 · 叠加演示',
      hint: '逐个打开优化,看缓存缩小、可服务人数上升',
      opts: {
        mqa: 'MQA(多头共用 KV)',
        window: '滑动窗口注意力',
        cross: '跨层 KV 共享',
        int8: '原生 int8',
      },
      barLabel: 'KV cache 相对体积',
      statUsers: '同一张卡可服务对话数',
      statCache: 'KV cache 体积',
      verdictNone: '未优化:每个用户的长对话都占满显存,一张卡服务不了几个人 —— 这正是陪聊烧钱的根。',
      verdictSome: (n) => `已叠加 ${n} 招,缓存在缩小、同样的卡能服务更多人。继续打开剩下的看看。`,
      verdictAll: '四招全开:KV cache 压到约 1/48,同一张显卡能多服务几十倍的对话 —— 成本就是这样被工程榨下来的。',
    },
    // ---- 误区 ----
    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      {
        bad: 'AI 推理的成本大头,就是"生成下一个字"的那点计算',
        good: '对多轮长对话的陪聊,成本大头其实是存储与搬运历史对话的 KV cache(显存与带宽)',
        why: <><b>病因:</b>我们盯着"模型在思考、在生成",自然以为贵在算力。但 Character.AI 的洞察是:陪聊是<b>多轮、长会话</b>,每生成一个字都要带着之前所有对话的 KV 一起算,而这堆 KV 的<b>存储和反复搬运</b>才是显卡真正的瓶颈。把账重算清楚后,优化的靶心就从"算得更快"变成了"把 KV cache 压小、复用"。这也是为什么它家几乎每一招都围着 KV cache 转。</>,
      },
      {
        bad: 'Character.AI 便宜,无非是用了个更小更差的模型',
        good: '官方称这些优化在不损失质量的前提下完成;省的是 KV cache 的显存带宽,而非模型能力',
        why: <><b>病因:</b>"又便宜又能扛海量用户"容易让人猜"是不是缩水了"。但 MQA、滑动窗口、跨层共享针对的是<b>缓存体积</b>而非模型容量,官方称质量不降;而且它用的是<b>原生 int8 训练</b>(从一开始就用 int8 精度训练),而不是把训好的模型事后压成 int8 那种会掉质量的做法。省钱省在工程,不是省在"换个差模型"。</>,
      },
      {
        bad: '把这些数字(每秒 2 万次、降 33 倍)当成铁板钉钉的客观事实直接引用',
        good: '它们是官方某一时点的自述口径,引用时要标日期与基准,别当第三方审计结论',
        why: <><b>病因:</b>漂亮的数字最容易被当成定论转发。但"每秒 2 万次查询 ≈ Google 搜索 20%"是 <b>2024 年 6 月</b>的快照,且是把"自家推理请求"粗略类比"搜索请求"(两种负载并不对等);"成本降 33 倍"是相对<b>自家 2022 年底</b>的官方自述,非独立审计。养成习惯:看到惊人数字,先问"什么时候、和谁比、谁算的"。<span className="footnote">(这正是上一课 DeepSeek "560 万美元"留下的同一课。)</span></>,
      },
    ],
    // ---- 小测 ----
    quizTitle: '✍️ 小练习',
    quiz: [
      {
        q: '1. 为什么对"多轮陪聊"这种场景,优化的靶心是 KV cache,而不是"让模型算得更快"?',
        a: <>因为陪聊是<b>多轮、长会话</b>:每生成一个新字,模型都要带着<b>之前每一句话的 KV</b>(工作记忆)一起算。对话越长,这堆 KV 越大,<b>存储它、反复把它搬进搬出显存</b>就成了真正的瓶颈 —— 比"生成下一个字"的纯计算更吃显存与带宽。所以把成本压下来的最有效靶心,是<b>把 KV cache 压小、并跨轮复用</b>,而不是单纯追求算得更快。</>,
      },
      {
        q: '2. MQA 和"跨层 KV 共享"这两招,分别是怎么把 KV cache 变小的?',
        a: <><b>MQA(多查询注意力):</b>标准注意力里每个注意力头各存一份 Key/Value,MQA 让<b>所有头共用同一份 KV</b>,横向把缓存压扁(官方称比 GQA 还小 8 倍)。<b>跨层 KV 共享:</b>模型有很多层,本来每层各存一份 KV,这一招让<b>相邻层绑定、共用一份</b>,纵向再缩 2–3 倍。两者一横一纵,加上滑动窗口,合计把 KV cache 缩小 20 倍以上。</>,
      },
      {
        q: '3. "轮间缓存命中率约 95%"省下了什么?为什么对陪聊特别值钱?',
        a: <>省下的是<b>重复计算历史对话的开销</b>。你每发一句新消息,前面那一长串对话的 KV 本可以不必从头重算 —— 直接从上一轮的缓存里取(约 95% 能命中)。陪聊的特点正是<b>同一段对话被反复延续</b>,历史越积越长;若每轮都重算历史,成本会随轮数飙升。轮间复用让"历史"只算一次、反复用,这对长会话场景的省钱效果尤其明显。</>,
      },
    ],
    // ---- 收尾 ----
    finalTitle: '🔭 番外·第四篇:四个产品,同一个母题',
    finalP1: <>到这里,番外篇第一辑四篇凑齐了,它们拼出同一句话:<b>当顶尖大模型变成大家都能调的公共电力,真正拉开差距的,是模型之外的工程。</b> Manus 拼上下文工程,Cursor 拼"把任务拆成可优化的子系统",DeepSeek 把"省"做成全栈系统工程,Character.AI 则把"陪聊的成本"重新定义到 KV cache 上、再一层层榨干。</>,
    finalP2: <>而 Character.AI 这一篇,刚好和 L31 的 KV cache 首尾呼应:同一个不起眼的"工作记忆",有人靠它省钱(稳前缀、提命中),有人靠它扩容(压体积、跨轮复用)。这就是看懂原理的好处 —— 一个概念,能照亮一整排真实产品。番外篇会继续更新,带你拆解更多"它到底凭什么这么强"。下次见。</>,
  },

  en: {
    // ---- Core Idea ----
    conceptTitle: '💡 Core Idea: it recomputed "where the cost is"',
    conceptLead: 'Character.AI is one of the world\'s largest "chat with an AI character" platforms, with huge numbers of users chatting around the clock. Intuition says: at that traffic, either you throw money at GPUs or you secretly use a smaller, worse model. But the real answer is a third option — and that\'s where this lesson earns its keep — it first recomputed "where AI inference actually costs money" —',
    contrastTag1: 'Gut impression',
    contrastBig1: <>Serving this many chatters must mean<span className="gap">piling on GPUs or using a small model</span></>,
    contrastNote1: 'As if low cost only comes from "more hardware" or "a worse model."',
    contrastTag2: 'Real mechanism',
    contrastBig2: <>It redefined the bottleneck from "compute" to<span className="hl">the memory and bandwidth of the KV cache</span>, then wrung that one thing dry with a whole toolkit</>,
    contrastNote2: 'For multi-turn chat, the money sink isn\'t "generating the next character," it\'s storing and shuttling an ever-longer history.',
    exampleEn: <>A neat loop: co-founder <span className="hl">Noam Shazeer is the very inventor of MQA (2019) and a Transformer paper author</span> — now at his own company, he deployed the memory-saving trick he once invented at massive scale. Officially: ~20,000 queries per second, at under 1 cent per hour of conversation.</>,
    exampleZh: <>This connects right to the <b>KV cache</b> from L31: Manus cares about "a stable prefix for cache hits"; Character.AI cares about "shrinking the cache itself and reusing it across turns." Same part, two extreme plays.</>,
    // ---- Facts ----
    factsTitle: '🧩 Know Character.AI First: four fact cards',
    factsLead: 'Before taking the principles apart, four verified cards to lay out the basics:',
    facts: [
      { label: 'Origin · 2021', term: <>Two <b>ex-Google</b> stars</>, body: <>Founded by <b>Noam Shazeer</b> (Transformer author, MQA inventor) and <b>Daniel De Freitas</b> — a role-play / companion-chat platform where you talk with custom AI characters.</> },
      { label: 'Deal · 2024/8', term: <>Google <b>rehired</b></>, body: <>In August 2024, Google took a <b>non-exclusive license</b> to its tech and <b>rehired Shazeer</b> and core staff. <span className="footnote">Reported at ~$2.7B by the press; not officially disclosed, not a traditional acquisition.</span></> },
      { label: 'Scale · 2024/6', term: <>~20k <b>queries/s</b></>, body: <>Officially ~<b>20,000 inference queries per second</b>, loosely ~20% of Google Search's request volume, at under 1 cent per hour of conversation. <span className="footnote">A 2024-06 snapshot; a by-request analogy, not compute-equivalent.</span></> },
      { label: 'Cost · self-reported', term: <>down to <b>1/33</b></>, body: <>Officially, serving cost <b>fell at least 33x since late 2022</b>, ~13.5x cheaper than "competitors using commercial APIs" — all engineering, not a model swap. <span className="footnote">Self-reported, not third-party audited.</span></> },
    ],
    factsSourceNote: (
      <>
        Tech and cost figures per Character.AI's engineering blog{' '}
        <a href="https://blog.character.ai/optimizing-ai-inference-at-character-ai/" target="_blank" rel="noreferrer">"Optimizing AI Inference at Character.AI"</a> (2024-06); the Google deal per CNBC/WSJ etc. (2024-08).
      </>
    ),
    // ---- Body ----
    sysTitle: '📖 Everything Orbits the KV Cache: four moves to wring out cost',
    sysLead: 'Remember the first and most important line: for "multi-turn long-conversation" chat, the GPU bottleneck isn\'t "computing the next character," it\'s caching and repeatedly shuttling the KV (the "working memory" from L31) of every prior line — the longer the chat, the tighter memory and bandwidth get. So Character.AI\'s four moves all aim at the KV cache. Each with an everyday analogy.',
    sys: [
      { n: '01', term: 'MQA: many "read heads" share one KV', tag: 'shrink cache',
        body: <>In standard attention, each head stores its own Key/Value, bloating the cache. <b>MQA (Multi-Query Attention)</b> has all heads <b>share one KV</b> — officially shrinking the KV cache <b>8x smaller than the common approach (GQA)</b>. (Fittingly, MQA was proposed by founder Shazeer himself in 2019.)</>,
        analogy: <><b>Analogy:</b> an office where everyone kept their own copy of the same file switches to one shared circulating copy — no information lost, far less cabinet space used.</> },
      { n: '02', term: 'Hybrid attention: most layers only look "nearby"', tag: 'lower complexity',
        body: <>Having every character look back over all history costs grow <b>quadratically</b> with length. Character.AI has <b>most layers use a "sliding window" over a nearby span</b> (cutting complexity from O(n²) to O(n)), keeping only <b>1 in every 6 layers</b> global — saving cache while preserving long-range understanding.</>,
        analogy: <><b>Analogy:</b> reading a long novel, you don't re-read from page one for every sentence; mostly you watch the current page, occasionally reviewing the whole arc.</> },
      { n: '03', term: 'Cross-layer sharing: adjacent layers share one KV', tag: 'shrink again',
        body: <>A model has many layers, each normally storing its own KV. Character.AI has <b>adjacent layers bind and share one KV cache</b>, shrinking it <b>another 2–3x</b>. Stacked (MQA + sliding window + cross-layer sharing), the KV cache shrinks <b>more than 20x</b>, and officially without quality loss.</>,
        analogy: <><b>Analogy:</b> several floors share one archive room instead of each building its own — same building, far less floor space used.</> },
      { n: '04', term: 'Inter-turn reuse + native int8: don\'t recompute, use fewer bits', tag: 'save more',
        body: <>Two finishing moves: ① <b>inter-turn caching</b> — each time you send a message, the prior conversation's KV needn't be recomputed, just fetched from cache, with a <b>~95% hit rate</b>; ② <b>native int8 training</b> — not compressing a trained model to int8 afterward (which loses quality), but <b>training in int8 precision from the start</b>, getting "fewer bits" and "no quality loss" at once.</>,
        analogy: <><b>Analogy:</b> ① a regular returns to keep chatting — you needn't re-listen to everything said before (cache hit); ② keep the ledger in a compact format from the start, rather than writing it long then compressing — saved at the source.</> },
    ],
    sysSourceNote: (
      <>
        All four per Character.AI's blog{' '}
        <a href="https://blog.character.ai/optimizing-ai-inference-at-character-ai/" target="_blank" rel="noreferrer">"Optimizing AI Inference at Character.AI"</a> (2024-06); MQA's original paper is Shazeer 2019, "Fast Transformer Decoding."
      </>
    ),
    // ---- Interactive demo ----
    demoSecTitle: '🎛️ Interactive Demo: shrink the KV cache layer by layer, serve more people',
    demoSecLead: 'Here\'s the feel of this lesson. Starting from an unoptimized baseline (KV cache = 100%), turn on Character.AI\'s four moves one by one and watch the cache shrink — and on the same GPU, the smaller the cache, the more conversations fit at once. Low-cost companion chat starts right here.',
    demo: {
      title: '🎛️ KV Cache Shrink · Stacking Demo',
      hint: 'turn on optimizations one by one; cache shrinks, capacity rises',
      opts: {
        mqa: 'MQA (heads share KV)',
        window: 'Sliding-window attention',
        cross: 'Cross-layer KV sharing',
        int8: 'Native int8',
      },
      barLabel: 'KV cache relative size',
      statUsers: 'Conversations per GPU',
      statCache: 'KV cache size',
      verdictNone: 'Unoptimized: each user\'s long conversation fills the memory, and one GPU serves few people — the root of why chat burns money.',
      verdictSome: (n) => `${n} move(s) stacked — the cache is shrinking and the same GPU serves more people. Turn on the rest.`,
      verdictAll: 'All four on: the KV cache shrinks to ~1/48, and one GPU serves dozens of times more conversations — that\'s cost wrung out by engineering.',
    },
    // ---- Misconceptions ----
    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      {
        bad: 'The bulk of inference cost is just the bit of compute to "generate the next character"',
        good: 'For multi-turn long chat, the bulk is storing and shuttling the history\'s KV cache (memory and bandwidth)',
        why: <><b>Cause:</b> watching the model "think and generate," we assume compute is the cost. But Character.AI's insight: chat is <b>multi-turn and long</b>, and every generated character is computed alongside the KV of all prior conversation — and <b>storing and repeatedly moving</b> that KV is the GPU's real bottleneck. Recompute the bill and the target shifts from "compute faster" to "shrink and reuse the KV cache." That's why nearly every move it makes orbits the KV cache.</>,
      },
      {
        bad: 'Character.AI is cheap simply because it uses a smaller, worse model',
        good: 'Officially these optimizations are done without quality loss; what\'s saved is the KV cache\'s memory bandwidth, not model capability',
        why: <><b>Cause:</b> "cheap and able to serve a flood of users" tempts the guess that "it must be cut down." But MQA, sliding windows, and cross-layer sharing target <b>cache size</b>, not model capacity, and officially quality holds; moreover it uses <b>native int8 training</b> (training in int8 from the start), not the quality-losing approach of compressing a trained model to int8 afterward. The savings are in engineering, not in "swapping to a worse model."</>,
      },
      {
        bad: 'Take these figures (20k/s, 33x cheaper) as rock-solid objective facts to cite directly',
        good: 'They\'re self-reported at a point in time; cite with the date and baseline, not as a third-party audit',
        why: <><b>Cause:</b> pretty numbers get forwarded as settled truth. But "20k queries/s ≈ 20% of Google Search" is a <b>June 2024</b> snapshot, loosely analogizing "our inference requests" to "search requests" (not equivalent loads); "cost down 33x" is self-reported relative to <b>its own late-2022</b>, not an independent audit. Build the habit: on a stunning number, first ask "when, compared to whom, computed by whom?" <span className="footnote">(The same lesson DeepSeek's "$5.6M" left in the previous lesson.)</span></>,
      },
    ],
    // ---- Quiz ----
    quizTitle: '✍️ Quick Quiz',
    quiz: [
      {
        q: '1. Why, for "multi-turn chat," is the optimization target the KV cache rather than "making the model compute faster"?',
        a: <>Because chat is <b>multi-turn and long</b>: every new character is computed carrying <b>the KV of every prior line</b> (the working memory). The longer the chat, the larger that KV pile, and <b>storing it and shuttling it in and out of GPU memory</b> becomes the real bottleneck — more memory- and bandwidth-bound than the pure compute of "generating the next character." So the most effective target for cutting cost is to <b>shrink the KV cache and reuse it across turns</b>, not simply to compute faster.</>,
      },
      {
        q: '2. How do MQA and "cross-layer KV sharing" each shrink the KV cache?',
        a: <><b>MQA (Multi-Query Attention):</b> standard attention stores a separate Key/Value per head; MQA has <b>all heads share one KV</b>, squeezing the cache horizontally (officially 8x smaller than GQA). <b>Cross-layer KV sharing:</b> a model has many layers, each normally storing its own KV; this has <b>adjacent layers bind and share one</b>, shrinking it vertically another 2–3x. One horizontal, one vertical — plus sliding windows — they stack to shrink the KV cache more than 20x.</>,
      },
      {
        q: '3. What does a "~95% inter-turn cache hit rate" save, and why is it especially valuable for chat?',
        a: <>It saves the cost of <b>recomputing the conversation history</b>. Each time you send a new message, the long prior conversation's KV needn't be recomputed from scratch — it's fetched from the previous turn's cache (~95% of the time). Chat is precisely a case of <b>the same conversation being continued over and over</b>, with history piling up; recomputing it each turn would make cost soar with the turn count. Inter-turn reuse computes "history" once and reuses it, which pays off especially for long sessions.</>,
      },
    ],
    // ---- Closing ----
    finalTitle: '🔭 Extras · Part Four: four products, one theme',
    finalP1: <>With this, the first set of four extras is complete, and they spell out one line: <b>once top models become electricity anyone can call, what truly opens a gap is the engineering outside the model.</b> Manus competes on context engineering, Cursor on "splitting the task into optimizable subsystems," DeepSeek made "saving" a full-stack discipline, and Character.AI redefined "the cost of chat" onto the KV cache and wrung it out layer by layer.</>,
    finalP2: <>And this Character.AI piece bookends L31's KV cache: the same humble "working memory" — some use it to save money (stable prefix, higher hit rate), others to scale up (shrink size, reuse across turns). That's the payoff of understanding the principle — one concept lights up a whole row of real products. The extras will keep growing, tearing apart more of "what exactly makes it so good." See you next time.</>,
  },
}

// ---- KV cache 压缩叠加演示 ----
function KvShrinkDemo({ c }) {
  const d = c.demo
  const KEYS = ['mqa', 'window', 'cross', 'int8']
  const [on, setOn] = useState({})

  const enabled = KEYS.filter((k) => on[k])
  const product = enabled.reduce((p, k) => p * OPTS_FACTOR[k], 1)
  const cachePct = 100 / product

  const verdict = enabled.length === 0 ? d.verdictNone
    : enabled.length === KEYS.length ? d.verdictAll
    : d.verdictSome(enabled.length)
  const verdictColor = enabled.length === 0 ? 'var(--terracotta)' : enabled.length === KEYS.length ? 'var(--sage)' : 'var(--fg-1)'

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{d.title}</span>
        <span className="demo-hint">{d.hint}</span>
      </div>
      <div style={{ padding: '24px', display: 'grid', gap: 22 }}>
        {/* 开关 */}
        <div className="chips">
          {KEYS.map((k) => (
            <button key={k} className={`chip${on[k] ? ' active' : ''}`} onClick={() => setOn((s) => ({ ...s, [k]: !s[k] }))}>
              {on[k] ? '✓ ' : ''}{d.opts[k]}
            </button>
          ))}
        </div>

        {/* 缓存体积条 */}
        <div>
          <div className="footnote" style={{ marginBottom: 8 }}>{d.barLabel}：<b style={{ color: 'var(--fg-0)' }}>{cachePct.toFixed(1)}%</b></div>
          <div style={{ height: 26, borderRadius: 8, background: 'var(--bg-inset)', overflow: 'hidden', border: '1px solid var(--hairline)' }}>
            <div style={{ width: `${Math.max(cachePct, 1.5)}%`, height: '100%', background: cachePct > 50 ? 'var(--terracotta)' : cachePct > 12 ? 'var(--amber)' : 'var(--sage)', transition: 'width .4s ease', borderRadius: 6 }} />
          </div>
        </div>

        {/* 数字面板 */}
        <div className="use-grid cols-2">
          <div style={{ border: '1px solid var(--hairline)', borderRadius: 12, background: 'var(--bg-inset)', padding: '16px 18px', minHeight: 88, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
            <div style={{ fontSize: 12.5, color: 'var(--fg-2)', fontWeight: 600 }}>{d.statCache}</div>
            <div style={{ fontSize: 23, fontWeight: 800, color: cachePct > 50 ? 'var(--terracotta)' : 'var(--sage)', lineHeight: 1 }}>{cachePct.toFixed(1)}%</div>
          </div>
          <div style={{ border: '1px solid var(--hairline)', borderRadius: 12, background: 'var(--bg-inset)', padding: '16px 18px', minHeight: 88, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
            <div style={{ fontSize: 12.5, color: 'var(--fg-2)', fontWeight: 600 }}>{d.statUsers}</div>
            <div style={{ fontSize: 23, fontWeight: 800, color: 'var(--sage)', lineHeight: 1 }}>{product.toFixed(0)}×</div>
          </div>
        </div>

        <p style={{ margin: 0, fontWeight: 600, lineHeight: 1.7, color: verdictColor }}>{verdict}</p>
      </div>
    </div>
  )
}

export default function L34() {
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
        <KvShrinkDemo c={c} />
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
