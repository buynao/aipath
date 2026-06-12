import { useEffect, useRef, useState } from 'react'
import { Lsec, QuizItem } from '../components/ui.jsx'
import { createConvScan, KERNELS } from './viz/convScan.js'

// 像素数字网格（核心概念配图）—— 灰阶为像素数据本身，不走主题色
const PIX = ['........', '.######.', '.....##.', '....##..', '...##...', '..##....', '..##....', '........']
function PixelGrid() {
  const C = 34, n = 8
  const cells = []
  PIX.forEach((row, r) => {
    for (let c = 0; c < n; c++) {
      const i = r * n + c
      const v = row[c] === '#' ? 212 + ((i * 37) % 44) : 6 + ((i * 23) % 20)
      const tc = v > 140 ? 'rgba(0,0,0,0.78)' : 'rgba(255,255,255,0.82)'
      cells.push(
        <g key={i}>
          <rect x={c * C + 1} y={r * C + 1} width={C - 2} height={C - 2} rx="3" fill={`rgb(${v},${v},${v})`} />
          <text x={c * C + C / 2} y={r * C + C / 2 + 3.5} textAnchor="middle" fontSize="10.5" fontWeight="600" fill={tc}>{v}</text>
        </g>,
      )
    }
  })
  return (
    <svg viewBox={`0 0 ${n * C} ${n * C}`} width="300" aria-label="一张 8×8 灰度图：每个格子同时显示其像素亮度值">{cells}</svg>
  )
}

const KEY_LIST = [['h', '水平边缘'], ['v', '垂直边缘'], ['sharp', '锐化'], ['blur', '模糊']]

function ConvDemo() {
  const canvasRef = useRef(null)
  const ctrlRef = useRef(null)
  const [key, setKey] = useState('h')
  const [status, setStatus] = useState('就绪 —— 点「播放」让探测器出发')
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const ctrl = createConvScan(canvasRef.current, { onStatus: setStatus, onPlaying: setPlaying })
    ctrlRef.current = ctrl
    ctrl.selectKernel('h')
    return () => ctrl.dispose()
  }, [])

  const select = (k) => { setKey(k); ctrlRef.current?.selectKernel(k) }
  const kd = KERNELS[key]

  return (
    <div className="card demo conv-demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · 卷积核扫描一张图</span>
        <span className="demo-hint">选一个核 → 播放，或「单步」逐格观察</span>
      </div>
      <div className="demo-stage">
        <canvas ref={canvasRef} aria-label="卷积演示：3×3 卷积核在 12×12 灰度图上逐格滑动，右侧 10×10 特征图按响应强度逐格点亮" />
      </div>
      <div className="demo-side">
        <div className="chips">
          {KEY_LIST.map(([k, label]) => (
            <button key={k} className={`chip${k === key ? ' active' : ''}`} onClick={() => select(k)}>{label}</button>
          ))}
        </div>
        <div className="ctrl-row">
          <button className="chip" onClick={() => ctrlRef.current?.togglePlay()}>{playing ? '⏸ 暂停' : '▶ 播放'}</button>
          <button className="chip" onClick={() => ctrlRef.current?.step()}>⏭ 单步</button>
          <button className="chip" onClick={() => ctrlRef.current?.reset()}>↺ 重置</button>
        </div>
        <h4>{kd.name}</h4>
        <div className="period">{kd.sub}</div>
        <p>{kd.desc}</p>
        <div className="period" id="ck-status">{status}</div>
      </div>
    </div>
  )
}

