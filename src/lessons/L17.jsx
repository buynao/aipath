import { useState } from 'react'
import { Lsec, QuizItem } from '../components/ui.jsx'
import { useLang } from '../i18n/LangContext.jsx'

// ============================================================
// 上下文窗口"挤出"演示
// ============================================================
const CAP = 4
const SLOT_X = [82, 200, 318, 436]
const BASE_Y = 56
// 演示数据：对话气泡按固定宽度（100px）逐行排版，每行字数与 SVG 几何一一对应；
// 翻译会破坏气泡内换行布局，故保留原文（仅作演示用，讲解性文本走双语 C）。
const ROUNDS = [
  { u: ['你：我叫小芸，', '花生过敏，帮我', '规划三天早餐'], a: ['AI：记住了！', '第一天：燕麦粥', '＋水煮蛋'] },
  { u: ['你：第二天想', '吃中式的'], a: ['AI：小米粥＋', '素包子，已避', '开花生 ✓'] },
  { u: ['你：第三天来', '点西式的'], a: ['AI：第三天：', '全麦吐司＋牛', '油果＋酸奶'] },
  { u: ['你：周末想加', '一顿下午茶'], a: ['AI：司康饼配', '果酱，茶选', '乌龙茶'] },
  { u: ['你：再推荐个', '解馋小零食'], a: ['AI：海苔脆片', '或酸奶杯，少', '糖更健康'] },
  { u: ['你：我能吃花', '生酱吐司吗？'], a: ['AI：当然可以！', '花生酱营养丰', '富，很推荐 ⚠'], wrong: true },
  { u: ['你：？！你忘了', '我花生过敏？'], a: ['AI：抱歉……', '窗内已没有', '这条信息了'] },
]
const WARN_STEPS = { 5: true, 6: true }

