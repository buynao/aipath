import { useEffect, useRef, useState } from 'react'
import { Lsec, SliderRow, QuizItem } from '../components/ui.jsx'
import { createDenoise, createCfg } from './viz/diffusion.js'
import { useLang } from '../i18n/LangContext.jsx'

// 双语内容层：结构 / class / id / 交互 / 数值均不变，仅文本按语言取用。
// 富文本（含 <b>）直接以 JSX 片段存储，渲染输出与单语版逐字一致。
const C = {
  zh: {
    dn1Caption: '步数 0 / 50 · 噪声残留 100%',
    dn1Title: '🎛️ 交互演示 · 50 步去噪（原理示意）',
    dn1Hint: '拖动滑块 = 手动去噪',
    dn1CanvasLabel: '去噪过程演示画布：图像从纯噪声逐步变清晰',
    dn1SideTitle: '选一张“藏在噪声里”的画',
    dn1Patterns: [['rings', '暖阳同心圆'], ['mountain', '远山落日'], ['checker', '棋盘格']],
    dn1Steps: '去噪步数',
    dn1Pause: '⏸ 停止',
    dn1Play: '▶ 自动播放',
    dn1Foot: '真实扩散模型的每一步由神经网络预测噪声，这里只是模拟“逐步去噪”的视觉过程。',
    cfgTitle: '🎚️ 小实验 · 拧一拧 CFG 旋钮（原理示意）',
    cfgHint: '左右拖动滑块',
    cfgCanvasLabel: 'CFG 引导强度示意：滑块越小画面越模糊发灰，越大颜色越过饱和',
    cfgPrompt: '提示词：「远山落日」',
    cfgSlider: '引导强度',
    cfgFoot: '这里用清晰度/饱和度模拟“听话程度”的观感；真实 CFG 作用在每一步去噪的方向上。',

    goalsTitle: '🎯 你将学会',
    goals: [
      <>说出全课最反直觉的一点：扩散模型学的不是“怎么画画”，而是“怎么把一张被加噪的图恢复一点点”</>,
      <>分清训练和生成两个阶段：训练时给真图加噪、让网络猜噪声；生成时从纯噪声出发，几十步迭代去噪</>,
      <>明白文字怎么控制画面：描述先变成向量（第 8 课的老朋友），再在每一步去噪时“指路”，并知道 CFG 旋钮拧大会怎样</>,
      <>一句话解释潜空间为什么省钱，并认出 Midjourney / Stable Diffusion / DALL·E / Sora 同属一条技术路线</>,
    ],

    conceptTitle: '💡 核心概念：它学的不是画画，是“修复”',
    conceptLead: '看到 AI 画图，所有人的第一反应都是“它学会了绘画”。错。扩散模型（diffusion model）学会的事小得多、也怪得多 —— 但正是这件小事，重复几十次之后就变成了魔法。',
    contrastTag1: '直觉印象',
    contrastBig1: <>学“怎么画”<span className="gap"> · </span>从空白画布起笔</>,
    contrastNote1: '想象 AI 像画家一样：先打底稿，再勾线、上色 —— 一笔一笔把画“画”出来。听起来合理，但完全不是这么回事。',
    contrastTag2: '真实机制',
    contrastBig2: <>学“怎么<span className="hl">去掉一点噪声</span>”</>,
    contrastNote2: <>它只练了一件事：拿到一张被噪声污染的图，把噪声<b>恢复一点点</b>。把这一步重复几十次 —— 一幅画就从雪花屏里浮现出来。</>,
    exampleEn: '“雕像本来就在石头里，我只是去掉多余的部分。”—— 传说中雕塑家的回答',
    exampleZh: '扩散模型是数字时代的雕塑家：画“藏”在那张纯噪声里，去噪器一步一步凿掉多余的随机，直到画显形。它从不“添加”任何笔画 —— 它只做减法。',
    twoPhaseLead: '这件事拆开看，是两个完全分离的阶段：',
    phase1Label: '训练时 · 学会去噪',
    phase1En: <>加噪 → 猜<b>噪声</b></>,
    phase1Zh: <>拿一张真实照片，随机加上<b>不同程度</b>的噪声 —— 轻则略糊，重则面目全非 —— 然后让神经网络猜：“刚才加进去的是什么噪声？”猜对了，就等于会把这一步噪声减掉。在亿万张图上重复这道练习题，网络就成了去噪高手。</>,
    phase2Label: '生成时 · 反复用它',
    phase2En: <>纯噪声 → <b>几十步</b> → 画</>,
    phase2Zh: <>生成新图时根本不需要任何“原图”：随机抽一张<b>纯噪声</b>，把去噪器连续调用几十步，每步只擦掉一点点。因为起点的噪声每次都不同，每次“浮现”出的画也都是世界上从未存在过的一张。</>,
    whyNotOneStep: '为什么不一步到位？因为“从雪花直接猜出整幅画”太难了，网络猜不准；而“只把噪声减轻一点点”是个简单得多的小问题，每一步都能做得很准。几十个小而准的步骤串起来，胜过一个大而离谱的跳跃 —— 这和第 4 课梯度下降“小步快走”的智慧一脉相承。',

    navTitle: '🧭 文字怎么控制画面：每一步都有人指路',
    navLead: '光会去噪，只能从噪声里浮现出“随便一张图”。要让它画“一只戴贝雷帽的橘猫”，需要把你的文字变成每一步去噪的导航。',
    navSteps: [
      <><b>文字变向量。</b>你的描述先经过一个<b>文本编码器（text encoder）</b>，变成一串数字向量 —— 还记得第 8 课吗？向量就是机器能比较、能计算的“语义坐标”，“橘猫”和“贝雷帽”的含义都被编了码。</>,
      <><b>每步去噪时指路。</b>这串向量作为<b>条件</b>，在每一步去噪时都喂给去噪器，把去噪的方向“掰”向符合描述的图像区域：同样是擦掉噪声，往“有橘猫的那类图”的方向擦。文字不画画，文字只导航。</>,
      <><b>CFG：听话程度的旋钮。</b>引导强度（CFG，Classifier-Free Guidance）决定模型多大程度服从你的文字：拧大更听话、更贴题，但拧过头容易颜色过饱和、画面发“塑料”—— 像把导航音量开到最大，司机紧张得开不好车。</>,
    ],
    latentPara: <><b>顺带一段：潜空间 —— 在草图上构思，最后再上色放大。</b>直接在像素上做扩散太贵：一张 1024×1024 的图有上百万个像素，几十步去噪每步都得全算一遍。Stable Diffusion 的聪明做法是先用一个压缩器把图压进小得多的<b>潜空间</b>（latent space），全部几十步扩散都在这张“小草图”上进行，最后一步才解码放大回像素 —— 就像画家先在小稿上构思布局，定稿后才上色放大，省下的算力是数量级的。它的论文名就叫“潜在扩散”（Latent Diffusion）。</>,
    routeCards: [
      { label: '同一条路线 · 三位名角', en: <>Midjourney / <b>SD</b> / DALL·E</>, zh: <>Midjourney 以审美调校出名、Stable Diffusion 开源开放、DALL·E 出自 OpenAI —— 产品气质各异，底层同属扩散这条技术路线。</> },
      { label: '延伸 · 视频生成', en: <>Sora 类 = <b>时间维</b>扩散</>, zh: <>把“对一张图去噪”扩展成“对一串帧在时间维度上一起去噪”，画面动起来还前后连贯 —— 视频生成的主流思路。</> },
      { label: '复习钩子', en: <>呼应<b>第 8 课</b></>, zh: <>文本编码器输出的向量，正是第 8 课讲过的嵌入。同一个零件，在文生图里换了个岗位：从“表示词义”变成“给去噪导航”。</> },
    ],

    navSourceNote: (
      <>
        现代扩散模型的奠基工作是 Ho 等 2020{' '}
        <a href="https://arxiv.org/abs/2006.11239" target="_blank" rel="noreferrer">
          Denoising Diffusion Probabilistic Models（DDPM）
        </a>
        ；潜空间扩散（Stable Diffusion 的底层）见 Rombach 等 2022{' '}
        <a href="https://arxiv.org/abs/2112.10752" target="_blank" rel="noreferrer">
          High-Resolution Image Synthesis with Latent Diffusion Models
        </a>
        ；CFG 见 Ho 与 Salimans 2022{' '}
        <a href="https://arxiv.org/abs/2207.12598" target="_blank" rel="noreferrer">
          Classifier-Free Diffusion Guidance
        </a>
        。
      </>
    ),
    bridgeTitle: '➡️ 下一课怎么接上',
    bridgeLead: '这一课里藏着一个关键零件：文本编码器把你的文字变成向量，再去给画面“指路”。换句话说，文字和图像被放进了同一套“语义坐标系”，才能互相对话。把这个思路推广开 —— 让一个模型同时看懂图、文、音，靠的正是同一招：把不同模态都编码成模型能比较的向量。下一课讲多模态，看视觉编码器怎么和语言模型“接驳”，让 AI 看图说话、听声辨意。',
    bridgeSteps: ['文字编码成向量来导航', '文字与图像共享语义空间', '推广到图 / 文 / 音', '下一课：多模态'],
    demoTitle: '🎛️ 交互演示：从雪花里擦出一幅画',
    demoLead: '下面是原理示意（不是真模型）：我们程序化地画一张目标图，再用“目标与噪声按比例混合、噪声幅度随步数衰减”模拟去噪观感。拖动滑块，或点「自动播放」看整个过程 —— 注意画面是怎么先定大色块、再浮现轮廓、最后才清晰的。',

    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      {
        bad: <>AI 画图是在素材库里搜图、拼贴、缝合</>,
        good: <>画面从纯噪声逐步生成，不存在被“拼贴”的某张原图 —— 但训练数据里的风格确实会被学进权重</>,
        why: <><b>病因：</b>“它看过几十亿张图”听起来就像存了一个巨大素材库。实际上权重里存的是统计规律，不是图片本身 —— 生成时的唯一“原料”是那张随机噪声。但要诚实地说：艺术家的风格可以被模仿这件事是真的，训练数据是否侵权、风格该不该受保护，是 2025 年仍在诉讼和立法中拉锯的争议。</>,
      },
      {
        bad: <>AI 是“唰”地一下把图画出来的</>,
        good: <>标准流程是几十步迭代去噪，每步只擦掉一点点噪声</>,
        why: <><b>病因：</b>产品界面只给你看最终结果，中间几十步被藏起来了。另外确实有“秒出图”的产品 —— 那靠的是蒸馏、一致性模型等加速技术，把几十步压缩到几步甚至一步，但那是工程提速，原理仍然是去噪。</>,
      },
    ],

    quizTitle: '✍️ 小练习',
    quiz: [
      {
        q: '1. 用一句话向朋友解释“扩散模型到底学了什么”，并分别说出训练阶段和生成阶段各在做什么。',
        a: <>一句话：<b>它学的不是画画，而是“把一张被加噪的图恢复一点点”。</b>训练时：拿真图随机加不同程度的噪声，让网络猜“加了什么噪声”；生成时：从一张纯噪声出发，反复调用这个去噪器几十步，画从雪花里浮现。</>,
      },
      {
        q: '2. 朋友把 CFG 引导强度拉到最大，抱怨“图是贴题了，但颜色辣眼睛、画面像塑料”。请解释原因并给建议。',
        a: <>CFG 决定模型多大程度<b>服从文字描述</b>：拧大更听话、更贴题，但拧过头会过度强化“符合描述”的方向，典型副作用就是颜色过饱和、画面僵硬。建议把引导强度调回中间档位，在“贴题”和“自然”之间找平衡。</>,
      },
      {
        q: '3. 判断题：“Stable Diffusion 是直接在像素上一步步去噪的。”对吗？潜空间帮它省下了什么？',
        a: <><b>不对。</b>直接在上百万个像素上做几十步扩散太贵。Stable Diffusion 先把图压缩进小得多的<b>潜空间</b>，在那里完成全部去噪，最后才解码回像素 —— 像先在小草稿上构思、定稿后再上色放大，省下数量级的算力。</>,
      },
    ],
  },

  en: {
    dn1Caption: 'Step 0 / 50 · noise remaining 100%',
    dn1Title: '🎛️ Interactive · 50-Step Denoising (illustrative)',
    dn1Hint: 'Drag the slider = denoise by hand',
    dn1CanvasLabel: 'Denoising demo canvas: the image gradually clears from pure noise',
    dn1SideTitle: 'Pick an image "hidden in the noise"',
    dn1Patterns: [['rings', 'Warm-sun concentric rings'], ['mountain', 'Distant mountains at sunset'], ['checker', 'Checkerboard']],
    dn1Steps: 'Denoising steps',
    dn1Pause: '⏸ Stop',
    dn1Play: '▶ Auto-play',
    dn1Foot: 'In a real diffusion model each step has a neural network predict the noise; here we only simulate the visual process of "step-by-step denoising."',
    cfgTitle: '🎚️ Mini-experiment · Turn the CFG Knob (illustrative)',
    cfgHint: 'Drag the slider left and right',
    cfgCanvasLabel: 'CFG guidance-strength illustration: the lower the slider the blurrier and grayer the image, the higher the more oversaturated the colors',
    cfgPrompt: 'Prompt: "distant mountains at sunset"',
    cfgSlider: 'Guidance strength',
    cfgFoot: 'Here we use clarity/saturation to simulate the feel of "how obediently it follows"; real CFG acts on the direction of each denoising step.',

    goalsTitle: '🎯 What You’ll Learn',
    goals: [
      <>State the most counterintuitive point of the whole lesson: a diffusion model learns not "how to paint," but "how to recover a noised image a little bit"</>,
      <>Tell apart the two stages of training and generation: in training, noise is added to real images and the network guesses the noise; in generation, it starts from pure noise and iteratively denoises over dozens of steps</>,
      <>Understand how text controls the image: the description first becomes a vector (an old friend from Lesson 8), then "gives directions" at each denoising step, and know what happens when you crank the CFG knob up</>,
      <>Explain in one sentence why the latent space saves money, and recognize that Midjourney / Stable Diffusion / DALL·E / Sora all belong to the same technical lineage</>,
    ],

    conceptTitle: '💡 Core Idea: It Learns Not Painting, but "Repair"',
    conceptLead: 'Seeing AI draw pictures, everyone’s first reaction is "it learned to paint." Wrong. What it learned is far smaller, and far stranger — but it’s precisely this small thing that, repeated dozens of times, turns into magic.',
    contrastTag1: 'Intuitive impression',
    contrastBig1: <>Learn "how to paint"<span className="gap"> · </span>starting from a blank canvas</>,
    contrastNote1: 'Picture the AI like a painter: first sketch the underdrawing, then ink the lines and apply color — "painting" the image stroke by stroke. It sounds reasonable, but it’s not at all how things work.',
    contrastTag2: 'The real mechanism',
    contrastBig2: <>Learn "how to <span className="hl">remove a little noise</span>"</>,
    contrastNote2: <>It practiced only one thing: take an image polluted by noise and <b>recover it a little bit</b>. Repeat this step dozens of times — and an image emerges from the snowstorm.</>,
    exampleEn: '"The statue was already in the stone; I just removed the excess." — the sculptor’s legendary reply',
    exampleZh: 'A diffusion model is the digital age’s sculptor: the image is "hidden" inside that pure noise, and the denoiser chisels away the excess randomness step by step until the image takes shape. It never "adds" any stroke — it only subtracts.',
    twoPhaseLead: 'Broken apart, this is two entirely separate stages:',
    phase1Label: 'In training · learning to denoise',
    phase1En: <>add noise → guess the <b>noise</b></>,
    phase1Zh: <>Take a real photo and randomly add <b>varying amounts</b> of noise — lightly, slightly blurry; heavily, unrecognizable — then have the neural network guess: "what noise was just added?" Guess right, and you can subtract this step’s noise. Repeat this exercise over billions of images, and the network becomes a denoising master.</>,
    phase2Label: 'In generation · use it over and over',
    phase2En: <>pure noise → <b>dozens of steps</b> → image</>,
    phase2Zh: <>Generating a new image needs no "source image" at all: draw a random patch of <b>pure noise</b>, call the denoiser dozens of times in a row, each step erasing just a little. Because the starting noise differs every time, each "emerging" image is one that has never existed in the world before.</>,
    whyNotOneStep: 'Why not do it in one step? Because "guessing a whole image straight from the snowstorm" is too hard — the network can’t guess it accurately; whereas "lightening the noise just a little" is a far simpler small problem that each step can do quite accurately. Dozens of small, accurate steps strung together beat one big, wildly off jump — this is of a piece with Lesson 4’s "small quick steps" wisdom of gradient descent.',

    navTitle: '🧭 How Text Controls the Image: Someone Gives Directions at Every Step',
    navLead: 'Mere denoising can only make "some random image" emerge from the noise. To make it draw "an orange cat in a beret," you need to turn your text into navigation for each denoising step.',
    navSteps: [
      <><b>Text becomes a vector.</b> Your description first passes through a <b>text encoder</b> (文本编码器) and turns into a string of number vectors — remember Lesson 8? A vector is the "semantic coordinate" a machine can compare and compute with; the meanings of "orange cat" and "beret" are both encoded.</>,
      <><b>Give directions at every denoising step.</b> This vector serves as a <b>condition</b>, fed to the denoiser at each denoising step, "bending" the denoising direction toward image regions that match the description: still erasing noise, but erasing toward "the kind of images with an orange cat." Text doesn’t paint; text only navigates.</>,
      <><b>CFG: the obedience knob.</b> Guidance strength (CFG, Classifier-Free Guidance) decides how much the model obeys your text: crank it up and it’s more obedient, more on-topic, but overdo it and colors easily oversaturate and the image turns "plastic" — like turning the navigation volume to max, the driver gets so tense they can’t drive well.</>,
    ],
    latentPara: <><b>An aside: the latent space — sketch out the idea, then color and scale up at the end.</b> Doing diffusion directly on pixels is too expensive: a 1024×1024 image has millions of pixels, and dozens of denoising steps each have to compute them all. Stable Diffusion’s clever move is to first use a compressor to squeeze the image into a far smaller <b>latent space</b>, run all dozens of diffusion steps on this "little sketch," and only at the last step decode and scale it back up to pixels — just as a painter first composes the layout on a small study, then colors and scales it up once finalized, saving compute by orders of magnitude. Its paper is literally titled "Latent Diffusion."</>,
    routeCards: [
      { label: 'One lineage · three famous players', en: <>Midjourney / <b>SD</b> / DALL·E</>, zh: <>Midjourney is known for its aesthetic tuning, Stable Diffusion is open-source and open, DALL·E comes from OpenAI — different product temperaments, but underneath they all belong to the diffusion lineage.</> },
      { label: 'Extension · video generation', en: <>Sora-type = <b>time-dimension</b> diffusion</>, zh: <>Extend "denoising one image" into "denoising a string of frames jointly along the time dimension," so the picture moves while staying coherent front to back — the mainstream approach to video generation.</> },
      { label: 'Review hook', en: <>echoes <b>Lesson 8</b></>, zh: <>The vector output by the text encoder is exactly the embedding covered in Lesson 8. The same part, given a new job in text-to-image: from "representing word meaning" to "navigating the denoising."</> },
    ],

    navSourceNote: (
      <>
        The foundation of modern diffusion models is Ho et al. 2020,{' '}
        <a href="https://arxiv.org/abs/2006.11239" target="_blank" rel="noreferrer">
          Denoising Diffusion Probabilistic Models (DDPM)
        </a>
        ; latent-space diffusion (the basis of Stable Diffusion) is Rombach et al. 2022,{' '}
        <a href="https://arxiv.org/abs/2112.10752" target="_blank" rel="noreferrer">
          High-Resolution Image Synthesis with Latent Diffusion Models
        </a>
        ; CFG is Ho & Salimans 2022,{' '}
        <a href="https://arxiv.org/abs/2207.12598" target="_blank" rel="noreferrer">
          Classifier-Free Diffusion Guidance
        </a>
        .
      </>
    ),
    bridgeTitle: '➡️ How This Leads to Lesson 22',
    bridgeLead: 'This lesson hides a key part: the text encoder turns your words into a vector that then "gives directions" to the image. In other words, text and image are placed in the same "semantic coordinate system" so they can talk to each other. Generalize that idea — making one model understand images, text, and audio at once relies on the very same trick: encode every modality into vectors the model can compare. The next lesson covers multimodality, showing how a vision encoder "docks" with a language model so AI can describe pictures and make sense of sound.',
    bridgeSteps: ['Text encoded to a vector to navigate', 'Text & image share a semantic space', 'Generalize to image / text / audio', 'Next: Multimodality'],
    demoTitle: '🎛️ Interactive Demo: Erase an Image Out of the Snowstorm',
    demoLead: 'Below is an illustration of the principle (not a real model): we programmatically draw a target image, then simulate the feel of denoising by "blending target and noise in proportion, with the noise amplitude decaying with the step count." Drag the slider, or click "Auto-play" to watch the whole process — notice how the image first sets large color blocks, then the outline emerges, and only at the end does it become clear.',

    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      {
        bad: <>AI image generation searches a stock library, collages, and stitches images together</>,
        good: <>The image is generated step by step from pure noise; there’s no source image being "collaged" — but the styles in the training data really do get learned into the weights</>,
        why: <><b>Cause:</b> "it has seen billions of images" sounds just like storing a giant stock library. In reality the weights store statistical patterns, not the images themselves — the only "raw material" at generation time is that random noise. But to be honest: it’s true that an artist’s style can be imitated, and whether the training data infringes copyright and whether style should be protected is a dispute still being fought out in lawsuits and legislation in 2025.</>,
      },
      {
        bad: <>AI draws the image in one instant "poof"</>,
        good: <>The standard procedure is dozens of iterative denoising steps, each erasing just a little noise</>,
        why: <><b>Cause:</b> the product interface only shows you the final result; the dozens of intermediate steps are hidden. There really are "instant image" products — those rely on acceleration techniques like distillation and consistency models, compressing dozens of steps into a few or even one, but that’s engineering speedup; the principle is still denoising.</>,
      },
    ],

    quizTitle: '✍️ Quick Quiz',
    quiz: [
      {
        q: '1. Explain to a friend in one sentence "what a diffusion model actually learned," and state separately what the training stage and the generation stage are each doing.',
        a: <>In one sentence: <b>what it learned is not painting, but "recovering a noised image a little bit."</b> In training: take real images, randomly add varying amounts of noise, and have the network guess "what noise was added"; in generation: start from a patch of pure noise and call this denoiser dozens of times over, and the image emerges from the snowstorm.</>,
      },
      {
        q: '2. A friend cranks the CFG guidance strength to the max and complains "the image is on-topic, but the colors are eye-searing and it looks plastic." Explain why and give advice.',
        a: <>CFG decides how much the model <b>obeys the text description</b>: crank it up and it’s more obedient, more on-topic, but overdo it and it over-amplifies the "matches the description" direction, with the typical side effects being oversaturated colors and a stiff image. The advice is to turn the guidance strength back to a middle setting, finding a balance between "on-topic" and "natural."</>,
      },
      {
        q: '3. True or false: "Stable Diffusion denoises directly on pixels step by step." Is it right? What does the latent space save it?',
        a: <><b>False.</b> Doing dozens of diffusion steps directly on millions of pixels is too expensive. Stable Diffusion first compresses the image into a far smaller <b>latent space</b>, completes all the denoising there, and only then decodes back to pixels — like first composing on a small draft and only coloring and scaling up after finalizing, saving compute by orders of magnitude.</>,
      },
    ],
  },
}

