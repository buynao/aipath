import { useState } from 'react'
import { Lsec, QuizItem } from '../components/ui.jsx'
import { useLang } from '../i18n/LangContext.jsx'

// ============================================================
// RAG 管线步进演示 —— 布局数据在模块作用域预算（确定性）
// ============================================================
const STEPS = 6
const STAR = [386, 136]
const STAR_HOME = [328, 320]
const SLOT_Y = [122, 158, 194]
const QSLOT_Y = 232

// 几何/命中关系固定；可见文本（name/t/src）按语言取用。
const DOC_GEO = [
  { color: 'sky', y: 44, chunks: [
    { dot: [252, 108] },
    { dot: [382, 118], hit: true },
    { dot: [412, 142], hit: true },
  ] },
  { color: 'amber', y: 170, chunks: [
    { dot: [238, 196] },
    { dot: [264, 214] },
    { dot: [242, 238] },
  ] },
  { color: 'sage', y: 296, chunks: [
    { dot: [360, 150], hit: true },
    { dot: [330, 240] },
    { dot: [356, 258] },
  ] },
]

// 双语内容层：结构 / class / 交互 / 几何均不变，仅文本按语言取用。
// 富文本（含内联标签）直接以 JSX 片段存储，渲染输出与单语版逐字一致。
const C = {
  zh: {
    // 演示数据文本（与几何一一对应）
    docs: [
      { name: '📄 员工手册', chunks: [
        { t: '试用期为 3 个月' },
        { t: '入职满 1 年：年假 5 天', src: '员工手册 §2' },
        { t: '工作满 5 年：年假 10 天', src: '员工手册 §3' },
      ] },
      { name: '📄 报销制度', chunks: [
        { t: '打车报销需提供发票' },
        { t: '差旅住宿每晚上限 400 元' },
        { t: '出差餐补每日 30 元' },
      ] },
      { name: '📄 考勤规定', chunks: [
        { t: '休假需提前 3 天在 OA 申请', src: '考勤规定 §1' },
        { t: '迟到超 30 分钟记缺勤' },
        { t: '加班 1 天可调休 1 天' },
      ] },
    ],
    caps: [
      '三份公司文档等着入库 —— 右侧的问答区暂时还用不上',
      '① 切块：每份文档被切成 3 个语义完整的小块',
      '② 向量化：9 个块各自算出 embedding，按语义远近落进向量库',
      '③ 用户提问 —— 从这里开始是在线问答阶段',
      '④ 检索：问题也变成一个点，最近的 3 块被命中 —— 有一块来自另一份文档',
      '⑤ 拼装：命中块的原文＋出处＋问题，填进 prompt 模板',
      '⑥ 生成：模型照着窗内片段作答并给出处 —— 全程没改一个参数',
    ],
    info: [
      { t: '开局：三份文档、一个空库', d: '左边是公司的三份制度文档。RAG 的第一阶段是“建库”，离线做一次就好 —— 之后所有人的所有提问都复用这座库。点「下一步」开始。' },
      { t: '切块（chunk）', d: '整篇文档太长，不能直接当检索单位，于是切成一块块语义完整的小段。块太大，检索容易拿错、塞窗费 token；块太小，一句话被拦腰截断。切块质量直接决定最后答得好不好 —— 这是 RAG 工程的第一道关。' },
      { t: '语义变坐标（第 8 课回归）', d: '每个块经 embedding 模型变成一串数字，相当于在“语义地图”上有了座标：讲休假的块彼此挨着，讲报销的块抱团在另一边。这张图就是向量库 —— 一种专门按“谁离谁近”做查询的数据库。' },
      { t: '用户上线提问', d: '注意：问题里只有“年假”两个关键字，没提“休假”也没提“考勤”。如果用老式关键词搜索，考勤规定里那条“休假需提前申请”就漏掉了 —— 看下一步语义检索怎么处理。' },
      { t: '最近邻检索 top-3', d: '问题用同一个 embedding 模型变成点、落进同一张地图，然后找离它最近的 3 个块。看：两条年假条款＋一条休假申请规定被命中，报销类的块纹丝不动 —— 按“意思”找，不按字面找，还能跨文档命中。' },
      { t: '拼进 prompt', d: '命中的 3 块原文连同出处，和用户问题一起填进 prompt 模板。对模型来说，这只是一次普通的“带资料阅读理解”—— 它不知道向量库的存在，只看见窗内这几段文字（第 17 课）。' },
      { t: '带出处的回答', d: '模型基于片段作答并标明来源，你能顺着出处核对原文 —— 这是 RAG 比“裸问”多出的关键能力。下一个问题进来？从第 ③ 步重跑，向量库不必重建；模型对刚才这题，已经忘得一干二净。' },
    ],
    // SVG 内联文本
    svgAria: 'RAG 管线演示：文档切块、向量化入库、检索命中、拼装 prompt、生成带出处回答',
    demoTitle: '🎛️ 交互演示 · RAG 全管线：从文档到带出处的回答',
    demoHint: '蓝 = 员工手册 · 黄 = 报销制度 · 绿 = 考勤规定 · 红 = 用户问题',
    buildLabel: '建库（离线 · 只做一次）',
    vectorDbLabel: '向量库 · 语义地图',
    closerLabel: '意思越近，点越近',
    clusterVacation: '休假类',
    clusterExpense: '报销类',
    clusterAttendance: '考勤类',
    qaTitle: '问答（在线 · 每题跑一遍）',
    promptLabel: '发给模型的 prompt',
    sysLine1: '【系统提示】你是 HR 助手，',
    sysLine2: '只根据下方资料回答并注明出处；',
    sysLine3: '资料里查不到就直说查不到。',
    retrievedFrag: ['检索片段 ①', '检索片段 ②', '检索片段 ③'],
    userQuestionSlot: '用户问题',
    userAsks: '用户提问：「年假有几天？」',
    questionText: '年假有几天？',
    answerLabel: '【模型回答】',
    answerLine1: '入职满 1 年有 5 天年假，工作',
    answerLine2: '满 5 年增至 10 天；休假记得',
    answerLine3: '提前 3 天在 OA 申请。',
    answerSrc1: '出处：员工手册 §2、§3',
    answerSrc2: '　　　考勤规定 §1',
    nextBtn: '下一步 ▸',
    resetBtn: '↺ 重置',
    stepLabel: (step) => `第 ${step} / ${STEPS} 步`,

    goalsTitle: '🎯 你将学会',
    goals: [
      <>一句话说清 RAG 的本质：开卷考试 —— 模型不背你的文档，答题时现场翻到对的那几页</>,
      <>把 RAG 管线拆成两条线：离线建库（切块 → 向量化 → 入库）与在线问答（检索 → 拼 prompt → 生成带出处的回答）</>,
      <>算清「RAG vs 微调」四笔账 —— 知识更新、可溯源、成本、数据安全，知道知识注入为什么几乎一边倒选 RAG</>,
      <>认得出三种翻车现场：检索不准、切块切碎语义、模型无视小抄 —— 看穿“上了 RAG 怎么还会编”</>,
    ],

    conceptTitle: '💡 核心概念：开卷考试 —— 小抄要带，更要翻得到',
    conceptLead: '上一课的最后一句话是：“把对的信息放进窗，胜过把所有信息塞进窗。”这一课就讲那套自动找出“对的信息”、再塞进窗的工程系统。先把动机算清楚 —— 你想让 AI 回答自家文档的问题时，面前横着三堵墙：',
    walls: [
      { label: '墙一 · 第 12 课讲过', en: <>知识有<b>截止日</b></>, zh: '预训练一结束，参数就封板。训练截止日之后的世界 —— 昨天发布的新品、今早改的价格 —— 模型一概不知。' },
      { label: '墙二 · 训练数据没有你', en: <>私有文档是<b>盲区</b></>, zh: '你公司的请假制度、项目文档、客服话术从没进过训练语料，参数里压根没有 —— 怎么问都问不出真的，只能问出编的。' },
      { label: '墙三 · 第 17 课讲过', en: <>窗口<b>塞不下</b></>, zh: '把全部文档塞进上下文？贵、慢，关键内容还容易在中间被看丢（lost in the middle）—— 上一课刚算过这笔账。' },
    ],
    wallsAfter: '三堵墙堵死了两条直觉路：往参数里“教”，教不进也教不起；往窗里“塞”，塞不下也读不清。主流解法走了第三条路：',
    contrast: [
      { pill: 'pill-ink', tag: '直觉方案', big: <>让 AI“学会”我的文档 <span className="gap">→</span> 训练太贵，全塞进窗又放不下</>, note: '两条路都撞墙：参数改不动（第 12 课），窗口装不下、读不清（第 17 课）。' },
      { pill: 'pill-sage', tag: '真实主流方案', big: <>文档放窗外，<span className="hl">按题检索</span> <span className="gap">→</span> 每次只把最相关的几段塞进窗</>, note: '这就是 RAG：模型一个参数不动，动的只是每次喂给它的窗内内容。' },
    ],
    ragDefEn: <>RAG = Retrieval-Augmented Generation，<span className="hl">检索增强生成</span> —— 用检索（R）到的资料，增强（A）模型的生成（G）。</>,
    ragDefZh: <>最准的比喻是<b>开卷考试</b>：闭卷靠背（知识冻结在参数里）注定答不了新题；开卷可以带一整箱资料进考场，但考试只有两小时 —— 决定成绩的不是带了多少，而是<b>能不能快速翻到对的那一页</b>。“翻页”就是检索，“照着资料组织答案”就是生成。整门 RAG 工程，一句话：练习翻书。</>,
    alreadyUsed: '你其实早就用过 RAG，只是产品没把流水线亮给你看。把日常现象和机制连上线：',
    matchHead1: ['你在产品里见过的现象', '背后同一套机制'],
    matchRows1: [
      { a: <b>给 ChatGPT / Claude 传一份 PDF，它能答内容、还给出页码引用</b>, b: '文档被切块、建了索引，每次回答只检索相关片段塞进窗 —— 一套随开随用的迷你 RAG' },
      { a: <b>AI 搜索的回答下面挂着一排来源链接</b>, b: '同一条管线，只是“检索”从向量库换成了搜索引擎 —— R 的形式变了，A 和 G 没变' },
      { a: <b>企业客服机器人答得出上周刚改的退货政策</b>, b: '政策文档更新后重建索引即生效 —— 模型没动过，动的是库' },
      { a: <b>问得太偏时，它回答“资料中未找到相关内容”</b>, b: '检索没命中 + 系统提示要求“查不到就承认” —— 这份诚实是设计出来的，不是模型自觉' },
    ],
    matchAfter: '但“翻到对的那页”说着轻巧：文档怎么存，才能按“意思”翻？“对的那页”由谁判定？翻出来之后塞进哪里？下一节把整条流水线拆开看。',

    conceptSourceNote: (
      <>
        RAG 这一范式由 Facebook AI 的 Lewis 等 2020 提出{' '}
        <a href="https://arxiv.org/abs/2005.11401" target="_blank" rel="noreferrer">
          Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks
        </a>
        。
      </>
    ),
    twoPhaseTitle: '📖 两阶段拆透：先建库（离线），再问答（在线）',
    twoPhaseLead: 'RAG 不是某个新模型，而是一条流水线 —— 准确说是两条：一条离线，建库时跑一次就好；一条在线，每次提问都从头跑一遍。分开看，每一步都不神秘。',
    phase1Tag: '阶段一 · 建库（离线，只做一次）',
    phase1: [
      <><b>收集文档。</b>员工手册、产品文档、历史工单……任何文本都行。<span className="footnote">这一步定下知识库的上限：库里没有的内容，后面的环节谁也变不出来。</span></>,
      <><b>切块（chunk）。</b>把长文档切成几百字一块的“语义完整小段”。<span className="footnote">为什么要切？因为检索的最小单位是块：块太大，一块里混着多个话题，检索容易拿错、塞进窗还费 token；块太小，一句话被切碎、上下文丢光。常见做法：按标题和段落边界切，相邻块之间留一段重叠。</span></>,
      <><b>向量化（embedding）。</b>每个块交给 embedding 模型，变成一串数字坐标 —— 第 8 课的“语义变坐标”在这里上岗。<span className="footnote">意思相近的块，坐标就相近：“年假规定”和“休假申请”是邻居，和“发票报销”隔得很远。</span></>,
      <><b>存入向量库。</b>一种专门按“谁离谁近”做查询的数据库；存块的同时记下出处（来自哪个文档、哪一节）。<span className="footnote">这条出处元数据，就是最后回答能“给引用”的原料。</span></>,
    ],
    phase2Tag: '阶段二 · 问答（在线，每题跑一遍）',
    phase2: [
      <><b>问题向量化。</b>用户的问题用同一个 embedding 模型变成坐标。<span className="footnote">必须是同一个 —— 两套坐标系之间没法比距离。</span></>,
      <><b>最近邻检索。</b>在向量库里找离问题最近的 top-k 个块，k 通常是个位数。<span className="footnote">“最近” = 语义最相关。这是按意思找，不是按字面找 —— 下一节会看到这件事的威力和软肋。</span></>,
      <><b>拼装 prompt。</b>系统提示（“只根据下方资料回答，并注明出处”）＋命中的 k 块原文＋用户问题，拼成一个 prompt。<span className="footnote">上一课的口诀在这里落地：进窗的不是整个库，只是这 k 块。</span></>,
      <><b>生成回答。</b>模型读着窗内片段作答，按要求标出处。<span className="footnote">对模型来说，这只是一次普通的“带资料阅读理解”—— 它不知道向量库的存在，更没“学会”任何新知识。</span></>,
    ],
    twoPhaseAfter: <>最关键的一点值得单独画线：<b>整条流水线没改模型的任何一个参数。</b>知识冻结在参数里（第 12 课）、能变的只有窗内内容（第 17 课）—— RAG 完全顺着这两条铁律做事。所以严格说，RAG 没有“教会”模型什么，它只是给模型配了一位<b>非常会翻书的秘书</b>：每次提问，秘书把对的几页摊在模型面前。由此立刻得到两个推论：① 知识更新 = 换文档重建索引，分钟级生效；② 模型答完即忘，下一题秘书重新翻书。</>,

    fineTitle: '📖 为什么不直接微调？算四笔账',
    fineLead: '总有另一条路看起来更“彻底”：把公司文档拿去微调（第 13 课），让知识真正长进参数里 —— 一劳永逸，多好。但工程界在“知识注入”这件事上几乎一边倒选 RAG。账本摆开，四行看完：',
    fineHead: ['比什么', 'RAG · 外挂知识库', '微调 · 把知识练进参数'],
    fineRows: [
      { be: '知识更新', rag: '改文档、重建索引，分钟级生效 —— 上午改制度，下午问就是新答案', ft: '重新备数据、重新训练，天级起步；还可能“学了新的、忘了旧的”' },
      { be: '可溯源', rag: '每个回答能附出处，点开就能核对原文', ft: '知识被揉散进亿万参数，说不清哪句话从哪学的 —— 答错了也无从对账' },
      { be: '成本', rag: '一次建库＋每次检索，开销量级远低于训练', ft: 'GPU、数据清洗、调参、回归测试 —— 一支专业团队的活' },
      { be: '数据安全', rag: '文档留在自家库里，还能按权限检索：谁有权看，才检索给谁', ft: '数据一旦练进参数就收不回、没法按人隔离，还可能被刻意提问“套”出来' },
    ],
    fineAfter: <>注意，这不是说微调没用 —— 微调的主场在<b>行为与风格</b>：让模型说话像客服、输出固定格式、熟悉行业黑话（第 13 课的本职工作）。一句话分工：<b>知识事实问 RAG，言行举止靠微调</b>，成熟系统经常两者并用 —— 微调教它“怎么答”，RAG 喂它“答什么”。</>,

    failTitle: '🔧 工程师视角：三种翻车现场',
    failLead: '流程图上的 RAG 人人会画，线上跑得稳的 RAG 凤毛麟角 —— 差距全在失败模式里。下面三种翻车现场，做 RAG 的工程师每天都在修：',
    fails: [
      { en: <>现场一 · 检索不准：<span className="hl">用户和文档不说同一种话</span>。用户问「电脑坏了找谁修？」，文档写的是「IT 设备故障请通过工单系统报修」—— 关键词一个都对不上。</>, zh: <>语义检索正是为此而生：「电脑坏了」和「设备故障报修」在向量空间里是近邻，<b>按意思能找到、按字面找不到</b>。但它也不万能 —— 在产品型号、人名、编号这类“字面必须精确”的查询上，语义检索反而常输给关键词搜索，所以成熟系统多用<b>混合检索（hybrid search）</b>（语义＋关键词各跑一遍再合并排序）。记住这条因果链：<b>检索拿错了页，后面的模型再强，也只能照着错页答。</b></> },
      { en: <>现场二 · 切块切碎语义：<span className="hl">一句话被拦腰截断</span>。原文是「年假 10 天（注：仅适用于工作满 5 年的员工）」，切块恰好从括号前断开 —— 检索只命中前半块，机器人自信回答「年假 10 天」。</>, zh: <>块是检索的最小单位，<b>切坏了，后面神仙难救</b>。三种常见病：句子被拦腰截断（如上）、限定条件和正文被切散、表格被切成无意义碎片。对策很朴素：按标题和段落边界切、相邻块留重叠、关键文档人工抽查切块结果 —— 不优雅，却是 RAG 工程里性价比最高的活。</> },
      { en: <>现场三 · 模型无视小抄：<span className="hl">片段就在窗里，它照样编</span>。片段明明写着「本产品不支持 Windows 7」，模型却热情回答「支持的，安装方法是……」。</>, zh: <>预训练的统计惯性（第 12 课）有时会压过窗内的事实；片段里没有答案时，模型也倾向于“友好地编一个”而不是认错。对策：系统提示写死「只根据资料回答，资料里没有就明说」、要求逐条标出处、把 temperature 调低（第 14 课）。但这些只能压低概率，<b>不能归零</b> —— 这正是出处必须可点开核查的原因。</> },
    ],
    failAfter: <>三个现场分别对应管线的三段：检索、切块、生成 —— 修 RAG 的第一步永远是先定位翻车在哪一段。第 28 课《实战 RAG》会带你亲手写代码搭一个知识库，把这三个坑挨个踩一遍、再爬出来。</>,

    demoSecTitle: '🎛️ 交互演示：把 RAG 管线亲手跑一遍',
    demoSecLead: '用一个具体场景走全程：把《员工手册》《报销制度》《考勤规定》三份文档建成知识库，然后问「年假有几天？」。连点「下一步」，看 6 步管线如何把一个问题变成一个带出处的回答 —— 尤其留意第 ④ 步：命中的三块里，有一块来自另一份文档。',

    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      { bad: '上了 RAG，模型就“学会”了我的文档', good: '模型一个参数都没变 —— 只是答题时临时看了几页小抄，下一题就忘', why: <><b>病因：</b>把“答对了文档内容”误当成“学会了”。RAG 的全部“知识”都装在每次进窗的那几个片段里：回答一结束，窗一清，模型回到出厂状态（第 17 课：读完即忘）。一个拆穿它的实验：<b>把向量库删掉，它立刻“全忘”</b> —— 真学进参数的东西，是不会因为删个库就消失的。</> },
      { bad: '上了 RAG 就不会幻觉了，回答还带引用，可以放心抄', good: '检索错页、片段不全时照样编 —— 引用机制不是消灭幻觉，是让你能核查', why: <><b>病因：</b>把 RAG 当成了“幻觉杀毒软件”。它确实能压低幻觉 —— 因为给了模型可抄的材料 —— 但管线三段各有翻车方式：检索拿错页、切块丢了限定条件、模型无视小抄按旧知识作答。出处的真正价值是<b>可验证</b>：拿到带引用的回答，顺着出处点开原文核对一眼，永远胜过盲信任何 AI —— 这也是 RAG 比微调多给你的那份安全带，记得系上。</> },
    ],

    bridgeTitle: '➡️ 下一课怎么接上',
    bridgeLead: 'RAG 让模型“读得到”自家文档，但它本质还是在被动读资料、组织文字。如果用户问的是“今天北京天气怎样”“把这笔订单退掉”——答案不在任何文档里，而在一个需要实时调用的接口或动作里，RAG 也无能为力。下一课讲 Function Calling：教模型在合适的时候主动“伸手”调用外部工具，从“会说”跨到“会做”。',
    bridgeSteps: ['RAG：给模型外挂知识', '但它只会读资料、组织文字', '有些答案要靠实时动作', '下一课：Function Calling'],
    quizTitle: '✍️ 小练习',
    quiz: [
      { q: '1. 公司今天上调了差旅报销标准。一个用 RAG 的客服机器人和一个把旧制度微调进参数的机器人，各自要做什么才能答对新标准？大概要多久？', a: <><b>RAG：</b>更新报销制度文档、重建（或增量更新）该文档的索引即可，<b>分钟级</b>生效 —— 模型本身不用碰。<b>微调：</b>要重新整理训练数据、再训练一轮、做回归测试防止“学新忘旧”，<b>天级起步</b>且需要专业团队。这正是“知识注入选 RAG”的第一笔账：知识会变，参数难改，文档好换。</> },
      { q: '2. 用户问“宠物能带进办公室吗”，知识库里明明有《办公场所管理规定》写着“禁止携带动物进入办公区”，机器人却回答“资料中没有相关规定”。猜两个最可能翻车的环节，并说说怎么排查。', a: <><b>环节一：检索不准。</b>“宠物”与“携带动物”虽然语义相近，但相似度可能仍排不进 top-k，于是该块没进窗。排查：看检索日志里实际命中了哪几块，试着调大 k 或换混合检索。<b>环节二：切块切碎。</b>这条规定可能和大量无关条文切在同一块里（语义被稀释），或者被拦腰截断。排查：直接搜库里包含“动物”的块。口诀：<b>先定位翻车在哪一段，再动手修</b>。</> },
      { q: '3. 朋友说：“我把 1000 页产品手册传进了 AI 的知识库功能，现在它已经学会我们的产品了，回答我都直接转发给客户。”用本课和第 17 课的知识，指出这句话里两处危险的误解。', a: <><b>误解一：“学会了”。</b>模型参数分毫未动 —— 每次回答只是检索出几个片段临时塞进窗，答完即忘（第 17 课：窗外的等于不存在）。<b>误解二：“直接转发”。</b>每次进窗的只有命中的 top-k 块，不是 1000 页全文：检索没命中、切块切碎、模型无视小抄，任何一段翻车都会产出一本正经的错答案。正确姿势：要求回答带出处，<b>转发前顺着引用核对原文</b>。</> },
    ],
  },

  en: {
    docs: [
      { name: '📄 Employee Handbook', chunks: [
        { t: 'Probation period: 3 months' },
        { t: '1 year of service: 5 days annual leave', src: 'Handbook §2' },
        { t: '5 years of service: 10 days annual leave', src: 'Handbook §3' },
      ] },
      { name: '📄 Expense Policy', chunks: [
        { t: 'Taxi reimbursement requires a receipt' },
        { t: 'Travel lodging capped at ¥400/night' },
        { t: 'Travel meal allowance ¥30/day' },
      ] },
      { name: '📄 Attendance Rules', chunks: [
        { t: 'File leave in OA 3 days ahead', src: 'Attendance Rules §1' },
        { t: 'Over 30 min late counts as absence' },
        { t: '1 day overtime → 1 day time off' },
      ] },
    ],
    caps: [
      'Three company documents waiting to be indexed — the Q&A panel on the right is idle for now',
      '① Chunk: each document is split into 3 semantically complete chunks',
      '② Embed: each of the 9 chunks gets an embedding and lands in the vector store by semantic distance',
      '③ User asks a question — the online Q&A stage begins here',
      '④ Retrieve: the question becomes a point too; the nearest 3 chunks are hit — one comes from another document',
      '⑤ Assemble: the hit chunks’ text + sources + question fill the prompt template',
      '⑥ Generate: the model answers from the in-window snippets and cites sources — not one parameter changed',
    ],
    info: [
      { t: 'Start: three documents, one empty store', d: 'On the left are the company’s three policy documents. RAG’s first stage is “building the store,” done once offline — after that, everyone’s every question reuses this store. Click “Next” to begin.' },
      { t: 'Chunk', d: 'A whole document is too long to be the retrieval unit, so it’s split into semantically complete short segments. Chunks too big: retrieval easily grabs the wrong one and burns tokens in the window; chunks too small: a sentence gets cut in half. Chunking quality directly decides how well it answers in the end — the first gate of RAG engineering.' },
      { t: 'Meaning → coordinates (Lesson 8 returns)', d: 'Each chunk goes through an embedding model and becomes a string of numbers — i.e., coordinates on a “semantic map”: leave chunks sit next to each other, expense chunks cluster on the other side. This map is the vector store — a database built to query by “who’s near whom.”' },
      { t: 'A user comes online and asks', d: 'Note: the question only has the keyword “annual leave” — it never says “time off” or “attendance.” With old-fashioned keyword search, the attendance rule “file leave ahead of time” would be missed — see how semantic retrieval handles it next.' },
      { t: 'Nearest-neighbor retrieval, top-3', d: 'The question is turned into a point by the same embedding model, dropped onto the same map, then the 3 nearest chunks are found. Look: two annual-leave clauses plus one leave-application rule are hit, while the expense chunks don’t budge — finding by meaning, not by wording, and even hitting across documents.' },
      { t: 'Into the prompt', d: 'The 3 hit chunks’ text, along with their sources, are filled into the prompt template together with the user’s question. To the model, this is just an ordinary “reading comprehension with reference material” — it doesn’t know the vector store exists, it only sees these few passages in the window (Lesson 17).' },
      { t: 'An answer with sources', d: 'The model answers based on the snippets and marks their sources, so you can follow the citation to check the original — the key ability RAG adds over “asking naked.” Next question comes in? Rerun from step ③; the vector store needn’t be rebuilt; and the model has completely forgotten the question you just asked.' },
    ],
    svgAria: 'RAG pipeline demo: chunking documents, embedding into the store, retrieval hits, assembling the prompt, generating an answer with sources',
    demoTitle: '🎛️ Interactive · The Full RAG Pipeline: from documents to a sourced answer',
    demoHint: 'Blue = Handbook · Yellow = Expense Policy · Green = Attendance Rules · Red = user question',
    buildLabel: 'Build the store (offline · done once)',
    vectorDbLabel: 'Vector store · semantic map',
    closerLabel: 'Closer in meaning, closer as points',
    clusterVacation: 'Leave',
    clusterExpense: 'Expense',
    clusterAttendance: 'Attendance',
    qaTitle: 'Q&A (online · run per question)',
    promptLabel: 'prompt sent to the model',
    sysLine1: '[System] You are an HR assistant.',
    sysLine2: 'Answer only from the material below and cite sources;',
    sysLine3: 'if it’s not in the material, say so plainly.',
    retrievedFrag: ['Retrieved snippet ①', 'Retrieved snippet ②', 'Retrieved snippet ③'],
    userQuestionSlot: 'User question',
    userAsks: 'User asks: “How many days of annual leave?”',
    questionText: 'How many days of annual leave?',
    answerLabel: '[Model answer]',
    answerLine1: '1 year of service grants 5 days of annual',
    answerLine2: 'leave, rising to 10 days at 5 years; remember',
    answerLine3: 'to file leave in OA 3 days ahead.',
    answerSrc1: 'Sources: Handbook §2, §3',
    answerSrc2: '　　　Attendance Rules §1',
    nextBtn: 'Next ▸',
    resetBtn: '↺ Reset',
    stepLabel: (step) => `Step ${step} / ${STEPS}`,

    goalsTitle: '🎯 What You’ll Learn',
    goals: [
      <>State the essence of RAG in one sentence: an open-book exam — the model doesn’t memorize your documents, it flips to the right pages on the spot while answering</>,
      <>Break the RAG pipeline into two lines: offline store-building (chunk → embed → index) and online Q&A (retrieve → assemble prompt → generate a sourced answer)</>,
      <>Tally the four accounts of “RAG vs fine-tuning” — knowledge updates, traceability, cost, data security — and see why knowledge injection nearly always picks RAG</>,
      <>Recognize three failure scenes: inaccurate retrieval, chunking that shreds meaning, and the model ignoring its cheat sheet — and understand “how can it still make things up after adding RAG”</>,
    ],

    conceptTitle: '💡 Core Idea: an open-book exam — bring the cheat sheet, but you must find the page',
    conceptLead: 'The last line of the previous lesson was: “Putting the right information into the window beats stuffing all of it in.” This lesson covers the engineering system that automatically finds “the right information” and puts it into the window. First get the motivation straight — when you want AI to answer questions about your own documents, three walls stand in the way:',
    walls: [
      { label: 'Wall 1 · covered in Lesson 12', en: <>Knowledge has a <b>cutoff</b></>, zh: 'Once pre-training ends, the parameters are sealed. The world after the training cutoff — a product launched yesterday, a price changed this morning — is entirely unknown to the model.' },
      { label: 'Wall 2 · the training data doesn’t include you', en: <>Private documents are a <b>blind spot</b></>, zh: 'Your company’s leave policy, project docs, and support scripts never entered the training corpus and simply aren’t in the parameters — no matter how you ask, you can’t get the truth out, only fabrications.' },
      { label: 'Wall 3 · covered in Lesson 17', en: <>The window <b>can’t hold it</b></>, zh: 'Stuff all the documents into the context? Expensive, slow, and key content easily gets lost in the middle — we just did this math last lesson.' },
    ],
    wallsAfter: 'Three walls block the two intuitive paths: “teaching” it into the parameters can’t be done and can’t be afforded; “stuffing” it into the window won’t fit and can’t be read clearly. The mainstream solution takes a third path:',
    contrast: [
      { pill: 'pill-ink', tag: 'Intuitive approach', big: <>Make the AI “learn” my documents <span className="gap">→</span> training is too expensive, and stuffing everything into the window won’t fit</>, note: 'Both paths hit a wall: the parameters can’t be changed (Lesson 12), and the window can’t hold it or read it clearly (Lesson 17).' },
      { pill: 'pill-sage', tag: 'The real mainstream approach', big: <>Keep documents outside the window and <span className="hl">retrieve by question</span> <span className="gap">→</span> only put the few most relevant passages in each time</>, note: 'This is RAG: not one model parameter changes; what changes is only the in-window content fed to it each time.' },
    ],
    ragDefEn: <>RAG = Retrieval-Augmented Generation, <span className="hl">retrieval-augmented generation</span> — use material retrieved (R) to augment (A) the model’s generation (G).</>,
    ragDefZh: <>The most accurate analogy is an <b>open-book exam</b>: closed-book relies on memory (knowledge frozen in the parameters) and is doomed on new questions; open-book lets you bring a whole crate of material into the exam, but the exam is only two hours long — what decides your grade isn’t how much you brought, but <b>whether you can quickly flip to the right page</b>. “Flipping pages” is retrieval, and “organizing an answer from the material” is generation. The whole of RAG engineering, in one sentence: practice flipping through the book.</>,
    alreadyUsed: 'You’ve actually used RAG long ago — the product just didn’t show you the assembly line. Connect the everyday phenomena to the mechanism:',
    matchHead1: ['What you’ve seen in products', 'The same mechanism behind it'],
    matchRows1: [
      { a: <b>Upload a PDF to ChatGPT / Claude and it can answer its content, with page-number citations</b>, b: 'The document is chunked and indexed; each answer only retrieves relevant snippets into the window — a ready-to-use mini RAG' },
      { a: <b>An AI search answer with a row of source links beneath it</b>, b: 'The same pipeline, only “retrieval” swaps the vector store for a search engine — the form of R changed, A and G didn’t' },
      { a: <b>A corporate support bot that knows the return policy changed just last week</b>, b: 'Once the policy doc is updated, rebuilding the index takes effect — the model never moved, the store did' },
      { a: <b>When you ask something too off-topic, it replies “no relevant content found in the material”</b>, b: 'Retrieval missed + the system prompt requires “admit it if you can’t find it” — this honesty is designed in, not the model’s own conscience' },
    ],
    matchAfter: 'But “flip to the right page” is easier said than done: how do you store documents so they can be flipped by “meaning”? Who decides which is “the right page”? Where does it go after being flipped to? The next section takes the whole pipeline apart.',

    conceptSourceNote: (
      <>
        The RAG paradigm was introduced by Facebook AI's Lewis et al. 2020,{' '}
        <a href="https://arxiv.org/abs/2005.11401" target="_blank" rel="noreferrer">
          Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks
        </a>
        .
      </>
    ),
    twoPhaseTitle: '📖 Two stages dissected: build the store first (offline), then answer (online)',
    twoPhaseLead: 'RAG isn’t some new model but a pipeline — two pipelines, to be precise: one offline, run once when building the store; one online, run from scratch on every question. Seen separately, every step is unmysterious.',
    phase1Tag: 'Stage 1 · Build the store (offline, done once)',
    phase1: [
      <><b>Collect documents.</b> Employee handbook, product docs, past tickets… any text will do.<span className="footnote">This step sets the ceiling of the knowledge base: whatever isn’t in the store, no later step can conjure up.</span></>,
      <><b>Chunk.</b> Split long documents into “semantically complete short segments” of a few hundred characters each.<span className="footnote">Why chunk? Because the smallest unit of retrieval is the chunk: too big, and one chunk mixes multiple topics — retrieval grabs the wrong one and burns tokens in the window; too small, and a sentence gets cut up and loses all context. Common practice: split along heading and paragraph boundaries, with an overlap between adjacent chunks.</span></>,
      <><b>Embed.</b> Each chunk is handed to an embedding model and becomes a string of numeric coordinates — Lesson 8’s “meaning → coordinates” goes to work here.<span className="footnote">Chunks close in meaning end up close in coordinates: “annual-leave rules” and “leave application” are neighbors, far from “receipt reimbursement.”</span></>,
      <><b>Store in the vector store.</b> A database built to query by “who’s near whom”; while storing each chunk, it records the source (which document, which section).<span className="footnote">This source metadata is the raw material that lets the final answer “give citations.”</span></>,
    ],
    phase2Tag: 'Stage 2 · Q&A (online, run per question)',
    phase2: [
      <><b>Embed the question.</b> The user’s question is turned into coordinates by the same embedding model.<span className="footnote">It must be the same one — you can’t compare distances between two coordinate systems.</span></>,
      <><b>Nearest-neighbor retrieval.</b> Find the top-k chunks nearest the question in the vector store; k is usually a single digit.<span className="footnote">“Nearest” = most semantically relevant. This is finding by meaning, not by wording — the next section shows its power and its weakness.</span></>,
      <><b>Assemble the prompt.</b> The system prompt (“answer only from the material below, and cite sources”) + the k hit chunks’ text + the user’s question are assembled into one prompt.<span className="footnote">The previous lesson’s motto lands here: what enters the window isn’t the whole store, just these k chunks.</span></>,
      <><b>Generate the answer.</b> The model answers while reading the in-window snippets and cites sources as required.<span className="footnote">To the model, this is just an ordinary “reading comprehension with reference material” — it doesn’t know the vector store exists, and hasn’t “learned” any new knowledge.</span></>,
    ],
    twoPhaseAfter: <>The most crucial point deserves its own underline: <b>the whole pipeline changed none of the model’s parameters.</b> Knowledge is frozen in the parameters (Lesson 12), and only the in-window content can change (Lesson 17) — RAG works fully along these two iron laws. So strictly speaking, RAG “taught” the model nothing; it just gave the model a <b>secretary who’s very good at flipping pages</b>: on every question, the secretary spreads the right pages in front of the model. Two corollaries follow immediately: ① knowledge update = swap documents and rebuild the index, effective in minutes; ② the model forgets right after answering, and the secretary flips the book anew for the next question.</>,

    fineTitle: '📖 Why not just fine-tune? Tally four accounts',
    fineLead: 'There’s always another path that looks more “thorough”: take the company documents and fine-tune (Lesson 13), so the knowledge truly grows into the parameters — solved once and for all, how nice. But on the matter of “knowledge injection,” the engineering world nearly unanimously picks RAG. Lay out the ledger; four rows say it all:',
    fineHead: ['Compare on', 'RAG · external knowledge base', 'Fine-tuning · train knowledge into parameters'],
    fineRows: [
      { be: 'Knowledge update', rag: 'Edit the doc, rebuild the index, effective in minutes — change a policy in the morning, ask in the afternoon and get the new answer', ft: 'Re-prepare data and retrain, days at a minimum; may also “learn the new and forget the old”' },
      { be: 'Traceability', rag: 'Every answer can attach sources; click to check the original', ft: 'Knowledge is dissolved into billions of parameters — no telling which sentence came from where, and no way to reconcile a wrong answer' },
      { be: 'Cost', rag: 'One build + per-query retrieval, orders of magnitude cheaper than training', ft: 'GPUs, data cleaning, hyperparameter tuning, regression testing — a job for a specialist team' },
      { be: 'Data security', rag: 'Documents stay in your own store, and can be retrieved by permission: only those allowed to see it get it retrieved', ft: 'Once data is trained into the parameters it can’t be taken back, can’t be isolated per person, and can even be deliberately “extracted” by probing questions' },
    ],
    fineAfter: <>Note, this doesn’t mean fine-tuning is useless — fine-tuning’s home turf is <b>behavior and style</b>: making the model talk like a support agent, output a fixed format, know the industry’s jargon (Lesson 13’s actual job). The division of labor in one sentence: <b>ask RAG for knowledge and facts, rely on fine-tuning for conduct and manner</b>; mature systems often use both — fine-tuning teaches it “how to answer,” RAG feeds it “what to answer.”</>,

    failTitle: '🔧 An engineer’s view: three failure scenes',
    failLead: 'Everyone can draw RAG on a flowchart; RAG that runs steadily in production is rare — the gap is all in the failure modes. The three failure scenes below are what RAG engineers fix every day:',
    fails: [
      { en: <>Scene 1 · inaccurate retrieval: <span className="hl">the user and the document don’t speak the same language</span>. The user asks “Who do I find to fix my broken computer?”, the document says “For IT equipment faults, report via the ticketing system” — not a single keyword matches.</>, zh: <>Semantic retrieval is born for exactly this: “broken computer” and “equipment fault report” are neighbors in vector space — <b>found by meaning, not by wording</b>. But it isn’t omnipotent — on queries where “wording must be exact,” like product models, names, and numbers, semantic retrieval often loses to keyword search, so mature systems mostly use <b>hybrid retrieval</b> (run semantic and keyword each, then merge and re-rank). Remember this causal chain: <b>if retrieval grabs the wrong page, no matter how strong the model is, it can only answer from the wrong page.</b></> },
      { en: <>Scene 2 · chunking shreds meaning: <span className="hl">a sentence is cut in half</span>. The original reads “10 days annual leave (note: applies only to employees with 5+ years of service),” and chunking happens to break right before the parenthesis — retrieval hits only the first half, and the bot confidently answers “10 days annual leave.”</>, zh: <>The chunk is the smallest unit of retrieval; <b>chunk it wrong and even a deity can’t save what follows</b>. Three common ailments: a sentence cut in half (as above), a qualifying condition split off from the main text, and a table chopped into meaningless fragments. The remedy is plain: split along heading and paragraph boundaries, overlap adjacent chunks, and manually spot-check chunking results on key documents — inelegant, but the highest-ROI work in RAG engineering.</> },
      { en: <>Scene 3 · the model ignores its cheat sheet: <span className="hl">the snippet is right there in the window, yet it makes things up</span>. The snippet plainly says “this product does not support Windows 7,” yet the model enthusiastically answers “It does; the installation method is…”.</>, zh: <>Pre-training’s statistical inertia (Lesson 12) sometimes overrides the facts in the window; when the snippet has no answer, the model also tends to “helpfully make one up” rather than admit it doesn’t know. Remedies: hard-code the system prompt to “answer only from the material; if it’s not there, say so,” require citing sources line by line, and lower the temperature (Lesson 14). But these only lower the probability, <b>not to zero</b> — which is exactly why sources must be clickable for verification.</> },
    ],
    failAfter: <>The three scenes map respectively to three segments of the pipeline: retrieval, chunking, generation — the first step in fixing RAG is always to locate which segment failed. Lesson 28, “RAG in Practice,” walks you through writing code to build a knowledge base by hand, stepping into all three pits one by one and climbing back out.</>,

    demoSecTitle: '🎛️ Interactive Demo: run the RAG pipeline yourself',
    demoSecLead: 'Walk through the whole thing with a concrete scenario: build a knowledge base from three documents — Employee Handbook, Expense Policy, Attendance Rules — then ask “How many days of annual leave?” Keep clicking “Next” and watch how the 6-step pipeline turns a question into a sourced answer — especially note step ④: among the three hit chunks, one comes from another document.',

    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      { bad: 'Adding RAG means the model “learned” my documents', good: 'Not one model parameter changed — it just glanced at a few cheat-sheet pages while answering, and forgets by the next question', why: <><b>Cause:</b> mistaking “answered the document’s content correctly” for “learned it.” All of RAG’s “knowledge” lives in those few snippets that enter the window each time: once the answer ends and the window clears, the model returns to its factory state (Lesson 17: read and forget). An experiment that exposes it: <b>delete the vector store and it instantly “forgets everything”</b> — what truly learns into the parameters doesn’t vanish just because you delete a store.</> },
      { bad: 'With RAG there are no more hallucinations, the answers even come with citations, so I can copy them with peace of mind', good: 'It still makes things up when retrieval hits the wrong page or the snippet is incomplete — the citation mechanism doesn’t eliminate hallucination, it lets you verify', why: <><b>Cause:</b> treating RAG as “hallucination antivirus.” It does lower hallucination — because it gives the model material to copy from — but each of the pipeline’s three segments has its own way of failing: retrieval grabs the wrong page, chunking loses the qualifying condition, the model ignores the cheat sheet and answers from old knowledge. The real value of sources is that they’re <b>verifiable</b>: with a cited answer in hand, following the source to glance at the original always beats blindly trusting any AI — this is the extra seatbelt RAG gives you over fine-tuning; remember to buckle up.</> },
    ],

    bridgeTitle: '➡️ How This Leads to Lesson 19',
    bridgeLead: 'RAG lets the model "read" your own documents, but at heart it\'s still passively reading material and organizing words. If a user asks "what\'s the weather in Beijing today" or "cancel this order" — the answer isn\'t in any document, but in an API or action that must be called in real time, and RAG can\'t help. The next lesson covers Function Calling: teaching the model to reach out and call external tools at the right moment, crossing from "talking" to "doing."',
    bridgeSteps: ['RAG: bolt knowledge onto the model', 'But it only reads & organizes text', 'Some answers need real-time action', 'Next: Function Calling'],
    quizTitle: '✍️ Quick Quiz',
    quiz: [
      { q: '1. The company raised its travel-reimbursement standard today. What must a RAG-based support bot and a bot that fine-tuned the old policy into its parameters each do to answer the new standard correctly? And roughly how long does it take?', a: <><b>RAG:</b> just update the expense-policy document and rebuild (or incrementally update) that document’s index — effective in <b>minutes</b>; the model itself isn’t touched. <b>Fine-tuning:</b> you must re-prepare training data, run another round of training, and do regression testing to prevent “learning the new and forgetting the old” — <b>days at a minimum</b>, and it needs a specialist team. This is exactly the first account of “pick RAG for knowledge injection”: knowledge changes, parameters are hard to change, documents are easy to swap.</> },
      { q: '2. A user asks “Can I bring pets into the office,” the knowledge base clearly has an “Office Premises Rules” saying “animals are prohibited in the office area,” yet the bot answers “no relevant rule found in the material.” Guess the two most likely failing segments, and explain how to investigate.', a: <><b>Segment 1: inaccurate retrieval.</b> Although “pet” and “bring animals” are semantically close, the similarity may still not rank into the top-k, so that chunk never entered the window. Investigate: look at which chunks the retrieval log actually hit, try raising k or switching to hybrid retrieval. <b>Segment 2: chunking shredding.</b> This rule may be chunked together with a lot of unrelated clauses (its meaning diluted), or cut in half. Investigate: directly search the store for chunks containing “animal.” The motto: <b>locate which segment failed first, then fix it</b>.</> },
      { q: '3. A friend says: “I uploaded a 1000-page product manual into the AI’s knowledge-base feature, and now it has learned our product; I just forward its answers straight to customers.” Using this lesson and Lesson 17, point out two dangerous misunderstandings in this sentence.', a: <><b>Misunderstanding 1: “learned.”</b> The model’s parameters didn’t change one bit — each answer just retrieves a few snippets temporarily stuffed into the window, and forgets right after (Lesson 17: what’s outside the window may as well not exist). <b>Misunderstanding 2: “forward straight.”</b> What enters the window each time is only the hit top-k chunks, not the full 1000 pages: retrieval missing, chunking shredding, the model ignoring the cheat sheet — a failure in any segment produces a straight-faced wrong answer. The right posture: require answers to carry sources, and <b>check the original via the citation before forwarding</b>.</> },
    ],
  },
}