export default function L07() {
  return (
    <>
      <Lsec title="🎯 你将学会">
        <div className="card goals">
          <div className="goal-item"><span className="tick">✓</span>说出图像在计算机里到底是什么：一张 0~255 的数字网格，“看懂图像” = 在网格里找模式</div>
          <div className="goal-item"><span className="tick">✓</span>看懂卷积核的工作方式：一枚 3×3 的小探测器逐格滑动，遇到匹配的局部就强烈响应</div>
          <div className="goal-item"><span className="tick">✓</span>理解 CNN 的层叠之力：边缘 → 纹理 → 部件 —— 正是第 6 课“逐层抽象”的视觉实例</div>
          <div className="goal-item"><span className="tick">✓</span>识破两个流行误解：AI 并没有“看见”整体；识别得准也不等于真的理解</div>
        </div>
      </Lsec>

      <Lsec
        title="💡 核心概念：在计算机眼里，图像是一张数字表"
        lead="先纠正一个根深蒂固的想象：计算机里并不存在“画面”。打开任何一张图片，存储的只是一张表格 —— 每个格子（像素）记一个亮度数字。所谓“看”，是对这张表格做数学。"
      >
        <div className="contrast">
          <div className="card contrast-card">
            <span className="tag pill pill-terracotta">直觉印象</span>
            <div className="big">计算机存下了一幅<span className="gap">“画面”</span></div>
            <p className="note">仿佛硬盘里真有图案、轮廓和一只猫，计算机睁眼就能“看到”它们。</p>
          </div>
          <div className="card contrast-card">
            <span className="tag pill pill-sage">真实机制</span>
            <div className="big">计算机存下一张<span className="hl">数字网格</span></div>
            <p className="note">每格是一个 0~255 的亮度值：0 纯黑，255 纯白。彩色图也只是红、绿、蓝三张这样的表叠在一起。</p>
          </div>
        </div>
        <div className="card pix-card">
          <PixelGrid />
          <p className="footnote">↑ 同一份数据的两种读法：站远看是个“7”，凑近看是 64 个数字。<br />计算机只有“凑近看”这一种视角 —— 它从未见过左边那个“7”。</p>
        </div>
        <p className="lead" style={{ marginTop: 18 }}>于是“看懂图像”被翻译成一道数学题：<b>在数字网格里找模式</b> —— 哪里数字突然跳变（那是边缘），哪里有规律地重复（那是纹理），哪些模式总是结伴出现（那是眼睛、车轮这样的部件）。卷积神经网络 CNN，就是为这道题而生的机器。</p>
      </Lsec>

      <Lsec
        title="🔍 卷积核：一枚扛着模板巡逻的 3×3 小探测器"
        lead="CNN 的最小零件叫卷积核（kernel）：一张 3×3 的小表格，里面装着它要找的“模式模板”。它从图像左上角出发，逐格滑动，每停一步就问一句：「我脚下这 9 个像素，长得像我的模板吗？」像，就输出一个大数（强烈响应）；不像，就输出接近 0。"
      >
        <div className="example">
          <div className="en">响应 = 窗口里 9 个像素 × 核里 9 个权重，再加总</div>
          <div className="zh">这是全课唯一的式子，它本质上是“相似度打分”：脚下图案和模板越匹配，得分越高；图案平平无奇，得分接近 0。把所有位置的得分按原位置拼起来，就得到一张“特征图”—— 标记着“哪里有我要找的东西”。</div>
        </div>
        <p className="lead" style={{ marginTop: 18 }}>换一个核里的数字，就换了一种探测目标 —— 同一张图，不同的核“看到”完全不同的东西：</p>
        <div className="use-grid">
          <div className="card use-card">
            <div className="label">找“亮度跳变”</div>
            <div className="en">边缘核 <b>Edge</b></div>
            <div className="zh">两侧权重一正一负，亮度突变处响应最大 —— 物体的轮廓就此现形。</div>
          </div>
          <div className="card use-card">
            <div className="label">找“两条边相交”</div>
            <div className="en">角点核 <b>Corner</b></div>
            <div className="zh">对拐角形状敏感。桌角、窗框、眼角这类关键点，都逃不过它。</div>
          </div>
          <div className="card use-card">
            <div className="label">找“规律重复”</div>
            <div className="en">纹理核 <b>Texture</b></div>
            <div className="zh">对条纹、斑点、网格这类重复图案响应强烈 —— 毛发与布料的签名。</div>
          </div>
        </div>
        <div className="example" style={{ marginTop: 14 }}>
          <div className="en">关键转折：CNN 的核<span className="hl">不是人设计的，是学出来的</span></div>
          <div className="zh">上面这些是人类手工设计的经典滤波器，图像处理用了几十年。CNN 的突破在于：核里的 9 个数字本身就是权重，靠第 4 课讲的梯度下降从数据里自动调出来 —— 任务需要什么探测器，网络就自己“长出”什么探测器。一层里几十上百个核并行巡逻，各找各的模式。</div>
        </div>
      </Lsec>

      <Lsec
        title="🏗️ 层叠之力：从边缘到人脸的三级跳"
        lead="一个核只能找一种局部小模式，真正的魔法在“叠层”。第 6 课说过，深度网络靠逐层抽象把简单特征拼成复杂概念 —— CNN 就是它在视觉上的完美实例：下一层的核，扫描的是上一层的特征图，于是探测目标逐层升级。"
      >
        <div className="card">
          <table className="match">
            <thead><tr><th>层级</th><th>它在找什么</th><th>好比汉字里的</th></tr></thead>
            <tbody>
              <tr><td className="be">第 1 层</td><td className="ex">边缘、色块、明暗突变</td><td>笔画</td></tr>
              <tr><td className="be">第 2 层</td><td className="ex">把边缘拼成纹理、圆弧、简单形状</td><td>部首</td></tr>
              <tr><td className="be">第 3 层</td><td className="ex">把形状拼成部件：眼睛、鼻子、车轮</td><td>单字</td></tr>
              <tr><td className="be">更深层</td><td className="ex">把部件拼成整体：人脸、汽车、猫</td><td>词句</td></tr>
            </tbody>
          </table>
        </div>
        <div className="example" style={{ marginTop: 14 }}>
          <div className="en">池化 <span className="hl">Pooling</span>：缩图保要点</div>
          <div className="zh">层与层之间常夹一步池化：每 2×2 格只保留最大响应，特征图边长减半。好处有二 —— 图变小、算得快；猫往旁边挪两个像素照样认得（这叫“抗位移”）。像把地图缩小：细节丢了，地标还在。</div>
        </div>
        <p className="lead" style={{ marginTop: 18 }}>这条“边缘 → 纹理 → 部件 → 整体”的流水线，此刻正运行在你身边的无数设备里：</p>
        <div className="use-grid cols-2">
          <div className="card use-card">
            <div className="label">口袋里 · 每天几十次</div>
            <div className="en">人脸解锁 <b>Face ID</b></div>
            <div className="zh">用卷积网络提取你五官的特征，与注册时的模板比对，毫秒级完成 —— 第 1 层找的边缘最终拼成了“你”。</div>
          </div>
          <div className="card use-card">
            <div className="label">医院里</div>
            <div className="en">医学影像读片 <b>Medical</b></div>
            <div className="zh">在 CT、X 光、眼底照片里圈出疑似病灶。多项研究中，CNN 在特定病种的检出上可达资深医师水平 —— 但它是“提醒助手”，最终诊断仍由医生负责。</div>
          </div>
          <div className="card use-card">
            <div className="label">马路上</div>
            <div className="en">自动驾驶感知 <b>Perception</b></div>
            <div className="zh">从摄像头画面里框出车辆、行人、车道线。感知系统的视觉部分大量依赖 CNN（近年也与 Transformer 混合使用）。</div>
          </div>
          <div className="card use-card">
            <div className="label">工厂里</div>
            <div className="en">工业质检 <b>Inspection</b></div>
            <div className="zh">流水线上逐件拍照，找划痕、裂缝、缺件。比人眼快、不知疲倦，也不会下午三点开始走神。</div>
          </div>
        </div>
      </Lsec>

      <Lsec
        title="🎛️ 交互演示：亲眼看一次卷积"
        lead="左边是一张 12×12 的灰度小图（一个“7”），中间的 3×3 卷积核扛着模板从左上角扫到右下角，右边 10×10 的特征图逐格点亮 —— 越亮代表响应越强。切换不同的核，看看它们各自“在乎”什么。"
      >
        <ConvDemo />
        <span className="footnote" style={{ display: 'block', marginTop: 12 }}>为什么输出是 10×10？—— 12 格宽的图里，3 格宽的窗口只有 12 − 3 + 1 = 10 个落脚位置，纵向同理。</span>
      </Lsec>

      <Lsec title="⚠️ 常见误区">
        <div className="card alert-card row-list">
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">CNN 像人一样“看见”了一只完整的猫</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">它只是把成千上万个局部模式的响应，统计性地组合成一个判断</span></div>
            </div>
            <p className="why"><b>病因：</b>拟人化想象。CNN 没有“整体印象”，只有层层叠加的局部匹配分数 —— 耳朵尖的得分 + 胡须纹理的得分 + 毛发斑纹的得分，加起来超过阈值就报“猫”。所以背景诡异、姿势罕见、光线极端时它会翻车：它认的是“模式组合”，不是“猫”这个概念。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">识别准确率高，说明它真的理解了图像</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">在停车标志上贴几张小贴纸，就可能让模型把它认成限速牌 —— 这叫对抗样本</span></div>
            </div>
            <p className="why"><b>病因：</b>把“统计拟合得好”当成“语义理解”。对人眼几乎无影响的微小扰动，能让 CNN 满盘皆错 —— 因为它依赖的是像素层面的数字模式，而不是“停车标志意味着必须停车”的含义。对抗样本是计算机视觉安全研究的核心课题，也时刻提醒我们：识别 ≠ 理解。</p>
          </div>
        </div>
      </Lsec>

      <Lsec title="✍️ 小练习">
        <div className="card quiz row-list">
          <QuizItem q="1. 一张 100×100 的灰度照片，在计算机里到底是什么？一共多少个数字？">
            <b>一张 100×100 的数字网格，共 10,000 个 0~255 的亮度值。</b>彩色照片则是三张表（红/绿/蓝），3 万个数字。所谓“看懂这张照片”，就是在这一万个数字里找模式。
          </QuizItem>
          <QuizItem q="2. 垂直边缘核（左列 −1、右列 +1）扫过一片纯色天空 —— 窗口里 9 个像素的数值几乎相同。它的响应大约是多少？为什么？">
            <b>接近 0。</b>左列乘 −1、右列乘 +1，数值相同就正负相消。卷积核找的是“变化”：没有亮度跳变，就没有边缘，自然没有响应。这也解释了演示里笔画内部和空白处为何一片漆黑，被点亮的只有轮廓。
          </QuizItem>
          <QuizItem q="3. 演示里输入图是 12×12、卷积核 3×3，为什么特征图是 10×10 而不是 12×12？">
            <b>因为 3 格宽的窗口在 12 格宽的图上只有 12 − 3 + 1 = 10 个落脚位置</b>，纵向同理，所以输出 10×10。真实 CNN 常在图像四周补一圈 0（叫 padding），让输出保持原尺寸。
          </QuizItem>
        </div>
      </Lsec>
    </>
  )
}
