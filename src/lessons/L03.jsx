import { useState } from 'react'
import { Lsec, SliderRow, Chips, Pill, QuizItem } from '../components/ui.jsx'

const M = '−' // 数学负号
const fmt1 = (v) => (v < 0 ? M + Math.abs(v).toFixed(1) : v.toFixed(1))
const fmt2 = (v) => (v < 0 ? M + Math.abs(v).toFixed(2) : v.toFixed(2))

// 三种“性格”预设：只改参数（权重 + 偏置）
const PRESETS = {
  moody: { w1: 1.5, w2: -1.2, b: -0.5 },
  diehard: { w1: 0.2, w2: -0.3, b: 1.5 },
  picky: { w1: 1.5, w2: -2.0, b: -0.8 },
}

function NeuronDemo() {
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
        <span className="demo-title">🎛️ 交互演示 · 今天要不要去跑步</span>
        <span className="demo-hint">输出 &gt; 0.5 灯泡就亮</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="neuron-svg" viewBox="0 0 440 280" width="420" role="img" aria-label="一个人工神经元：两个输入经权重连线汇入求和节点，加上偏置，经过激活函数，点亮输出灯泡">
            <line className="w-edge" x1="86" y1="92" x2="188" y2="138" stroke={edgeColor(w1)} strokeWidth={edgeWidth(w1)} strokeOpacity={edgeOpacity(w1)} strokeLinecap="round" />
            <line className="w-edge" x1="86" y1="208" x2="188" y2="162" stroke={edgeColor(w2)} strokeWidth={edgeWidth(w2)} strokeOpacity={edgeOpacity(w2)} strokeLinecap="round" />
            <text x="128" y="100" textAnchor="middle" fontSize="12" fontWeight="700" fill={edgeColor(w1)}>w₁ = {fmt1(w1)}</text>
            <text x="128" y="202" textAnchor="middle" fontSize="12" fontWeight="700" fill={edgeColor(w2)}>w₂ = {fmt1(w2)}</text>

            <text x="62" y="46" textAnchor="middle" fontSize="12" fill="var(--fg-1)">☀️ 天气 x₁</text>
            <circle className="soft" cx="62" cy="86" r="24" fill="var(--sky)" fillOpacity={(0.15 + 0.55 * x1).toFixed(2)} stroke="var(--sky)" strokeWidth="1.5" />
            <text x="62" y="91" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--fg-0)">{x1.toFixed(2)}</text>

            <circle className="soft" cx="62" cy="214" r="24" fill="var(--sky)" fillOpacity={(0.15 + 0.55 * x2).toFixed(2)} stroke="var(--sky)" strokeWidth="1.5" />
            <text x="62" y="219" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--fg-0)">{x2.toFixed(2)}</text>
            <text x="62" y="262" textAnchor="middle" fontSize="12" fill="var(--fg-1)">😪 疲劳 x₂</text>

            <text x="214" y="82" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--fg-1)">偏置 b = {fmt1(b)}</text>
            <line x1="214" y1="92" x2="214" y2="112" stroke="var(--fg-2)" strokeWidth="1.5" strokeDasharray="4 4" />
            <polygon points="209,110 214,120 219,110" fill="var(--fg-2)" />

            <circle cx="214" cy="150" r="28" fill="var(--bg-inset)" stroke="var(--hairline-strong)" strokeWidth="1.5" />
            <text x="214" y="157" textAnchor="middle" fontSize="19" fontWeight="700" fill="var(--fg-0)">Σ</text>
            <text x="214" y="196" textAnchor="middle" fontSize="11" fill="var(--fg-2)">加权求和</text>
            <text x="214" y="213" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="var(--fg-0)">z = {fmt2(z)}</text>

            <line x1="242" y1="150" x2="274" y2="150" stroke="var(--fg-2)" strokeWidth="1.5" />
            <polygon points="272,145 281,150 272,155" fill="var(--fg-2)" />

            <rect x="284" y="124" width="52" height="52" rx="12" fill="var(--amber-bg)" stroke="var(--amber)" strokeWidth="1.5" />
            <path d="M 292 162 C 306 162, 306 138, 320 138" fill="none" stroke="var(--amber)" strokeWidth="2.5" strokeLinecap="round" />
            <text x="310" y="194" textAnchor="middle" fontSize="11" fill="var(--fg-2)">激活 σ</text>

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
            <text x="398" y="214" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={go ? 'var(--sage)' : 'var(--fg-2)'}>{go ? '去跑步！' : '在家休息'}</text>
          </svg>
        </div>
        <div className="demo-side">
          <div className="param-cap">输入 · 今天的客观情况</div>
          <SliderRow label="☀️ 天气好坏" min={0} max={1} step={0.05} value={x1} onChange={setX1} format={(v) => v.toFixed(2)} />
          <SliderRow label="😪 疲劳程度" min={0} max={1} step={0.05} value={x2} onChange={setX2} format={(v) => v.toFixed(2)} />

          <div className="param-cap">参数 · 神经元的“性格”（训练学的就是这三个数）</div>
          <SliderRow label="权重 w₁" min={-2} max={2} step={0.1} value={w1} onChange={onParam(setW1)} format={fmt1} />
          <SliderRow label="权重 w₂" min={-2} max={2} step={0.1} value={w2} onChange={onParam(setW2)} format={fmt1} />
          <SliderRow label="偏置 b" min={-2} max={2} step={0.1} value={b} onChange={onParam(setB)} format={fmt1} />

          <div className="param-cap">一键换“性格”（只改参数，不改今天的天气）</div>
          <Chips
            options={[
              { key: 'moody', label: '爱晴怕累' },
              { key: 'diehard', label: '风雨无阻' },
              { key: 'picky', label: '晴天限定' },
            ]}
            value={preset}
            onChange={applyPreset}
          />

          <div className="neu-readout">
            <div className="ro-line">z = {expr} = <b>{fmt2(z)}</b></div>
            <div className="ro-line">σ(z) = <b>{y.toFixed(2)}</b></div>
            <div className="neu-verdict">
              {go ? (
                <><Pill type="sage">🏃 灯亮 · 去跑步！</Pill><span>输出 {y.toFixed(2)} &gt; 0.5</span></>
              ) : (
                <><Pill type="ink">🛋️ 灯灭 · 在家休息</Pill><span>输出 {y.toFixed(2)} ≤ 0.5</span></>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function L03() {
  return (
    <>
      <Lsec title="🎯 你将学会">
        <div className="card goals">
          <div className="goal-item"><span className="tick">✓</span>把任何神经元看成一道“加权打分题”：每个因素乘上权重，加总过线就触发</div>
          <div className="goal-item"><span className="tick">✓</span>分清三件套的分工：权重管“在乎什么”、偏置管“门槛多高”、激活函数管“压成决定”</div>
          <div className="goal-item"><span className="tick">✓</span>看穿“神经网络模拟大脑”的说法 —— 那只是一次松散的命名致敬</div>
          <div className="goal-item"><span className="tick">✓</span>亲手调过权重和偏置，提前领悟下一课的主题：训练 = 让机器自动调这些数字</div>
        </div>
      </Lsec>

      <Lsec
        title="💡 核心概念：神经元就是一道加权打分题"
        lead="你每天都在运行“神经元”。比如纠结要不要去跑步：天气好，加分；身体累，减分；而你对跑步这件事本来就有几分热情或抗拒，那是底分。心里把账一算，总分过了某条线，鞋一蹬就出门。人工神经元做的事一模一样 —— 接收几个数字，各乘一个权重加起来，再加一个偏置，最后问一句：过线了吗？"
      >
        <div className="example">
          <div className="en">跑步意愿 ＝ 天气 × <b>1.5</b> ＋ 疲劳 × <b>(−1.2)</b> ＋ 底分 <b>(−0.5)</b></div>
          <div className="zh">天气的权重是 +1.5：很在乎，晴天加分多；疲劳的权重是 −1.2：负权重就是减分项；底分 −0.5 说明你对跑步并不上头。总分过线，今天就去。</div>
        </div>
        <div className="example">
          <div className="en">z = w₁x₁ + w₂x₂ + b　→　y = σ(z)</div>
          <div className="zh">整门深度学习的最小零件就这一行：输入 x 各乘权重 w 求和，加偏置 b 得到分数 z，再经激活函数 σ 压成最终输出 y。后面 27 课讲的一切，都是亿万份这行算式的排列组合。</div>
        </div>
        <div className="use-grid" style={{ marginTop: 14 }}>
          <div className="card use-card">
            <div className="label">三件套 · 之一</div>
            <div className="en">权重 <b>Weight</b></div>
            <div className="zh">每个输入的<b>重要性</b>。正权重加分、负权重减分，绝对值越大影响越大。关键在于：权重不是人设定的，而是机器从数据里<b>学</b>出来的 —— 所谓“训练”，调的就是它。</div>
          </div>
          <div className="card use-card">
            <div className="label">三件套 · 之二</div>
            <div className="en">偏置 <b>Bias</b></div>
            <div className="zh">不看任何输入的<b>底分</b>，决定门槛高低。偏置高，神经元轻易触发（风雨无阻去跑步）；偏置低，得攒够很多正分才触发（晴天限定）。门槛能高能低，决定才够灵活。</div>
          </div>
          <div className="card use-card">
            <div className="label">三件套 · 之三</div>
            <div className="en">激活函数 <b>Activation</b></div>
            <div className="zh">把分数 z <b>压成决定</b>的最后一道工序。sigmoid 把任何分数压进 0~1，像一个“可能性”；ReLU 更干脆：负分一律归零，正分原样放行。没有它会怎样？往下看。</div>
          </div>
        </div>
      </Lsec>

      <Lsec
        title="📖 名字借自大脑，本事全靠数学"
        lead="上世纪 40 年代，研究者观察到生物神经元“信号汇总、过阈值就放电”的行为，从中抽出了这道打分题。对照关系如下 —— 但请记住，这只是一次松散的启发，不是模拟。"
      >
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="match">
            <thead>
              <tr><th>生物神经元</th><th>人工神经元</th><th>它干的事</th></tr>
            </thead>
            <tbody>
              <tr><td className="be">树突</td><td className="be">输入 x</td><td className="ex">接收上游传来的信号</td></tr>
              <tr><td className="be">突触强度</td><td className="be">权重 w</td><td className="ex">决定每路信号被放大还是削弱</td></tr>
              <tr><td className="be">胞体</td><td className="be">加权求和 + 激活</td><td className="ex">把信号汇总，过了阈值才“放电”</td></tr>
              <tr><td className="be">轴突</td><td className="be">输出 y</td><td className="ex">把结果传给下一个神经元</td></tr>
            </tbody>
          </table>
        </div>
        <p className="footnote" style={{ marginTop: 10 }}>⚠️ 真实神经元有化学递质、脉冲时序、上百种细胞类型，复杂程度完全不在一个量级。人工神经元只是借了个好名字的简单函数 —— 把它想成“硅基脑细胞”，是这门课要帮你摘掉的第一个滤镜。</p>
      </Lsec>

      <Lsec
        title="🚦 为什么必须有激活函数"
        lead="三件套里最不起眼的激活函数，恰恰是整座大厦的承重墙。一组对照看明白："
      >
        <div className="contrast">
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-terracotta">去掉激活函数</span></div>
            <div className="big">叠一万层，<span className="gap">还是一条直线</span></div>
            <p className="note">直线套直线还是直线：w₂(w₁x + b₁) + b₂ 整理一下，无非是另一条直线。层数再多，整个网络也只会画直线 —— 连“晴天但太累就不去”这种拐弯逻辑都表达不了。</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">加上激活函数</span></div>
            <div className="big">每一层都能<span className="hl">拐一个弯</span></div>
            <p className="note">激活函数给直线注入“弯折”。一层拐一个弯，层层叠起来就能围出任意复杂的边界 —— 从认出一只猫到接住一句话。层层弯折如何叠出智能，第 6 课揭晓。</p>
          </div>
        </div>
      </Lsec>

      <Lsec
        title="🎛️ 交互演示：亲手捏一个会做决定的神经元"
        lead="这个神经元只关心两件事：天气和疲劳。左图的连线就是权重 —— 绿色加分、红色减分、越粗越在乎。拖动右侧滑块，试试两个实验：把“疲劳”的权重 w₂ 调到 0 会怎样？把偏置 b 拉到 +2 又会怎样？"
      >
        <NeuronDemo />
      </Lsec>

      <Lsec title="⚠️ 常见误区">
        <div className="card alert-card row-list">
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">神经网络在模拟人类大脑</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">它只借了“汇总信号、过线触发”这点松散直觉，本质是纯数学函数</span></div>
            </div>
            <p className="why"><b>病因：</b>“神经网络”“神经元”这些名字起得太成功，媒体配图又总爱放发光的大脑。实际上现代深度学习的进展靠的是数学和算力，几乎不参考脑科学的最新发现 —— 就像飞机受鸟启发，但不靠扑翅膀飞。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">一个神经元就已经有点智能了</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">单个神经元只能画一条分界直线，连“两个输入不同才触发”（异或）都学不会</span></div>
            </div>
            <p className="why"><b>病因：</b>把“能做决定”误当成“聪明”。你刚才在演示里看到的，只是一道小学算术题。智能不在零件里，而在亿万个零件的组织方式里 —— 一粒沙不是城堡，但亿万粒沙可以是。</p>
          </div>
        </div>
      </Lsec>

      <Lsec title="✍️ 小练习">
        <div className="card quiz row-list">
          <QuizItem q="1. 用“加权打分题”拆解一个新场景：深夜纠结要不要点外卖。说出至少两个输入、各自权重的正负，以及“偏置很高”对应什么样的人。">
            参考：<b>饥饿程度是正权重输入</b>（越饿加分越多），<b>价格或罪恶感是负权重输入</b>（减分项）。偏置很高 = 不饿也想点的“外卖重度依赖型”—— 还没看任何输入，底分就快过线了。输入可以随意换，权重正负讲得通就算对。
          </QuizItem>
          <QuizItem q="2. 回到演示：把 w₂（疲劳的权重）调到 0，神经元的行为有什么变化？再把偏置 b 拉到 +2 呢？">
            w₂ = 0 时，“疲劳”这路输入<b>彻底失效</b> —— 再怎么拖疲劳滑块，输出纹丝不动：权重为零等于完全不在乎。b = +2 时门槛极低，几乎什么天气都“去跑步”—— <b>偏置决定的是不看输入的基础倾向</b>。
          </QuizItem>
          <QuizItem q="3. 判断：把三个“没有激活函数”的神经元层层串联，能学会比一条直线更复杂的边界吗？">
            <b>不能。</b>线性函数套线性函数还是线性函数，三层串联等效于一层，画出来仍是一条直线。这正是激活函数不可省略的原因 —— 也是第 6 课“层层抽象”的起点。
          </QuizItem>
        </div>
      </Lsec>
    </>
  )
}
