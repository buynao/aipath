// ============================================================
// AI Path · AI 通识 — 课程数据层
// 6 阶段 × 30 课的目录元数据。首页、课程页、上下课导航均由此驱动。
// tags 用语义色药丸；dots 为难度（1-3）；ready=true 表示已迁移到 React 组件。
// ============================================================

export const stages = [
  {
    num: '第一阶段',
    title: '直觉篇 · AI 到底是什么',
    count: 5,
    goal: '目标：不写一行代码、不碰一个公式，建立对 AI 的正确直觉 —— 知道它是什么、不是什么、靠什么变聪明。',
  },
  {
    num: '第二阶段',
    title: '原理篇 · 深度学习四大基石',
    count: 5,
    goal: '目标：看懂支撑现代 AI 的几个关键机制 —— 多层网络、卷积、向量、注意力，为理解大模型打好地基。',
  },
  {
    num: '第三阶段',
    title: '大模型篇 · LLM 是怎么炼成的',
    count: 5,
    goal: '目标：完整看懂一个大语言模型的诞生全程 —— 从生数据到预训练，再到被调教成你熟悉的 ChatGPT。',
  },
  {
    num: '第四阶段',
    title: '应用篇 · 把大模型用起来',
    count: 5,
    goal: '目标：掌握 LLM 应用层的完整技术栈 —— 从写好提示词，到给 AI 外挂知识库和工具，再到搭出智能体。',
  },
  {
    num: '第五阶段',
    title: '前沿篇 · 多模态与推理',
    count: 5,
    goal: '目标：跟上 AI 的最前沿 —— 图像生成、多模态、推理模型与工程生态，看懂今天新闻里的每一个热词。',
  },
  {
    num: '第六阶段',
    title: '实战篇 · 亲手构建 AI 应用',
    count: 5,
    goal: '目标：写真正的代码，把前 25 课的概念变成能跑起来的应用 —— 这是从学习者到构建者的最后一跃。',
  },
]

// 语义色药丸快捷构造
const sky = { type: 'sky', text: '交互演示' }
const terra = { type: 'terracotta', text: '核心难点' }
const amber = { type: 'amber', text: '易混淆' }

