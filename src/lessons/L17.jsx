import { useState } from 'react'
import { Lsec, QuizItem } from '../components/ui.jsx'

// ============================================================
// 上下文窗口"挤出"演示
// ============================================================
const CAP = 4
const SLOT_X = [82, 200, 318, 436]
const BASE_Y = 56
const ROUNDS = [
  { u: ['你：我叫小芸，', '花生过敏，帮我', '规划三天早餐'], a: ['AI：记住了！', '第一天：燕麦粥', '＋水煮蛋'] },
  { u: ['你：第二天想', '吃中式的'], a: ['AI：小米粥＋', '素包子，已避', '开花生 ✓'] },
  { u: ['你：第三天来', '点西式的'], a: ['AI：第三天：', '全麦吐司＋牛', '油果＋酸奶'] },
  { u: ['你：周末想加', '一顿下午茶'], a: ['AI：司康饼配', '果酱，茶选', '乌龙茶'] },
  { u: ['你：再推荐个', '解馋小零食'], a: ['AI：海苔脆片', '或酸奶杯，少', '糖更健康'] },
  { u: ['你：我能吃花', '生酱吐司吗？'], a: ['AI：当然可以！', '花生酱营养丰', '富，很推荐 ⚠'], wrong: true },
  { u: ['你：？！你忘了', '我花生过敏？'], a: ['AI：抱歉……', '窗内已没有', '这条信息了'] },
]
const CAPS = [
  '窗口还是空的（真实窗口按 token 计，这里简化成“轮”）', '第 1 轮入窗 —— 关键信息「花生过敏」就在窗内',
  '第 2 轮入窗，还有 2 个空位', '第 3 轮入窗，还有 1 个空位', '窗满了 —— 下一轮进来，最早的就会被挤出去',
  '第 1 轮被挤出窗外 —— 模型已经看不见它了', '⚠ 窗内已没有过敏史：模型自信地答错了', '这不是模型变笨 —— 是关键信息出窗了',
]
const WARN_STEPS = { 5: true, 6: true }
const INFO = [
  { t: '窗还是空的', d: '点「下一轮对话」，客户端会把新一轮问答装进窗口。留意第 1 轮的关键信息：小芸对花生过敏。' },
  { t: '关键信息入窗', d: '「花生过敏」现在在窗内。只要它还在窗里，模型每次接龙都看得见它，回答就会自动绕开花生。' },
  { t: '模型答得很稳', d: 'AI 主动避开了花生 —— 不是它“记得”，是这一轮打包发出时，第 1 轮还在包裹里，它重新读到了。' },
  { t: '继续装', d: '照旧。别忘了：每发一轮，客户端都把窗内全部内容重发一遍，模型从头读起 —— 这也是越聊越贵的原因。' },
  { t: '窗满了', d: '4 个位置全部占用。真实产品里这一刻通常悄无声息 —— 没有任何“即将失忆”的提醒。' },
  { t: '第 1 轮被挤出', d: '新对话进来，最早的一轮被挤出窗外、变灰飘走。聊天记录里它还在（你翻得到），但发给模型的包裹里已经没有它 —— 模型看不见了。' },
  { t: '失忆现场 ⚠', d: '你问“能吃花生酱吗”，窗内已没有过敏史。模型不是撒谎也不是变笨 —— 它是真的看不见，于是按常识热情推荐。这就是长对话翻车的标准剧本。' },
  { t: '复盘', d: '对策三条：① 关键信息时不时重申一遍，把它放回窗的最新位置；② 长对话定期让 AI 总结要点，用摘要开新会话；③ 重要约束别指望它“记得”，每次都带上。点「重新开始」可再看一遍。' },
]

