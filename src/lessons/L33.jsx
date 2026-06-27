import { useState } from 'react'
import { Lsec, QuizItem } from '../components/ui.jsx'
import { useLang } from '../i18n/LangContext.jsx'

// ============================================================
// L33 · 番外篇 · 拆解 DeepSeek:用几分之一的钱训出顶尖模型
// 事实依据:DeepSeek-V3 技术报告 arXiv:2412.19437、R1 论文 arXiv:2501.12948
// 及其 Nature 同行评审版(2025-09)、SemiAnalysis 成本辨析。关键数字经核验:
// 671B 总参 / 37B 激活、H800×2048、$5.576M(仅最后一次训练运行的算力估算)、
// 英伟达 2025-01-27 收跌约 17% / 蒸发约 $589B。
// ============================================================

const TOTAL_PARAMS = 671 // B,总参数
const ACTIVE_PARAMS = 37 // B,每 token 激活
const GRID = 16 // 演示用的专家格子数
const ACT_K = 4 // 演示每 token 点亮的专家数

const C = {
  zh: {
    // ---- 核心概念 ----
    conceptTitle: '💡 核心概念:它不是"便宜",是"把省钱做成了系统工程"',
    conceptLead: '2025 年 1 月,一家中国公司 DeepSeek(深度求索)让全世界吓了一跳:它的模型登顶美国 App Store,英伟达单日蒸发近 6 千亿美元。最广为流传的一句话是"DeepSeek 只花了 560 万美元就训出了顶尖模型"。这句话既对又极易误读 —— 拆清它,正是这一课的价值所在 ——',
    contrastTag1: '直觉印象',
    contrastBig1: <>DeepSeek 用<span className="gap">560 万美元</span>造出了顶尖模型,大厂的钱都白烧了</>,
    contrastNote1: '好像顶尖大模型从此白菜价,谁都训得起。',
    contrastTag2: '真实机制',
    contrastBig2: <>560 万只是<span className="hl">最后一次训练运行的算力估算</span>;真正的突破,是把"省钱"做成了贯穿算法到硬件的系统工程</>,
    contrastNote2: '它没有让 AI 变白菜价,而是把每一分算力压榨到了极致。',
    exampleEn: <>V3 技术报告里写得明明白白:那 557.6 万美元是 <span className="hl">"假设 H800 租金每卡时 2 美元"算出的最后一次正式训练的算力成本,不含前期研究、消融实验</span>(也不含人力、硬件采购、之前的试错)。把它当成"DeepSeek 的全部投入",是全网最大的误读。</>,
    exampleZh: <>这接上 L12「预训练」和 L15「Scaling Laws」:同样是"大力出奇迹",DeepSeek 证明了"大力"也可以很省 —— 关键看你怎么用力。</>,
    // ---- 事实卡 ----
    factsTitle: '🧩 先认清 DeepSeek:四张事实卡',
    factsLead: '动手拆原理前,先用四张经核实的卡片摆清底细:',
    facts: [
      { label: '出身 · 幻方', term: <>量化基金<b>孵化</b></>, body: <>母公司是中国量化对冲基金<b>幻方量化(High-Flyer)</b>,创始人<b>梁文锋</b>。幻方早年为炒股囤下的大批 GPU,成了 DeepSeek 的算力底座 —— 一家"做研究"的机构,不急着商业化。</> },
      { label: '时刻 · 2025/1/27', term: <>英伟达 <b>-17%</b></>, body: <>R1 发布后那个周一,DeepSeek App <b>登顶美国 App Store</b>,英伟达单日收跌约 17%、市值<b>蒸发约 5,890 亿美元</b> —— 美股史上单家公司单日最大市值损失。</> },
      { label: '架构 · 省的根', term: <>671B / <b>激活 37B</b></>, body: <>V3 是<b>混合专家(MoE)</b>模型:总参数 671B,但每个 token <b>只激活 37B</b>(约 5.5%)。再加 MLA 压缩显存、FP8 低精度训练,在 <b>2048 张 H800</b>(被出口管制阉割过的卡)上训出。</> },
      { label: '开放 · 可商用', term: <>R1 <b>MIT 许可</b></>, body: <>R1 权重与代码以 <b>MIT 许可</b>开放,免费商用,甚至明确允许拿它的输出去<b>蒸馏</b>训练别的模型 —— 与闭源大厂的姿态截然相反。</> },
    ],
    factsSourceNote: (
      <>
        架构数字据{' '}
        <a href="https://arxiv.org/abs/2412.19437" target="_blank" rel="noreferrer">DeepSeek-V3 技术报告</a>(arXiv:2412.19437);英伟达跌幅据 Bloomberg/CNBC(2025-01-27);R1 许可据{' '}
        <a href="https://huggingface.co/deepseek-ai/DeepSeek-R1" target="_blank" rel="noreferrer">官方 Hugging Face 仓库</a>
        。
      </>
    ),
    // ---- 拆解正文 ----
    sysTitle: '📖 省钱从哪来:四件贯穿全栈的工程',
    sysLead: 'DeepSeek 的"便宜"不是某一个魔法开关,而是从算法到硬件层层省下来的。下面四件,前三件管"训练与推理更省",最后一件管"推理能力怎么来"。每条配一个生活类比。',
    sys: [
      { n: '01', term: 'MoE 混合专家:参数很大,但每步只用一小撮', tag: '省算力',
        body: <>传统"稠密"模型每生成一个字,都要动用<b>全部</b>参数。MoE 把网络拆成很多个"专家",每个 token 只<b>路由到其中少数几个</b>:V3 总参数 <b>671B,每 token 只激活 37B</b>。容量(总参数)很大保证聪明,但单步计算量(激活参数)很小保证便宜。</>,
        analogy: <><b>类比:</b>一家有几百名专科医生的大医院,每位病人只挂相关的两三个科,而不是让全院医生一起会诊 —— 医院很全能,单次看病却不贵。</> },
      { n: '02', term: 'MLA 潜在注意力:把"工作记忆"压缩着存', tag: '省显存',
        body: <>模型生成时要缓存之前每个 token 的 Key/Value(KV cache),长对话下它会撑爆显存。DeepSeek 自创的 <b>MLA(多头潜在注意力)</b>把 KV <b>压缩成一个低维潜向量</b>再缓存,显存占用大降,而效果与标准注意力相当。</>,
        analogy: <><b>类比:</b>记笔记不抄全文,而是记压缩过的要点;要用时再展开。笔记本同样大,却能装下长得多的会议。</> },
      { n: '03', term: 'FP8 + DualPipe:把阉割版显卡压榨到极致', tag: '抠硬件',
        body: <>因为出口管制,DeepSeek 只能用性能被砍过的 <b>H800</b>。它的对策是底层硬抠:用 <b>FP8 低精度</b>做大部分运算(数字更短、算得更快更省),用自研的 <b>DualPipe</b> 让计算和通信相互重叠、不让显卡空等,还用"无辅助损失"的负载均衡让每个专家都不闲着。</>,
        analogy: <><b>类比:</b>给你一辆被限了马力的车,你没法换车,只能把胎压、路线、换挡时机全调到最优 —— 硬件天花板低,就靠工程把利用率顶到天花板。</> },
      { n: '04', term: 'R1:不靠人教,纯靠"奖励"自己学会推理', tag: '反直觉',
        body: <>最震撼的一条:R1 的推理能力主要靠<b>强化学习(RL)</b>逼出来。实验版 <b>R1-Zero 甚至不做任何监督微调</b>,只给"答对有奖"的信号,模型就<b>自发涌现</b>出反思、自我验证、越想越长的思维链 —— 论文称之为"aha moment"。这套结果还登上了 <b>Nature</b> 封面、经过同行评审。</>,
        analogy: <><b>类比:</b>没有老师手把手教解题套路,只告诉学生"答对给糖"。为了多拿糖,他自己摸索出"先检查再下笔"的习惯 —— 策略是被奖励逼出来的,不是被灌输的。</> },
    ],
    sysSourceNote: (
      <>
        MoE / MLA / FP8 / DualPipe 据{' '}
        <a href="https://arxiv.org/abs/2412.19437" target="_blank" rel="noreferrer">V3 技术报告</a>;R1 纯 RL 与"aha moment"据{' '}
        <a href="https://arxiv.org/abs/2501.12948" target="_blank" rel="noreferrer">R1 论文</a>及其{' '}
        <a href="https://www.nature.com/articles/s41586-025-09422-z" target="_blank" rel="noreferrer">Nature 同行评审版</a>(2025-09)。
      </>
    ),
    // ---- 交互演示 ----
    demoSecTitle: '🎛️ 交互演示:为什么"参数很大"却"算得很省"',
    demoSecLead: '这就是第一件工程(MoE)的手感。切换"稠密 / MoE",点"下一个 token",看每生成一个字时到底动用了多少参数 —— 稠密模型每步点亮全部,MoE 每步只点亮一小撮。容量一样大,单步成本天差地别。这正是 DeepSeek "便宜"的根。',
    demo: {
      title: '🎛️ MoE 稀疏激活 · 演示',
      hint: '稠密=每步全用 · MoE=每步只用一小撮',
      modeDense: '稠密模型(每步全用)',
      modeMoe: 'MoE(每步只用一小撮)',
      nextToken: '下一个 token ▸',
      reset: '↺ 重置',
      tokenLabel: (n) => `已生成第 ${n} 个 token`,
      statTotal: '总参数(容量)',
      statActive: '本 token 激活',
      statCompute: '单步相对算力',
      gridNote: '(示意:真实 V3 有 256 个路由专家,每 token 激活 8 个)',
      verdictDense: '稠密:每生成一个字都动用全部 671B 参数 —— 聪明,但每一步都很贵。',
      verdictMoe: 'MoE:容量仍是 671B,但每步只激活约 37B(5.5%)—— 一样聪明,单步便宜十几倍。',
    },
    // ---- 误区 ----
    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      {
        bad: 'DeepSeek 只花 560 万美元就造出了顶尖模型,证明训大模型不烧钱了',
        good: '560 万只是"最后一次正式训练运行"的算力估算,不含前期研究、消融、人力、硬件采购;真实总投入是另一个量级',
        why: <><b>病因:</b>媒体把一个口径极窄的数字当成了"全部成本"。V3 报告原文白纸黑字:这 557.6 万美元是<b>假设 H800 每卡时 2 美元</b>、乘以最后一次训练的 GPU 工时算出来的,并<b>明确声明不含</b>前期研究与消融实验。它没算研发人力、没算之前无数次失败的试验、更没算幻方囤的几万张卡的采购成本(第三方估算其服务器资本开支以十亿美元计)。"训练运行的电费"和"造出这个模型的总投入"是两码事。</>,
      },
      {
        bad: 'DeepSeek 没什么真创新,就是抄/蒸馏了大厂的模型',
        good: '它的架构与训练方法是公开论文里可复现的系统工程(MoE / MLA / FP8 / GRPO),R1 还通过了 Nature 同行评审',
        why: <><b>病因:</b>"又便宜又好"容易让人怀疑"是不是走捷径抄的"。但 DeepSeek 把方法全写进了公开技术报告:MLA、无辅助损失负载均衡、FP8 训练框架、GRPO 强化学习算法 —— 这些都是可被同行复现、验证的真工程,R1 论文更是登上了 Nature 封面、经过正式同行评审(主流大模型里少见)。真正可核实的,是它公开的工程贡献。</>,
      },
      {
        bad: 'R1 的推理能力,是靠人工标注海量"思维链"一步步教出来的',
        good: 'R1-Zero 证明:不做监督微调、只给"答对有奖"的强化学习信号,推理就能自发涌现',
        why: <><b>病因:</b>我们默认"会推理"一定是被人教的。但 R1-Zero 的实验恰恰相反:研究者<b>不教模型怎么解题,只给对的激励</b>,模型为了多拿奖励,自己长出了反思、自我验证、越想越长的思维链(论文里著名的"aha moment")。当然,纯 RL 版可读性差、会中英混杂,最终的 R1 又补了少量数据来修。但核心洞察成立:<b>推理可以是被奖励"逼"出来的,而非被标注"喂"出来的。</b></>,
      },
    ],
    // ---- 小测 ----
    quizTitle: '✍️ 小练习',
    quiz: [
      {
        q: '1. 新闻说"DeepSeek 只花 560 万美元就干翻了烧掉几十亿的大厂"。用本课学到的,指出这个对比错在哪。',
        a: <>错在<b>拿两个不同口径的数字硬比</b>。560 万美元是 V3 报告里<b>假设 H800 每卡时 2 美元</b>、只算<b>最后一次正式训练运行</b>的 GPU 算力估算,报告明说<b>不含</b>前期研究、消融实验,也不含人力、之前的试错、以及幻方囤下的几万张卡的采购成本(第三方估算服务器资本开支达十亿美元级)。把"一次训练运行的电费"与大厂"全部研发投入"对冲,是典型的偷换口径。准确说法应是:"据 DeepSeek 自报,其最后一次训练运行的算力成本约 560 万美元。"</>,
      },
      {
        q: '2. V3 总参数 671B,但每个 token 只激活 37B。为什么这样能"又聪明又便宜"?',
        a: <>这是 <b>MoE(混合专家)</b>的核心。模型由很多"专家"子网络组成,<b>总参数(容量)</b>很大 —— 671B 让它见多识广、足够聪明;但每生成一个 token,路由器<b>只挑少数几个专家上场</b>,<b>实际激活</b>只有 37B,所以单步计算量(以及成本、显存)只有稠密 671B 模型的零头。一句话:<b>用大容量保证聪明,用稀疏激活保证便宜。</b></>,
      },
      {
        q: '3. R1-Zero "不做监督微调、纯靠强化学习就涌现出推理能力",这件事为什么反直觉、又为什么重要?',
        a: <>反直觉在于:我们默认"会推理"得靠人<b>手把手教</b>(喂海量标注好的思维链)。但 R1-Zero 表明,<b>只要给对激励信号(答对有奖),模型能自己摸索出</b>反思、自我验证、长思维链等高级策略 —— 策略是<b>涌现</b>的,不是灌输的。重要性在于:它大幅降低了对昂贵人工标注的依赖,指出一条"用 RL 让模型自学推理"的可扩展路径;而且这一结果经过了 Nature 同行评审,可信度更高。</>,
      },
    ],
    // ---- 收尾 ----
    finalTitle: '🔭 番外·第三篇:省钱,也是一种顶级能力',
    finalP1: <>Manus 拼上下文工程,Cursor 拼"模型之外的子系统",DeepSeek 则把<b>"省"做成了贯穿算法到硬件的系统工程</b> —— MoE 省算力、MLA 省显存、FP8 抠硬件,再用纯 RL 省下海量人工标注。三家拼的都不是"谁的模型更大",而是<b>谁的工程更聪明</b>。</>,
    finalP2: <>它也给你留下一个看新闻的护身符:<b>下次再看到惊人的"成本数字",先问一句——这个数,到底算了什么、没算什么?</b> 560 万美元的故事告诉我们,一个被掐头去尾的数字,能掀起近 6 千亿美元的市场地震。番外篇下一站,我们去看一个你天天聊天的产品:为什么 Character.AI 能用极低的成本,扛住海量用户同时陪聊。</>,
  },

  en: {
    // ---- Core Idea ----
    conceptTitle: '💡 Core Idea: it\'s not "cheap," it "made frugality a systems discipline"',
    conceptLead: 'In January 2025, a Chinese company, DeepSeek, startled the world: its model topped the US App Store, and Nvidia shed nearly $600B in a single day. The most-repeated line was "DeepSeek trained a top model for just $5.6M." That line is both true and dangerously easy to misread — untangling it is what this lesson is worth —',
    contrastTag1: 'Gut impression',
    contrastBig1: <>DeepSeek built a top model for<span className="gap">$5.6M</span>, so Big Tech burned its money for nothing</>,
    contrastNote1: 'As if top models are now dirt cheap and anyone can train one.',
    contrastTag2: 'Real mechanism',
    contrastBig2: <>$5.6M is just<span className="hl">the compute estimate of the final training run</span>; the real breakthrough is making "frugality" a systems discipline spanning algorithms to hardware</>,
    contrastNote2: 'It didn\'t make AI cheap — it squeezed every drop out of each unit of compute.',
    exampleEn: <>The V3 tech report says it plainly: that $5.576M is <span className="hl">the compute cost of the final official training run, "assuming H800 rental at $2 per GPU-hour," excluding prior research and ablation experiments</span> (and excluding salaries, hardware purchases, and earlier failed runs). Treating it as "DeepSeek's total spend" is the internet's biggest misread.</>,
    exampleZh: <>This connects to L12 "Pretraining" and L15 "Scaling Laws": still "bigger is smarter," but DeepSeek proved "bigger" can also be frugal — it depends on how you spend the effort.</>,
    // ---- Facts ----
    factsTitle: '🧩 Know DeepSeek First: four fact cards',
    factsLead: 'Before taking the principles apart, four verified cards to lay out the basics:',
    facts: [
      { label: 'Origin · High-Flyer', term: <>Quant-fund <b>spinout</b></>, body: <>Owned by the Chinese quant hedge fund <b>High-Flyer</b>, founded by <b>Liang Wenfeng</b>. The GPUs High-Flyer once stockpiled for trading became DeepSeek's compute base — a research-first outfit in no rush to monetize.</> },
      { label: 'Moment · 2025/1/27', term: <>Nvidia <b>-17%</b></>, body: <>The Monday after R1 dropped, the DeepSeek app <b>topped the US App Store</b>, and Nvidia closed down ~17%, <b>shedding about $589B</b> — the largest single-day market-cap loss for one company in US history.</> },
      { label: 'Architecture · the root', term: <>671B / <b>37B active</b></>, body: <>V3 is a <b>Mixture-of-Experts (MoE)</b> model: 671B total parameters, but <b>only 37B activated</b> per token (~5.5%). Add MLA to shrink memory and FP8 low-precision training, all on <b>2048 H800s</b> (export-throttled chips).</> },
      { label: 'Open · commercial', term: <>R1 <b>MIT license</b></>, body: <>R1 weights and code are released under the <b>MIT license</b>, free for commercial use, even explicitly allowing its outputs to be used to <b>distill</b> other models — the opposite stance from closed labs.</> },
    ],
    factsSourceNote: (
      <>
        Architecture figures per the{' '}
        <a href="https://arxiv.org/abs/2412.19437" target="_blank" rel="noreferrer">DeepSeek-V3 tech report</a> (arXiv:2412.19437); Nvidia's drop per Bloomberg/CNBC (2025-01-27); R1's license per the{' '}
        <a href="https://huggingface.co/deepseek-ai/DeepSeek-R1" target="_blank" rel="noreferrer">official Hugging Face repo</a>
        .
      </>
    ),
    // ---- Body ----
    sysTitle: '📖 Where the Savings Come From: four full-stack engineering moves',
    sysLead: 'DeepSeek\'s "cheapness" isn\'t one magic switch; it\'s saved layer by layer, from algorithms to hardware. Of the four below, the first three make training and inference cheaper, and the last is where the reasoning comes from. Each with an everyday analogy.',
    sys: [
      { n: '01', term: 'MoE: huge in parameters, but only a sliver used per step', tag: 'less compute',
        body: <>A traditional "dense" model uses <b>all</b> parameters to generate each character. MoE splits the network into many "experts," and each token is <b>routed to only a few</b>: V3 has <b>671B total parameters but activates only 37B</b> per token. Big capacity (total params) keeps it smart; small per-step compute (active params) keeps it cheap.</>,
        analogy: <><b>Analogy:</b> a giant hospital with hundreds of specialists, but each patient only sees the two or three relevant departments, not the whole staff in consultation — broadly capable, yet cheap per visit.</> },
      { n: '02', term: 'MLA: store the "working memory" compressed', tag: 'less memory',
        body: <>While generating, the model caches the Key/Value of every prior token (the KV cache), which blows up memory in long chats. DeepSeek's own <b>MLA (Multi-head Latent Attention)</b> <b>compresses the KV into a low-dimensional latent vector</b> before caching, slashing memory while matching standard attention's quality.</>,
        analogy: <><b>Analogy:</b> taking notes not as full transcripts but as compressed key points, expanded when needed. Same notebook, but it holds a far longer meeting.</> },
      { n: '03', term: 'FP8 + DualPipe: squeeze the throttled GPUs dry', tag: 'wring hardware',
        body: <>Due to export controls, DeepSeek could only use performance-cut <b>H800s</b>. Its answer is low-level grit: do most math in <b>FP8 low precision</b> (shorter numbers, faster and cheaper), use in-house <b>DualPipe</b> to overlap compute and communication so GPUs never idle, and use "auxiliary-loss-free" load balancing so no expert sits idle.</>,
        analogy: <><b>Analogy:</b> given a horsepower-limited car you can't replace, you tune tire pressure, route, and shift timing to the optimum — a low hardware ceiling, pushed to that ceiling by engineering.</> },
      { n: '04', term: 'R1: learns to reason on its own, from "rewards" not teaching', tag: 'counterintuitive',
        body: <>The most striking one: R1's reasoning is mainly forced out by <b>reinforcement learning (RL)</b>. The experimental <b>R1-Zero does no supervised fine-tuning at all</b> — given only a "right answer earns reward" signal, the model <b>spontaneously develops</b> reflection, self-verification, and ever-longer chains of thought — the paper's famous "aha moment." This result even made the cover of <b>Nature</b>, peer-reviewed.</>,
        analogy: <><b>Analogy:</b> no teacher drilling solution templates, just "candy for a correct answer." To win more candy, the student invents the habit of "check before committing" — strategy forced out by reward, not poured in.</> },
    ],
    sysSourceNote: (
      <>
        MoE / MLA / FP8 / DualPipe per the{' '}
        <a href="https://arxiv.org/abs/2412.19437" target="_blank" rel="noreferrer">V3 tech report</a>; R1's pure RL and "aha moment" per the{' '}
        <a href="https://arxiv.org/abs/2501.12948" target="_blank" rel="noreferrer">R1 paper</a> and its{' '}
        <a href="https://www.nature.com/articles/s41586-025-09422-z" target="_blank" rel="noreferrer">peer-reviewed Nature version</a> (2025-09).
      </>
    ),
    // ---- Interactive demo ----
    demoSecTitle: '🎛️ Interactive Demo: why "huge in parameters" can still be "cheap to run"',
    demoSecLead: 'Here\'s the feel of the first move (MoE). Toggle "dense / MoE," click "next token," and watch how many parameters each generated character actually uses — a dense model lights up all of them every step, MoE only a sliver. Same capacity, wildly different per-step cost. This is the root of DeepSeek\'s frugality.',
    demo: {
      title: '🎛️ MoE Sparse Activation · Demo',
      hint: 'dense = all every step · MoE = a sliver every step',
      modeDense: 'Dense model (all every step)',
      modeMoe: 'MoE (a sliver every step)',
      nextToken: 'Next token ▸',
      reset: '↺ Reset',
      tokenLabel: (n) => `Generated token #${n}`,
      statTotal: 'Total params (capacity)',
      statActive: 'Activated this token',
      statCompute: 'Relative compute / step',
      gridNote: '(Illustrative: real V3 has 256 routed experts, 8 activated per token)',
      verdictDense: 'Dense: every character uses all 671B params — smart, but every step is expensive.',
      verdictMoe: 'MoE: capacity is still 671B, but each step activates only ~37B (5.5%) — just as smart, an order of magnitude cheaper per step.',
    },
    // ---- Misconceptions ----
    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      {
        bad: 'DeepSeek built a top model for just $5.6M, proving training big models isn\'t expensive anymore',
        good: '$5.6M is only the compute estimate of the "final official training run," excluding prior research, ablations, salaries, and hardware; true total spend is another order of magnitude',
        why: <><b>Cause:</b> the media took a very narrow figure as "total cost." The V3 report states plainly: that $5.576M <b>assumes $2 per H800 GPU-hour</b> times the final run's GPU-hours, and <b>explicitly excludes</b> prior research and ablation experiments. It doesn't count R&D labor, the countless earlier failed experiments, or the purchase cost of the tens of thousands of GPUs High-Flyer stockpiled (third parties estimate server capex in the billions). "The electricity of a training run" and "the total spend to build this model" are two different things.</>,
      },
      {
        bad: 'DeepSeek has no real innovation; it just copied/distilled Big Tech\'s models',
        good: 'Its architecture and training methods are reproducible systems engineering in public papers (MoE / MLA / FP8 / GRPO); R1 even passed Nature peer review',
        why: <><b>Cause:</b> "cheap and good" tempts people to suspect a shortcut. But DeepSeek wrote its methods into public tech reports: MLA, auxiliary-loss-free load balancing, the FP8 training framework, the GRPO RL algorithm — real engineering peers can reproduce and verify, and the R1 paper made the cover of Nature with formal peer review (rare among mainstream models). What's actually verifiable is its open engineering contributions.</>,
      },
      {
        bad: 'R1\'s reasoning was taught step by step from massive hand-annotated chains of thought',
        good: 'R1-Zero shows: with no supervised fine-tuning, just a "right answer earns reward" RL signal, reasoning emerges on its own',
        why: <><b>Cause:</b> we assume "knowing how to reason" must be taught. R1-Zero shows the opposite: researchers <b>don't teach the model how to solve problems, only give the right incentives</b>, and to earn more reward the model grows reflection, self-verification, and ever-longer chains of thought on its own (the famous "aha moment"). The pure-RL version does read poorly and mixes languages, so the final R1 added a little data to fix it. But the core insight holds: <b>reasoning can be forced out by reward, not fed in by annotation.</b></>,
      },
    ],
    // ---- Quiz ----
    quizTitle: '✍️ Quick Quiz',
    quiz: [
      {
        q: '1. The news says "DeepSeek beat labs that burned billions, for just $5.6M." Using this lesson, point out what\'s wrong with the comparison.',
        a: <>It's wrong to <b>compare two figures of different scope</b>. The $5.6M is the V3 report's estimate — <b>assuming $2 per H800 GPU-hour</b> — for the <b>final official training run only</b>, and the report says it <b>excludes</b> prior research, ablations, salaries, earlier trial-and-error, and the purchase cost of the tens of thousands of GPUs High-Flyer stockpiled (third parties estimate server capex in the billions). Offsetting "one training run's electricity" against a lab's "total R&D spend" is a classic scope swap. The accurate phrasing: "Per DeepSeek's own report, the compute cost of its final training run was about $5.6M."</>,
      },
      {
        q: '2. V3 has 671B total parameters but activates only 37B per token. Why does that make it "smart yet cheap"?',
        a: <>That's the heart of <b>MoE (Mixture of Experts)</b>. The model is built from many "expert" sub-networks; the <b>total parameters (capacity)</b> are large — 671B makes it well-rounded and smart — but for each token the router <b>picks only a few experts</b>, so the <b>actually activated</b> portion is just 37B, making per-step compute (and cost, and memory) a fraction of a dense 671B model's. In one line: <b>large capacity for smarts, sparse activation for cheapness.</b></>,
      },
      {
        q: '3. R1-Zero "develops reasoning purely from RL, with no supervised fine-tuning." Why is this counterintuitive, and why does it matter?',
        a: <>It's counterintuitive because we assume "reasoning" must be <b>taught hands-on</b> (fed massive annotated chains of thought). But R1-Zero shows that <b>given the right reward signal (correct answers earn reward), the model figures out</b> reflection, self-verification, and long chains of thought on its own — strategy that <b>emerges</b> rather than being instilled. It matters because it sharply cuts dependence on expensive human annotation and points to a scalable "let the model self-teach reasoning via RL" path; and this result passed Nature peer review, raising confidence.</>,
      },
    ],
    // ---- Closing ----
    finalTitle: '🔭 Extras · Part Three: frugality is a top-tier capability too',
    finalP1: <>Manus competes on context engineering, Cursor on "subsystems outside the model," and DeepSeek made <b>"saving" a systems discipline from algorithms to hardware</b> — MoE saves compute, MLA saves memory, FP8 wrings the hardware, and pure RL saves mountains of human annotation. None of the three compete on "whose model is bigger," but on <b>whose engineering is smarter</b>.</>,
    finalP2: <>It also leaves you a charm against bad headlines: <b>next time you see a stunning "cost figure," first ask — what exactly does this number count, and what does it leave out?</b> The $5.6M story shows how a figure stripped of context can trigger a near-$600B market quake. Next stop in the extras: a product you chat with daily — why Character.AI can serve a flood of users at remarkably low cost.</>,
  },
}

