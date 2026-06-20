import { useEffect, useRef, useState } from 'react'
import { Lsec, QuizItem } from '../components/ui.jsx'
import { useLang } from '../i18n/LangContext.jsx'

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ============================================================
// 双语内容层：结构 / class / id / SVG 几何 / 交互 / 数值均不变，仅文本按语言取用。
// 演示脚本 SCRIPT 的 seq、节拍键（think/act/obs/ref/done）等标识符保持原样，
// 与动画一一对应；只翻译讲解性可见文本（cap / t / d / lines 文案）。
// ============================================================
const C = {
  zh: {
    // ---- Agent 循环步进演示脚本 ----
    SCRIPT: [
      { cap: '① 感知与规划：把大目标拆成子任务清单', t: '第 1 轮 · 规划也是接龙出来的',
        d: '“拆成三个子任务”看着像深思熟虑，其实就是一次普通的文本生成（第 16 课思维链的近亲）。计划写进上下文，立刻变成后面每一轮都会读到的路标。', seq: ['think', 'act', 'observe'],
        lines: [['think', '目标：「调研三款降噪耳机并给出购买建议」。拆成三个子任务：① 找出当前口碑前三的型号 ② 逐一收集价格与评测要点 ③ 汇总对比写建议。先做 ①。'], ['act', 'search("降噪耳机 口碑排行 评测")', true], ['obs', '多篇文章反复点名三款：A 牌旗舰款、B 牌轻巧款、C 牌性价比款。子任务 ① 完成 ✓']] },
      { cap: '标准一轮：思考 → 行动 → 观察，足迹 +3 条', t: '第 2 轮 · 标准节拍',
        d: '思考 → 开申请单（第 19 课原封不动）→ 宿主执行 → 结果回填。注意日志里的“要点入笔记”：工作记忆在累积 —— 这就是四件套里的“工作台”（第 17 课）。', seq: ['think', 'act', 'observe'],
        lines: [['think', '进入子任务 ②，先查 A 牌旗舰款 —— 需要价格档位、降噪、佩戴、续航四项要点。'], ['act', 'open_page("A牌旗舰款深度评测.html")', true], ['obs', '页面读取成功。要点入笔记：降噪最强、佩戴舒适、约两千元档；短板是机身偏重。']] },
      { cap: '观察到失败：404 —— 失败信息也会回填上下文', t: '第 3 轮 · 现实开始反击',
        d: '404 了。这正是循环必须存在的理由：页面打不打得开，是“走到这一步才知道”的信息，事先写好的完美计划料不到。失败结果照样回填进上下文 —— 关键看它下一轮怎么办。', seq: ['think', 'act', 'observe'],
        lines: [['think', '如法炮制，查 B 牌轻巧款的评测页。'], ['act', 'open_page("B牌轻巧款评测.html")', true], ['obs', '请求失败：404，页面不存在。这条路走不通。', false, true]] },
      { cap: '反思修正：读着失败足迹，换一条路再来', t: '第 4 轮 · 反思修正（本剧高光）',
        d: '失败记录躺在上下文里，模型读着自己的失败足迹，生成了新策略 —— 换搜索词绕路，全程无人介入。这就是“上一轮的输出成为下一轮的输入”最值钱的一幕：报错也是养料。', seq: ['reflect', 'act', 'observe'],
        lines: [['ref', '上一轮失败 —— 别再撞同一堵墙。换策略：不开具体页面，改用搜索词直接要结论。'], ['act', 'search("B牌轻巧款 降噪耳机 评测 优缺点")', true], ['obs', '搜索摘要给出要点：降噪接近 A、重量轻不少、约一千五百元档；短板是续航一般。进度 2/3。']] },
      { cap: '上一轮的成功策略被继承 —— 足迹在发挥作用', t: '第 5 轮 · 经验被继承',
        d: '注意措辞：“沿用刚验证过的策略”。第 4 轮的成功经验也留在足迹里，影响了这一轮的选择 —— agent 在任务内是会“长记性”的。但只在本次上下文内有效，关窗即忘（第 17 课）。', seq: ['think', 'act', 'observe'],
        lines: [['think', '还差 C 牌性价比款。沿用刚验证过的搜索词策略，更稳。'], ['act', 'search("C牌性价比款 降噪耳机 评测")', true], ['obs', '要点：降噪弱一档、几百元档，通勤场景够用。子任务 ② 完成（3/3）✓']] },
      { cap: '交付前自查：可验证的中间产物', t: '第 6 轮 · 自查 = 可验证的中间产物',
        d: '交付前先核对清单 —— 这就是上一节的解法三：让中间成果可检查，错误当场拦截，而不是带病冲到终点。很多 agent 框架会把“自查”固定写进流程里。', seq: ['think', 'act', 'observe'],
        lines: [['think', '进入子任务 ③。先自查：三款 × 四项要点（价格 / 降噪 / 佩戴 / 续航）的笔记是否齐全？'], ['act', 'read_notes() → 逐格核对清单', true], ['obs', '12 格信息全部在位，无缺漏 —— 可以写结论了。']] },
      { cap: '判断目标达成 → 退出循环，任务结束 ✓', t: '第 7 轮 · 判断完成，退出循环',
        d: '“目标达成”同样是模型生成的一个判断 —— 它也可能判错，所以成熟产品常在这里设人工验收。循环退出，球回到你手里。复盘这一生：7 轮、5 次工具调用、1 次失败重试。', seq: ['think', 'act', 'observe', 'done'],
        lines: [['think', '信息齐全，目标可以收口：生成购买建议，结束任务。'], ['act', '不再调用工具 —— 直接生成最终回答（这一步就是普通的文本生成）'], ['obs', '建议已交付：预算充足选 A（降噪最强）/ 通勤优先选 B（轻便均衡）/ 预算有限选 C（够用就好）。目标达成 → 退出循环 ✓']] },
    ],
    CAP0: '目标已写进上下文，工具清单已就位 —— 等待第一轮心跳',
    INFO0: { t: '开局：目标进场', d: '此刻“目标”只是一段写进上下文的文字。宿主还把工具清单（search / open_page / read_notes）一并发给了模型（第 19 课）。接下来的每一轮，都是同一台接龙机器在读上下文、续写下一段 —— 点「下一轮」开始。' },
    TAG: { think: ['lt-think', '思考'], act: ['lt-act', '行动'], obs: ['lt-obs', '观察'], ref: ['lt-ref', '反思'] },
    AG_NODES_T: {
      goal: { t: '🎯 目标', sub: '一段 prompt 文字' },
      think: { t: '🧠 思考 / 规划', sub: '下一步干什么？' },
      done: { t: '✓ 完成', sub: '交付最终答案' },
      act: { t: '🔧 行动 · 调工具', sub: '开申请单 → 宿主执行' },
      reflect: { t: '🔄 反思修正', sub: '成了吗？要换路吗？' },
      observe: { t: '👀 观察结果', sub: '结果回填上下文' },
    },
    // ---- 演示组件 UI ----
    demoTitle: '🎛️ 交互演示 · Agent 循环：调研降噪耳机的 7 轮心跳',
    demoHint: '蓝 = 思考 · 黄 = 行动 · 绿 = 观察 · 红 = 反思',
    svgAria: 'Agent 循环图：思考、行动、观察、反思之间循环，目标达成则退出',
    arrLabel: '目标达成 → 退出循环',
    roundDash: '—',
    roundN: (n) => `第 ${n} 轮`,
    inAndOut1: '上一轮的输出',
    inAndOut2: '= 下一轮的输入',
    logEmpty: '（足迹日志为空 —— agent 还没开始干活）',
    logRound: (n) => `第 ${n} 轮`,
    btnNext: '下一轮 ▸',
    btnReset: '↺ 重置',
    progress: (step, total) => `第 ${step} / ${total} 轮`,
    // ---- 你将学会 ----
    goalsTitle: '🎯 你将学会',
    goals: [
      <>一句话分清 Chatbot 和 Agent：一个“一问一答”，一个“给定目标，自主走完多步”—— 判断标准是球在谁手里</>,
      <>记住四件套：Agent = LLM（大脑）+ 工具（手脚）+ 循环（心跳）+ 记忆（工作台），每一件都来自前几课的旧零件</>,
      <>看懂循环的六拍，以及全课最重要的洞察：上一步的输出就是下一步的输入 —— 模型在自己的足迹上持续决策</>,
      <>诚实评估可靠性：明白错误为什么连乘累积，认得死循环 / 跑偏 / 成本爆炸三种死法，记住人机协作三件套解法</>,
    ],
    // ---- 核心概念 ----
    conceptTitle: '💡 核心概念：把“申请单回合”装进循环里',
    conceptLead: '先盘点前四课攒齐的零件：第 16 课你学会指挥模型，第 17 课摸清它的记忆边界，第 18 课给它外挂资料，第 19 课它学会开工具申请单。但这些场景有个共同点：每个回合都由你发起，答完一轮，球就回到你手里。哪怕模型再强，这种“一问一答”的形态都叫 Chatbot。Agent（智能体）改变的正是这一点 ——',
    contrastTag1: '直觉印象',
    contrastBig1: <>Agent 就是一个<span className="gap">更聪明的</span>聊天机器人</>,
    contrastNote1: '好像只要模型足够强，聊着聊着它就“升级”成了 agent。',
    contrastTag2: '真实机制',
    contrastBig2: <>Agent 是把大模型<span className="hl">装进循环里</span>：给定目标后，它自主规划、调工具、看结果、再决策，干完才把球还给你</>,
    contrastNote2: '模型本身可以一模一样 —— 差别在外面那圈架构：循环、工具、记忆。',
    exampleEn: <>最贴切的画面是<span className="hl">给实习生派活</span>：你说“调研一下竞品，周五给我报告”—— 他不会每查完一个网页就跑来问“下一步干嘛”，而是自己列提纲、自己搜资料，链接挂了自己换关键词，实在卡死才来找你。</>,
    exampleZh: <>Chatbot 是“事事请示”的协作方式，Agent 是“给目标、交结果”的协作方式。注意：变化的未必是大脑的聪明程度 —— 是<b>协作方式</b>变了。</>,
    fourLead: <>拆开任何一个 agent —— 无论产品包装得多炫 —— 里面都是同一副<b>四件套</b>，而且每一件你都在前面的课里见过：</>,
    fourCards: [
      { label: '大脑 · 第 10–14 课', term: <><b>LLM</b> 大模型</>, body: <>唯一会“想”的零件。规划、选工具、读结果、做判断 —— 全是这台接龙机器在生成文本。</> },
      { label: '手脚 · 第 19 课', term: <><b>工具</b></>, body: <>搜索、读网页、跑代码、写文件。仍是“模型开申请单、宿主真执行”那一套，一字未改。</> },
      { label: '心跳 · 本课主角', term: <><b>循环</b></>, body: <>宿主程序里一个朴素的 while：任务没完成，就把最新结果喂回去、再跑一轮。“自主”全靠它续命。</> },
      { label: '工作台 · 第 17 课', term: <><b>记忆</b></>, body: <>上下文窗口摆着目标、计划和每轮足迹；长任务还要外挂笔记和摘要，防止工作台被堆满。</> },
    ],
    tableLead: '一张表把两种形态钉死 —— 顺便认认市面上的真实产品：',
    matchTh: ['维度', 'Chatbot · 一问一答', 'Agent · 给定目标自主多步'],
    matchRows: [
      ['交互方式', '你发球它接球，答完一句回合即结束', '你只给目标，它连续打完整局再交付'],
      ['一次任务的步数', '1 步：生成一段回答', '几步到几百步：规划、调工具、看结果、再决策'],
      ['出错的代价', '错了你当场看见，下一句就能纠正', '错误发生在中间步骤，会被后续步骤继承、放大（下文细讲）'],
      ['典型产品', 'ChatGPT / Claude 的网页对话', 'Claude Code（自主写代码）、Deep Research（自主调研）、Manus 类通用 agent'],
    ],
    tableFootnote: '提醒：agent 产品的格局变化极快 —— 表里点名的产品请当“形态代表”看，别当排行榜；具体能力以各家官网为准。',
    // ---- 循环拆解 ----
    flowTitle: '📖 循环拆解：六拍心跳，一轮接一轮',
    flowLead: '把“循环”放大到帧。每一轮心跳有六拍 —— 前两拍主要在开局走，后四拍周而复始：',
    flowSteps: [
      <><b>感知任务。</b>读懂目标，盘点手头有哪些工具 —— 工具清单就躺在上下文里（第 19 课）。<span className="footnote">“目标”对模型而言只是窗口顶部的一段文字。记住这个事实，误区一会用到它。</span></>,
      <><b>规划拆步。</b>把大目标拆成子任务清单：“先搜型号 → 再逐一查评测 → 最后汇总写建议”。<span className="footnote">计划本身就是接龙生成的一段文字（第 16 课思维链的近亲）—— 写出来后，它就成了后续每轮都会读到的路标。</span></>,
      <><b>行动（调用工具）。</b>从计划里取下一步，开一张工具申请单，宿主真正执行。<span className="footnote">第 19 课整套机制原封不动：模型从不亲手执行任何东西 —— agent 没有改变这条铁律，只是开单更频繁了。</span></>,
      <><b>观察结果。</b>执行结果回填上下文 —— 对模型来说，只是“窗里多了一段文字”。<span className="footnote">成功的结果是养料，失败的报错同样是养料 —— 演示里你会亲眼看到一次 404 如何变成转机。</span></>,
      <><b>反思修正。</b>符合预期吗？计划要不要改？这条路不通换哪条？<span className="footnote">“反思”听着玄，落地仍是生成文本：模型读着自己的足迹，续写一段自我评估。</span></>,
      <><b>循环或退出。</b>没完成 → 回到第 3 拍；完成 → 交付答案；反复碰壁 → 放弃并向人汇报。<span className="footnote">注意：判断“完没完成”也是模型生成的，它可能误判 —— 所以成熟产品常在这里设人工验收（下一节细讲）。</span></>,
    ],
    flowKey: <><b>全课最重要的一句话：上一拍的输出，就是下一拍的输入。</b>Agent 并没有长出新器官 —— 每一轮做决策的，仍是你在第 12–14 课认识的那台接龙机器：读上下文、续写下一段。唯一的变化是上下文里装的东西：不再只有你的问题，而是它自己一路留下的<b>足迹</b> —— 计划、申请单、工具结果、报错、反思。<b>模型在自己的足迹上持续决策。</b>这句话立刻解锁两个推论：① 足迹越走越长，窗口越来越挤（第 17 课）—— 长任务必须做记忆管理，否则开头的目标会被挤出窗外，agent 当场“忘了自己是谁”；② 足迹里一旦混进一个错误，后面每一轮都会把它当真去读 —— 这是下一节“错误连乘”的种子。</>,
    flowWhy: <><b>为什么非循环不可？</b>因为多步任务的关键信息是“走到那一步才出现”的。调研耳机：不先搜一次，不知道该查哪三款；不点开链接，不知道页面早已 404。再聪明的模型也无法在第 0 秒写出一份永不需要修改的完美计划 —— 计划赶不上变化时，唯一的办法是走一步、看一步、改一步。单次生成给不了“看一步”的机会，循环可以。</>,
    flowConnect: '把你围观 agent 干活时见过的现象，和循环的节拍连上线：',
    flowMatchTh: ['你在产品里见过的现象', '循环里的哪一拍'],
    flowMatchRows: [
      [<><b>Deep Research 一跑十几分钟，提示“已阅读 14 个来源”</b></>, '循环跑到了第 N 轮 —— 每个来源都是一次完整的“行动 → 观察”'],
      [<><b>Claude Code 改完代码自己跑测试，测试红了又接着改</b></>, '跑测试 = 行动；报错信息 = 观察；“我哪里改错了” = 反思 —— 一轮没过就再来一轮'],
      [<><b>屏幕上一行行滚过“正在思考… 正在调用工具…”</b></>, '那不是装饰动画，是循环每一拍的实时日志 —— 产品把心跳播给你看'],
      [<><b>它跑到一半，你插一句“预算改成一千以内”，它真的会调整</b></>, '你的话也成了上下文里的新足迹 —— 下一轮决策时被一并读到'],
    ],
    // ---- 可靠性瓶颈 ----
    relTitle: '📖 可靠性瓶颈：连乘的暴政',
    relLead: '到这里 agent 听起来近乎完美：会规划、会动手、还会自我纠错。是时候泼冷水了 —— 这一节是全课最诚实的部分，也是你判断“agent 新闻是突破还是吹牛”的手感来源。',
    relPara1: <>病根埋在第 14 课：模型的每一次输出都是概率采样，单步再准也只是“大概率对”。聊天里这无所谓 —— 错了你看得见，下一句就纠正。但 agent 把几十步串成一条链，<b>每一步都踩在上一步的输出上</b>，麻烦就来了：错误不是平均分摊的，而是<b>连乘累积</b>的。假设 agent 每走一步都有九成五的把握做对，看看连续走下去，“全程一步不错”的把握还剩多少：</>,
    relMatchTh: ['连续步数', '全程不出错的把握', '体感'],
    relMatchRows: [
      ['1 步', '约 95%', '很稳'],
      ['5 步', '约 77%', '开始心虚'],
      ['10 步', '约 60%', '将将过半'],
      ['20 步', '约 36%', '大概率中途已出错'],
      ['50 步', '约 8%', '几乎必然翻车'],
    ],
    relFootnote: '这只是个示意模型 —— 真实任务里各步难度不同，有些错误还能被反思救回来。但量级感是对的：链路越长，“全程顺利”越接近抽奖。',
    relDeathLead: '错误累积之外，工程上还有三种常见死法 —— 每一种都在真实产品里反复上演：',
    relDeaths: [
      { label: '死法一', term: <><b>死循环</b></>, body: <>同一个失败动作反复重试 —— 像游戏 NPC 卡在墙角原地踏步。烧着 token、产出为零；不设轮数上限，能一直卡到天亮。</> },
      { label: '死法二', term: <><b>跑偏</b></>, body: <>第 3 轮一个小误读（把“降噪耳机”看成“降噪音箱”），被后面十几轮当成既定事实继承 —— 越走越远，交付时已不知所云。</> },
      { label: '死法三', term: <><b>成本爆炸</b></>, body: <>每一轮都要把越滚越长的足迹整个重读一遍（第 17 课，按 token 计费）。轮数 × 足迹长度，账单飙升的速度远超直觉。</> },
    ],
    relFixLead: <>当前工程界的三件套解法 —— 共同思路只有一个：<b>别让错误活过一轮，别让链条长到失控</b>：</>,
    relFixes: [
      { label: '解法一 · 人把关', term: <>关键节点<b>人工确认</b></>, body: <>业内叫 human-in-the-loop：删文件、花钱、对外发送 —— 这些动作必须停下来等人签字。第 19 课的安全铁律，在 agent 里因步数变多而加倍重要。</> },
      { label: '解法二 · 链条切短', term: <><b>子任务拆分</b></>, body: <>把 20 步长链切成几段 5 步短链，每段结束交付一个人能快速检查的小成果。连乘的链条越短，活下来的概率越高 —— 算术如此，没有魔法。</> },
      { label: '解法三 · 当场验货', term: <>可验证的<b>中间产物</b></>, body: <>让每一步产出“机器或人能立刻核对”的东西：写代码就跑测试，做调研就留来源链接。错误当场拦截，而不是带病再跑十几轮。</> },
    ],
    relWhyCode: <>这也顺手回答了一个现象级问题：<b>为什么写代码的 agent 最先成熟？</b>因为代码天生自带免费的验证器 —— 编译器和测试。每一轮“观察”拿到的都是客观硬信号，错误活不过一轮就被发现；改错了还能一键回滚。而“全自动炒股”“全自动谈判”这类任务，反馈慢、噪声大、错误不可逆 —— 连乘衰减无人拦截。一条好用的经验法则：<b>结果越容易被便宜地验证、错误越可逆的领域，agent 越早能用。</b>下次看 agent 新品发布，先问这两个问题，比看 demo 视频靠谱。</>,
    // ---- 交互演示 ----
    relSourceNote: (
      <>
        “思考 + 行动”交替的循环范式见 Yao 等 2022{' '}
        <a href="https://arxiv.org/abs/2210.03629" target="_blank" rel="noreferrer">
          ReAct
        </a>
        ；“读着失败足迹自我反思再重试”的代表工作是 Shinn 等 2023{' '}
        <a href="https://arxiv.org/abs/2303.11366" target="_blank" rel="noreferrer">
          Reflexion
        </a>
        。
      </>
    ),
    demoSecTitle: '🎛️ 交互演示：围观一个 agent 的一生',
    demoSecLead: '任务剧本：「调研三款降噪耳机并给出购买建议」。上方是循环图，下方是 agent 的足迹日志 —— 每点一次「下一轮」，循环图点亮对应节拍，日志追加这一轮的思考 / 行动 / 观察。盯紧第 3、4 轮：一次 404 失败，和一次教科书式的反思绕路。',
    // ---- 常见误区 ----
    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      {
        bad: 'Agent 有自主意识 —— 它“想要”完成目标，失败了还“不甘心”地重试',
        good: '“目标”只是你写进 prompt 的一段文字，“不达目的不罢休”是程序里写死的 while 循环',
        why: <><b>病因：</b>围观 agent 连续干活十几分钟、碰壁后还会换路重试，实在太像“有意志”了。两个拆穿它的实验：① 把 prompt 里的目标换成任意别的字符串，它对新目标同样“执着”，毫无偏好；② 让宿主程序不再把结果回填回去（拔掉循环），“意志”当场消失，它退化成普通的一问一答。执着是<b>架构的属性</b>，不是心灵的属性 —— 欲望写在你的 prompt 里，毅力写在工程师的 while 里。</>,
      },
      {
        bad: 'Agent 已经能全自动替代人类工作了',
        good: '长链路成功率连乘衰减，目前最稳的形态是人机协作：AI 跑短链，人把关节点',
        why: <><b>病因：</b>你刷到的 agent 演示视频，都是从无数次运行里挑出的成功案例剪的 —— 失败的那些不会出现在你的时间线上。真实工程里，长任务依旧会死循环、跑偏、烧预算，所以成熟产品全都保留着人工确认闸（Claude Code 每次删文件、跑命令都要先问你，就是明证）。当下最能打的用法不是“全自动”，而是把 agent 当一个不知疲倦的实习生：你定方向、切任务、验收中间产物 —— 它出手速，你出判断。</>,
      },
    ],
    // ---- 小练习 ----
    bridgeTitle: '➡️ 下一课怎么接上',
    bridgeLead: '到这里，“应用篇”收官：从写提示词、外挂知识、调用工具，到把它们串成自主干活的 agent，你已经能把一个大模型真正“用起来”。但前 20 课的主角始终是文字。从下一阶段“前沿篇”起，AI 冲出文本的边界 —— 第一站是文生图：从一张纯噪点出发，一步步“去噪”成一幅画。扩散模型背后那个反直觉的原理，正是 Stable Diffusion、Midjourney 的引擎。',
    bridgeSteps: ['应用篇收官', '已能把模型用起来', '冲出文字的边界', '下一课：扩散模型文生图'],
    quizTitle: '✍️ 小练习',
    quiz: [
      {
        q: '1. 朋友说：“我把聊天机器人接上了搜索工具，它现在算 agent 了吧？”用本课的四件套和“球在谁手里”标准，判断它还缺什么。',
        a: <>对照四件套：有<b>大脑</b>（LLM）、有<b>手脚</b>（一个搜索工具）—— 但如果它仍是“你问一句、它搜一次、答完即止”，那就缺<b>循环</b>（自己决定下一步、连续跑多轮）和真正被用起来的<b>记忆</b>（在足迹上持续决策）。判断标准一句话：<b>球在谁手里</b> —— 每一步都要你发起，它就还是“带工具的 Chatbot”；你只给目标、它自己走完全程，才是 agent。</>,
      },
      {
        q: '2. 你让 agent 整理“近五年新能源车销量数据”，发现它跑到第 15 轮还在反复访问同一个打不开的网站。诊断这是哪种死法，并用本课的三件套解法各开一条整改方案。',
        a: <><b>诊断：死循环</b> —— 同一个失败动作反复重试，token 在烧、产出为零。<b>整改：</b>① <b>人工确认</b>：设轮数上限 + 连续失败若干次即暂停上报，让人来拍板换路；② <b>子任务拆分</b>：把“近五年”切成按年份的五段短任务，每段单独跑、单独验收；③ <b>可验证中间产物</b>：要求每段先交付一张带来源链接的小表格 —— 数据真假、链接通不通，人和程序都能当场核对。</>,
      },
      {
        q: '3. 为什么“AI 写代码”的 agent 比“AI 全自动炒股”的 agent 先成熟？用“可验证的中间产物”和“错误连乘”两个概念解释。',
        a: <>代码领域每一步都有<b>便宜又客观的验证器</b>：编译器、测试、报错信息 —— “观察”这一拍拿到的是硬信号，错误活不过一轮就被发现，相当于把每步成功率拉高、把连乘的链条切短；而且改错了能一键回滚，错误<b>可逆</b>。炒股则相反：反馈慢、噪声大、错误不可逆 —— 连乘衰减一路无人拦截。经验法则：<b>验证越便宜、错误越可逆的领域，agent 越早成熟。</b></>,
      },
    ],
  },

  en: {
    // ---- Agent loop step-through demo script ----
    SCRIPT: [
      { cap: '① Perceive & plan: break the big goal into a subtask checklist', t: 'Round 1 · Planning is also just autocompletion',
        d: '"Split it into three subtasks" looks like careful deliberation, but it\'s really just an ordinary text generation (a close cousin of Lesson 16\'s chain-of-thought). The plan gets written into the context and instantly becomes a signpost that every later round will read.', seq: ['think', 'act', 'observe'],
        lines: [['think', 'Goal: "Research three noise-cancelling headphones and give a buying recommendation." Split into three subtasks: ① find the top three best-reviewed models ② collect price and review points for each ③ summarize, compare, and write the recommendation. Start with ①.'], ['act', 'search("noise-cancelling headphones top reviews ranking")', true], ['obs', 'Multiple articles repeatedly name three models: Brand A flagship, Brand B lightweight, Brand C value pick. Subtask ① done ✓']] },
      { cap: 'A standard round: think → act → observe, footprint +3 lines', t: 'Round 2 · The standard beat',
        d: 'Think → file a request slip (Lesson 19, unchanged) → host executes → result written back. Note "key points into notes" in the log: working memory is accumulating — this is the "workbench" of the four-piece set (Lesson 17).', seq: ['think', 'act', 'observe'],
        lines: [['think', 'Enter subtask ②, check the Brand A flagship first — need four points: price tier, noise cancelling, comfort, battery life.'], ['act', 'open_page("BrandA_flagship_deep_review.html")', true], ['obs', 'Page read successfully. Key points into notes: strongest noise cancelling, comfortable fit, around the 2000-yuan tier; the weak spot is a heavy body.']] },
      { cap: 'Observe a failure: 404 — failure info also gets written back to context', t: 'Round 3 · Reality starts fighting back',
        d: 'A 404. This is exactly why the loop has to exist: whether a page opens is information you "only find out once you get there," and a perfect plan written in advance couldn\'t foresee it. The failed result is written back into the context all the same — what matters is what it does next round.', seq: ['think', 'act', 'observe'],
        lines: [['think', 'Repeat the same move, check the Brand B lightweight review page.'], ['act', 'open_page("BrandB_lightweight_review.html")', true], ['obs', 'Request failed: 404, page does not exist. This path is a dead end.', false, true]] },
      { cap: 'Reflect and correct: reading the failed footprint, take a different path', t: 'Round 4 · Reflect and correct (the highlight of the show)',
        d: 'The failure record sits in the context; the model reads its own failed footprint and generates a new strategy — swap the search query and route around it, with no human in the loop. This is the most valuable moment of "the previous round\'s output becomes the next round\'s input": even an error is nourishment.', seq: ['reflect', 'act', 'observe'],
        lines: [['ref', 'Last round failed — don\'t bang into the same wall again. New strategy: don\'t open a specific page; use a search query to get the conclusion directly.'], ['act', 'search("Brand B lightweight noise-cancelling headphones review pros cons")', true], ['obs', 'The search summary gives the key points: noise cancelling close to A, noticeably lighter, around the 1500-yuan tier; the weak spot is mediocre battery life. Progress 2/3.']] },
      { cap: 'The previous round\'s successful strategy is inherited — the footprint is at work', t: 'Round 5 · Experience gets inherited',
        d: 'Note the wording: "reuse the strategy I just validated." The success from Round 4 also stays in the footprint and shaped the choice this round — within a task, the agent does "remember." But it only holds within this context; close the window and it forgets (Lesson 17).', seq: ['think', 'act', 'observe'],
        lines: [['think', 'Still missing the Brand C value pick. Reuse the search-query strategy I just validated — it\'s more reliable.'], ['act', 'search("Brand C value pick noise-cancelling headphones review")', true], ['obs', 'Key points: noise cancelling a notch weaker, the hundreds-of-yuan tier, good enough for commuting. Subtask ② done (3/3) ✓']] },
      { cap: 'Self-check before delivery: a verifiable intermediate product', t: 'Round 6 · Self-check = a verifiable intermediate product',
        d: 'Check the list before delivering — this is Solution Three from the previous section: make intermediate results checkable, catch errors on the spot, instead of sprinting to the finish carrying a defect. Many agent frameworks bake "self-check" right into the workflow.', seq: ['think', 'act', 'observe'],
        lines: [['think', 'Enter subtask ③. Self-check first: are the notes for three models × four points (price / noise cancelling / fit / battery) all complete?'], ['act', 'read_notes() → check the list cell by cell', true], ['obs', 'All 12 cells of information are in place, nothing missing — time to write the conclusion.']] },
      { cap: 'Judge the goal as met → exit the loop, task finished ✓', t: 'Round 7 · Judge it done, exit the loop',
        d: '"Goal met" is likewise a judgment the model generates — and it can misjudge, which is why mature products often put a human sign-off here. The loop exits, and the ball is back in your court. Reviewing this whole life: 7 rounds, 5 tool calls, 1 failed retry.', seq: ['think', 'act', 'observe', 'done'],
        lines: [['think', 'Information is complete, the goal can be wrapped up: generate the buying recommendation, end the task.'], ['act', 'No more tool calls — generate the final answer directly (this step is just ordinary text generation)'], ['obs', 'Recommendation delivered: ample budget pick A (strongest noise cancelling) / commuting first pick B (light and balanced) / tight budget pick C (good enough). Goal met → exit the loop ✓']] },
    ],
    CAP0: 'The goal is written into the context, the tool list is ready — waiting for the first heartbeat',
    INFO0: { t: 'Opening: the goal enters', d: 'Right now the "goal" is just a piece of text written into the context. The host also sent the tool list (search / open_page / read_notes) to the model along with it (Lesson 19). Every round that follows is the same autocompletion machine reading the context and writing the next segment — click "Next round" to begin.' },
    TAG: { think: ['lt-think', 'Think'], act: ['lt-act', 'Act'], obs: ['lt-obs', 'Observe'], ref: ['lt-ref', 'Reflect'] },
    AG_NODES_T: {
      goal: { t: '🎯 Goal', sub: 'a piece of prompt text' },
      think: { t: '🧠 Think / Plan', sub: 'what to do next?' },
      done: { t: '✓ Done', sub: 'deliver the final answer' },
      act: { t: '🔧 Act · call a tool', sub: 'file slip → host executes' },
      reflect: { t: '🔄 Reflect & correct', sub: 'did it work? change paths?' },
      observe: { t: '👀 Observe result', sub: 'result back into context' },
    },
    // ---- Demo component UI ----
    demoTitle: '🎛️ Interactive · The Agent Loop: 7 heartbeats researching headphones',
    demoHint: 'Blue = think · Yellow = act · Green = observe · Red = reflect',
    svgAria: 'Agent loop diagram: cycling among think, act, observe, and reflect; exit once the goal is met',
    arrLabel: 'Goal met → exit the loop',
    roundDash: '—',
    roundN: (n) => `Round ${n}`,
    inAndOut1: "the previous round's output",
    inAndOut2: "= the next round's input",
    logEmpty: '(Footprint log is empty — the agent hasn\'t started working yet)',
    logRound: (n) => `Round ${n}`,
    btnNext: 'Next round ▸',
    btnReset: '↺ Reset',
    progress: (step, total) => `Round ${step} / ${total}`,
    // ---- What You'll Learn ----
    goalsTitle: '🎯 What You\'ll Learn',
    goals: [
      <>Tell Chatbot from Agent in one sentence: one is "ask and answer," the other is "given a goal, autonomously runs the whole multi-step job" — the test is whose court the ball is in</>,
      <>Memorize the four-piece set: Agent = LLM (the brain) + tools (the hands and feet) + the loop (the heartbeat) + memory (the workbench), every piece an old part from earlier lessons</>,
      <>Understand the six beats of the loop, and the most important insight of the lesson: the previous step's output is the next step's input — the model keeps deciding on top of its own footprint</>,
      <>Honestly assess reliability: understand why errors compound multiplicatively, recognize the three ways it dies — infinite loop / drift / cost blowup — and remember the three-piece human-machine collaboration fix</>,
    ],
    // ---- Core Idea ----
    conceptTitle: '💡 Core Idea: Put the "request-slip round" inside a loop',
    conceptLead: 'First take stock of the parts gathered over the past four lessons: in Lesson 16 you learned to direct the model, in Lesson 17 you mapped its memory limits, in Lesson 18 you bolted external material onto it, and in Lesson 19 it learned to file tool request slips. But these scenarios share one thing: every round is initiated by you, and once a round is answered, the ball is back in your court. No matter how strong the model, this "ask-and-answer" form is called a Chatbot. An Agent is exactly what changes this —',
    contrastTag1: 'Gut impression',
    contrastBig1: <>An Agent is just a<span className="gap">smarter</span>chatbot</>,
    contrastNote1: 'As if all it takes is a strong enough model, and somewhere along the chat it "upgrades" into an agent.',
    contrastTag2: 'Real mechanism',
    contrastBig2: <>An Agent puts the large model<span className="hl">inside a loop</span>: given a goal, it plans on its own, calls tools, looks at results, and decides again, only handing the ball back once the job is done</>,
    contrastNote2: 'The model itself can be exactly the same — the difference is the architecture around it: the loop, the tools, the memory.',
    exampleEn: <>The aptest picture is<span className="hl">handing work to an intern</span>: you say "research the competitors, give me a report by Friday" — they won\'t come ask "what next?" after every web page; instead they outline, search, swap keywords when a link is dead, and only come find you when truly stuck.</>,
    exampleZh: <>A Chatbot is the "check in on everything" mode of collaboration; an Agent is the "give a goal, deliver a result" mode. Note: what changed isn\'t necessarily the brain\'s smarts — it\'s the <b>mode of collaboration</b> that changed.</>,
    fourLead: <>Take apart any agent — no matter how flashy the product packaging — and inside is the same <b>four-piece set</b>, and you\'ve met every piece in earlier lessons:</>,
    fourCards: [
      { label: 'The brain · Lessons 10–14', term: <><b>LLM</b> large model</>, body: <>The only part that can "think." Planning, picking tools, reading results, making judgments — it\'s all this autocompletion machine generating text.</> },
      { label: 'Hands and feet · Lesson 19', term: <><b>Tools</b></>, body: <>Search, read pages, run code, write files. Still the same "model files a slip, host actually executes" setup, not a word changed.</> },
      { label: 'The heartbeat · the star of this lesson', term: <><b>The loop</b></>, body: <>A plain while in the host program: as long as the task isn\'t done, feed the latest result back and run another round. "Autonomy" lives entirely on this.</> },
      { label: 'The workbench · Lesson 17', term: <><b>Memory</b></>, body: <>The context window holds the goal, the plan, and each round\'s footprint; long tasks also need external notes and summaries to keep the workbench from piling up.</> },
    ],
    tableLead: 'One table pins down the two forms — and lets you recognize some real products on the market:',
    matchTh: ['Dimension', 'Chatbot · ask and answer', 'Agent · given a goal, autonomous multi-step'],
    matchRows: [
      ['Interaction', 'You serve, it returns; once one line is answered the round is over', 'You only give a goal; it plays the whole game through, then delivers'],
      ['Steps per task', '1 step: generate one answer', 'A few to a few hundred steps: plan, call tools, look at results, decide again'],
      ['Cost of an error', 'If it\'s wrong you see it on the spot and correct it with the next line', 'The error happens in an intermediate step and gets inherited and amplified by later steps (detailed below)'],
      ['Typical products', 'ChatGPT / Claude\'s web chat', 'Claude Code (autonomous coding), Deep Research (autonomous research), Manus-style general agents'],
    ],
    tableFootnote: 'Reminder: the agent product landscape shifts extremely fast — treat the products named in the table as "representatives of a form," not a leaderboard; for actual capabilities, check each vendor\'s site.',
    // ---- Loop breakdown ----
    flowTitle: '📖 Loop Breakdown: a six-beat heartbeat, round after round',
    flowLead: 'Zoom the "loop" down to frames. Each heartbeat has six beats — the first two mostly run at the opening, the last four cycle round and round:',
    flowSteps: [
      <><b>Perceive the task.</b> Understand the goal, take stock of the tools at hand — the tool list sits right in the context (Lesson 19).<span className="footnote">To the model, the "goal" is just a piece of text at the top of the window. Remember this fact; Misconception One will use it.</span></>,
      <><b>Plan the steps.</b> Break the big goal into a subtask checklist: "search for models first → check reviews one by one → finally summarize and write the recommendation."<span className="footnote">The plan itself is a piece of text generated by autocompletion (a close cousin of Lesson 16\'s chain-of-thought) — once written, it becomes a signpost that every later round reads.</span></>,
      <><b>Act (call a tool).</b> Take the next step from the plan, file a tool request slip, and the host actually executes it.<span className="footnote">The entire mechanism from Lesson 19 is unchanged: the model never executes anything by hand — agents didn\'t break this iron rule, they just file slips more often.</span></>,
      <><b>Observe the result.</b> The execution result is written back into the context — to the model, it\'s just "one more piece of text in the window."<span className="footnote">A successful result is nourishment, and a failed error message is nourishment too — in the demo you\'ll see firsthand how one 404 becomes a turning point.</span></>,
      <><b>Reflect and correct.</b> Did it match expectations? Should the plan change? If this path is blocked, which one next?<span className="footnote">"Reflection" sounds mystical, but in practice it\'s still text generation: the model reads its own footprint and writes a self-assessment.</span></>,
      <><b>Loop or exit.</b> Not done → back to beat 3; done → deliver the answer; repeatedly stuck → give up and report to a human.<span className="footnote">Note: judging "done or not" is also generated by the model, and it can misjudge — which is why mature products often put a human sign-off here (detailed next section).</span></>,
    ],
    flowKey: <><b>The most important sentence of the lesson: the previous beat\'s output is the next beat\'s input.</b> The Agent didn\'t grow new organs — what makes the decision each round is still that autocompletion machine you met in Lessons 12–14: read the context, write the next segment. The only change is what\'s in the context: no longer just your question, but the <b>footprint</b> it left along the way — plans, request slips, tool results, error messages, reflections. <b>The model keeps deciding on top of its own footprint.</b> This sentence instantly unlocks two corollaries: ① the footprint grows longer and longer, and the window gets more and more crowded (Lesson 17) — long tasks must do memory management, or the opening goal gets pushed out of the window and the agent instantly "forgets who it is"; ② once an error slips into the footprint, every later round reads it as truth — this is the seed of the next section\'s "error compounding."</>,
    flowWhy: <><b>Why must it be a loop?</b> Because the key information in a multi-step task "only appears once you get there." Researching headphones: without searching once, you don\'t know which three to check; without clicking the link, you don\'t know the page is already a 404. No matter how smart the model, it can\'t write at second zero a perfect plan that never needs revising — when the plan can\'t keep up with reality, the only way is to take a step, look, and adjust. A single generation gives no chance to "look"; a loop does.</>,
    flowConnect: 'Connect the phenomena you\'ve seen while watching an agent work to the beats of the loop:',
    flowMatchTh: ['A phenomenon you\'ve seen in a product', 'Which beat of the loop'],
    flowMatchRows: [
      [<><b>Deep Research runs for ten-plus minutes, showing "read 14 sources"</b></>, 'The loop reached round N — each source is one full "act → observe"'],
      [<><b>Claude Code finishes editing code, runs the tests itself, and when the tests go red it keeps fixing</b></>, 'Running the tests = act; the error message = observe; "where did I go wrong" = reflect — one round failed, so another round'],
      [<><b>Lines like "thinking… calling a tool…" scroll across the screen</b></>, 'That\'s not a decorative animation, it\'s the real-time log of each beat of the loop — the product broadcasting its heartbeat to you'],
      [<><b>Halfway through, you cut in "change the budget to under 1000," and it really does adjust</b></>, 'Your words also become a new footprint in the context — read along on the next round\'s decision'],
    ],
    // ---- Reliability bottleneck ----
    relTitle: '📖 The Reliability Bottleneck: the tyranny of compounding',
    relLead: 'By now the agent sounds nearly perfect: it can plan, it can act, and it even self-corrects. Time for a cold splash of water — this section is the most honest part of the lesson, and the source of your instinct for judging whether "agent news is a breakthrough or hype."',
    relPara1: <>The root of the problem was planted in Lesson 14: every output of the model is a probabilistic sample, and however accurate a single step is, it\'s only "probably right." In chat this doesn\'t matter — if it\'s wrong you see it and correct it with the next line. But an agent strings dozens of steps into one chain, with <b>every step standing on the previous step\'s output</b>, and trouble appears: errors aren\'t shared out evenly, they <b>compound multiplicatively</b>. Suppose the agent has a 95% chance of getting each step right; watch what the chance of "not a single misstep the whole way" drops to as it keeps going:</>,
    relMatchTh: ['Steps in a row', 'Chance of no error the whole way', 'How it feels'],
    relMatchRows: [
      ['1 step', 'about 95%', 'rock solid'],
      ['5 steps', 'about 77%', 'starting to sweat'],
      ['10 steps', 'about 60%', 'barely past half'],
      ['20 steps', 'about 36%', 'probably already erred midway'],
      ['50 steps', 'about 8%', 'a crash is nearly inevitable'],
    ],
    relFootnote: 'This is just an illustrative model — in real tasks each step varies in difficulty, and some errors can still be rescued by reflection. But the sense of magnitude is right: the longer the chain, the more "all smooth the whole way" resembles a lottery.',
    relDeathLead: 'Beyond error accumulation, engineering has three common ways to die — each one plays out over and over in real products:',
    relDeaths: [
      { label: 'Death One', term: <><b>Infinite loop</b></>, body: <>The same failed action retried over and over — like a game NPC stuck in a corner marching in place. Burning tokens, zero output; with no cap on rounds, it can stay stuck till dawn.</> },
      { label: 'Death Two', term: <><b>Drift</b></>, body: <>A small misreading in round 3 (reading "noise-cancelling headphones" as "noise-cancelling speakers") gets inherited as established fact by the next dozen-plus rounds — straying further and further, incoherent by delivery time.</> },
      { label: 'Death Three', term: <><b>Cost blowup</b></>, body: <>Every round has to re-read the whole, ever-longer footprint (Lesson 17, billed by token). Rounds × footprint length — the bill climbs far faster than intuition expects.</> },
    ],
    relFixLead: <>The current engineering three-piece fix — with a single shared idea: <b>don\'t let an error survive past one round, and don\'t let the chain grow out of control</b>:</>,
    relFixes: [
      { label: 'Fix One · human gatekeeping', term: <><b>Human confirmation</b> at key nodes</>, body: <>The industry calls it human-in-the-loop: deleting files, spending money, sending things out — these actions must stop and wait for a human to sign off. The safety iron rule of Lesson 19 matters doubly in an agent because the steps multiply.</> },
      { label: 'Fix Two · shorten the chain', term: <><b>Subtask splitting</b></>, body: <>Cut a 20-step long chain into several 5-step short chains, each ending by delivering a small result a human can quickly check. The shorter the compounding chain, the higher the survival probability — it\'s arithmetic, no magic.</> },
      { label: 'Fix Three · verify on the spot', term: <>Verifiable <b>intermediate products</b></>, body: <>Make every step produce something "a machine or a human can verify immediately": write code, then run tests; do research, then leave source links. Catch errors on the spot, instead of running another dozen rounds carrying a defect.</> },
    ],
    relWhyCode: <>This also conveniently answers a phenomenal question: <b>why did coding agents mature first?</b> Because code comes with a free verifier by nature — the compiler and the tests. Every round\'s "observe" gets an objective hard signal; an error doesn\'t survive past one round before being caught; and if you fix it wrong, you can roll back with one click. Tasks like "fully automated stock trading" and "fully automated negotiation" are the opposite — slow feedback, heavy noise, irreversible errors — with no one to stop the compounding decay. A handy rule of thumb: <b>the more cheaply a result can be verified and the more reversible the errors, the sooner an agent becomes usable in that domain.</b> Next time you watch an agent product launch, ask these two questions first — more reliable than watching the demo video.</>,
    // ---- Interactive demo ----
    relSourceNote: (
      <>
        The alternating "reason + act" loop paradigm is from Yao et al. 2022,{' '}
        <a href="https://arxiv.org/abs/2210.03629" target="_blank" rel="noreferrer">
          ReAct
        </a>
        ; the "read the failure trace, self-reflect, then retry" approach is from Shinn et al. 2023,{' '}
        <a href="https://arxiv.org/abs/2303.11366" target="_blank" rel="noreferrer">
          Reflexion
        </a>
        .
      </>
    ),
    demoSecTitle: '🎛️ Interactive Demo: watch an agent\'s whole life',
    demoSecLead: 'Task script: "Research three noise-cancelling headphones and give a buying recommendation." Above is the loop diagram, below is the agent\'s footprint log — each time you click "Next round," the loop diagram lights up the corresponding beat and the log appends this round\'s think / act / observe. Watch rounds 3 and 4 closely: a 404 failure, and a textbook reflective detour.',
    // ---- Common Misconceptions ----
    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      {
        bad: 'An Agent has its own will — it "wants" to finish the goal, and when it fails it "stubbornly" retries',
        good: 'The "goal" is just a piece of text you wrote into the prompt; "won\'t quit till it\'s done" is a while loop hard-coded in the program',
        why: <><b>Cause:</b> watching an agent work for ten-plus minutes straight and switch paths after hitting a wall looks far too much like "having a will." Two experiments that debunk it: ① swap the goal in the prompt for any other string, and it\'s equally "obsessed" with the new goal, with no preference at all; ② make the host program stop writing results back (pull out the loop), and the "will" vanishes on the spot, degrading it to ordinary ask-and-answer. The persistence is a <b>property of the architecture</b>, not a property of a mind — the desire is written in your prompt, the perseverance in the engineer\'s while.</>,
      },
      {
        bad: 'Agents can already fully automate and replace human work',
        good: 'Long-chain success rates decay multiplicatively; the most reliable form right now is human-machine collaboration: AI runs short chains, humans gatekeep the nodes',
        why: <><b>Cause:</b> the agent demo videos you scroll past are cut from successful runs picked out of countless attempts — the failed ones never show up on your timeline. In real engineering, long tasks still infinite-loop, drift, and burn budget, so mature products all keep a human-confirmation gate (Claude Code asking you before it deletes a file or runs a command every time is proof). The strongest use right now isn\'t "fully automatic" but treating the agent as a tireless intern: you set the direction, split the tasks, and accept the intermediate products — it brings the speed, you bring the judgment.</>,
      },
    ],
    // ---- Quick Quiz ----
    bridgeTitle: '➡️ How This Leads to Lesson 21',
    bridgeLead: 'With this, the "Applications" stage wraps up: from writing prompts, bolting on knowledge, and calling tools, to chaining them into an agent that works on its own, you can now genuinely put a large model to use. But the star of the first 20 lessons was always text. From the next stage, "Frontier," AI breaks out of the text boundary — first stop, text-to-image: starting from pure noise and "denoising" step by step into a picture. The counterintuitive principle behind diffusion models is exactly the engine of Stable Diffusion and Midjourney.',
    bridgeSteps: ['Applications stage wraps up', 'You can put models to work', 'Break out of text', 'Next: Diffusion text-to-image'],
    quizTitle: '✍️ Quick Quiz',
    quiz: [
      {
        q: '1. A friend says: "I hooked my chatbot up to a search tool — it counts as an agent now, right?" Using this lesson\'s four-piece set and the "whose court the ball is in" test, judge what it still lacks.',
        a: <>Check against the four-piece set: it has a <b>brain</b> (the LLM) and <b>hands and feet</b> (a search tool) — but if it\'s still "you ask, it searches once, then stops," it lacks the <b>loop</b> (deciding the next step itself, running multiple rounds in a row) and a <b>memory</b> that\'s genuinely put to use (deciding on top of the footprint). The test in one sentence: <b>whose court the ball is in</b> — if every step has to be initiated by you, it\'s still a "Chatbot with tools"; only if you give just a goal and it runs the whole way itself is it an agent.</>,
      },
      {
        q: '2. You ask an agent to compile "EV sales data over the last five years" and find that by round 15 it\'s still repeatedly visiting the same unopenable website. Diagnose which way of dying this is, and open one remediation plan for each of the lesson\'s three-piece fixes.',
        a: <><b>Diagnosis: infinite loop</b> — the same failed action retried over and over, tokens burning, zero output. <b>Remediation:</b> ① <b>Human confirmation</b>: set a cap on rounds + pause and escalate after some number of consecutive failures, letting a human decide on switching paths; ② <b>Subtask splitting</b>: cut "the last five years" into five short tasks by year, each run and accepted separately; ③ <b>Verifiable intermediate products</b>: require each segment to first deliver a small table with source links — data accuracy and link reachability can be verified on the spot by both human and program.</>,
      },
      {
        q: '3. Why did "AI writing code" agents mature before "AI fully automated stock trading" agents? Explain using the two concepts of "verifiable intermediate products" and "error compounding."',
        a: <>In coding, every step has a <b>cheap and objective verifier</b>: the compiler, tests, error messages — the "observe" beat gets a hard signal, an error doesn\'t survive past one round before being caught, which effectively raises each step\'s success rate and shortens the compounding chain; and if you fix it wrong you can roll back with one click, so errors are <b>reversible</b>. Stock trading is the opposite: slow feedback, heavy noise, irreversible errors — the compounding decay runs all the way with no one to stop it. Rule of thumb: <b>the cheaper the verification and the more reversible the errors, the sooner an agent matures.</b></>,
      },
    ],
  },
}

// SVG 节点几何（与语言无关，文本另从 C[lang].AG_NODES_T 取）
const AG_NODES = [
  { k: 'goal', x: 10, y: 20, w: 104, h: 44, fill: 'var(--bg-inset)', stroke: 'var(--hairline-strong)', sw: 1.4, tx: 62, ty1: 40, ty2: 55 },
  { k: 'think', x: 254, y: 36, w: 132, h: 48, fill: 'var(--sky-bg)', stroke: 'var(--sky)', sw: 1.4, tx: 320, ty1: 57, ty2: 73 },
  { k: 'done', x: 540, y: 20, w: 106, h: 44, fill: 'var(--sage-bg)', stroke: 'var(--sage)', sw: 1.4, tx: 593, ty1: 40, ty2: 55 },
  { k: 'act', x: 472, y: 136, w: 132, h: 48, fill: 'var(--amber-bg)', stroke: 'var(--amber)', sw: 1.4, tx: 538, ty1: 157, ty2: 173 },
  { k: 'reflect', x: 36, y: 136, w: 132, h: 48, fill: 'var(--terracotta-bg)', stroke: 'var(--terracotta)', sw: 1.4, tx: 102, ty1: 157, ty2: 173 },
  { k: 'observe', x: 254, y: 236, w: 132, h: 48, fill: 'var(--sage-bg)', stroke: 'var(--sage)', sw: 1.4, tx: 320, ty1: 257, ty2: 273 },
]

function AgentDemo({ c }) {
  const SCRIPT = c.SCRIPT
  const TOTAL = SCRIPT.length
  const TAG = c.TAG
  const NT = c.AG_NODES_T
  const [step, setStep] = useState(0)
  const [lit, setLit] = useState({ goal: true })
  const logRef = useRef(null)
  const timersRef = useRef([])

  function clearTimers() { timersRef.current.forEach(clearTimeout); timersRef.current = [] }

  // 点亮当前轮的节拍（错峰）
  useEffect(() => {
    clearTimers()
    if (step === 0) { setLit({ goal: true }); return }
    const seq = SCRIPT[step - 1].seq
    if (reduceMotion()) { const o = {}; seq.forEach((k) => (o[k] = true)); setLit(o); return }
    setLit({})
    seq.forEach((k, i) => {
      timersRef.current.push(setTimeout(() => setLit((prev) => ({ ...prev, [k]: true })), i * 450))
    })
    return clearTimers
  }, [step])

  // 日志滚到底
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, [step])

  const info = step === 0 ? c.INFO0 : SCRIPT[step - 1]
  const cap = step === 0 ? c.CAP0 : SCRIPT[step - 1].cap

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.demoTitle}</span>
        <span className="demo-hint">{c.demoHint}</span>
      </div>
      <div className="demo-body stack">
        <div className="demo-stage">
          <div className="demo-stage-col">
            <svg id="ag-svg" viewBox="0 0 660 320" width="680" aria-label={c.svgAria}>
              <defs>
                <marker id="ag-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 z" fill="var(--fg-2)" />
                </marker>
              </defs>
              <g fill="none" stroke="var(--fg-2)" strokeWidth="1.6">
                <path d="M 116 42 C 170 40 210 46 248 54" markerEnd="url(#ag-arr)" />
                <path d="M 388 74 C 450 92 502 110 532 132" markerEnd="url(#ag-arr)" />
                <path d="M 514 186 C 480 220 442 244 392 256" markerEnd="url(#ag-arr)" />
                <path d="M 250 262 C 195 256 140 226 110 190" markerEnd="url(#ag-arr)" />
                <path d="M 98 134 C 95 95 170 68 248 58" markerEnd="url(#ag-arr)" />
                <path d="M 388 50 C 440 38 480 36 534 38" strokeDasharray="5 4" markerEnd="url(#ag-arr)" />
              </g>
              <text x="462" y="26" textAnchor="middle" fontSize="9.5" fill="var(--fg-2)">{c.arrLabel}</text>
              <text x="320" y="138" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="var(--fg-1)">{step === 0 ? c.roundDash : c.roundN(step)}</text>
              <text x="320" y="158" textAnchor="middle" fontSize="10.5" fill="var(--fg-2)">{c.inAndOut1}</text>
              <text x="320" y="172" textAnchor="middle" fontSize="10.5" fill="var(--fg-2)">{c.inAndOut2}</text>
              {AG_NODES.map((n) => (
                <g key={n.k} className={`ag-node${lit[n.k] ? ' lit' : ''}`}>
                  <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="12" fill={n.fill} stroke={n.stroke} strokeWidth={n.sw} />
                  <text x={n.tx} y={n.ty1} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--fg-0)">{NT[n.k].t}</text>
                  <text x={n.tx} y={n.ty2} textAnchor="middle" fontSize="9" fill="var(--fg-1)">{NT[n.k].sub}</text>
                </g>
              ))}
            </svg>
            <div className="ag-caption">{cap}</div>
            <div className="ag-log" ref={logRef} aria-live="polite">
              {step === 0 ? (
                <div className="placeholder">{c.logEmpty}</div>
              ) : (
                SCRIPT.slice(0, step).map((s, ri) => (
                  <div key={ri}>
                    <div className="log-round">{c.logRound(ri + 1)}</div>
                    {s.lines.map((l, li) => (
                      <div key={li} className={`log-line${l[3] ? ' fail' : ''}`}>
                        <span className={`lt ${TAG[l[0]][0]}`}>{TAG[l[0]][1]}</span>
                        <span className={l[2] ? 'mono' : undefined}>{l[1]}</span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="demo-side">
          <div className="chips">
            <button className="chip" disabled={step >= TOTAL} onClick={() => setStep((s) => Math.min(TOTAL, s + 1))}>{c.btnNext}</button>
            <button className="chip" onClick={() => setStep(0)}>{c.btnReset}</button>
            <span className="footnote" style={{ alignSelf: 'center' }}>{c.progress(step, TOTAL)}</span>
          </div>
          <h4 style={{ marginTop: 14 }}>{info.t}</h4>
          <p>{info.d}</p>
        </div>
      </div>
    </div>
  )
}

export default function L20() {
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
        <div className="contrast">
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-ink">{c.contrastTag1}</span></div>
            <div className="big">{c.contrastBig1}</div>
            <p className="note">{c.contrastNote1}</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-sage">{c.contrastTag2}</span></div>
            <div className="big">{c.contrastBig2}</div>
            <p className="note">{c.contrastNote2}</p>
          </div>
        </div>
        <div className="example mt14">
          <div className="en">{c.exampleEn}</div>
          <div className="zh">{c.exampleZh}</div>
        </div>
        <p className="lead mt14">{c.fourLead}</p>
        <div className="use-grid cols-4">
          {c.fourCards.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.term}</div><div className="zh">{u.body}</div></div>
          ))}
        </div>
        <p className="lead mt14">{c.tableLead}</p>
        <div className="card">
          <table className="match">
            <thead><tr><th>{c.matchTh[0]}</th><th>{c.matchTh[1]}</th><th>{c.matchTh[2]}</th></tr></thead>
            <tbody>
              {c.matchRows.map((r, i) => (
                <tr key={i}><td className="be">{r[0]}</td><td className="ex">{r[1]}</td><td>{r[2]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="footnote mt14">{c.tableFootnote}</p>
      </Lsec>

      <Lsec title={c.flowTitle} lead={c.flowLead}>
        <div className="card flow-card">
          <div className="flow">
            {c.flowSteps.map((s, i) => (
              <div className="flow-step" key={i}><span className="num">{i + 1}</span><span className="txt">{s}</span></div>
            ))}
          </div>
        </div>
        <p className="lead mt14">{c.flowKey}</p>
        <p className="lead">{c.flowWhy}</p>
        <p className="lead">{c.flowConnect}</p>
        <div className="card">
          <table className="match">
            <thead><tr><th>{c.flowMatchTh[0]}</th><th>{c.flowMatchTh[1]}</th></tr></thead>
            <tbody>
              {c.flowMatchRows.map((r, i) => (
                <tr key={i}><td>{r[0]}</td><td className="ex">{r[1]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Lsec>

      <Lsec title={c.relTitle} lead={c.relLead}>
        <p className="lead">{c.relPara1}</p>
        <div className="card">
          <table className="match">
            <thead><tr><th>{c.relMatchTh[0]}</th><th>{c.relMatchTh[1]}</th><th>{c.relMatchTh[2]}</th></tr></thead>
            <tbody>
              {c.relMatchRows.map((r, i) => (
                <tr key={i}><td className="be">{r[0]}</td><td>{r[1]}</td><td className="ex">{r[2]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="footnote mt14">{c.relFootnote}</p>
        <p className="lead mt14">{c.relDeathLead}</p>
        <div className="use-grid">
          {c.relDeaths.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.term}</div><div className="zh">{u.body}</div></div>
          ))}
        </div>
        <p className="lead mt14">{c.relFixLead}</p>
        <div className="use-grid">
          {c.relFixes.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.term}</div><div className="zh">{u.body}</div></div>
          ))}
        </div>
        <p className="lead mt14">{c.relWhyCode}</p>
        <p className="footnote source-note">{c.relSourceNote}</p>
      </Lsec>

      <Lsec title={c.demoSecTitle} lead={c.demoSecLead}>
        <AgentDemo c={c} />
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
