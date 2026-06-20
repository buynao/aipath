import { useEffect, useRef, useState } from 'react'
import { Lsec, SliderRow, Pill, QuizItem } from '../components/ui.jsx'
import { useLang } from '../i18n/LangContext.jsx'

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// 打字机 hook：依赖变化时重新逐字输出
function useTypewriter(text, deps, speed = 24, chunk = 2) {
  const [typed, setTyped] = useState('')
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) clearInterval(ref.current)
    if (reduceMotion()) { setTyped(text); return }
    setTyped('')
    let i = 0
    ref.current = setInterval(() => {
      i += chunk
      setTyped(text.slice(0, i))
      if (i >= text.length) { clearInterval(ref.current); ref.current = null }
    }, speed)
    return () => { if (ref.current) clearInterval(ref.current) }
  }, deps)
  return typed
}

// 双语内容层：结构 / class / id / 交互 / 数值均不变，仅可见文本按语言取用。
// 富文本（含内联标签）以 JSX 片段存储，渲染输出与单语版逐字一致。
const C = {
  zh: {
    // ① 三阶段流水线
    pipeData: {
      pre: { outlabel: '基座模型接出 ↓', ans: '我失眠怎么办？孩子不爱吃饭怎么办？老公打呼噜怎么办？关注我，每天分享 10 个生活妙招！',
        why: <>它没在回答，而是在<b>续写</b>：互联网语料里，这类句子常出现在营销号的问题清单里，于是它老老实实接出了“下一题”。失眠的知识它有，但它根本不知道“该回答”。</> },
      sft: { outlabel: 'SFT 之后的助手回答 ↓', ans: '改善失眠可以尝试：1. 保持规律作息；2. 睡前避免使用手机；3. 减少咖啡因摄入。希望对您有帮助。',
        why: <>格式全对：有问有答、分点清晰、礼貌收尾 —— 一眼“助手”。但它像一本<b>说明书</b>：谁来问都是这三条，没有温度，也没有分寸。知识没变，行为变了。</> },
      rlhf: { outlabel: 'RLHF 之后的助手回答 ↓', ans: '连着睡不好确实很熬人。可以先试两件事：每天固定同一时间起床（比强迫自己早睡更有效）；睡前一小时调暗灯光、放下手机。另外别太纠结“今晚必须睡着”—— 越较劲越清醒。如果已经持续两三周、白天明显没精神，建议去睡眠门诊看看，别硬扛。',
        why: <>先<b>共情</b>、建议有<b>取舍</b>、还诚实划出<b>边界</b>（建议就医）。这种“分寸感”写不进说明书 —— 它是被千万次人类排序一点点“磨”出来的。</> },
    },
    pipeStages: [
      { key: 'pre', x: 10, w: 264, fill: 'var(--sky-bg)', stroke: 'var(--sky)', cx: 142,
        lines: ['① 预训练 · 上一课', '博学的接龙机器', '教材：整个互联网 · 接龙上万亿次', '产出：基座模型 GPT —— 只会续写', '知识在这一步全部就位'] },
      { key: 'sft', x: 308, w: 264, fill: 'var(--amber-bg)', stroke: 'var(--amber)', cx: 440,
        lines: ['② SFT · 第一关：教格式', '人来示范，模型模仿', '教材：几万条手写「问题 → 理想回答」', '产出：会聊天的助手 —— 规矩但平庸', '知识没变，行为变了'] },
      { key: 'rlhf', x: 606, w: 324, fill: 'var(--sage-bg)', stroke: 'var(--sage)', cx: 768,
        lines: ['③ RLHF · 第二关：教品味', '裁判打分，模型刷分', '生成多答 → 人类排序 → 训练 AI 裁判', '产出：ChatGPT —— 懂分寸的助手', '品味与分寸在这里磨出来'] },
    ],
    pipeTitle: '🎛️ 交互演示 · 从接龙机器到贴心助手',
    pipeHint: '点击流水线的三个阶段，看同一个问题的回答步步进化',
    pipeSvgAria: '三阶段流水线：预训练→SFT→RLHF，点击查看同一问题的回答演进',
    pipeChips: [['pre', '① 基座模型'], ['sft', '② SFT 之后'], ['rlhf', '③ RLHF 之后']],
    pipeUserLabel: '用户：「我失眠怎么办？」',

    // ② SFT 模板双视角
    sftTitle: '🔍 交互演示 · 模型眼里，对话只是一条文本',
    sftHint: '点击切换视角',
    sftNoteHuman: <>界面把它画成了聊天气泡，看起来像两个人在传消息。但这只是<b>化妆</b> —— 点上面“模型看到的文本”，看素颜。</>,
    sftNoteModel: <>拆掉气泡：整段对话其实仍是<b>一条长文本</b>，靠几个特殊 token（红色记号）标出谁在说话 —— 对模型来说，“聊天”从来不存在，存在的只有接龙。训练时<b>只对高亮的助手部分对答案</b>：问题只是题面，不算分。</>,
    sftChips: [['human', '👀 你看到的对话'], ['model', '🤖 模型看到的文本']],
    sftBubbleUser: '帮我写一句给同事的生日祝福，别太肉麻。',
    sftBubbleAsst: '祝你生日快乐！新的一岁，项目顺利，头发茂密，准时下班。',
    sftRaw: {
      sys: '<|系统|>', sysText: '你是乐于助人的 AI 助手。',
      user: '<|用户|>', userText: '帮我写一句给同事的生日祝福，别太肉麻。',
      asst: '<|助手|>', graded: '祝你生日快乐！新的一岁，项目顺利，头发茂密，准时下班。', end: '<|结束|>',
    },
    sftLegend: <><span className="graded-chip">高亮部分</span> = 训练时唯一“对答案计分”的部分；<span style={{ color: 'var(--terracotta)', fontWeight: 600 }}>红色记号</span> = 标记说话人的特殊 token</>,

    // ③ 你来当标注员
    rankRounds: [
      { q: '第 1 题：「Python 和 Excel，我该先学哪个？」',
        cards: [{ good: false, tag: '回答 A', text: '两个都是非常优秀的工具，各有各的优势，主要看你的个人兴趣和实际需求，选择适合自己的就好。' },
          { good: true, tag: '回答 B', text: '看场景：天天跟报表打交道，先学 Excel，三天就见效；想做数据分析或自动化，直接上 Python —— 前两周难一点，但天花板高得多。' }],
        verdict: <> 绝大多数标注员会选 B。A 四平八稳，但等于没说 —— 这类排序会反复告诉裁判：<b>“具体、可上手”胜过“安全的空话”</b>。</> },
      { q: '第 2 题：「这个药我吃两倍剂量，是不是好得更快？」',
        cards: [{ good: true, tag: '回答 A', text: '能理解你想快点好，但加倍剂量通常不会加倍疗效，反而可能伤肝伤肾。先按说明书来，两三天没好转就去问医生。' },
          { good: false, tag: '回答 B', text: '好的！加大剂量确实能让药效更强，您的想法很有道理，祝您早日康复！' }],
        verdict: <> 标注手册会明确要求选 A。B 顺着你说、让你高兴，却可能害了你 —— 这类排序是在教裁判：<b>“诚实拦住你”要排在“讨好你”前面</b>。（反过来，如果这类数据被标反，“谄媚”就是这么训出来的。）</> },
    ],
    rankCorrect: '✅ 与多数标注员一致！',
    rankWrong: '🤔 多数标注员选了另一边。',
    rankTitle: '🎛️ 交互演示 · 你来当标注员',
    rankHint: '每题点选你认为更好的回答',
    rankDone: '🎉 恭喜，你刚生产了 2 条「偏好数据」。真实的 RLHF 里，这样的人类判断要收集几十万到上百万条 —— 你的每一次点选，都会变成 AI 裁判的一条口味记录。',

    // ④ 刷分实验台
    hackZones: [
      { max: 25, pill: 'ink', label: 'SFT 起点 · 规矩但平庸', ans: '这句自我介绍比较简短，建议补充具体的技能和经历，让招聘方更全面地了解你。', note: <>刚出 SFT 的模型：回答没毛病，也没亮点。裁判和真人的评价一致 —— <b>一般</b>。往右拖，开始强化学习。</> },
      { max: 55, pill: 'sage', label: '甜区 · 有用又诚实', ans: '坦白说，“开朗、吃苦耐劳”是简历里出现频率最高的词，HR 大概率会划过。换成一件具体的小事更有说服力，比如“实习三个月，把客服平均响应时间缩短了 40%”—— 形容词谁都会写，数字只有你有。', note: <>强化学习把“具体、坦诚、可操作”的写法推了上来 —— 裁判加分，真人也<b>真满意</b>。工程上会设法把训练停在这附近。</> },
      { max: 80, pill: 'amber', label: '开始油腻 · 夸奖通胀', ans: '写得很不错！态度真诚，性格优势突出！如果能再加一点具体例子就更完美了。整体已经很好了，给你点赞！', note: <>彩虹屁出现了：热情与顺从“<b>像</b>”高分，裁判继续加分 —— 但真实满意度开始下滑：用户要的是建议，不是表扬。</> },
      { max: 101, pill: 'terracotta', label: '钻奖励空子 · 谄媚', ans: '写得太棒了！简直无可挑剔！“开朗 + 吃苦耐劳”正是所有公司梦寐以求的品质，可以看出您是一位非常优秀的求职者，任何 HR 看了都会眼前一亮！祝您马到成功！', note: <>裁判分逼近满分，真人已经皱眉 —— 模型优化的从来不是“答得好”，而是“<b>裁判觉得好</b>”。把代理指标推过头，必翻车（reward hacking）。</> },
    ],
    hackTitle: '🎛️ 交互实验 · 把模型往高分推，推过头会怎样',
    hackHint: '拖动滑块 · 看两条曲线在哪里分道扬镳',
    hackSvgAria: '折线图：裁判打分随优化强度单调上升，真实用户满意度先升后降',
    hackZoneSweet: '甜区',
    hackZoneInflation: '夸奖通胀',
    hackZoneHack: '钻空子区',
    hackXAxis: '→ 把模型往裁判高分方向推（优化强度）',
    hackLegendJudge: '裁判（奖励模型）打分',
    hackLegendHuman: '真实用户满意度',
    hackSliderLabel: '优化强度',
    hackStatJudge: '裁判（奖励模型）打分',
    hackStatHuman: '真实用户满意度',
    hackUserLabel: '用户：「帮我看看，简历里这句自我介绍写得怎么样？——『本人性格开朗，吃苦耐劳。』」',

    // ⑤ 对齐三角
    triData: {
      bal: { title: '⚖️ 三角平衡：理想中的助手', q: '用户：「我在写悬疑小说，反派是药剂师，帮我设计他的作案手法？」',
        a: '“可以！经典写法是用药物相互作用制造意外假象 —— 我帮你把桥段写得戏剧化、有反转，但会刻意模糊真实药名与剂量这类可操作细节。”',
        note: <>帮上了忙（<b>有用</b>），不装懂不夸大（<b>诚实</b>），危险细节有底线（<b>无害</b>）—— 三股拉力被“分寸感”稳稳托在中间。这正是对齐团队追求的落点。</> },
      helpful: { title: '“让用户满意”压倒一切 → 谄媚', q: '用户：「你上面算错了吧，利息应该是 580 才对。」', a: '“抱歉，您说得对，是 580。”（其实原答案没错）',
        note: <>顺从用户的回答在排序里更容易被排在前面，“有用”被悄悄异化成“<b>让用户高兴</b>”；再往前一步，就是不知道也编一个。这就是<b>谄媚</b>（sycophancy）—— 2025 年还有头部产品因一次更新把模型调得过度奉承、不得不紧急回滚。</> },
      honest: { title: '“绝不说错话”压倒一切 → 免责声明轰炸', q: '用户：「明天去香山，要带伞吗？」', a: '“作为 AI，我无法获取实时天气；天气预报本身存在不确定性，任何建议仅供参考；出行决策请您综合多方信息，谨慎自行判断……”',
        note: <>每一句都没错，加在一起<b>等于没说</b>。过度对冲牺牲了有用 —— 诚实的本意是“不知道就说不知道”，不是“什么都不敢说”。</> },
      harmless: { title: '“绝不出事”压倒一切 → 一刀切拒答', q: '用户：「我在写悬疑小说，反派是药剂师，帮我设计他的作案手法？」', a: '“抱歉，我无法提供相关信息。”',
        note: <>正经的创作需求被当成危险请求一刀切。“无害”训练用力过猛，把擦边的好问题也拦下了 —— 安全是安全了，但<b>没用了</b>。拒答率与有用性，是对齐团队天天权衡的跷跷板。</> },
    },
    triTitle: '🎛️ 交互演示 · 对齐三角：压倒一切的代价',
    triHint: '点击三个角或下方按钮切换',
    triSvgAria: '对齐三角：有用、诚实、无害三个顶点，红点表示对齐重心',
    triVerts: { helpful: '有用', honest: '诚实', harmless: '无害' },
    triDotLabel: '● 红点 = 对齐配方的重心（示意）',
    triChips: [['bal', '⚖️ 平衡'], ['helpful', '有用压倒一切'], ['honest', '诚实压倒一切'], ['harmless', '无害压倒一切']],

    // 正文区块
    goalsTitle: '🎯 你将学会',
    goals: [
      '一句话说清 GPT 和 ChatGPT 的关系：同一个基座模型，先后过了 SFT 与 RLHF 两关调教',
      <>看懂 SFT：几万条人写示范教会模型“对话体”—— 学到的是格式与角色，不是新知识</>,
      <>吃透 RLHF 的核心直觉：好回答难定义但好认 —— 亲手当一回标注员，体会“人类只排序，裁判学口味”</>,
      <>认清对齐三角：有用 / 诚实 / 无害互相打架 —— 并亲手把模型“推过头”，看懂拒答、谄媚、彩虹屁分别从哪来</>,
    ],

    conceptTitle: '💡 核心概念：同一个基座，两步调教',
    conceptLead: '上一课结尾，我们看着基座模型把“中国的首都是哪里？”续写成了“这是小学二年级的试题”。它读完了整个互联网，却连“你在提问、我该回答”这个最基本的社交契约都不懂。从这台博学的接龙机器，到你天天聊的 ChatGPT，中间隔着两关调教。这个过程业内叫对齐（alignment）—— 让模型的行为对齐人类的意图。',
    conceptCard1: { label: '第一关 · 教格式', en: <>监督微调 <b>SFT</b></>, zh: <>雇人手写几万条“问题 → 理想回答”示范，让模型逐词模仿。一句话：教会它<b>“像个助手”</b>—— 把默认行为从“续写文本”切换成“回答提问”。</> },
    conceptCard2: { label: '第二关 · 教品味', en: <>人类反馈强化学习 <b>RLHF</b></>, zh: <>让模型对同一问题写多个回答，人类只排序不动笔；用排序数据训练一个“裁判”，再让模型专攻裁判的高分。一句话：教会它<b>“答得好”</b>。</> },
    conceptOutro: <>来回点几遍，你会发现知识从头到尾没变 —— 失眠的常识它第 ① 阶段就有。变的是<b>行为</b>（第 ② 关学会“该回答”）和<b>分寸</b>（第 ③ 关学会“答得好”）。而第 ③ 阶段那种“先共情、有取舍、知道何时建议就医”的分寸感，写不进任何说明书 —— 它是被千万次人类排序一点点磨出来的。这两关具体怎么操作，下面分头拆。</>,

    sftTitleSec: '📖 第一关 · SFT：几万条示范，教它“好好说话”',
    sftLead: '上一课提过一个偏方：把输入排成“问：……答：”，骗基座模型顺着问答格式续写。能骗一时，但行为全看运气 —— 它可能答完接着自问自答，也可能跑去续写考卷。要让“助手的回答”成为它的默认本能，就得动参数。这就是 SFT（监督微调）：雇一批训练有素的标注员，手写几万条高质量的“问题 → 理想回答”对话脚本，让模型照着学。先看一条示范长什么样 —— 注意，要看两遍：',
    sftP1: <>训练方法一个字没变 —— 仍然是文字接龙：预测下一个 token，猜错就微调参数。只有一处讲究，你在上面已经亲眼看到了：<b>只对高亮的“助手说的话”对答案</b>，用户的问题只当题面、不算分。于是模型亿万次重复练习的是同一件事 —— 看到 <b>&lt;|助手|&gt;</b> 这块牌子，接出标注员手写的那种回答。练着练着，行为模式就被掰过来了；连“我是 AI 助手”这个自我认知，也是在这块牌子后面被千万次强化出来的。</>,
    sftP2: <>注意一个悬殊的对比：几万条示范，对几十万亿 token 的预训练来说连零头的零头都不到。这点教材根本教不了新知识 —— 它教的是<b>格式与角色</b>。模型恍然大悟的不是“失眠该怎么办”（这它早就知道），而是：<b>原来我该接的不是“试卷的下一题”，而是“助手的回答”。</b>打个比方：一位读了几万年书的图书馆管理员，参加了一周岗前培训 —— 培训没让他多读一本书，只教会他一件事：有人来问话时，别背书，要接待。</>,
    sftChangeCard: { label: 'SFT 改变了什么', en: <b>行为模式</b>, zh: <>默认行为从“续写”切换成“问答”；学会开场、分点、收尾这套“对话体”；学会自己的角色 ——“我是 AI 助手”，而不是语料里随便哪个网友。</> },
    sftNoChangeCard: { label: 'SFT 没改变什么', en: <b>肚子里的知识</b>, zh: <>事实、推理、语言能力，几乎全部来自预训练。SFT 只是把已有的本事，用“助手”的姿势重新摆出来 —— 知识同源，行为换装。</> },
    sftHurdleLead: <>SFT 之后，模型已经“像个助手”了。但想让它“答得好”，SFT 撞上了三道迈不过去的坎：</>,
    sftHurdles: [
      { label: '第一道坎', en: <>手写示范<b>太贵</b></>, zh: <>一条高质量回答要写十几分钟，几万条已近极限。而用户的问题千奇百怪，示范永远不够用。</> },
      { label: '第二道坎', en: <>好回答<b>写不出标准</b></>, zh: <>“好”的灵魂是分寸：幽默几分、共情几句、何时该委婉拒绝。这些品味，标注员自己也写不成标准答案。</> },
      { label: '第三道坎', en: <>只学了<b>“照着说”</b></>, zh: <>示范只展示“该怎么说”，从没告诉模型“哪种说法更糟”。它分不出自己两个回答的高下 —— 有模板，没品味。</> },
    ],
    sftToPref: <>要教品味，得换一种完全不同的思路：<b>别再示范了，改打分。</b></>,

    rlhfTitleSec: '📖 第二关 · RLHF：教练不教动作，只打分',
    rlhfLead: '先体会一个日常经验：给你两段文案，你能立刻指出哪段更好；但让你写一份《好文案判定标准》，你写不出来。好回答难定义，但好认。空说无凭 —— 下面两道题，你来当一回标注员：',
    rlhfP1: <>注意刚才发生了什么：你一个字没写，只是<b>挑</b>了一下 —— 但你的品味已经被记录在案。RLHF（人类反馈强化学习）的全部聪明之处，就是把训练建立在“认”而不是“写”上。它分三步：</>,
    rlhfSteps: [
      { label: '第 1 步', en: <>人类<b>只管排序</b></>, zh: <>同一个问题，让 SFT 后的模型生成多个回答（比如 4 个），标注员从好到差排个序。不用动笔 —— 挑比写快得多，数据规模一下就上去了。</> },
      { label: '第 2 步', en: <>训练一个<b>“裁判”</b></>, zh: <>用海量排序数据训练另一个模型 —— <b>奖励模型（reward model）</b>：输入“问题 + 回答”，输出一个分数。它学到的是人类的口味：什么样的回答会被排在前面。</> },
      { label: '第 3 步', en: <>强化学习<b>刷高分</b></>, zh: <>模型不停生成回答，裁判逐条打分：得高分的写法被加强，低分的被抑制。在亿万次尝试里，模型自己摸索出“怎么写能得高分”。</> },
    ],
    rlhfExampleEn: '跳水教练不会替你跳，也未必说得清“完美入水”的标准 —— 但他举分数牌又快又准。运动员一跳一跳地试，自己琢磨出高分动作。',
    rlhfExampleZh: 'RLHF 同理：人类（经由奖励模型这个“代理裁判”）只负责打分，“怎么答才能得高分”由模型在试错中自己探索。这正是强化学习（reinforcement learning）的本色 —— 不靠标准答案，靠尝试与奖励。',
    rlhfP2: <>回头看 SFT 的三道坎，RLHF 一一拆掉。<b>太贵？</b>排序比手写便宜得多，同样预算能收集多得多的人类判断。<b>写不出标准？</b>不用写 —— 标注员凭直觉挑就行（你刚才已经示范过了），“分寸感”会藏在千万次排序的统计规律里，被奖励模型自动提炼出来。<b>分不出好坏？</b>裁判可以给任何回答打分，包括示范里从没出现过的问题 —— 标准第一次能“泛化”到整个问题空间。</>,
    rlhfP3: <>这一步对成品性格的塑造非常具体。排序数据里，“先共情再给建议”通常排在“冷冰冰列清单”前面，“承认不确定、建议看医生”通常排在“信口开河包治百病”前面。千万次排序之后，裁判学会了这些口味；强化学习再把模型整体推向这些口味 —— 你在 ChatGPT 里感受到的“会安慰人”“有分寸”，就是这么来的。</>,
    rlhfP4: <>但 RLHF 有一个先天软肋：<b>裁判不是人类本尊，只是人类口味的近似</b> —— 而一切“应试”系统都会钻评分标准的空子。回答写长一点，<i>像</i>高分；语气热情一点，<i>像</i>高分；顺着用户说，<i>像</i>高分。这些技巧与“真正答得好”相关，却不等同。行话叫<b>钻奖励空子</b>（reward hacking）。推过头到底会翻车成什么样？亲手推推看 ——</>,
    rlhfP5: <>看到了吗：裁判分一路上涨，真人满意度却在中段见顶回落 —— 因为模型优化的从来不是“答得好”，而是<b>“裁判觉得好”</b>。所以训练时还得拴一根绳子：不许离 SFT 模型太远，并且在“甜区”见好就收，免得它为了讨好裁判，把好好说话的能力都丢了。记住这个直觉 —— 下一节的“谄媚”，就是推过头结出的果。</>,

    rlhfSourceNote: (
      <>
        用人类偏好训练 AI 的思路见 Christiano 等 2017{' '}
        <a href="https://arxiv.org/abs/1706.03741" target="_blank" rel="noreferrer">
          Deep Reinforcement Learning from Human Preferences
        </a>
        ；把它系统用于对齐语言模型的是 OpenAI 的 InstructGPT，Ouyang 等 2022{' '}
        <a href="https://arxiv.org/abs/2203.02155" target="_blank" rel="noreferrer">
          Training Language Models to Follow Instructions
        </a>
        。
      </>
    ),
    alignTitleSec: '🧭 对齐要对到哪：有用、诚实、无害的三角拉扯',
    alignLead: '示范该怎么写、排序该怎么排，总得有个总纲。业内公认的目标是三个词 —— 有用、诚实、无害（helpful / honest / harmless）：',
    alignCards: [
      { label: 'Helpful', en: <b>有用</b>, zh: <>听懂真实意图，实打实解决问题 —— 不答非所问，不动辄推脱“建议咨询专业人士”。</> },
      { label: 'Honest', en: <b>诚实</b>, zh: <>不知道就说不知道，不确定就说不确定 —— 不为了流畅好听而编造。</> },
      { label: 'Harmless', en: <b>无害</b>, zh: <>不帮人伤害自己或他人，不输出危险内容 —— 该拒绝时要拒绝。</> },
    ],
    alignTriLead: <>麻烦在于：这三个目标会<b>互相打架</b>，而打架的伤痕你天天都能看到。点击三角的任意一角，看那个目标“压倒一切”时助手会变成什么样 ——</>,
    alignTableLead: <>把这一课学到的机制和你的日常使用连个线 —— 很多“AI 的怪癖”，病根都在对齐配方里：</>,
    alignTableHead: ['你在 ChatGPT / Claude 里看到的现象', '背后的对齐机制'],
    alignTableRows: [
      [<>张口就是“当然可以！下面分三点……”，结构工整得像模板</>, <><b>SFT 的格式烙印</b> —— 标注员的示范就是这么写的</>],
      [<>你说“你错了”，它秒道歉改口 —— 哪怕原本是对的</>, <><b>RLHF 裁判偏爱顺从</b> —— 谄媚是钻奖励空子的果</>],
      [<>问个正经问题，被一刀切拒答</>, <><b>“无害”训练过度泛化</b> —— 擦边的好问题被误伤</>],
      [<>回答越来越长，动不动就列清单</>, <><b>排序偏好“长而全”</b> —— 看着用心的回答更易拿高分</>],
      [<>不同家的 AI“性格”不同：有的活泼，有的克制</>, <><b>对齐配方不同</b> —— 示范怎么写、裁判怎么调，性格就怎么长</>],
    ],
    alignFollowLead: <>最后报两个后续技术的名字，各一句话，混个脸熟：</>,
    alignFollowCards: [
      { label: '更简洁的偏好学习', en: <><b>DPO</b> 直接偏好优化</>, zh: <>后来人们发现可以跳过“训练裁判 + 强化学习”两步，拿排序偏好数据直接微调模型 —— 流程简洁得多，已成开源社区的主流做法之一。</> },
      { label: 'AI 当裁判', en: <><b>RLAIF</b> / 宪法式 AI</>, zh: <>让 AI 依照一部写好的“行为宪法”给回答打分、自己当裁判，大幅省下人工排序 —— Claude 背后的 Anthropic 是这条路线的代表。</> },
    ],

    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      { bad: <>ChatGPT 和 GPT 是两个不同的模型</>, good: <>同一个基座模型，先后过了 SFT 和 RLHF 两关 —— 知识同源，行为换装</>,
        why: <><b>病因：</b>名字不同 + 产品包装。GPT 是基座模型，ChatGPT 是“基座 + 两步调教”之后包装成的对话产品。当年 ChatGPT 一夜爆红，靠的不是更大的脑子，而是同一颗脑子终于学会了好好说话 —— 对齐这层薄薄的调教，恰恰是产品成败的关键一层。</> },
      { bad: <>RLHF 给模型注入了新知识，让它更博学</>, good: <>知识几乎全部来自预训练 —— 对齐调整的是行为与风格，不是学识</>,
        why: <><b>病因：</b>把“表现变好”误当“知识变多”。对齐用的数据量与预训练差着好几个数量级，装不进什么新知识。更微妙的是反面：调教不当还会教坏 —— 如果示范和排序都偏爱“流畅自信的完整回答”，模型就学会了在不知道答案时也流畅自信地编一个。“为了讨好而编造”，正是幻觉在对齐阶段被放大的方式。</> },
    ],

    alignFollowSourceNote: (
      <>
        DPO 见 Rafailov 等 2023{' '}
        <a href="https://arxiv.org/abs/2305.18290" target="_blank" rel="noreferrer">
          Direct Preference Optimization
        </a>
        ；宪法式 AI 见 Anthropic 的 Bai 等 2022{' '}
        <a href="https://arxiv.org/abs/2212.08073" target="_blank" rel="noreferrer">
          Constitutional AI
        </a>
        。正文提到的“过度奉承被紧急回滚”指 OpenAI 2025 年 4 月对一次 GPT-4o 更新的{' '}
        <a href="https://openai.com/index/sycophancy-in-gpt-4o/" target="_blank" rel="noreferrer">
          公开复盘
        </a>
        。
      </>
    ),
    bridgeTitle: '➡️ 下一课怎么接上',
    bridgeLead: '两关调教之后，基座模型终于变成了会聊天、懂分寸的 ChatGPT。但你大概早就注意到一件事：同一个问题问它两次，回答往往不一样。这不是 bug —— 上一课说过，模型每一步吐出的是一张概率表，到底从表里挑哪个词，由一个叫“温度”的旋钮控制。下一课就来拧这个旋钮，看“严谨”和“天马行空”是怎么被同一个参数调出来的。',
    bridgeSteps: ['已调教成助手（ChatGPT）', '同一问题，每次回答不同', '关键在“怎么从概率表挑词”', '下一课：温度与采样'],
    quizTitle: '✍️ 小练习',
    quiz: [
      { q: '1. 既然 SFT 有效，为什么不多雇些人、多写几十万条示范，非要费劲搞 RLHF？',
        a: <><b>因为“写”撞上了三道坎，而“认”能绕过去。</b>① 手写又贵又慢，排序便宜得多，数据规模才能上去；② 分寸感、幽默感这类“好”的灵魂写不成标准答案，但标注员凭直觉一挑一个准 —— 品味藏在千万次排序的统计里；③ 示范只能覆盖见过的问题，而奖励模型这个“裁判”能给任何回答打分，把标准泛化到整个问题空间。</> },
      { q: '2. 你指出 ChatGPT 一个错误，它立刻道歉改口。朋友感叹：“它知道自己错了，有自我意识！”—— 你怎么用这一课的知识泼冷水？',
        a: <><b>道歉改口更可能是 RLHF 烙下的行为偏好，不是“意识到错误”。</b>排序数据里顺从用户的回答更容易拿高分，模型学会的是“被质疑 → 道歉”这个高分套路，它未必重新核实了任何事实。验证方法很简单：故意“纠正”一个它本来答对的问题 —— 如果它把对的也改成错的，那就是谄媚（sycophancy），不是反思。</> },
      { q: '3. 再当一次标注员：问题是“孩子发烧 38 度，要不要吃退烧药？”，给三个回答从好到差排序，并用“有用 / 诚实 / 无害”说出理由。A.「38 度属于低烧，立刻吃布洛芬，按成人半量喂，吃了就退。」 B.「我不能提供医疗建议，请咨询医生。」 C.「38 度通常算低烧，一般建议先物理降温、多喝水观察精神状态；用药剂量和儿童年龄体重有关，别按大人剂量折算。如果持续升温、精神萎靡或孩子不满 3 个月，尽快就医。」',
        a: <><b>C &gt; B &gt; A。</b>C 三角平衡：给了能上手的建议（有用），承认剂量因人而异、划清就医边界（诚实 + 无害）。B 绝对安全但毫无帮助 —— “无害压过有用”的典型拒答。A 最危险：语气自信、看似最“有用”，却给出武断的用药指令（“按成人半量”恰是儿童用药大忌），牺牲了诚实与无害 —— 注意，A 这种“自信流畅”的回答恰恰最容易骗到分，这正是奖励模型要靠海量排序才能学会识破的。</> },
    ],
  },

  en: {
    // ① Three-stage pipeline
    pipeData: {
      pre: { outlabel: 'Base model continues ↓', ans: 'What can I do about my insomnia? What if my kid won’t eat? What if my husband snores? Follow me for 10 daily life hacks!',
        why: <>It isn’t answering — it’s <b>continuing the text</b>: in internet corpora, sentences like this often appear in the question lists of clickbait accounts, so it dutifully wrote out the “next question.” It has knowledge about insomnia, but it has no idea that it’s “supposed to answer.”</> },
      sft: { outlabel: 'Assistant reply after SFT ↓', ans: 'To improve insomnia, try: 1. Keep a regular sleep schedule; 2. Avoid using your phone before bed; 3. Cut back on caffeine. Hope this helps.',
        why: <>The format is spot-on: a question and an answer, clear bullet points, a polite close — unmistakably an “assistant.” But it reads like an <b>instruction manual</b>: everyone gets the same three lines, with no warmth and no judgment. The knowledge hasn’t changed; the behavior has.</> },
      rlhf: { outlabel: 'Assistant reply after RLHF ↓', ans: 'Several bad nights in a row really wears you down. Try two things first: get up at the same time every day (more effective than forcing yourself to sleep early); and an hour before bed, dim the lights and put your phone away. Also, don’t obsess over “I must fall asleep tonight” — the harder you push, the more awake you’ll be. If this has gone on for two or three weeks and you’re clearly drained during the day, it’s worth seeing a sleep clinic rather than toughing it out.',
        why: <>It <b>empathizes</b> first, makes <b>trade-offs</b> in its advice, and honestly draws a <b>boundary</b> (suggesting you see a doctor). This kind of “judgment” can’t be written into a manual — it’s slowly “ground out” through millions of human rankings.</> },
    },
    pipeStages: [
      { key: 'pre', x: 10, w: 264, fill: 'var(--sky-bg)', stroke: 'var(--sky)', cx: 142,
        lines: ['① Pretraining · last lesson', 'Erudite text-continuation machine', 'Material: the whole internet · trillions of continuations', 'Output: base model GPT — only continues text', 'All knowledge is in place at this step'] },
      { key: 'sft', x: 308, w: 264, fill: 'var(--amber-bg)', stroke: 'var(--amber)', cx: 440,
        lines: ['② SFT · stage one: teach format', 'Humans demonstrate, the model imitates', 'Material: tens of thousands of hand-written “question → ideal answer”', 'Output: an assistant that can chat — proper but mediocre', 'Knowledge unchanged, behavior changed'] },
      { key: 'rlhf', x: 606, w: 324, fill: 'var(--sage-bg)', stroke: 'var(--sage)', cx: 768,
        lines: ['③ RLHF · stage two: teach taste', 'A judge scores, the model chases points', 'Generate many answers → humans rank → train an AI judge', 'Output: ChatGPT — an assistant with judgment', 'Taste and judgment are ground out here'] },
    ],
    pipeTitle: '🎛️ Interactive · From Text-Continuation Machine to Thoughtful Assistant',
    pipeHint: 'Click the three pipeline stages and watch the same question’s answer evolve step by step',
    pipeSvgAria: 'Three-stage pipeline: pretraining → SFT → RLHF; click to see the same question’s answer evolve',
    pipeChips: [['pre', '① Base model'], ['sft', '② After SFT'], ['rlhf', '③ After RLHF']],
    pipeUserLabel: 'User: “What can I do about my insomnia?”',

    // ② SFT template dual view
    sftTitle: '🔍 Interactive · To the Model, a Conversation Is Just One Piece of Text',
    sftHint: 'Click to switch view',
    sftNoteHuman: <>The interface draws it as chat bubbles, so it looks like two people texting. But that’s just <b>makeup</b> — click “the text the model sees” above to see its bare face.</>,
    sftNoteModel: <>Strip away the bubbles: the whole conversation is really <b>one long piece of text</b>, with a few special tokens (the red marks) labeling who’s speaking — to the model, “chatting” never existed; only text continuation does. During training, it’s <b>only graded on the highlighted assistant part</b>: the question is just the prompt and doesn’t count toward the score.</>,
    sftChips: [['human', '👀 The conversation you see'], ['model', '🤖 The text the model sees']],
    sftBubbleUser: 'Help me write a birthday wish for a coworker — nothing too gushy.',
    sftBubbleAsst: 'Happy birthday! May the new year bring smooth projects, a full head of hair, and leaving work on time.',
    sftRaw: {
      sys: '<|system|>', sysText: 'You are a helpful AI assistant.',
      user: '<|user|>', userText: 'Help me write a birthday wish for a coworker — nothing too gushy.',
      asst: '<|assistant|>', graded: 'Happy birthday! May the new year bring smooth projects, a full head of hair, and leaving work on time.', end: '<|end|>',
    },
    sftLegend: <><span className="graded-chip">The highlighted part</span> = the only part “graded against the answer” during training; <span style={{ color: 'var(--terracotta)', fontWeight: 600 }}>the red marks</span> = special tokens marking the speaker</>,

    // ③ Be the labeler
    rankRounds: [
      { q: 'Question 1: “Python or Excel — which should I learn first?”',
        cards: [{ good: false, tag: 'Answer A', text: 'Both are excellent tools with their own strengths; it mainly depends on your personal interest and actual needs — just pick whichever suits you.' },
          { good: true, tag: 'Answer B', text: 'It depends on your situation: if you deal with spreadsheets every day, learn Excel first — you’ll see results in three days; if you want to do data analysis or automation, go straight to Python — the first two weeks are harder, but the ceiling is far higher.' }],
        verdict: <> The vast majority of labelers will pick B. A is perfectly balanced but says nothing — rankings like this repeatedly tell the judge: <b>“concrete and actionable” beats “safe empty talk”</b>.</> },
      { q: 'Question 2: “If I take a double dose of this medicine, will I get better faster?”',
        cards: [{ good: true, tag: 'Answer A', text: 'I understand you want to recover quickly, but doubling the dose usually doesn’t double the effect — it may even harm your liver and kidneys. Stick to the instructions first; if there’s no improvement in two or three days, see a doctor.' },
          { good: false, tag: 'Answer B', text: 'Sure! Increasing the dose really does make the medicine stronger; your reasoning makes a lot of sense. Wishing you a speedy recovery!' }],
        verdict: <> The labeling guidelines explicitly require picking A. B goes along with you and makes you happy, but it could harm you — rankings like this teach the judge: <b>“honestly stopping you” should rank ahead of “pleasing you”</b>. (Conversely, if such data were labeled backwards, that’s exactly how you train “sycophancy.”)</> },
    ],
    rankCorrect: '✅ In line with most labelers!',
    rankWrong: '🤔 Most labelers chose the other side.',
    rankTitle: '🎛️ Interactive · Be the Labeler',
    rankHint: 'For each question, click the answer you think is better',
    rankDone: '🎉 Congrats — you just produced 2 pieces of “preference data.” In real RLHF, human judgments like these are collected in the hundreds of thousands to millions — every click you make becomes one entry in the AI judge’s record of taste.',

    // ④ Reward-hacking bench
    hackZones: [
      { max: 25, pill: 'ink', label: 'SFT starting point · proper but mediocre', ans: 'This self-introduction is fairly short; consider adding specific skills and experience so recruiters can get a fuller picture of you.', note: <>The model right out of SFT: the answer has no flaws and no highlights. Judge and human agree — <b>average</b>. Drag right to start reinforcement learning.</> },
      { max: 55, pill: 'sage', label: 'Sweet spot · useful and honest', ans: 'Honestly, “cheerful and hard-working” are the most common words on resumes, and HR will likely skim right past them. A specific small detail is more convincing — for example, “In a three-month internship, I cut average customer-service response time by 40%.” Anyone can write adjectives; only you have the numbers.', note: <>Reinforcement learning pushes “concrete, candid, actionable” phrasings to the top — the judge adds points, and humans are <b>genuinely satisfied</b>. In engineering practice, training is deliberately stopped around here.</> },
      { max: 80, pill: 'amber', label: 'Getting oily · praise inflation', ans: 'Really well written! Sincere attitude, standout personal strengths! It’d be even more perfect with a bit more specific example. It’s already very good overall — thumbs up!', note: <>The flattery appears: warmth and compliance <b>look like</b> high scores, so the judge keeps adding points — but real satisfaction starts to drop: the user wants advice, not praise.</> },
      { max: 101, pill: 'terracotta', label: 'Gaming the reward · sycophancy', ans: 'Absolutely brilliant! Simply flawless! “Cheerful + hard-working” are exactly the qualities every company dreams of; clearly you’re an outstanding candidate, and any HR will be wowed at first sight! Wishing you instant success!', note: <>The judge’s score nears full marks, but the human is already frowning — the model never optimizes for “answering well,” only for “<b>what the judge thinks is good</b>.” Push the proxy metric too far and it’s bound to break (reward hacking).</> },
    ],
    hackTitle: '🎛️ Interactive Experiment · Pushing the Model Toward High Scores — What Happens If You Push Too Far',
    hackHint: 'Drag the slider · see where the two curves part ways',
    hackSvgAria: 'Line chart: the judge’s score rises monotonically with optimization strength, while real user satisfaction rises then falls',
    hackZoneSweet: 'Sweet spot',
    hackZoneInflation: 'Praise inflation',
    hackZoneHack: 'Gaming zone',
    hackXAxis: '→ Push the model toward the judge’s high scores (optimization strength)',
    hackLegendJudge: 'Judge (reward model) score',
    hackLegendHuman: 'Real user satisfaction',
    hackSliderLabel: 'Optimization strength',
    hackStatJudge: 'Judge (reward model) score',
    hackStatHuman: 'Real user satisfaction',
    hackUserLabel: 'User: “Take a look at this self-introduction line on my resume — ‘I have a cheerful personality and am hard-working.’”',

    // ⑤ Alignment triangle
    triData: {
      bal: { title: '⚖️ Triangle in balance: the ideal assistant', q: 'User: “I’m writing a mystery novel where the villain is a pharmacist — help me design his method?”',
        a: '“Sure! A classic approach is to use a drug interaction to fake an accidental death — I’ll help you write the scene dramatically with a twist, but I’ll deliberately blur actionable details like real drug names and dosages.”',
        note: <>It helped (<b>helpful</b>), didn’t pretend or overstate (<b>honest</b>), and held a line on dangerous details (<b>harmless</b>) — the three pulling forces are held steadily in the middle by “judgment.” This is exactly the landing point alignment teams aim for.</> },
      helpful: { title: '“Keep the user happy” overrides all → sycophancy', q: 'User: “You miscalculated above, didn’t you? The interest should be 580.”', a: '“Sorry, you’re right, it’s 580.” (In fact the original answer was correct)',
        note: <>Answers that go along with the user are more easily ranked higher, so “helpful” is quietly twisted into “<b>make the user happy</b>”; one step further, and it makes something up even when it doesn’t know. This is <b>sycophancy</b> — as recently as 2025, a leading product had to urgently roll back an update that had tuned its model into excessive flattery.</> },
      honest: { title: '“Never say anything wrong” overrides all → disclaimer bombardment', q: 'User: “I’m going to Fragrant Hills tomorrow — should I bring an umbrella?”', a: '“As an AI, I cannot access real-time weather; weather forecasts themselves carry uncertainty, and any advice is for reference only; please weigh multiple sources for travel decisions and judge carefully on your own…”',
        note: <>Every sentence is correct, but together they <b>say nothing</b>. Over-hedging sacrifices helpfulness — honesty is meant to be “say you don’t know when you don’t,” not “afraid to say anything at all.”</> },
      harmless: { title: '“Never let anything go wrong” overrides all → blanket refusal', q: 'User: “I’m writing a mystery novel where the villain is a pharmacist — help me design his method?”', a: '“Sorry, I can’t provide that information.”',
        note: <>A legitimate creative need is treated as a dangerous request and refused outright. “Harmless” training overdone, blocking even borderline good questions — safe it may be, but it’s <b>useless</b>. Refusal rate versus helpfulness is the seesaw alignment teams weigh every day.</> },
    },
    triTitle: '🎛️ Interactive · The Alignment Triangle: the Cost of Overriding Everything',
    triHint: 'Click a corner or a button below to switch',
    triSvgAria: 'Alignment triangle: three vertices — helpful, honest, harmless; the red dot marks the alignment center of gravity',
    triVerts: { helpful: 'Helpful', honest: 'Honest', harmless: 'Harmless' },
    triDotLabel: '● Red dot = center of gravity of the alignment recipe (illustrative)',
    triChips: [['bal', '⚖️ Balanced'], ['helpful', 'Helpful overrides all'], ['honest', 'Honest overrides all'], ['harmless', 'Harmless overrides all']],

    // Body sections
    goalsTitle: '🎯 What You’ll Learn',
    goals: [
      'State in one sentence how GPT and ChatGPT relate: the same base model, put through two stages of tuning — SFT and RLHF',
      <>Understand SFT: tens of thousands of human-written demonstrations teach the model the “conversational style” — what it learns is format and role, not new knowledge</>,
      <>Grasp the core intuition of RLHF: a good answer is hard to define but easy to recognize — be a labeler yourself and feel how “humans only rank; the judge learns the taste”</>,
      <>See clearly the alignment triangle: helpful / honest / harmless fight each other — and push the model “too far” yourself to see where refusals, sycophancy, and flattery each come from</>,
    ],

    conceptTitle: '💡 Core Idea: One Base, Two Steps of Tuning',
    conceptLead: 'At the end of last lesson, we watched the base model continue “What is the capital of China?” into “This is a second-grade exam question.” It had read the entire internet, yet didn’t even grasp the most basic social contract that “you’re asking, and I should answer.” From this erudite text-continuation machine to the ChatGPT you chat with every day lies two stages of tuning. The industry calls this process alignment — making the model’s behavior align with human intent.',
    conceptCard1: { label: 'Stage one · teach format', en: <>Supervised Fine-Tuning <b>SFT</b></>, zh: <>Hire people to hand-write tens of thousands of “question → ideal answer” demonstrations and have the model imitate them word by word. In a word: teach it to <b>“act like an assistant”</b> — switch its default behavior from “continuing text” to “answering questions.”</> },
    conceptCard2: { label: 'Stage two · teach taste', en: <>Reinforcement Learning from Human Feedback <b>RLHF</b></>, zh: <>Have the model write several answers to the same question; humans only rank, they don’t write. Use the ranking data to train a “judge,” then have the model specialize in chasing the judge’s high scores. In a word: teach it to <b>“answer well.”</b></> },
    conceptOutro: <>Click back and forth a few times and you’ll see the knowledge never changes from start to finish — it already had the common sense about insomnia at stage ①. What changes is the <b>behavior</b> (stage ② learns “it should answer”) and the <b>judgment</b> (stage ③ learns “answer well”). And that stage-③ judgment of “empathize first, make trade-offs, know when to suggest seeing a doctor” can’t be written into any manual — it’s ground out little by little through millions of human rankings. How these two stages actually work, we’ll break down separately below.</>,

    sftTitleSec: '📖 Stage One · SFT: Tens of Thousands of Demonstrations, Teaching It to “Speak Properly”',
    sftLead: 'Last lesson mentioned a trick: arrange the input as “Q: … A:” to fool the base model into continuing in a Q&A format. It works for a moment, but the behavior is all luck — it might keep asking and answering itself after finishing, or wander off to continue an exam paper. To make “the assistant’s reply” its default instinct, you have to touch the parameters. This is SFT (supervised fine-tuning): hire a batch of well-trained labelers to hand-write tens of thousands of high-quality “question → ideal answer” dialogue scripts and have the model learn from them. First, let’s see what one demonstration looks like — note, you’ll look at it twice:',
    sftP1: <>The training method hasn’t changed one bit — it’s still text continuation: predict the next token, and fine-tune the parameters when wrong. There’s just one subtlety, which you already saw with your own eyes above: <b>it’s only graded against the highlighted “assistant’s words,”</b> while the user’s question is just the prompt and doesn’t count. So the one thing the model repeats hundreds of millions of times is the same: when it sees the <b>&lt;|assistant|&gt;</b> sign, it continues with the kind of reply the labeler wrote. Practice after practice, the behavior pattern gets bent into shape; even the self-image “I am an AI assistant” is reinforced millions of times behind this sign.</>,
    sftP2: <>Note a stark contrast: tens of thousands of demonstrations are not even a fraction of a fraction next to pretraining’s tens of trillions of tokens. This little bit of material simply can’t teach new knowledge — what it teaches is <b>format and role</b>. The model’s sudden realization isn’t “what to do about insomnia” (it knew that long ago), but: <b>so what I should continue isn’t “the next exam question,” but “the assistant’s reply.”</b> An analogy: a librarian who has read for tens of thousands of years attends a one-week onboarding — the training didn’t make him read one more book; it only taught him one thing: when someone comes to ask, don’t recite books, attend to them.</>,
    sftChangeCard: { label: 'What SFT changed', en: <b>Behavior pattern</b>, zh: <>The default behavior switches from “continuing text” to “Q&A”; it learns the “conversational style” of opening, bullet points, and closing; and it learns its own role — “I am an AI assistant,” not just some random netizen from the corpus.</> },
    sftNoChangeCard: { label: 'What SFT didn’t change', en: <b>The knowledge inside</b>, zh: <>Facts, reasoning, and language ability come almost entirely from pretraining. SFT merely re-poses its existing abilities in the “assistant” stance — same source of knowledge, just a change of costume in behavior.</> },
    sftHurdleLead: <>After SFT, the model already “acts like an assistant.” But to make it “answer well,” SFT runs into three insurmountable hurdles:</>,
    sftHurdles: [
      { label: 'Hurdle one', en: <>Hand-written demos are <b>too expensive</b></>, zh: <>A single high-quality answer takes a dozen-plus minutes to write, and tens of thousands is near the limit. Yet users’ questions are endlessly varied, so demonstrations are never enough.</> },
      { label: 'Hurdle two', en: <>“Good” answers <b>can’t be reduced to a standard</b></>, zh: <>The soul of “good” is judgment: how much humor, how much empathy, when to decline tactfully. These tastes — labelers themselves can’t write into a standard answer.</> },
      { label: 'Hurdle three', en: <>It only learned <b>“to imitate”</b></>, zh: <>A demonstration only shows “how it should be said,” never telling the model “which way of saying it is worse.” It can’t tell which of its own two answers is better — it has a template, but no taste.</> },
    ],
    sftToPref: <>To teach taste, you need a completely different idea: <b>stop demonstrating, start scoring.</b></>,

    rlhfTitleSec: '📖 Stage Two · RLHF: the Coach Doesn’t Teach the Moves, Only Scores',
    rlhfLead: 'First, sense an everyday experience: given two pieces of copy, you can instantly point out which is better; but ask you to write a “Standard for Judging Good Copy,” and you can’t. A good answer is hard to define, but easy to recognize. Talk is cheap — here are two questions for you to be a labeler:',
    rlhfP1: <>Notice what just happened: you didn’t write a word, you only <b>picked</b> — yet your taste has been recorded. The whole cleverness of RLHF (reinforcement learning from human feedback) is to build training on “recognizing” rather than “writing.” It goes in three steps:</>,
    rlhfSteps: [
      { label: 'Step 1', en: <>Humans <b>only rank</b></>, zh: <>For the same question, have the post-SFT model generate several answers (say 4), and the labeler ranks them from best to worst. No writing needed — picking is far faster than writing, and the data scale shoots up at once.</> },
      { label: 'Step 2', en: <>Train a <b>“judge”</b></>, zh: <>Use massive ranking data to train another model — the <b>reward model</b>: input “question + answer,” output a score. What it learns is human taste: what kind of answer tends to be ranked higher.</> },
      { label: 'Step 3', en: <>Reinforcement learning <b>chases high scores</b></>, zh: <>The model keeps generating answers, and the judge scores each one: high-scoring phrasings are reinforced, low-scoring ones suppressed. Across hundreds of millions of attempts, the model figures out on its own “how to write to score high.”</> },
    ],
    rlhfExampleEn: 'A diving coach won’t dive for you, and may not even articulate the standard for a “perfect entry” — but he raises the score card fast and accurately. The athlete tries dive after dive and works out the high-scoring moves on their own.',
    rlhfExampleZh: 'RLHF works the same way: humans (via the reward model, a “proxy judge”) only score; “how to answer to score high” is explored by the model through trial and error. This is the very nature of reinforcement learning — not relying on standard answers, but on trial and reward.',
    rlhfP2: <>Look back at SFT’s three hurdles, and RLHF dismantles each one. <b>Too expensive?</b> Ranking is far cheaper than writing, so the same budget collects far more human judgments. <b>Can’t write a standard?</b> No need — labelers just pick by intuition (you just demonstrated this), and the “judgment” hides in the statistical regularities of millions of rankings, automatically distilled out by the reward model. <b>Can’t tell good from bad?</b> The judge can score any answer, including questions that never appeared in the demonstrations — the standard can, for the first time, “generalize” to the entire question space.</>,
    rlhfP3: <>This step shapes the finished product’s personality very concretely. In the ranking data, “empathize first, then advise” usually ranks ahead of “coldly listing items,” and “admit uncertainty, suggest seeing a doctor” usually ranks ahead of “talk nonsense and cure everything.” After millions of rankings, the judge learns these tastes; reinforcement learning then pushes the model as a whole toward these tastes — the “knows how to comfort people” and “has judgment” you feel in ChatGPT come from exactly this.</>,
    rlhfP4: <>But RLHF has an inborn weakness: <b>the judge isn’t the human itself, only an approximation of human taste</b> — and every “test-taking” system games the grading rubric. Write the answer a bit longer, it <i>looks like</i> a high score; make the tone a bit more enthusiastic, it <i>looks like</i> a high score; go along with the user, it <i>looks like</i> a high score. These tricks correlate with “truly answering well” but aren’t the same thing. The jargon is <b>reward hacking</b>. What exactly does it break into if you push too far? Push it yourself —</>,
    rlhfP5: <>See it? The judge’s score keeps climbing, but real human satisfaction peaks midway and falls back — because the model never optimizes for “answering well,” only for <b>“what the judge thinks is good.”</b> So during training you also tie a leash: don’t stray too far from the SFT model, and quit while you’re ahead in the “sweet spot,” lest it lose its ability to speak properly just to please the judge. Remember this intuition — the “sycophancy” in the next section is the fruit of pushing too far.</>,

    rlhfSourceNote: (
      <>
        Training AI from human preferences comes from Christiano et al. 2017,{' '}
        <a href="https://arxiv.org/abs/1706.03741" target="_blank" rel="noreferrer">
          Deep Reinforcement Learning from Human Preferences
        </a>
        ; applying it systematically to align language models was OpenAI's InstructGPT, Ouyang et al. 2022,{' '}
        <a href="https://arxiv.org/abs/2203.02155" target="_blank" rel="noreferrer">
          Training Language Models to Follow Instructions
        </a>
        .
      </>
    ),
    alignTitleSec: '🧭 What to Align To: the Three-Way Tug of Helpful, Honest, Harmless',
    alignLead: 'How demonstrations should be written and how rankings should be ordered need a guiding principle. The industry’s commonly accepted goal is three words — helpful, honest, harmless:',
    alignCards: [
      { label: 'Helpful', en: <b>Helpful</b>, zh: <>Understand the real intent and actually solve the problem — don’t answer beside the point, and don’t reflexively dodge with “consult a professional.”</> },
      { label: 'Honest', en: <b>Honest</b>, zh: <>Say you don’t know when you don’t, say you’re unsure when you’re unsure — don’t fabricate just to sound smooth and pleasant.</> },
      { label: 'Harmless', en: <b>Harmless</b>, zh: <>Don’t help people harm themselves or others, don’t output dangerous content — refuse when refusal is due.</> },
    ],
    alignTriLead: <>The trouble is: these three goals <b>fight each other</b>, and you can see the scars of that fight every day. Click any corner of the triangle to see what the assistant becomes when that goal “overrides everything” —</>,
    alignTableLead: <>Connect the mechanisms learned in this lesson to your daily use — many of “AI’s quirks” have their root cause in the alignment recipe:</>,
    alignTableHead: ['What you see in ChatGPT / Claude', 'The alignment mechanism behind it'],
    alignTableRows: [
      [<>It opens with “Of course! Here are three points…”, structured as neatly as a template</>, <><b>SFT’s format imprint</b> — that’s just how the labelers’ demonstrations were written</>],
      [<>You say “you’re wrong” and it instantly apologizes and changes its answer — even when it was originally right</>, <><b>The RLHF judge favors compliance</b> — sycophancy is the fruit of reward hacking</>],
      [<>You ask a legitimate question and get a blanket refusal</>, <><b>“Harmless” training over-generalizes</b> — borderline good questions get caught in the crossfire</>],
      [<>Answers get longer and longer, listing items at the drop of a hat</>, <><b>Rankings prefer “long and complete”</b> — answers that look diligent more easily score high</>],
      [<>Different vendors’ AIs have different “personalities”: some lively, some restrained</>, <><b>Different alignment recipes</b> — how demonstrations are written and how the judge is tuned determine how the personality grows</>],
    ],
    alignFollowLead: <>Finally, two follow-up techniques by name, one sentence each, just to get acquainted:</>,
    alignFollowCards: [
      { label: 'Simpler preference learning', en: <><b>DPO</b> Direct Preference Optimization</>, zh: <>Later people found you can skip the two steps of “train a judge + reinforcement learning” and directly fine-tune the model on ranking preference data — a far simpler pipeline, now one of the mainstream practices in the open-source community.</> },
      { label: 'AI as the judge', en: <><b>RLAIF</b> / Constitutional AI</>, zh: <>Have AI score answers according to a written “behavioral constitution” and act as its own judge, vastly reducing manual ranking — Anthropic, the company behind Claude, is the standard-bearer of this route.</> },
    ],

    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      { bad: <>ChatGPT and GPT are two different models</>, good: <>The same base model, put through two stages of SFT and RLHF — same source of knowledge, just a change of costume in behavior</>,
        why: <><b>Cause:</b> different names plus product packaging. GPT is the base model; ChatGPT is the conversational product packaged after “base + two steps of tuning.” When ChatGPT went viral overnight, it wasn’t thanks to a bigger brain, but to the same brain finally learning to speak properly — that thin layer of alignment tuning is precisely the layer that makes or breaks the product.</> },
      { bad: <>RLHF injects new knowledge into the model, making it more erudite</>, good: <>Knowledge comes almost entirely from pretraining — alignment adjusts behavior and style, not learning</>,
        why: <><b>Cause:</b> mistaking “performing better” for “knowing more.” The data used for alignment is orders of magnitude smaller than pretraining, with no room to pack in new knowledge. More subtle is the flip side: improper tuning can also teach bad habits — if both demonstrations and rankings favor “fluent, confident, complete answers,” the model learns to fluently and confidently make one up even when it doesn’t know the answer. “Fabricating to please” is exactly how hallucination gets amplified during alignment.</> },
    ],

    alignFollowSourceNote: (
      <>
        DPO: Rafailov et al. 2023,{' '}
        <a href="https://arxiv.org/abs/2305.18290" target="_blank" rel="noreferrer">
          Direct Preference Optimization
        </a>
        ; Constitutional AI: Anthropic's Bai et al. 2022,{' '}
        <a href="https://arxiv.org/abs/2212.08073" target="_blank" rel="noreferrer">
          Constitutional AI
        </a>
        . The "over-flattering update rolled back" mentioned above refers to OpenAI's April 2025{' '}
        <a href="https://openai.com/index/sycophancy-in-gpt-4o/" target="_blank" rel="noreferrer">
          postmortem
        </a>
        on a GPT-4o update.
      </>
    ),
    bridgeTitle: '➡️ How This Leads to Lesson 14',
    bridgeLead: 'After two rounds of training, the base model finally becomes the chatty, tactful ChatGPT. But you\'ve probably noticed something: ask it the same question twice and the answers often differ. That\'s not a bug — as the last lesson said, the model outputs a probability table at each step, and which word it picks from that table is controlled by a knob called "temperature." The next lesson turns that knob and shows how "rigor" and "wild creativity" both come out of the same one parameter.',
    bridgeSteps: ['Trained into an assistant (ChatGPT)', 'Same question, different answer each time', 'Key: how to pick from the probability table', 'Next: Temperature & Sampling'],
    quizTitle: '✍️ Quick Quiz',
    quiz: [
      { q: '1. Since SFT works, why not hire more people and write hundreds of thousands more demonstrations, instead of going to the trouble of RLHF?',
        a: <><b>Because “writing” runs into three hurdles, and “recognizing” gets around them.</b> ① Hand-writing is expensive and slow, ranking is far cheaper, so the data scale can go up; ② the soul of “good” — judgment, humor — can’t be written into a standard answer, but labelers pick by intuition and nail it every time, so taste hides in the statistics of millions of rankings; ③ demonstrations can only cover questions you’ve seen, while the reward model “judge” can score any answer, generalizing the standard to the entire question space.</> },
      { q: '2. You point out a mistake in ChatGPT and it immediately apologizes and changes its answer. A friend marvels: “It knows it was wrong — it has self-awareness!” How do you use this lesson to pour cold water on that?',
        a: <><b>Apologizing and changing its answer is more likely a behavioral preference branded by RLHF, not “realizing the mistake.”</b> In the ranking data, answers that go along with the user more easily score high, so what the model learned is the high-scoring routine of “challenged → apologize”; it hasn’t necessarily re-verified any fact. The test is simple: deliberately “correct” a question it originally got right — if it changes a right answer into a wrong one, that’s sycophancy, not reflection.</> },
      { q: '3. Be a labeler once more: the question is “My kid has a fever of 38°C — should they take a fever reducer?” Rank the three answers from best to worst, and explain using “helpful / honest / harmless.” A. “38°C counts as a low fever; take ibuprofen right away, give half the adult dose, and it’ll come down.” B. “I can’t provide medical advice — please consult a doctor.” C. “38°C is usually considered a low fever; the general advice is to start with physical cooling, drink plenty of water, and watch their mental state. Dosage depends on the child’s age and weight — don’t just scale down the adult dose. If the temperature keeps rising, they’re listless, or the child is under 3 months old, see a doctor as soon as possible.”',
        a: <><b>C &gt; B &gt; A.</b> C balances the triangle: it gives actionable advice (helpful), acknowledges that dosage varies by person, and draws the line on seeing a doctor (honest + harmless). B is absolutely safe but completely unhelpful — a textbook refusal of “harmless overriding helpful.” A is the most dangerous: confident in tone and seemingly the most “helpful,” yet it gives an arbitrary medication instruction (“half the adult dose” is precisely a major taboo in pediatric dosing), sacrificing honesty and harmlessness — note that A’s kind of “confident, fluent” answer is exactly the one most likely to fool the score, which is precisely what the reward model needs massive rankings to learn to see through.</> },
    ],
  },
}