function tf(x, y) { return { transform: `translate(${x}px,${y}px)` } }

function RagDemo({ c }) {
  const [step, setStep] = useState(0)

  // 把几何与当前语言文本合并成块/点列表（确定性，渲染前算好）
  const CHUNKS = []
  DOC_GEO.forEach((doc, di) => {
    const docText = c.docs[di]
    doc.chunks.forEach((ch, i) => {
      CHUNKS.push({
        t: docText.chunks[i].t, color: doc.color, hit: !!ch.hit, src: docText.chunks[i].src, dotPos: ch.dot,
        packedY: doc.y + 18 + i * 23, spreadY: doc.y + 22 + i * 28,
        dotFrom: [90, doc.y + 22 + i * 28 + 11],
      })
    })
  })
  const HITS = CHUNKS.filter((ch) => ch.hit)
  const FILLS = HITS.map((h, i) => ({ ...h, home: [496, SLOT_Y[i]], from: h.dot ?? h.dotPos }))
  const docTitleY = DOC_GEO.map((d, i) => ({ name: c.docs[i].name, y: d.y + 10 }))

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.demoTitle}</span>
        <span className="demo-hint">{c.demoHint}</span>
      </div>
      <div className="demo-body stack">
        <div className="demo-stage">
          <div className="demo-stage-col">
            <svg id="rag-svg" viewBox="0 0 720 430" width="700" aria-label={c.svgAria}>
              <text x="16" y="24" fontSize="12" fontWeight="700" fill="var(--fg-0)">{c.buildLabel}</text>
              <rect x="196" y="44" width="264" height="240" rx="14" fill="none" stroke="var(--hairline-strong)" strokeWidth="1.5" strokeDasharray="6 4" />
              <text x="210" y="64" fontSize="11" fontWeight="700" fill="var(--fg-0)">{c.vectorDbLabel}</text>
              <text x="452" y="64" fontSize="9" fill="var(--fg-2)" textAnchor="end">{c.closerLabel}</text>
              <g className="rag-anim" fontSize="9" fill="var(--fg-2)" style={{ opacity: step >= 2 ? 0.85 : 0 }}>
                <text x="380" y="100" textAnchor="middle">{c.clusterVacation}</text>
                <text x="224" y="180" textAnchor="middle">{c.clusterExpense}</text>
                <text x="344" y="224" textAnchor="middle">{c.clusterAttendance}</text>
              </g>
              {/* 命中连线 */}
              <g className="rag-anim" style={{ opacity: step >= 4 ? 1 : 0 }}>
                {HITS.map((h, i) => <line key={i} x1={STAR[0]} y1={STAR[1]} x2={h.dotPos[0]} y2={h.dotPos[1]} stroke="var(--terracotta)" strokeWidth="1.5" strokeDasharray="4 3" />)}
              </g>
              {/* 文档标题 */}
              {docTitleY.map((d, i) => <text key={i} x="16" y={d.y} fontSize="11" fontWeight="700" fill="var(--fg-0)">{d.name}</text>)}
              {/* 块条 */}
              {CHUNKS.map((ch, i) => (
                <g key={i} className={`rag-chunk rag-anim c-${ch.color}${step >= 1 ? ' on' : ''}`} style={tf(16, step >= 1 ? ch.spreadY : ch.packedY)}>
                  <rect x="0" y="0" width="148" height="22" rx="4" />
                  <text x="7" y="15" fontSize="9.5">{ch.t}</text>
                </g>
              ))}
              {/* 向量点 */}
              {CHUNKS.map((ch, i) => {
                const inMap = step >= 2
                const p = inMap ? ch.dotPos : ch.dotFrom
                const op = !inMap ? 0 : step >= 4 && !ch.hit ? 0.3 : 1
                return (
                  <g key={i} className={`rag-dot rag-anim${step >= 4 && ch.hit ? ' hit' : ''}`} style={{ ...tf(p[0], p[1]), opacity: op }}>
                    <circle cx="0" cy="0" r="5" fill={`var(--${ch.color})`} />
                  </g>
                )
              })}
              {/* 用户问题气泡 */}
              <g className="rag-anim" style={{ opacity: step >= 3 ? 1 : 0 }}>
                <rect x="196" y="302" width="264" height="36" rx="10" fill="var(--terracotta-bg)" stroke="var(--terracotta)" strokeWidth="1" />
                <text x="328" y="325" fontSize="12" fontWeight="700" fill="var(--fg-0)" textAnchor="middle">{c.userAsks}</text>
              </g>
              {/* 问题星标 */}
              <g className="rag-anim" style={{ ...tf(...(step >= 4 ? STAR : STAR_HOME)), opacity: step >= 4 ? 1 : step >= 3 ? 0.45 : 0 }}>
                <path d="M0,-7 L7,0 L0,7 L-7,0 Z" fill="var(--terracotta)" />
              </g>
              {/* 在线问答区 */}
              <g className="rag-anim" style={{ opacity: step >= 3 ? 1 : 0.35 }}>
                <text x="488" y="24" fontSize="12" fontWeight="700" fill="var(--fg-0)">{c.qaTitle}</text>
                <rect x="488" y="44" width="218" height="230" rx="12" fill="var(--glass)" stroke="var(--hairline-strong)" strokeWidth="1" />
                <text x="497" y="62" fontSize="11" fontWeight="700" fill="var(--fg-0)">{c.promptLabel}</text>
                <rect x="496" y="70" width="202" height="44" rx="6" fill="var(--amber-bg)" stroke="var(--amber)" strokeWidth="1" />
                <text x="502" y="83" fontSize="9" fontWeight="600" fill="var(--fg-0)">{c.sysLine1}</text>
                <text x="502" y="94" fontSize="9" fill="var(--fg-1)">{c.sysLine2}</text>
                <text x="502" y="105" fontSize="9" fill="var(--fg-1)">{c.sysLine3}</text>
                {/* 空槽位 */}
                {SLOT_Y.map((y, i) => (
                  <g key={i}>
                    <rect x="496" y={y} width="202" height="30" rx="6" fill="none" stroke="var(--hairline-strong)" strokeWidth="1" strokeDasharray="4 3" />
                    <text x="597" y={y + 19} fontSize="9.5" fill="var(--fg-2)" textAnchor="middle" className="rag-anim" style={{ opacity: step >= 5 ? 0 : 1 }}>{c.retrievedFrag[i]}</text>
                  </g>
                ))}
                <rect x="496" y={QSLOT_Y} width="202" height="24" rx="6" fill="none" stroke="var(--hairline-strong)" strokeWidth="1" strokeDasharray="4 3" />
                <text x="597" y={QSLOT_Y + 16} fontSize="9.5" fill="var(--fg-2)" textAnchor="middle" className="rag-anim" style={{ opacity: step >= 5 ? 0 : 1 }}>{c.userQuestionSlot}</text>
              </g>
              {/* 飞入的填充块 */}
              {FILLS.map((f, i) => (
                <g key={i} className="rag-anim" style={{ ...tf(...(step >= 5 ? f.home : f.dotPos)), opacity: step >= 5 ? 1 : 0 }}>
                  <rect x="0" y="0" width="202" height="30" rx="6" fill={`var(--${f.color}-bg)`} stroke={`var(--${f.color})`} strokeWidth="1" />
                  <text x="7" y="13" fontSize="9" fontWeight="600" fill="var(--fg-0)">{f.t}</text>
                  <text x="7" y="25" fontSize="8.5" fill="var(--fg-2)">—— {f.src}</text>
                </g>
              ))}
              <g className="rag-anim" style={{ ...tf(...(step >= 5 ? [496, QSLOT_Y] : STAR_HOME)), opacity: step >= 5 ? 1 : 0 }}>
                <rect x="0" y="0" width="202" height="24" rx="6" fill="var(--terracotta-bg)" stroke="var(--terracotta)" strokeWidth="1" />
                <text x="7" y="16" fontSize="10" fontWeight="700" fill="var(--fg-0)">{c.questionText}</text>
              </g>
              {/* 模型回答 */}
              <g className="rag-anim" style={{ ...tf(0, step >= 6 ? 0 : 10), opacity: step >= 6 ? 1 : 0 }}>
                <rect x="488" y="286" width="218" height="132" rx="10" fill="var(--sage-bg)" stroke="var(--sage)" strokeWidth="1" />
                <text x="500" y="306" fontSize="10.5" fontWeight="700" fill="var(--fg-0)">{c.answerLabel}</text>
                <text x="500" y="324" fontSize="10" fill="var(--fg-0)">{c.answerLine1}</text>
                <text x="500" y="340" fontSize="10" fill="var(--fg-0)">{c.answerLine2}</text>
                <text x="500" y="356" fontSize="10" fill="var(--fg-0)">{c.answerLine3}</text>
                <text x="500" y="382" fontSize="9.5" fill="var(--sky)">{c.answerSrc1}</text>
                <text x="500" y="398" fontSize="9.5" fill="var(--sky)">{c.answerSrc2}</text>
              </g>
            </svg>
            <div className="rag-caption">{c.caps[step]}</div>
          </div>
        </div>
        <div className="demo-side">
          <div className="chips">
            <button className="chip" disabled={step >= STEPS} onClick={() => setStep((s) => Math.min(STEPS, s + 1))}>{c.nextBtn}</button>
            <button className="chip" onClick={() => setStep(0)}>{c.resetBtn}</button>
            <span className="footnote" style={{ alignSelf: 'center' }}>{c.stepLabel(step)}</span>
          </div>
          <h4 style={{ marginTop: 14 }}>{c.info[step].t}</h4>
          <p>{c.info[step].d}</p>
        </div>
      </div>
    </div>
  )
}

