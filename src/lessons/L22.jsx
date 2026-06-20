import { useState } from 'react'
import { Lsec, Pill, QuizItem } from '../components/ui.jsx'
import { useLang } from '../i18n/LangContext.jsx'

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// 双语内容层：结构 / class / SVG 几何 / 交互均不变，仅可见文本按语言取用。
// 富文本（含内联标签）直接以 JSX 片段存储，渲染输出与单语版逐字一致。
const C = {
  zh: {
    // ① 三路汇流演示数据
    mmData: {
      all: { title: '万物皆可 token 化', period: '三路汇流 · 注意力照常工作',
        desc: '三种输入各自经过自己的编码器，变成同规格的向量，排进同一条序列。从这一刻起，Transformer 不知道也不关心谁来自照片、谁来自键盘、谁来自麦克风 —— 第 9 课的注意力在它们之间照常计算：“天气”这个词可以直接注意到天空的 patch。', tags: ['第 9 课 · 注意力', '第 10 课 · Transformer', '第 11 课 · token'] },
      img: { title: '图像 → patch token', period: 'ViT 思想 · 切块再压缩',
        desc: '照片先缩放到固定尺寸，再切成一个个小方块（patch），每块压成一个向量。一张图通常折合几百个“图像 token”。注意：进入模型的不是像素，是这串向量 —— AI 看见的不是图，是几百个向量。', tags: ['patch 网格', '视觉编码器', '一图 ≈ 几百 token'] },
      txt: { title: '文本 → 文字 token', period: '第 11 课的老朋友',
        desc: '分词器把句子切成 token，再查嵌入表换成向量（第 8 课）。注意图中的切法：“是什 / 么天”—— token 边界不按词义走，这正是第 11 课讲过的怪现象，多模态时代它依然在。', tags: ['分词器', '嵌入表', '第 8 课 · 向量'] },
      aud: { title: '音频 → 音频 token', period: '波形切片 · 几十毫秒一段',
        desc: '声音是一条连续波形，按几十毫秒一段切片，每段编码成一个向量。音量、语速、语气、停顿都藏在这些向量里 —— 这是原生语音对话能“听出情绪”的物质基础。', tags: ['波形切片', '音频编码器', '语气随向量保留'] },
    },
    mmDemoTitle: '🎛️ 交互演示 · 图、文、音变成同一串 token',
    mmDemoHint: '点击三路输入或右侧按钮',
    mmAria: '三路汇流图：图像切 patch、文本切 token、音频切片，各自编码后排进同一条序列',
    colImg: '图像', colTxt: '文本', colAud: '音频',
    encImg: '视觉编码器 ViT', encTxt: '分词器 + 嵌入表', encAud: '音频编码器',
    txtBoxes: ['图里', '是什', '么天', '气？'],
    mergeNote: '排进同一条序列 —— 注意力在三种 token 之间来回看（第 9 课）',
    tfTitle: 'Transformer',
    tfSub: '不检查 token 的出身，注意力照常计算',
    outLabel: '输出：文字回答（逐 token 接龙，第 12 课）',
    outAnswer: '「刚下过雨的街口 —— 他还说“快到家了”。」',
    mmChips: [['all', '全部汇流'], ['img', '图像'], ['txt', '文本'], ['aud', '音频']],

    // ② 语音链路对比演示数据
    vpData: {
      a: { title: '三段式流水线（外挂拼接）', period: '听写员 → 笔杆子 → 播音员',
        desc: '三个独立模型接力：语音识别先把你的话听写成文字，LLM 只读文字稿想答案，再交给语音合成配音。每一棒都要等上一棒跑完，总延迟是三段相加；更糟的是第一棒只交“字”—— 你叹的那口气根本到不了模型耳朵里。这就是老一代语音助手永远慢半拍、永远播音腔的原因。', tags: ['延迟：三段相加', '语气：进门即丢', '传统语音助手路线'] },
      b: { title: '原生语音（端到端）', period: '语音 token 直进直出',
        desc: '你的声音切成音频 token 直接进模型，回答也以语音 token 直接“说”出来 —— 中间没有文字稿这一站。一句话记住差别：三段式听到的是你说了什么字，原生听到的是你怎么说这些字。所以它能察觉你在笑、能压低声音回你，还能在你插话时立刻停下。', tags: ['延迟：大幅下降', '语气：进出都保留', 'GPT-4o / Gemini 路线'] },
    },
    vpDemoTitle: '🎛️ 小实验 · 语音对话的两代链路',
    vpDemoHint: '点右侧按钮切换新旧方案',
    vpAria: '语音对话两代架构对比',
    vpChips: [['a', '① 三段式（老）'], ['b', '② 原生语音（新）']],
    // 三段式 SVG 文本
    vpaYou: '你的语音', vpa1: '① 听写成文字', vpa2: '② LLM 只读文字稿', vpa3: '③ 文字配音', vpaAi: 'AI 的语音',
    vpaLoss: '✗ 语气、笑声、停顿在这一步被丢掉',
    vpaLatency: '总延迟 = 三段相加：体感等一两秒才开口，说话时不能被打断',
    // 原生 SVG 文本
    vpbYou: '你的语音', vpbAi: 'AI 的语音',
    vpbCore: '原生多模态 LLM（同一个大脑）',
    vpbSub: '语音 token 直进 · 语音 token 直出',
    vpbGood: '✓ 听得出你在笑、在犹豫 —— 也能用语气和笑声回答',
    vpbLatency: '延迟大幅下降：即时接话、可随时打断（GPT-4o / Gemini Live 这一路线）',

    // 课程正文
    goalsTitle: '🎯 你将学会',
    goals: [
      '一句话说出全课心法：Transformer 不在乎 token 原来是什么 —— 图像切成 patch、音频切成片，都能和文字排进同一条序列（第 9、10、11 课在这里全部打通）',
      '完整走一遍“看图说话”的链路：照片 → 视觉编码器 → 一串图像 token → 与问题拼接 → 注意力 → 文字回答，并理解“AI 看见的不是图，是几百个向量”',
      '分清拼接式与原生多模态两代方案，一句话说清实时语音对话为什么不再走“听写 → 思考 → 配音”三段式',
      '能预判多模态的翻车点：数不清图里的 17 只鸟、读错图里的小字 —— 并知道这和第 11 课“数不清 strawberry 里的 r”是同一个病根',
    ],

    conceptTitle: '💡 核心概念：万物皆可 token 化',
    conceptLead: '前几课我们把 ChatGPT 的“读字”系统拆了个遍：第 11 课讲文字怎么切成 token，第 9、10 课讲注意力和 Transformer 怎么处理这串 token。现在问题来了：要让它看照片、听语音，是不是得另起炉灶，造一个全新的“视觉大脑”和“听觉大脑”？早年的研究者也这么以为。但答案出乎意料地省事。',
    contrast1Tag: '直觉印象',
    contrast1Big: <>看图、听音是全新的能力 <span className="gap">→</span> 得给 AI 装“眼睛”“耳朵”，再造一个新大脑</>,
    contrast1Note: '按这个理解，每多一种感官就要多一套系统，图文音三个大脑还得想办法互相“开会”。',
    contrast2Tag: '真实机制',
    contrast2Big: <>Transformer 只认 token，不问出身 <span className="gap">→</span> 把图和声音<span className="hl">变成 token</span>，原来的大脑照常工作</>,
    contrast2Note: '不造新大脑，只造新的“入场券打印机”：每种信号配一个编码器，把自己变成 token。',
    conceptP1: <>为什么行得通？回想第 11 课：文字进模型之前，先被切成 token、再换成向量。也就是说，<b>Transformer 真正吃进去的从来不是“字”，而是一串向量</b>。它从头到尾不检查向量的“出身”—— 这就是突破口：只要为每种信号发明一种合适的“切法”，万物皆可 token 化。三种切法摆在一起看：</>,
    useCards1: [
      { label: '文字 · 第 11 课复习', en: <>分词器<b>切词块</b></>, zh: '分词器把句子切成 token，再查嵌入表换成向量（第 8 课）。一句话 → 十几个 token。' },
      { label: '图像 · ViT 思想', en: <>切成<b>小方块 patch</b></>, zh: '把图切成棋盘般的小方块（patch，常见 16×16 像素），每块压成一个向量。一张图 → 几百个“图像 token”。' },
      { label: '音频 · 波形切片', en: <>按时间<b>切薄片</b></>, zh: '连续声波按几十毫秒一段切片，每段编码成一个向量。一秒钟语音 → 几十个“音频 token”。语气、停顿都藏在向量里。' },
    ],
    conceptP2: <>也可以不这么干 —— 给 LLM 外挂一个识图模型，先把图翻译成文字描述再喂进去（下一节细讲这条老路）。但“统一成 token”有一个无可替代的好处：<b>注意力可以跨模态直接计算</b>。你问“图里是什么天气”，“天气”这个文字 token 的注意力可以直接落在天空那几个 patch 上，中间不经过任何翻译。看一个真实风格的场景：</>,
    exampleEn: <>你发一张猫的照片问「它趴的键盘是什么牌子？」—— 回答精确提到了<span className="hl">键盘角落的 logo</span></>,
    exampleZh: <>外挂老方案大概率答不上：识图模型给的描述如果没提 logo，LLM 就永远不知道它存在。原生方案里，“键盘”“牌子”这些文字 token 的注意力直接扫过键盘区域的 patch —— <b>你的问题引导它的眼睛往哪看</b>。</>,
    conceptP3: <>这套机制的局限也埋在同一处：一张图要折成<b>几百个 token</b>，而 token 就是预算（第 17 课的“书桌”）—— 预算之外的细节会在压缩时被抹掉。这笔账先记下，误区一节算总账。下面先把“看图说话”的完整链路走一遍。</>,

    flowTitle: '📖 看图说话的完整链路：一张照片的旅程',
    flowLead: '场景：你在 ChatGPT / Claude 里上传一张猫的照片，问“这只猫是什么品种？”。从你按下发送到它开口，照片经历了五步：',
    flowSteps: [
      <><b>预处理切块。</b>照片先被缩放到模型规定的尺寸，再切成棋盘格 —— 几百个 patch。原图再高清，超出规定尺寸的像素这一步就没了。</>,
      <><b>视觉编码器（vision encoder）上场。</b>每个 patch 被压成一个向量。这一摞向量就是“图像 token”—— 规格和文字 token 完全相同，排在队伍里谁也认不出谁来自照片。</>,
      <><b>拼成一条序列。</b>【图像 token × 几百】＋【“这只猫是什么品种？”的文字 token × 几个】排成一队，整队送进 Transformer。<span className="footnote">对模型来说，这就是一段“长 prompt”—— 只是前几百个 token 碰巧来自照片。</span></>,
      <><b>注意力跨模态扫描。</b>生成回答时，“品种”相关的注意力大量落在猫脸、毛色花纹对应的 patch 上 —— 和第 9 课判断“它指代谁”的机制一模一样，只是对象从词换成了图块。</>,
      <><b>接龙输出文字。</b>“这是一只英国短毛猫……”逐 token 生成，第 12 课的老规矩。</>,
    ],
    flowP1: <>注意第 2 步那句话的分量：<b>AI 看见的不是图，是几百个向量。</b>它没有视网膜、没有“画面感”，照片在进门时就被压缩成了一串数字印象。这个事实能一口气解释你在产品里见过的一堆现象：</>,
    matchHead: ['你在 ChatGPT / Claude 里看到的现象', '背后的机制'],
    matchRows: [
      { p: <b>发几张图，回答明显变慢、额度掉得快</b>, ex: '一张图折合几百上千 token，注意力要算的对象暴增（第 9 课），计费也按 token 算（第 11 课）' },
      { p: <b>长对话里塞了很多截图后，它开始忘事</b>, ex: '图像 token 大口吃掉上下文窗口，早期内容被挤出“书桌”（第 17 课）' },
      { p: <b>把图裁剪放大再问，它突然答对了</b>, ex: '裁剪 = 把同样的 token 预算集中花在关键区域，每个 patch 变“高清”了' },
      { p: <b>同一张图，问不同问题得到不同侧重的描述</b>, ex: '注意力由问题文本引导，落在不同的 patch 上 —— 它不是“先看完再答”，是“边被问边看”' },
    ],
    flowP2: <>链路通了，下一个问题自然浮现：这条“图直接变 token”的路线，是怎么取代老办法的？两代方案的差别，正是 GPT-4o、Gemini 这一代模型的分水岭。</>,

    splitTitle: '📖 两代方案的分水岭：外挂翻译官，还是原生双语者',
    splitLead: '“把图变 token”听起来顺理成章，但业界绕了一段路才走到这里。早期的“能看图的 AI”，多数是拼接出来的：',
    splitC1Tag: '第一代 · 拼接式',
    splitC1Big: <>外挂识图模型，先把图 <span className="gap">→</span> 翻成一句文字描述，再喂给 LLM</>,
    splitC1Note: 'LLM 本体从没“见过”图。像隔着电话听朋友描述照片 —— 朋友没提的细节，你永远不知道。信息损失大，问深一点就露馅。',
    splitC2Tag: '第二代 · 原生多模态',
    splitC2Big: <>训练时图文就<span className="hl">混在一起学</span>，图直接变 token 进同一条序列</>,
    splitC2Note: 'GPT-4o、Gemini 这一路线。看图是“亲眼看”；而且输出端同样能接龙生成图像 token、语音 token —— 理解与生成打通。',
    splitP1: <>关键差别发生在<b>训练阶段</b>（第 12 课）：原生多模态在预训练时就把图文混排的数据喂给同一个模型 —— 它读网页时既读文字也“读”配图。于是“金毛”这个词的向量和金毛照片的 patch 向量，在同一个向量空间里靠在了一起（第 8 课的老地图，多了几个新大陆）。也正因为输出端同样是接龙生成 token，这类模型才能<b>反向生成</b>图像和语音 —— 看懂和画出，是同一套机制的两个方向。</>,
    splitP2: <>这个分水岭在<b>语音对话</b>上的体现最戏剧化。同样是“和 AI 打电话”，两代架构的体验天差地别 —— 切换下面两条流水线感受一下：</>,
    splitP3: <>一句话记住两者的差别：<b>三段式听到的是你说了什么字，原生听到的是你怎么说这些字 —— 延迟和语气，输在同一个地方。</b>链路和路线都清楚了，看四个已经落地的应用，每个都能用本课的机制一句话解释：</>,
    useCards2: [
      { label: '教育 · 拍照解题', en: <>题目照片<b>直接进序列</b></>, zh: '题目切成 patch，和“这道题怎么解”拼成一条序列 ——“解”的注意力直接落在算式 patch 上。手写太潦草 = patch 压缩后更模糊，先拍清楚再问，命中率高得多。' },
      { label: '医疗 · 影像辅助判读', en: <>影像与病历<b>同窗对照</b></>, zh: 'X 光 / CT 切成 patch，和病历文字排进同一个窗口互相印证。注意“辅助”二字：细粒度识别正是多模态的翻车区（见下节误区），结论必须由医生把关。' },
      { label: '视频 · 内容理解', en: <>视频 = <b>帧 + 音轨</b></>, zh: '视频被拆成抽样的图像帧（各自切 patch）加音频切片，全排进序列。这也解释了为什么长视频常常只能“抽着看”—— token 预算装不下每一帧。' },
      { label: '语音 · 实时同声传译', en: <>语音 token <b>直进直出</b></>, zh: '听中文语音 token，直接接龙吐出英文语音 token，不经文字稿中转。延迟低到能跟上对话节奏，还能保留说话人的语气起伏。' },
    ],

    splitSourceNote: (
      <>
        “把图切成 patch、当 token 喂进 Transformer”出自 Vision Transformer，Dosovitskiy 等 2021{' '}
        <a href="https://arxiv.org/abs/2010.11929" target="_blank" rel="noreferrer">
          An Image is Worth 16x16 Words
        </a>
        ；让图文共享同一个语义空间的奠基工作是 OpenAI 的 CLIP，Radford 等 2021{' '}
        <a href="https://arxiv.org/abs/2103.00020" target="_blank" rel="noreferrer">
          Learning Transferable Visual Models From Natural Language Supervision
        </a>
        。
      </>
    ),
    bridgeTitle: '➡️ 下一课怎么接上',
    bridgeLead: '到这里，AI 已经能看、能听、能说。但无论文字还是图像，它给答案的方式始终是第 12 课那台“逐 token 接龙”的机器——张口就答，不打草稿。遇到多步数学、复杂推理，这种“想都不想就说”的习惯就会翻车（第 15 课的走钢丝效应）。下一课讲推理模型：让模型在回答前先“想一长串”，用回答时多花的算力换取更高的智力——从 o1 到 DeepSeek-R1 的新范式。',
    bridgeSteps: ['AI 已能看、听、说', '但仍是张口就答', '多步推理容易翻车', '下一课：推理模型'],
    demoTitle: '🎛️ 交互演示：三路汇流，万物归 token',
    demoLead: '把全课压成一张图。一次提问里同时有照片、打字的问题、一段语音留言 —— 看它们如何各自 token 化、汇成同一条序列、流过同一个 Transformer。点击图中任意一路（或右侧按钮），看该模态是怎么变成 token 的。',

    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      {
        bad: 'AI 像人一样“看见”了我的照片',
        good: '它“看见”的是几百个 patch 压成的向量序列 —— 分辨率和细节受 token 预算的硬限制',
        why: <><b>病因：</b>把“能描述照片”等同于“拥有视觉”。照片在进门时就被缩放、切块、压缩成向量，预算之外的细节（角落的小字、远处的人脸）根本没进过它的“脑子”。所以“它怎么没看到水印上的字”不是态度问题，是 token 预算问题 —— 把关键区域裁剪放大再发，往往立竿见影。</>,
      },
      {
        bad: '它能看懂图，那数清图里 17 只鸟肯定不在话下',
        good: '细粒度计数和小字 OCR 是多模态最常见的翻车点 —— 和第 11 课“数不清 strawberry 里的 r”同一个病根',
        why: <><b>病因：</b>计数需要逐个、精确、不重不漏地对齐每只鸟，而模型拿到的是整体压缩后的向量印象 —— 挤在一起的几只鸟可能被压进同一个 patch，就像文字模型看不见字母只看见 token。它擅长“整体是什么、大概什么关系”，不擅长“精确到第几个像素、第几只”。要紧的数数和读小字任务，放大裁剪分块问，或交给专门工具核对。</>,
      },
    ],

    quizTitle: '✍️ 小练习',
    quiz: [
      {
        q: '1. 朋友说：“多模态模型能看图，原理是先把图片自动转成一段文字描述，再把描述交给语言模型。” 这句话哪里过时了？',
        a: <>他描述的是<b>第一代拼接式</b>方案。原生多模态（GPT-4o / Gemini 路线）里，图片切成 patch 后<b>直接变成 token 排进序列</b>，不经过“文字描述”这个信息瓶颈 —— 所以问“键盘上的 logo 是什么牌子”这类描述里不会出现的细节，它也答得上。</>,
      },
      {
        q: '2. 一张图常折合几百上千个 token。用第 17 课“书桌”的比喻解释：为什么往对话里连发 30 张截图后，模型开始忘记你最早提的要求，回答还变慢、变贵？',
        a: <>图像 token 和文字 token 同住一张“书桌”（上下文窗口）。30 张截图 = 几万个图像 token，<b>把最早的对话挤出窗外</b>（忘事）；窗内 token 越多，注意力要计算的对象越多（变慢）；API 按 token 计费且每轮重发历史（变贵）。三件事是同一笔账。</>,
      },
      {
        q: '3. 语音助手 A：你说完要等两秒它才开口，回答永远是标准播音腔；语音助手 B：几乎即时接话，你压低声音说悄悄话，它也跟着小声回。判断两者的架构，并说出 B 能“跟着小声”的物质基础。',
        a: <>A 是<b>三段式</b>（听写 → 文字思考 → 配音）：延迟三段相加，模型只见过文字稿，语气进门即丢。B 是<b>原生语音</b>：语音 token 直进直出。物质基础在于<b>音频切片向量里保留了音量、语速、语气等信息</b>，模型“听”得到你在小声说话，输出端又直接生成语音 token，所以能用同样的方式回应。</>,
      },
    ],
  },

  en: {
    // ① Three-stream merge demo data
    mmData: {
      all: { title: 'Anything can be tokenized', period: 'Three streams merge · attention works as usual',
        desc: 'Each of the three inputs passes through its own encoder, becomes vectors of the same spec, and lines up in one sequence. From this moment on, the Transformer neither knows nor cares which token came from the photo, the keyboard, or the microphone — the attention from Lesson 9 keeps computing across them: the word “weather” can attend directly to the sky patches.', tags: ['Lesson 9 · Attention', 'Lesson 10 · Transformer', 'Lesson 11 · token'] },
      img: { title: 'Image → patch token', period: 'The ViT idea · slice then compress',
        desc: 'The photo is first scaled to a fixed size, then sliced into little squares (patches), each compressed into one vector. One image usually amounts to a few hundred “image tokens.” Note: what enters the model is not pixels but this string of vectors — what the AI sees is not a picture, but a few hundred vectors.', tags: ['Patch grid', 'Vision encoder', 'One image ≈ hundreds of tokens'] },
      txt: { title: 'Text → text token', period: 'An old friend from Lesson 11',
        desc: 'The tokenizer slices the sentence into tokens, then looks them up in the embedding table to get vectors (Lesson 8). Notice how the figure slices it: “是什 / 么天” — token boundaries don’t follow meaning, exactly the oddity discussed in Lesson 11, and it’s still here in the multimodal era.', tags: ['Tokenizer', 'Embedding table', 'Lesson 8 · vectors'] },
      aud: { title: 'Audio → audio token', period: 'Waveform slices · tens of milliseconds each',
        desc: 'Sound is a continuous waveform, sliced into segments of a few tens of milliseconds, each encoded into one vector. Volume, pace, tone, and pauses are all hidden in these vectors — this is the physical basis for native voice chat being able to “hear emotion.”', tags: ['Waveform slices', 'Audio encoder', 'Tone preserved in the vectors'] },
    },
    mmDemoTitle: '🎛️ Interactive · image, text, and audio become one string of tokens',
    mmDemoHint: 'Click an input stream or a button on the right',
    mmAria: 'Three-stream merge diagram: image sliced into patches, text into tokens, audio into slices — each encoded then lined up in one sequence',
    colImg: 'Image', colTxt: 'Text', colAud: 'Audio',
    encImg: 'Vision encoder ViT', encTxt: 'Tokenizer + embedding table', encAud: 'Audio encoder',
    txtBoxes: ['图里', '是什', '么天', '气？'],
    mergeNote: 'Lined up in one sequence — attention looks back and forth across the three kinds of token (Lesson 9)',
    tfTitle: 'Transformer',
    tfSub: 'Doesn’t check a token’s origin; attention computes as usual',
    outLabel: 'Output: a text answer (token by token, Lesson 12)',
    outAnswer: '“A street corner after fresh rain — and he added, ‘almost home.’”',
    mmChips: [['all', 'All merge'], ['img', 'Image'], ['txt', 'Text'], ['aud', 'Audio']],

    // ② Voice pipeline comparison demo data
    vpData: {
      a: { title: 'Three-stage pipeline (bolted-together)', period: 'Transcriber → writer → announcer',
        desc: 'Three separate models in a relay: speech recognition first transcribes your words into text, the LLM reads only the transcript to think up an answer, then text-to-speech voices it. Each leg must wait for the previous one to finish, so total latency is the three stages summed; worse, the first leg passes only “words” — the sigh you let out never reaches the model’s ears. This is why old-generation voice assistants are always a beat behind and always sound like a news anchor.', tags: ['Latency: three stages summed', 'Tone: dropped at the door', 'The classic voice-assistant route'] },
      b: { title: 'Native voice (end-to-end)', period: 'Voice tokens straight in, straight out',
        desc: 'Your voice is sliced into audio tokens that go straight into the model, and the answer is “spoken” straight out as voice tokens too — with no transcript stop in between. Remember the difference in one line: the three-stage pipeline hears what words you said, while native voice hears how you said those words. So it can notice you laughing, can lower its voice to answer you, and can stop the instant you cut in.', tags: ['Latency: sharply lower', 'Tone: kept on the way in and out', 'The GPT-4o / Gemini route'] },
    },
    vpDemoTitle: '🎛️ Mini-experiment · two generations of voice-chat pipelines',
    vpDemoHint: 'Click a button on the right to switch old vs. new',
    vpAria: 'Comparison of two generations of voice-chat architecture',
    vpChips: [['a', '① Three-stage (old)'], ['b', '② Native voice (new)']],
    // Three-stage SVG text
    vpaYou: 'Your voice', vpa1: '① Transcribe to text', vpa2: '② LLM reads only the transcript', vpa3: '③ Voice the text', vpaAi: 'AI’s voice',
    vpaLoss: '✗ Tone, laughter, and pauses are dropped at this step',
    vpaLatency: 'Total latency = three stages summed: it feels like a second or two before it speaks, and you can’t interrupt while it talks',
    // Native SVG text
    vpbYou: 'Your voice', vpbAi: 'AI’s voice',
    vpbCore: 'Native multimodal LLM (one and the same brain)',
    vpbSub: 'Voice tokens straight in · voice tokens straight out',
    vpbGood: '✓ Hears you laugh or hesitate — and can answer with tone and laughter too',
    vpbLatency: 'Latency drops sharply: instant replies, interruptible anytime (the GPT-4o / Gemini Live route)',

    // Lesson body
    goalsTitle: '🎯 What You’ll Learn',
    goals: [
      'State the whole lesson’s core idea in one sentence: the Transformer doesn’t care what a token originally was — an image sliced into patches, audio sliced into segments, both can line up with text in one sequence (Lessons 9, 10, and 11 all connect here)',
      'Walk through the full “describe-a-picture” pipeline: photo → vision encoder → a string of image tokens → concatenated with the question → attention → a text answer, and understand that “what the AI sees is not a picture, but a few hundred vectors”',
      'Tell apart the two generations — bolted-together vs. native multimodal — and explain in one sentence why real-time voice chat no longer goes through the “transcribe → think → voice” three-stage route',
      'Anticipate where multimodal trips up: miscounting the 17 birds in an image, misreading fine print — and know it shares the same root cause as Lesson 11’s “can’t count the r’s in strawberry”',
    ],

    conceptTitle: '💡 Core Idea: Anything Can Be Tokenized',
    conceptLead: 'Over the past few lessons we took apart ChatGPT’s “word-reading” system piece by piece: Lesson 11 covered how text is sliced into tokens, and Lessons 9 and 10 covered how attention and the Transformer process that string of tokens. Now the question arises: to make it see photos and hear voices, do we have to start over and build a brand-new “vision brain” and “hearing brain”? Early researchers thought so too. But the answer turns out to be surprisingly economical.',
    contrast1Tag: 'Gut impression',
    contrast1Big: <>Seeing and hearing are brand-new abilities <span className="gap">→</span> we must give the AI “eyes” and “ears,” and build a new brain</>,
    contrast1Note: 'By this view, every extra sense needs another whole system, and the three brains for image, text, and audio still have to figure out how to “meet” with one another.',
    contrast2Tag: 'How it actually works',
    contrast2Big: <>The Transformer only recognizes tokens, never asking where they came from <span className="gap">→</span> turn images and sound <span className="hl">into tokens</span>, and the original brain works as usual</>,
    contrast2Note: 'No new brain — just a new “ticket printer”: each kind of signal gets an encoder that turns it into tokens.',
    conceptP1: <>Why does this work? Recall Lesson 11: before text enters the model, it’s first sliced into tokens and then turned into vectors. In other words, <b>what the Transformer truly takes in was never “words,” but a string of vectors</b>. It never checks a vector’s “origin” from start to finish — and that’s the breakthrough: as long as we invent a suitable “way to slice” each kind of signal, anything can be tokenized. Put the three slicing methods side by side:</>,
    useCards1: [
      { label: 'Text · Lesson 11 recap', en: <>Tokenizer <b>slices word chunks</b></>, zh: 'The tokenizer slices the sentence into tokens, then looks them up in the embedding table to get vectors (Lesson 8). One sentence → a dozen-odd tokens.' },
      { label: 'Image · the ViT idea', en: <>Slice into <b>little square patches</b></>, zh: 'Slice the image into chessboard-like little squares (patches, commonly 16×16 pixels), each compressed into one vector. One image → a few hundred “image tokens.”' },
      { label: 'Audio · waveform slices', en: <>Slice into <b>thin time slivers</b></>, zh: 'A continuous sound wave is sliced into segments of a few tens of milliseconds, each encoded into one vector. One second of speech → tens of “audio tokens.” Tone and pauses are all hidden in the vectors.' },
    ],
    conceptP2: <>You could also do it differently — bolt an image-recognition model onto the LLM, first translating the image into a text description and feeding that in (the next section covers this old path in detail). But “unifying into tokens” has one irreplaceable benefit: <b>attention can compute directly across modalities</b>. You ask “what’s the weather in the picture,” and the attention of the text token “weather” can land directly on those few sky patches, with no translation in between. Look at a real-world-style scenario:</>,
    exampleEn: <>You send a photo of a cat and ask “what brand is the keyboard it’s lying on?” — and the answer precisely mentions <span className="hl">the logo in the corner of the keyboard</span></>,
    exampleZh: <>The old bolted-on approach most likely can’t answer: if the image model’s description didn’t mention the logo, the LLM never knows it exists. In the native approach, the attention of text tokens like “keyboard” and “brand” sweeps directly over the patches of the keyboard region — <b>your question guides where its eyes look</b>.</>,
    conceptP3: <>The limit of this mechanism is buried in the very same place: one image folds into <b>a few hundred tokens</b>, and tokens are the budget (the “desk” from Lesson 17) — details beyond the budget get wiped out during compression. Note this on the tab for now; the Misconceptions section settles the bill. First, let’s walk through the full “describe-a-picture” pipeline.</>,

    flowTitle: '📖 The Full Describe-a-Picture Pipeline: a Photo’s Journey',
    flowLead: 'Scenario: in ChatGPT / Claude you upload a photo of a cat and ask “what breed is this cat?” From the moment you hit send to when it speaks, the photo goes through five steps:',
    flowSteps: [
      <><b>Preprocess and slice.</b> The photo is first scaled to the size the model requires, then sliced into a grid — a few hundred patches. However high-res the original, pixels beyond the required size are gone at this step.</>,
      <><b>The vision encoder steps in.</b> Each patch is compressed into a vector. This stack of vectors is the “image tokens” — same spec as text tokens, and once they’re in line, no one can tell which came from the photo.</>,
      <><b>Assemble into one sequence.</b> [image tokens × a few hundred] + [the text tokens for “what breed is this cat?” × a few] line up in one queue, and the whole queue goes into the Transformer. <span className="footnote">To the model, this is just one “long prompt” — only the first few hundred tokens happen to come from the photo.</span></>,
      <><b>Attention scans across modalities.</b> While generating the answer, the attention related to “breed” lands heavily on the patches for the cat’s face and coat pattern — exactly the same mechanism as judging “who does ‘it’ refer to” in Lesson 9, except the object switches from words to image blocks.</>,
      <><b>Generate text token by token.</b> “This is a British Shorthair…” is produced token by token, the same old rule from Lesson 12.</>,
    ],
    flowP1: <>Note the weight of that sentence in step 2: <b>what the AI sees is not a picture, but a few hundred vectors.</b> It has no retina, no “mental image”; the photo is compressed into a string of numeric impressions the moment it enters. This single fact explains in one breath a whole pile of phenomena you’ve seen in the products:</>,
    matchHead: ['What you see in ChatGPT / Claude', 'The mechanism behind it'],
    matchRows: [
      { p: <b>Send a few images and the answer slows down noticeably, the quota drops fast</b>, ex: 'One image amounts to hundreds or thousands of tokens; the objects attention must compute explode (Lesson 9), and billing is by token too (Lesson 11)' },
      { p: <b>After stuffing lots of screenshots into a long chat, it starts forgetting things</b>, ex: 'Image tokens gulp down the context window, and earlier content is squeezed off the “desk” (Lesson 17)' },
      { p: <b>You crop and zoom the image then ask again, and suddenly it gets it right</b>, ex: 'Cropping = spending the same token budget concentrated on the key region, so every patch becomes “higher-res”' },
      { p: <b>The same image, different questions, get descriptions with different emphases</b>, ex: 'Attention is guided by the question text and lands on different patches — it doesn’t “look fully then answer,” it “looks as it’s asked”' },
    ],
    flowP2: <>The pipeline is clear, and the next question naturally surfaces: how did this “image straight into tokens” route replace the old way? The difference between the two generations is exactly the watershed of the GPT-4o, Gemini generation of models.</>,

    splitTitle: '📖 The Watershed Between Two Generations: Bolted-On Translator, or Native Bilingual',
    splitLead: '“Turn images into tokens” sounds natural enough, but the industry took a detour to get here. Early “AI that could see images” was mostly bolted together:',
    splitC1Tag: 'Generation 1 · bolted-together',
    splitC1Big: <>Bolt on an image-recognition model that first turns the image <span className="gap">→</span> into a sentence of text description, then feeds it to the LLM</>,
    splitC1Note: 'The LLM itself never “saw” the image. It’s like hearing a friend describe a photo over the phone — details the friend didn’t mention, you’ll never know. Heavy information loss; press a bit deeper and it falls apart.',
    splitC2Tag: 'Generation 2 · native multimodal',
    splitC2Big: <>During training, image and text are <span className="hl">learned mixed together</span>, and the image turns straight into tokens in one sequence</>,
    splitC2Note: 'The GPT-4o, Gemini route. Seeing an image is “seeing it firsthand”; and the output side can likewise generate image tokens and voice tokens token by token — understanding and generation connect.',
    splitP1: <>The key difference happens at the <b>training stage</b> (Lesson 12): native multimodal feeds image-text-interleaved data to one and the same model during pretraining — when it reads a web page, it reads both the text and “reads” the accompanying images. So the vector for the word “golden retriever” and the patch vectors of a golden-retriever photo end up next to each other in the same vector space (the old map from Lesson 8, with a few new continents added). And precisely because the output side likewise generates tokens one by one, such models can <b>generate in reverse</b> — images and voice — for understanding and drawing are two directions of the same mechanism.</>,
    splitP2: <>This watershed shows up most dramatically in <b>voice chat</b>. Both are “making a phone call with the AI,” yet the experience of the two generations of architecture is worlds apart — switch between the two pipelines below to feel it:</>,
    splitP3: <>Remember the difference in one line: <b>the three-stage pipeline hears what words you said, native voice hears how you said those words — latency and tone lose at the very same place.</b> With the pipeline and the routes both clear, look at four applications already in the field, each explainable in one sentence with this lesson’s mechanism:</>,
    useCards2: [
      { label: 'Education · snap a photo to solve', en: <>The problem photo goes <b>straight into the sequence</b></>, zh: 'The problem is sliced into patches and lined up in one sequence with “how do I solve this” — the attention of “solve” lands directly on the patches of the equation. Too-sloppy handwriting = blurrier after the patch is compressed; snap a clearer shot before asking and the hit rate is much higher.' },
      { label: 'Medical · imaging-assisted reading', en: <>Imaging and records <b>compared in the same window</b></>, zh: 'An X-ray / CT is sliced into patches and lined up in the same window with the record text to cross-check. Note the word “assisted”: fine-grained recognition is exactly multimodal’s failure zone (see the next section’s Misconceptions), so the conclusion must be vetted by a doctor.' },
      { label: 'Video · content understanding', en: <>Video = <b>frames + audio track</b></>, zh: 'A video is broken into sampled image frames (each sliced into patches) plus audio slices, all lined up in the sequence. This also explains why a long video can often only be “sampled” — the token budget can’t hold every frame.' },
      { label: 'Voice · real-time interpretation', en: <>Voice tokens <b>straight in, straight out</b></>, zh: 'It hears Chinese voice tokens and directly generates English voice tokens in turn, without routing through a transcript. Latency is low enough to keep up with the rhythm of conversation, and it can preserve the speaker’s rise and fall of tone.' },
    ],

    splitSourceNote: (
      <>
        "Slice an image into patches and feed them to a Transformer as tokens" comes from the Vision Transformer, Dosovitskiy et al. 2021,{' '}
        <a href="https://arxiv.org/abs/2010.11929" target="_blank" rel="noreferrer">
          An Image is Worth 16x16 Words
        </a>
        ; the foundational work for sharing one semantic space across image and text is OpenAI's CLIP, Radford et al. 2021,{' '}
        <a href="https://arxiv.org/abs/2103.00020" target="_blank" rel="noreferrer">
          Learning Transferable Visual Models From Natural Language Supervision
        </a>
        .
      </>
    ),
    bridgeTitle: '➡️ How This Leads to Lesson 23',
    bridgeLead: 'By now AI can see, hear, and speak. But whether the input is text or images, the way it produces an answer is still Lesson 12\'s "token-by-token autocompletion" machine — it answers on the spot, no draft. For multi-step math or complex reasoning, this "speak before thinking" habit goes off the rails (Lesson 15\'s tightrope effect). The next lesson covers reasoning models: letting the model "think at length" before answering, trading more compute at answer time for more intelligence — the new paradigm from o1 to DeepSeek-R1.',
    bridgeSteps: ['AI can see, hear, speak', 'But still answers on the spot', 'Multi-step reasoning breaks down', 'Next: Reasoning Models'],
    demoTitle: '🎛️ Interactive: Three Streams Merge, Everything Becomes Tokens',
    demoLead: 'Compress the whole lesson into one diagram. A single query holds a photo, a typed question, and a voice message all at once — watch how they each get tokenized, merge into one sequence, and flow through the same Transformer. Click any stream in the figure (or a button on the right) to see how that modality becomes tokens.',

    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      {
        bad: 'The AI “saw” my photo the way a person does',
        good: 'What it “sees” is a vector sequence compressed from a few hundred patches — resolution and detail are hard-limited by the token budget',
        why: <><b>Cause:</b> equating “can describe a photo” with “has vision.” The photo is scaled, sliced, and compressed into vectors the moment it enters; details beyond the budget (fine print in a corner, a distant face) never made it into its “head.” So “how did it miss the text on the watermark” isn’t an attitude problem, it’s a token-budget problem — crop and zoom the key region before sending, and it often works instantly.</>,
      },
      {
        bad: 'It can understand images, so counting the 17 birds in one is surely no problem',
        good: 'Fine-grained counting and small-print OCR are multimodal’s most common failure points — the same root cause as Lesson 11’s “can’t count the r’s in strawberry”',
        why: <><b>Cause:</b> counting requires aligning each bird one by one, precisely, without missing or double-counting, whereas the model gets an overall, compressed vector impression — a few birds crammed together may be squeezed into the same patch, just as a text model can’t see letters, only tokens. It’s good at “what the whole thing is, roughly what the relationships are,” not “precise to which pixel, which one.” For counting and small-print reading that matter, zoom, crop, and ask in chunks, or hand it to a dedicated tool to verify.</>,
      },
    ],

    quizTitle: '✍️ Quick Quiz',
    quiz: [
      {
        q: '1. A friend says: “Multimodal models can see images by first automatically converting the picture into a text description, then handing the description to the language model.” What’s outdated about this?',
        a: <>What they describe is the <b>first-generation, bolted-together</b> approach. In native multimodal (the GPT-4o / Gemini route), once an image is sliced into patches it <b>turns straight into tokens and lines up in the sequence</b>, without going through the information bottleneck of a “text description” — which is why it can also answer details that would never appear in a description, like “what brand is the logo on the keyboard.”</>,
      },
      {
        q: '2. One image often amounts to hundreds or thousands of tokens. Using Lesson 17’s “desk” metaphor, explain: why, after sending 30 screenshots in a row into a chat, does the model start forgetting your earliest request, and answer more slowly and more expensively?',
        a: <>Image tokens and text tokens share one “desk” (the context window). 30 screenshots = tens of thousands of image tokens, <b>squeezing the earliest dialogue off the desk</b> (forgetting); the more tokens in the window, the more objects attention must compute (slower); and the API bills by token and resends the history each turn (more expensive). The three are one and the same bill.</>,
      },
      {
        q: '3. Voice assistant A: after you finish, it waits two seconds before speaking, and the answer always sounds like a standard news anchor; voice assistant B: it replies almost instantly, and when you lower your voice to whisper, it whispers back too. Identify each one’s architecture, and state the physical basis for B being able to “whisper along.”',
        a: <>A is <b>three-stage</b> (transcribe → think in text → voice): latency is the three stages summed, the model only ever saw the transcript, and tone is dropped at the door. B is <b>native voice</b>: voice tokens straight in, straight out. The physical basis is that <b>the audio-slice vectors retain information like volume, pace, and tone</b>, so the model can “hear” you speaking softly, and the output side directly generates voice tokens, letting it respond the same way.</>,
      },
    ],
  },
}

