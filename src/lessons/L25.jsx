import { useState } from 'react'
import { Lsec, Pill, FlipCard, QuizItem } from '../components/ui.jsx'

// ============================================================
// ① 开放程度阶梯
// ============================================================
const ROWS = ['API / 产品入口', '权重文件（模型本体）', '训练代码与配方', '训练数据（语料）']
const MODES = {
  closed: { name: '闭源 API', period: '只租能力，不卖模型',
    desc: '你拿到的是服务，不是模型。模型住在厂商的服务器里，你通过 API 租用它的能力 —— 像点外卖：菜很好吃，但厨房不让进，菜也不让带走。', tags: ['GPT', 'Claude', 'Gemini'],
    states: [['yes', '提供 —— 按 token 计费'], ['no', '不提供'], ['no', '不提供'], ['no', '不提供']] },
  open: { name: '开放权重', period: '业内说的“开源模型”九成在这一档',
    desc: '你拿到模型文件本身，可以搬回自己机器上自由部署、微调 —— 像买到了做好的菜：能加热、能改刀，但菜谱不给，没法从头复现。', tags: ['Llama', 'Qwen', 'DeepSeek', 'Mistral'],
    states: [['yes', '官方或第三方托管均有'], ['yes', '可自由下载、本地部署'], ['half', '多数只给技术报告，细节留白'], ['no', '极少公开 —— 数据是底牌']] },
  full: { name: '全开源', period: '少数派，多由科研机构推动',
    desc: '权重、训练代码、训练数据全公开，理论上可以从零复现整个模型 —— 这才是软件意义上的“开源”。图的是可研究、可审计，目前以科研驱动为主。', tags: ['OLMo（Allen AI）'],
    states: [['yes', '提供'], ['yes', '公开'], ['yes', '全流程公开'], ['yes', '语料公开可查']] },
}
const GLYPH = { yes: '✓', half: '◐', no: '✕' }
const ICON = { yes: 'var(--sage)', half: 'var(--amber)', no: 'var(--fg-2)' }
const FILL = { yes: 'var(--sage-bg)', half: 'var(--amber-bg)', no: 'var(--bg-inset)' }
const EDGE = { yes: 'var(--sage)', half: 'var(--amber)', no: 'var(--hairline-strong)' }

