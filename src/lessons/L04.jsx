import { useEffect, useRef, useState } from 'react'
import { Lsec, SliderRow, QuizItem } from '../components/ui.jsx'
import LossChart from '../components/LossChart.jsx'
import { createGradientDescent } from './viz/gradientDescent.js'

const FALLBACK =
  '3D 演示无法启动（浏览器不支持 WebGL，或资源加载失败）。不过画面可以想象：一片起伏的山谷地形，小球从随机位置出发，每一步摸一摸脚下坡度、朝最陡的下坡挪一小步，最终在谷底停下；学习率太大时，它会在两侧山壁间来回弹跳，甚至被甩出地形。'

function GradientDescentDemo() {
  const wrapRef = useRef(null)
  const ctrlRef = useRef(null)
  const lrRef = useRef(0.15)

  const [lr, setLr] = useState(0.15)
  const [status, setStatus] = useState('点「自动播放」开始下山，或用「单步」一步一步走。')
  const [history, setHistory] = useState([])
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    lrRef.current = lr
  }, [lr])

  useEffect(() => {
    let ctrl
    try {
      ctrl = createGradientDescent(wrapRef.current, {
        getLR: () => lrRef.current,
        onStatus: setStatus,
        onHistory: setHistory,
        onPlaying: setPlaying,
      })
      ctrlRef.current = ctrl
    } catch (e) {
      setFailed(true)
    }
    return () => ctrl?.dispose()
  }, [])

  const disabled = failed

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · 梯度下降 3D 损失地形</span>
        <span className="demo-hint">拖动旋转视角 · 滚轮缩放</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <div className="gd-wrap" ref={wrapRef}>
            {failed && <div className="gd-fallback">{FALLBACK}</div>}
          </div>
        </div>
        <div className="demo-side">
          <h4>下山控制台</h4>
          <div className="period">小球只凭脚下坡度决定下一步</div>

          <SliderRow
            label="学习率"
            min={0.01}
            max={1.5}
            step={0.01}
            value={lr}
            onChange={setLr}
            format={(v) => v.toFixed(2)}
          />

          <div className="chips">
            <button className="chip" disabled={disabled} onClick={() => ctrlRef.current?.step()}>
              单步 ▸
            </button>
            <button
              className={`chip${playing ? ' active' : ''}`}
              disabled={disabled}
              onClick={() => ctrlRef.current?.togglePlay()}
            >
              {playing ? '⏸ 暂停' : '自动播放'}
            </button>
            <button className="chip" disabled={disabled} onClick={() => ctrlRef.current?.reset()}>
              重新随机起点
            </button>
          </div>

          <div className="gd-status" dangerouslySetInnerHTML={{ __html: status }} />

          <LossChart data={history} />
          <div className="footnote">↑ 损失下降曲线（Recharts 实时绘制）：每走一步记一个点</div>

          <p>
            建议顺序：① 学习率 0.15 自动播放，看小球稳稳下山；② 调到 0.03，感受磨蹭；③ 拉到 1.2 以上换个起点，看它在谷壁间弹跳、甚至被甩出地形；④ 多换几次起点 —— 总有一次会停进那个浅坑，那就是局部最优。
          </p>
        </div>
      </div>
    </div>
  )
}