function CtxCard({ round, idx, step }) {
  const winStart = Math.max(0, step - CAP)
  let evicted = false, opacity = 0, tx = 575, ty = BASE_Y
  if (idx >= step) { opacity = 0; tx = 575; ty = BASE_Y } // 未进场
  else if (idx < winStart) { evicted = true; opacity = 0; tx = -130; ty = BASE_Y - 26 } // 被挤出
  else { opacity = 1; tx = SLOT_X[idx - winStart]; ty = BASE_Y } // 窗内
  return (
    <g className={`ctx-card${evicted ? ' evicted' : ''}`} style={{ opacity, transform: `translate(${tx}px,${ty}px)` }}>
      <text x="50" y="12" fontSize="10" fill="var(--fg-2)" textAnchor="middle">第 {idx + 1} 轮</text>
      <rect className="bub-u" x="0" y="20" width="100" height="58" rx="8" strokeWidth="1" />
      {round.u.map((line, i) => <text key={i} x="7" y={35 + i * 13} fontSize="10" fill="var(--fg-0)">{line}</text>)}
      <rect className={`bub-a${round.wrong ? ' wrong' : ''}`} x="0" y="86" width="100" height="72" rx="8" strokeWidth="1" />
      {round.a.map((line, i) => <text key={i} x="7" y={101 + i * 13} fontSize="10" fontWeight={round.wrong ? 600 : 400} fill="var(--fg-0)">{line}</text>)}
    </g>
  )
}

function ContextWindowDemo() {
  const [step, setStep] = useState(0)
  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · 上下文窗口的“挤出”机制</span>
        <span className="demo-hint">蓝 = 你说的 · 绿 = AI 答的 · 黄 = 系统提示</span>
      </div>
      <div className="demo-body stack">
        <div className="demo-stage">
          <div className="demo-stage-col">
            <svg id="ctx-svg" viewBox="0 0 560 240" width="540" aria-label="上下文窗口演示：对话气泡从右侧进入窗口，装满后最早的气泡被挤出左侧">
              <text x="14" y="26" fontSize="13" fontWeight="700" fill="var(--fg-0)">上下文窗口</text>
              <text x="110" y="26" fontSize="11" fill="var(--fg-2)">容量：4 轮对话</text>
              <text x="546" y="26" fontSize="11" fill="var(--fg-2)" textAnchor="end">新对话从右侧推入 →</text>
              <rect x="14" y="40" width="532" height="188" rx="18" fill="none" stroke="var(--hairline-strong)" strokeWidth="1.5" strokeDasharray="6 4" />
              <g>
                <rect x="26" y="56" width="44" height="158" rx="10" fill="var(--amber-bg)" stroke="var(--amber)" strokeWidth="1" />
                <text x="48" y="84" fontSize="12" fill="var(--fg-1)" textAnchor="middle">📌</text>
                {['系', '统', '提', '示'].map((c, i) => <text key={i} x="48" y={110 + i * 18} fontSize="11" fontWeight="600" fill="var(--fg-0)" textAnchor="middle">{c}</text>)}
              </g>
              <g>
                {ROUNDS.map((r, i) => <CtxCard key={i} round={r} idx={i} step={step} />)}
              </g>
            </svg>
            <div className={`ctx-caption${WARN_STEPS[step] ? ' warn' : ''}`}>{CAPS[step]}</div>
          </div>
        </div>
        <div className="demo-side">
          <div className="chips">
            <button className="chip" disabled={step >= ROUNDS.length} onClick={() => setStep((s) => Math.min(ROUNDS.length, s + 1))}>下一轮对话 ▸</button>
            <button className="chip" onClick={() => setStep(0)}>↺ 重新开始</button>
            <span className="footnote" style={{ alignSelf: 'center' }}>第 {step} / {ROUNDS.length} 轮</span>
          </div>
          <h4 style={{ marginTop: 14 }}>{INFO[step].t}</h4>
          <p>{INFO[step].d}</p>
        </div>
      </div>
    </div>
  )
}