function LadderDemo() {
  const [key, setKey] = useState('closed')
  const m = MODES[key]
  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · 一个模型能“开放”到什么程度</span>
        <span className="demo-hint">点击胶囊切换，看四层组件谁公开、谁上锁</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="ladder-svg" viewBox="0 0 440 312" width="420" aria-label="模型开放程度的四层阶梯">
            {ROWS.map((row, i) => {
              const [st, note] = m.states[i]
              const y = 8 + i * 76, cy = y + 32
              const fgMain = st === 'no' ? 'var(--fg-2)' : 'var(--fg-0)'
              return (
                <g key={i} className="lrow">
                  <rect x="14" y={y} width="412" height="64" rx="10" fill={FILL[st]} stroke={EDGE[st]} strokeWidth="1.2" />
                  <circle cx="44" cy={cy} r="13" fill="none" stroke={ICON[st]} strokeWidth="1.6" />
                  <text x="44" y={cy + 4.5} textAnchor="middle" fontSize="13" fontWeight="700" fill={ICON[st]}>{GLYPH[st]}</text>
                  <text x="70" y={cy - 5} fontSize="13.5" fontWeight="700" fill={fgMain}>{row}</text>
                  <text x="70" y={cy + 15} fontSize="11.5" fill="var(--fg-1)">{note}</text>
                </g>
              )
            })}
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            {[['closed', '闭源 API'], ['open', '开放权重'], ['full', '全开源']].map(([k, label]) => (
              <button key={k} className={`chip${k === key ? ' active' : ''}`} onClick={() => setKey(k)}>{label}</button>
            ))}
          </div>
          <h4>{m.name}</h4>
          <div className="period">{m.period}</div>
          <p>{m.desc}</p>
          <div className="tags">{m.tags.map((t) => <Pill key={t} type="ink">{t}</Pill>)}</div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ② 选型方向仪
// ============================================================
const QS = [
  { name: '① 数据', label: '① 数据能出网吗？', opts: [{ t: '能出网', side: 'closed' }, { t: '不能，太敏感', side: 'open', hard: true }] },
  { name: '② 预算', label: '② 预算偏好哪种？', opts: [{ t: '按量付费 OPEX', side: 'closed' }, { t: '一次性投入 CAPEX', side: 'open' }] },
  { name: '③ 定制', label: '③ 需要深度定制吗？', opts: [{ t: '提示词就够', side: 'closed' }, { t: '要微调魔改', side: 'open' }] },
  { name: '④ 运维', label: '④ 团队有运维能力吗？', opts: [{ t: '没人管 GPU', side: 'closed' }, { t: '有 GPU 团队', side: 'open' }] },
]

function GaugeDemo() {
  const [chosen, setChosen] = useState([0, 0, 0, 0])
  let open = 0, closed = 0, hard = false
  chosen.forEach((ci, i) => {
    const o = QS[i].opts[ci]
    if (o.side === 'open') open++; else closed++
    if (o.hard) hard = true
  })
  const cx = hard ? 392 : 220 + ((open - closed) / 4) * 170
  const markerFill = hard ? 'var(--terracotta)' : open > closed ? 'var(--sage)' : open < closed ? 'var(--sky)' : 'var(--amber)'

  let title, desc
  if (hard) { title = '建议：开放权重（本地 / 私有化部署）'; desc = '“数据不能出网”是硬约束，直接否决所有公网 API。其余三问只影响怎么落地：没有运维就买私有化一体机或外包部署，有运维就自建。' }
  else if (open > closed) { title = `建议：倾向开放权重（${open} : ${closed}）`; desc = '多数信号指向自己部署：投入是固定成本，量越大越划算。建议先用小尺寸模型试点，验证效果再加码硬件。' }
  else if (closed > open) { title = `建议：倾向闭源 API（${closed} : ${open}）`; desc = '按 token 付费、零运维、随开随用 —— 对当前条件是最省心的起点。等用量上来或需求变深，再回来重做一遍四问。' }
  else { title = '建议：五五开，先 API 起步'; desc = '信号打平时，工程界的常见做法是：先用闭源 API 最快跑通业务，少绑定厂商私有功能、留好切换余地，后续随用量与需求再迁移。' }

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">🎛️ 交互演示 · 开放权重还是闭源 API？</span>
        <span className="demo-hint">点右侧选项，方向仪实时摆动</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="gauge-svg" viewBox="0 0 440 330" width="420" aria-label="选型方向仪：四个问题的答案共同决定指针偏向闭源 API 还是开放权重">
            <text x="30" y="28" fontSize="13" fontWeight="700" fill="var(--sky)">闭源 API</text>
            <text x="410" y="28" textAnchor="end" fontSize="13" fontWeight="700" fill="var(--sage)">开放权重</text>
            <line x1="30" y1="58" x2="410" y2="58" stroke="var(--hairline-strong)" strokeWidth="6" strokeLinecap="round" />
            <line x1="220" y1="46" x2="220" y2="70" stroke="var(--fg-2)" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle id="gauge-marker" cx={cx} cy="58" r="12" fill={markerFill} stroke="var(--bg-0)" strokeWidth="2.5" />
            {QS.map((q, i) => {
              const o = q.opts[chosen[i]]
              const y = 102 + i * 56
              let pull, color
              if (o.hard) { pull = '一票否决 ▶ 必须可本地部署'; color = 'var(--terracotta)' }
              else if (o.side === 'open') { pull = '▶ 偏开放权重'; color = 'var(--sage)' }
              else { pull = '◀ 偏闭源 API'; color = 'var(--sky)' }
              return (
                <g key={i}>
                  <rect x="20" y={y} width="400" height="40" rx="8" fill="var(--bg-inset)" stroke="var(--hairline)" />
                  <text x="36" y={y + 25} fontSize="12.5" fontWeight="600" fill="var(--fg-0)">{q.name}：{o.t}</text>
                  <text x="404" y={y + 25} textAnchor="end" fontSize="12.5" fontWeight="700" fill={color}>{pull}</text>
                </g>
              )
            })}
          </svg>
        </div>
        <div className="demo-side">
          {QS.map((q, qi) => (
            <div key={qi} className="qrow">
              <div className="qlabel">{q.label}</div>
              <div className="chips">
                {q.opts.map((o, oi) => (
                  <button key={oi} className={`chip${chosen[qi] === oi ? ' active' : ''}`} onClick={() => setChosen((c) => c.map((v, j) => (j === qi ? oi : v)))}>{o.t}</button>
                ))}
              </div>
            </div>
          ))}
          <div className="verdict">
            <h4>{title}</h4>
            <p>{desc}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const FLIPS = [
  { q: '医院要做内部病历问答系统', pill: { type: 'sage', text: '开放权重' }, why: '病历是最敏感的数据，“不能出网”一票否决 —— 本地部署的开放权重（或厂商私有化方案）是唯一方向。' },
  { q: '给自己装一个个人写作助手', pill: { type: 'sky', text: '闭源 API' }, why: '没有隐私硬约束、用量小，按 token 付费几乎零门槛；为写作文自购 GPU，连电费都不划算。' },
  { q: '创业公司要在两周内做出 MVP', pill: { type: 'sky', text: '闭源 API' }, why: '第一要务是验证需求：OPEX 起步最快、零运维。等跑通了、用量大了，再回头评估迁移到开放权重省钱。' },
  { q: '科研团队要复现一个模型实验', pill: { type: 'sage', text: '开放权重（最好全开源）' }, why: '研究要检查、修改、复跑模型内部，闭源 API 是黑箱；若连训练过程都要复现，只有 OLMo 这类全开源才够。' },
  { q: '车间里的离线工业质检设备', pill: { type: 'sage', text: '开放权重' }, why: '产线常常物理断网，API 根本调不通 —— 只能把模型搬进本地设备，这正是开放权重的主场。' },
  { q: '电商公司想微调一个“懂自家话术”的客服模型', pill: { type: 'sage', text: '开放权重' }, why: '要把自家话术“焊进”模型，需要深度微调甚至改结构 —— 闭源只开放有限微调接口，自由度不够。' },
]

export default function L25() {
  return (
    <>
      <Lsec title="🎯 你将学会">
        <div className="card goals">
          <div className="goal-item"><span className="tick">✓</span>识破名字陷阱：业内说的“开源模型”九成其实是“开放权重”—— 给你做好的菜（模型文件），不给菜谱（数据与配方）；真·全开源如 OLMo 是少数派</div>
          <div className="goal-item"><span className="tick">✓</span>用五个维度对照两条路线：获取方式、数据隐私、能力上限、成本结构、可定制</div>
          <div className="goal-item"><span className="tick">✓</span>在 2025 年的版图上点名两大阵营：GPT / Claude / Gemini 与 Llama / Qwen / DeepSeek / Mistral 等，并知道 DeepSeek-R1 为什么是分水岭</div>
          <div className="goal-item"><span className="tick">✓</span>背下选型四问：数据出不出网？预算 OPEX 还是 CAPEX？要不要微调？有没有运维？—— 把问题从“哪个最强”换成“哪个最合适”</div>
        </div>
      </Lsec>

      <Lsec
        title="💡 核心概念：你听到的“开源模型”，多数是“开放权重”"
        lead="先正名。开源软件（Linux、Python）的“开源”指源代码全公开：拿到的是菜谱，每一行都能检查，理论上能从头复现。而新闻里的“开源大模型”，九成给你的只是权重文件 —— 那几十亿个“旋钮”（第 3 课的权重）训练完成后的最终读数。你能下载、能部署、能微调，但它是一盘做好的菜：训练数据（食材）、训练代码与配方（火候），统统不公开。准确的叫法是开放权重（open weights）。点下面的胶囊，看三档“开放程度”到底差在哪一层。"
      >
        <LadderDemo />
        <div className="example mt14">
          <div className="en">开放权重 = 给你<span className="hl">做好的菜</span>，不给菜谱</div>
          <div className="zh">能加热（部署）、能改刀（微调），但厨房不让进。为什么大家都藏菜谱？训练数据既是商业公司最贵的底牌，又埋着版权地雷 —— “开放权重”正是商业利益与开放精神之间的折中。本课从此统一用语：<b>开放权重 vs 闭源 API</b>。</div>
        </div>
      </Lsec>

      <Lsec
        title="📖 两条路线，五个维度"
        lead="闭源 API 像点外卖：随点随吃、按量付费，但厨房在别人家；开放权重像自己开伙：菜（模型）免费拿，但锅碗瓢盆（GPU）、水电（运维）全得自己置办。五个维度一张表："
      >
        <div className="card">
          <table className="match">
            <thead><tr><th>维度</th><th>闭源 API</th><th>开放权重</th></tr></thead>
            <tbody>
              <tr><td className="be">获取方式</td><td>注册账号、照文档发请求，几分钟跑通（第 26 课动手）</td><td className="ex">下载权重文件，部署到自己的 GPU / 服务器（第 27 课动手）</td></tr>
              <tr><td className="be">数据隐私</td><td>数据必须发送到厂商服务器 ——“出网”</td><td className="ex">可完全本地运行，数据一步不出门</td></tr>
              <tr><td className="be">能力上限</td><td>前沿能力通常率先出现在闭源旗舰</td><td className="ex">紧追，且差距在快速缩小（见下文 R1 时刻）</td></tr>
              <tr><td className="be">成本结构</td><td>按 token 计费，用多少付多少（OPEX，价格以官网为准）</td><td className="ex">权重免费，但 GPU、电费、运维人力是真金白银（CAPEX）</td></tr>
              <tr><td className="be">可定制</td><td>受限：提示词 + 厂商开放的有限微调接口</td><td className="ex">自由：可微调、可裁剪、可“魔改”到任何形状</td></tr>
            </tbody>
          </table>
        </div>
      </Lsec>

      <Lsec
        title="🗺️ 版图速览：谁在哪条线上（截至 2025）"
        lead="下面是截至 2025 年的格局快照 —— 这个领域更新极快，名单与排位请以各家最新发布为准。一句话记定位，不背跑分。先看闭源三巨头：模型不出门，能力当服务卖。"
      >
        <div className="use-grid">
          <div className="card use-card"><div className="label">闭源 API · 美国</div><div className="en">OpenAI <b>GPT</b></div><div className="zh">ChatGPT 的缔造者，把大模型带进大众视野；对话、多模态、推理产品线最全，至今是行业风向标。</div></div>
          <div className="card use-card"><div className="label">闭源 API · 美国</div><div className="en">Anthropic <b>Claude</b></div><div className="zh">以 AI 安全研究立身，长文本、代码与 Agent 能力是口碑招牌，在工程师群体中粘性极高。</div></div>
          <div className="card use-card"><div className="label">闭源 API · 美国</div><div className="en">Google <b>Gemini</b></div><div className="zh">原生多模态路线，背靠搜索、安卓与办公全家桶 —— 论分发渠道无人能敌。</div></div>
        </div>
        <p className="lead mt14">再看开放权重阵营：模型文件给你，部署随你 —— 中国力量在这一边格外密集。</p>
        <div className="use-grid">
          <div className="card use-card"><div className="label">开放权重 · 美国</div><div className="en">Meta <b>Llama</b></div><div className="zh">把“开放权重”变成行业惯例的带头人，衍生模型与工具生态最庞大；注意其许可证带商用条款，并非传统开源协议。</div></div>
          <div className="card use-card"><div className="label">开放权重 · 中国</div><div className="en">阿里 <b>Qwen</b></div><div className="zh">通义千问家族：尺寸谱系最全、迭代最勤的开放权重系列之一，在全球开发者社区的采用量名列前茅。</div></div>
          <div className="card use-card"><div className="label">开放权重 · 中国</div><div className="en">DeepSeek <b>深度求索</b></div><div className="zh">以极致工程效率著称的“性价比之王”，R1 一夜改写了“开放权重永远慢半拍”的叙事（见下一节）。</div></div>
          <div className="card use-card"><div className="label">开放权重 · 欧洲</div><div className="en">Mistral <b>米斯特拉尔</b></div><div className="zh">欧洲的独苗级代表，以“小而高效”起家（MoE 路线的早期推手），开放权重与商业 API 两条腿走路。</div></div>
          <div className="card use-card"><div className="label">开放权重 · 中国</div><div className="en">月之暗面 <b>Kimi</b></div><div className="zh">以超长上下文出圈的明星创业公司，2025 年携 K2 系列加入开放权重阵营。</div></div>
          <div className="card use-card"><div className="label">开放权重 · 中国</div><div className="en">智谱 <b>GLM</b></div><div className="zh">清华系出身，国内最早一批做中英双语大模型的团队，GLM 系列持续开放迭代。</div></div>
        </div>
        <div className="example mt14">
          <div className="en">阵营的边界正在<span className="hl">变模糊</span></div>
          <div className="zh">闭源三家也各有开放权重支线：Google 有 Gemma，OpenAI 也在 2025 年放出了 gpt-oss。两条路线是一道光谱而非两座阵地 —— 同一家公司常常两头下注。</div>
        </div>
      </Lsec>

      <Lsec
        title="⚡ DeepSeek-R1 时刻：差距可以被急剧压缩"
        lead="第 23 课讲过推理模型：让模型先“打草稿”再回答，用测试时算力换智力。2025 年 1 月，这条故事线在开放权重阵营炸响 —— DeepSeek-R1 以开放权重 + 宽松许可发布，推理能力直逼当时最强的闭源推理模型，而训练投入远低于外界对“前沿模型”的想象（具体数字有争议，“便宜得多”是共识）。一周之内它冲上多国应用商店榜首，甚至引发美股科技股震荡。震动的原因不是它“最强”，而是它证明了：闭源领先的护城河，可能比所有人以为的浅得多。"
      >
        <div className="contrast">
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-ink">R1 之前的默认假设</span></div>
            <div className="big">开放权重永远落后闭源<span className="gap">一到两年</span></div>
            <p className="note">前沿能力先出现在闭源旗舰，开放阵营追着复刻。于是选型逻辑很粗暴：要最强，就得交钱、交数据。</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">R1 之后的新共识</span></div>
            <div className="big">差距可以被<span className="hl">急剧压缩</span></div>
            <p className="note">两条路线的距离不再是“代差”，而是会被随时拉近的“身位”。选型问题从“哪个最强”，变成“哪个最合适”—— 下一节给你四问。</p>
          </div>
        </div>
      </Lsec>

      <Lsec
        title="🎛️ 选型四问：拨一拨方向仪"
        lead="真实项目里不需要背榜单，只需要回答四个问题。点右侧选项，看方向仪往哪边摆 —— 注意第一问是一票否决项：数据不能出网时，其余三问只决定“怎么落地”，不再决定“选哪边”。"
      >
        <GaugeDemo />
      </Lsec>

      <Lsec
        title="🎛️ 场景练手：六个项目分一分"
        lead="用刚才的四问给下面 6 个真实场景做判断：更适合开放权重还是闭源 API？先自己过一遍四问，再点卡片对答案。"
      >
        <div className="flip-grid">
          {FLIPS.map((f, i) => <FlipCard key={i} q={f.q} pill={f.pill} why={f.why} />)}
        </div>
      </Lsec>

      <Lsec title="⚠️ 常见误区">
        <div className="card alert-card row-list">
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">开源（开放权重）= 免费</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">权重不要钱，但跑模型的 GPU、电费、运维人力都是钱 —— 用量大才划算</span></div>
            </div>
            <p className="why"><b>病因：</b>把“下载免费”当成“使用免费”，这是手机 App 时代的思维惯性。大模型是吞电的重资产：小用量时，按 token 付费的闭源 API 往往反而更便宜；开放权重省下的是按量付费，换来的是固定投入 —— 翻盘点在“量”。</p>
          </div>
          <div className="alert-item">
            <div className="wrong-right">
              <div className="wr-line bad"><span className="wr-mark">✗</span><span className="wr-text">闭源一定更强，开放权重是“将就用”</span></div>
              <div className="wr-line good"><span className="wr-mark">✓</span><span className="wr-text">分场景：前沿推理常由闭源旗舰领跑，但大量日常任务开放权重早已绰绰有余</span></div>
            </div>
            <p className="why"><b>病因：</b>只盯着排行榜头部。翻译、摘要、客服、内部问答这类任务根本用不到“最强”，够用、合规、便宜才是赢家 —— R1 时刻更证明头部差距随时可能被压缩。选型看的是“任务够不够用 + 约束满不满足”，不是榜单第一名。</p>
          </div>
        </div>
      </Lsec>

      <Lsec title="✍️ 小练习">
        <div className="card quiz row-list">
          <QuizItem q="1. 同事说：“DeepSeek 权重能免费下载，所以换成它就一分钱不用花了。”这句话哪里对、哪里错？">
            <b>“免费下载”对，“一分钱不花”错。</b>自己跑模型要 GPU（买或租）、电费、运维人力；用量小的时候，按 token 付费的 API 往往更省。另一条路是用第三方平台托管的 DeepSeek API —— 那又回到了按量付费，只是单价可能更低。
          </QuizItem>
          <QuizItem q="2. 一家律所想做内部合同问答工具：材料高度敏感，团队没有任何 GPU 运维经验。用四问走一遍，给出方向。">
            第一问就触发<b>一票否决</b>：合同不能出网 → 方向锁定可本地 / 私有化部署的开放权重。“没有运维”不改变方向，只改变落地方式：买厂商的私有化一体机、托管私有云，或外包部署 —— 先用小尺寸模型试点，验证效果再加码。
          </QuizItem>
          <QuizItem q="3. 填空：前沿能力通常在 ____ 率先出现；但大量日常任务，____ 已经绰绰有余。所以选型问题从“哪个最强”变成了 ____。">
            <b>闭源旗舰 / 开放权重 / “哪个最合适”。</b>这也是 DeepSeek-R1 时刻的最大遗产：差距能被急剧压缩，盲目追“最强”不如老老实实回答四问。
          </QuizItem>
        </div>
      </Lsec>
    </>
  )
}
