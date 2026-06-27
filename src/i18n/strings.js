// ============================================================
// AI 通识课 · i18n 文案字典（中英双语）
// 纯数据，无 React 依赖 —— 供 LangContext 的 useUI() 与副作用消费。
// 课程正文（L01~L30）暂不在此，本字典只覆盖 UI 框架与首页文案。
// ============================================================

// 文档级 meta：随语言切换更新 <html lang> / title / description
export const META = {
  zh: {
    lang: "zh-CN",
    brand: "AI 通识课",
    title: "AI 通识课 · 为中文学习者设计的 AI 入门课",
    description:
      "零基础 AI 课程：用可视化与交互演示讲透 AI 核心原理，7 个阶段 34 课，从神经网络直觉到亲手构建 AI 应用，专为中文学习者设计。",
    ogImage: "https://aipath.buynao.com/og-image.png",
    ogLocale: "zh_CN",
  },
  en: {
    lang: "en",
    brand: "AI Essentials",
    title: "Interactive AI General Education Course — 34 Lessons, Zero Math",
    description:
      "A from-zero AI course: core principles explained through visuals and interactive demos. 7 stages, 34 lessons — from neural-network intuition to building your own AI apps.",
    ogImage: "https://aipath.buynao.com/og-image-en.png",
    ogLocale: "en_US",
  },
};

