import { useEffect, useRef, useState } from 'react'
import { Lsec, QuizItem } from '../components/ui.jsx'
import { createCosmos } from './viz/cosmos.js'

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

// ============================================================
// ① 词向量星空（three.js）
// ============================================================
const VIEWS = {
  all: { title: '整片星空 · 36 个词', desc: '意思相近的词在空间里自动抱团，群落之间隔着大片“真空”。转一转就能体会：方位本身没有意义，有意义的只是相对距离。' },
  animal: { title: '动物群落', desc: '猫、狗、老虎、熊猫……它们总出现在相似的句子里（喂、养、毛茸茸、动物园），训练后被推进了同一片角落。' },
  food: { title: '食物群落', desc: '米饭和面条贴得最近，披萨、汉堡稍微偏向一侧 —— 真实模型里甚至能看出“中餐 / 西餐”的次级结构。' },
  emotion: { title: '情感群落', desc: '注意：「开心」和「悲伤」意思相反，距离却不远 —— 因为它们的语境几乎一样（“我感到 ____”）。embedding 度量的是语境相似，反义词常常是近邻。' },
  job: { title: '职业群落', desc: '医生、教师、律师……共享“上班、执照、职责”这类语境。真实空间里它们还会各自靠近自己的工作场所词：医生挨着医院，教师挨着学校。' },
  relation: { title: '关系向量 · 两组平行箭头', desc: '红色箭头都是“性别方向”（国王→女王、男人→女人、王子→公主），蓝色箭头都是“首都方向”（中国→北京、日本→东京、法国→巴黎）。关系 = 可以搬运的方向。' },
}
const ANALOGY = { title: '国王 − 男人 + 女人 ≈ ？', desc: '红色箭头 = 女人 − 男人，正是“性别”这层关系。把同一支箭头平移到「国王」头上，落点就在「女王」附近 —— 关系像积木一样可以搬运、相加。' }
const COSMOS_KEYS = [['all', '全部'], ['animal', '动物'], ['food', '食物'], ['emotion', '情感'], ['job', '职业'], ['relation', '关系向量']]
const FALLBACK = '3D 演示未能加载（浏览器不支持 WebGL，或资源加载失败）。文字版结论照样成立：36 个词按语义聚成 6 个群落 —— 动物、食物、情感、职业各自抱团；而「男人→女人」与「国王→女王」两支箭头互相平行，「中国→北京」与「日本→东京」也互相平行。把「女人 − 男人」这支箭头加到「国王」上，落点就在「女王」附近。'