export const lessons = [
  // ---------- 第一阶段 · 直觉篇 ----------
  { id: 1, slug: '01-ai-ml-dl', stage: 0, level: '入门', dots: 1, tags: [sky], ready: true,
    title: 'AI、机器学习、深度学习：三个圈的关系',
    desc: '人工智能 ⊃ 机器学习 ⊃ 深度学习。分清这三个套娃般的圈，是看懂一切 AI 新闻的第一步。' },
  { id: 2, slug: '02-how-machines-learn', stage: 0, level: '入门', dots: 1, tags: [], ready: true,
    title: '机器是怎么“学习”的：从写规则到喂数据',
    desc: '传统编程是“人写规则”，机器学习是“机器从数据里自己找规则”—— 这一个转变，造就了整个 AI 时代。' },
  { id: 3, slug: '03-a-single-neuron', stage: 0, level: '入门', dots: 2, tags: [sky], ready: true,
    title: '一个神经元的诞生：权重、偏置与激活',
    desc: '神经网络的最小零件，其实只是一道“加权打分题”。亲手拖动权重滑块，看一个神经元如何做判断。' },
  { id: 4, slug: '04-gradient-descent', stage: 0, level: '基础', dots: 2, tags: [terra, sky], ready: true,
    title: '训练就是下山：损失函数与梯度下降',
    desc: '把“猜错的程度”变成一座山，训练就是闭着眼摸索下山。在 3D 地形图上看懂 AI 如何一步步变聪明。' },
  { id: 5, slug: '05-data-and-overfitting', stage: 0, level: '基础', dots: 2, tags: [amber], ready: true,
    title: '数据为王：训练集、测试集与过拟合',
    desc: '为什么 AI 会“背答案”而不是“真学会”？过拟合是所有炼丹师的噩梦，也是理解 AI 局限的钥匙。' },

  // ---------- 第二阶段 · 原理篇 ----------
  { id: 6, slug: '06-deep-networks-backprop', stage: 1, level: '基础', dots: 2, tags: [], ready: true,
    title: '层层抽象：多层网络与反向传播',
    desc: '一层神经元只会画直线，层数叠多了就能认出一只猫。反向传播：把错误一层层“追责”回去的艺术。' },
  { id: 7, slug: '07-cnn-how-computers-see', stage: 1, level: '基础', dots: 2, tags: [sky], ready: true,
    title: '计算机如何“看”：卷积神经网络 CNN',
    desc: '一个 3×3 的小窗口在图片上滑动，就能找出边缘、纹理直至人脸。亲眼看卷积核扫描一张图。' },
  { id: 8, slug: '08-embeddings-vector-space', stage: 1, level: '进阶', dots: 3, tags: [terra, sky], ready: true,
    title: '词变成数字：Embedding 与向量空间',
    desc: '国王 − 男人 + 女人 ≈ 女王。在 3D 星空里漫游词向量空间，理解 AI 眼中的“语义”长什么样。' },
  { id: 9, slug: '09-attention', stage: 1, level: '进阶', dots: 3, tags: [terra], ready: true,
    title: '注意力机制：AI 学会“划重点”',
    desc: '理解 “bank” 时该看 “river” 还是 “money”？Attention 让每个词学会环顾四周 —— 大模型的心脏。' },
  { id: 10, slug: '10-transformer', stage: 1, level: '进阶', dots: 3, tags: [sky], ready: true,
    title: 'Transformer：改变一切的架构',
    desc: '2017 年一篇论文《Attention Is All You Need》改写了 AI 史。逐层拆解这条“词语加工流水线”。' },

  // ---------- 第三阶段 · 大模型篇 ----------
  { id: 11, slug: '11-tokens', stage: 2, level: '基础', dots: 2, tags: [sky], ready: true,
    title: 'Token：大模型眼中的世界',
    desc: '大模型不认识“字”，只认识 token。输入一句话，看它被切成什么样 —— 顺便搞懂为什么按 token 计费。' },
  { id: 12, slug: '12-pretraining', stage: 2, level: '基础', dots: 2, tags: [], ready: true,
    title: '预训练：用整个互联网玩文字接龙',
    desc: '“预测下一个词”这个朴素游戏，重复上万亿次后发生了什么？大模型九成的能力来自这一步。' },
  { id: 13, slug: '13-sft-rlhf', stage: 2, level: '进阶', dots: 3, tags: [], ready: true,
    title: '从 GPT 到 ChatGPT：SFT 与 RLHF',
    desc: '预训练给了它知识，对齐给了它“人样”。监督微调 + 人类反馈强化学习，把接龙机器调教成助手。' },
  { id: 14, slug: '14-temperature-sampling', stage: 2, level: '基础', dots: 2, tags: [amber, sky], ready: true,
    title: '温度与采样：AI 为什么每次回答不一样',
    desc: 'temperature 调到 0 和调到 2，分别会发生什么？亲手拧动旋钮，理解“严谨”与“创造”之间的权衡。' },
  { id: 15, slug: '15-scaling-laws', stage: 2, level: '进阶', dots: 2, tags: [sky], ready: true,
    title: 'Scaling Laws 与涌现：大力出奇迹',
    desc: '参数 ×10、数据 ×10、算力 ×10，能力曲线如何变化？以及那些模型“突然学会”新本领的神秘瞬间。' },

  // ---------- 第四阶段 · 应用篇 ----------
  { id: 16, slug: '16-prompt-engineering', stage: 3, level: '基础', dots: 2, tags: [], ready: true,
    title: '提示工程：和 AI 对话的艺术',
    desc: '角色设定、少样本示例、思维链……提示工程不是玄学话术，而是一套有原理可循的工程方法。' },
  { id: 17, slug: '17-context-window', stage: 3, level: '基础', dots: 2, tags: [amber], ready: true,
    title: '上下文窗口：AI 的工作记忆',
    desc: '为什么聊久了 AI 会“失忆”？上下文是大模型唯一的记忆，理解它的边界是用好 AI 的前提。' },
  { id: 18, slug: '18-rag', stage: 3, level: '进阶', dots: 3, tags: [terra, sky], ready: true,
    title: 'RAG：给 AI 外挂知识库',
    desc: '大模型不知道你公司的文档怎么办？切块 → 向量化 → 检索 → 注入上下文，动画演示完整流程。' },
  { id: 19, slug: '19-function-calling', stage: 3, level: '进阶', dots: 2, tags: [], ready: true,
    title: 'Function Calling：AI 长出双手',
    desc: '让大模型学会查天气、订机票、跑代码 —— 工具调用是 AI 从“会说”到“会做”的关键跨越。' },
  { id: 20, slug: '20-agents', stage: 3, level: '进阶', dots: 3, tags: [], ready: true,
    title: 'Agent 智能体：会自己干活的 AI',
    desc: '感知 → 规划 → 行动 → 反思。当大模型装上循环和工具，它开始自主完成多步任务。' },

  // ---------- 第五阶段 · 前沿篇 ----------
  { id: 21, slug: '21-diffusion-models', stage: 4, level: '进阶', dots: 3, tags: [sky], ready: true,
    title: '文生图：扩散模型的去噪魔法',
    desc: '从一张纯噪点开始，一步步“擦”出一幅画。Stable Diffusion 与 Midjourney 背后的反直觉原理。' },
  { id: 22, slug: '22-multimodal', stage: 4, level: '进阶', dots: 2, tags: [], ready: true,
    title: '多模态：AI 同时看懂图文音',
    desc: '图片也能变成 token？看视觉编码器如何与语言模型“接驳”，让 AI 看图说话、听声辨意。' },
  { id: 23, slug: '23-reasoning-models', stage: 4, level: '进阶', dots: 2, tags: [], ready: true,
    title: '推理模型：思维链与慢思考',
    desc: '从 o1 到 DeepSeek-R1：让模型先“打草稿”再回答 —— 用测试时算力换智力的新范式。' },
  { id: 24, slug: '24-mcp-ecosystem', stage: 4, level: '进阶', dots: 2, tags: [], ready: true,
    title: 'MCP 与 AI 工程生态',
    desc: 'Model Context Protocol：AI 应用的“USB 接口”。一张图看懂大模型周边的工程生态全景。' },
  { id: 25, slug: '25-open-vs-closed', stage: 4, level: '入门', dots: 1, tags: [], ready: true,
    title: '开源与闭源：大模型版图',
    desc: 'GPT、Claude、Gemini、Llama、Qwen、DeepSeek……一张地图认清各家路线，学会按需选型。' },

  // ---------- 第六阶段 · 实战篇 ----------
  { id: 26, slug: '26-first-api-call', stage: 5, level: '基础', dots: 2, tags: [], ready: true,
    title: '第一次调用 API：30 行代码的聊天机器人',
    desc: '申请 key、发出第一个请求、读懂流式输出 —— 你和“AI 应用开发者”之间，只隔着 30 行代码。' },
  { id: 27, slug: '27-local-llms', stage: 5, level: '基础', dots: 2, tags: [], ready: true,
    title: '本地跑大模型：Ollama 与量化',
    desc: '不联网、不花钱，在自己电脑上跑开源大模型。顺便弄懂 7B、Q4 这些参数“黑话”是什么意思。' },
  { id: 28, slug: '28-build-rag', stage: 5, level: '进阶', dots: 3, tags: [], ready: true,
    title: '实战 RAG：搭建你的私人知识库',
    desc: '把第 18 课的流程图变成真代码：读文档、建索引、做问答 —— 一个完整能用的 RAG 应用。' },
  { id: 29, slug: '29-evals-and-safety', stage: 5, level: '进阶', dots: 2, tags: [], ready: true,
    title: '评估与安全：AI 的体检与红线',
    desc: '怎么知道模型变好了？幻觉、提示注入、越狱 —— 上线之前必须懂的评估方法与安全常识。' },
  { id: 30, slug: '30-learning-map', stage: 5, level: '入门', dots: 1, tags: [], ready: true,
    title: '终点亦起点：AI 进阶学习地图',
    desc: '论文怎么读、社区在哪里、方向怎么选 —— 把这门课变成你 AI 之旅的第一级台阶，而非终点。' },
]

// 便捷查询
export const lessonBySlug = (slug) => lessons.find((l) => l.slug === slug)
export const lessonById = (id) => lessons.find((l) => l.id === id)
export const stageOf = (lesson) => stages[lesson.stage]