// ============================================================
// ① 三路汇流
// ============================================================
const IMG_PATCHES = [
  [57, 26, 'sky', 0.55], [71.5, 26, 'sky', 0.45], [86, 26, 'sky', 0.5], [100.5, 26, 'amber', 0.6],
  [57, 40.5, 'sky', 0.3], [71.5, 40.5, 'sky', 0.25], [86, 40.5, 'sage', 0.35], [100.5, 40.5, 'sky', 0.3],
  [57, 55, 'sage', 0.5], [71.5, 55, 'sage', 0.45], [86, 55, 'amber', 0.4], [100.5, 55, 'sage', 0.5],
  [57, 69.5, 'fg-2', 0.25], [71.5, 69.5, 'fg-2', 0.2], [86, 69.5, 'fg-2', 0.25], [100.5, 69.5, 'fg-2', 0.2],
]
const TXT_POS = [[171, 32], [233, 32], [171, 58], [233, 58]]
const AUD_BARS = [[350, 52, 8], [354, 49, 14], [358, 45, 22], [362, 41, 30], [366, 47, 18], [370, 51, 10], [374, 48, 16], [378, 43, 26], [382, 46, 20], [386, 50, 12], [390, 44, 24], [394, 49, 14], [398, 52, 8]]
const OUT_TOK = { img: [52.5, 69.5, 86.5, 103.5], txt: [197.5, 214.5, 231.5, 248.5], aud: [342.5, 359.5, 376.5, 393.5] }
const COL_FILL = { img: 'var(--sky)', txt: 'var(--amber)', aud: 'var(--sage)' }
const MERGED = { img: [135, 151, 167, 183], txt: [199, 215, 231, 247], aud: [263, 279, 295, 311] }