function CosmosDemo() {
  const hostRef = useRef(null)
  const ctrlRef = useRef(null)
  const [activeKey, setActiveKey] = useState('all')
  const [text, setText] = useState(VIEWS.all)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let ctrl
    try {
      ctrl = createCosmos(hostRef.current)
      ctrlRef.current = ctrl
    } catch (e) {
      setFailed(true)
    }
    return () => ctrl?.dispose()
  }, [])

  const select = (key) => { setActiveKey(key); setText(VIEWS[key]); ctrlRef.current?.select(key) }
  const analogy = () => { setActiveKey(null); setText(ANALOGY); ctrlRef.current?.startAnalogy() }

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🌌 交互演示 · 漫游词向量空间</span>
        <span className="demo-hint">拖动旋转 · 滚轮缩放 · 点胶囊高亮群落</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <div id="cosmos" ref={hostRef} aria-label="3D 词向量星空：36 个中文词按语义聚成动物、食物、情感、职业等群落，可旋转缩放">
            {failed && <div className="cosmos-fallback"><b>3D 演示未能加载</b><p>{FALLBACK}</p></div>}
          </div>
        </div>
        <div className="demo-side">
          <div className="chips">
            {COSMOS_KEYS.map(([k, label]) => (
              <button key={k} className={`chip${k === activeKey ? ' active' : ''}`} disabled={failed} onClick={() => select(k)}>{label}</button>
            ))}
          </div>
          <div className="chips" style={{ marginTop: 14 }}>
            <button className="chip chip-play" disabled={failed} onClick={analogy}>▶ 演示：国王 − 男人 + 女人</button>
          </div>
          <h4 style={{ marginTop: 14 }}>{text.title}</h4>
          <p dangerouslySetInnerHTML={{ __html: text.desc }} />
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ② 训练步进：看坐标被填空题一步步推出来
// ============================================================
// [词, 颜色变量, 起点x, 起点y, 终点x, 终点y, 成团轮次]
const TRAIN_WORDS = [
  ['猫', '--sage', 330, 236, 76, 64, 1], ['狗', '--sage', 96, 272, 120, 86, 1],
  ['兔子', '--sage', 388, 64, 70, 110, 1], ['老虎', '--sage', 206, 124, 126, 130, 4],
  ['米饭', '--amber', 58, 72, 330, 62, 2], ['面条', '--amber', 244, 286, 372, 86, 2],
  ['饺子', '--amber', 142, 186, 324, 106, 2], ['披萨', '--amber', 404, 196, 368, 128, 5],
  ['开心', '--terracotta', 302, 148, 196, 252, 3], ['难过', '--terracotta', 46, 206, 248, 272, 3],
]
const TRAIN_STEPS = [
  ['第 0 轮 · 出生即混乱', '训练开始前，每个词领到的是纯随机坐标：「猫」挨着「面条」，「开心」漂在「老虎」旁边。模型此刻对语言一无所知 —— 点「训练一步」，开始做填空题。', 100],
  ['第 1 轮 ·「____ 在沙发上打盹」', '这类句子的空格里，猫、狗、兔子都常是标准答案。每做一题，就把“可以互换”的词往彼此身边推一小步 —— 注意三只小动物开始变色、靠拢。', 78],
  ['第 2 轮 ·「来一碗热腾腾的 ____」', '米饭、面条、饺子总和“碗、热、吃”作伴，被推进了同一片区域。没有谁定义过“食物”这个类别 —— 类别是统计出来的。', 61],
  ['第 3 轮 ·「考完试我特别 ____」', '开心和难过都能填进“我特别 ____”，语境几乎一样，于是被推到一起 —— 这正是反义词常常是近邻的原因：embedding 度量的是语境相似，不是褒贬。', 45],
  ['第 4 轮 ·「动物园新来了一只 ____」', '老虎归队。它前几轮“掉队”，只因出现频率低、轮到它的题少 —— 罕见词的坐标天生学得更慢、更不准。', 30],
  ['第 5 轮 ·「____ 趁热吃，配可乐绝了」', '披萨滑进食物区。三个群落边界已清晰可见 —— 而我们做的只是反复填空、错了就推一把。', 16],
  ['第 6 轮 · 亿万道题做完', '群落自己浮现了 —— 这就是“坐标不是人标的”的完整含义：聚类是统计的副产品。真实训练是几十亿句话、几百维坐标、万亿次做题，但原理与你刚才看到的一模一样。', 7],
]
const progress = (feat, step) => {
  if (step <= 0) return 0
  if (step >= 6) return 1
  return Math.min(1, 0.1 * step + (step >= feat ? 0.6 : 0))
}