// ---- MoE 稀疏激活演示 ----
function MoeDemo({ c }) {
  const d = c.demo
  const [moe, setMoe] = useState(true)
  const [tok, setTok] = useState(1)

  // 激活的专家:稠密=全部;MoE=随 token 滑动的一窗 ACT_K 个
  const active = new Set()
  if (moe) {
    const offset = ((tok - 1) * ACT_K) % GRID
    for (let j = 0; j < ACT_K; j++) active.add((offset + j) % GRID)
  } else {
    for (let i = 0; i < GRID; i++) active.add(i)
  }
  const activeParams = moe ? ACTIVE_PARAMS : TOTAL_PARAMS
  const computeRel = activeParams / TOTAL_PARAMS

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{d.title}</span>
        <span className="demo-hint">{d.hint}</span>
      </div>
      <div style={{ padding: '24px', display: 'grid', gap: 22 }}>
        {/* 控制 */}
        <div style={{ display: 'grid', gap: 14 }}>
          <div className="chips">
            <button className={`chip${!moe ? ' active' : ''}`} onClick={() => setMoe(false)}>{d.modeDense}</button>
            <button className={`chip${moe ? ' active' : ''}`} onClick={() => setMoe(true)}>{d.modeMoe}</button>
          </div>
          <div className="chips">
            <button className="chip" onClick={() => setTok((t) => t + 1)}>{d.nextToken}</button>
            <button className="chip" onClick={() => setTok(1)}>{d.reset}</button>
            <span className="footnote" style={{ alignSelf: 'center' }}>{d.tokenLabel(tok)}</span>
          </div>
        </div>

        {/* 专家格子 */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8 }}>
            {Array.from({ length: GRID }, (_, i) => {
              const on = active.has(i)
              return (
                <div key={i} style={{
                  aspectRatio: '1 / 1',
                  borderRadius: 10,
                  border: `1px solid ${on ? 'var(--sky)' : 'var(--hairline)'}`,
                  background: on ? 'var(--sky-bg)' : 'var(--bg-inset)',
                  opacity: on ? 1 : 0.4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, transition: 'all .25s ease',
                }}>{on ? '🧠' : '·'}</div>
              )
            })}
          </div>
          <p className="footnote" style={{ marginTop: 8 }}>{d.gridNote}</p>
        </div>

        {/* 数字面板 */}
        <div className="use-grid">
          {[
            { label: d.statTotal, value: `${TOTAL_PARAMS}B` },
            { label: d.statActive, value: `${activeParams}B`, color: moe ? 'var(--sage)' : 'var(--terracotta)' },
            { label: d.statCompute, value: `${(computeRel * 100).toFixed(0)}%`, color: moe ? 'var(--sage)' : 'var(--terracotta)' },
          ].map((s, i) => (
            <div key={i} style={{ border: '1px solid var(--hairline)', borderRadius: 12, background: 'var(--bg-inset)', padding: '16px 18px', minHeight: 88, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
              <div style={{ fontSize: 12.5, color: 'var(--fg-2)', fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: 23, fontWeight: 800, color: s.color || 'var(--fg-0)', lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        <p style={{ margin: 0, fontWeight: 600, lineHeight: 1.7, color: moe ? 'var(--sage)' : 'var(--terracotta)' }}>{moe ? d.verdictMoe : d.verdictDense}</p>
      </div>
    </div>
  )
}

export default function L33() {
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
        <MoeDemo c={c} />
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
