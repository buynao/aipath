# AI 通识 · 为中文学习者设计的 AI 入门课

[English](./README.md) · **中文**

<p align="center">
  <a href="https://aipath.buynao.com">
    <img src="media/hero-zh.gif" alt="一个正在「思考」的大模型——每次只猜下一个字，拧动温度，右侧 top-5 候选概率实时重塑" width="760">
  </a>
</p>

<p align="center">
  <b>▶ 在线访问 — <a href="https://aipath.buynao.com">aipath.buynao.com</a></b> &nbsp;·&nbsp; 免注册，每个概念都能上手玩
</p>

<p align="center"><sub>↑ 首屏交互（第 15 课 · 下一个字的游戏）：大模型每次只猜下一个字，拧动 temperature，看它脑中的 top-5 候选如何从「严谨」重塑到「放飞」。</sub></p>

> 为中文学习者设计的零基础 AI 入门课 —— **6 个阶段、30 课**，不堆公式、不灌术语，用可视化与交互演示把 AI 的核心原理装进直觉，最后亲手写代码构建一个真正能跑的 AI 应用。

从「神经网络是什么」到「亲手搭出一个 RAG 知识库」，这门课负责送你走完从 **AI 新闻围观者** 到 **AI 应用构建者** 的全程。每课约 20 分钟，零基础友好，几乎不碰数学。

> **本项目（课程内容、文案、交互演示、前端代码）由 [Claude Fable](https://claude.com/claude-code) 生成。** 30 课的讲解逐字打磨、每个交互可视化（2D/3D/SVG/Canvas）逐课实现并经无头浏览器验证，整套设计系统与 React 架构亦由 AI 端到端产出。

---

## 这门课的三个特点

- **直觉优先** —— 不从公式出发，从画面出发。训练是「摸索下山」，注意力是「划重点」，扩散模型是「从噪点里擦出一幅画」。先有心智图像，术语和数学才有地方安放。
- **可视可玩** —— 关键概念都配 2D / 3D 交互演示：拖动神经元的权重、拧动 temperature 旋钮、在三维星空里漫游词向量、亲手把一篇文档切块喂给 RAG。玩过的，才真正属于你。
- **学完能上手** —— 最后一个阶段写真代码：调用 LLM API、在自己电脑上跑开源模型（Ollama）、搭一个 RAG 知识库、读懂上线前的评估与安全红线。

---

## 课程大纲

| 阶段 | 主题 | 课程 |
|---|---|---|
| 一 · 直觉篇 | AI 到底是什么 | 01 三个圈的关系 · 02 机器怎么学习 · 03 一个神经元 · 04 梯度下降 · 05 数据与过拟合 |
| 二 · 原理篇 | 深度学习四大基石 | 06 反向传播 · 07 CNN · 08 Embedding · 09 注意力 · 10 Transformer |
| 三 · 大模型篇 | LLM 是怎么炼成的 | 11 Token · 12 预训练 · 13 SFT/RLHF · 14 温度与采样 · 15 Scaling Laws |
| 四 · 应用篇 | 把大模型用起来 | 16 提示工程 · 17 上下文 · 18 RAG · 19 Function Calling · 20 Agent |
| 五 · 前沿篇 | 多模态与推理 | 21 扩散模型 · 22 多模态 · 23 推理模型 · 24 MCP 生态 · 25 大模型版图 |
| 六 · 实战篇 | 亲手构建 AI 应用 | 26 调用 API · 27 本地部署 · 28 实战 RAG · 29 评估与安全 · 30 进阶地图 |

每课结构统一：核心概念（直觉化讲透）→ 交互演示（亲手调参数）→ 常见误区（概念纠偏）→ 小练习（即学即测）。课程页左侧带固定目录，可随时跳转任意一课。

---

## 本地开发

```bash
npm install      # 安装依赖
npm run dev      # 开发服务器（热更新）→ http://localhost:5173
npm run build    # 生产构建到 dist/
npm run preview  # 本地预览生产构建 → http://localhost:4173
```

---

## 项目结构

```
learn-x/
├── index.html                  # Vite 单一入口
├── vite.config.js
├── src/
│   ├── main.jsx                # 挂载 + 全局样式导入
│   ├── App.jsx                 # 路由表（数据驱动，按 lessons 自动注册）
│   ├── data/lessons.js         # 6 阶段 × 30 课的目录元数据（单一数据源）
│   ├── styles/                 # style.css · lesson.css · app.css（首页/各课专属样式）
│   ├── components/             # 公共组件库
│   │   ├── Nav.jsx · Footer.jsx · Pager.jsx
│   │   ├── LessonNav.jsx       # 课程页左侧固定目录（六阶段分组 · 高亮当前课）
│   │   ├── ui.jsx              # Pill / Dots / Lsec / DemoPanel / Chips / FlipCard / SliderRow / QuizItem
│   │   └── LossChart.jsx       # Recharts 损失曲线
│   ├── pages/
│   │   ├── Home.jsx            # 首页：理念 + 学习路线 + 用法（数据驱动渲染）
│   │   └── LessonPage.jsx      # 课程页外壳 + 30 课的 lazy 注册表
│   └── lessons/
│       ├── L01.jsx … L30.jsx   # 全部 30 课
│       └── viz/                # 框架无关的可视化控制器
│           ├── NeuralNetViz.jsx       # 首页神经网络 canvas 动画
│           ├── gradientDescent.js     # three.js 3D 下山
│           ├── cosmos.js              # three.js 词向量星空
│           ├── convScan.js            # CNN 卷积扫描 canvas
│           └── diffusion.js           # 扩散去噪 / CFG canvas
└── legacy/                     # 迁移前的原始静态站点（30 课 HTML 备份，迁移参照）
```

---

## 状态

全部 30 课已迁移到 Vite + React 架构并通过生产构建，复杂交互（three.js / canvas / 声明式 SVG）逐课经无头浏览器验证。

- [x] 课程体系与 30 课大纲、设计系统
- [x] Vite + React 架构：脚手架 + 组件库 + 数据层 + 首页
- [x] 第一阶段 · 直觉篇（L01–L05）
- [x] 第二阶段 · 原理篇（L06–L10）
- [x] 第三阶段 · 大模型篇（L11–L15）
- [x] 第四阶段 · 应用篇（L16–L20）
- [x] 第五阶段 · 前沿篇（L21–L25）
- [x] 第六阶段 · 实战篇（L26–L30）
- [x] 课程页左侧固定目录、代码分割、深色模式

---

<sub>Generated with Claude Fable · 为中文学习者设计的 AI 通识课</sub>