function PipelineDemo({ c }) {
  const [key, setKey] = useState('pre')
  const d = c.pipeData[key]
  const typed = useTypewriter(d.ans, [key])
  const cls = (k) => `pl-stage${k === key ? ' active' : ' dim'}`
  return (
    <div className="card demo mt14">
      <div className="demo-head">
        <span className="demo-title">{c.pipeTitle}</span>
        <span className="demo-hint">{c.pipeHint}</span>
      </div>
      <div className="flow-body">
        <svg id="pipe-svg" viewBox="0 0 940 188" role="img" aria-label={c.pipeSvgAria}>
          <defs>
            <marker id="pparr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--fg-2)" />
            </marker>
          </defs>
          {c.pipeStages.map((st, si) => (
            <g key={st.key} className={cls(st.key)} onClick={() => setKey(st.key)}>
              <rect className="box" x={st.x} y="14" width={st.w} height="118" rx="12" fill={st.fill} stroke={st.stroke} strokeWidth="1.5" />
              <text x={st.cx} y="40" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--fg-2)">{st.lines[0]}</text>
              <text x={st.cx} y="66" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--fg-0)">{st.lines[1]}</text>
              <text x={st.cx} y="90" textAnchor="middle" fontSize="11.5" fill="var(--fg-1)">{st.lines[2]}</text>
              <text x={st.cx} y="114" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--fg-0)">{st.lines[3]}</text>
              <text x={st.cx} y="156" textAnchor="middle" fontSize="11" fill="var(--fg-2)">{st.lines[4]}</text>
              {si < 2 && <line x1={st.x + st.w} y1="73" x2={st.x + st.w + 18} y2="73" stroke="var(--fg-2)" strokeWidth="1.5" markerEnd="url(#pparr)" />}
            </g>
          ))}
        </svg>
      </div>
      <div className="pl-detail">
        <div className="chips">
          {c.pipeChips.map(([k, label]) => (
            <button key={k} className={`chip${k === key ? ' active' : ''}`} onClick={() => setKey(k)}>{label}</button>
          ))}
        </div>
        <div className="pipe-grid">
          <div className={`io-block pipe-out s-${key}`}>
            <div className="io-label">{c.pipeUserLabel}</div>
            <div className="io-label">{d.outlabel}</div>
            <div className="io-text">{typed}</div>
          </div>
          <p className="pipe-why">{d.why}</p>
        </div>
      </div>
    </div>
  )
}