// 双语内容层：结构 / class / id / SVG 几何 / 数值 / state 逻辑均不变，仅可见讲解文本按语言取用。
const C = {
  zh: {
    CAPS: [
      '窗口还是空的（真实窗口按 token 计，这里简化成“轮”）', '第 1 轮入窗 —— 关键信息「花生过敏」就在窗内',
      '第 2 轮入窗，还有 2 个空位', '第 3 轮入窗，还有 1 个空位', '窗满了 —— 下一轮进来，最早的就会被挤出去',
      '第 1 轮被挤出窗外 —— 模型已经看不见它了', '⚠ 窗内已没有过敏史：模型自信地答错了', '这不是模型变笨 —— 是关键信息出窗了',
    ],
    INFO: [
      { t: '窗还是空的', d: '点「下一轮对话」，客户端会把新一轮问答装进窗口。留意第 1 轮的关键信息：小芸对花生过敏。' },
      { t: '关键信息入窗', d: '「花生过敏」现在在窗内。只要它还在窗里，模型每次接龙都看得见它，回答就会自动绕开花生。' },
      { t: '模型答得很稳', d: 'AI 主动避开了花生 —— 不是它“记得”，是这一轮打包发出时，第 1 轮还在包裹里，它重新读到了。' },
      { t: '继续装', d: '照旧。别忘了：每发一轮，客户端都把窗内全部内容重发一遍，模型从头读起 —— 这也是越聊越贵的原因。' },
      { t: '窗满了', d: '4 个位置全部占用。真实产品里这一刻通常悄无声息 —— 没有任何“即将失忆”的提醒。' },
      { t: '第 1 轮被挤出', d: '新对话进来，最早的一轮被挤出窗外、变灰飘走。聊天记录里它还在（你翻得到），但发给模型的包裹里已经没有它 —— 模型看不见了。' },
      { t: '失忆现场 ⚠', d: '你问“能吃花生酱吗”，窗内已没有过敏史。模型不是撒谎也不是变笨 —— 它是真的看不见，于是按常识热情推荐。这就是长对话翻车的标准剧本。' },
      { t: '复盘', d: '对策三条：① 关键信息时不时重申一遍，把它放回窗的最新位置；② 长对话定期让 AI 总结要点，用摘要开新会话；③ 重要约束别指望它“记得”，每次都带上。点「重新开始」可再看一遍。' },
    ],
    demoTitle: '🎛️ 交互演示 · 上下文窗口的“挤出”机制',
    demoHint: '蓝 = 你说的 · 绿 = AI 答的 · 黄 = 系统提示',
    svgAria: '上下文窗口演示：对话气泡从右侧进入窗口，装满后最早的气泡被挤出左侧',
    ctxTitle: '上下文窗口',
    ctxCap: '容量：4 轮对话',
    ctxPush: '新对话从右侧推入 →',
    sysPrompt: ['系', '统', '提', '示'],
    roundLabel: (n) => `第 ${n} 轮`,
    nextBtn: '下一轮对话 ▸',
    restartBtn: '↺ 重新开始',
    progress: (s, total) => `第 ${s} / ${total} 轮`,

    goalsTitle: '🎯 你将学会',
    goals: [
      <>一句话说清大模型的“记忆”真相：没有记忆体，只有一扇窗 —— 每轮回答，它只看得见窗内的 token</>,
      <>用同一把钥匙解开三个日常谜团：聊久了忘开头、新开会话全忘、长文档塞不进</>,
      <>知道“窗口大 ≠ 看得清”：关键信息放在长上下文的中间最容易被看丢，重要内容要放两头</>,
      <>看懂窗口军备竞赛的账本：窗口翻 10 倍、计算量翻约 100 倍，以及滚动摘要与 RAG 两条破局路</>,
    ],

    conceptTitle: '💡 核心概念：大模型没有记忆体，只有一扇“窗”',
    conceptLead: '上一课结尾埋了个伏笔：prompt 不只是你刚打的那行字，整个对话历史都是续写条件。这一课把这件事算总账。先抛一个反直觉的事实：大模型没有任何“记忆体”。它不会把你说过的话“记在脑子里”；严格地说，它连“上一轮”这个概念都没有 —— 每次回答，对它而言都是第一次读到这场对话。',
    intuitTag: '直觉印象',
    intuitBig: <>AI 在和我连续聊天 <span className="gap">→</span> 它一直“在线”，记着我们聊过的一切</>,
    intuitNote: '按这个理解，它应该越聊越懂你、换个会话也认识你 —— 而这两件事恰恰都不成立。',
    realTag: '真实机制',
    realBig: <>模型只有一扇“窗” <span className="gap">→</span> 每轮回答，它能看见的<span className="hl">只有窗内的 token</span></>,
    realNote: '窗内 = 系统提示 + 对话历史 + 你刚打的话。窗外的一切 —— 包括你们“聊过”的内容 —— 等于不存在。',
    deskLead: <>这扇窗就是<b>上下文窗口（context window）</b>：模型一次能“看见”的 token 数上限。最贴切的比喻是一张<b>大小固定的书桌</b>：所有要参考的资料必须摊在桌面上，模型才看得见；桌面之外没有抽屉、没有书架 —— 放不下的纸，等于不存在。为什么非这样设计不可？两个根源你都学过：</>,
    roots: [
      { label: '根源一 · 第 12 课', en: <>知识<b>冻结</b>在参数里</>, zh: <>预训练结束后，模型的千亿级参数就封板了。你和它聊天<b>不会改动任何一个参数</b> —— 对话内容在模型内部根本没有地方可“存”。能存的只有窗。</> },
      { label: '根源二 · 第 9 课', en: <>注意力需要<b>边界</b></>, zh: <>注意力机制是“每个词看所有词”。“所有词”必须有个上限，否则算力和显存撑不住 —— 这个硬上限，就是窗口的尺寸。</> },
    ],
    flowLead: '那“连续聊天”是怎么做到的？答案会刷新你对每一次发送的理解 —— 跟着一条消息走完全程：',
    flowSteps: [
      <><b>你按下发送。</b>屏幕上看起来，你只发出了一行字。</>,
      <><b>客户端打包。</b>ChatGPT / Claude 的网页或 APP 把【系统提示 + 之前的全部问答 + 你的新消息】拼成一个长文本。</>,
      <><b>整包发给模型。</b>模型从第一个 token 读到最后一个 —— 就像第一次读到这场对话。</>,
      <><b>接龙生成回答。</b>逐 token 输出，老朋友了（第 12、14 课）。</>,
      <><b>读完即忘。</b>回答被客户端存进聊天记录，模型立刻回到“白纸”状态。下一轮？从第 1 步重来 —— 只是包裹又长了一截。<span className="footnote">所谓“聊天”，是客户端每轮替你把全部历史重发一遍而维持的幻觉。</span></>,
    ],
    billLead: <>第 11 课的伏笔现在也能收了：API 按 token 计费，而每一轮都要重发全部历史 —— <b>第 50 轮的提问，要为前 49 轮的所有 token 再付一次钱</b>。“越聊越贵”不是定价套路，是机制使然。把你在产品里见过的现象和这条机制连上线：</>,
    matchHead1: '你在 ChatGPT / Claude 里看到的现象',
    matchHead2: '背后的机制',
    matchRows: [
      { p: <b>昨天的会话今天点开还能接着聊</b>, m: '不是模型记得你 —— 历史存在产品的数据库里，你一开口，客户端把它整包重发' },
      { p: <b>对话越长，回答越慢</b>, m: '窗内 token 越多，每生成一个新词都要“看”更多旧词（第 9 课）' },
      { p: <b>API 账单越聊越贵</b>, m: '每轮重发全部历史，按 token 全额计费（第 11 课）' },
      { p: <b>让它“忘掉刚才那句”，它怎么也忘不掉</b>, m: '只要那句话还在窗内，模型就看得见 —— 想真忘，只能从历史里删掉或开新会话' },
    ],
    limitLead: <>窗的本领讲完了，该讲窗的局限：它是<b>有限的</b>，而且是<b>会话级的</b>。这两条局限，恰好对应你日常被坑得最多的三个谜团 —— 下一节一把钥匙全开。</>,

    riddlesTitle: '📖 三个日常谜团，一把钥匙全开',
    riddlesLead: '这三件事你大概率都遇到过，而且多半以为是“AI 抽风”。现在用“窗”重新看一遍 —— 全是同一个机制的三张面孔。',
    riddles: [
      { label: '谜团一 · 窗满了', en: <>聊久了<b>忘记开头</b></>, zh: <>窗装满后，再来新对话，最早的内容就被<b>挤出窗外</b>（不同产品的处理不同：直接截断、滚动丢弃或偷偷压缩）。模型不是“忘了”开头 —— 是发给它的包裹里已经没有开头了。</> },
      { label: '谜团二 · 窗是会话级的', en: <>新开会话<b>全忘了</b></>, zh: <>新会话 = 一扇全新的空窗。旧会话的历史不会被打包进来，模型也没有任何跨会话的存储 —— 它不是装失忆，它是<b>真的第一次见你</b>。</> },
      { label: '谜团三 · 窗有上限', en: <>长文档<b>塞不进</b></>, zh: <>文档的 token 数超过窗口尺寸，模型物理上读不到 —— 于是你看到“文件过长”的报错，或者更隐蔽的：被<b>悄悄截断</b>，后半本书它压根没读过，却照样自信作答。</> },
    ],
    memLead: '这时一定有人举手：“不对啊，ChatGPT 明明记得我是程序员，新会话也记得！”好问题 —— 看一个真实风格的场景：',
    memEn: <>新会话第一句你只说了“推荐几本书”，它却回答「作为一名<span className="hl">程序员</span>，你可能会喜欢……」—— 它怎么知道的？</>,
    memZh: <>这是产品层的<b>“记忆功能”</b>（ChatGPT 的 Memory、各家的“自定义指令 / 项目设定”）：产品把你以往对话里的要点提炼成小纸条存进<b>自己的数据库</b>，开新会话时再悄悄把纸条<b>塞回窗内</b>。模型本身依然零记忆 —— 是产品在替它递小抄。你可以亲自验证：去设置里找“记忆”，能看到一条条提炼好的纸条，删掉一条，它就真忘了。</>,
    memTail: <>注意这个分层：<b>“记忆”是产品功能，不是模型能力。</b>所有看起来像“记住了”的体验 —— 会话列表、记忆功能、项目知识库 —— 本质都是同一招：<b>把信息存在窗外，用的时候塞回窗内</b>。记住这一招，下一课的 RAG 你会觉得似曾相识。</>,

    lostTitle: '📖 lost in the middle：窗口大，不等于看得清',
    lostLead: '按前面的逻辑，窗口够大似乎就万事大吉 —— 把整本手册塞进去，想问哪页问哪页。但 2023 年斯坦福等机构的研究者做了个实验，结果给所有人泼了盆冷水。实验本身很朴素：',
    lostEn: <>给模型几十份文档，其中<span className="hl">只有一份</span>藏着答案，然后把这份关键文档放在上下文的不同位置 —— 开头、中间、结尾 —— 问同一个问题。</>,
    lostZh: <>结果：放<b>开头</b>或<b>结尾</b>时，模型大概率答对；放<b>中间</b>时，正确率明显下滑 —— 最差的情况甚至不如不给文档、让模型闭卷瞎答。准确率画出来是一条 U 形曲线，论文标题就叫 <b>Lost in the Middle</b>（迷失在中间）。</>,
    lostSvgAria: 'U 形曲线：关键信息放在开头和结尾时成功率高，放在中间时明显下滑',
    lostYAxis: '找到关键信息的成功率 ↑',
    lostStart: '放开头 · 找得到',
    lostMid: '放中间 · 最容易被看丢',
    lostEnd: '放结尾 · 找得到',
    lostStartLbl: '开头',
    lostXAxis: '← 关键信息在上下文中的位置 →',
    lostEndLbl: '结尾',
    lostWhy: <>为什么会这样？确切机制学界仍在研究，但有两个直觉上站得住的解释互相叠加：其一，<b>训练数据的统计</b> —— 文章开头点题、结尾总结，对话里最新几句最相关，重要信息天然爱待在两头；其二，训练语料里超长文本本来就少，模型对“中段远处”的注意力分配<b>缺乏足够练习</b>。落到实战，三个习惯：</>,
    habits: [
      { label: '习惯一', en: <>重要约束<b>放两头</b></>, zh: <>prompt 开头定调、结尾重申 —— 第 16 课“重点放两头”的原则，机制就在这条 U 形曲线里。</> },
      { label: '习惯二', en: <>长材料<b>先瘦身</b></>, zh: <>先摘出相关章节再提问，别把 200 页原文一股脑塞进去 —— 塞得进，不代表读得清。</> },
      { label: '习惯三', en: <>提问<b>点名引用</b></>, zh: <>“根据第 3 节的退款条款……”比“根据上面的文档……”更能把注意力拽到正确的位置。</> },
    ],

    lostSourceNote: (
      <>
        “迷失在中间”的实验出自 Liu 等 2023{' '}
        <a href="https://arxiv.org/abs/2307.03172" target="_blank" rel="noreferrer">
          Lost in the Middle: How Language Models Use Long Contexts
        </a>
        。
      </>
    ),
    raceTitle: '📈 军备竞赛与代价：从 4k 到 1M+',
    raceLead: '既然窗这么关键，把窗做大自然成了各家的军备竞赛。几年间窗口尺寸涨了几个数量级 —— 但每一寸窗口，都明码标价。先看竞赛战况：',
    raceHead: ['窗口量级', '大约能装下', '时代'],
    raceRows: [
      { be: '4k token', f: '一篇几千字的长文', e: '2020 年前后，第一代大模型的水平' },
      { be: '128k token', f: '一本中篇小说 / 一个项目的核心代码', e: '2023 年起逐渐成为旗舰标配' },
      { be: '1M+ token', f: '几部长篇小说 / 一整个代码库', e: '2024–2025 年头部模型（具体以各家官网为准）' },
    ],
    costLead: <>代价在哪？第 9 课的“每个词看所有词”这时露出了獠牙。打个比方：10 个人开圆桌会，两两关系约 45 对；换成 100 人的大会，两两关系约 5000 对 —— <b>人数翻 10 倍，“互看”的次数翻了约 100 倍</b>。注意力一模一样：窗口长度翻 10 倍，计算量按平方涨到约 100 倍。于是三张账单一起来：</>,
    bills: [
      { label: '账单一 · 算力', en: <>计算量<b>平方涨</b></>, zh: <>长度 ×10，互看次数 ×100 —— 显存、电费、芯片照单全收。这就是长窗口模型贵的根本原因。</> },
      { label: '账单二 · 钱包', en: <>token <b>全额计费</b></>, zh: <>把一本书塞进窗，之后<b>每问一个问题</b>都要为整本书的 token 再付一次钱（第 11 课）。缓存能打折，机制不变。</> },
      { label: '账单三 · 时间', en: <>首字<b>延迟</b>变长</>, zh: <>贴完超长文档后 AI 半天不开口？它在从头读完整个窗口，才能开始接第一个字。</> },
    ],
    routesLead: <>又贵、又慢、中间还容易看丢 —— 所以工程师的共识不是“窗越大越好”，而是<b>让进窗的每个 token 都值回票价</b>。两条主流的省窗路线：</>,
    routes: [
      { label: '路线一 · 对话场景', en: <><b>滚动摘要</b></>, zh: <>把久远的对话压缩成一小段摘要留在窗内，代替原文。长对话产品不“崩”多靠它 —— 代价是细节有损：你可能见过 AI 对很久之前的事“大致记得，但细节说不准”，那就是摘要在工作。</> },
      { label: '路线二 · 资料场景', en: <><b>RAG 按需检索</b></>, zh: <>资料放在外部知识库，每轮只检索<b>最相关的几段</b>塞进窗。这是“把信息存在窗外、用时塞回窗内”的工程化巅峰 —— 下一课整课讲它。</> },
    ],
    raceTail: <>一句话收束这一节，也是本课最值得带走的一句：<b>把对的信息放进窗，胜过把所有信息塞进窗。</b></>,

    demoSecTitle: '🎛️ 交互演示：亲手把“过敏史”挤出窗外',
    demoSecLead: '下面这扇窗最多装 4 轮对话（外加一条钉死的系统提示）。连点「下一轮对话」，看一段日常对话如何一步步走进“失忆现场”—— 尤其留意第 6 轮发生了什么。',

    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      {
        bad: 'AI 记得我们上次的对话，聊得越多它越懂我',
        good: '模型本身零记忆、零成长 —— 所有“记得”都是产品把信息存在窗外、再塞回窗内的小抄',
        why: <><b>病因：</b>产品界面太像“和一个人聊天”：会话列表一直在、记忆功能偶尔显灵，很容易让人脑补出一个“认识我的 AI”。拆穿它只需两步：关掉记忆功能开一个新会话 —— 它真的第一次见你；打开设置里的“记忆”列表 —— 那些小纸条就是它“懂你”的全部家当，删掉即忘。分清<b>模型能力</b>和<b>产品功能</b>，是这一阶段最重要的鉴别力。</>,
      },
      {
        bad: '窗口越大越好，选模型就挑窗口最大的那个',
        good: '大窗贵、慢、中间易看丢 —— 把对的信息放进窗，胜过把所有信息塞进窗',
        why: <><b>病因：</b>把“装得下”误当“读得好”。窗口翻 10 倍，计算量平方上涨、每轮按 token 全额计费、首字延迟变长，而 lost in the middle 告诉你：塞进去的内容越长，埋在中间的关键信息越容易被看丢。大窗口是宝贵的<b>能力上限</b>，不是默认用法 —— 日常更优解是瘦身材料、重点放两头，资料多了上 RAG（下一课）。</>,
      },
    ],

    bridgeTitle: '➡️ 下一课怎么接上',
    bridgeLead: '这一课反复出现一招：把信息存在窗外，用的时候再塞回窗内。本课的两条破局路线之一——RAG 按需检索——正是把这招做到工程化的极致：与其把整个知识库硬塞进有限的窗，不如建一个外部资料库，每次只检索最相关的几段放进窗。下一课就整课拆解 RAG：切块、向量化、检索、注入，看它如何给大模型“外挂”一个用不完的知识库。',
    bridgeSteps: ['窗有限、会话级', '诀窍：信息存窗外、用时塞回', '资料场景的工程化解法', '下一课：RAG'],
    quizTitle: '✍️ 小练习',
    quiz: [
      {
        q: '1. 朋友抱怨：“昨天那个会话里 ChatGPT 明明知道我项目的全部背景，今天新开一个会话它就全忘了，是不是 bug？”用本课的机制解释原因，并给两条实用对策。',
        a: <><b>不是 bug，是机制。</b>窗是会话级的：新会话 = 一扇全新的空窗，旧会话的历史只存在产品数据库里，不会打包进新会话 —— 模型本来就没有跨会话记忆。<b>对策：</b>① 在旧会话里让 AI 把项目背景总结成一段要点，新会话开头贴上；② 用产品的“记忆 / 自定义指令 / 项目”功能把长期背景固定下来。两招的本质相同：<b>把要点重新放进窗内</b>。</>,
      },
      {
        q: '2. 你把一份 200 页的合同全文塞进了大窗口模型，问“第 87 页那条违约金条款有什么坑”，它答得含糊甚至答错。窗口明明装得下，为什么？该怎么改进？',
        a: <><b>装得下 ≠ 看得清。</b>关键条款埋在超长上下文的中部，正是 lost in the middle 最容易看丢的位置。<b>改进：</b>① 把违约金条款单独摘出来，放在提问的开头或结尾再问；② 提问时点名引用（“根据下面摘录的第 X 条……”）把注意力拽过去；③ 材料多、要反复问时，改用检索方案（RAG，下一课），每次只把相关段落放进窗。</>,
      },
      {
        q: '3. 同一个问题，放在一段已经聊了 100 轮的长对话末尾问，和新开会话单独问，哪个更贵？哪个更可能答得好？为什么？',
        a: <><b>长对话末尾问更贵</b> —— 每轮都重发全部历史，100 轮的 token 要再全额计费一次（第 11 课），生成也更慢。<b>且不一定答得更好：</b>如果相关信息早被挤出窗外，模型根本看不见；就算还在，也可能埋在中部被看丢。若问题不依赖前文，新开会话又便宜又干净。口诀：<b>别把会话当储物柜 —— 把对的信息放进窗，胜过把所有信息塞进窗。</b></>,
      },
    ],
  },

  en: {
    CAPS: [
      'The window is still empty (a real window is counted in tokens; here we simplify to “turns”)', 'Turn 1 enters the window — the key fact “peanut allergy” is now inside',
      'Turn 2 enters; 2 slots left', 'Turn 3 enters; 1 slot left', 'The window is full — when the next turn arrives, the earliest one gets pushed out',
      'Turn 1 is pushed out — the model can no longer see it', '⚠ The allergy history is gone from the window: the model confidently gets it wrong', 'This isn’t the model getting dumber — the key fact left the window',
    ],
    INFO: [
      { t: 'The window is still empty', d: 'Click “Next turn,” and the client packs a new round of Q&A into the window. Watch the key fact in turn 1: Xiaoyun is allergic to peanuts.' },
      { t: 'The key fact enters the window', d: '“Peanut allergy” is now inside the window. As long as it stays in, the model sees it on every continuation, and its answers automatically steer clear of peanuts.' },
      { t: 'The model answers reliably', d: 'The AI avoided peanuts on its own — not because it “remembers,” but because when this turn was packed and sent, turn 1 was still in the bundle, so it read it again.' },
      { t: 'Keep packing', d: 'Same as before. Don’t forget: every turn, the client resends the entire window content, and the model reads from scratch — that’s also why longer chats cost more.' },
      { t: 'The window is full', d: 'All 4 slots are occupied. In real products this moment is usually silent — no “about to lose memory” warning at all.' },
      { t: 'Turn 1 is pushed out', d: 'A new turn arrives, the earliest one is pushed out of the window, grays out, and drifts away. It’s still in the chat log (you can scroll back to it), but it’s no longer in the bundle sent to the model — the model can’t see it.' },
      { t: 'Amnesia in action ⚠', d: 'You ask “can I eat peanut butter,” but the allergy history is gone from the window. The model isn’t lying or getting dumber — it genuinely can’t see it, so it enthusiastically recommends based on common sense. This is the standard script for long chats going off the rails.' },
      { t: 'Debrief', d: 'Three countermeasures: ① restate key facts now and then to put them back in the newest position of the window; ② in long chats periodically have the AI summarize the key points and start a fresh session with that summary; ③ for important constraints, don’t count on it to “remember” — bring them along every time. Click “Restart” to watch again.' },
    ],
    demoTitle: '🎛️ Interactive · How the Context Window “Pushes Things Out”',
    demoHint: 'Blue = you · Green = AI · Yellow = system prompt',
    svgAria: 'Context window demo: chat bubbles enter the window from the right; once it’s full, the earliest bubble is pushed out the left',
    ctxTitle: 'Context window',
    ctxCap: 'Capacity: 4 turns of dialogue',
    ctxPush: 'New turns push in from the right →',
    sysPrompt: ['S', 'Y', 'S', '·'],
    roundLabel: (n) => `Turn ${n}`,
    nextBtn: 'Next turn ▸',
    restartBtn: '↺ Restart',
    progress: (s, total) => `Turn ${s} / ${total}`,

    goalsTitle: '🎯 What You’ll Learn',
    goals: [
      <>State in one sentence the truth about a large model’s “memory”: there’s no memory store, only a window — on every turn, it can see only the tokens inside the window</>,
      <>Use one key to unlock three everyday mysteries: forgetting the start of a long chat, forgetting everything in a new session, and not being able to fit a long document</>,
      <>Know that “big window ≠ clear sight”: key info placed in the middle of a long context is the easiest to miss, so put important content at the two ends</>,
      <>Understand the ledger of the window arms race: a 10× larger window means roughly 100× the compute, plus the two escape routes of rolling summaries and RAG</>,
    ],

    conceptTitle: '💡 Core Idea: A Large Model Has No Memory Store, Only a “Window”',
    conceptLead: 'The last lesson planted a seed at the end: a prompt isn’t just the line you just typed — the entire conversation history is part of the continuation conditions. This lesson settles that account in full. First, a counterintuitive fact: a large model has no “memory store” at all. It doesn’t “keep in mind” what you’ve said; strictly speaking, it doesn’t even have a concept of “the previous turn” — every time it answers, it’s reading this conversation for the first time.',
    intuitTag: 'Intuition',
    intuitBig: <>The AI is having an ongoing chat with me <span className="gap">→</span> it’s always “online,” remembering everything we’ve talked about</>,
    intuitNote: 'By this understanding, it should know you better the more you chat, and recognize you in a new session too — yet neither of those holds.',
    realTag: 'How It Actually Works',
    realBig: <>The model has only a “window” <span className="gap">→</span> on each turn, all it can see is <span className="hl">the tokens inside the window</span></>,
    realNote: 'Inside the window = system prompt + conversation history + the line you just typed. Everything outside it — including what you’ve “talked about” — effectively doesn’t exist.',
    deskLead: <>This window is the <b>context window</b>: the upper limit on the number of tokens the model can “see” at once. The most fitting metaphor is a <b>fixed-size desk</b>: every reference must be laid out on the desktop for the model to see it; there are no drawers, no bookshelves beyond the desk — any paper that doesn’t fit effectively doesn’t exist. Why must it be designed this way? You’ve learned both root causes:</>,
    roots: [
      { label: 'Root cause 1 · Lesson 12', en: <>Knowledge is <b>frozen</b> in the parameters</>, zh: <>Once pretraining ends, the model’s hundreds of billions of parameters are sealed. Chatting with it <b>changes not a single parameter</b> — there’s simply nowhere inside the model to “store” the conversation. The only thing that can store it is the window.</> },
      { label: 'Root cause 2 · Lesson 9', en: <>Attention needs a <b>boundary</b></>, zh: <>The attention mechanism is “every word looks at every word.” “Every word” must have an upper bound, or compute and memory can’t hold up — that hard limit is the size of the window.</> },
    ],
    flowLead: 'So how is “ongoing chat” pulled off? The answer will reshape how you think about every single send — follow one message through the whole journey:',
    flowSteps: [
      <><b>You hit send.</b> On screen, it looks like you sent just one line.</>,
      <><b>The client packs it up.</b> ChatGPT / Claude’s web page or app stitches [system prompt + all previous Q&A + your new message] into one long text.</>,
      <><b>The whole bundle goes to the model.</b> The model reads from the first token to the last — as if reading this conversation for the first time.</>,
      <><b>It continues, generating an answer.</b> Output token by token, an old friend by now (Lessons 12, 14).</>,
      <><b>It forgets the moment it’s done.</b> The answer is stored by the client into the chat log, and the model instantly returns to a “blank slate.” The next turn? Start over from step 1 — only the bundle is a bit longer. <span className="footnote">What we call “chatting” is an illusion sustained by the client resending the entire history for you on every turn.</span></>,
    ],
    billLead: <>Lesson 11’s seed can be harvested now too: the API charges by token, and every turn resends the entire history — <b>the question on turn 50 has to pay again for all the tokens of the previous 49 turns</b>. “The longer you chat, the more it costs” isn’t a pricing gimmick; it’s a consequence of the mechanism. Connect the phenomena you’ve seen in products to this mechanism:</>,
    matchHead1: 'What you see in ChatGPT / Claude',
    matchHead2: 'The mechanism behind it',
    matchRows: [
      { p: <b>Yesterday’s session is still there today and you can keep chatting</b>, m: 'Not because the model remembers you — the history lives in the product’s database, and the moment you speak, the client resends the whole bundle' },
      { p: <b>The longer the conversation, the slower the answer</b>, m: 'The more tokens in the window, the more old words each new word must “look at” to be generated (Lesson 9)' },
      { p: <b>The API bill grows the more you chat</b>, m: 'Every turn resends the full history, charged at full token rates (Lesson 11)' },
      { p: <b>Tell it to “forget that last line” and it just can’t</b>, m: 'As long as that line is still in the window, the model can see it — to truly forget, you can only delete it from the history or start a new session' },
    ],
    limitLead: <>We’ve covered what the window can do; now for its limits: it’s <b>finite</b>, and it’s <b>per-session</b>. These two limits map exactly onto the three mysteries that trip you up most in daily use — the next section unlocks them all with one key.</>,

    riddlesTitle: '📖 Three Everyday Mysteries, One Key for All',
    riddlesLead: 'You’ve probably hit all three of these, and likely chalked them up to “the AI acting up.” Now look again through the “window” — they’re all three faces of the same mechanism.',
    riddles: [
      { label: 'Mystery 1 · the window is full', en: <>Long chats <b>forget the start</b></>, zh: <>Once the window fills up, new turns push the earliest content <b>out of the window</b> (different products handle it differently: hard truncation, rolling discard, or quiet compression). The model didn’t “forget” the start — there’s no start left in the bundle sent to it.</> },
      { label: 'Mystery 2 · the window is per-session', en: <>A new session <b>forgets everything</b></>, zh: <>A new session = a brand-new empty window. The old session’s history isn’t packed in, and the model has no cross-session storage at all — it’s not faking amnesia, it’s <b>genuinely meeting you for the first time</b>.</> },
      { label: 'Mystery 3 · the window has a cap', en: <>A long document <b>won’t fit</b></>, zh: <>The document’s token count exceeds the window size, so the model physically can’t read it — hence the “file too long” error you see, or the more insidious case: it gets <b>quietly truncated</b>, the model never read the back half of the book, yet still answers confidently.</> },
    ],
    memLead: 'At this point someone always raises a hand: “Hold on, ChatGPT clearly knows I’m a programmer, even in a new session!” Good question — look at a realistic scenario:',
    memEn: <>In a new session your first line is just “recommend a few books,” yet it replies “As a <span className="hl">programmer</span>, you might enjoy…” — how did it know?</>,
    memZh: <>This is a product-layer <b>“memory feature”</b> (ChatGPT’s Memory, various vendors’ “custom instructions / project settings”): the product distills the key points from your past conversations into little notes and stores them in <b>its own database</b>, then quietly <b>slips the notes back into the window</b> when you start a new session. The model itself still has zero memory — the product is feeding it a cheat sheet. You can verify this yourself: go to settings and find “Memory,” you’ll see the distilled notes one by one; delete one and it really forgets.</>,
    memTail: <>Note this layering: <b>“memory” is a product feature, not a model capability.</b> Every experience that looks like “it remembered” — the session list, the memory feature, the project knowledge base — is fundamentally the same trick: <b>store the information outside the window, and slip it back in when needed</b>. Remember this trick, and next lesson’s RAG will feel familiar.</>,

    lostTitle: '📖 Lost in the Middle: A Big Window Doesn’t Mean Clear Sight',
    lostLead: 'By the earlier logic, a big enough window seems to solve everything — stuff in the whole manual and ask about any page. But in 2023 researchers at Stanford and others ran an experiment whose result threw cold water on everyone. The experiment itself was plain:',
    lostEn: <>Give the model dozens of documents, of which <span className="hl">only one</span> hides the answer, then place that key document at different positions in the context — the start, the middle, the end — and ask the same question.</>,
    lostZh: <>The result: when placed at the <b>start</b> or the <b>end</b>, the model very likely answered correctly; placed in the <b>middle</b>, accuracy dropped noticeably — in the worst case it was even worse than giving no document and letting the model guess closed-book. Plotting the accuracy gives a U-shaped curve, and the paper is titled <b>Lost in the Middle</b>.</>,
    lostSvgAria: 'U-shaped curve: success is high when key info is at the start or end, and drops noticeably in the middle',
    lostYAxis: 'Success rate of finding the key info ↑',
    lostStart: 'At the start · found',
    lostMid: 'In the middle · easiest to miss',
    lostEnd: 'At the end · found',
    lostStartLbl: 'Start',
    lostXAxis: '← Position of the key info in the context →',
    lostEndLbl: 'End',
    lostWhy: <>Why does this happen? The exact mechanism is still under study, but two intuitively solid explanations stack up: first, the <b>statistics of training data</b> — articles state the point at the start and summarize at the end, the latest few lines of a chat are the most relevant, so important info naturally tends to sit at the two ends; second, very long texts are rare in training corpora to begin with, so the model has <b>too little practice</b> allocating attention to “far away in the middle.” In practice, three habits:</>,
    habits: [
      { label: 'Habit 1', en: <>Put important constraints <b>at the two ends</b></>, zh: <>Set the tone at the start of the prompt, restate at the end — the “put key points at the ends” principle from Lesson 16, with its mechanism right here in this U-shaped curve.</> },
      { label: 'Habit 2', en: <><b>Trim down</b> long material first</>, zh: <>Extract the relevant sections before asking; don’t dump all 200 pages in at once — fitting it in doesn’t mean reading it clearly.</> },
      { label: 'Habit 3', en: <>Cite by name when asking</>, zh: <>“According to the refund clause in Section 3…” pulls attention to the right place far better than “according to the document above…”</> },
    ],

    lostSourceNote: (
      <>
        The "lost in the middle" experiment is from Liu et al. 2023,{' '}
        <a href="https://arxiv.org/abs/2307.03172" target="_blank" rel="noreferrer">
          Lost in the Middle: How Language Models Use Long Contexts
        </a>
        .
      </>
    ),
    raceTitle: '📈 The Arms Race and Its Price: From 4k to 1M+',
    raceLead: 'Since the window matters so much, making it bigger naturally became an arms race among the vendors. Over a few years window sizes grew by several orders of magnitude — but every inch of window carries a clear price tag. First, the state of the race:',
    raceHead: ['Window size', 'Roughly fits', 'Era'],
    raceRows: [
      { be: '4k tokens', f: 'A long article of a few thousand words', e: 'Around 2020, the level of the first generation of large models' },
      { be: '128k tokens', f: 'A novella / the core code of a project', e: 'From 2023 onward, gradually became standard on flagships' },
      { be: '1M+ tokens', f: 'Several novels / an entire codebase', e: '2024–2025 top models (check each vendor’s official site for specifics)' },
    ],
    costLead: <>Where’s the price? Lesson 9’s “every word looks at every word” bares its fangs here. An analogy: 10 people at a round-table meeting have about 45 pairwise relationships; switch to a 100-person gathering and there are about 5,000 pairs — <b>10× the people, but about 100× the “mutual looks.”</b> Attention is exactly the same: 10× the window length means compute grows by the square, to about 100×. So three bills arrive together:</>,
    bills: [
      { label: 'Bill 1 · compute', en: <>Compute grows by the <b>square</b></>, zh: <>10× the length means 100× the mutual looks — memory, electricity, and chips all foot the bill. This is the fundamental reason long-window models are expensive.</> },
      { label: 'Bill 2 · wallet', en: <>Tokens are <b>charged in full</b></>, zh: <>Stuff a book into the window, and afterward <b>every question</b> pays again for the whole book’s tokens (Lesson 11). Caching can give a discount, but the mechanism doesn’t change.</> },
      { label: 'Bill 3 · time', en: <>First-token <b>latency</b> grows</>, zh: <>The AI takes forever to start after you paste a very long document? It’s reading through the entire window from the start before it can produce the first token.</> },
    ],
    routesLead: <>Expensive, slow, and easy to miss things in the middle — so the engineers’ consensus isn’t “the bigger the window the better,” but <b>make every token in the window earn its place</b>. Two mainstream window-saving routes:</>,
    routes: [
      { label: 'Route 1 · conversations', en: <><b>Rolling summary</b></>, zh: <>Compress far-back conversation into a short summary kept in the window, replacing the original. Long-chat products avoid “crashing” largely thanks to this — at the cost of lossy detail: you may have seen the AI “roughly remember” something long ago “but not the details,” that’s the summary at work.</> },
      { label: 'Route 2 · reference material', en: <><b>RAG: retrieve on demand</b></>, zh: <>Keep the material in an external knowledge base, and each turn retrieve only the <b>most relevant few passages</b> to put in the window. This is the engineering pinnacle of “store info outside the window, slip it back in when needed” — the next lesson is all about it.</> },
    ],
    raceTail: <>One sentence to close this section, and the single most worth-keeping line of this lesson: <b>putting the right information into the window beats stuffing all the information in.</b></>,

    demoSecTitle: '🎛️ Interactive Demo: Push the “Allergy History” Out of the Window Yourself',
    demoSecLead: 'The window below holds at most 4 turns of dialogue (plus one pinned system prompt). Keep clicking “Next turn” to watch an everyday conversation walk step by step into the “amnesia scene” — pay special attention to what happens on turn 6.',

    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      {
        bad: 'The AI remembers our last conversation, and the more we chat the better it understands me',
        good: 'The model itself has zero memory and zero growth — every “remembered” thing is a cheat sheet the product stores outside the window and slips back in',
        why: <><b>Cause:</b> the product interface feels too much like “chatting with a person”: the session list is always there and the memory feature occasionally shows up, making it easy to imagine an “AI that knows me.” Debunking it takes two steps: turn off the memory feature and start a new session — it really is meeting you for the first time; open the “Memory” list in settings — those little notes are the entirety of what makes it “know you,” and deleting them makes it forget. Telling <b>model capability</b> apart from <b>product feature</b> is the most important discernment at this stage.</>,
      },
      {
        bad: 'The bigger the window the better, so just pick the model with the largest window',
        good: 'A big window is expensive, slow, and easy to miss things in the middle — putting the right info in beats stuffing everything in',
        why: <><b>Cause:</b> mistaking “can fit it” for “can read it well.” A 10× window means compute grows by the square, every turn is charged at full token rates, and first-token latency grows — while lost in the middle tells you: the longer the content you stuff in, the easier it is to miss key info buried in the middle. A big window is a precious <b>capability ceiling</b>, not the default way to use it — the better everyday move is to trim material, put key points at the two ends, and bring in RAG when there’s a lot of material (next lesson).</>,
      },
    ],

    bridgeTitle: '➡️ How This Leads to Lesson 18',
    bridgeLead: 'One move kept recurring this lesson: store information outside the window and slip it back in when needed. One of this lesson\'s two escape routes — RAG, retrieve on demand — takes that move to its engineering extreme: rather than cramming a whole knowledge base into a limited window, build an external library and retrieve only the most relevant few passages each time. The next lesson is all about RAG: chunk, embed, retrieve, inject — see how it bolts a never-ending knowledge base onto a large model.',
    bridgeSteps: ['Window is limited & session-scoped', 'Trick: store outside, slip back in', 'The engineered fix for reference material', 'Next: RAG'],
    quizTitle: '✍️ Quick Quiz',
    quiz: [
      {
        q: '1. A friend complains: “Yesterday in that session ChatGPT clearly knew all the background of my project, but today I started a new session and it forgot everything — is it a bug?” Explain the cause using this lesson’s mechanism, and give two practical countermeasures.',
        a: <><b>Not a bug, it’s the mechanism.</b> The window is per-session: a new session = a brand-new empty window, and the old session’s history only lives in the product database and isn’t packed into the new session — the model never had cross-session memory. <b>Countermeasures:</b> ① in the old session, have the AI summarize the project background into a set of key points, and paste it at the start of the new session; ② use the product’s “memory / custom instructions / project” feature to pin down the long-term background. Both moves are fundamentally the same: <b>put the key points back into the window</b>.</>,
      },
      {
        q: '2. You stuffed the full text of a 200-page contract into a large-window model and asked “what are the catches in the penalty clause on page 87,” and it answered vaguely or even wrong. The window clearly fits it, so why? How should you improve it?',
        a: <><b>Fits ≠ seen clearly.</b> The key clause is buried in the middle of a very long context, exactly the position lost in the middle most easily misses. <b>Improvements:</b> ① extract the penalty clause on its own and put it at the start or end of the question before asking; ② cite by name when asking (“according to clause X excerpted below…”) to pull attention there; ③ when there’s a lot of material and you’ll ask repeatedly, switch to a retrieval approach (RAG, next lesson), putting only the relevant passages into the window each time.</>,
      },
      {
        q: '3. The same question, asked at the end of a conversation that’s already run 100 turns versus asked on its own in a new session — which is more expensive? Which is more likely to be answered well? Why?',
        a: <><b>Asking at the end of the long conversation is more expensive</b> — every turn resends the full history, so 100 turns’ worth of tokens get charged again in full (Lesson 11), and generation is slower too. <b>And it won’t necessarily answer better:</b> if the relevant info was pushed out of the window long ago, the model simply can’t see it; even if it’s still in, it may be buried in the middle and missed. If the question doesn’t depend on the prior context, a new session is both cheaper and cleaner. The mantra: <b>don’t treat a session as a storage locker — putting the right information into the window beats stuffing all the information in.</b></>,
      },
    ],
  },
}