function TrainDemo() {
  const [step, setStep] = useState(() => (reduceMotion() ? 6 : 0))
  const s = TRAIN_STEPS[step]
  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🧪 交互演示 · 亲手把坐标“推”出来</span>
        <span className="demo-hint">点「训练一步」· 看群落自己浮现</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="train-svg" viewBox="0 0 440 330" width="440" aria-label="训练演示：十个词从随机位置出发，随训练轮次逐步聚成动物、食物、情感三个群落">
            {TRAIN_WORDS.map((w, i) => {
              const p = progress(w[6], step)
              const x = w[2] + (w[4] - w[2]) * p
              const y = w[3] + (w[5] - w[3]) * p
              return (
                <g key={i} className="tw" style={{ transform: `translate(${x}px,${y}px)` }}>
                  <circle r="7" style={{ fill: step >= w[6] ? `var(${w[1]})` : 'var(--fg-2)' }} />
                  <text y="-12" textAnchor="middle">{w[0]}</text>
                </g>
              )
            })}
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            <button className="chip chip-play" onClick={() => setStep((v) => Math.min(6, v + 1))}>▶ 训练一步</button>
            <button className="chip" onClick={() => setStep(6)}>⏩ 一键训完</button>
            <button className="chip" onClick={() => setStep(0)}>⟲ 重置</button>
          </div>
          <h4 style={{ marginTop: 14 }}>{s[0]}</h4>
          <p>{s[1]}</p>
          <div className="errbar-row">
            <span>猜错程度</span>
            <div className="errbar"><i style={{ width: s[2] + '%' }} /></div>
            <span className="ev">{s[2]}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ③「苹果」语境漂移
// ============================================================
const APPLE_POS = { none: [218, 236], fruit: [128, 122], tech: [304, 124] }
const APPLE_TXT = {
  none: ['静态词向量的困境', 'word2vec 给每个词只发一张“身份证”。「苹果」只能卡在水果区和科技区中间的尴尬地带 —— 哪边都沾点，哪边都不像。一词多义，被压扁成了平均值。'],
  fruit: ['上下文把它拽进水果区', '在大模型内部，「苹果」先查表领到初始向量，随后被「甜」「两斤」这些邻居一层层修正 —— 整句读完，它已经漂进水果群落。这就是语境化向量：“活”的坐标。'],
  tech: ['同一个词，另一个灵魂', '换个句子，「发布」「手机」把同一个「苹果」拽向科技区。至于每个词究竟如何“参考”周围的词来更新自己 —— 那正是下一课注意力机制的全部剧情。'],
}
const APPLE_DOTS = [
  [78, 98, '香蕉', '--sage'], [134, 76, '桃子', '--sage'], [100, 156, '甜', '--sage'],
  [352, 100, '手机', '--sky'], [300, 74, '电脑', '--sky'], [336, 162, '发布会', '--sky'],
]

function CtxDemo() {
  const [key, setKey] = useState('none')
  const [x, y] = APPLE_POS[key]
  const txt = APPLE_TXT[key]
  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🍎 交互演示 · 同一个「苹果」，两个灵魂</span>
        <span className="demo-hint">点句子 · 看上下文拽动坐标</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="ctx-svg" viewBox="0 0 440 300" width="440" aria-label="语境演示：左侧水果群落、右侧科技群落，「苹果」的点随所选句子在两个群落之间移动">
            <circle cx="110" cy="112" r="84" style={{ fill: 'var(--sage-bg)', stroke: 'var(--sage)', strokeWidth: 1.2, strokeDasharray: '5 5' }} />
            <text x="110" y="36" textAnchor="middle" style={{ fill: 'var(--sage)', fontSize: 12, fontWeight: 700 }}>水果群落</text>
            <circle cx="330" cy="114" r="86" style={{ fill: 'var(--sky-bg)', stroke: 'var(--sky)', strokeWidth: 1.2, strokeDasharray: '5 5' }} />
            <text x="330" y="34" textAnchor="middle" style={{ fill: 'var(--sky)', fontSize: 12, fontWeight: 700 }}>科技群落</text>
            {APPLE_DOTS.map(([dx, dy, label, color], i) => (
              <g key={i} style={{ transform: `translate(${dx}px,${dy}px)` }}>
                <circle r="5" style={{ fill: `var(${color})` }} />
                <text y="-10" textAnchor="middle" style={{ fill: 'var(--fg-1)', fontSize: 12, fontWeight: 600 }}>{label}</text>
              </g>
            ))}
            <g id="apple-g" style={{ transform: `translate(${x}px,${y}px)` }}>
              <circle r="9" style={{ fill: 'var(--terracotta)' }} />
              <text y="-16" textAnchor="middle" style={{ fill: 'var(--fg-0)', fontSize: 14, fontWeight: 700 }}>苹果</text>
            </g>
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            {[['none', '「苹果」孤零零一个词'], ['fruit', '「苹果真甜，再买两斤」'], ['tech', '「苹果发布了新款手机」']].map(([k, label]) => (
              <button key={k} className={`chip${k === key ? ' active' : ''}`} onClick={() => setKey(k)}>{label}</button>
            ))}
          </div>
          <h4 style={{ marginTop: 14 }}>{txt[0]}</h4>
          <p>{txt[1]}</p>
        </div>
      </div>
    </div>
  )
}

