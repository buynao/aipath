import { useEffect, useRef, useState } from 'react'
import { Lsec, SliderRow, QuizItem } from '../components/ui.jsx'
import { createDenoise, createCfg } from './viz/diffusion.js'

// ============================================================
// ① 50 步去噪
// ============================================================
function DenoiseDemo() {
  const canvasRef = useRef(null)
  const ctrlRef = useRef(null)
  const [step, setStep] = useState(0)
  const [pattern, setPattern] = useState('rings')
  const [caption, setCaption] = useState('步数 0 / 50 · 噪声残留 100%')
  const [phase, setPhase] = useState('')
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const ctrl = createDenoise(canvasRef.current, {
      onUpdate: (s, cap, ph) => { setStep(s); setCaption(cap); setPhase(ph) },
    })
    ctrlRef.current = ctrl
    return () => ctrl.dispose()
  }, [])

  const onSlider = (v) => { setPlaying(false); ctrlRef.current?.setStep(Math.round(v)) }
  const onPattern = (k) => { setPattern(k); ctrlRef.current?.setPattern(k) }
  const togglePlay = () => {
    ctrlRef.current?.play(() => {}, () => setPlaying(false))
    setPlaying(ctrlRef.current?.isPlaying() ?? false)
  }

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · 50 步去噪（原理示意）</span>
        <span className="demo-hint">拖动滑块 = 手动去噪</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <div className="dn-stage">
            <div className="dn-frame"><canvas id="dn-canvas" ref={canvasRef} width="256" height="256" aria-label="去噪过程演示画布：图像从纯噪声逐步变清晰" /></div>
            <div className="dn-caption">{caption}</div>
          </div>
        </div>
        <div className="demo-side">
          <h4>选一张“藏在噪声里”的画</h4>
          <div className="chips mt14">
            {[['rings', '暖阳同心圆'], ['mountain', '远山落日'], ['checker', '棋盘格']].map(([k, label]) => (
              <button key={k} className={`chip${k === pattern ? ' active' : ''}`} onClick={() => onPattern(k)}>{label}</button>
            ))}
          </div>
          <div className="mt14">
            <SliderRow label="去噪步数" min={0} max={50} step={1} value={step} onChange={onSlider} format={(v) => Math.round(v)} />
          </div>
          <button className="dn-play" onClick={togglePlay}>{playing ? '⏸ 停止' : '▶ 自动播放'}</button>
          <p className="dn-phase">{phase}</p>
          <p className="footnote">真实扩散模型的每一步由神经网络预测噪声，这里只是模拟“逐步去噪”的视觉过程。</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ② CFG 引导强度
// ============================================================
function CfgDemo() {
  const canvasRef = useRef(null)
  const ctrlRef = useRef(null)
  const [cfg, setCfg] = useState(7)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')

  useEffect(() => {
    const ctrl = createCfg(canvasRef.current, { onTier: (t, d) => { setTitle(t); setDesc(d) } })
    ctrlRef.current = ctrl
    return () => ctrl.dispose()
  }, [])

  const onSlider = (v) => { const cv = Math.round(v); setCfg(cv); ctrlRef.current?.setCfg(cv) }

  return (
    <div className="card demo demo-slim mt14">
      <div className="demo-head">
        <span className="demo-title">🎚️ 小实验 · 拧一拧 CFG 旋钮（原理示意）</span>
        <span className="demo-hint">左右拖动滑块</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <div className="dn-stage">
            <div className="dn-frame"><canvas id="cfg-canvas" ref={canvasRef} width="180" height="180" aria-label="CFG 引导强度示意：滑块越小画面越模糊发灰，越大颜色越过饱和" /></div>
            <div className="dn-caption">提示词：「远山落日」</div>
          </div>
        </div>
        <div className="demo-side">
          <SliderRow label="引导强度" min={1} max={20} step={1} value={cfg} onChange={onSlider} format={(v) => Math.round(v)} />
          <h4>{title}</h4>
          <p>{desc}</p>
          <p className="footnote">这里用清晰度/饱和度模拟“听话程度”的观感；真实 CFG 作用在每一步去噪的方向上。</p>
        </div>
      </div>
    </div>
  )
}