function CtxCard({ round, idx, step, c }) {
  const winStart = Math.max(0, step - CAP)
  let evicted = false, opacity = 0, tx = 575, ty = BASE_Y
  if (idx >= step) { opacity = 0; tx = 575; ty = BASE_Y } // 未进场
  else if (idx < winStart) { evicted = true; opacity = 0; tx = -130; ty = BASE_Y - 26 } // 被挤出
  else { opacity = 1; tx = SLOT_X[idx - winStart]; ty = BASE_Y } // 窗内
  return (
    <g className={`ctx-card${evicted ? ' evicted' : ''}`} style={{ opacity, transform: `translate(${tx}px,${ty}px)` }}>
      <text x="50" y="12" fontSize="10" fill="var(--fg-2)" textAnchor="middle">{c.roundLabel(idx + 1)}</text>
      <rect className="bub-u" x="0" y="20" width="100" height="58" rx="8" strokeWidth="1" />
      {round.u.map((line, i) => <text key={i} x="7" y={35 + i * 13} fontSize="10" fill="var(--fg-0)">{line}</text>)}
      <rect className={`bub-a${round.wrong ? ' wrong' : ''}`} x="0" y="86" width="100" height="72" rx="8" strokeWidth="1" />
      {round.a.map((line, i) => <text key={i} x="7" y={101 + i * 13} fontSize="10" fontWeight={round.wrong ? 600 : 400} fill="var(--fg-0)">{line}</text>)}
    </g>
  )
}