export default function L08() {
  return (
    <>
      <Lsec title="🎯 你将学会">
        <div className="card goals">
          <div className="goal-item"><span className="tick">✓</span>一句话说清什么是 embedding：给每个词在空间里安排一个坐标，意思越近、坐得越近</div>
          <div className="goal-item"><span className="tick">✓</span>看懂明星算式 国王 − 男人 + 女人 ≈ 女王 —— 词与词的“关系”也变成了方向一致的箭头</div>
          <div className="goal-item"><span className="tick">✓</span>分清示意与真相：真实向量是几百到几千维的，而且坐标不是人标的，是模型自己学出来的</div>
          <div className="goal-item"><span className="tick">✓</span>亲手“训练”一次：在交互演示里看坐标怎么被亿万道填空题一步步推出来</div>
          <div className="goal-item"><span className="tick">✓</span>看清 embedding 在 ChatGPT 体内的位置：第一站查表领坐标，随后被上下文层层改写成“活”向量</div>
          <div className="goal-item"><span className="tick">✓</span>知道“万物皆可 embedding”：语义搜索、推荐系统、RAG 检索共用的同一块地基</div>
        </div>
      </Lsec>

      <Lsec
        title="💡 核心概念：把词钉进空间，“意思”第一次能算了"
        lead="上一课 CNN 吃的是像素 —— 图片天生就是数字。可文字不是：计算机看「猫」这个字，只看到一个字符编号，编号挨着的两个字意思可以毫不相干。Embedding（嵌入）干的事就一件：给每个词在一个空间里安排一个坐标点，并且保证 —— 意思越近的词，坐得越近。这个坐标，就是这个词的 embedding。"
      >
        <div className="contrast">
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-terracotta">人类的方式 · 查词典</span></div>
            <div className="big">「猫」= <span className="gap">“一种哺乳动物，善捕鼠，会喵喵叫……”</span></div>
            <p className="note">用别的词解释这个词，循环不止：查“哺乳动物”又得查“哺乳”。计算机读完整本词典，仍然算不出“猫”和“狗”到底有多像。</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">机器的方式 · 给坐标</span></div>
            <div className="big">「猫」= <span className="hl">(0.82, −1.30, 2.41, …)</span></div>
            <p className="note">一个词 = 空间里的一个点。“像不像”不需要任何解释 —— 量一下两点之间的距离就行，距离是小学就会算的东西。</p>
          </div>
        </div>
        <div className="example mt14">
          <div className="en"><span className="hl">距离 = 语义相似度</span>，这是本课唯一要背下来的等式</div>
          <div className="zh">猫和狗离得近，猫和披萨离得远，猫和“民法典”几乎在两个星系。意义（meaning）这种最虚无缥缈的东西，<b>第一次变成了可以计算的对象</b> —— 后面的注意力、Transformer、第 18 课的 RAG，全部踩在这块地基上。</div>
        </div>
        <p className="lead mt14">所以当你给 ChatGPT 发一句话时，它做的第一件事不是“读”，而是把每个词换成这样一串数字 —— 词先变成向量，神经网络才有的吃。Embedding 是文字世界和数字世界之间唯一的海关。</p>
      </Lsec>

      <Lsec
        title="🧭 明星算式：国王 − 男人 + 女人 ≈ 女王"
        lead="坐标既然是数字，就能加减。2013 年 word2vec 论文里的一个发现让全世界惊掉下巴：对词向量做小学算术，结果居然有意义。"
      >
        <div className="example">
          <div className="formula">国王 <span className="op">−</span> 男人 <span className="op">+</span> 女人 <span className="op">≈</span> <span className="res">女王</span></div>
          <div className="zh">人话拆解：<b>女人 − 男人</b> 这两点之间的箭头，捕捉到的正是“性别”这层关系；把这支箭头原样平移到「国王」头上，落点离「女王」最近。换句话说 —— <b>词与词的“关系”，在这个空间里是一个可以搬运的方向。</b></div>
        </div>
        <p className="lead mt14">更妙的是，同一种关系对应的箭头是<b>互相平行</b>的：所有“性别箭头”指向一致，所有“首都箭头”指向一致。模型没人教过它什么叫首都，但“首都关系”作为一个方向，自己浮现在了空间里。</p>
        <table className="match card">
          <thead><tr><th>关系</th><th>箭头 A</th><th>箭头 B</th><th>几何特征</th></tr></thead>
          <tbody>
            <tr><td className="be">性别</td><td>男人 → 女人</td><td>国王 → 女王</td><td className="ex">方向近似平行</td></tr>
            <tr><td className="be">首都</td><td>中国 → 北京</td><td>日本 → 东京</td><td className="ex">方向近似平行</td></tr>
            <tr><td className="be">时态（英文语料）</td><td>walk → walked</td><td>go → went</td><td className="ex">方向近似平行</td></tr>
          </tbody>
        </table>
        <p className="lead mt14">一句校准：注意算式里是 <b>≈ 不是 =</b>。这种类比在真实模型里“经常成立、并不保证”，研究者也发现不少例子要靠排除原词等小技巧才漂亮。把它当直觉的窗口，别当数学定理。</p>
      </Lsec>

      <Lsec
        title="🔬 两个关键澄清：别被星空图骗了"
        lead="下面马上要看 3D 演示，但先打两针预防针 —— 这两点恰恰是 embedding 最容易被误解的地方。"
      >
        <div className="use-grid cols-2">
          <div className="card use-card">
            <div className="label">澄清一 · 关于维度</div>
            <div className="en">3D 星空只是<b>降维示意</b></div>
            <div className="zh">真实 embedding 通常是<b>几百到几千维</b>：word2vec 时代常用 300 维，如今大模型内部的词向量普遍上千维。维度高，才装得下一个词的多重身份 ——「苹果」要同时靠近水果、手机和“红色”。任何 3D 图都像把地球仪压成平面地图：方便看，必有失真。</div>
          </div>
          <div className="card use-card">
            <div className="label">澄清二 · 关于来历</div>
            <div className="en">坐标<b>不是人标的</b>，是学出来的</div>
            <div className="zh">没有任何语言学家给“猫”填过坐标。模型在海量文本里反复做“预测邻居词”的填空题，用第 4 课的梯度下降把猜错的程度一点点压低 —— <b>谁总出现在相似的语境里，谁的坐标就被一点点推近</b>。全自动，零人工标注，坐标只是训练的副产品。</div>
          </div>
        </div>
        <div className="example mt14">
          <div className="en">“看一个词总跟谁作伴，你就懂了它。” —— 语言学家 J.R. Firth，1957</div>
          <div className="zh">这叫<b>分布假设</b>。“猫”和“狗”都能填进“____ 在沙发上睡觉”“带 ____ 去打疫苗”，于是它们被推到一起。Embedding 学到的“意思”，本质是亿万条语境的统计压缩。</div>
        </div>
      </Lsec>

      <Lsec
        title="🎛️ 交互演示：词向量星空"
        lead="下面是一片手工设计的 3D 教学星空：36 个中文词、6 个语义群落。拖动旋转、滚轮缩放，先看“抱团”，再点红色按钮看类比算式动起来。"
      >
        <CosmosDemo />
        <p className="lead mt14">再次提醒：这些坐标是作者为教学手工摆放的 3D 示意。真实模型里它们是几百上千维、由训练自动确定的 —— 但“近 = 像、关系 = 方向”这两条直觉，原封不动地成立。</p>
      </Lsec>

      <Lsec
        title="📖 深入展开｜坐标是怎么被“推”出来的：一道做了亿万遍的填空题"
        lead="前面反复说“坐标是学出来的”，这一节把“学”字拆开看。你会发现整个过程朴素得近乎离谱：模型从头到尾只在做一件事 —— 填空题。没有语言学家参与，没有人批改过一份“语义标准答案”。"
      >
        <div className="use-grid cols-2">
          <div className="card use-card">
            <div className="label">是什么 · 一句话</div>
            <div className="en">训练 = 亿万道<b>填空题</b></div>
            <div className="zh">把一句正常的话挖掉一个词 ——「猫在沙发上 ____」—— 让模型用周围的词去猜被挖掉的是什么。word2vec 干的就是这件事；今天大模型预训练的“猜下一个词”（第 12 课），是同一招的放大版。</div>
          </div>
          <div className="card use-card">
            <div className="label">为什么非它不可</div>
            <div className="en">因为“意思”<b>没法人工标</b></div>
            <div className="zh">汉语几十万词，每个词上千个坐标值，没有任何团队填得完；更要命的是，“意思”本来就没有标准答案，唯一可靠的线索是<b>用法</b>。而互联网恰好免费提供了亿万句“自带答案的填空题”—— 一个标注员都不用雇。</div>
          </div>
        </div>
        <p className="lead mt14">它如何一步步工作？只有四步，第 4 课的梯度下降在这里重新登场：</p>
        <div className="use-grid cols-2">
          <div className="card use-card">
            <div className="label">第 1 步</div>
            <div className="en">随机撒点</div>
            <div className="zh">训练开始时，每个词领到一串纯随机数字。此刻「猫」可能紧挨着「民法典」—— 空间一片混沌，模型对语言一无所知。</div>
          </div>
          <div className="card use-card">
            <div className="label">第 2 步</div>
            <div className="en">做题：用邻居猜空格</div>
            <div className="zh">读到「猫在沙发上打盹」，遮住「猫」，让模型拿“沙发”“打盹”的坐标去猜空格 —— 它会给词表里每个词打一个“像不像答案”的分。</div>
          </div>
          <div className="card use-card">
            <div className="label">第 3 步</div>
            <div className="en">错了就推一把</div>
            <div className="zh">猜错了，就顺着“哪里错了”回头修改坐标：把正确答案往这个语境拉近一点，把瞎猜的词推远一点。每次只动一点点 —— 正是第 4 课下山的那一小步。</div>
          </div>
          <div className="card use-card">
            <div className="label">第 4 步</div>
            <div className="en">重复亿万次</div>
            <div className="zh">「猫」和「狗」总出现在同款语境里，于是被一次次推向同一片区域。群落、性别箭头、首都箭头 —— 全是这个笨办法攒出来的副产品。</div>
          </div>
        </div>
        <p className="lead mt14">空说无凭，下面亲手“训练”一次。十个词从随机位置出发，每点一次「训练一步」，就相当于做完一大批填空题 —— 盯住灰点怎么变色、归队：</p>
        <TrainDemo />
        <div className="example mt14">
          <div className="en">这个办法的死穴：<span className="hl">一个词只有一个点</span></div>
          <div className="zh">「苹果真甜」和「苹果发布会」里的“苹果”明明是两个意思，老式词向量却只能发给它一个坐标 —— 多义词被压扁成了平均值。另外，语料里的偏见也会原样压进空间：如果文本里“医生”总和“他”作伴，空间里就会留下这道歪箭头。多义的难题怎么破？接着往下看 —— 这正是大模型对老词向量的关键跃迁。</div>
        </div>
      </Lsec>

      <Lsec
        title="📖 深入展开｜在 ChatGPT 体内：embedding 是第一站，而且是“活”的"
        lead="word2vec 是 2013 年的技术，为什么今天用 ChatGPT、Claude 的你还必须懂它？因为每个大模型体内都装着它的继承者，而且完成了一次关键升级：坐标从“死”的变成了“活”的。先看它在大模型流水线里的位置 ——"
      >
        <div className="use-grid">
          <div className="card use-card">
            <div className="label">入口 · 第一站</div>
            <div className="en">每个 token 先<b>查表领坐标</b></div>
            <div className="zh">你发出的话先被切成 token（第 11 课细讲），模型做的第一件事就是到体内那张 embedding 表里，把每个 token 换成一个向量。从这一刻起，所有计算只见数字，再也见不到文字。</div>
          </div>
          <div className="card use-card">
            <div className="label">中段 · 几十层“调味”</div>
            <div className="en">向量被上下文<b>不断改写</b></div>
            <div className="zh">查表领到的只是“字典义”。接下来几十层注意力（下一课）让每个词的向量参考周围的词反复修正 —— 整句读完，「苹果」可能已被「发布会」拽进科技区。这叫<b>语境化向量</b>，是大模型与 word2vec 的分水岭。</div>
          </div>
          <div className="card use-card">
            <div className="label">出口 · 还是比距离</div>
            <div className="en">生成回答也靠<b>这片空间</b></div>
            <div className="zh">模型吐下一个词时，本质是拿当前语境的向量去和词表里所有候选词比“匹配度”—— 谁匹配谁概率大（怎么按概率抽签，第 14 课讲）。大模型的一进一出，都发生在向量空间里。</div>
          </div>
        </div>
        <p className="lead mt14">“活”坐标长什么样？下面这个演示里，「苹果」的位置不再固定 —— 点不同的句子，看上下文把它拽向哪边：</p>
        <CtxDemo />
        <p className="lead mt14">懂了“查表 + 改写”这条流水线，你平时在 ChatGPT / Claude 里看到的很多“灵性瞬间”就都有了解释 ——</p>
        <table className="match card">
          <thead><tr><th>你看到的现象</th><th>背后的向量空间机制</th></tr></thead>
          <tbody>
            <tr><td className="be">换种说法问，它照样懂</td><td className="ex">「怎么退货」和「如何申请退款」字面几乎不重合，向量却近乎重合 —— 模型理解的是空间里的<b>位置</b>，不是字面。</td></tr>
            <tr><td className="be">打错字也大多能猜对</td><td className="ex">「机器学系是什么」—— 上下文会把错字的向量“拉回”正确语义附近：邻居词决定了它落进哪个群落。</td></tr>
            <tr><td className="be">中文提问，能用上英文世界的知识</td><td className="ex">多语言训练把「猫」和 cat 嵌到了几乎同一个点 —— 知识挂在位置上，不挂在语种上。</td></tr>
            <tr><td className="be">接上知识库就能答内部问题</td><td className="ex">RAG：把公司文档切块算成向量入库，提问时按距离捞最近的几块塞给模型 —— 第 18 课带你亲手搭。</td></tr>
          </tbody>
        </table>
        <div className="example mt14">
          <div className="en">边界提醒：距离近 = <span className="hl">语境像</span>，不等于“事实对”</div>
          <div className="zh">「我爱你」和「我恨你」的向量相当近 —— 句式、场景几乎一样。所以语义检索偶尔会捞回“长得像但答非所问”的段落；向量空间也分不清真话和谣言，它压缩的是语言的统计规律，不是世界的真相。这条边界，第 18 课（RAG 的坑）和第 29 课（幻觉与评估）还会反复用到。</div>
        </div>
      </Lsec>

      <Lsec
        title="🌐 万物皆可 embedding"
        lead="这套“压成向量、按距离办事”的思路完全不挑对象。只要能定义“谁和谁应该相近”，任何东西都能被嵌进同一种空间 —— 这正是它成为现代 AI 基础设施的原因。"
      >
        <div className="use-grid">
          <div className="card use-card">
            <div className="label">不止是词</div>
            <div className="en">句子与文档 <b>→ 一个点</b></div>
            <div className="zh">整段话也能压成一个向量：“今天股市大跌”和“A 股全线重挫”用词不同，点却紧挨着 —— 比对关键词的老办法看不出这层关系。</div>
          </div>
          <div className="card use-card">
            <div className="label">跨越媒介</div>
            <div className="en">图片与文字 <b>→ 同一空间</b></div>
            <div className="zh">CLIP 这类模型把图和文嵌进同一片空间：“一只奔跑的狗”这句话的点，就挨着狗狗照片的点。以文搜图、以图搜图由此而来。</div>
          </div>
          <div className="card use-card">
            <div className="label">连人也可以</div>
            <div className="en">用户与商品 <b>→ 同一空间</b></div>
            <div className="zh">推荐系统把你的口味和千万件商品放进一个空间，你的点附近漂着什么，首页就给你推什么 —— “猜你喜欢”猜的其实是距离。</div>
          </div>
        </div>
        <table className="match card mt14">
          <thead><tr><th>应用</th><th>怎么用“距离”办事</th></tr></thead>
          <tbody>
            <tr><td className="be">语义搜索</td><td className="ex">搜“便宜的住处”，能命中“经济型酒店” —— 关键词一个不重合，向量距离却很近。搜索从“对字”升级为“对意思”。</td></tr>
            <tr><td className="be">推荐 / 去重</td><td className="ex">把你听过的歌变成向量求平均，附近的歌就是新歌单；两篇新闻向量几乎重合，就是洗稿或重复，自动归并。</td></tr>
            <tr><td className="be">RAG 检索</td><td className="ex">公司文档切块、向量化入库；你提问时，先按距离捞出最相关的几块，再喂给大模型作答 —— 完整流程第 18 课拆给你看。</td></tr>
          </tbody>
        </table>
        <p className="lead mt14">业界甚至把这件事做成了独立的产品形态：专门的 <b>embedding 模型</b>（输入文字、吐出向量，不聊天）和<b>向量数据库</b>（专门按距离检索的仓库）。第 18、28 课，你会亲手把这两块积木拼成一个能回答内部问题的系统 —— 到那时回头看，会发现整套系统的灵魂就是本课这一句：距离 = 语义相似度。</p>
      </Lsec>

      <Lsec title="⚠️ 常见误区">
        <div className="card alert-card row-list">
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">每个维度都有明确含义，比如第 7 维代表“性别”、第 42 维代表“大小”</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">绝大多数维度没有人能读懂的含义，“性别”这类概念散落在几百个维度的组合方向里</span></div>
            </div>
            <p className="why"><b>病因：</b>把 embedding 想象成一张人设计的表格 —— 身高一栏、性别一栏。实际上坐标系是训练自动形成的，单独抽出某一维看，几乎全是噪声；像“性别方向”这种可解释的箭头，是研究者<b>事后</b>从整体里挖出来的维度组合，不是某一根坐标轴。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">embedding 是查一本巨大的“词→数字”词典查出来的固定数值</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">它是模型在海量文本上训练出来的统计产物 —— 换一批语料、换一个模型，坐标就完全不同</span></div>
            </div>
            <p className="why"><b>病因：</b>“词变数字”听起来像查表。早期 word2vec 训练完确实能存成一张静态表，但表里的数值是<b>学</b>出来的，不是谁规定的；而现代大模型里，同一个词的向量还会随上下文实时变化 ——「苹果发布会」和「苹果真甜」里的“苹果”不是同一个点，怎么变的，正是下一课注意力机制的故事。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">两句话向量距离近，说明它们意思相同、内容可信</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">距离近只说明“语境相似”—— 反义句、立场相反的句子常常是近邻</span></div>
            </div>
            <p className="why"><b>病因：</b>把“语义相似度”听成了“等价”。embedding 来自“看谁总出现在同款语境”，而「股价大涨」和「股价大跌」恰恰共享同款语境，距离反而很近。做语义搜索和 RAG 时务必记住这一条 —— 否则会把“看起来像”的错误答案当成正确答案。</p>
          </div>
        </div>
      </Lsec>

      <Lsec title="✍️ 小练习">
        <div className="card quiz row-list">
          <QuizItem q="1. 用本课的概念解释：为什么在向量搜索里，搜“便宜的住处”能找到“经济型酒店”，哪怕两句话没有一个字相同？">
            因为搜索比对的不是文字而是 <b>embedding 之间的距离</b>。“便宜的住处”和“经济型酒店”在海量文本里出现的语境高度相似（订房、价格、评价……），训练后它们的向量被推得很近 —— 距离近就会被检索出来，字面重不重合根本不参与计算。
          </QuizItem>
          <QuizItem q="2. 仿照明星算式做一道题：巴黎 − 法国 + 日本 ≈ ？，并说出每一步在“搬运”什么。">
            <b>≈ 东京。</b>「巴黎 − 法国」这支箭头捕捉的是“首都”关系；把它平移加到「日本」上，落点自然在「东京」附近 —— 和性别箭头一样，首都箭头在空间里也是近似平行的。
          </QuizItem>
          <QuizItem q="3. 朋友兴奋地说：“我发现模型向量的第 42 维存的就是词的褒贬！”这个说法有什么问题？">
            问题在于<b>把“方向”当成了“坐标轴”</b>。绝大多数单个维度不可解读，褒贬这类语义通常是几百个维度的组合方向；就算他真在数据里找到了一个与褒贬相关的方向，那也是事后挖掘的产物，且换个模型、换批语料就会变 —— 没有任何机制保证它恰好落在第 42 根轴上。
          </QuizItem>
          <QuizItem q="4. 在 word2vec 里「苹果」只有一个固定向量，在 ChatGPT 这类大模型里它却“会动”。用本课概念解释这个区别，并说明“动”的动力来自哪里。">
            word2vec 是<b>静态词向量</b>：一词一点，「苹果」的水果义和公司义被压成一个平均位置。大模型里 token 先查 embedding 表领到初始向量，随后被几十层网络按上下文反复改写成<b>语境化向量</b> ——「苹果真甜」里它漂向水果群落，「苹果发布会」里漂向科技群落。“动力”来自周围的词：每个词参考邻居来更新自己，至于具体怎么参考，就是下一课注意力机制的内容。
          </QuizItem>
        </div>
      </Lsec>
    </>
  )
}