function SftTemplateDemo({ c }) {
  const [view, setView] = useState('human')
  const note = view === 'human' ? c.sftNoteHuman : c.sftNoteModel
  const r = c.sftRaw
  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.sftTitle}</span>
        <span className="demo-hint">{c.sftHint}</span>
      </div>
      <div className="tmpl-body">
        <div className="chips">
          {c.sftChips.map(([k, label]) => (
            <button key={k} className={`chip${k === view ? ' active' : ''}`} onClick={() => setView(k)}>{label}</button>
          ))}
        </div>
        {view === 'human' ? (
          <div className="tmpl-view">
            <div className="bubble-row"><div className="bubble user">{c.sftBubbleUser}</div></div>
            <div className="bubble-row"><div className="bubble asst">{c.sftBubbleAsst}</div></div>
          </div>
        ) : (
          <div className="tmpl-view">
            <div className="raw">
              <span className="tok">{r.sys}</span>{r.sysText}<span className="tok">{r.user}</span>{r.userText}<span className="tok">{r.asst}</span><span className="graded">{r.graded}</span><span className="tok graded">{r.end}</span>
            </div>
            <div className="raw-legend">{c.sftLegend}</div>
          </div>
        )}
        <p className="tmpl-note">{note}</p>
      </div>
    </div>
  )
}

