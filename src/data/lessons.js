// ============================================================
// AI 通识 · 课程数据层（中英双语）
// 6 阶段 × 30 课的目录元数据。首页、课程页、上下课导航均由此驱动。
// 文本字段为 { zh, en }；消费端用 i18n/pick.js 的 pick(field, lang) 取值。
// tags 用语义色药丸；dots 为难度（1-3）；ready=true 表示已迁移到 React 组件。
// ============================================================

export const stages = [
  {
    num: { zh: '第一阶段', en: 'Stage 1' },
    title: { zh: '直觉篇 · AI 到底是什么', en: 'Intuition · What AI Really Is' },
    count: 5,
    goal: {
      zh: '目标：不写一行代码、不碰一个公式，建立对 AI 的正确直觉 —— 知道它是什么、不是什么、靠什么变聪明。',
      en: 'Goal: without writing a line of code or touching a single formula, build the right intuition for AI — what it is, what it isn’t, and how it gets smart.',
    },
  },
  {
    num: { zh: '第二阶段', en: 'Stage 2' },
    title: { zh: '原理篇 · 深度学习四大基石', en: 'Principles · The Four Pillars of Deep Learning' },
    count: 5,
    goal: {
      zh: '目标：看懂支撑现代 AI 的几个关键机制 —— 多层网络、卷积、向量、注意力，为理解大模型打好地基。',
      en: 'Goal: understand the key mechanisms behind modern AI — deep networks, convolution, vectors, and attention — laying the groundwork for large models.',
    },
  },
  {
    num: { zh: '第三阶段', en: 'Stage 3' },
    title: { zh: '大模型篇 · LLM 是怎么炼成的', en: 'Large Models · How an LLM Is Made' },
    count: 5,
    goal: {
      zh: '目标：完整看懂一个大语言模型的诞生全程 —— 从生数据到预训练，再到被调教成你熟悉的 ChatGPT。',
      en: 'Goal: follow the full birth of a large language model — from raw data to pretraining, and on to being shaped into the ChatGPT you know.',
    },
  },
  {
    num: { zh: '第四阶段', en: 'Stage 4' },
    title: { zh: '应用篇 · 把大模型用起来', en: 'Applications · Putting Large Models to Work' },
    count: 5,
    goal: {
      zh: '目标：掌握 LLM 应用层的完整技术栈 —— 从写好提示词，到给 AI 外挂知识库和工具，再到搭出智能体。',
      en: 'Goal: master the full LLM application stack — from writing good prompts, to giving AI external knowledge and tools, to building agents.',
    },
  },
  {
    num: { zh: '第五阶段', en: 'Stage 5' },
    title: { zh: '前沿篇 · 多模态与推理', en: 'Frontier · Multimodality & Reasoning' },
    count: 5,
    goal: {
      zh: '目标：跟上 AI 的最前沿 —— 图像生成、多模态、推理模型与工程生态，看懂今天新闻里的每一个热词。',
      en: 'Goal: keep up with AI’s cutting edge — image generation, multimodality, reasoning models, and the engineering ecosystem — so every buzzword in today’s news makes sense.',
    },
  },
  {
    num: { zh: '第六阶段', en: 'Stage 6' },
    title: { zh: '实战篇 · 亲手构建 AI 应用', en: 'Hands-On · Build AI Apps Yourself' },
    count: 5,
    goal: {
      zh: '目标：写真正的代码，把前 25 课的概念变成能跑起来的应用 —— 这是从学习者到构建者的最后一跃。',
      en: 'Goal: write real code and turn the concepts from the first 25 lessons into working apps — the final leap from learner to builder.',
    },
  },
]

// 语义色药丸快捷构造（text 双语）
const sky = { type: 'sky', text: { zh: '交互演示', en: 'Interactive' } }
const terra = { type: 'terracotta', text: { zh: '核心难点', en: 'Key challenge' } }
const amber = { type: 'amber', text: { zh: '易混淆', en: 'Easily confused' } }

// 难度等级双语
const lv = {
  intro: { zh: '入门', en: 'Intro' },
  basic: { zh: '基础', en: 'Basics' },
  adv: { zh: '进阶', en: 'Advanced' },
}