// UI 框架文案字典
export const UI = {
  zh: {
    nav: {
      idea: "设计理念",
      path: "学习路线",
      usage: "怎么学",
      github: "在 GitHub 查看源码",
      switchLang: "切换到英文",
      menu: "菜单",
    },
    footer: {
      tagline: "AI 通识课 · 为中文学习者设计的 AI 入门课",
      updating: "持续更新中",
      follow: "在 X 上关注作者",
    },
    pager: {
      prevDir: "← 上一课",
      nextDir: "下一课 →",
      tocBackDir: "← 课程目录",
      tocFwdDir: "课程目录 →",
      pathName: "学习路线 · 7 阶段 34 课",
      backToPath: "回到学习路线",
    },
    lessonNav: {
      openAria: "打开课程目录",
      fab: "目录",
      headTitle: "课程目录 · 34 课",
      closeAria: "关闭目录",
      asideAria: "课程目录",
    },
    lesson: {
      crumbHome: "课程",
      lessonN: (n) => `第 ${n} 课`,
      minutes: (n) => `约 ${n} 分钟`,
      loading: "加载中…",
      placeholderLead: "本课正在从原静态页面迁移到 React 架构中。",
      placeholderNotePre: "原课程内容与交互演示完整保存在 ",
      placeholderNoteSuf: "，迁移后将拥有与 L01 / L04 相同的组件化交互体验。",
      bodyError:
        "本课内容加载时出了点问题。如果你开启了浏览器的网页翻译，请将本站设为「不翻译」后重试 —— 本站已内置中英文切换。",
      reload: "重新载入本课",
    },
    ui: { tapReveal: "▸ 点击揭晓", viewAnswer: "查看答案" },
    home: {
      eyebrow: "AI for Chinese Learners · 零基础友好",
      h1a: "为中文学习者设计的",
      h1b: "AI 入门课",
      subhead:
        "用可视化和交互演示，把 AI 的核心原理装进你的直觉 —— 从“神经网络是什么”到亲手搭出 AI 应用，每课约 10–30 分钟。",
      ctaPath: "查看学习路线",
      ctaStart: "从第 1 课开始学 →",
      vizCap: {
        pre: "↑ 一个正在“思考”的大模型 —— 它每次只做一件事：猜下一个字。亮起的前文是它正在“注意”的字；右侧是它脑中的候选和概率。拧动 temperature 试试：",
        amber: "琥珀色",
        mid: "的字是它没选最高概率时的发挥，",
        wild: "红色",
        post: "的字就是彻底放飞了。",
      },
      statLabels: ["学习阶段", "核心课程", "单课时长", "基础要求"],
      ideaEyebrow: "Why This Course",
      ideaH2: "这套课为什么不一样",
      ideaSub:
        "市面上的 AI 课要么是数学推导，要么是新闻名词轰炸。这套课只做一件事：让你真正“看见”AI 是怎么运转的。",
      ideas: [
        {
          icon: "🧠",
          title: "直觉优先",
          body: "不从公式出发，从画面出发。每个概念都先给你一个心智图像 —— 训练是“摸索下山”，注意力是“划重点”，扩散模型是“从噪点里擦出一幅画”。先有直觉，术语和数学才有地方安放。",
        },
        {
          icon: "🎛️",
          title: "可视可玩",
          body: "关键概念配 2D / 3D 交互演示：拖动神经元的权重、拧动 temperature 旋钮、在三维星空里漫游词向量。标注「交互演示」的课程都能亲手操作 —— 玩过的，才真正属于你。",
        },
        {
          icon: "🛠️",
          title: "学完能上手",
          body: "最后一个阶段写真代码：调用 LLM API、在自己电脑上跑开源模型、搭一个 RAG 知识库。从“看懂 AI 新闻”到“做出 AI 应用”，这门课负责送你走完全程。",
        },
      ],
      pathEyebrow: "Learning Path",
      pathH2: "学习路线 · 7 阶段 34 课",
      pathSub:
        "自下而上搭建：先建直觉，再懂原理，看清大模型全貌，最后亲手构建。建议按顺序学习。",
      stageCount: (n) => `${n} 课`,
      usageEyebrow: "How To Learn",
      usageH2: "每一课怎么学",
      usageSub: "所有课程共用同一结构，一节课就是一个完整的学习闭环（约 10–30 分钟，随内容深浅而定）：",
      usageSteps: [
        { icon: "💡", label: "核心概念", desc: "直觉化讲透" },
        { icon: "🎛️", label: "交互演示", desc: "亲手调参数" },
        { icon: "⚠️", label: "常见误区", desc: "概念纠偏" },
        { icon: "✍️", label: "小练习", desc: "即学即测" },
      ],
      usageFootnote:
        "建议节奏：每天 1 课，6 周完成；或每天 2 课，3 周速通。第 4、8、9、18 课是公认难关，多留一天。",
    },
  },

  en: {
    nav: {
      idea: "Philosophy",
      path: "Learning Path",
      usage: "How to Learn",
      github: "View source on GitHub",
      switchLang: "Switch to Chinese",
      menu: "Menu",
    },
    footer: {
      tagline: "AI Essentials · A Visual Intro to AI for Beginners",
      updating: "Continuously updated",
      follow: "Follow on X",
    },
    pager: {
      prevDir: "← Previous",
      nextDir: "Next →",
      tocBackDir: "← Contents",
      tocFwdDir: "Contents →",
      pathName: "Learning Path · 7 stages, 34 lessons",
      backToPath: "Back to the path",
    },
    lessonNav: {
      openAria: "Open contents",
      fab: "Contents",
      headTitle: "Contents · 34 lessons",
      closeAria: "Close contents",
      asideAria: "Course contents",
    },
    lesson: {
      crumbHome: "Courses",
      lessonN: (n) => `Lesson ${n}`,
      minutes: (n) => `~${n} min`,
      loading: "Loading…",
      placeholderLead:
        "This lesson is being migrated from the original static page to the React architecture.",
      placeholderNotePre:
        "The original content and interactive demos are preserved in ",
      placeholderNoteSuf:
        ", and will gain the same component-based interactivity as L01 / L04 after migration.",
      bodyError:
        "Something went wrong while loading this lesson. If your browser is auto-translating the page, set this site to “Don’t translate” and try again — a built-in language switch is already provided.",
      reload: "Reload this lesson",
    },
    ui: { tapReveal: "▸ Tap to reveal", viewAnswer: "Show answer" },
    home: {
      eyebrow: "AI for Everyone · No Math Required",
      h1a: "An Intuitive",
      h1b: "Intro to AI",
      subhead:
        "Visuals and interactive demos that wire AI’s core ideas straight into your intuition — from “what is a neural network” to building your own AI app, about 10–30 minutes per lesson.",
      ctaPath: "See the learning path",
      ctaStart: "Start with Lesson 1 →",
      vizCap: {
        pre: "↑ A large language model “thinking” — it does one thing at a time: guess the next word. The highlighted earlier words are what it’s “attending” to; on the right are its candidates and their probabilities. Try turning the temperature: ",
        amber: "amber",
        mid: " words are where it didn’t pick the top probability, and ",
        wild: "red",
        post: " words are it going completely off the rails.",
      },
      statLabels: ["Stages", "Lessons", "Per lesson", "Prerequisites"],
      ideaEyebrow: "Why This Course",
      ideaH2: "Why This Course Is Different",
      ideaSub:
        "Most AI courses are either math derivations or a barrage of buzzwords. This one does just one thing: let you actually see how AI works.",
      ideas: [
        {
          icon: "🧠",
          title: "Intuition First",
          body: "Start from a picture, not a formula. Every concept gets a mental image first — training is “feeling your way downhill,” attention is “highlighting what matters,” diffusion is “wiping a picture out of pure noise.” Get the intuition first, and the terms and math have somewhere to land.",
        },
        {
          icon: "🎛️",
          title: "Visual & Playable",
          body: "Key concepts come with 2D / 3D interactive demos: drag a neuron’s weights, turn the temperature knob, roam a word-vector space in 3D. Lessons tagged “Interactive” can be played with directly — what you’ve played with truly becomes yours.",
        },
        {
          icon: "🛠️",
          title: "Hands-On by the End",
          body: "The final stage writes real code: call an LLM API, run an open-source model on your own machine, build a RAG knowledge base. From “understanding AI news” to “shipping an AI app,” this course takes you all the way.",
        },
      ],
      pathEyebrow: "Learning Path",
      pathH2: "Learning Path · 6 Stages, 34 Lessons",
      pathSub:
        "Built bottom-up: first intuition, then principles, then the full picture of large models, and finally building with your own hands. We recommend following the order.",
      stageCount: (n) => `${n} lessons`,
      usageEyebrow: "How To Learn",
      usageH2: "How Each Lesson Works",
      usageSub:
        "Every lesson shares the same structure — one self-contained learning loop (about 10–30 minutes, depending on depth):",
      usageSteps: [
        { icon: "💡", label: "Core Concept", desc: "explained intuitively" },
        { icon: "🎛️", label: "Interactive Demo", desc: "tweak it yourself" },
        { icon: "⚠️", label: "Common Pitfalls", desc: "fix misconceptions" },
        { icon: "✍️", label: "Quick Quiz", desc: "test as you go" },
      ],
      usageFootnote:
        "Suggested pace: 1 lesson a day finishes in 6 weeks, or 2 a day in 3 weeks. Lessons 4, 8, 9, and 18 are the well-known tough ones — give them an extra day.",
    },
  },
};
