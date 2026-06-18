import { useState } from 'react'
import { Lsec, SliderRow, Chips, Pill, QuizItem } from '../components/ui.jsx'
import { useLang } from '../i18n/LangContext.jsx'

const M = '−' // 数学负号
const fmt1 = (v) => (v < 0 ? M + Math.abs(v).toFixed(1) : v.toFixed(1))
const fmt2 = (v) => (v < 0 ? M + Math.abs(v).toFixed(2) : v.toFixed(2))

// 三种“性格”预设：只改参数（权重 + 偏置）
const PRESETS = {
  moody: { w1: 1.5, w2: -1.2, b: -0.5 },
  diehard: { w1: 0.2, w2: -0.3, b: 1.5 },
  picky: { w1: 1.5, w2: -2.0, b: -0.8 },
}

// 双语内容层：结构 / class / 交互均不变，仅文本按语言取用。
// 富文本（含 <b>）直接以 JSX 片段存储，渲染输出与单语版逐字一致。
const C = {
  zh: {
    demo: {
      title: '🎛️ 交互演示 · 今天要不要去跑步',
      hint: <>输出 &gt; 0.5 灯泡就亮</>,
      svgAria: '一个人工神经元：两个输入经权重连线汇入求和节点，加上偏置，经过激活函数，点亮输出灯泡',
      x1Label: '☀️ 天气 x₁',
      x2Label: '😪 疲劳 x₂',
      biasLabel: (v) => <>偏置 b = {v}</>,
      sumCap: '加权求和',
      actCap: '激活 σ',
      go: '去跑步！',
      stay: '在家休息',
      inputCap: '输入 · 今天的客观情况',
      x1Slider: '☀️ 天气好坏',
      x2Slider: '😪 疲劳程度',
      paramCap: '参数 · 神经元的“性格”（训练学的就是这三个数）',
      w1Slider: '权重 w₁',
      w2Slider: '权重 w₂',
      bSlider: '偏置 b',
      presetCap: '一键换“性格”（只改参数，不改今天的天气）',
      presets: [
        { key: 'moody', label: '爱晴怕累' },
        { key: 'diehard', label: '风雨无阻' },
        { key: 'picky', label: '晴天限定' },
      ],
      verdictGo: (y) => <><Pill type="sage">🏃 灯亮 · 去跑步！</Pill><span>输出 {y} &gt; 0.5</span></>,
      verdictStay: (y) => <><Pill type="ink">🛋️ 灯灭 · 在家休息</Pill><span>输出 {y} ≤ 0.5</span></>,
    },
    goalsTitle: '🎯 你将学会',
    goals: [
      '把任何神经元（neuron）看成一道“加权打分题”：每个因素乘上权重，加总过线就触发',
      '分清三件套的分工：权重（weight）管“在乎什么”、偏置（bias）管“门槛多高”、激活函数（activation function）管“转成输出”',
      '看穿“神经网络模拟大脑”的说法 —— 那只是一次松散的命名致敬',
      '亲手调过权重和偏置，提前领悟下一课的主题：训练 = 让机器自动调这些数字',
    ],
    conceptTitle: '💡 核心概念：神经元就是一道加权打分题',
    conceptLead:
      '你每天都在运行“神经元”。比如纠结要不要去跑步：天气好，加分；身体累，减分；而你对跑步这件事本来就有几分热情或抗拒，那是底分。心里把账一算，总分过了某条线，你就换鞋出门。人工神经元（artificial neuron）做的事很像 —— 接收几个数字，各乘一个权重加起来，再加一个偏置，最后问一句：过线了吗？',
    ex1: {
      en: <>跑步意愿 ＝ 天气 × <b>1.5</b> ＋ 疲劳 × <b>(−1.2)</b> ＋ 底分 <b>(−0.5)</b></>,
      zh: <>天气的权重是 +1.5：很在乎，晴天加分多；疲劳的权重是 −1.2：负权重就是减分项；底分 −0.5 说明你原本对跑步没有太强动力。总分过线，今天就去。</>,
    },
    ex2: {
      en: <>z = w₁x₁ + w₂x₂ + b　→　y = σ(z)</>,
      zh: <>整门深度学习的最小零件就这一行：输入 x 各乘权重 w（weight）求和，加偏置 b（bias）得到分数 z，再经激活函数 σ（activation function）转成最终输出 y。后面很多复杂模型，都可以看作大量这种小计算单元组合起来的结果。</>,
    },
    useCards: [
      {
        label: '三件套 · 之一',
        term: <>权重（<b>weight</b>）</>,
        body: <>每个输入的<b>重要性</b>。正权重加分、负权重减分，绝对值越大影响越大。关键在于：训练完成后的权重，主要是机器从数据里<b>学</b>出来的 —— 所谓“训练”，调的就是它。</>,
      },
      {
        label: '三件套 · 之二',
        term: <>偏置（<b>bias</b>）</>,
        body: <>不看任何输入的<b>底分</b>，决定门槛高低。偏置高，神经元轻易触发（风雨无阻去跑步）；偏置低，得攒够很多正分才触发（晴天限定）。门槛能高能低，决定才够灵活。</>,
      },
      {
        label: '三件套 · 之三',
        term: <>激活函数（<b>activation function</b>）</>,
        body: <>把分数 z <b>转成最终输出</b>的最后一道工序。sigmoid（常见 S 型激活函数）把任何分数压进 0~1，像一个“可能性”；ReLU（rectified linear unit）更干脆：负分一律归零，正分原样放行。没有它会怎样？往下看。</>,
      },
    ],
    brainTitle: '📖 名字借自大脑，本事全靠数学',
    brainLead: '上世纪 40 年代，研究者观察到生物神经元“信号汇总、过阈值就放电”的行为，从中抽出了这道打分题。对照关系如下 —— 但请记住，这只是一次松散的启发，不是模拟。',
    tableHead: ['生物神经元', '人工神经元', '它干的事'],
    tableRows: [
      { be: '树突', ae: '输入 x', ex: '接收上游传来的信号' },
      { be: '突触强度', ae: '权重 w', ex: '决定每路信号被放大还是削弱' },
      { be: '胞体', ae: '加权求和 + 激活', ex: '把信号汇总，过了阈值才“放电”' },
      { be: '轴突', ae: '输出 y', ex: '把结果传给下一个神经元' },
    ],
    brainFootnote: '⚠️ 真实神经元有化学递质、脉冲时序、上百种细胞类型，复杂程度完全不在一个量级。人工神经元只是借用了这个名字的简单函数。把它当成真正的“人造脑细胞”，会误导你理解后面的内容。',
    brainSourceNote: <>依据：人工神经元的早期数学模型，可追溯到 McCulloch 与 Pitts 1943 年论文 <a href="https://doi.org/10.1007/BF02478259" target="_blank" rel="noreferrer">A Logical Calculus of the Ideas Immanent in Nervous Activity</a>。</>,
    actTitle: '🚦 为什么必须有激活函数',
    actLead: '三件套里最不起眼的激活函数，恰恰是整座大厦的承重墙。一组对照看明白：',
    contrastNoTag: '去掉激活函数',
    contrastNoBig: <>叠一万层，<span className="gap">还是一条直线</span></>,
    contrastNoNote: '直线套直线还是直线：w₂(w₁x + b₁) + b₂ 整理一下，无非是另一条直线。层数再多，整个网络也只会画直线 —— 连“晴天但太累就不去”这种拐弯逻辑都表达不了。',
    contrastYesTag: '加上激活函数',
    contrastYesBig: <>每一层都能<span className="hl">拐一个弯</span></>,
    contrastYesNote: '激活函数给直线注入“弯折”。一层拐一个弯，层层叠起来就能围出任意复杂的边界 —— 从认出一只猫到续写一句话。层层弯折如何叠出智能，第 6 课揭晓。',
    actSourceNote: <>依据：sigmoid 和 ReLU 都是常见激活函数；ReLU 的早期深度学习论文引用，可参见 Nair 与 Hinton 2010 年论文 <a href="https://www.cs.toronto.edu/~hinton/absps/reluICML.pdf" target="_blank" rel="noreferrer">Rectified Linear Units Improve Restricted Boltzmann Machines</a>。</>,
    actDiagram: {
      aria: '激活函数作用对照图：没有激活函数时多层仍是一条直线，有激活函数时每层都能弯折，组合成复杂边界',
      title: '激活函数让网络学会“拐弯”',
      leftTitle: '没有激活函数',
      leftSub: '直线叠直线，还是直线',
      rightTitle: '加上激活函数',
      rightSub: '每层一个弯，组合出复杂边界',
      inputA: '晴天',
      inputB: '疲劳',
      yes: '去跑步',
      no: '不去',
    },
    demoTitle: '🎛️ 交互演示：亲手调一个会做决定的神经元',
    demoLead: '这个神经元只关心两件事：天气和疲劳。左图的连线就是权重 —— 绿色加分、红色减分、越粗越在乎。拖动右侧滑块，试试两个实验：把“疲劳”的权重 w₂ 调到 0 会怎样？把偏置 b 拉到 +2 又会怎样？',
    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      {
        bad: '神经网络在模拟人类大脑',
        good: '它只借了“汇总信号、过线触发”这点松散直觉，本质是纯数学函数',
        why: <><b>病因：</b>“神经网络”“神经元”这些名字起得太成功，媒体配图又总爱放发光的大脑。实际上现代深度学习的进展靠的是数学和算力，几乎不参考脑科学的最新发现 —— 就像飞机受鸟启发，但不靠扑翅膀飞。</>,
      },
      {
        bad: '一个神经元就已经有点智能了',
        good: '单个神经元只能画一条分界直线，连“两个输入不同才触发”的异或（XOR）都学不会',
        why: <><b>病因：</b>把“能做决定”误当成“聪明”。你刚才在演示里看到的，只是一次简单的加权计算。智能不在零件里，而在亿万个零件的组织方式里 —— 一粒沙不是城堡，但亿万粒沙可以是。</>,
      },
    ],
    quizTitle: '✍️ 小练习',
    quiz: [
      {
        q: '1. 用“加权打分题”拆解一个新场景：深夜纠结要不要点外卖。说出至少两个输入、各自权重的正负，以及“偏置很高”对应什么样的人。',
        a: <>参考：<b>饥饿程度是正权重输入</b>（越饿加分越多），<b>价格或罪恶感是负权重输入</b>（减分项）。偏置很高 = 即使不太饿也很容易点外卖的人 —— 还没看任何输入，底分就快过线了。输入可以随意换，权重正负讲得通就算对。</>,
      },
      {
        q: '2. 回到演示：把 w₂（疲劳的权重）调到 0，神经元的行为有什么变化？再把偏置 b 拉到 +2 呢？',
        a: <>w₂ = 0 时，“疲劳”这路输入<b>彻底失效</b> —— 再怎么拖疲劳滑块，输出几乎不会变化：权重为零等于完全不在乎。b = +2 时门槛极低，几乎什么天气都“去跑步”—— <b>偏置决定的是不看输入的基础倾向</b>。</>,
      },
      {
        q: '3. 判断：把三个“没有激活函数”的神经元层层串联，能学会比一条直线更复杂的边界吗？',
        a: <><b>不能。</b>线性函数套线性函数还是线性函数，三层串联等效于一层，画出来仍是一条直线。这正是激活函数不可省略的原因 —— 也是第 6 课“层层抽象”的起点。</>,
      },
    ],
  },

  en: {
    demo: {
      title: '🎛️ Interactive · Go for a Run Today or Not',
      hint: <>The bulb lights up when the output &gt; 0.5</>,
      svgAria: 'An artificial neuron: two inputs flow through weighted edges into a summation node, add a bias, pass through an activation function, and light up the output bulb',
      x1Label: '☀️ Weather x₁',
      x2Label: '😪 Fatigue x₂',
      biasLabel: (v) => <>Bias b = {v}</>,
      sumCap: 'Weighted sum',
      actCap: 'Activation σ',
      go: 'Go run!',
      stay: 'Stay home',
      inputCap: 'Inputs · today’s objective situation',
      x1Slider: '☀️ How good the weather is',
      x2Slider: '😪 How tired you are',
      paramCap: 'Parameters · the neuron’s “personality” (these three numbers are what training learns)',
      w1Slider: 'Weight w₁',
      w2Slider: 'Weight w₂',
      bSlider: 'Bias b',
      presetCap: 'Swap “personality” in one click (only the parameters change, not today’s weather)',
      presets: [
        { key: 'moody', label: 'Sun-lover, fatigue-averse' },
        { key: 'diehard', label: 'Come rain or shine' },
        { key: 'picky', label: 'Sunny days only' },
      ],
      verdictGo: (y) => <><Pill type="sage">🏃 Bulb on · Go run!</Pill><span>output {y} &gt; 0.5</span></>,
      verdictStay: (y) => <><Pill type="ink">🛋️ Bulb off · Stay home</Pill><span>output {y} ≤ 0.5</span></>,
    },
    goalsTitle: '🎯 What You’ll Learn',
    goals: [
      'See any neuron as a “weighted scoring problem”: each factor times its weight, summed, fires once it crosses the line',
      'Tell apart the trio’s roles: weights decide “what to care about,” bias decides “how high the threshold,” the activation function decides “how to squeeze it into a decision”',
      'See through the claim that “neural networks simulate the brain” — it’s just a loose naming tribute',
      'Tune weights and biases yourself, and get a head start on the next lesson’s theme: training = letting the machine adjust these numbers automatically',
    ],
    conceptTitle: '💡 Core Idea: A Neuron Is Just a Weighted Scoring Problem',
    conceptLead:
      'You run “neurons” every day. Take deciding whether to go for a run: good weather adds points; being tired subtracts points; and you already have some baseline enthusiasm or reluctance toward running — that’s the base score. You tally it up in your head, the total crosses some line, and you lace up and head out. An artificial neuron does exactly the same — it takes a few numbers, multiplies each by a weight and adds them up, adds a bias, then asks one question: did it cross the line?',
    ex1: {
      en: <>Willingness to run ＝ weather × <b>1.5</b> ＋ fatigue × <b>(−1.2)</b> ＋ base score <b>(−0.5)</b></>,
      zh: <>Weather’s weight is +1.5: you care a lot, so sunshine adds plenty; fatigue’s weight is −1.2: a negative weight is a subtractor; the base score −0.5 says you’re not that keen on running. Total crosses the line, so today you go.</>,
    },
    ex2: {
      en: <>z = w₁x₁ + w₂x₂ + b　→　y = σ(z)</>,
      zh: <>The smallest building block of all of deep learning is this one line: multiply each input x by a weight w and sum, add the bias b to get the score z, then squeeze it through the activation function σ into the final output y. Everything in the next 27 lessons is just billions of permutations of this one formula.</>,
    },
    useCards: [
      {
        label: 'The trio · part one',
        term: <>Weight <b>Weight</b></>,
        body: <>The <b>importance</b> of each input. Positive weights add points, negative weights subtract, and the larger the magnitude the bigger the effect. The key: weights aren’t set by people but <b>learned</b> by the machine from data — what “training” adjusts is exactly these.</>,
      },
      {
        label: 'The trio · part two',
        term: <>Bias <b>Bias</b></>,
        body: <>The <b>base score</b> that ignores every input, deciding how high the threshold is. A high bias makes the neuron fire easily (run come rain or shine); a low bias requires piling up lots of positive points before it fires (sunny days only). A threshold that can go high or low is what makes decisions flexible.</>,
      },
      {
        label: 'The trio · part three',
        term: <>Activation Function <b>Activation</b></>,
        body: <>The final step that <b>squeezes the score z into a decision</b>. Sigmoid squeezes any score into 0~1, like a “probability”; ReLU is blunter: any negative score becomes zero, positive scores pass through unchanged. What happens without it? Read on.</>,
      },
    ],
    brainTitle: '📖 The Name Is Borrowed from the Brain, the Power Is All Math',
    brainLead: 'Back in the 1940s, researchers observed biological neurons “summing signals and firing once a threshold is crossed,” and abstracted this scoring problem from it. The correspondence is below — but remember, this is only a loose inspiration, not a simulation.',
    tableHead: ['Biological neuron', 'Artificial neuron', 'What it does'],
    tableRows: [
      { be: 'Dendrites', ae: 'Inputs x', ex: 'Receive signals coming from upstream' },
      { be: 'Synaptic strength', ae: 'Weights w', ex: 'Decide whether each signal is amplified or dampened' },
      { be: 'Cell body', ae: 'Weighted sum + activation', ex: 'Sum the signals and only “fire” past the threshold' },
      { be: 'Axon', ae: 'Output y', ex: 'Pass the result to the next neuron' },
    ],
    brainFootnote: '⚠️ Real neurons have chemical neurotransmitters, spike timing, and hundreds of cell types — the complexity is in a completely different league. An artificial neuron is just a simple function that borrowed a nice name — picturing it as a “silicon brain cell” is the first filter this course will help you take off.',
    brainSourceNote: <>Source: the early mathematical model of artificial neurons traces back to McCulloch and Pitts’ 1943 paper <a href="https://doi.org/10.1007/BF02478259" target="_blank" rel="noreferrer">A Logical Calculus of the Ideas Immanent in Nervous Activity</a>.</>,
    actTitle: '🚦 Why an Activation Function Is a Must',
    actLead: 'The most unassuming member of the trio, the activation function, is precisely the load-bearing wall of the whole edifice. One side-by-side makes it clear:',
    contrastNoTag: 'Remove the activation function',
    contrastNoBig: <>Stack ten thousand layers, <span className="gap">still a single straight line</span></>,
    contrastNoNote: 'A line inside a line is still a line: tidy up w₂(w₁x + b₁) + b₂ and it’s just another straight line. No matter how many layers, the whole network can only draw straight lines — it can’t even express turning logic like “sunny but too tired, so skip it.”',
    contrastYesTag: 'Add the activation function',
    contrastYesBig: <>Every layer can <span className="hl">make a turn</span></>,
    contrastYesNote: 'The activation function injects “bends” into the lines. One layer makes one turn, and stacking them layer by layer can enclose an arbitrarily complex boundary — from recognizing a cat to catching a sentence. How layered bends stack into intelligence is revealed in Lesson 6.',
    actSourceNote: <>Source: sigmoid and ReLU are standard activation functions; for an early deep learning reference on ReLU, see Nair and Hinton’s 2010 paper <a href="https://www.cs.toronto.edu/~hinton/absps/reluICML.pdf" target="_blank" rel="noreferrer">Rectified Linear Units Improve Restricted Boltzmann Machines</a>.</>,
    actDiagram: {
      aria: 'Activation function comparison diagram: without activation, multiple layers still form a straight line; with activation, each layer can bend and combine into a complex boundary',
      title: 'Activation functions let networks “bend”',
      leftTitle: 'No activation function',
      leftSub: 'Line on line, still a line',
      rightTitle: 'With activation',
      rightSub: 'Layer by layer, bends form complex boundaries',
      inputA: 'Weather',
      inputB: 'Fatigue',
      yes: 'Go run',
      no: 'Skip',
    },
    demoTitle: '🎛️ Interactive: Sculpt a Decision-Making Neuron by Hand',
    demoLead: 'This neuron cares about only two things: weather and fatigue. The edges in the left diagram are the weights — green adds points, red subtracts, and thicker means it cares more. Drag the sliders on the right and try two experiments: what happens if you set “fatigue’s” weight w₂ to 0? And if you pull the bias b up to +2?',
    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      {
        bad: 'Neural networks simulate the human brain',
        good: 'It only borrowed the loose intuition of “summing signals and firing past a line”; at heart it’s a pure mathematical function',
        why: <><b>Cause:</b> names like “neural network” and “neuron” were coined too successfully, and media illustrations always love putting a glowing brain. In reality, modern deep learning’s progress relies on math and compute, and barely references the latest findings in brain science — just as airplanes were inspired by birds but don’t fly by flapping wings.</>,
      },
      {
        bad: 'A single neuron is already a bit intelligent',
        good: 'A single neuron can only draw one dividing line, and can’t even learn “fire only when the two inputs differ” (XOR)',
        why: <><b>Cause:</b> mistaking “being able to make a decision” for “being smart.” What you just saw in the demo is only a grade-school arithmetic problem. Intelligence isn’t in the parts but in how billions of parts are organized — one grain of sand isn’t a castle, but billions of grains can be.</>,
      },
    ],
    quizTitle: '✍️ Quick Quiz',
    quiz: [
      {
        q: '1. Use the “weighted scoring problem” to break down a new scenario: late at night, debating whether to order takeout. Name at least two inputs, the sign of each weight, and what kind of person a “very high bias” corresponds to.',
        a: <>Reference: <b>hunger is a positive-weight input</b> (the hungrier, the more points), <b>price or guilt is a negative-weight input</b> (a subtractor). A very high bias = the “takeout-dependent” type who wants to order even when not hungry — before looking at any input, the base score has nearly crossed the line. You can swap the inputs freely; as long as the signs of the weights make sense, it counts as correct.</>,
      },
      {
        q: '2. Back to the demo: set w₂ (fatigue’s weight) to 0 — how does the neuron’s behavior change? And then pull the bias b up to +2?',
        a: <>When w₂ = 0, the “fatigue” input <b>becomes completely ineffective</b> — drag the fatigue slider all you like and the output doesn’t budge: a zero weight means caring not at all. When b = +2 the threshold is extremely low, and it’s “go run” in almost any weather — <b>the bias determines the baseline tendency that ignores the inputs</b>.</>,
      },
      {
        q: '3. True or false: chaining three neuron layers “without activation functions” one after another, can it learn a boundary more complex than a single straight line?',
        a: <><b>No.</b> A linear function inside a linear function is still linear; three layers chained together are equivalent to one layer and still draw a single straight line. This is exactly why the activation function can’t be omitted — and the starting point of Lesson 6’s “layered abstraction.”</>,
      },
    ],
  },
}