export default function L21() {
  return (
    <>
      <Lsec title="🎯 你将学会">
        <div className="card goals">
          <div className="goal-item"><span className="tick">✓</span>说出全课最反直觉的一点：扩散模型学的不是“怎么画画”，而是“怎么把一张被加噪的图恢复一点点”</div>
          <div className="goal-item"><span className="tick">✓</span>分清训练和生成两个阶段：训练时给真图加噪、让网络猜噪声；生成时从纯噪声出发，几十步迭代去噪</div>
          <div className="goal-item"><span className="tick">✓</span>明白文字怎么控制画面：描述先变成向量（第 8 课的老朋友），再在每一步去噪时“指路”，并知道 CFG 旋钮拧大会怎样</div>
          <div className="goal-item"><span className="tick">✓</span>一句话解释潜空间为什么省钱，并认出 Midjourney / Stable Diffusion / DALL·E / Sora 同属一条技术路线</div>
        </div>
      </Lsec>

      <Lsec
        title="💡 核心概念：它学的不是画画，是“修复”"
        lead="看到 AI 画图，所有人的第一反应都是“它学会了绘画”。错。它学会的事小得多、也怪得多 —— 但正是这件小事，重复几十次之后就变成了魔法。"
      >
        <div className="contrast">
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-ink">直觉印象</span></div>
            <div className="big">学“怎么画”<span className="gap"> · </span>从空白画布起笔</div>
            <p className="note">想象 AI 像画家一样：先打底稿，再勾线、上色 —— 一笔一笔把画“画”出来。听起来合理，但完全不是这么回事。</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">真实机制</span></div>
            <div className="big">学“怎么<span className="hl">去掉一点噪声</span>”</div>
            <p className="note">它只练了一件事：拿到一张被噪声污染的图，把噪声<b>恢复一点点</b>。把这一步重复几十次 —— 一幅画就从雪花屏里浮现出来。</p>
          </div>
        </div>
        <div className="example mt14">
          <div className="en">“雕像本来就在石头里，我只是去掉多余的部分。”—— 传说中雕塑家的回答</div>
          <div className="zh">扩散模型是数字时代的雕塑家：画“藏”在那张纯噪声里，去噪器一步一步凿掉多余的随机，直到画显形。它从不“添加”任何笔画 —— 它只做减法。</div>
        </div>
        <p className="lead mt14">这件事拆开看，是两个完全分离的阶段：</p>
        <div className="use-grid cols-2">
          <div className="card use-card"><div className="label">训练时 · 学会去噪</div><div className="en">加噪 → 猜<b>噪声</b></div><div className="zh">拿一张真实照片，随机加上<b>不同程度</b>的噪声 —— 轻则略糊，重则面目全非 —— 然后让神经网络猜：“刚才加进去的是什么噪声？”猜对了，就等于会把这一步噪声减掉。在亿万张图上重复这道练习题，网络就成了去噪高手。</div></div>
          <div className="card use-card"><div className="label">生成时 · 反复用它</div><div className="en">纯噪声 → <b>几十步</b> → 画</div><div className="zh">生成新图时根本不需要任何“原图”：随机抽一张<b>纯噪声</b>，把去噪器连续调用几十步，每步只擦掉一点点。因为起点的噪声每次都不同，每次“浮现”出的画也都是世界上从未存在过的一张。</div></div>
        </div>
        <p className="lead mt14">为什么不一步到位？因为“从雪花直接猜出整幅画”太难了，网络猜不准；而“只把噪声减轻一点点”是个简单得多的小问题，每一步都能做得很准。几十个小而准的步骤串起来，胜过一个大而离谱的跳跃 —— 这和第 4 课梯度下降“小步快走”的智慧一脉相承。</p>
      </Lsec>

      <Lsec
        title="🧭 文字怎么控制画面：每一步都有人指路"
        lead="光会去噪，只能从噪声里浮现出“随便一张图”。要让它画“一只戴贝雷帽的橘猫”，需要把你的文字变成每一步去噪的导航。"
      >
        <div className="card steps3-card">
          <div className="steps3">
            <div className="step"><span className="num">1</span><span className="txt"><b>文字变向量。</b>你的描述先经过一个<b>文本编码器</b>，变成一串数字向量 —— 还记得第 8 课吗？向量就是机器能比较、能计算的“语义坐标”，“橘猫”和“贝雷帽”的含义都被编了码。</span></div>
            <div className="step"><span className="num">2</span><span className="txt"><b>每步去噪时指路。</b>这串向量作为<b>条件</b>，在每一步去噪时都喂给去噪器，把去噪的方向“掰”向符合描述的图像区域：同样是擦掉噪声，往“有橘猫的那类图”的方向擦。文字不画画，文字只导航。</span></div>
            <div className="step"><span className="num">3</span><span className="txt"><b>CFG：听话程度的旋钮。</b>引导强度（CFG）决定模型多大程度服从你的文字：拧大更听话、更贴题，但拧过头容易颜色过饱和、画面发“塑料”—— 像把导航音量开到最大，司机紧张得开不好车。</span></div>
          </div>
        </div>
        <CfgDemo />
        <p className="lead mt14"><b>顺带一段：潜空间 —— 在草图上构思，最后再上色放大。</b>直接在像素上做扩散太贵：一张 1024×1024 的图有上百万个像素，几十步去噪每步都得全算一遍。Stable Diffusion 的聪明做法是先用一个压缩器把图压进小得多的<b>潜空间</b>（latent space），全部几十步扩散都在这张“小草图”上进行，最后一步才解码放大回像素 —— 就像画家先在小稿上构思布局，定稿后才上色放大，省下的算力是数量级的。它的论文名就叫“潜在扩散”（Latent Diffusion）。</p>
        <div className="use-grid">
          <div className="card use-card"><div className="label">同一条路线 · 三位名角</div><div className="en">Midjourney / <b>SD</b> / DALL·E</div><div className="zh">Midjourney 以审美调校出名、Stable Diffusion 开源开放、DALL·E 出自 OpenAI —— 产品气质各异，底层同属扩散这条技术路线。</div></div>
          <div className="card use-card"><div className="label">延伸 · 视频生成</div><div className="en">Sora 类 = <b>时间维</b>扩散</div><div className="zh">把“对一张图去噪”扩展成“对一串帧在时间维度上一起去噪”，画面动起来还前后连贯 —— 视频生成的主流思路。</div></div>
          <div className="card use-card"><div className="label">复习钩子</div><div className="en">呼应<b>第 8 课</b></div><div className="zh">文本编码器输出的向量，正是第 8 课讲过的嵌入。同一个零件，在文生图里换了个岗位：从“表示词义”变成“给去噪导航”。</div></div>
        </div>
      </Lsec>

      <Lsec
        title="🎛️ 交互演示：从雪花里擦出一幅画"
        lead="下面是原理示意（不是真模型）：我们程序化地画一张目标图，再用“目标与噪声按比例混合、噪声幅度随步数衰减”模拟去噪观感。拖动滑块，或点「自动播放」看整个过程 —— 注意画面是怎么先定大色块、再浮现轮廓、最后才清晰的。"
      >
        <DenoiseDemo />
      </Lsec>

      <Lsec title="⚠️ 常见误区">
        <div className="card alert-card row-list">
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">AI 画图是在素材库里搜图、拼贴、缝合</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">画面从纯噪声逐步生成，不存在被“拼贴”的某张原图 —— 但训练数据里的风格确实会被学进权重</span></div>
            </div>
            <p className="why"><b>病因：</b>“它看过几十亿张图”听起来就像存了一个巨大素材库。实际上权重里存的是统计规律，不是图片本身 —— 生成时的唯一“原料”是那张随机噪声。但要诚实地说：艺术家的风格可以被模仿这件事是真的，训练数据是否侵权、风格该不该受保护，是 2025 年仍在诉讼和立法中拉锯的争议。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">AI 是“唰”地一下把图画出来的</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">标准流程是几十步迭代去噪，每步只擦掉一点点噪声</span></div>
            </div>
            <p className="why"><b>病因：</b>产品界面只给你看最终结果，中间几十步被藏起来了。另外确实有“秒出图”的产品 —— 那靠的是蒸馏、一致性模型等加速技术，把几十步压缩到几步甚至一步，但那是工程提速，原理仍然是去噪。</p>
          </div>
        </div>
      </Lsec>

      <Lsec title="✍️ 小练习">
        <div className="card quiz row-list">
          <QuizItem q="1. 用一句话向朋友解释“扩散模型到底学了什么”，并分别说出训练阶段和生成阶段各在做什么。">
            一句话：<b>它学的不是画画，而是“把一张被加噪的图恢复一点点”。</b>训练时：拿真图随机加不同程度的噪声，让网络猜“加了什么噪声”；生成时：从一张纯噪声出发，反复调用这个去噪器几十步，画从雪花里浮现。
          </QuizItem>
          <QuizItem q="2. 朋友把 CFG 引导强度拉到最大，抱怨“图是贴题了，但颜色辣眼睛、画面像塑料”。请解释原因并给建议。">
            CFG 决定模型多大程度<b>服从文字描述</b>：拧大更听话、更贴题，但拧过头会过度强化“符合描述”的方向，典型副作用就是颜色过饱和、画面僵硬。建议把引导强度调回中间档位，在“贴题”和“自然”之间找平衡。
          </QuizItem>
          <QuizItem q="3. 判断题：“Stable Diffusion 是直接在像素上一步步去噪的。”对吗？潜空间帮它省下了什么？">
            <b>不对。</b>直接在上百万个像素上做几十步扩散太贵。Stable Diffusion 先把图压缩进小得多的<b>潜空间</b>，在那里完成全部去噪，最后才解码回像素 —— 像先在小草稿上构思、定稿后再上色放大，省下数量级的算力。
          </QuizItem>
        </div>
      </Lsec>
    </>
  )
}