export default function L18() {
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

      <Lsec title={c.conceptTitle} lead={c.conceptLead}>
        <div className="use-grid">
          {c.walls.map((w, i) => (
            <div className="card use-card" key={i}><div className="label">{w.label}</div><div className="en">{w.en}</div><div className="zh">{w.zh}</div></div>
          ))}
        </div>
        <p className="lead mt14">{c.wallsAfter}</p>
        <div className="contrast">
          {c.contrast.map((ct, i) => (
            <div className="card contrast-card" key={i}>
              <div className="tag"><span className={`pill ${ct.pill}`}>{ct.tag}</span></div>
              <div className="big">{ct.big}</div>
              <p className="note">{ct.note}</p>
            </div>
          ))}
        </div>
        <div className="example mt14">
          <div className="en">{c.ragDefEn}</div>
          <div className="zh">{c.ragDefZh}</div>
        </div>
        <p className="lead mt14">{c.alreadyUsed}</p>
        <div className="card">
          <table className="match">
            <thead><tr><th>{c.matchHead1[0]}</th><th>{c.matchHead1[1]}</th></tr></thead>
            <tbody>
              {c.matchRows1.map((r, i) => (
                <tr key={i}><td>{r.a}</td><td className="ex">{r.b}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="lead mt14">{c.matchAfter}</p>
        <p className="footnote source-note">{c.conceptSourceNote}</p>
      </Lsec>

      <Lsec title={c.twoPhaseTitle} lead={c.twoPhaseLead}>
        <div className="card flow-card">
          <div className="phase-tag"><span className="pill pill-amber">{c.phase1Tag}</span></div>
          <div className="flow">
            {c.phase1.map((s, i) => (
              <div className="flow-step" key={i}><span className="num">{i + 1}</span><span className="txt">{s}</span></div>
            ))}
          </div>
        </div>
        <div className="card flow-card mt14">
          <div className="phase-tag"><span className="pill pill-sky">{c.phase2Tag}</span></div>
          <div className="flow">
            {c.phase2.map((s, i) => (
              <div className="flow-step" key={i}><span className="num">{i + 1}</span><span className="txt">{s}</span></div>
            ))}
          </div>
        </div>
        <p className="lead mt14">{c.twoPhaseAfter}</p>
      </Lsec>

      <Lsec title={c.fineTitle} lead={c.fineLead}>
        <div className="card">
          <table className="match">
            <thead><tr><th>{c.fineHead[0]}</th><th>{c.fineHead[1]}</th><th>{c.fineHead[2]}</th></tr></thead>
            <tbody>
              {c.fineRows.map((r, i) => (
                <tr key={i}><td className="be">{r.be}</td><td className="ex">{r.rag}</td><td className="ex">{r.ft}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="lead mt14">{c.fineAfter}</p>
      </Lsec>

      <Lsec title={c.failTitle} lead={c.failLead}>
        {c.fails.map((f, i) => (
          <div className="example" key={i}>
            <div className="en">{f.en}</div>
            <div className="zh">{f.zh}</div>
          </div>
        ))}
        <p className="lead mt14">{c.failAfter}</p>
      </Lsec>

      <Lsec title={c.demoSecTitle} lead={c.demoSecLead}>
        <RagDemo c={c} />
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