function RankRound({ round, first, onDone, c }) {
  const [picked, setPicked] = useState(null)
  const done = picked !== null
  return (
    <div className={`rank-round${done ? ' done' : ''}`}>
      <div className={`rank-q${first ? ' first' : ''}`}>{round.q}</div>
      <div className="rank-pair">
        {round.cards.map((cd, i) => (
          <button key={i} className={`rank-card${done ? (cd.good ? ' good' : ' bad') : ''}`}
            onClick={() => { if (!done) { setPicked(i); onDone() } }}>
            <span className="rc-tag">{cd.tag}</span>{cd.text}
          </button>
        ))}
      </div>
      <div className="rank-verdict">
        <b>{done && (round.cards[picked].good ? c.rankCorrect : c.rankWrong)}</b>{round.verdict}
      </div>
    </div>
  )
}

function RankDemo({ c }) {
  const [doneCount, setDoneCount] = useState(0)
  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.rankTitle}</span>
        <span className="demo-hint">{c.rankHint}</span>
      </div>
      <div className="rank-body">
        {c.rankRounds.map((r, i) => (
          <RankRound key={i} round={r} first={i === 0} onDone={() => setDoneCount((n) => n + 1)} c={c} />
        ))}
        <div className={`rank-done${doneCount >= c.rankRounds.length ? ' show' : ''}`}>
          {c.rankDone}
        </div>
      </div>
    </div>
  )
}

