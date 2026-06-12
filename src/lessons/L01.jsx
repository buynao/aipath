import { useState } from 'react'
import { Lsec, DemoPanel, Chips, Pill, FlipCard, QuizItem } from '../components/ui.jsx'

const DATA = {
  ai: {
    title: '人工智能 Artificial Intelligence',
    period: '1956 年 · 达特茅斯会议命名',
    desc: '让机器表现出智能的一切努力 —— 是一个领域、一个梦想，而不是某种具体技术。手写规则的专家系统、棋类搜索算法都属于这一圈，哪怕它们完全不会“学习”。',
    tags: ['专家系统', '深蓝下棋', '路径搜索'],
  },
  ml: {
    title: '机器学习 Machine Learning',
    period: '1980 年代 · 兴起为主流路线',
    desc: '实现 AI 的一条路线：不再由人逐条写规则，而是让机器从数据中自动找出规律。数据越多，通常表现越好 —— “学习”二字从此有了实义。',
    tags: ['垃圾邮件过滤', '推荐系统', '信用评分'],
  },
  dl: {
    title: '深度学习 Deep Learning',
    period: '2012 年 · AlexNet 引爆',
    desc: '机器学习的一种方法：用层数很深的神经网络自动学习特征。这一轮 AI 浪潮的全部主角 —— ChatGPT、Midjourney、自动驾驶感知 —— 都基于它。',
    tags: ['ChatGPT', '人脸识别', 'AlphaGo'],
  },
}

const FLIPS = [
  { q: '1997 年击败国际象棋世界冠军的“深蓝”', pill: { type: 'sky', text: '最外圈 · 传统 AI' },
    why: '靠暴力搜索 + 人类写好的评估规则取胜，不从数据中学习 —— 是 AI，但不是机器学习。' },
  { q: '邮箱的垃圾邮件过滤器', pill: { type: 'amber', text: '中间圈 · 机器学习' },
    why: '从海量“垃圾 / 正常”邮件样本中学出规律，经典机器学习的教科书案例。' },
  { q: 'ChatGPT', pill: { type: 'sage', text: '最内圈 · 深度学习' },
    why: '基于深度神经网络（Transformer）的大语言模型，同时也属于机器学习和 AI —— 套娃，记得吗？' },
  { q: '手机相册自动按人脸分类', pill: { type: 'sage', text: '最内圈 · 深度学习' },
    why: '人脸识别靠卷积神经网络（第 7 课会讲），是深度学习最早落地的应用之一。' },
  { q: '“智能”空调：温度高于 26℃ 自动制冷', pill: { type: 'ink', text: '圈外 · 写死的规则' },
    why: '一条 if-else 而已，没有任何学习。营销里的“智能”和技术上的 AI，常常不是一回事。' },
  { q: '购物网站的“猜你喜欢”', pill: { type: 'amber', text: '中间圈 · 机器学习' },
    why: '从你和千万用户的行为数据中学习偏好。经典做法用协同过滤，新一代也开始用深度学习。' },
]

// 交互三圈 SVG
function VennDemo() {
  const [key, setKey] = useState('ai')
  const d = DATA[key]
  const ringClass = (k) => `venn-ring${k === key ? ' active' : ' dim'}`

  const stage = (
    <svg
      id="venn"
      viewBox="0 0 400 400"
      width="360"
      aria-label="三个嵌套的圆：人工智能包含机器学习，机器学习包含深度学习"
    >
      <g className={ringClass('ai')} onClick={() => setKey('ai')}>
        <circle cx="200" cy="200" r="172" fill="var(--sky)" fillOpacity="0.5" stroke="var(--sky)" strokeWidth="1.5" />
        <text x="200" y="62" textAnchor="middle" fontSize="15" fill="var(--fg-0)">人工智能 AI</text>
        <text className="sub" x="200" y="80" textAnchor="middle" fill="var(--fg-1)">1956 ·「让机器有智能」的梦想</text>
      </g>
      <g className={ringClass('ml')} onClick={() => setKey('ml')}>
        <circle cx="200" cy="240" r="120" fill="var(--amber)" fillOpacity="0.5" stroke="var(--amber)" strokeWidth="1.5" />
        <text x="200" y="152" textAnchor="middle" fontSize="14" fill="var(--fg-0)">机器学习 ML</text>
        <text className="sub" x="200" y="169" textAnchor="middle" fill="var(--fg-1)">1980s · 从数据中学规则</text>
      </g>
      <g className={ringClass('dl')} onClick={() => setKey('dl')}>
        <circle cx="200" cy="285" r="64" fill="var(--sage)" fillOpacity="0.55" stroke="var(--sage)" strokeWidth="1.5" />
        <text x="200" y="282" textAnchor="middle" fontSize="13" fill="var(--fg-0)">深度学习 DL</text>
        <text className="sub" x="200" y="299" textAnchor="middle" fill="var(--fg-1)">2012 · 多层神经网络</text>
      </g>
    </svg>
  )

  const side = (
    <>
      <Chips
        options={[
          { key: 'ai', label: '人工智能' },
          { key: 'ml', label: '机器学习' },
          { key: 'dl', label: '深度学习' },
        ]}
        value={key}
        onChange={setKey}
      />
      <h4 style={{ marginTop: 14 }}>{d.title}</h4>
      <div className="period">{d.period}</div>
      <p>{d.desc}</p>
      <div className="tags">
        {d.tags.map((t) => (
          <Pill key={t} type="ink">{t}</Pill>
        ))}
      </div>
    </>
  )

  return <DemoPanel title="🎛️ 交互演示 · AI 的三个圈" hint="点击圆环或下方按钮切换" stage={stage} side={side} />
}