function NeuronDemo({ c }) {
  const [x1, setX1] = useState(0.8)
  const [x2, setX2] = useState(0.3)
  const [w1, setW1] = useState(1.5)
  const [w2, setW2] = useState(-1.2)
  const [b, setB] = useState(-0.5)
  const [preset, setPreset] = useState('moody')

  const z = w1 * x1 + w2 * x2 + b
  const y = 1 / (1 + Math.exp(-z))
  const go = y > 0.5

  // 改参数时取消预设高亮；选预设时套用参数
  const onParam = (setter) => (v) => { setter(v); setPreset(null) }
  const applyPreset = (key) => {
    const p = PRESETS[key]
    setW1(p.w1); setW2(p.w2); setB(p.b); setPreset(key)
  }

  const edgeColor = (w) => (w > 0 ? 'var(--sage)' : w < 0 ? 'var(--terracotta)' : 'var(--fg-2)')
  const edgeWidth = (w) => (1 + Math.abs(w) * 2.6).toFixed(2)
  const edgeOpacity = (w) => Math.min(1, 0.45 + Math.abs(w) * 0.28).toFixed(2)

  const expr =
    fmt1(w1) + '×' + x1.toFixed(2) +
    (w2 < 0 ? ' ' + M + ' ' : ' + ') + Math.abs(w2).toFixed(1) + '×' + x2.toFixed(2) +
    (b < 0 ? ' ' + M + ' ' : ' + ') + Math.abs(b).toFixed(1)

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.title}</span>
        <span className="demo-hint">{c.hint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="neuron-svg" viewBox="0 0 440 280" width="420" role="img" aria-label={c.svgAria}>
            <line className="w-edge" x1="86" y1="92" x2="188" y2="138" stroke={edgeColor(w1)} strokeWidth={edgeWidth(w1)} strokeOpacity={edgeOpacity(w1)} strokeLinecap="round" />
            <line className="w-edge" x1="86" y1="208" x2="188" y2="162" stroke={edgeColor(w2)} strokeWidth={edgeWidth(w2)} strokeOpacity={edgeOpacity(w2)} strokeLinecap="round" />
            <text x="128" y="100" textAnchor="middle" fontSize="12" fontWeight="700" fill={edgeColor(w1)}>w₁ = {fmt1(w1)}</text>
            <text x="128" y="202" textAnchor="middle" fontSize="12" fontWeight="700" fill={edgeColor(w2)}>w₂ = {fmt1(w2)}</text>

            <text x="62" y="46" textAnchor="middle" fontSize="12" fill="var(--fg-1)">{c.x1Label}</text>
            <circle className="soft" cx="62" cy="86" r="24" fill="var(--sky)" fillOpacity={(0.15 + 0.55 * x1).toFixed(2)} stroke="var(--sky)" strokeWidth="1.5" />
            <text x="62" y="91" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--fg-0)">{x1.toFixed(2)}</text>

            <circle className="soft" cx="62" cy="214" r="24" fill="var(--sky)" fillOpacity={(0.15 + 0.55 * x2).toFixed(2)} stroke="var(--sky)" strokeWidth="1.5" />
            <text x="62" y="219" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--fg-0)">{x2.toFixed(2)}</text>
            <text x="62" y="262" textAnchor="middle" fontSize="12" fill="var(--fg-1)">{c.x2Label}</text>

            <text x="214" y="82" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--fg-1)">{c.biasLabel(fmt1(b))}</text>
            <line x1="214" y1="92" x2="214" y2="112" stroke="var(--fg-2)" strokeWidth="1.5" strokeDasharray="4 4" />
            <polygon points="209,110 214,120 219,110" fill="var(--fg-2)" />

            <circle cx="214" cy="150" r="28" fill="var(--bg-inset)" stroke="var(--hairline-strong)" strokeWidth="1.5" />
            <text x="214" y="157" textAnchor="middle" fontSize="19" fontWeight="700" fill="var(--fg-0)">Σ</text>
            <text x="214" y="196" textAnchor="middle" fontSize="11" fill="var(--fg-2)">{c.sumCap}</text>
            <text x="214" y="213" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="var(--fg-0)">z = {fmt2(z)}</text>

            <line x1="242" y1="150" x2="274" y2="150" stroke="var(--fg-2)" strokeWidth="1.5" />
            <polygon points="272,145 281,150 272,155" fill="var(--fg-2)" />

            <rect x="284" y="124" width="52" height="52" rx="12" fill="var(--amber-bg)" stroke="var(--amber)" strokeWidth="1.5" />
            <path d="M 292 162 C 306 162, 306 138, 320 138" fill="none" stroke="var(--amber)" strokeWidth="2.5" strokeLinecap="round" />
            <text x="310" y="194" textAnchor="middle" fontSize="11" fill="var(--fg-2)">{c.actCap}</text>

            <line x1="336" y1="150" x2="364" y2="150" stroke="var(--fg-2)" strokeWidth="1.5" />
            <polygon points="360,145 369,150 360,155" fill="var(--fg-2)" />

            <circle className="soft" cx="398" cy="146" r="26" fill="var(--amber)" opacity={go ? 0.35 : 0} />
            <g className="soft" stroke="var(--amber)" strokeWidth="2.5" strokeLinecap="round" opacity={go ? 1 : 0}>
              <line x1="398" y1="121" x2="398" y2="112" />
              <line x1="380" y1="128" x2="373" y2="121" />
              <line x1="416" y1="128" x2="423" y2="121" />
              <line x1="421" y1="146" x2="430" y2="146" />
            </g>
            <circle className="soft" cx="398" cy="146" r="17" fill={go ? 'var(--amber)' : 'var(--bg-inset)'} stroke={go ? 'var(--amber)' : 'var(--fg-2)'} strokeWidth="2" />
            <rect x="391" y="164" width="14" height="8" rx="2" fill="var(--fg-2)" />
            <text x="398" y="196" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--fg-0)">σ(z) = {y.toFixed(2)}</text>
            <text x="398" y="214" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={go ? 'var(--sage)' : 'var(--fg-2)'}>{go ? c.go : c.stay}</text>
          </svg>
        </div>
        <div className="demo-side">
          <div className="param-cap">{c.inputCap}</div>
          <SliderRow label={c.x1Slider} min={0} max={1} step={0.05} value={x1} onChange={setX1} format={(v) => v.toFixed(2)} />
          <SliderRow label={c.x2Slider} min={0} max={1} step={0.05} value={x2} onChange={setX2} format={(v) => v.toFixed(2)} />

          <div className="param-cap">{c.paramCap}</div>
          <SliderRow label={c.w1Slider} min={-2} max={2} step={0.1} value={w1} onChange={onParam(setW1)} format={fmt1} />
          <SliderRow label={c.w2Slider} min={-2} max={2} step={0.1} value={w2} onChange={onParam(setW2)} format={fmt1} />
          <SliderRow label={c.bSlider} min={-2} max={2} step={0.1} value={b} onChange={onParam(setB)} format={fmt1} />

          <div className="param-cap">{c.presetCap}</div>
          <Chips
            options={c.presets}
            value={preset}
            onChange={applyPreset}
          />

          <div className="neu-readout">
            <div className="ro-line">z = {expr} = <b>{fmt2(z)}</b></div>
            <div className="ro-line">σ(z) = <b>{y.toFixed(2)}</b></div>
            <div className="neu-verdict">
              {go ? c.verdictGo(y.toFixed(2)) : c.verdictStay(y.toFixed(2))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ActivationBendDiagram({ c }) {
  return (
    <div className="card act-diagram-card">
      <svg id="act-bend-svg" viewBox="0 0 680 310" role="img" aria-label={c.aria}>
        <defs>
          <marker id="act-arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="var(--fg-2)" />
          </marker>
        </defs>
        <text x="24" y="34" fontSize="17" fontWeight="800" fill="var(--fg-0)">{c.title}</text>

        <g>
          <rect x="24" y="62" width="292" height="214" rx="16" fill="var(--bg-inset)" stroke="var(--hairline-strong)" strokeWidth="1.5" />
          <text x="44" y="94" fontSize="15" fontWeight="800" fill="var(--fg-0)">{c.leftTitle}</text>
          <text x="44" y="116" fontSize="12.5" fill="var(--fg-1)">{c.leftSub}</text>
          <line x1="74" y1="226" x2="272" y2="112" stroke="var(--terracotta)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="112" cy="204" r="5" fill="var(--terracotta)" />
          <circle cx="160" cy="176" r="5" fill="var(--terracotta)" />
          <circle cx="216" cy="144" r="5" fill="var(--terracotta)" />
          <path d="M74 244 L284 244 M74 244 L74 92" fill="none" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#act-arr)" />
          <text x="284" y="264" textAnchor="end" fontSize="11.5" fill="var(--fg-2)">{c.inputA}</text>
          <text x="110" y="252" fontSize="12.5" fill="var(--fg-1)">{c.no}</text>
          <text x="218" y="126" fontSize="12.5" fill="var(--fg-1)">{c.yes}</text>
        </g>

        <g>
          <rect x="364" y="62" width="292" height="214" rx="16" fill="var(--sage-bg)" stroke="var(--sage)" strokeWidth="1.5" />
          <text x="384" y="94" fontSize="15" fontWeight="800" fill="var(--fg-0)">{c.rightTitle}</text>
          <text x="384" y="116" fontSize="12.5" fill="var(--fg-1)">{c.rightSub}</text>
          <path d="M 408 226 C 454 232, 474 204, 486 178 C 504 138, 546 124, 612 112" fill="none" stroke="var(--sage)" strokeWidth="3" strokeLinecap="round" />
          <path d="M 414 224 L 468 204 L 510 164 L 552 132 L 614 112" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 5" opacity="0.9" />
          <circle cx="438" cy="220" r="5" fill="var(--terracotta)" />
          <circle cx="474" cy="202" r="5" fill="var(--terracotta)" />
          <circle cx="518" cy="150" r="5" fill="var(--sage)" />
          <circle cx="586" cy="118" r="5" fill="var(--sage)" />
          <path d="M414 244 L624 244 M414 244 L414 92" fill="none" stroke="var(--fg-2)" strokeWidth="1.2" markerEnd="url(#act-arr)" />
          <text x="624" y="264" textAnchor="end" fontSize="11.5" fill="var(--fg-2)">{c.inputA}</text>
          <text x="430" y="252" fontSize="12.5" fill="var(--fg-1)">{c.no}</text>
          <text x="570" y="134" fontSize="12.5" fill="var(--fg-1)">{c.yes}</text>
        </g>
      </svg>
    </div>
  )
}

export default function L03() {
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
        <div className="example">
          <div className="en">{c.ex1.en}</div>
          <div className="zh">{c.ex1.zh}</div>
        </div>
        <div className="example">
          <div className="en">{c.ex2.en}</div>
          <div className="zh">{c.ex2.zh}</div>
        </div>
        <div className="use-grid" style={{ marginTop: 14 }}>
          {c.useCards.map((u, i) => (
            <div className="card use-card" key={i}>
              <div className="label">{u.label}</div>
              <div className="en">{u.term}</div>
              <div className="zh">{u.body}</div>
            </div>
          ))}
        </div>
      </Lsec>

      <Lsec
        title={c.brainTitle}
        lead={c.brainLead}
      >
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="match">
            <thead>
              <tr><th>{c.tableHead[0]}</th><th>{c.tableHead[1]}</th><th>{c.tableHead[2]}</th></tr>
            </thead>
            <tbody>
              {c.tableRows.map((r, i) => (
                <tr key={i}><td className="be">{r.be}</td><td className="be">{r.ae}</td><td className="ex">{r.ex}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="footnote" style={{ marginTop: 10 }}>{c.brainFootnote}</p>
        <p className="footnote source-note">{c.brainSourceNote}</p>
      </Lsec>

      <Lsec
        title={c.actTitle}
        lead={c.actLead}
      >
        <ActivationBendDiagram c={c.actDiagram} />
        <div className="contrast">
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-terracotta">{c.contrastNoTag}</span></div>
            <div className="big">{c.contrastNoBig}</div>
            <p className="note">{c.contrastNoNote}</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">{c.contrastYesTag}</span></div>
            <div className="big">{c.contrastYesBig}</div>
            <p className="note">{c.contrastYesNote}</p>
          </div>
        </div>
        <p className="footnote source-note">{c.actSourceNote}</p>
      </Lsec>

      <Lsec
        title={c.demoTitle}
        lead={c.demoLead}
      >
        <NeuronDemo c={c.demo} />
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
    </>
  )
}