export default function L17() {
  return (
    <>
      <Lsec title="🎯 你将学会">
        <div className="card goals">
          <div className="goal-item"><span className="tick">✓</span>一句话说清大模型的“记忆”真相：没有记忆体，只有一扇窗 —— 每轮回答，它只看得见窗内的 token</div>
          <div className="goal-item"><span className="tick">✓</span>用同一把钥匙解开三个日常谜团：聊久了忘开头、新开会话全忘、长文档塞不进</div>
          <div className="goal-item"><span className="tick">✓</span>知道“窗口大 ≠ 看得清”：关键信息放在长上下文的中间最容易被看丢，重要内容要放两头</div>
          <div className="goal-item"><span className="tick">✓</span>看懂窗口军备竞赛的账本：窗口翻 10 倍、计算量翻约 100 倍，以及滚动摘要与 RAG 两条破局路</div>
        </div>
      </Lsec>

      <Lsec
        title="💡 核心概念：大模型没有记忆体，只有一扇“窗”"
        lead="上一课结尾埋了个伏笔：prompt 不只是你刚打的那行字，整个对话历史都是续写条件。这一课把这件事算总账。先抛一个反直觉的事实：大模型没有任何“记忆体”。它不会把你说过的话“记在脑子里”；严格地说，它连“上一轮”这个概念都没有 —— 每次回答，对它而言都是第一次读到这场对话。"
      >
        <div className="contrast">
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-ink">直觉印象</span></div>
            <div className="big">AI 在和我连续聊天 <span className="gap">→</span> 它一直“在线”，记着我们聊过的一切</div>
            <p className="note">按这个理解，它应该越聊越懂你、换个会话也认识你 —— 而这两件事恰恰都不成立。</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">真实机制</span></div>
            <div className="big">模型只有一扇“窗” <span className="gap">→</span> 每轮回答，它能看见的<span className="hl">只有窗内的 token</span></div>
            <p className="note">窗内 = 系统提示 + 对话历史 + 你刚打的话。窗外的一切 —— 包括你们“聊过”的内容 —— 等于不存在。</p>
          </div>
        </div>
        <p className="lead mt14">这扇窗就是<b>上下文窗口（context window）</b>：模型一次能“看见”的 token 数上限。最贴切的比喻是一张<b>大小固定的书桌</b>：所有要参考的资料必须摊在桌面上，模型才看得见；桌面之外没有抽屉、没有书架 —— 放不下的纸，等于不存在。为什么非这样设计不可？两个根源你都学过：</p>
        <div className="use-grid cols-2">
          <div className="card use-card"><div className="label">根源一 · 第 12 课</div><div className="en">知识<b>冻结</b>在参数里</div><div className="zh">预训练结束后，模型的千亿级参数就封板了。你和它聊天<b>不会改动任何一个参数</b> —— 对话内容在模型内部根本没有地方可“存”。能存的只有窗。</div></div>
          <div className="card use-card"><div className="label">根源二 · 第 9 课</div><div className="en">注意力需要<b>边界</b></div><div className="zh">注意力机制是“每个词看所有词”。“所有词”必须有个上限，否则算力和显存撑不住 —— 这个硬上限，就是窗口的尺寸。</div></div>
        </div>
        <p className="lead mt14">那“连续聊天”是怎么做到的？答案会刷新你对每一次发送的理解 —— 跟着一条消息走完全程：</p>
        <div className="card card-pad">
          <div className="flow">
            <div className="flow-step"><span className="num">1</span><span className="txt"><b>你按下发送。</b>屏幕上看起来，你只发出了一行字。</span></div>
            <div className="flow-step"><span className="num">2</span><span className="txt"><b>客户端打包。</b>ChatGPT / Claude 的网页或 APP 把【系统提示 + 之前的全部问答 + 你的新消息】拼成一个长文本。</span></div>
            <div className="flow-step"><span className="num">3</span><span className="txt"><b>整包发给模型。</b>模型从第一个 token 读到最后一个 —— 就像第一次读到这场对话。</span></div>
            <div className="flow-step"><span className="num">4</span><span className="txt"><b>接龙生成回答。</b>逐 token 输出，老朋友了（第 12、14 课）。</span></div>
            <div className="flow-step"><span className="num">5</span><span className="txt"><b>读完即忘。</b>回答被客户端存进聊天记录，模型立刻回到“白纸”状态。下一轮？从第 1 步重来 —— 只是包裹又长了一截。<span className="footnote">所谓“聊天”，是客户端每轮替你把全部历史重发一遍而维持的幻觉。</span></span></div>
          </div>
        </div>
        <p className="lead mt14">第 11 课的伏笔现在也能收了：API 按 token 计费，而每一轮都要重发全部历史 —— <b>第 50 轮的提问，要为前 49 轮的所有 token 再付一次钱</b>。“越聊越贵”不是定价套路，是机制使然。把你在产品里见过的现象和这条机制连上线：</p>
        <div className="card">
          <table className="match">
            <thead><tr><th>你在 ChatGPT / Claude 里看到的现象</th><th>背后的机制</th></tr></thead>
            <tbody>
              <tr><td><b>昨天的会话今天点开还能接着聊</b></td><td className="ex">不是模型记得你 —— 历史存在产品的数据库里，你一开口，客户端把它整包重发</td></tr>
              <tr><td><b>对话越长，回答越慢</b></td><td className="ex">窗内 token 越多，每生成一个新词都要“看”更多旧词（第 9 课）</td></tr>
              <tr><td><b>API 账单越聊越贵</b></td><td className="ex">每轮重发全部历史，按 token 全额计费（第 11 课）</td></tr>
              <tr><td><b>让它“忘掉刚才那句”，它怎么也忘不掉</b></td><td className="ex">只要那句话还在窗内，模型就看得见 —— 想真忘，只能从历史里删掉或开新会话</td></tr>
            </tbody>
          </table>
        </div>
        <p className="lead mt14">窗的本领讲完了，该讲窗的局限：它是<b>有限的</b>，而且是<b>会话级的</b>。这两条局限，恰好对应你日常被坑得最多的三个谜团 —— 下一节一把钥匙全开。</p>
      </Lsec>

      <Lsec
        title="📖 三个日常谜团，一把钥匙全开"
        lead="这三件事你大概率都遇到过，而且多半以为是“AI 抽风”。现在用“窗”重新看一遍 —— 全是同一个机制的三张面孔。"
      >
        <div className="use-grid">
          <div className="card use-card"><div className="label">谜团一 · 窗满了</div><div className="en">聊久了<b>忘记开头</b></div><div className="zh">窗装满后，再来新对话，最早的内容就被<b>挤出窗外</b>（不同产品的处理不同：直接截断、滚动丢弃或偷偷压缩）。模型不是“忘了”开头 —— 是发给它的包裹里已经没有开头了。</div></div>
          <div className="card use-card"><div className="label">谜团二 · 窗是会话级的</div><div className="en">新开会话<b>全忘了</b></div><div className="zh">新会话 = 一扇全新的空窗。旧会话的历史不会被打包进来，模型也没有任何跨会话的存储 —— 它不是装失忆，它是<b>真的第一次见你</b>。</div></div>
          <div className="card use-card"><div className="label">谜团三 · 窗有上限</div><div className="en">长文档<b>塞不进</b></div><div className="zh">文档的 token 数超过窗口尺寸，模型物理上读不到 —— 于是你看到“文件过长”的报错，或者更隐蔽的：被<b>悄悄截断</b>，后半本书它压根没读过，却照样自信作答。</div></div>
        </div>
        <p className="lead mt14">这时一定有人举手：“不对啊，ChatGPT 明明记得我是程序员，新会话也记得！”好问题 —— 看一个真实风格的场景：</p>
        <div className="example">
          <div className="en">新会话第一句你只说了“推荐几本书”，它却回答「作为一名<span className="hl">程序员</span>，你可能会喜欢……」—— 它怎么知道的？</div>
          <div className="zh">这是产品层的<b>“记忆功能”</b>（ChatGPT 的 Memory、各家的“自定义指令 / 项目设定”）：产品把你以往对话里的要点提炼成小纸条存进<b>自己的数据库</b>，开新会话时再悄悄把纸条<b>塞回窗内</b>。模型本身依然零记忆 —— 是产品在替它递小抄。你可以亲自验证：去设置里找“记忆”，能看到一条条提炼好的纸条，删掉一条，它就真忘了。</div>
        </div>
        <p className="lead mt14">注意这个分层：<b>“记忆”是产品功能，不是模型能力。</b>所有看起来像“记住了”的体验 —— 会话列表、记忆功能、项目知识库 —— 本质都是同一招：<b>把信息存在窗外，用的时候塞回窗内</b>。记住这一招，下一课的 RAG 你会觉得似曾相识。</p>
      </Lsec>

      <Lsec
        title="📖 lost in the middle：窗口大，不等于看得清"
        lead="按前面的逻辑，窗口够大似乎就万事大吉 —— 把整本手册塞进去，想问哪页问哪页。但 2023 年斯坦福等机构的研究者做了个实验，结果给所有人泼了盆冷水。实验本身很朴素："
      >
        <div className="example">
          <div className="en">给模型几十份文档，其中<span className="hl">只有一份</span>藏着答案，然后把这份关键文档放在上下文的不同位置 —— 开头、中间、结尾 —— 问同一个问题。</div>
          <div className="zh">结果：放<b>开头</b>或<b>结尾</b>时，模型大概率答对；放<b>中间</b>时，正确率明显下滑 —— 最差的情况甚至不如不给文档、让模型闭卷瞎答。准确率画出来是一条 U 形曲线，论文标题就叫 <b>Lost in the Middle</b>（迷失在中间）。</div>
        </div>
        <div className="card card-pad mt14">
          <svg viewBox="0 0 460 210" width="440" style={{ display: 'block', margin: '0 auto', maxWidth: '100%' }} aria-label="U 形曲线：关键信息放在开头和结尾时成功率高，放在中间时明显下滑">
            <text x="54" y="22" fontSize="11" fill="var(--fg-2)">找到关键信息的成功率 ↑</text>
            <line x1="50" y1="30" x2="50" y2="172" stroke="var(--hairline-strong)" strokeWidth="1" />
            <line x1="50" y1="172" x2="430" y2="172" stroke="var(--hairline-strong)" strokeWidth="1" />
            <path d="M 70 52 C 130 60, 180 138, 240 140 C 300 138, 350 58, 410 50" fill="none" stroke="var(--sky)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="70" cy="52" r="5" fill="var(--sage)" />
            <circle cx="240" cy="140" r="5" fill="var(--terracotta)" />
            <circle cx="410" cy="50" r="5" fill="var(--sage)" />
            <text x="62" y="40" fontSize="11.5" fontWeight="600" fill="var(--fg-0)">放开头 · 找得到</text>
            <text x="240" y="160" fontSize="11.5" fontWeight="600" fill="var(--terracotta)" textAnchor="middle">放中间 · 最容易被看丢</text>
            <text x="418" y="40" fontSize="11.5" fontWeight="600" fill="var(--fg-0)" textAnchor="end">放结尾 · 找得到</text>
            <text x="70" y="192" fontSize="11" fill="var(--fg-1)" textAnchor="middle">开头</text>
            <text x="240" y="192" fontSize="11" fill="var(--fg-1)" textAnchor="middle">← 关键信息在上下文中的位置 →</text>
            <text x="410" y="192" fontSize="11" fill="var(--fg-1)" textAnchor="middle">结尾</text>
          </svg>
        </div>
        <p className="lead mt14">为什么会这样？确切机制学界仍在研究，但有两个直觉上站得住的解释互相叠加：其一，<b>训练数据的统计</b> —— 文章开头点题、结尾总结，对话里最新几句最相关，重要信息天然爱待在两头；其二，训练语料里超长文本本来就少，模型对“中段远处”的注意力分配<b>缺乏足够练习</b>。落到实战，三个习惯：</p>
        <div className="use-grid">
          <div className="card use-card"><div className="label">习惯一</div><div className="en">重要约束<b>放两头</b></div><div className="zh">prompt 开头定调、结尾重申 —— 第 16 课“重点放两头”的原则，机制就在这条 U 形曲线里。</div></div>
          <div className="card use-card"><div className="label">习惯二</div><div className="en">长材料<b>先瘦身</b></div><div className="zh">先摘出相关章节再提问，别把 200 页原文一股脑塞进去 —— 塞得进，不代表读得清。</div></div>
          <div className="card use-card"><div className="label">习惯三</div><div className="en">提问<b>点名引用</b></div><div className="zh">“根据第 3 节的退款条款……”比“根据上面的文档……”更能把注意力拽到正确的位置。</div></div>
        </div>
      </Lsec>

      <Lsec
        title="📈 军备竞赛与代价：从 4k 到 1M+"
        lead="既然窗这么关键，把窗做大自然成了各家的军备竞赛。几年间窗口尺寸涨了几个数量级 —— 但每一寸窗口，都明码标价。先看竞赛战况："
      >
        <div className="card">
          <table className="match">
            <thead><tr><th>窗口量级</th><th>大约能装下</th><th>时代</th></tr></thead>
            <tbody>
              <tr><td className="be">4k token</td><td className="ex">一篇几千字的长文</td><td className="ex">2020 年前后，第一代大模型的水平</td></tr>
              <tr><td className="be">128k token</td><td className="ex">一本中篇小说 / 一个项目的核心代码</td><td className="ex">2023 年起逐渐成为旗舰标配</td></tr>
              <tr><td className="be">1M+ token</td><td className="ex">几部长篇小说 / 一整个代码库</td><td className="ex">2024–2025 年头部模型（具体以各家官网为准）</td></tr>
            </tbody>
          </table>
        </div>
        <p className="lead mt14">代价在哪？第 9 课的“每个词看所有词”这时露出了獠牙。打个比方：10 个人开圆桌会，两两关系约 45 对；换成 100 人的大会，两两关系约 5000 对 —— <b>人数翻 10 倍，“互看”的次数翻了约 100 倍</b>。注意力一模一样：窗口长度翻 10 倍，计算量按平方涨到约 100 倍。于是三张账单一起来：</p>
        <div className="use-grid">
          <div className="card use-card"><div className="label">账单一 · 算力</div><div className="en">计算量<b>平方涨</b></div><div className="zh">长度 ×10，互看次数 ×100 —— 显存、电费、芯片照单全收。这就是长窗口模型贵的根本原因。</div></div>
          <div className="card use-card"><div className="label">账单二 · 钱包</div><div className="en">token <b>全额计费</b></div><div className="zh">把一本书塞进窗，之后<b>每问一个问题</b>都要为整本书的 token 再付一次钱（第 11 课）。缓存能打折，机制不变。</div></div>
          <div className="card use-card"><div className="label">账单三 · 时间</div><div className="en">首字<b>延迟</b>变长</div><div className="zh">贴完超长文档后 AI 半天不开口？它在从头读完整个窗口，才能开始接第一个字。</div></div>
        </div>
        <p className="lead mt14">又贵、又慢、中间还容易看丢 —— 所以工程师的共识不是“窗越大越好”，而是<b>让进窗的每个 token 都值回票价</b>。两条主流的省窗路线：</p>
        <div className="use-grid cols-2">
          <div className="card use-card"><div className="label">路线一 · 对话场景</div><div className="en"><b>滚动摘要</b></div><div className="zh">把久远的对话压缩成一小段摘要留在窗内，代替原文。长对话产品不“崩”多靠它 —— 代价是细节有损：你可能见过 AI 对很久之前的事“大致记得，但细节说不准”，那就是摘要在工作。</div></div>
          <div className="card use-card"><div className="label">路线二 · 资料场景</div><div className="en"><b>RAG 按需检索</b></div><div className="zh">资料放在外部知识库，每轮只检索<b>最相关的几段</b>塞进窗。这是“把信息存在窗外、用时塞回窗内”的工程化巅峰 —— 下一课整课讲它。</div></div>
        </div>
        <p className="lead mt14">一句话收束这一节，也是本课最值得带走的一句：<b>把对的信息放进窗，胜过把所有信息塞进窗。</b></p>
      </Lsec>

      <Lsec
        title="🎛️ 交互演示：亲手把“过敏史”挤出窗外"
        lead="下面这扇窗最多装 4 轮对话（外加一条钉死的系统提示）。连点「下一轮对话」，看一段日常对话如何一步步走进“失忆现场”—— 尤其留意第 6 轮发生了什么。"
      >
        <ContextWindowDemo />
      </Lsec>

      <Lsec title="⚠️ 常见误区">
        <div className="card alert-card row-list">
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">AI 记得我们上次的对话，聊得越多它越懂我</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">模型本身零记忆、零成长 —— 所有“记得”都是产品把信息存在窗外、再塞回窗内的小抄</span></div>
            </div>
            <p className="why"><b>病因：</b>产品界面太像“和一个人聊天”：会话列表一直在、记忆功能偶尔显灵，很容易让人脑补出一个“认识我的 AI”。拆穿它只需两步：关掉记忆功能开一个新会话 —— 它真的第一次见你；打开设置里的“记忆”列表 —— 那些小纸条就是它“懂你”的全部家当，删掉即忘。分清<b>模型能力</b>和<b>产品功能</b>，是这一阶段最重要的鉴别力。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">窗口越大越好，选模型就挑窗口最大的那个</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">大窗贵、慢、中间易看丢 —— 把对的信息放进窗，胜过把所有信息塞进窗</span></div>
            </div>
            <p className="why"><b>病因：</b>把“装得下”误当“读得好”。窗口翻 10 倍，计算量平方上涨、每轮按 token 全额计费、首字延迟变长，而 lost in the middle 告诉你：塞进去的内容越长，埋在中间的关键信息越容易被看丢。大窗口是宝贵的<b>能力上限</b>，不是默认用法 —— 日常更优解是瘦身材料、重点放两头，资料多了上 RAG（下一课）。</p>
          </div>
        </div>
      </Lsec>

      <Lsec title="✍️ 小练习">
        <div className="card quiz row-list">
          <QuizItem q="1. 朋友抱怨：“昨天那个会话里 ChatGPT 明明知道我项目的全部背景，今天新开一个会话它就全忘了，是不是 bug？”用本课的机制解释原因，并给两条实用对策。">
            <b>不是 bug，是机制。</b>窗是会话级的：新会话 = 一扇全新的空窗，旧会话的历史只存在产品数据库里，不会打包进新会话 —— 模型本来就没有跨会话记忆。<b>对策：</b>① 在旧会话里让 AI 把项目背景总结成一段要点，新会话开头贴上；② 用产品的“记忆 / 自定义指令 / 项目”功能把长期背景固定下来。两招的本质相同：<b>把要点重新放进窗内</b>。
          </QuizItem>
          <QuizItem q="2. 你把一份 200 页的合同全文塞进了大窗口模型，问“第 87 页那条违约金条款有什么坑”，它答得含糊甚至答错。窗口明明装得下，为什么？该怎么改进？">
            <b>装得下 ≠ 看得清。</b>关键条款埋在超长上下文的中部，正是 lost in the middle 最容易看丢的位置。<b>改进：</b>① 把违约金条款单独摘出来，放在提问的开头或结尾再问；② 提问时点名引用（“根据下面摘录的第 X 条……”）把注意力拽过去；③ 材料多、要反复问时，改用检索方案（RAG，下一课），每次只把相关段落放进窗。
          </QuizItem>
          <QuizItem q="3. 同一个问题，放在一段已经聊了 100 轮的长对话末尾问，和新开会话单独问，哪个更贵？哪个更可能答得好？为什么？">
            <b>长对话末尾问更贵</b> —— 每轮都重发全部历史，100 轮的 token 要再全额计费一次（第 11 课），生成也更慢。<b>且不一定答得更好：</b>如果相关信息早被挤出窗外，模型根本看不见；就算还在，也可能埋在中部被看丢。若问题不依赖前文，新开会话又便宜又干净。口诀：<b>别把会话当储物柜 —— 把对的信息放进窗，胜过把所有信息塞进窗。</b>
          </QuizItem>
        </div>
      </Lsec>
    </>
  )
}