export default function L04() {
  return (
    <>
      <Lsec title="🎯 你将学会">
        <div className="card goals">
          <div className="goal-item"><span className="tick">✓</span>一句话讲清损失函数 —— 给“猜错的程度”打分的尺子，并能亲手算一个平方损失</div>
          <div className="goal-item"><span className="tick">✓</span>在脑中放一幅终身受用的画面：训练 = 蒙眼下山，梯度指方向，学习率定步幅</div>
          <div className="goal-item"><span className="tick">✓</span>亲手调学习率，看见“太小磨蹭、太大震荡甚至被甩飞”的全过程</div>
          <div className="goal-item"><span className="tick">✓</span>说清局部最优是什么，以及为什么在亿万维空间里它没那么可怕</div>
        </div>
      </Lsec>

      <Lsec
        title="💡 核心概念：把“错”变成一座山"
        lead="上一课你认识了神经元：它用权重给输入打分。可权重的数值从哪来？答案朴素得让人意外 —— 一开始全是随机数，模型满嘴胡说。所谓“训练”，就是把亿万个随机数一点点调成有用的数。整件事只有三步棋。"
      >
        <div className="use-grid">
          <div className="card use-card">
            <div className="label">第 1 步 · 立一把尺子</div>
            <div className="en">损失函数 <b>Loss</b></div>
            <div className="zh">给每一次“猜错”打分：错得越离谱，分数越高。有了这把尺子，“模型好不好”第一次变成了<b>一个可计算的数字</b>。</div>
          </div>
          <div className="card use-card">
            <div className="label">第 2 步 · 定一个目标</div>
            <div className="en">损失<b>最小化</b></div>
            <div className="zh">训练的全部目标就一句话：找到让损失尽可能小的那组参数。AI 没有“想学好”的愿望，它只是被算法推着往损失更低处挪。</div>
          </div>
          <div className="card use-card">
            <div className="label">第 3 步 · 选一种走法</div>
            <div className="en">梯度下降 <b>Gradient Descent</b></div>
            <div className="zh">把损失想象成海拔，训练就是<b>蒙着眼下山</b>：摸摸脚下哪边最陡，朝下坡迈一小步，再摸再迈 —— 重复亿万次。</div>
          </div>
        </div>
        <div className="example mt14">
          <div className="en">损失 = (猜的值 − 真实值)<sup>2</sup></div>
          <div className="zh">最常用的一把尺子：平方损失。预测房价时，猜 520 万、实际 500 万，差 20，损失 400；猜 510 万只差 10，损失 100。平方有两个用意：<b>抹掉正负号</b>（多猜少猜都算错），以及<b>狠狠放大离谱的错误</b> —— 差 20 的罚分是差 10 的 4 倍。</div>
        </div>
        <p className="lead mt14">这套“下山法”里有四个固定角色。记牢这四张卡，后面每一课都会反复用到。</p>
        <div className="use-grid cols-2">
          <div className="card use-card">
            <div className="label">角色一 · 计分尺</div>
            <div className="en">损失函数 <b>Loss Function</b></div>
            <div className="zh">把“错得有多离谱”压成一个数。它定义了那座山的<b>形状</b> —— 换一把尺子，山就换一座。</div>
          </div>
          <div className="card use-card">
            <div className="label">角色二 · 脚下的坡感</div>
            <div className="en">梯度 <b>Gradient</b></div>
            <div className="zh">告诉你当前位置<b>哪个方向坡最陡</b>。它只感知脚下这一小块地，看不见整座山 —— 这就是“蒙眼”的含义。</div>
          </div>
          <div className="card use-card">
            <div className="label">角色三 · 步幅</div>
            <div className="en">学习率 <b>Learning Rate</b></div>
            <div className="zh">每一步迈多大。太小：磨蹭半天下不了山；太大：一脚跨过谷底、在两侧山壁间来回弹跳，甚至直接飞出去。下面的演示里你可以亲手试。</div>
          </div>
          <div className="card use-card">
            <div className="label">角色四 · 小坑陷阱</div>
            <div className="en">局部最优 <b>Local Minimum</b></div>
            <div className="zh">下进一个小坑，四面都是上坡，蒙着眼的你以为到底了 —— 其实远处还有更深的谷。这是梯度下降<b>天生的局限</b>。</div>
          </div>
        </div>
      </Lsec>

      <Lsec
        title="📖 蒙眼下山：每一步到底发生了什么"
        lead="为什么强调“蒙着眼”？因为模型永远看不到整座山的全貌 —— 它唯一能做的，是感知自己脚下这一小块地的坡度。把下山的每个要素翻译成训练术语，对照如下。"
      >
        <div className="card">
          <table className="match">
            <thead>
              <tr><th>下山时的你</th><th>训练中的模型</th><th>一句话点破</th></tr>
            </thead>
            <tbody>
              <tr><td className="be">山的海拔</td><td>损失值</td><td className="ex">海拔越低，错得越少</td></tr>
              <tr><td className="be">你站的位置</td><td>当前参数（所有权重）</td><td className="ex">挪动位置 = 修改参数</td></tr>
              <tr><td className="be">脚下的坡度</td><td>梯度</td><td className="ex">指向最陡的方向，只能感知脚下</td></tr>
              <tr><td className="be">一步的大小</td><td>学习率</td><td className="ex">由人提前设定，最重要的“旋钮”之一</td></tr>
              <tr><td className="be">走到走不动</td><td>收敛</td><td className="ex">梯度 ≈ 0，训练到此为止</td></tr>
            </tbody>
          </table>
        </div>
        <div className="example mt14">
          <div className="en">新位置 = 旧位置 − 学习率 × 梯度</div>
          <div className="zh">整个深度学习最核心的一行式子，人话版：梯度指向上坡，所以取负号<b>朝反方向</b>走；走多远由学习率决定。GPT 级别模型的训练，本质就是这行式子重复亿万次 —— 没有顿悟，没有灵感，只有挪步。</div>
        </div>
      </Lsec>

      <Lsec
        title="📖 诚实补充：真实的山有亿万个维度"
        lead="3D 演示是一个善意的“谎言”—— 真实的下山发生在你无法想象的空间里。但好消息恰恰也藏在那里。"
      >
        <div className="card card-pad prose">
          <p><b>维度的真相：</b>演示里只有 2 个参数（小球的横、纵坐标），所以山是三维的。真实大模型动辄数十亿、上千亿个参数 —— <b>每个参数都是一个可以挪动的方向</b>，下山发生在亿万维空间里。没有任何人“看见”过那座山，3D 地形只是把它压扁之后给你的示意图。</p>
          <p><b>高维的好消息：</b>直觉上维度越高越容易迷路，数学上恰恰相反 —— 维度一高，“四面八方全是上坡”的死坑（真正的局部最优）反而<b>非常罕见</b>：亿万个方向里，总有几个还能往下走。高维空间里更常见的是<b>鞍点</b>（一些方向上坡、另一些方向下坡），而实际使用的下山算法通常能从鞍点附近晃出去。</p>
          <p><b>实践的共识：</b>所以工程师从不执着于“全局最优”。用改良版的梯度下降（比如 Adam —— 它会为每个方向自适应地微调步幅），找到一个<b>足够低、泛化又好</b>的谷底，模型就足够好用。“完美是好的敌人”，在 AI 训练里是字面意义的真理。</p>
        </div>
      </Lsec>

      <Lsec
        title="🎛️ 交互演示：亲手把小球推下山"
        lead="是时候亲眼看了。下面这片起伏地形就是一个损失函数（它真的有两个山谷：一深一浅），小球 = 当前参数的位置，每一步都严格按“新位置 = 旧位置 − 学习率 × 梯度”计算，轨迹线记录它走过的路。"
      >
        <GradientDescentDemo />
      </Lsec>

      <Lsec title="⚠️ 常见误区">
        <div className="card alert-card row-list">
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">AI 训练像人类一样会“开窍”、会“顿悟”</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">训练只是“新位置 = 旧位置 − 学习率 × 梯度”重复亿万次的数值优化，没有任何灵光乍现的瞬间</span></div>
            </div>
            <p className="why"><b>病因：</b>媒体偏爱“AI 学会了”“AI 领悟了”这类拟人动词。打开真实的训练日志，你只会看到损失值一点一点往下掉 —— 即便模型最终表现出惊人的“涌现能力”（第 15 课），底层也只是这条平滑下山路的日积月累。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">学习率越大，学得越快</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">适中才快：过大会一脚跨过谷底，在两侧山壁间来回震荡，甚至损失越走越高、彻底发散</span></div>
            </div>
            <p className="why"><b>病因：</b>把“步子大”等同于“进度快”。山谷往往很窄，大步会直接踩到对面山壁上，比原来还高。回到上面的演示，把学习率拉到 1.2 以上 —— 亲眼看小球被甩出山谷，比任何解释都管用。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">只要训练得够久，总能找到全局最优</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">梯度下降只保证“一路向下”，不保证下到全世界最低点 —— 但实践上“足够低”就够好用</span></div>
            </div>
            <p className="why"><b>病因：</b>把优化当成必须满分的考试。亿万维空间根本无法穷举，工程上的共识是：找到一个泛化得好的低谷，远比执着理论上的最优重要 —— “泛化”是什么？下一课正好讲。</p>
          </div>
        </div>
      </Lsec>

      <Lsec title="✍️ 小练习">
        <div className="card quiz row-list">
          <QuizItem q="1. 用平方损失算一算：某房实际成交 500 万，模型 A 预测 510 万，模型 B 预测 530 万。两者损失各是多少？B 的罚分是 A 的几倍？">
            A 差 10，损失 10² = <b>100</b>；B 差 30，损失 30² = <b>900</b>。差距只有 3 倍，罚分却是 <b>9 倍</b> —— 平方损失就是故意的：它对离谱的错误格外严厉，逼着模型优先修正大错。
          </QuizItem>
          <QuizItem q="2. 既然目标是找最低点，为什么不让计算机把整座山“看一遍”、直接挑出最低处，而要蒙着眼一步步摸索？">
            因为山有<b>亿万个维度</b>。哪怕每个参数只试 10 个取值，10 亿个参数的组合数也是 10 的 10 亿次方 —— 宇宙里的原子加起来都不够记。穷举不可能，于是只剩一条路：从随机起点出发，凭局部坡度一步步走。<b>梯度下降不是最聪明的办法，而是唯一付得起的办法。</b>
          </QuizItem>
          <QuizItem q="3. 把学习率设成 0.001 和 1.5，分别大概率会发生什么？实践中常用什么策略兼顾两头？">
            0.001：每步太小，<b>下降极慢</b>，走几百步可能还在半山腰；1.5：步子太大，<b>一脚跨过谷底踩上对面山壁</b>，损失来回震荡甚至越来越大（发散）。实践常用<b>先大后小</b>的学习率调度：开局大步快速接近山谷，越接近谷底步幅越小，稳稳落底。
          </QuizItem>
        </div>
      </Lsec>
    </>
  )
}
