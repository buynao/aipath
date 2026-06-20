import { useState } from 'react'
import { Lsec, SliderRow, Pill, QuizItem } from '../components/ui.jsx'
import { useLang } from '../i18n/LangContext.jsx'

// ============================================================
// 温度与采样抽签机
// 双语内容层：结构 / class / 几何 / 数值 / state 逻辑均不变，仅可见文本按语言取用。
// 候选词 token 的展示文本随语言切换（z 分数、概率、动画一概不动）。
// ============================================================
const TOKENS = [
  { w: '好', en: 'nice', z: 2.6 }, { w: '不错', en: 'good', z: 1.9 }, { w: '晴朗', en: 'sunny', z: 1.5 }, { w: '舒服', en: 'pleasant', z: 1.1 },
  { w: '糟糕', en: 'awful', z: 0.3 }, { w: '冷', en: 'cold', z: 0.0 }, { w: '热', en: 'hot', z: -0.3 }, { w: '怪', en: 'weird', z: -1.2 },
]
const BASE_Y = 246, MAX_H = 176
const COL_X = [30, 82, 134, 186, 238, 290, 342, 394]

const C = {
  zh: {
    tok: (t) => t.w,
    slotInit: '__',
    sentence: (slot) => <>今天天气真<span className="slot">{slot}</span></>,
    demoTitle: '🎛️ 交互演示 · 「今天天气真__」抽签机',
    demoHint: '滑块调温度 · 胶囊切截断 · 按钮抽词',
    svgAria: '柱状图：8 个候选词在当前温度下的概率分布，被截断的词显示为灰色',
    svgCaption: '8 个候选词的概率（合计 100%，已四舍五入）',
    chips: [['none', '关闭截断'], ['topk', 'top-k = 3'], ['topp', 'top-p = 0.9']],
    sampleBtn: '🎲 采样一个',
    clearBtn: '清空记录',
    note: '被截掉的词概率清零（灰色柱），幸存的词按比例分摊后参与抽签。',
    tempText: (T) => {
      if (T <= 0.3) return '分布几乎全压在「好」上 —— 接近贪心：连抽十次，大概率十次都是它。'
      if (T <= 0.8) return '前几名瓜分了绝大部分概率，偶尔轮到二三名 —— 稳中带变。'
      if (T <= 1.3) return '接近模型的原始判断：第一名占优但不垄断，长尾有微小机会。'
      return '分布被抹平，连「怪」都分到可观概率 —— 多抽几次，怪词必现。'
    },
    cutText: (keep, mode) => {
      const n = keep.filter(Boolean).length
      if (mode === 'topk') return 'top-k = 3：永远只留前 3 名，其余 ' + (TOKENS.length - 3) + ' 个清零（灰色）—— 不管分布尖平，一刀切。'
      if (mode === 'topp') return 'top-p = 0.9：从第一名累加到 90% 即停，当前保留 ' + n + ' 个词 —— 分布越平，留得越多。'
      return '截断：关闭 —— 全部 ' + TOKENS.length + ' 个词都参与抽签。'
    },

    goalsTitle: '🎯 你将学会',
    goals: [
      <>看穿「重新生成」按钮的本质：模型每步交出的是全词表的概率分布，回答是被“抽”出来的</>,
      <>用“调对比度”的直觉吃透 temperature：低温放大差距趋向贪心，高温抹平差距让冷门词翻身</>,
      <>分清 top-k 与 top-p：都是先剪掉长尾再抽签 —— 一个定额，一个自适应</>,
      <>学会按任务拧旋钮：写代码低温、头脑风暴高温、聊天居中，并能识破“温度 = 创造力”的话术</>,
    ],

    conceptTitle: '💡 核心概念：答案不是“想”出来的，是“抽”出来的',
    conceptLead:
      '你一定见过这个现象：同一个问题问 ChatGPT 两遍，得到两版不同的回答；不满意还能点「重新生成」，它又换个说法再来一版。程序不是“同样输入、同样输出”吗？谜底其实在第 10 课的结尾就埋好了 —— Transformer 一路加工到最后，交出来的不是一个词，而是一张概率表：词表里十几万个 token，每个都分到一份概率，加起来正好 100%。模型的工作到此为止。「接下来选哪个词」是另一道独立的工序，叫采样（sampling）—— 同一张概率表，抽签方式不同，模型表现出的“性格”就完全不同。',
    contrastTag1: '直觉印象',
    contrastBig1: <>想好答案 <span className="gap">→</span> 逐字打出来</>,
    contrastNote1: '按这个理解，同样的问题就该有一字不差的回答 ——「重新生成」按钮根本不该存在。',
    contrastTag2: '真实机制',
    contrastBig2: <>每个词，都是按概率<span className="hl">抽签</span>抽出来的</>,
    contrastNote2: '模型每步只交概率表；从表里怎么挑词（贪心、抽签、截断）由应用方设定。回答不同，只因这次的签抽得不同。',
    scenarioLead: <>本课全程用一个具体场景：让模型续写「<b>今天天气真__</b>」。它交出的概率表，前 8 名大概长这样（已四舍五入）：</>,
    exampleEn1: '好 43% · 不错 22% · 晴朗 14% · 舒服 10% · 糟糕 4% · 冷 3% · 热 2% · 怪 1%',
    exampleZh1: <>这就是模型的全部输出：一张“看好程度”清单。「今天天气真」后面本来就没有唯一正确答案，这张表是模型对语言多样性的诚实刻画。注意「怪」只是<b>长尾的开始</b> —— 真实词表里，它后面还排着十几万个更冷门的词。</>,
    linkLead: '先把“现象”和“机制”连上线 —— 你在产品里见过的这些事，背后全是同一件事：',
    matchTh1: ['你在 ChatGPT / Claude 里看到的', '背后的机制'],
    matchRows1: [
      [<b>点「重新生成」，答案变了</b>, '同一张概率表，重新抽了一次签'],
      [<b>同一个模型，写代码严谨、聊天活泼</b>, '应用方在不同场景下用了不同的采样设置 —— 模型本体没换'],
      [<b>API 文档里的 temperature 和 top_p 参数</b>, '抽签前对概率表做的两步加工：调形状、剪长尾 —— 本课的两位主角'],
      [<b>网页版找不到任何旋钮</b>, '厂商替你选好了一组折中值，藏在了幕后'],
    ],
    nextLead: <>接下来两节分别拆这两步加工：<b>温度</b>管概率表的形状，<b>top-k / top-p</b> 管概率表的边界。</>,

    tempTitle: '📖 温度：给概率表“调对比度”',
    tempLead: '想象修图软件里的对比度滑块：往右拉，亮处更亮、暗处更暗，主角从画面里跳出来；往左拉，整张图灰成一片，谁也不比谁突出。temperature（温度）就是概率表的对比度滑块，只是方向相反 —— 温度越低，对比越强。它的全部动作只有一步：在 softmax 把分数变成概率之前，先把每个候选词的分数除以 T。',
    formulaEn: '新概率表 = softmax（ 原始分数 ÷ T ）',
    formulaZh: <>全课唯一的式子，三个零件全是熟人：<b>原始分数</b>，模型给每个候选词打的“看好程度”（第 10 课叫 logits）；<b>÷ T</b>，温度做的唯一动作 —— 一步除法；<b>softmax</b>，把任意一串分数压成总和 100% 的概率（第 10 课讲过）。没有新数学，只是在老流程里插了一步除法。</>,
    softmaxPara: <>为什么一步除法就能改变“性格”？关键在 softmax 的脾气：它对<b>分数差</b>极其敏感 —— 分数差稍微拉大，概率差就被成倍放大。拿真实数字说话：场景里「好」比「怪」高 3.8 分，softmax 端出的概率比约为 45 : 1。把 T 调到 0.5，所有分数除以 0.5 等于翻倍，差距变成 7.6 分，概率比骤增到约 2000 : 1 ——「怪」彻底出局，模型趋向“每步必选第一名”的<b>贪心模式</b>。反过来把 T 调到 2，分数全体减半，差距缩成 1.9 分，概率比缩到约 7 : 1 —— 冷门词翻身，怪话开始登场。</>,
    tempCards: [
      { label: <>T &lt; 1 · 降温</>, en: <>强者<b>愈强</b></>, zh: <>分数差被放大，第一名碾压全场。T 趋近 0 就是贪心（greedy）：每步必选最高分，同样输入几乎同样输出 —— 稳，但呆。</> },
      { label: <>T = 1 · 不动</>, en: <>原样<b>输出</b></>, zh: <>分数原封不动交给 softmax，端出的概率表就是模型的“原始判断”—— 不加戏，也不收敛。</> },
      { label: <>T &gt; 1 · 升温</>, en: <>冷门<b>翻身</b></>, zh: <>分数差被抹平，概率趋向“人人有份”。T 极大时接近均匀抽签 —— 鲜活，但随时口吐怪词。</> },
    ],
    whyKnobPara: <><b>为什么非要这颗旋钮不可？</b>因为两个极端各有各的死法。先看“永远选第一名”：研究者很早就发现，贪心写出的长文僵硬、空洞，还特别爱复读 —— 一句话一旦出现过，它就进入了上下文，反过来抬高自己再次出现的概率，模型于是陷进「我觉得很好。我觉得很好。我觉得很好。」式的死循环。再看另一头，“完全照原始概率抽”：每一步都给长尾留着门，长文写下来迟早抽中一个胡话词（下一节细讲）。一头是复读机，一头是醉汉 —— 所以才需要一颗<b>连续可调的旋钮</b>，让你在「稳」和「活」之间自己挑位置。</>,
    rewriteLead: '它具体怎么改写概率表？同一个「今天天气真__」，三档温度下的对比（数字与下方交互演示一致，待会儿可以亲手验证）：',
    tempTableTh: ['温度', '第一名「好」', '第八名「怪」', '体感'],
    tempTableRows: [
      ['T = 0.1', '≈100%', '≈0%', '复读机：抽一百次，基本一百次都是「好」'],
      ['T = 1.0', '43%', '1%', '原始判断：稳中有变，偶尔换个说法'],
      ['T = 2.0', '27%', '4%', '放飞：连抽几次，「怪」「糟糕」就可能蹦出来'],
    ],
    boundaryPara: <>最后划清边界：<b>温度改变的只是“怎么抽”，不是“模型知道什么”。</b>你拧动旋钮时，模型的参数、知识、推理能力一丝一毫没变 —— 升温逼不出它没有的知识，降温也补不上它缺的能力。它只是同一颗大脑的两种出牌方式。另有一个工程冷知识：哪怕 T 压到 0，两次输出也可能有微小差异 —— GPU 并行计算时浮点加法的顺序不固定，会带来极细微的数值抖动，偶尔恰好翻转两个得分接近的词的排名。所以 T = 0 是“接近确定”，别指望逐字复现。</>,

    cutTitle: '📖 top-k 与 top-p：先剪掉胡话，再抽签',
    cutLead: '温度有个管不住的死角：长尾。演示里只画了 8 个词，但真实概率表上「怪」后面还排着十几万个词 ——「葡萄糖」「函数」「申报单」…… 每一个的概率都微乎其微，可十几万个“微乎其微”加在一起，常常凑出好几个百分点。而一篇 500 字的回答意味着连抽几百次签：单次 1% 的事故率，几百次下来踩雷几乎是必然。更糟的是错误会滚雪球 —— 抽中的怪词立刻成为上下文的一部分，后面所有抽签都建立在它之上：',
    cutExEn: <>红烧肉做法：五花肉切块、冷水下锅焯水，加冰糖炒出糖色，然后倒入<b>……海关申报单</b>。</>,
    cutExZh: <>一次长尾事故毁掉整段专业感 —— 而且模型接下来还会一本正经地把「海关申报单」圆下去，越走越偏。截断策略要做的，就是把这类事故的概率<b>直接清零</b>。</>,
    cutIdeaLead: '思路简单粗暴：抽签之前，先把概率表的尾巴剪掉，只在“靠谱区”里抽。剪法有两种：',
    cutCards: [
      { label: '定额截断', en: <>top-k <b>留前 k 名</b></>, zh: <>只保留概率<b>最高的 k 个</b>词（实际系统常用 40、50，本课演示用 3 方便观察），其余全部清零，剩下的按比例重新分摊概率再抽签。规则简单，但“一刀切”—— 不看分布长什么样。</> },
      { label: '自适应截断', en: <>top-p <b>留到累计 p</b></>, zh: <>从第一名往下<b>累加概率，刚凑够 p（比如 90%）就停</b>，圈外全部清零。又叫核采样（nucleus sampling）：分布尖时圈子自动收紧，分布平时自动放宽 —— 跟着模型的“把握”走。</> },
    ],
    cutCompareLead: '两种剪法的差别，在极端分布下看得最清楚：',
    cutTableTh: ['情形', 'top-k = 3', 'top-p = 0.9'],
    cutTableRows: [
      [<>分布很尖<div className="footnote">T = 0.3，「好」独占近九成</div></>, '仍留 3 个 —— 第 3 名只剩 2%，留着也几乎抽不到', '自动只留 2 个 —— 前两名已凑够 90%'],
      [<>分布被抹平<div className="footnote">T = 2，「好」仅占 27%</div></>, '仍留 3 个 —— 第 4 名「舒服」13% 的合理机会被硬砍', '自动放宽到 7 个 —— 合理候选都保住，只剪最尾巴'],
    ],
    pipelinePara: <>这正是 top-p 后来居上、成为多数系统默认的原因：它不数人头，而是看把握 —— 模型有把握时收紧候选，没把握时放宽候选。实际系统里，温度和 top-p 几乎总是搭着用，完整流水线四步：<b>调形状（温度）→ 剪长尾（top-p）→ 幸存的词重新归一化 → 抽签</b>。两颗旋钮分管两件事：温度管“敢不敢冒险”，top-p 管“底线在哪”。常见做法是温度按任务调，top-p 固定在 0.9 ~ 1.0 附近小动 —— 各家 API 的默认值与推荐组合不一样，动手前以官方文档为准。</>,
    limitPara: '截断也有它的局限：它防得住“明显的胡话词”，防不住“流畅的错话”。一句概率很高、语法完美的错误陈述，能轻松穿过所有截断 —— 这就是后面第 29 课要讲的“幻觉”：截断管得住怪词，管不住一本正经的胡说。',

    cutSourceNote: (
      <>
        top-p（核采样）以及“贪心解码会让长文退化、复读”的现象，出自 Holtzman 等 2019{' '}
        <a href="https://arxiv.org/abs/1904.09751" target="_blank" rel="noreferrer">
          The Curious Case of Neural Text Degeneration
        </a>
        。
      </>
    ),
    bridgeTitle: '➡️ 下一课怎么接上',
    bridgeLead: '到这里，“大模型篇”的内部机制——分词、预训练、对齐、采样——基本拼齐了。但有个更大的问题一直没问：为什么非要把模型堆得这么大？参数、数据、算力同时翻十倍，能力到底怎么变？下一课讲 Scaling Laws 与涌现，解释“大力出奇迹”背后那条惊人平滑的曲线，以及模型“突然学会”新本领的神秘瞬间。',
    bridgeSteps: ['机制已拼齐（含采样）', '为什么要堆这么大？', '参数 / 数据 / 算力一起放大', '下一课：Scaling Laws 与涌现'],
    demoSecTitle: '🎛️ 交互演示：亲手拧一拧温度旋钮',
    demoSecLead: '理论齐了，上手验证。建议按顺序做三个实验：① 把 T 拉到 0.1，连点十次「采样」—— 几乎次次都是「好」；② 拉到 2.0 再连点 ——「怪」「糟糕」开始出没；③ 保持高温，切换 top-k / top-p —— 看被截掉的柱子变灰，再调温度，观察 top-p 的圈子如何自动伸缩。',

    practiceTitle: '🧭 实战：这颗旋钮该拧到哪',
    practiceLead: '没有“最佳温度”，只有“合适的温度”。拧之前先问一句：这个任务要的是「对」、「自然」，还是「广」？',
    practiceCards: [
      { label: '低温 0 ~ 0.3', en: <>求<b>对</b> · 代码与事实</>, zh: <>改 bug、翻译合同、按格式提取数据 —— 这些任务答案空间小、容错低，要的是稳定可复现，不需要“妙笔”。</> },
      { label: '中温 ≈ 0.5 ~ 0.8', en: <>求<b>自然</b> · 日常对话</>, zh: <>聊天、写邮件、总结文章 —— 既要靠谱，又不想每句话都像模板。多数对话产品的默认档位就落在这一带。</> },
      { label: '高温 0.8 ~ 1.2', en: <>求<b>广</b> · 头脑风暴</>, zh: <>起名字、想 slogan、编故事开头 —— 一次让它出 20 个，人来挑。高温负责发散，把关交还给人。</> },
    ],
    practiceFootnote: '两个提醒：① 各家 API 的默认值和取值范围不一样（有的默认 1.0、最高可调到 2.0），动手前以官方文档为准；② 网页版 ChatGPT / Claude 不开放这颗旋钮，厂商已替你选好折中值 —— 所以“同一个模型”在不同产品里手感不同，往往不是模型变了，是采样设置变了。',

    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      {
        bad: 'temperature 是“创造力”开关，调高 AI 就更有创意',
        good: '它只调概率表的平滑度 —— 高温让冷门词更容易被抽中，不会带来任何新知识',
        why: <><b>病因：</b>“创造力”是厂商和自媒体爱用的拟人词。模型的知识和能力在预训练时已经定型（第 12 课），温度只改变“从已有判断里怎么抽”。高温下的“惊喜”全部来自长尾词 —— 惊喜和胡话，本来就是同一批词。</>,
      },
      {
        bad: 'T = 0 时模型最严谨，答案一定正确',
        good: 'T = 0 只保证“每步选概率最高的词”—— 概率高不等于事实对，错也错得更自信',
        why: <><b>病因：</b>把“确定性”误当“准确性”。如果模型对某个错误说法本来就最看好（比如训练语料里错误写法更常见），T = 0 反而保证它<b>每次都犯同一个错</b>。温度解决的是“稳定”，从来解决不了“正确”。</>,
      },
      {
        bad: '每次回答不一样，说明 AI 有情绪、有自由意志',
        good: '只是从同一张概率表里重新抽了一次签 —— 随机数不同，词就不同',
        why: <><b>病因：</b>拟人化投射。人类行为多变源于心情和想法，于是我们把模型的多变也归因于“它在想”。验证很简单：把温度调到接近 0，“自由意志”立刻消失 —— 真正的心情可没有开关。</>,
      },
    ],

    quizTitle: '✍️ 小练习',
    quiz: [
      {
        q: '1. 同事用 API 给商品批量生成文案，抱怨“每次生成的都差不多，换汤不换药”。该把 temperature 往哪边调？要不要顺手关掉 top-p？',
        a: <><b>调高</b>（比如 1.0 ~ 1.2），让冷门表达有机会被抽中，一次多生成几版供人挑。top-p 建议<b>保留</b>（0.9 上下）：高温恰恰把长尾抬了起来，正需要它兜底防胡话 —— 温度管发散，top-p 管底线，两者分工不冲突。</>,
      },
      {
        q: '2. 朋友说：“我把 temperature 设成 0 了，所以这份 AI 生成的合同摘要肯定没错。”这句话哪里有问题？',
        a: <>T = 0 只保证<b>稳定</b>（每步选最高概率词），不保证<b>正确</b>。模型若本来就“最看好”某个错误表述，T = 0 会让它每次都自信地输出同一个错误。事实正确性要靠人工核对或外接资料来兜底（应用篇会讲）。顺带一提：严格说 T = 0 也可能有浮点抖动带来的微小差异，连“逐字复现”都不绝对。</>,
      },
      {
        q: '3. 用本课的概念解释：为什么诗歌生成器敢把温度开到 1.2，而客服机器人通常压在 0.3 以下？',
        a: <>诗歌要的是<b>广</b>：冷门词翻身正是新鲜意象的来源，偶尔的怪词读者还会当成“诗意”，事故成本约等于零。客服要的是<b>对</b>：答案空间小、容错极低，一次长尾事故（报错价格、编个不存在的政策）的代价远大于“说话呆板”。同一颗旋钮的两端，是两种职业性格。</>,
      },
    ],
  },

  en: {
    tok: (t) => t.en,
    slotInit: '__',
    sentence: (slot) => <>The weather today is really <span className="slot">{slot}</span></>,
    demoTitle: '🎛️ Interactive · "The weather today is really __" sampler',
    demoHint: 'Slider sets temperature · chips switch truncation · button draws a token',
    svgAria: 'Bar chart: probability distribution of 8 candidate tokens at the current temperature; truncated tokens are shown in gray',
    svgCaption: 'Probabilities of 8 candidate tokens (sum to 100%, rounded)',
    chips: [['none', 'Truncation off'], ['topk', 'top-k = 3'], ['topp', 'top-p = 0.9']],
    sampleBtn: '🎲 Sample one',
    clearBtn: 'Clear history',
    note: 'Truncated tokens have their probability zeroed (gray bars); the survivors are rescaled proportionally before the draw.',
    tempText: (T) => {
      if (T <= 0.3) return 'The distribution is almost entirely piled onto "nice" — close to greedy: draw ten times in a row and you will very likely get it all ten times.'
      if (T <= 0.8) return 'The top few split nearly all the probability, with the second and third occasionally getting a turn — steady with a touch of variety.'
      if (T <= 1.3) return "Close to the model's raw judgment: the leader dominates but does not monopolize, and the long tail has a slim chance."
      return 'The distribution is flattened, and even "weird" gets a sizable share — draw a few more times and the weird tokens are bound to show up.'
    },
    cutText: (keep, mode) => {
      const n = keep.filter(Boolean).length
      if (mode === 'topk') return 'top-k = 3: always keep only the top 3, zeroing out the other ' + (TOKENS.length - 3) + ' (gray) — a blanket cut, regardless of whether the distribution is peaked or flat.'
      if (mode === 'topp') return 'top-p = 0.9: accumulate from the leader and stop at 90%; currently keeping ' + n + ' tokens — the flatter the distribution, the more you keep.'
      return 'Truncation: off — all ' + TOKENS.length + ' tokens take part in the draw.'
    },

    goalsTitle: "🎯 What You'll Learn",
    goals: [
      <>See through the "Regenerate" button: at each step the model hands over a probability distribution over the whole vocabulary, and the answer is "drawn" from it</>,
      <>Grasp temperature through the "adjust contrast" intuition: low temperature amplifies gaps and trends toward greedy, high temperature flattens gaps and lets rare tokens make a comeback</>,
      <>Tell top-k from top-p: both trim the long tail before drawing — one a fixed quota, one adaptive</>,
      <>Learn to turn the knob by task: low temperature for code, high for brainstorming, middling for chat — and see through the "temperature = creativity" spin</>,
    ],

    conceptTitle: '💡 Core Idea: the answer isn’t "thought up," it’s "drawn"',
    conceptLead:
      'You’ve surely seen this: ask ChatGPT the same question twice and get two different answers; unhappy with it, you hit "Regenerate" and it rephrases yet again. Aren’t programs supposed to give "same input, same output"? The answer was actually planted at the end of Lesson 10 — after all of the Transformer’s processing, what it hands over is not a single word but a probability table: hundreds of thousands of tokens in the vocabulary, each assigned a slice of probability, summing to exactly 100%. The model’s job ends there. "Which word to pick next" is a separate, independent step called sampling — with the same probability table, a different way of drawing gives the model a completely different "personality."',
    contrastTag1: 'Intuitive impression',
    contrastBig1: <>Think up the answer <span className="gap">→</span> type it out word by word</>,
    contrastNote1: 'On this view, the same question should yield a word-for-word identical answer — the "Regenerate" button shouldn’t exist at all.',
    contrastTag2: 'Real mechanism',
    contrastBig2: <>Every word is <span className="hl">drawn</span> by probability</>,
    contrastNote2: 'At each step the model only hands over a probability table; how a word is picked from it (greedy, sampling, truncation) is set by the application. The answer differs only because this time the draw came out differently.',
    scenarioLead: <>This lesson runs on one concrete scenario throughout: have the model continue "<b>The weather today is really __</b>." The top 8 of the probability table it hands over look roughly like this (rounded):</>,
    exampleEn1: 'nice 43% · good 22% · sunny 14% · pleasant 10% · awful 4% · cold 3% · hot 2% · weird 1%',
    exampleZh1: <>That is the model's entire output: a ranked list of "how favorable." There was never a single correct word after "The weather today is really," and this table is the model's honest portrayal of linguistic diversity. Note that "weird" is just <b>the start of the long tail</b> — in the real vocabulary, hundreds of thousands of even rarer words queue up behind it.</>,
    linkLead: 'First connect "phenomenon" to "mechanism" — the things you’ve seen in these products all come down to the same one thing:',
    matchTh1: ['What you see in ChatGPT / Claude', 'The mechanism behind it'],
    matchRows1: [
      [<b>Hit "Regenerate" and the answer changes</b>, 'The same probability table, drawn once more'],
      [<b>The same model is rigorous at code and lively at chat</b>, 'The application used different sampling settings in different scenarios — the model itself didn’t change'],
      [<b>The temperature and top_p parameters in the API docs</b>, 'Two pre-draw processing steps applied to the probability table: reshape it, trim the tail — the two stars of this lesson'],
      [<b>No knobs to be found in the web version</b>, 'The vendor picked a compromise set of values for you and hid them behind the scenes'],
    ],
    nextLead: <>The next two sections break down these two processing steps separately: <b>temperature</b> governs the shape of the probability table, <b>top-k / top-p</b> govern its boundary.</>,

    tempTitle: '📖 Temperature: "adjusting the contrast" of the probability table',
    tempLead: 'Picture the contrast slider in a photo editor: drag right and bright gets brighter, dark gets darker, and the subject pops out of the frame; drag left and the whole image grays into a blur where nothing stands out. temperature is the contrast slider for the probability table, just reversed — the lower the temperature, the stronger the contrast. Its entire action is a single step: before softmax turns scores into probabilities, divide each candidate’s score by T.',
    formulaEn: 'new probability table = softmax( raw scores ÷ T )',
    formulaZh: <>The only formula in the whole lesson, and all three parts are old friends: <b>raw scores</b>, the "how favorable" the model assigns each candidate (called logits in Lesson 10); <b>÷ T</b>, temperature's only action — one division; <b>softmax</b>, squashing any string of scores into probabilities summing to 100% (covered in Lesson 10). No new math, just one division inserted into the old pipeline.</>,
    softmaxPara: <>Why can one division change the "personality"? The key is softmax's temperament: it is extremely sensitive to <b>score gaps</b> — widen a gap a little and the probability gap is amplified manyfold. Let the real numbers speak: in our scenario "nice" is 3.8 points above "weird," and softmax serves up a probability ratio of about 45 : 1. Set T to 0.5, and dividing every score by 0.5 doubles it; the gap becomes 7.6 points and the ratio jumps to roughly 2000 : 1 — "weird" is out entirely, and the model trends toward the <b>greedy mode</b> of "always pick the leader at each step." Conversely, set T to 2, every score is halved, the gap shrinks to 1.9 points, and the ratio drops to about 7 : 1 — rare words make a comeback, and oddities begin to appear.</>,
    tempCards: [
      { label: <>T &lt; 1 · cool down</>, en: <>the strong get <b>stronger</b></>, zh: <>Score gaps are amplified and the leader crushes the field. As T approaches 0 it becomes greedy: always pick the highest score at each step, near-identical output for the same input — steady, but dull.</> },
      { label: <>T = 1 · unchanged</>, en: <>output <b>as is</b></>, zh: <>Scores are handed to softmax untouched, and the probability table served up is the model's "raw judgment" — no embellishment, no convergence.</> },
      { label: <>T &gt; 1 · heat up</>, en: <>the rare <b>make a comeback</b></>, zh: <>Score gaps are flattened and probabilities trend toward "a share for everyone." At very large T it nears a uniform draw — vivid, but prone to blurting out odd words.</> },
    ],
    whyKnobPara: <><b>Why is this knob indispensable?</b> Because each extreme has its own way of dying. First, "always pick the leader": researchers found early on that long text written greedily is stiff, hollow, and especially prone to repetition — once a sentence has appeared, it enters the context and in turn raises its own probability of appearing again, so the model falls into a "I think it's great. I think it's great. I think it's great." death loop. Now the other end, "draw strictly by the raw probabilities": every step leaves the door open to the long tail, so over a long passage you'll eventually draw a nonsense word (more on this next section). One end is a broken record, the other a drunkard — which is why we need a <b>continuously adjustable knob</b> that lets you pick your own spot between "steady" and "lively."</>,
    rewriteLead: 'How exactly does it rewrite the probability table? For the same "The weather today is really __," here is the comparison across three temperatures (the numbers match the interactive demo below, which you can verify by hand shortly):',
    tempTableTh: ['Temperature', 'Leader "nice"', 'Eighth place "weird"', 'How it feels'],
    tempTableRows: [
      ['T = 0.1', '≈100%', '≈0%', 'Broken record: draw a hundred times, essentially all hundred are "nice"'],
      ['T = 1.0', '43%', '1%', 'Raw judgment: steady with variety, an occasional rephrasing'],
      ['T = 2.0', '27%', '4%', 'Let loose: draw a few times and "weird" or "awful" may pop out'],
    ],
    boundaryPara: <>Finally, draw the line clearly: <b>temperature only changes "how to draw," not "what the model knows."</b> When you turn the knob, the model's parameters, knowledge, and reasoning ability don't change one bit — heating it up can't force out knowledge it lacks, and cooling it down can't make up for ability it's missing. It's just two ways the same brain plays its hand. One more engineering tidbit: even with T pushed to 0, two runs can differ slightly — during GPU parallel computation the order of floating-point additions isn't fixed, introducing tiny numerical jitter that occasionally flips the ranking of two near-tied words. So T = 0 is "near-deterministic" — don't expect a word-for-word reproduction.</>,

    cutTitle: '📖 top-k and top-p: trim the nonsense first, then draw',
    cutLead: 'Temperature has a blind spot it can’t control: the long tail. The demo draws only 8 words, but in the real probability table hundreds of thousands of words queue up behind "weird" — "glucose," "function," "declaration form"… each with a minuscule probability, yet hundreds of thousands of "minuscules" added together often amount to several percent. And a 500-word answer means hundreds of draws in a row: at a 1% per-draw accident rate, hitting a mine over hundreds of draws is nearly inevitable. Worse, errors snowball — a drawn odd word immediately becomes part of the context, and every subsequent draw is built on top of it:',
    cutExEn: <>Red-braised pork recipe: cut the pork belly into chunks, blanch in cold water from a cold start, fry rock sugar to a caramel color, then pour in <b>… a customs declaration form</b>.</>,
    cutExZh: <>One long-tail accident ruins the whole stretch of professionalism — and the model will then earnestly keep rationalizing "customs declaration form," drifting further and further off. What truncation strategies do is <b>zero out</b> the probability of accidents like this.</>,
    cutIdeaLead: 'The idea is crude and simple: before drawing, trim the tail off the probability table and draw only within the "reliable zone." There are two ways to trim:',
    cutCards: [
      { label: 'Fixed-quota truncation', en: <>top-k <b>keep the top k</b></>, zh: <>Keep only the <b>k highest-probability</b> words (real systems often use 40 or 50; this lesson uses 3 for easy observation), zero out the rest, and rescale the survivors' probabilities proportionally before drawing. The rule is simple, but it's a "blanket cut" — it ignores what the distribution looks like.</> },
      { label: 'Adaptive truncation', en: <>top-p <b>keep up to cumulative p</b></>, zh: <>From the leader downward, <b>accumulate probability and stop the moment it just reaches p (say 90%)</b>, zeroing out everything outside the circle. Also called nucleus sampling: when the distribution is peaked the circle tightens automatically, when flat it widens automatically — following the model's "confidence."</> },
    ],
    cutCompareLead: 'The difference between the two ways of trimming shows up most clearly under extreme distributions:',
    cutTableTh: ['Case', 'top-k = 3', 'top-p = 0.9'],
    cutTableRows: [
      [<>Very peaked<div className="footnote">T = 0.3, "nice" alone takes nearly 90%</div></>, 'Still keeps 3 — the 3rd is down to 2%, almost never drawn even if kept', 'Automatically keeps only 2 — the top two already reach 90%'],
      [<>Flattened<div className="footnote">T = 2, "nice" takes only 27%</div></>, 'Still keeps 3 — the reasonable 13% chance of the 4th, "pleasant," is hard-cut away', 'Automatically widens to 7 — all reasonable candidates kept, trimming only the very tail'],
    ],
    pipelinePara: <>This is exactly why top-p came from behind to become the default in most systems: it doesn't count heads, it gauges confidence — tightening candidates when the model is confident, widening them when it isn't. In real systems temperature and top-p are almost always used together, a full four-step pipeline: <b>reshape (temperature) → trim the tail (top-p) → renormalize the survivors → draw</b>. The two knobs handle two things: temperature governs "how bold to be," top-p governs "where the floor is." A common practice is to tune temperature by task and keep top-p nudged around 0.9 ~ 1.0 — each API's defaults and recommended combinations differ, so check the official docs before you start.</>,
    limitPara: 'Truncation has its limits too: it stops "obvious nonsense words" but not "fluent falsehoods." A high-probability, grammatically perfect false statement sails right through any truncation — this is the "hallucination" covered later in Lesson 29: truncation can control odd words, but not earnest nonsense.',

    cutSourceNote: (
      <>
        top-p (nucleus sampling) and the finding that "greedy decoding makes long text degenerate and repeat" come from Holtzman et al. 2019,{' '}
        <a href="https://arxiv.org/abs/1904.09751" target="_blank" rel="noreferrer">
          The Curious Case of Neural Text Degeneration
        </a>
        .
      </>
    ),
    bridgeTitle: '➡️ How This Leads to Lesson 15',
    bridgeLead: 'With this, the inner machinery of the "large models" stage — tokenization, pretraining, alignment, sampling — is basically assembled. But a bigger question has gone unasked: why pile the model up so large in the first place? When parameters, data, and compute all scale 10×, how exactly does capability change? The next lesson covers scaling laws and emergence, explaining the astonishingly smooth curve behind "bigger is smarter" and the mysterious moments when a model "suddenly learns" a new skill.',
    bridgeSteps: ['Machinery assembled (incl. sampling)', 'Why build it this big?', 'Scale params / data / compute together', 'Next: Scaling Laws & Emergence'],
    demoSecTitle: '🎛️ Interactive: turn the temperature knob yourself',
    demoSecLead: 'The theory is in place; time to verify hands-on. Try three experiments in order: ① pull T to 0.1 and click "Sample" ten times — almost always "nice"; ② pull it to 2.0 and click again — "weird" and "awful" start showing up; ③ keep it hot and switch top-k / top-p — watch the truncated bars turn gray, then adjust temperature and observe how the top-p circle stretches and shrinks on its own.',

    practiceTitle: '🧭 In Practice: where to set this knob',
    practiceLead: 'There is no "best temperature," only a "suitable temperature." Before you turn it, ask one question: does this task want "correct," "natural," or "broad"?',
    practiceCards: [
      { label: 'Low 0 ~ 0.3', en: <>for <b>correct</b> · code and facts</>, zh: <>Fixing bugs, translating contracts, extracting data in a fixed format — these tasks have a small answer space and low tolerance for error; they want stable, reproducible results, not "a flourish of the pen."</> },
      { label: 'Mid ≈ 0.5 ~ 0.8', en: <>for <b>natural</b> · everyday conversation</>, zh: <>Chatting, writing emails, summarizing articles — reliable, yet not wanting every sentence to read like a template. The default setting of most conversational products lands right in this band.</> },
      { label: 'High 0.8 ~ 1.2', en: <>for <b>broad</b> · brainstorming</>, zh: <>Coming up with names, slogans, story openers — have it produce 20 at once and let a human pick. High temperature handles divergence; the gatekeeping returns to the human.</> },
    ],
    practiceFootnote: 'Two reminders: ① each API’s default value and range differ (some default to 1.0 and go up to 2.0), so check the official docs before you start; ② the web versions of ChatGPT / Claude don’t expose this knob — the vendor has picked a compromise value for you, so when "the same model" feels different across products, it’s often not the model that changed but the sampling settings.',

    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      {
        bad: 'temperature is a "creativity" switch; turn it up and the AI gets more creative',
        good: 'It only adjusts the smoothness of the probability table — high temperature makes rare words easier to draw, but brings no new knowledge',
        why: <><b>Cause:</b> "creativity" is an anthropomorphic word that vendors and influencers love. The model's knowledge and ability were locked in during pretraining (Lesson 12); temperature only changes "how to draw from existing judgment." The "surprises" at high temperature all come from long-tail words — surprise and nonsense are the very same batch of words.</>,
      },
      {
        bad: 'At T = 0 the model is most rigorous and the answer must be correct',
        good: 'T = 0 only guarantees "pick the highest-probability word at each step" — high probability does not equal factually correct; it just gets things wrong more confidently',
        why: <><b>Cause:</b> mistaking "determinism" for "accuracy." If the model already favors a wrong statement (e.g., the wrong wording is more common in the training corpus), T = 0 instead guarantees it <b>makes the same mistake every time</b>. Temperature solves "stability"; it has never solved "correctness."</>,
      },
      {
        bad: 'A different answer every time means the AI has emotions and free will',
        good: 'It just drew once more from the same probability table — a different random number, a different word',
        why: <><b>Cause:</b> anthropomorphic projection. Human behavior varies because of moods and thoughts, so we attribute the model's variability to "it's thinking." Verification is simple: set temperature near 0 and the "free will" vanishes at once — a real mood has no switch.</>,
      },
    ],

    quizTitle: '✍️ Quick Quiz',
    quiz: [
      {
        q: '1. A colleague uses the API to batch-generate product copy and complains that "every generation is about the same, old wine in a new bottle." Which way should temperature go? Should top-p be turned off along the way?',
        a: <><b>Turn it up</b> (say 1.0 ~ 1.2) so rare phrasings get a chance to be drawn, generating several versions at once for a human to pick. top-p is best <b>kept</b> (around 0.9): high temperature is exactly what lifts the long tail, so you need it as a backstop against nonsense — temperature governs divergence, top-p governs the floor, and the two divide the work without conflict.</>,
      },
      {
        q: '2. A friend says, "I set temperature to 0, so this AI-generated contract summary must be error-free." What’s wrong with that statement?',
        a: <>T = 0 only guarantees <b>stability</b> (pick the highest-probability word at each step), not <b>correctness</b>. If the model already "favors" a wrong wording, T = 0 makes it confidently output the same error every time. Factual correctness has to be backstopped by human review or external references (covered in the applications section). By the way: strictly speaking T = 0 may also have tiny differences from floating-point jitter, so even "word-for-word reproduction" isn't absolute.</>,
      },
      {
        q: '3. Use this lesson’s concepts to explain: why does a poetry generator dare to crank temperature to 1.2, while a customer-service bot is usually held below 0.3?',
        a: <>Poetry wants <b>breadth</b>: rare words making a comeback are exactly the source of fresh imagery, and an occasional odd word is even read as "poetic," with an accident cost near zero. Customer service wants <b>correctness</b>: a small answer space, extremely low tolerance for error, where one long-tail accident (a misquoted price, an invented nonexistent policy) costs far more than "stiff speech." The two ends of the same knob are two occupational temperaments.</>,
      },
    ],
  },
}