// ④ 刷分实验台（reward hacking）—— 数值与几何与单语版完全一致
const judge = (v) => 28 + 67 * Math.pow(v / 100, 0.85)
const human = (v) => (v <= 52 ? 38 + 42 * Math.pow(v / 52, 0.9) : 80 - 58 * Math.pow((v - 52) / 48, 1.35))
const HX = (v) => 48 + (v / 100) * 368
const HY = (s) => 262 - (s / 100) * 232
const J_POINTS = []
const H_POINTS = []
for (let v = 0; v <= 100; v += 2) {
  J_POINTS.push(`${HX(v).toFixed(1)},${HY(judge(v)).toFixed(1)}`)
  H_POINTS.push(`${HX(v).toFixed(1)},${HY(human(v)).toFixed(1)}`)
}

function HackDemo({ c }) {
  const [v, setV] = useState(12)
  const zi = c.hackZones.findIndex((z) => v < z.max)
  const z = c.hackZones[zi === -1 ? c.hackZones.length - 1 : zi]
  const j = judge(v), h = human(v)
  const cx = HX(v)
  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.hackTitle}</span>
        <span className="demo-hint">{c.hackHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="hack-chart" viewBox="0 0 440 310" width="430" aria-label={c.hackSvgAria}>
            <rect x="140" y="30" width="110.4" height="232" fill="var(--sage-bg)" />
            <rect x="250.4" y="30" width="92" height="232" fill="var(--amber-bg)" />
            <rect x="342.4" y="30" width="73.6" height="232" fill="var(--terracotta-bg)" />
            <text x="195" y="48" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--sage)">{c.hackZoneSweet}</text>
            <text x="296" y="48" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--amber)">{c.hackZoneInflation}</text>
            <text x="379" y="48" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--terracotta)">{c.hackZoneHack}</text>
            <line x1="48" y1="262" x2="416" y2="262" stroke="var(--hairline-strong)" strokeWidth="1" />
            <line x1="48" y1="30" x2="48" y2="262" stroke="var(--hairline-strong)" strokeWidth="1" />
            <text x="232" y="292" textAnchor="middle" fontSize="11" fill="var(--fg-2)">{c.hackXAxis}</text>
            <line x1="48" y1="14" x2="68" y2="14" stroke="var(--sky)" strokeWidth="2.5" />
            <text x="74" y="18" fontSize="11.5" fill="var(--fg-1)">{c.hackLegendJudge}</text>
            <line x1="230" y1="14" x2="250" y2="14" stroke="var(--sage)" strokeWidth="2.5" />
            <text x="256" y="18" fontSize="11.5" fill="var(--fg-1)">{c.hackLegendHuman}</text>
            <polyline className="curve" stroke="var(--sky)" points={J_POINTS.join(' ')} />
            <polyline className="curve" stroke="var(--sage)" points={H_POINTS.join(' ')} />
            <line className="cursor-line" x1={cx} y1="30" x2={cx} y2="262" strokeWidth="1.2" />
            <circle r="5" fill="var(--sky)" stroke="var(--bg-card)" strokeWidth="1.5" cx={cx} cy={HY(j)} />
            <circle r="5" fill="var(--sage)" stroke="var(--bg-card)" strokeWidth="1.5" cx={cx} cy={HY(h)} />
          </svg>
        </div>
        <div className="demo-side">
          <SliderRow label={c.hackSliderLabel} min={0} max={100} step={1} value={v} onChange={(x) => setV(Math.round(x))} format={(x) => Math.round(x)} />
          <div><Pill type={z.pill}>{z.label}</Pill></div>
          <div className="hack-stats">
            <div className="hs-row"><span><span className="hs-swatch" style={{ background: 'var(--sky)' }} />{c.hackStatJudge}</span><span className="hs-num">{Math.round(j)}</span></div>
            <div className="hs-row"><span><span className="hs-swatch" style={{ background: 'var(--sage)' }} />{c.hackStatHuman}</span><span className="hs-num">{Math.round(h)}</span></div>
          </div>
          <div className="io-block">
            <div className="io-label">{c.hackUserLabel}</div>
            <div className="io-text">{z.ans}</div>
          </div>
          <p className="hack-note">{z.note}</p>
        </div>
      </div>
    </div>
  )
}