function ContextWindowDemo({ c }) {
  const [step, setStep] = useState(0)
  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.demoTitle}</span>
        <span className="demo-hint">{c.demoHint}</span>
      </div>
      <div className="demo-body stack">
        <div className="demo-stage">
          <div className="demo-stage-col">
            <svg id="ctx-svg" viewBox="0 0 560 240" width="540" aria-label={c.svgAria}>
              <text x="14" y="26" fontSize="13" fontWeight="700" fill="var(--fg-0)">{c.ctxTitle}</text>
              <text x="110" y="26" fontSize="11" fill="var(--fg-2)">{c.ctxCap}</text>
              <text x="546" y="26" fontSize="11" fill="var(--fg-2)" textAnchor="end">{c.ctxPush}</text>
              <rect x="14" y="40" width="532" height="188" rx="18" fill="none" stroke="var(--hairline-strong)" strokeWidth="1.5" strokeDasharray="6 4" />
              <g>
                <rect x="26" y="56" width="44" height="158" rx="10" fill="var(--amber-bg)" stroke="var(--amber)" strokeWidth="1" />
                <text x="48" y="84" fontSize="12" fill="var(--fg-1)" textAnchor="middle">📌</text>
                {c.sysPrompt.map((ch, i) => <text key={i} x="48" y={110 + i * 18} fontSize="11" fontWeight="600" fill="var(--fg-0)" textAnchor="middle">{ch}</text>)}
              </g>
              <g>
                {ROUNDS.map((r, i) => <CtxCard key={i} round={r} idx={i} step={step} c={c} />)}
              </g>
            </svg>
            <div className={`ctx-caption${WARN_STEPS[step] ? ' warn' : ''}`}>{c.CAPS[step]}</div>
          </div>
        </div>
        <div className="demo-side">
          <div className="chips">
            <button className="chip" disabled={step >= ROUNDS.length} onClick={() => setStep((s) => Math.min(ROUNDS.length, s + 1))}>{c.nextBtn}</button>
            <button className="chip" onClick={() => setStep(0)}>{c.restartBtn}</button>
            <span className="footnote" style={{ alignSelf: 'center' }}>{c.progress(step, ROUNDS.length)}</span>
          </div>
          <h4 style={{ marginTop: 14 }}>{c.INFO[step].t}</h4>
          <p>{c.INFO[step].d}</p>
        </div>
      </div>
    </div>
  )
}