function SamplerDemo({ c }) {
  const [temp, setTemp] = useState(1)
  const [mode, setMode] = useState('none')
  const [slot, setSlot] = useState(c.slotInit)
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
    setSlot(c.tok(TOKENS[idx]))
    setHistory((h) => [...h, c.tok(TOKENS[idx])].slice(-24))
  }
  function clearAll() { setHistory([]); setSlot(c.slotInit); setPicked(-1) }

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.demoTitle}</span>
        <span className="demo-hint">{c.demoHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="ts-svg" viewBox="0 0 460 292" width="440" aria-label={c.svgAria}>
            <text x="26" y="22" fontSize="12" fill="var(--fg-2)">{c.svgCaption}</text>
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
                  <text className="tok" x={cx} y="268" textAnchor="middle" fontSize="13" fill="var(--fg-0)">{c.tok(t)}</text>
                </g>
              )
            })}
          </svg>
        </div>
        <div className="demo-side">
          <SliderRow label="temperature" min={0.1} max={2} step={0.05} value={temp} onChange={setTemp} format={(v) => v.toFixed(2)} />
          <div className="chips">
            {c.chips.map(([k, label]) => (
              <button key={k} className={`chip${k === mode ? ' active' : ''}`} onClick={() => setMode(k)}>{label}</button>
            ))}
          </div>
          <p>{c.tempText(temp)}<br />{c.cutText(keep, mode)}</p>
          <div className="ts-sentence">{c.sentence(slot)}</div>
          <div className="ts-actions">
            <button className="chip ts-primary" onClick={sample}>{c.sampleBtn}</button>
            <button className="chip" onClick={clearAll}>{c.clearBtn}</button>
          </div>
          <div className="ts-history">
            {history.map((w, i) => <Pill key={i} type={i === history.length - 1 ? 'amber' : 'ink'}>{w}</Pill>)}
          </div>
          <p className="ts-note">{c.note}</p>
        </div>
      </div>
    </div>
  )
}

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