function MultimodalDemo({ c }) {
  const [key, setKey] = useState('all')
  const d = c.mmData[key]
  const dim = (k) => (key === 'all' || key === k ? '' : ' mm-dim')
  const lineCls = (k) => `mm-line mm-group${dim(k)}${key === k && key !== 'all' && !reduceMotion() ? ' flowing' : ''}`

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.mmDemoTitle}</span>
        <span className="demo-hint">{c.mmDemoHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="mm-svg" viewBox="0 0 460 398" width="430" aria-label={c.mmAria}>
            <defs>
              <marker id="mm-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
                <path d="M0 0 L8 4 L0 8 z" fill="var(--fg-2)" />
              </marker>
            </defs>
            {/* 图像列 */}
            <g className={`mm-col mm-group${dim('img')}`} onClick={() => setKey('img')}>
              <text x="85" y="14" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="var(--fg-0)">{c.colImg}</text>
              {IMG_PATCHES.map(([x, y, col, op], i) => <rect key={i} x={x} y={y} width="13" height="13" rx="2" fill={`var(--${col})`} fillOpacity={op} />)}
              <line x1="85" y1="90" x2="85" y2="100" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#mm-arr)" />
              <rect x="30" y="102" width="110" height="28" rx="6" fill="var(--bg-inset)" stroke="var(--hairline-strong)" />
              <text x="85" y="120" textAnchor="middle" fontSize="10.5" fill="var(--fg-0)">{c.encImg}</text>
              <line x1="85" y1="134" x2="85" y2="142" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#mm-arr)" />
              {OUT_TOK.img.map((x, i) => <rect key={i} x={x} y="146" width="14" height="14" rx="3" fill="var(--sky)" fillOpacity="0.85" />)}
              <rect x="23" y="2" width="124" height="160" fill="transparent" />
            </g>
            {/* 文本列 */}
            <g className={`mm-col mm-group${dim('txt')}`} onClick={() => setKey('txt')}>
              <text x="230" y="14" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="var(--fg-0)">{c.colTxt}</text>
              {TXT_POS.map(([x, y], i) => (
                <g key={i}>
                  <rect x={x} y={y} width="56" height="20" rx="5" fill="var(--bg-inset)" stroke="var(--hairline-strong)" />
                  <text x={x + 28} y={y + 13.5} textAnchor="middle" fontSize="10.5" fill="var(--fg-0)">{c.txtBoxes[i]}</text>
                </g>
              ))}
              <line x1="230" y1="90" x2="230" y2="100" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#mm-arr)" />
              <rect x="175" y="102" width="110" height="28" rx="6" fill="var(--bg-inset)" stroke="var(--hairline-strong)" />
              <text x="230" y="120" textAnchor="middle" fontSize="10.5" fill="var(--fg-0)">{c.encTxt}</text>
              <line x1="230" y1="134" x2="230" y2="142" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#mm-arr)" />
              {OUT_TOK.txt.map((x, i) => <rect key={i} x={x} y="146" width="14" height="14" rx="3" fill="var(--amber)" fillOpacity="0.85" />)}
              <rect x="168" y="2" width="124" height="160" fill="transparent" />
            </g>
            {/* 音频列 */}
            <g className={`mm-col mm-group${dim('aud')}`} onClick={() => setKey('aud')}>
              <text x="375" y="14" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="var(--fg-0)">{c.colAud}</text>
              <rect x="347" y="28" width="56" height="56" rx="4" fill="var(--bg-inset)" stroke="var(--hairline-strong)" />
              {AUD_BARS.map(([x, y, h], i) => <rect key={i} x={x} y={y} width="2.6" height={h} rx="1.3" fill="var(--sage)" fillOpacity="0.8" />)}
              {[361, 375, 389].map((x) => <line key={x} x1={x} y1="30" x2={x} y2="82" stroke="var(--fg-2)" strokeWidth="0.8" strokeDasharray="3 3" />)}
              <line x1="375" y1="90" x2="375" y2="100" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#mm-arr)" />
              <rect x="320" y="102" width="110" height="28" rx="6" fill="var(--bg-inset)" stroke="var(--hairline-strong)" />
              <text x="375" y="120" textAnchor="middle" fontSize="10.5" fill="var(--fg-0)">{c.encAud}</text>
              <line x1="375" y1="134" x2="375" y2="142" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#mm-arr)" />
              {OUT_TOK.aud.map((x, i) => <rect key={i} x={x} y="146" width="14" height="14" rx="3" fill="var(--sage)" fillOpacity="0.85" />)}
              <rect x="313" y="2" width="124" height="160" fill="transparent" />
            </g>
            {/* 汇流线 */}
            <path className={lineCls('img')} d="M85 164 C 85 182 166 176 166 192" stroke="var(--sky)" strokeWidth="1.6" />
            <path className={lineCls('txt')} d="M230 164 L230 192" stroke="var(--amber)" strokeWidth="1.6" />
            <path className={lineCls('aud')} d="M375 164 C 375 182 294 176 294 192" stroke="var(--sage)" strokeWidth="1.6" />
            {/* 合并序列 */}
            {['img', 'txt', 'aud'].flatMap((k) => MERGED[k].map((x, i) => (
              <rect key={k + i} className={`mm-mtok${dim(k)}`} x={x} y="198" width="14" height="14" rx="3" fill={COL_FILL[k]} fillOpacity="0.85" />
            )))}
            <path className="mm-att" d="M158 216 Q 190 238 222 216" fill="none" stroke="var(--terracotta)" strokeWidth="1.2" strokeDasharray="4 3" style={{ opacity: key === 'all' ? 1 : 0.15 }} />
            <path className="mm-att" d="M222 216 Q 254 238 286 216" fill="none" stroke="var(--terracotta)" strokeWidth="1.2" strokeDasharray="4 3" style={{ opacity: key === 'all' ? 1 : 0.15 }} />
            <text x="230" y="254" textAnchor="middle" fontSize="10.5" fill="var(--fg-2)">{c.mergeNote}</text>
            <line x1="230" y1="260" x2="230" y2="272" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#mm-arr)" />
            <rect x="110" y="276" width="240" height="44" rx="10" fill="var(--glass)" stroke="var(--hairline-strong)" />
            <text x="230" y="295" textAnchor="middle" fontSize="13.5" fontWeight="700" fill="var(--fg-0)">{c.tfTitle}</text>
            <text x="230" y="311" textAnchor="middle" fontSize="10" fill="var(--fg-1)">{c.tfSub}</text>
            <line x1="230" y1="326" x2="230" y2="338" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#mm-arr)" />
            <rect x="88" y="342" width="284" height="46" rx="10" fill="var(--bg-inset)" stroke="var(--hairline-strong)" />
            <text x="230" y="360" textAnchor="middle" fontSize="10" fill="var(--fg-2)">{c.outLabel}</text>
            <text x="230" y="377" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="var(--fg-0)">{c.outAnswer}</text>
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            {c.mmChips.map(([k, label]) => (
              <button key={k} className={`chip${k === key ? ' active' : ''}`} onClick={() => setKey(k)}>{label}</button>
            ))}
          </div>
          <h4>{d.title}</h4>
          <div className="period">{d.period}</div>
          <p>{d.desc}</p>
          <div className="tags">{d.tags.map((t) => <Pill key={t} type="ink">{t}</Pill>)}</div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ② 语音链路对比
// ============================================================
function VoiceDemo({ c }) {
  const [key, setKey] = useState('a')
  const d = c.vpData[key]
  return (
    <div className="card demo demo-slim">
      <div className="demo-head">
        <span className="demo-title">{c.vpDemoTitle}</span>
        <span className="demo-hint">{c.vpDemoHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="vp-svg" viewBox="0 0 440 112" width="430" aria-label={c.vpAria}>
            <defs>
              <marker id="vp-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
                <path d="M0 0 L8 4 L0 8 z" fill="var(--fg-2)" />
              </marker>
            </defs>
            {key === 'a' ? (
              <g>
                <rect className="vp-box" x="4" y="22" width="70" height="30" rx="7" />
                <text x="39" y="41" textAnchor="middle" fontSize="10" fill="var(--fg-0)">{c.vpaYou}</text>
                <line x1="74" y1="37" x2="83" y2="37" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#vp-arr)" />
                <rect className="vp-box" x="83" y="22" width="84" height="30" rx="7" />
                <text x="125" y="41" textAnchor="middle" fontSize="10" fill="var(--fg-0)">{c.vpa1}</text>
                <line x1="167" y1="37" x2="176" y2="37" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#vp-arr)" />
                <rect x="176" y="22" width="96" height="30" rx="7" fill="var(--amber-bg)" stroke="var(--amber)" />
                <text x="224" y="41" textAnchor="middle" fontSize="9.5" fill="var(--fg-0)">{c.vpa2}</text>
                <line x1="272" y1="37" x2="281" y2="37" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#vp-arr)" />
                <rect className="vp-box" x="281" y="22" width="84" height="30" rx="7" />
                <text x="323" y="41" textAnchor="middle" fontSize="10" fill="var(--fg-0)">{c.vpa3}</text>
                <line x1="365" y1="37" x2="374" y2="37" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#vp-arr)" />
                <rect className="vp-box" x="374" y="22" width="62" height="30" rx="7" />
                <text x="405" y="41" textAnchor="middle" fontSize="10" fill="var(--fg-0)">{c.vpaAi}</text>
                <text x="125" y="74" textAnchor="middle" fontSize="10" fill="var(--terracotta)">{c.vpaLoss}</text>
                <text x="220" y="96" textAnchor="middle" fontSize="10" fill="var(--fg-2)">{c.vpaLatency}</text>
              </g>
            ) : (
              <g>
                <rect className="vp-box" x="4" y="20" width="84" height="36" rx="7" />
                <text x="46" y="42" textAnchor="middle" fontSize="10" fill="var(--fg-0)">{c.vpbYou}</text>
                <line x1="88" y1="38" x2="112" y2="38" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#vp-arr)" />
                <rect x="114" y="20" width="212" height="36" rx="7" fill="var(--sage-bg)" stroke="var(--sage)" />
                <text x="220" y="35" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--fg-0)">{c.vpbCore}</text>
                <text x="220" y="49" textAnchor="middle" fontSize="9" fill="var(--fg-1)">{c.vpbSub}</text>
                <line x1="326" y1="38" x2="350" y2="38" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#vp-arr)" />
                <rect className="vp-box" x="352" y="20" width="84" height="36" rx="7" />
                <text x="394" y="42" textAnchor="middle" fontSize="10" fill="var(--fg-0)">{c.vpbAi}</text>
                <text x="220" y="76" textAnchor="middle" fontSize="10" fill="var(--sage)">{c.vpbGood}</text>
                <text x="220" y="98" textAnchor="middle" fontSize="10" fill="var(--fg-2)">{c.vpbLatency}</text>
              </g>
            )}
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            {c.vpChips.map(([k, label]) => (
              <button key={k} className={`chip${k === key ? ' active' : ''}`} onClick={() => setKey(k)}>{label}</button>
            ))}
          </div>
          <h4>{d.title}</h4>
          <div className="period">{d.period}</div>
          <p>{d.desc}</p>
          <div className="tags">{d.tags.map((t) => <Pill key={t} type="ink">{t}</Pill>)}</div>
        </div>
      </div>
    </div>
  )
}

export default function L22() {
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
            <div className="tag"><span className="pill pill-ink">{c.contrast1Tag}</span></div>
            <div className="big">{c.contrast1Big}</div>
            <p className="note">{c.contrast1Note}</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">{c.contrast2Tag}</span></div>
            <div className="big">{c.contrast2Big}</div>
            <p className="note">{c.contrast2Note}</p>
          </div>
        </div>
        <p className="lead mt14">{c.conceptP1}</p>
        <div className="use-grid">
          {c.useCards1.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.en}</div><div className="zh">{u.zh}</div></div>
          ))}
        </div>
        <p className="lead mt14">{c.conceptP2}</p>
        <div className="example">
          <div className="en">{c.exampleEn}</div>
          <div className="zh">{c.exampleZh}</div>
        </div>
        <p className="lead mt14">{c.conceptP3}</p>
      </Lsec>

      <Lsec title={c.flowTitle} lead={c.flowLead}>
        <div className="card flow-card">
          <div className="flow">
            {c.flowSteps.map((s, i) => (
              <div className="flow-step" key={i}><span className="num">{i + 1}</span><span className="txt">{s}</span></div>
            ))}
          </div>
        </div>
        <p className="lead mt14">{c.flowP1}</p>
        <div className="card">
          <table className="match">
            <thead><tr><th>{c.matchHead[0]}</th><th>{c.matchHead[1]}</th></tr></thead>
            <tbody>
              {c.matchRows.map((r, i) => (
                <tr key={i}><td>{r.p}</td><td className="ex">{r.ex}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="lead mt14">{c.flowP2}</p>
      </Lsec>

      <Lsec title={c.splitTitle} lead={c.splitLead}>
        <div className="contrast">
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-ink">{c.splitC1Tag}</span></div>
            <div className="big">{c.splitC1Big}</div>
            <p className="note">{c.splitC1Note}</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">{c.splitC2Tag}</span></div>
            <div className="big">{c.splitC2Big}</div>
            <p className="note">{c.splitC2Note}</p>
          </div>
        </div>
        <p className="lead mt14">{c.splitP1}</p>
        <p className="lead mt14">{c.splitP2}</p>
        <VoiceDemo c={c} />
        <p className="lead mt14">{c.splitP3}</p>
        <div className="use-grid cols-2">
          {c.useCards2.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.en}</div><div className="zh">{u.zh}</div></div>
          ))}
        </div>
        <p className="footnote source-note">{c.splitSourceNote}</p>
      </Lsec>

      <Lsec title={c.demoTitle} lead={c.demoLead}>
        <MultimodalDemo c={c} />
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