export const lessons = [
  // ---------- 第一阶段 · 直觉篇 ----------
  { id: 1, slug: '01-ai-ml-dl', stage: 0, level: lv.intro, dots: 1, tags: [sky], ready: true,
    title: { zh: 'AI、机器学习、深度学习：三个圈的关系', en: 'AI, Machine Learning, Deep Learning: Three Nested Circles' },
    desc: { zh: '人工智能 ⊃ 机器学习 ⊃ 深度学习。分清这三个套娃般的圈，是看懂一切 AI 新闻的第一步。', en: 'AI ⊃ machine learning ⊃ deep learning. Telling these nested circles apart is the first step to understanding any AI news.' } },
  { id: 2, slug: '02-how-machines-learn', stage: 0, level: lv.intro, dots: 1, tags: [], ready: true,
    title: { zh: '机器是怎么“学习”的：从写规则到喂数据', en: 'How Machines “Learn”: From Writing Rules to Feeding Data' },
    desc: { zh: '传统编程是“人写规则”，机器学习是“机器从数据里自己找规则”—— 这一个转变，造就了整个 AI 时代。', en: 'Traditional programming is “humans write the rules”; machine learning is “the machine finds the rules in data itself” — this single shift created the entire AI era.' } },
  { id: 3, slug: '03-a-single-neuron', stage: 0, level: lv.intro, dots: 2, tags: [sky], ready: true,
    title: { zh: '一个神经元的诞生：权重、偏置与激活', en: 'The Birth of a Neuron: Weights, Bias, and Activation' },
    desc: { zh: '神经网络的最小零件，其实只是一道“加权打分题”。亲手拖动权重滑块，看一个神经元如何做判断。', en: 'A neural network’s smallest part is really just a “weighted scoring problem.” Drag the weight sliders yourself and watch a single neuron make a decision.' } },
  { id: 4, slug: '04-gradient-descent', stage: 0, level: lv.basic, dots: 2, tags: [terra, sky], ready: true,
    title: { zh: '训练就是下山：损失函数与梯度下降', en: 'Training Is Going Downhill: Loss Functions & Gradient Descent' },
    desc: { zh: '把“猜错的程度”变成一座山，训练就是闭着眼摸索下山。在 3D 地形图上看懂 AI 如何一步步变聪明。', en: 'Turn “how wrong the guess is” into a mountain, and training is feeling your way downhill with eyes closed. Watch AI get smarter step by step on a 3D terrain map.' } },
  { id: 5, slug: '05-data-and-overfitting', stage: 0, level: lv.basic, dots: 2, tags: [amber], ready: true,
    title: { zh: '数据为王：训练集、测试集与过拟合', en: 'Data Is King: Training Sets, Test Sets & Overfitting' },
    desc: { zh: '为什么 AI 会“背答案”而不是“真学会”？过拟合是所有炼丹师的噩梦，也是理解 AI 局限的钥匙。', en: 'Why does AI “memorize answers” instead of “truly learning”? Overfitting is every practitioner’s nightmare — and the key to understanding AI’s limits.' } },

  // ---------- 第二阶段 · 原理篇 ----------
  { id: 6, slug: '06-deep-networks-backprop', stage: 1, level: lv.basic, dots: 2, tags: [], ready: true,
    title: { zh: '层层抽象：多层网络与反向传播', en: 'Layers of Abstraction: Deep Networks & Backpropagation' },
    desc: { zh: '一层神经元只会画直线，层数叠多了就能认出一只猫。反向传播：把错误一层层“追责”回去的艺术。', en: 'One layer of neurons can only draw straight lines; stack enough layers and it can recognize a cat. Backpropagation: the art of tracing blame for errors back layer by layer.' } },
  { id: 7, slug: '07-cnn-how-computers-see', stage: 1, level: lv.basic, dots: 2, tags: [sky], ready: true,
    title: { zh: '计算机如何“看”：卷积神经网络 CNN', en: 'How Computers “See”: Convolutional Neural Networks (CNN)' },
    desc: { zh: '一个 3×3 的小窗口在图片上滑动，就能找出边缘、纹理直至人脸。亲眼看卷积核扫描一张图。', en: 'A tiny 3×3 window sliding over an image can pick out edges, textures, even faces. Watch a convolution kernel scan a picture with your own eyes.' } },
  { id: 8, slug: '08-embeddings-vector-space', stage: 1, level: lv.adv, dots: 3, tags: [terra, sky], ready: true,
    title: { zh: '词变成数字：Embedding 与向量空间', en: 'Words Become Numbers: Embeddings & Vector Space' },
    desc: { zh: '国王 − 男人 + 女人 ≈ 女王。在 3D 星空里漫游词向量空间，理解 AI 眼中的“语义”长什么样。', en: 'King − man + woman ≈ queen. Roam a word-vector space in a 3D starfield and see what “meaning” looks like to an AI.' } },
  { id: 9, slug: '09-attention', stage: 1, level: lv.adv, dots: 3, tags: [terra], ready: true,
    title: { zh: '注意力机制：AI 学会“划重点”', en: 'Attention: AI Learns to “Highlight What Matters”' },
    desc: { zh: '理解 “bank” 时该看 “river” 还是 “money”？Attention 让每个词学会环顾四周 —— 大模型的心脏。', en: 'To understand “bank,” should it look at “river” or “money”? Attention lets every word look around — the heart of large models.' } },
  { id: 10, slug: '10-transformer', stage: 1, level: lv.adv, dots: 3, tags: [sky], ready: true,
    title: { zh: 'Transformer：改变一切的架构', en: 'Transformer: The Architecture That Changed Everything' },
    desc: { zh: '2017 年一篇论文《Attention Is All You Need》改写了 AI 史。逐层拆解这条“词语加工流水线”。', en: 'In 2017, the paper “Attention Is All You Need” rewrote AI history. Take apart this “word-processing assembly line” layer by layer.' } },

  // ---------- 第三阶段 · 大模型篇 ----------
  { id: 11, slug: '11-tokens', stage: 2, level: lv.basic, dots: 2, tags: [sky], ready: true,
    title: { zh: 'Token：大模型眼中的世界', en: 'Tokens: The World as a Large Model Sees It' },
    desc: { zh: '大模型不认识“字”，只认识 token。输入一句话，看它被切成什么样 —— 顺便搞懂为什么按 token 计费。', en: 'Large models don’t see “characters,” only tokens. Type a sentence and watch how it gets sliced — and find out why you’re billed by the token.' } },
  { id: 12, slug: '12-pretraining', stage: 2, level: lv.basic, dots: 2, tags: [], ready: true,
    title: { zh: '预训练：用整个互联网玩文字接龙', en: 'Pretraining: Playing Word-Chain with the Whole Internet' },
    desc: { zh: '“预测下一个词”这个朴素游戏，重复上万亿次后发生了什么？大模型九成的能力来自这一步。', en: 'What happens when the humble game of “predict the next word” is repeated trillions of times? Ninety percent of a large model’s ability comes from this step.' } },
  { id: 13, slug: '13-sft-rlhf', stage: 2, level: lv.adv, dots: 3, tags: [], ready: true,
    title: { zh: '从 GPT 到 ChatGPT：SFT 与 RLHF', en: 'From GPT to ChatGPT: SFT & RLHF' },
    desc: { zh: '预训练给了它知识，对齐给了它“人样”。监督微调 + 人类反馈强化学习，把接龙机器调教成助手。', en: 'Pretraining gave it knowledge; alignment gave it “manners.” Supervised fine-tuning plus reinforcement learning from human feedback turns a word-chain machine into an assistant.' } },
  { id: 14, slug: '14-temperature-sampling', stage: 2, level: lv.basic, dots: 2, tags: [amber, sky], ready: true,
    title: { zh: '温度与采样：AI 为什么每次回答不一样', en: 'Temperature & Sampling: Why AI Answers Differently Each Time' },
    desc: { zh: 'temperature 调到 0 和调到 2，分别会发生什么？亲手拧动旋钮，理解“严谨”与“创造”之间的权衡。', en: 'What happens at temperature 0 versus 2? Turn the knob yourself and understand the trade-off between “rigor” and “creativity.”' } },
  { id: 15, slug: '15-scaling-laws', stage: 2, level: lv.adv, dots: 2, tags: [sky], ready: true,
    title: { zh: 'Scaling Laws 与涌现：大力出奇迹', en: 'Scaling Laws & Emergence: Bigger Is Smarter' },
    desc: { zh: '参数 ×10、数据 ×10、算力 ×10，能力曲线如何变化？以及那些模型“突然学会”新本领的神秘瞬间。', en: '10× the parameters, 10× the data, 10× the compute — how does the capability curve change? And those mysterious moments when models “suddenly learn” new skills.' } },

  // ---------- 第四阶段 · 应用篇 ----------
  { id: 16, slug: '16-prompt-engineering', stage: 3, level: lv.basic, dots: 2, tags: [], ready: true,
    title: { zh: '提示工程：和 AI 对话的艺术', en: 'Prompt Engineering: The Art of Talking to AI' },
    desc: { zh: '角色设定、少样本示例、思维链……提示工程不是玄学话术，而是一套有原理可循的工程方法。', en: 'Role-setting, few-shot examples, chain-of-thought… prompt engineering isn’t mystical incantation but a principled engineering method.' } },
  { id: 17, slug: '17-context-window', stage: 3, level: lv.basic, dots: 2, tags: [amber], ready: true,
    title: { zh: '上下文窗口：AI 的工作记忆', en: 'The Context Window: AI’s Working Memory' },
    desc: { zh: '为什么聊久了 AI 会“失忆”？上下文是大模型唯一的记忆，理解它的边界是用好 AI 的前提。', en: 'Why does AI “lose its memory” in long chats? Context is a large model’s only memory — understanding its limits is the key to using AI well.' } },
  { id: 18, slug: '18-rag', stage: 3, level: lv.adv, dots: 3, tags: [terra, sky], ready: true,
    title: { zh: 'RAG：给 AI 外挂知识库', en: 'RAG: Bolting a Knowledge Base onto AI' },
    desc: { zh: '大模型不知道你公司的文档怎么办？切块 → 向量化 → 检索 → 注入上下文，动画演示完整流程。', en: 'What if a large model doesn’t know your company’s docs? Chunk → embed → retrieve → inject into context: see the full flow animated.' } },
  { id: 19, slug: '19-function-calling', stage: 3, level: lv.adv, dots: 2, tags: [], ready: true,
    title: { zh: 'Function Calling：AI 长出双手', en: 'Function Calling: AI Grows Hands' },
    desc: { zh: '让大模型学会查天气、订机票、跑代码 —— 工具调用是 AI 从“会说”到“会做”的关键跨越。', en: 'Teach a large model to check the weather, book flights, run code — tool calling is AI’s key leap from “talking” to “doing.”' } },
  { id: 20, slug: '20-agents', stage: 3, level: lv.adv, dots: 3, tags: [], ready: true,
    title: { zh: 'Agent 智能体：会自己干活的 AI', en: 'Agents: AI That Gets Work Done on Its Own' },
    desc: { zh: '感知 → 规划 → 行动 → 反思。当大模型装上循环和工具，它开始自主完成多步任务。', en: 'Perceive → plan → act → reflect. Once a large model gets a loop and tools, it begins to complete multi-step tasks on its own.' } },

  // ---------- 第五阶段 · 前沿篇 ----------
  { id: 21, slug: '21-diffusion-models', stage: 4, level: lv.adv, dots: 3, tags: [sky], ready: true,
    title: { zh: '文生图：扩散模型的去噪魔法', en: 'Text-to-Image: The Denoising Magic of Diffusion Models' },
    desc: { zh: '从一张纯噪点开始，一步步“擦”出一幅画。Stable Diffusion 与 Midjourney 背后的反直觉原理。', en: 'Starting from pure noise, “wipe” out a picture step by step. The counterintuitive principle behind Stable Diffusion and Midjourney.' } },
  { id: 22, slug: '22-multimodal', stage: 4, level: lv.adv, dots: 2, tags: [], ready: true,
    title: { zh: '多模态：AI 同时看懂图文音', en: 'Multimodality: AI Understands Images, Text & Audio at Once' },
    desc: { zh: '图片也能变成 token？看视觉编码器如何与语言模型“接驳”，让 AI 看图说话、听声辨意。', en: 'Can images become tokens too? See how a vision encoder “docks” with a language model, letting AI describe pictures and make sense of sound.' } },
  { id: 23, slug: '23-reasoning-models', stage: 4, level: lv.adv, dots: 2, tags: [], ready: true,
    title: { zh: '推理模型：思维链与慢思考', en: 'Reasoning Models: Chain-of-Thought & Slow Thinking' },
    desc: { zh: '从 o1 到 DeepSeek-R1：让模型先“打草稿”再回答 —— 用测试时算力换智力的新范式。', en: 'From o1 to DeepSeek-R1: let the model “draft” before answering — a new paradigm that trades test-time compute for intelligence.' } },
  { id: 24, slug: '24-mcp-ecosystem', stage: 4, level: lv.adv, dots: 2, tags: [], ready: true,
    title: { zh: 'MCP 与 AI 工程生态', en: 'MCP & the AI Engineering Ecosystem' },
    desc: { zh: 'Model Context Protocol：AI 应用的“USB 接口”。一张图看懂大模型周边的工程生态全景。', en: 'Model Context Protocol: the “USB port” of AI apps. One diagram to grasp the whole engineering ecosystem around large models.' } },
  { id: 25, slug: '25-open-vs-closed', stage: 4, level: lv.intro, dots: 1, tags: [], ready: true,
    title: { zh: '开源与闭源：大模型版图', en: 'Open vs. Closed: The Large-Model Landscape' },
    desc: { zh: 'GPT、Claude、Gemini、Llama、Qwen、DeepSeek……一张地图认清各家路线，学会按需选型。', en: 'GPT, Claude, Gemini, Llama, Qwen, DeepSeek… one map to make sense of each player’s approach and learn to choose what you need.' } },

  // ---------- 第六阶段 · 实战篇 ----------
  { id: 26, slug: '26-first-api-call', stage: 5, level: lv.basic, dots: 2, tags: [], ready: true,
    title: { zh: '第一次调用 API：30 行代码的聊天机器人', en: 'Your First API Call: A Chatbot in 30 Lines' },
    desc: { zh: '申请 key、发出第一个请求、读懂流式输出 —— 你和“AI 应用开发者”之间，只隔着 30 行代码。', en: 'Get a key, send your first request, read streaming output — only 30 lines of code stand between you and “AI app developer.”' } },
  { id: 27, slug: '27-local-llms', stage: 5, level: lv.basic, dots: 2, tags: [], ready: true,
    title: { zh: '本地跑大模型：Ollama 与量化', en: 'Running Models Locally: Ollama & Quantization' },
    desc: { zh: '不联网、不花钱，在自己电脑上跑开源大模型。顺便弄懂 7B、Q4 这些参数“黑话”是什么意思。', en: 'No internet, no cost — run open-source models on your own machine. And finally decode jargon like “7B” and “Q4.”' } },
  { id: 28, slug: '28-build-rag', stage: 5, level: lv.adv, dots: 3, tags: [], ready: true,
    title: { zh: '实战 RAG：搭建你的私人知识库', en: 'RAG in Practice: Build Your Own Knowledge Base' },
    desc: { zh: '把第 18 课的流程图变成真代码：读文档、建索引、做问答 —— 一个完整能用的 RAG 应用。', en: 'Turn Lesson 18’s flowchart into real code: read documents, build an index, answer questions — a complete, working RAG app.' } },
  { id: 29, slug: '29-evals-and-safety', stage: 5, level: lv.adv, dots: 2, tags: [], ready: true,
    title: { zh: '评估与安全：AI 的体检与红线', en: 'Evaluation & Safety: AI’s Checkup and Red Lines' },
    desc: { zh: '怎么知道模型变好了？幻觉、提示注入、越狱 —— 上线之前必须懂的评估方法与安全常识。', en: 'How do you know a model got better? Hallucination, prompt injection, jailbreaks — the evaluation methods and safety basics you must know before shipping.' } },
  { id: 30, slug: '30-learning-map', stage: 5, level: lv.intro, dots: 1, tags: [], ready: true,
    title: { zh: '终点亦起点：AI 进阶学习地图', en: 'The End Is a Beginning: A Map for Going Further' },
    desc: { zh: '论文怎么读、社区在哪里、方向怎么选 —— 把这门课变成你 AI 之旅的第一级台阶，而非终点。', en: 'How to read papers, where the communities are, how to choose a direction — make this course the first step of your AI journey, not the last.' } },
]

// 便捷查询
export const lessonBySlug = (slug) => lessons.find((l) => l.slug === slug)
export const lessonById = (id) => lessons.find((l) => l.id === id)
export const stageOf = (lesson) => stages[lesson.stage]