export default function L14() {
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
        <p className="lead mt14">{c.scenarioLead}</p>
        <div className="example">
          <div className="en">{c.exampleEn1}</div>
          <div className="zh">{c.exampleZh1}</div>
        </div>
        <p className="lead mt14">{c.linkLead}</p>
        <div className="card">
          <table className="match">
            <thead><tr><th>{c.matchTh1[0]}</th><th>{c.matchTh1[1]}</th></tr></thead>
            <tbody>
              {c.matchRows1.map((row, i) => (
                <tr key={i}><td>{row[0]}</td><td className="ex">{row[1]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="lead mt14">{c.nextLead}</p>
      </Lsec>

      <Lsec title={c.tempTitle} lead={c.tempLead}>
        <div className="example">
          <div className="en">{c.formulaEn}</div>
          <div className="zh">{c.formulaZh}</div>
        </div>
        <p className="lead mt14">{c.softmaxPara}</p>
        <div className="use-grid">
          {c.tempCards.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.en}</div><div className="zh">{u.zh}</div></div>
          ))}
        </div>
        <p className="lead mt14">{c.whyKnobPara}</p>
        <p className="lead">{c.rewriteLead}</p>
        <div className="card">
          <table className="match">
            <thead><tr><th>{c.tempTableTh[0]}</th><th>{c.tempTableTh[1]}</th><th>{c.tempTableTh[2]}</th><th>{c.tempTableTh[3]}</th></tr></thead>
            <tbody>
              {c.tempTableRows.map((row, i) => (
                <tr key={i}><td className="be">{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td className="ex">{row[3]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="lead mt14">{c.boundaryPara}</p>
      </Lsec>

      <Lsec title={c.cutTitle} lead={c.cutLead}>
        <div className="example">
          <div className="en">{c.cutExEn}</div>
          <div className="zh">{c.cutExZh}</div>
        </div>
        <p className="lead mt14">{c.cutIdeaLead}</p>
        <div className="use-grid cols-2">
          {c.cutCards.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.en}</div><div className="zh">{u.zh}</div></div>
          ))}
        </div>
        <p className="lead mt14">{c.cutCompareLead}</p>
        <div className="card">
          <table className="match">
            <thead><tr><th>{c.cutTableTh[0]}</th><th>{c.cutTableTh[1]}</th><th>{c.cutTableTh[2]}</th></tr></thead>
            <tbody>
              {c.cutTableRows.map((row, i) => (
                <tr key={i}><td className="be">{row[0]}</td><td className="ex">{row[1]}</td><td className="ex">{row[2]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="lead mt14">{c.pipelinePara}</p>
        <p className="lead">{c.limitPara}</p>
        <p className="footnote source-note">{c.cutSourceNote}</p>
      </Lsec>

      <Lsec title={c.demoSecTitle} lead={c.demoSecLead}>
        <SamplerDemo c={c} />
      </Lsec>

      <Lsec title={c.practiceTitle} lead={c.practiceLead}>
        <div className="use-grid">
          {c.practiceCards.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.en}</div><div className="zh">{u.zh}</div></div>
          ))}
        </div>
        <p className="footnote mt14">{c.practiceFootnote}</p>
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