export default function L17() {
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
            <div className="tag"><span className="pill pill-ink">{c.intuitTag}</span></div>
            <div className="big">{c.intuitBig}</div>
            <p className="note">{c.intuitNote}</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">{c.realTag}</span></div>
            <div className="big">{c.realBig}</div>
            <p className="note">{c.realNote}</p>
          </div>
        </div>
        <p className="lead mt14">{c.deskLead}</p>
        <div className="use-grid cols-2">
          {c.roots.map((r, i) => (
            <div className="card use-card" key={i}><div className="label">{r.label}</div><div className="en">{r.en}</div><div className="zh">{r.zh}</div></div>
          ))}
        </div>
        <p className="lead mt14">{c.flowLead}</p>
        <div className="card card-pad">
          <div className="flow">
            {c.flowSteps.map((txt, i) => (
              <div className="flow-step" key={i}><span className="num">{i + 1}</span><span className="txt">{txt}</span></div>
            ))}
          </div>
        </div>
        <p className="lead mt14">{c.billLead}</p>
        <div className="card">
          <table className="match">
            <thead><tr><th>{c.matchHead1}</th><th>{c.matchHead2}</th></tr></thead>
            <tbody>
              {c.matchRows.map((row, i) => (
                <tr key={i}><td>{row.p}</td><td className="ex">{row.m}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="lead mt14">{c.limitLead}</p>
      </Lsec>

      <Lsec
        title={c.riddlesTitle}
        lead={c.riddlesLead}
      >
        <div className="use-grid">
          {c.riddles.map((r, i) => (
            <div className="card use-card" key={i}><div className="label">{r.label}</div><div className="en">{r.en}</div><div className="zh">{r.zh}</div></div>
          ))}
        </div>
        <p className="lead mt14">{c.memLead}</p>
        <div className="example">
          <div className="en">{c.memEn}</div>
          <div className="zh">{c.memZh}</div>
        </div>
        <p className="lead mt14">{c.memTail}</p>
      </Lsec>

      <Lsec
        title={c.lostTitle}
        lead={c.lostLead}
      >
        <div className="example">
          <div className="en">{c.lostEn}</div>
          <div className="zh">{c.lostZh}</div>
        </div>
        <div className="card card-pad mt14">
          <svg viewBox="0 0 460 210" width="440" style={{ display: 'block', margin: '0 auto', maxWidth: '100%' }} aria-label={c.lostSvgAria}>
            <text x="54" y="22" fontSize="11" fill="var(--fg-2)">{c.lostYAxis}</text>
            <line x1="50" y1="30" x2="50" y2="172" stroke="var(--hairline-strong)" strokeWidth="1" />
            <line x1="50" y1="172" x2="430" y2="172" stroke="var(--hairline-strong)" strokeWidth="1" />
            <path d="M 70 52 C 130 60, 180 138, 240 140 C 300 138, 350 58, 410 50" fill="none" stroke="var(--sky)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="70" cy="52" r="5" fill="var(--sage)" />
            <circle cx="240" cy="140" r="5" fill="var(--terracotta)" />
            <circle cx="410" cy="50" r="5" fill="var(--sage)" />
            <text x="62" y="40" fontSize="11.5" fontWeight="600" fill="var(--fg-0)">{c.lostStart}</text>
            <text x="240" y="160" fontSize="11.5" fontWeight="600" fill="var(--terracotta)" textAnchor="middle">{c.lostMid}</text>
            <text x="418" y="40" fontSize="11.5" fontWeight="600" fill="var(--fg-0)" textAnchor="end">{c.lostEnd}</text>
            <text x="70" y="192" fontSize="11" fill="var(--fg-1)" textAnchor="middle">{c.lostStartLbl}</text>
            <text x="240" y="192" fontSize="11" fill="var(--fg-1)" textAnchor="middle">{c.lostXAxis}</text>
            <text x="410" y="192" fontSize="11" fill="var(--fg-1)" textAnchor="middle">{c.lostEndLbl}</text>
          </svg>
        </div>
        <p className="lead mt14">{c.lostWhy}</p>
        <div className="use-grid">
          {c.habits.map((h, i) => (
            <div className="card use-card" key={i}><div className="label">{h.label}</div><div className="en">{h.en}</div><div className="zh">{h.zh}</div></div>
          ))}
        </div>
        <p className="footnote source-note">{c.lostSourceNote}</p>
      </Lsec>

      <Lsec
        title={c.raceTitle}
        lead={c.raceLead}
      >
        <div className="card">
          <table className="match">
            <thead><tr><th>{c.raceHead[0]}</th><th>{c.raceHead[1]}</th><th>{c.raceHead[2]}</th></tr></thead>
            <tbody>
              {c.raceRows.map((row, i) => (
                <tr key={i}><td className="be">{row.be}</td><td className="ex">{row.f}</td><td className="ex">{row.e}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="lead mt14">{c.costLead}</p>
        <div className="use-grid">
          {c.bills.map((b, i) => (
            <div className="card use-card" key={i}><div className="label">{b.label}</div><div className="en">{b.en}</div><div className="zh">{b.zh}</div></div>
          ))}
        </div>
        <p className="lead mt14">{c.routesLead}</p>
        <div className="use-grid cols-2">
          {c.routes.map((r, i) => (
            <div className="card use-card" key={i}><div className="label">{r.label}</div><div className="en">{r.en}</div><div className="zh">{r.zh}</div></div>
          ))}
        </div>
        <p className="lead mt14">{c.raceTail}</p>
      </Lsec>

      <Lsec
        title={c.demoSecTitle}
        lead={c.demoSecLead}
      >
        <ContextWindowDemo c={c} />
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