// ============================================================
// ① 50 步去噪
// ============================================================
function DenoiseDemo({ c }) {
  const { lang } = useLang()
  const canvasRef = useRef(null)
  const ctrlRef = useRef(null)
  const [step, setStep] = useState(0)
  const [pattern, setPattern] = useState('rings')
  const [caption, setCaption] = useState(c.dn1Caption)
  const [phase, setPhase] = useState('')
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const ctrl = createDenoise(canvasRef.current, {
      onUpdate: (s, cap, ph) => { setStep(s); setCaption(cap); setPhase(ph) },
      lang,
    })
    ctrlRef.current = ctrl
    return () => ctrl.dispose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 语言切换：只刷新演示内文案，不重置去噪动画。
  useEffect(() => {
    ctrlRef.current?.setLang(lang)
  }, [lang])

  const onSlider = (v) => { setPlaying(false); ctrlRef.current?.setStep(Math.round(v)) }
  const onPattern = (k) => { setPattern(k); ctrlRef.current?.setPattern(k) }
  const togglePlay = () => {
    ctrlRef.current?.play(() => {}, () => setPlaying(false))
    setPlaying(ctrlRef.current?.isPlaying() ?? false)
  }

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.dn1Title}</span>
        <span className="demo-hint">{c.dn1Hint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <div className="dn-stage">
            <div className="dn-frame"><canvas id="dn-canvas" ref={canvasRef} width="256" height="256" aria-label={c.dn1CanvasLabel} /></div>
            <div className="dn-caption">{caption}</div>
          </div>
        </div>
        <div className="demo-side">
          <h4>{c.dn1SideTitle}</h4>
          <div className="chips mt14">
            {c.dn1Patterns.map(([k, label]) => (
              <button key={k} className={`chip${k === pattern ? ' active' : ''}`} onClick={() => onPattern(k)}>{label}</button>
            ))}
          </div>
          <div className="mt14">
            <SliderRow label={c.dn1Steps} min={0} max={50} step={1} value={step} onChange={onSlider} format={(v) => Math.round(v)} />
          </div>
          <button className="dn-play" onClick={togglePlay}>{playing ? c.dn1Pause : c.dn1Play}</button>
          <p className="dn-phase">{phase}</p>
          <p className="footnote">{c.dn1Foot}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ② CFG 引导强度
// ============================================================
function CfgDemo({ c }) {
  const { lang } = useLang()
  const canvasRef = useRef(null)
  const ctrlRef = useRef(null)
  const [cfg, setCfg] = useState(7)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')

  useEffect(() => {
    const ctrl = createCfg(canvasRef.current, { onTier: (t, d) => { setTitle(t); setDesc(d) }, lang })
    ctrlRef.current = ctrl
    return () => ctrl.dispose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 语言切换：只刷新演示内文案，不重置 CFG 状态。
  useEffect(() => {
    ctrlRef.current?.setLang(lang)
  }, [lang])

  const onSlider = (v) => { const cv = Math.round(v); setCfg(cv); ctrlRef.current?.setCfg(cv) }

  return (
    <div className="card demo demo-slim mt14">
      <div className="demo-head">
        <span className="demo-title">{c.cfgTitle}</span>
        <span className="demo-hint">{c.cfgHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <div className="dn-stage">
            <div className="dn-frame"><canvas id="cfg-canvas" ref={canvasRef} width="180" height="180" aria-label={c.cfgCanvasLabel} /></div>
            <div className="dn-caption">{c.cfgPrompt}</div>
          </div>
        </div>
        <div className="demo-side">
          <SliderRow label={c.cfgSlider} min={1} max={20} step={1} value={cfg} onChange={onSlider} format={(v) => Math.round(v)} />
          <h4>{title}</h4>
          <p>{desc}</p>
          <p className="footnote">{c.cfgFoot}</p>
        </div>
      </div>
    </div>
  )
}

export default function L21() {
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

      <Lsec
        title={c.conceptTitle}
        lead={c.conceptLead}
      >
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
        <p className="lead mt14">{c.twoPhaseLead}</p>
        <div className="use-grid cols-2">
          <div className="card use-card"><div className="label">{c.phase1Label}</div><div className="en">{c.phase1En}</div><div className="zh">{c.phase1Zh}</div></div>
          <div className="card use-card"><div className="label">{c.phase2Label}</div><div className="en">{c.phase2En}</div><div className="zh">{c.phase2Zh}</div></div>
        </div>
        <p className="lead mt14">{c.whyNotOneStep}</p>
      </Lsec>

      <Lsec
        title={c.navTitle}
        lead={c.navLead}
      >
        <div className="card steps3-card">
          <div className="steps3">
            {c.navSteps.map((txt, i) => (
              <div className="step" key={i}><span className="num">{i + 1}</span><span className="txt">{txt}</span></div>
            ))}
          </div>
        </div>
        <CfgDemo c={c} />
        <p className="lead mt14">{c.latentPara}</p>
        <div className="use-grid">
          {c.routeCards.map((r, i) => (
            <div className="card use-card" key={i}><div className="label">{r.label}</div><div className="en">{r.en}</div><div className="zh">{r.zh}</div></div>
          ))}
        </div>
        <p className="footnote source-note">{c.navSourceNote}</p>
      </Lsec>

      <Lsec
        title={c.demoTitle}
        lead={c.demoLead}
      >
        <DenoiseDemo c={c} />
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