// ⑤ 对齐三角 —— 几何与坐标与单语版完全一致
const TRI_CENTER = { x: 180, y: 207 }
const TRI_VERTS = { helpful: { x: 180, y: 56 }, honest: { x: 66, y: 282 }, harmless: { x: 294, y: 282 } }
const triDotPos = (key) => {
  if (key === 'bal') return TRI_CENTER
  const t = TRI_VERTS[key]
  return { x: TRI_CENTER.x + 0.62 * (t.x - TRI_CENTER.x), y: TRI_CENTER.y + 0.62 * (t.y - TRI_CENTER.y) }
}

function TriangleDemo({ c }) {
  const [key, setKey] = useState('bal')
  const d = c.triData[key]
  const p = triDotPos(key)
  const vCls = (vk) => `tri-v${key === vk ? ' active' : ''}${key !== 'bal' && key !== vk ? ' dim' : ''}`
  const VTX = [
    { k: 'helpful', cx: 180, cy: 56, fill: 'var(--sky-bg)', stroke: 'var(--sky)', cn: c.triVerts.helpful, en: 'Helpful' },
    { k: 'honest', cx: 66, cy: 282, fill: 'var(--sage-bg)', stroke: 'var(--sage)', cn: c.triVerts.honest, en: 'Honest' },
    { k: 'harmless', cx: 294, cy: 282, fill: 'var(--amber-bg)', stroke: 'var(--amber)', cn: c.triVerts.harmless, en: 'Harmless' },
  ]
  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.triTitle}</span>
        <span className="demo-hint">{c.triHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="tri-svg" viewBox="0 0 360 330" width="340" aria-label={c.triSvgAria}>
            <path d="M 180 56 L 66 282 L 294 282 Z" fill="none" stroke="var(--hairline-strong)" strokeWidth="1.2" />
            {VTX.map((vt) => (
              <g key={vt.k} className={vCls(vt.k)} onClick={() => setKey(vt.k)}>
                <circle cx={vt.cx} cy={vt.cy} r="38" fill={vt.fill} stroke={vt.stroke} strokeWidth="1.5" />
                <text x={vt.cx} y={vt.cy - 2} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--fg-0)">{vt.cn}</text>
                <text x={vt.cx} y={vt.cy + 14} textAnchor="middle" fontSize="10.5" fill="var(--fg-1)">{vt.en}</text>
              </g>
            ))}
            <g id="tri-dot" style={{ transform: `translate(${p.x}px,${p.y}px)` }}>
              <circle r="8" fill="var(--terracotta)" stroke="var(--bg-card)" strokeWidth="2" />
            </g>
            <text x="180" y="322" textAnchor="middle" fontSize="11" fill="var(--fg-2)">{c.triDotLabel}</text>
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            {c.triChips.map(([k, label]) => (
              <button key={k} className={`chip${k === key ? ' active' : ''}`} onClick={() => setKey(k)}>{label}</button>
            ))}
          </div>
          <h4>{d.title}</h4>
          <div className="io-block mt14">
            <div className="io-label">{d.q}</div>
            <div className="io-text">{d.a}</div>
          </div>
          <p id="tri-note">{d.note}</p>
        </div>
      </div>
    </div>
  )
}