export default function L01() {
  return (
    <>
      <Lsec title="🎯 你将学会">
        <div className="card goals">
          <div className="goal-item"><span className="tick">✓</span>一句话说清 AI、机器学习、深度学习的包含关系，看新闻不再发懵</div>
          <div className="goal-item"><span className="tick">✓</span>知道三个圈各自的代表技术和典型产品</div>
          <div className="goal-item"><span className="tick">✓</span>掌握一个判断标准：这个产品到底有没有在“学习”</div>
          <div className="goal-item"><span className="tick">✓</span>记住三个关键年份：1956、1980s、2012 —— 三个圈各自的起点</div>
        </div>
      </Lsec>

      <Lsec
        title="💡 核心概念：三个套娃般的圈"
        lead="人工智能是最大的圈（一个梦想），机器学习是其中一个圈（一条路线），深度学习是更小的圈（一种方法）。今天所有刷屏的 AI —— ChatGPT、Midjourney、自动驾驶 —— 几乎都住在最里面那个小圈里。点击下图的每一环看看。"
      >
        <VennDemo />
      </Lsec>

      <Lsec title="📖 三个圈，三句话" lead="把它们各自最关键的一句话记住，这一课就值回票价了。">
        <div className="use-grid">
          <div className="card use-card">
            <div className="label">最外圈 · 1956 年起</div>
            <div className="en">人工智能 <b>AI</b></div>
            <div className="zh">让机器表现出智能的<b>一切</b>努力 —— 包括手写规则的老方法。早年的专家系统、下棋程序都算 AI，但它们不会“学习”。</div>
          </div>
          <div className="card use-card">
            <div className="label">中间圈 · 1980s 兴起</div>
            <div className="en">机器学习 <b>ML</b></div>
            <div className="zh">不再由人写规则，而是让机器<b>从数据里自己找规律</b>。垃圾邮件过滤、推荐系统是它的经典代表作。</div>
          </div>
          <div className="card use-card">
            <div className="label">最内圈 · 2012 年爆发</div>
            <div className="en">深度学习 <b>DL</b></div>
            <div className="zh">用<b>多层神经网络</b>做机器学习。人脸识别、AlphaGo、ChatGPT —— 这一轮 AI 浪潮的主角全在这里。</div>
          </div>
        </div>
      </Lsec>

      <Lsec
        title="🎛️ 动手分一分"
        lead="下面 6 个东西分别属于哪个圈？先自己判断，再点卡片揭晓答案。判断标准只有一条：它有没有从数据中学习？用的是不是神经网络？"
      >
        <div className="flip-grid">
          {FLIPS.map((f, i) => (
            <FlipCard key={i} q={f.q} pill={f.pill} why={f.why} />
          ))}
        </div>
      </Lsec>

      <Lsec title="⚠️ 常见误区">
        <div className="card alert-card row-list">
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">AI 就是机器人</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">机器人是“身体”，AI 是“大脑”—— 大多数 AI（比如 ChatGPT）根本没有身体</span></div>
            </div>
            <p className="why"><b>病因：</b>科幻电影的视觉印象。实际上 AI 绝大多数时候只是服务器里运行的程序，而很多机器人（如流水线机械臂）只执行固定动作，并没有 AI。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">深度学习这么火，其他机器学习方法都过时了</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">在表格类数据上，梯度提升树等经典方法至今常常胜过神经网络</span></div>
            </div>
            <p className="why"><b>病因：</b>新闻只报道深度学习的突破。工业界的风控、定价、销量预测大量使用经典机器学习 —— 方法没有高低，只有合不合适。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">ChatGPT 这么聪明，说明通用人工智能（AGI）已经实现了</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">目前所有落地的 AI 都是“专用 AI”，AGI 何时到来仍是开放问题</span></div>
            </div>
            <p className="why"><b>病因：</b>把“对话流畅”等同于“全面智能”。大模型在很多任务上仍会出错和“幻觉”（第 29 课细讲），离稳定可靠的通用智能还有距离 —— 距离多远，专家们也在激烈争论。</p>
          </div>
        </div>
      </Lsec>

      <Lsec title="✍️ 小练习">
        <div className="card quiz row-list">
          <QuizItem q="1. 判断：所有深度学习模型都是机器学习模型吗？所有机器学习系统都是 AI 吗？">
            <b>都是。</b>深度学习 ⊂ 机器学习 ⊂ 人工智能，小圈必然属于大圈。但反过来不成立：深蓝是 AI，却不是机器学习。
          </QuizItem>
          <QuizItem q="2. 朋友的创业产品宣称“搭载 AI 技术”。你想判断它是真有学习能力还是营销话术，该问什么？">
            问一句：<b>“它从什么数据里学习？数据变多它会变好吗？”</b>如果答案是“规则是我们配置好的”，那它只是普通程序 + 营销词；如果它确实随数据迭代变强，才是机器学习。
          </QuizItem>
          <QuizItem q="3. 把三个年份和事件连起来：1956 / 1980s / 2012 —— 深度学习爆发、AI 概念诞生、机器学习兴起。">
            <b>1956</b> 达特茅斯会议提出“人工智能”一词 → <b>1980s</b> 机器学习作为独立路线兴起 → <b>2012</b> AlexNet 在图像识别竞赛中碾压对手，深度学习时代开启。
          </QuizItem>
        </div>
      </Lsec>
    </>
  )
}