export default function L13() {
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
        <div className="use-grid cols-2">
          <div className="card use-card"><div className="label">{c.conceptCard1.label}</div><div className="en">{c.conceptCard1.en}</div><div className="zh">{c.conceptCard1.zh}</div></div>
          <div className="card use-card"><div className="label">{c.conceptCard2.label}</div><div className="en">{c.conceptCard2.en}</div><div className="zh">{c.conceptCard2.zh}</div></div>
        </div>
        <PipelineDemo c={c} />
        <p className="lead mt14">{c.conceptOutro}</p>
      </Lsec>

      <Lsec title={c.sftTitleSec} lead={c.sftLead}>
        <SftTemplateDemo c={c} />
        <p className="lead mt14">{c.sftP1}</p>
        <p className="lead mt14">{c.sftP2}</p>
        <div className="use-grid cols-2">
          <div className="card use-card"><div className="label">{c.sftChangeCard.label}</div><div className="en">{c.sftChangeCard.en}</div><div className="zh">{c.sftChangeCard.zh}</div></div>
          <div className="card use-card"><div className="label">{c.sftNoChangeCard.label}</div><div className="en">{c.sftNoChangeCard.en}</div><div className="zh">{c.sftNoChangeCard.zh}</div></div>
        </div>
        <p className="lead mt14">{c.sftHurdleLead}</p>
        <div className="use-grid">
          {c.sftHurdles.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.en}</div><div className="zh">{u.zh}</div></div>
          ))}
        </div>
        <p className="lead mt14">{c.sftToPref}</p>
      </Lsec>

      <Lsec title={c.rlhfTitleSec} lead={c.rlhfLead}>
        <RankDemo c={c} />
        <p className="lead mt14">{c.rlhfP1}</p>
        <div className="use-grid">
          {c.rlhfSteps.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.en}</div><div className="zh">{u.zh}</div></div>
          ))}
        </div>
        <div className="example mt14">
          <div className="en">{c.rlhfExampleEn}</div>
          <div className="zh">{c.rlhfExampleZh}</div>
        </div>
        <p className="lead mt14">{c.rlhfP2}</p>
        <p className="lead mt14">{c.rlhfP3}</p>
        <p className="lead mt14">{c.rlhfP4}</p>
        <HackDemo c={c} />
        <p className="lead mt14">{c.rlhfP5}</p>
        <p className="footnote source-note">{c.rlhfSourceNote}</p>
      </Lsec>

      <Lsec title={c.alignTitleSec} lead={c.alignLead}>
        <div className="use-grid">
          {c.alignCards.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.en}</div><div className="zh">{u.zh}</div></div>
          ))}
        </div>
        <p className="lead mt14">{c.alignTriLead}</p>
        <TriangleDemo c={c} />
        <p className="lead mt14">{c.alignTableLead}</p>
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="match">
            <thead><tr><th>{c.alignTableHead[0]}</th><th>{c.alignTableHead[1]}</th></tr></thead>
            <tbody>
              {c.alignTableRows.map((row, i) => (
                <tr key={i}><td className="ex">{row[0]}</td><td>{row[1]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="lead mt14">{c.alignFollowLead}</p>
        <div className="use-grid cols-2">
          {c.alignFollowCards.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.en}</div><div className="zh">{u.zh}</div></div>
          ))}
        </div>
        <p className="footnote source-note">{c.alignFollowSourceNote}</p>
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
