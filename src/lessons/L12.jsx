import { useEffect, useRef, useState } from 'react'
import { Lsec, SliderRow, Pill, QuizItem } from '../components/ui.jsx'
import { useLang } from '../i18n/LangContext.jsx'

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// 双语内容层：结构 / class / id / SVG 几何 / 数值 / 交互均不变，仅可见文本按语言取用。
// 富文本（含 <b>）直接以 JSX 片段存储，渲染输出与单语版逐字一致。
// 演示 token（古诗、巴黎、def add 等）与概率数组、correct 下标一一对应，翻译会破坏演示对齐，
// 故 ctx / tokens 在 zh / en 中保持原文，只翻译讲解性文本。
const C = {
  zh: {
    // ① 接龙训练台
    ntSents: {
      poem: { ctx: '床前明月光，疑是地上____', tokens: ['霜', '雪', '水', '猫'], correct: 0,
        note: '古诗是“原文级”的记忆：正确接法只有一种，模型要在语料里见过足够多遍，才敢把概率全押上去。' },
      grammar: { ctx: '他学习非常努力，因此成绩____', tokens: ['提高了', '下降了', '一般', '苹果'], correct: 0,
        note: '语法和常识因果在语料里铺天盖地，所以学得最早 —— 训练量不大时它就能接对这类题。' },
      fact: { ctx: '法国的首都是____', tokens: ['巴黎', '伦敦', '里昂', '香蕉'], correct: 0,
        note: '“巴黎”这类世界事实要见过很多遍才能存进参数 —— 比语法学得慢，冷门事实更慢，太冷门的甚至永远记不牢。' },
      code: { ctx: 'def add(a, b): return ____', tokens: ['a + b', 'a - b', 'print(a)', '你好'], correct: 0,
        note: '代码套路要等语料里的代码仓库被大量消化后才上道 —— 这就是“多喂代码，逻辑更强”的由来。' },
    },
    ntLevels: [
      { val: '0', name: '刚出厂：参数全随机', period: '训练量 · 0 token', desc: '千亿个旋钮还停在出厂的随机位置，它对语言一无所知，每个候选都是纯瞎猜。从这里到 ChatGPT，差的就是上万亿次“猜 → 对答案 → 拧参数”。' },
      { val: '百万级', name: '读了几书架的书', period: '训练量 · 百万级 token', desc: '最常见的规律先冒头：哪些字总挨在一起、句子大概长什么形状。但事实、诗句、代码这些“要见得多才记得住”的内容，还远远不够。' },
      { val: '十亿级', name: '读了一座图书馆', period: '训练量 · 十亿级 token', desc: '语法基本过关，常见事实开始记住。来回切换四道题对比一下 —— 进步速度明显不同：语料里越常见的规律，学得越早。' },
      { val: '万亿级', name: '读了半个互联网', period: '训练量 · 万亿级 token', desc: '冷门事实、代码套路也渐渐到位。每次比对答案只把参数拧一点点，但乘以万亿次，量变硬是堆出了质变。' },
      { val: '十万亿级', name: '读完整个互联网', period: '训练量 · 十万亿级 token', desc: '四道题全都接得又稳又准 —— 语法、事实、记忆、编程，没有一样是单独教的，全是把接龙玩到极致之后的副产品。' },
    ],
    ntGrade: { g1: '接近零 —— 这道题它吃透了', g2: '不算高 —— 参数只需轻轻再拧几把', g3: '还很高 —— 每次比对都要狠拧参数', g4: '爆表 —— 全靠瞎蒙，参数被狠狠地拧' },
    ntTitle: '🎛️ 交互演示 · 亲手把模型“喂”大',
    ntHint: '选接龙题 + 拖动训练量滑块',
    ntAria: '文字接龙训练演示：给定一段前文，模型对四个候选 token 报出概率',
    ntProbHead: '模型报出的概率表（押注越高，越相信它是下一个 token）',
    ntAnswer: (tok) => <>标准答案「{tok}」就在原文里 —— 不需要任何人来标注</>,
    ntScore: '此刻的“离谱度”：',
    ntChips: [['poem', '床前明月光'], ['grammar', '因果常识'], ['fact', '世界事实'], ['code', '写代码']],
    ntSliderLabel: '训练量',
    ntReport: (tok, p) => <>它给标准答案「{tok}」报的概率：{p}</>,

    // ② 预训练流水线
    plData: {
      raw: { title: '① 原料：把互联网装上卡车', desc: '主力是公开网页的全网快照（业内常用 Common Crawl，可以理解成“互联网的定期备份”），再配上书籍、百科、论文和代码仓库。生数据以数十万亿 token 计 —— 但其中大半是广告、乱码和垃圾站的胡话，远没有听上去那么美好。' },
      clean: { title: '② 清洗：最脏的活，最值钱的活', desc: '去重（同一篇爆款被转载几万次）、剥广告和导航模板、滤掉有害与隐私内容、按质量打分整页淘汰，最后像调配方一样决定代码、多语言、百科各占几成。生数据在这一步被淘汰掉一大半 —— 模型的上限就在这里定下（第 5 课“数据为王”的工业现场）。' },
      tok: { title: '③ 分词：切成模型认识的样子', desc: '干净文本被切成 token 流（第 11 课）。从这一刻起，模型眼里不再有“文章”和“句子”，只有一条几十万亿节的 token 长链，等着被一段一段截下来出接龙题。' },
      train: { title: '④ 训练：一个循环连跑几个月', desc: '截一段前文 → 猜下一个 token → 比对原文 → 反向传播拧参数。这个第 4、6 课的循环，在数万张 GPU 上昼夜连转数月、重复上万亿次。中途机器崩了，就从最近的“存档点”爬起来接着跑。' },
      base: { title: '⑤ 成品：基座模型（毛坯房）', desc: '读完了整个互联网，满腹经纶 —— 但只会续写，不会对话。它是 ChatGPT 的“毛坯房”：知识、语法、推理都已浇筑在参数里，“精装修”（调教成听话的助手）是下一课 SFT 与 RLHF 的工作。' },
    },
    plTitle: '🎛️ 交互演示 · 预训练流水线',
    plHint: '点击图中任意一站，或下方按钮',
    plAria: '预训练流水线：网页书籍代码经过清洗和分词，进入预测下一个词的训练循环，产出基座模型',
    plChips: [['raw', '① 原料'], ['clean', '② 清洗'], ['tok', '③ 分词'], ['train', '④ 训练'], ['base', '⑤ 成品']],
    plSvg: {
      s1: '① 原料', s1a: '🌐 网页', s1b: '📚 书籍 · 百科', s1c: '💻 代码 · 论文', s1d: '数十万亿 token 的生数据',
      s2: '② 清洗', s2t: '数据清洗', s2a: '去重 · 去广告', s2b: '过滤有害内容', s2c: '配比：代码 · 多语言', s2d: '脏活累活 · 决定上限',
      s3: '③ 分词', s3t: '分词', s3a: '切成 token 流', s3b: '（第 11 课）',
      s4: '④ 训练', s4t: '「预测下一个词」循环', s4a: '猜 → 比对原文 → 微调参数', s4b: '× 上万亿次', s4c: '第 4 / 6 课的循环 · 互联网尺度',
      s5: '⑤ 成品', s5t: '基座模型', s5a: 'Base Model', s5b: '满腹经纶 · 只会续写', s5c: '调教成助手 → 第 13 课',
    },

    // ③ 调戏一下基座模型
    bpPrompts: {
      q1: { input: '中国的首都是哪里？',
        base: { out: '这是小学二年级《思维训练》里的常见考题。请从下列选项中选出正确答案：A. 上海　B. 北京　C. 广州……', why: '它在续写，不是在回答：训练语料里这句话最常出现在考卷里，后面跟着的往往是选项和说明，而不是答案。' },
        asst: { out: '北京。', why: '经过下一课的调教，它理解了“这是一个提问，我该直接回答”这个社交契约。' } },
      q2: { input: '中国的首都是',
        base: { out: '北京。北京是中华人民共和国的首都，也是全国的政治和文化中心……', why: '看！知识其实早就在参数里了。把输入摆成“顺着写下去就是答案”的形状，它立刻接得又快又准 —— 问题从来不是“不知道”，而是“不听话”。' },
        asst: { out: '北京。', why: '助手模型无所谓输入的形状 —— 半句话、完整提问，怎么来都答。' } },
      q3: { input: '怎么煮溏心蛋？',
        base: { out: '怎么煎牛排？怎么烤吐司？怎么调一杯像样的油醋汁？—— 厨房新手最常搜的 20 个问题', why: '它把你的问题当成了某份“问题清单”的第一行，于是续写出第二行、第三行。对文档补全器来说，这完全合理。' },
        asst: { out: '冷水下锅，水开后转中火煮 6 分钟，捞出立刻过冰水 —— 蛋白凝固、蛋黄流心。', why: '助手模型把它当成求助，给出步骤 —— 这种“有问必答”的行为是下一课调教出来的。' } },
      q4: { input: '问：中国的首都是哪里？\n答：',
        base: { out: '北京。', why: '妙！把输入排成“问答体文档”，基座模型为了把这篇文档续写得像样，只能顺着格式写出答案 —— 这个骗术就是提示工程的雏形（第 16 课）。' },
        asst: { out: '北京。', why: '对助手模型来说这个模板属于多此一举 —— 它本来就会回答。' } },
    },
    bpTitle: '🎛️ 交互演示 · 调戏一下基座模型',
    bpHint: '换输入、换模型，看它接什么',
    bpInputLabel: '你输入的文字',
    bpOutBase: '基座模型接出 ↓',
    bpOutAsst: '助手模型回答 ↓',
    bpStep1: '第一步 · 选一种输入',
    bpStep2: '第二步 · 选模型',
    bpPromptChips: [['q1', '① 直接提问'], ['q2', '② 留半句话'], ['q3', '③ 求教程'], ['q4', '④ 问答模板骗术']],
    bpModelChips: [['base', '基座模型'], ['asst', '调教后的助手']],

    // 正文
    goalsTitle: '🎯 你将学会',
    goals: [
      <>一句话说清预训练在干什么：预测下一个 token，猜错就微调参数，重复上万亿次</>,
      <>理解“自监督”为什么是规模的钥匙：文本自带答案，省掉人工标注，才敢拿整个互联网当教材</>,
      <>想明白“压缩即智能”：为什么把接龙玩到极致，语法、事实、推理、编程全成了副产品</>,
      <>看穿几个日常现象：ChatGPT 逐字蹦出文字、每次回答不一样、知识有截止日期 —— 全都对应一条本课机制</>,
      <>认清刚出炉的“基座模型”：满腹经纶却只会续写 —— 并亲手“调戏”它一次，体会什么叫“知识在，但不听话”</>,
    ],

    conceptTitle: '💡 核心概念：一个游戏，玩上万亿次',
    conceptLead: '上一课说过，大模型眼中的世界是一串 token。这一课回答下一个问题：拿到几十万亿个 token 之后，它到底在学什么？答案朴素得让人不敢相信 —— 整个预训练只做一件事，玩文字接龙。',
    concCards: [
      { label: '第一步 · 出题', en: <>给一段<b>前文</b></>, zh: <>从语料里随手截一段：“床前明月光，疑是地上”—— 让模型猜下一个 token 是什么。它输出的不是一个词，而是一张<b>概率表</b>：霜 92%、雪 3%、水 1%……每个候选都有一个押注。</> },
      { label: '第二步 · 对答案', en: <>答案<b>就在原文里</b></>, zh: <>原文的下一个字“霜”就是标准答案 —— 不用出题老师，不用阅卷员。文本的每个位置都天然自带答案，这叫<b>自监督学习</b>。</> },
      { label: '第三步 · 微调', en: <>错了就<b>拧参数</b></>, zh: <>猜偏了？用反向传播算出每个参数该负多少责，各拧一点点 —— 正是第 4、6 课那套“猜 → 比对 → 微调”的循环。然后换下一段文字，重复上万亿次。</> },
    ],
    concExEn: <>全部训练目标，一行就写完：把 <b>P(下一个 token | 前文)</b> 推得越高越好</>,
    concExZh: <>这是全课唯一的式子，逐个符号翻译：<b>P</b> 就是“概率”；中间那根竖线 <b>|</b> 读作“在……条件下”。整句人话：看着这段前文，原文里真正出现的那个词，你给它报的概率要越来越高。猜得越离谱，参数就拧得越狠。整个预训练，没有第二个目标。</>,
    concP1: <>空说无凭 —— 下面这个训练台让你亲手体验一回。选一道接龙题，然后拖动“训练量”滑块，看模型怎么从纯瞎猜一步步变成押注 95% 的老手。注意一个细节：<b>四道题进步的速度不一样</b>，语料里越常见的规律，学得越早。</>,
    concP2: <>这个游戏真正的妙处在第二步。第 2 课说过，监督学习最贵的环节是<b>人工标注答案</b> —— 标一百万张猫片就要雇一支队伍，而且标到一百万张就到头了。文字接龙的答案是文本自带的，标注成本直接归零；于是训练规模的天花板，从“雇得起多少标注员”一下子变成了“互联网有多大”。这就是大模型能“大”起来的第一个秘密：<b>不是游戏多高级，而是这个游戏可以无限供货。</b>换别的任务都做不到 —— 让模型学“翻译”，你得先雇人配好百万句对照；学“摘要”，你得先雇人写百万篇摘要；只有“预测下一个词”，整个互联网每一句话都是现成考题。</>,

    compTitle: '📖 压缩即智能：接龙怎么就接出了“理解”',
    compLead: '一个合理的怀疑：这么简单的游戏，怎么可能玩出智能？关键在“接对”二字。互联网语料无奇不有，想把各种句子都接对，光靠背是不够的 —— 每类接龙题，都在逼模型学会一种真本事：',
    compThead: ['语料里真实会遇到的接龙题', '想接对，就必须……'],
    compRows: [
      { ex: <>“他学习非常努力，因此成绩<Fill />”</>, must: <><b>掌握语法和常识因果</b> —— 接“提高了”，而不是“下降了”</> },
      { ex: <>“法国的首都是<Fill />”</>, must: <><b>记住世界事实</b> —— 肚子里必须存着“巴黎”这条知识</> },
      { ex: <>侦探小说最后一页：“凶手就是<Fill />”</>, must: <><b>长程推理</b> —— 读懂前文几万字的伏笔，自己破一次案</> },
      { ex: <>“def add(a, b): return <Fill />”</>, must: <><b>会写代码</b> —— 看懂函数名和参数，接出 a + b</> },
    ],
    compP1: <>现在把尺度拉满：几十万亿 token 的语料，要装进只有千亿级参数的“脑容量”里 —— 差着两个数量级，原文根本存不下。想象一个学霸备考：教科书三千页，小抄只许带一页。他不可能把原文缩印上去，只能<b>提炼</b>：把一万道例题浓缩成几条解法，把整章史实浓缩成因果脉络。模型面对的正是同一道选择题，而且它别无选择 —— 与其背下一万种“巴黎是法国首都”的说法，不如存一条事实；与其背下 GitHub 上的所有代码，不如学会语法和套路。</>,
    compP2: <>为什么非压缩不可，还有更深一层：<b>死记硬背在这个游戏里根本拿不到高分。</b>语料里的句子千变万化，明天截出来的前文几乎必然是没见过的 —— 背原文的模型一出考场就露馅（第 5 课的过拟合）。只有提炼出规律，才能在没见过的句子上照样接对。预测得越准，说明提炼得越深 —— 这就是那句行话<b>“压缩即智能”</b>。</>,
    compP3: <>这也解释了一个你天天在用、却很少细想的现象：让 ChatGPT“用李白的风格写一首关于程序员的诗”，互联网上并不存在这篇诗，它却能写出来 —— 因为参数里存的不是哪首诗的原文，而是“李白风格”这条<b>规律本身</b>。语法、事实、逻辑、翻译、编程，没有一样是单独教的课程，全是把一个游戏玩到极致之后的副产品。当然，硬币有反面：压缩是<b>有损</b>的，细节会被揉在一起记混 —— 这笔账先记下，到“常见误区”再算。</>,

    autoTitle: '📖 逐字蹦出的秘密：接龙的现场直播',
    autoLead: '训练时玩接龙，用的时候 —— 还是玩接龙，只是反着玩：这回没有原文对答案了，模型从自己的概率表里挑一个词接上去，再把这个词贴回前文末尾，整个重算一遍、接下一个……一个字一个字往外滚，直到接出“该停了”的信号。这个“自己接自己”的玩法叫自回归生成。记住它，你在 ChatGPT 里看到的好几个“怪现象”瞬间全通了：',
    autoCards: [
      { label: '你看到的现象', en: <>回答<b>一个字一个字蹦</b>出来</>, zh: <><b>背后机制：</b>不是打字机特效。每个 token 都是一轮完整的接龙 —— 算完一个才有下一个，你看到的是生成现场的实时直播。</> },
      { label: '你看到的现象', en: <>同一个问题，<b>每次回答不一样</b></>, zh: <><b>背后机制：</b>模型输出的是概率表，不是唯一答案 —— 产品按概率“抽签”挑词，抽签自然每次不同。怎么控制这个随机性，第 14 课的温度专讲。</> },
      { label: '你看到的现象', en: <>长回答有时<b>越写越跑偏</b></>, zh: <><b>背后机制：</b>一步错，步步错 —— 接错的词会被贴回前文，后续接龙把它当真，顺着错误继续编。它没有“反悔键”，写出去的字收不回来。</> },
      { label: '你看到的现象', en: <>输出越长<b>越慢、越贵</b></>, zh: <><b>背后机制：</b>接第 1000 个字时，前面 999 个字要全部重看一遍 —— 每个 token 都是一轮全量计算。这也是 API 按 token 计费的根源（第 11 课）。</> },
    ],
    autoP1: <>顺着这条机制还能看清它的一个天生局限：接龙模型<b>没有全局提纲</b>。它不是先打腹稿再下笔，而是写一个字算一步 —— 所以偶尔会写到一半发现前后矛盾，只能硬着头皮往回圆。怎么让模型“先打草稿、想清楚再回答”？这正是推理模型要解决的问题，第 23 课见。</>,

    factoryTitle: '🏭 数据车间：脏活累活与天文数字',
    factoryLead: '“用整个互联网训练”听着浪漫，车间现场全是脏活累活。下面的流水线现在是可以点的 —— 从生数据到基座模型一共五站，点击任何一站看看它在干什么，然后我们放大看最脏的那一步。',
    factoryP1: <>第 ② 站最不起眼，却最要命。原始网页里满是广告、乱码、模板文字、垃圾站自动生成的胡话 —— 直接喂进去，模型学到的就是这些。各家实验室在这一步投入的工程量，不比训练本身少：</>,
    factoryCards: [
      { label: '脏活 1', en: <><b>去重</b></>, zh: <>同一篇爆款文被转载几万次，不去重模型就会把它死记硬背下来 —— 第 5 课的过拟合换了个马甲。</> },
      { label: '脏活 2', en: <><b>过滤</b></>, zh: <>剥掉广告和导航模板，剔除有害内容与隐私信息，质量分太低的页面整页扔掉 —— 互联网生数据的淘汰率高得惊人。</> },
      { label: '细活', en: <><b>配比</b></>, zh: <>像调配方一样决定代码、多语言、百科、对话各占几成。多喂代码，模型的逻辑推理通常更强 —— 这是业内公认的经验。</> },
      { label: '结论', en: <><b>数据定上限</b></>, zh: <>第 5 课说过“数据为王”，在这里应验：同样的架构与算力，数据更干净的那家赢。模型的天花板，在清洗这一步就定下了。</> },
    ],
    factoryP2: <>最后感受一下这场游戏的尺度 —— 为什么说预训练是“巨头的游戏”：</>,
    scaleCards: [
      { label: '训练数据', en: <>十万亿级 <b>token</b></>, zh: <>一个人每天读 8 小时，要读上几万年 —— 模型几个月“读”完。</> },
      { label: '参数规模', en: <>千亿级<b>参数</b></>, zh: <>千亿个可学习的“旋钮”（第 3 课的权重），共同决定下一个词接什么。</> },
      { label: '训练时长', en: <>连跑<b>数月</b></>, zh: <>数以万计的顶级 GPU 昼夜连轴转，中途崩了还得从检查点爬起来重跑。</> },
      { label: '训练成本', en: <>百万美元级<b>电费</b></>, zh: <>仅电费就以百万美元计，整体成本更是高出一个量级 —— 牌桌上只剩少数玩家。</> },
    ],
    factoryFootnote: <>※ 以上为 2025 年前后旗舰模型的<b>数量级示意</b>，不同模型差异巨大，具体数字以各家官方披露为准。</>,

    baseTitle: '📖 刚出炉的基座模型：满腹经纶，却不会聊天',
    baseLead: '烧掉几个月电费之后，你得到的并不是 ChatGPT，而是一个“基座模型”。给它一个最准确的心智模型：宇宙文档补全器 —— 无论你输入什么，它都假设这是互联网上某篇文档的开头，然后竭尽全力把这篇文档“写完”。它读完了整个互联网，但行为模式只有这一种。不信你问它一个问题 ——',
    baseContrast1Tag: '你以为它会答',
    baseContrast1Big: <>“中国的首都是哪里？”<br />—— <span className="hl">北京。</span></>,
    baseContrast1Note: '有问有答，这是“助手”的行为。可惜，助手不是预训练直接产出的。',
    baseContrast2Tag: '基座模型可能接',
    baseContrast2Big: <>“中国的首都是哪里？”<br />—— <span className="gap">这是小学二年级的试题。</span></>,
    baseContrast2Note: '它在老老实实地续写：训练语料里，这句话后面更常跟着考卷说明和选项 ABCD，而不是答案。',
    baseP1: <>注意，问题不在于它<b>不知道</b>，而在于它<b>不听话</b>：它只有“续写”这一种行为模式，根本不懂“你在提问、我该回答”这个社交契约。下面这个试玩间里有四种输入 —— 自己换着喂喂看，重点试试第 ② 和第 ④ 种，你会亲眼看到“知识早就在参数里了，只是要摆对姿势才掏得出来”：</>,
    baseP2: <>第 ④ 种输入值得多看一眼：早期玩家发现，把输入排成“问：……”换行“答：”，基座模型为了把这篇“问答体文档”续写得像样，只能乖乖写出答案 —— 这个骗术正是<b>提示工程的雏形</b>（第 16 课）。但骗术终究是骗术：它时灵时不灵，而且骗不出“礼貌”“拒绝有害请求”“承认不知道”这些助手品质。把接龙机器真正调教成有问必答、还懂规矩的助手，靠的是另一套手术：监督微调与人类反馈强化学习 —— 下一课的主角。</>,

    pitfallsTitle: '⚠️ 常见误区',
    pitfalls: [
      {
        bad: '大模型内部存了一个原文数据库，回答问题就是去里面“查资料”',
        good: '参数里没有一篇原文，只有有损压缩后的统计规律 —— 回答是现场生成的，不是查出来的',
        why: <><b>病因：</b>把模型当成了搜索引擎。几十万亿 token 压进千亿参数，注定是有损压缩：好处是学会了举一反三，代价是细节会“记混”—— 把相似的人名、日期、论文标题揉在一起，一本正经地编出不存在的东西。幻觉的一大根源就在这里（第 29 课细讲）。</>,
      },
      {
        bad: '模型每天都在联网冲浪，持续学习新知识',
        good: '训练截止那一刻参数就被冻结了 —— 之后发生的新闻、新梗，它一概不知道',
        why: <><b>病因：</b>把产品的“联网搜索”功能当成了模型本身的能力。重新训练一次贵到没法天天做，所以每个模型都有“知识截止日期”。想让它聊最新消息，得把资料现场喂进上下文里 —— 这套“外挂知识库”的玩法叫 RAG，第 18 课专讲。</>,
      },
    ],

    quizTitle: '✍️ 小练习',
    quiz: [
      { q: '1. 预训练号称“不需要人工标注”，可它明明在不停地对答案 —— 这和第 2 课“监督学习需要标注”矛盾吗？',
        a: <><b>不矛盾。</b>预训练仍然是“有答案的学习”，只是答案不用人写 —— 原文的下一个 token 就是现成的标准答案，所以叫<b>自监督</b>。正因为省掉了人工标注这个最贵的瓶颈，数据规模才能从“百万级标注样本”推到“十万亿级 token”。</> },
      { q: '2. 朋友说：“它背了整个互联网，肚子里肯定存着维基百科原文，回答就是查出来的。”请用“压缩”二字反驳，并顺手解释幻觉。',
        a: <><b>存不下。</b>几十万亿 token 的语料对千亿级参数来说大了两个数量级，模型只能做有损压缩 —— 提炼规律、丢掉原文。所以回答是“现场重新生成”而非“查找原文”；又因为压缩有损，相似的细节会被记混，于是它能一本正经地编出不存在的引文 —— 这就是幻觉的一大来源。</> },
      { q: '3. 给刚预训练完的基座模型输入“怎么煮溏心蛋？”，猜猜它最可能输出什么？为什么？',
        a: <>很可能<b>不是教程，而是续写</b> —— 比如接出“怎么煎牛排？怎么烤吐司？”（把它当成一份美食问题清单继续列），或者续写成论坛帖子的口吻。因为它学的是“这段文字后面最可能跟什么”，而不是“回答提问”。把它调教成有问必答的助手，是下一课 SFT 与 RLHF 的工作。</> },
      { q: '4. ChatGPT 的回答总是一个字一个字往外蹦 —— 这是产品经理加的“打字机特效”，还是机制使然？',
        a: <><b>机制使然。</b>生成是自回归接龙：接出一个 token，贴回前文末尾，重算一遍再接下一个 —— 算完一个才有下一个，你看到的是现场直播。这也顺带解释了为什么输出越长越慢、API 按输出 token 计费，以及为什么它一旦接错一个词，后面会顺着错的继续编。</> },
    ],
  },

  en: {
    // ① Next-token trainer
    ntSents: {
      poem: { ctx: '床前明月光，疑是地上____', tokens: ['霜', '雪', '水', '猫'], correct: 0,
        note: 'Classic poetry is "verbatim" memory: there is only one correct continuation, and the model has to have seen it enough times in the corpus before it dares to put all its probability on it.' },
      grammar: { ctx: '他学习非常努力，因此成绩____', tokens: ['提高了', '下降了', '一般', '苹果'], correct: 0,
        note: 'Grammar and commonsense cause-and-effect are everywhere in the corpus, so they are learned earliest — even with little training the model can get these right.' },
      fact: { ctx: '法国的首都是____', tokens: ['巴黎', '伦敦', '里昂', '香蕉'], correct: 0,
        note: 'World facts like "Paris" must be seen many times before they get stored in the parameters — learned more slowly than grammar, obscure facts slower still, and the truly obscure ones may never stick.' },
      code: { ctx: 'def add(a, b): return ____', tokens: ['a + b', 'a - b', 'print(a)', '你好'], correct: 0,
        note: 'Coding patterns only click once the corpus has digested huge amounts of code repos — this is where "feed it more code and the logic gets stronger" comes from.' },
    },
    ntLevels: [
      { val: '0', name: 'Fresh off the line: all parameters random', period: 'Training · 0 token', desc: 'The hundreds of billions of knobs are still sitting at their random factory positions; it knows nothing about language and every candidate is a pure guess. From here to ChatGPT, what is missing is trillions of rounds of "guess → check the answer → tweak the parameters."' },
      { val: 'millions', name: 'Read a few shelves of books', period: 'Training · millions of tokens', desc: 'The most common patterns surface first: which characters tend to sit together, roughly what shape a sentence takes. But facts, poems, and code — the things that "need many sightings to stick" — are still far from enough.' },
      { val: 'billions', name: 'Read a whole library', period: 'Training · billions of tokens', desc: 'Grammar is basically solid, and common facts start to stick. Switch back and forth between the four questions and compare — the speed of progress clearly differs: the more common a pattern is in the corpus, the earlier it is learned.' },
      { val: 'trillions', name: 'Read half the internet', period: 'Training · trillions of tokens', desc: 'Obscure facts and coding patterns gradually fall into place too. Each comparison against the answer only nudges the parameters a little, but multiplied by a trillion times, quantity finally forces a leap in quality.' },
      { val: 'tens of trillions', name: 'Read the whole internet', period: 'Training · tens of trillions of tokens', desc: 'All four questions are answered steadily and accurately — grammar, facts, memory, programming, none of them taught separately, all byproducts of playing the continuation game to perfection.' },
    ],
    ntGrade: { g1: 'near zero — it has fully mastered this one', g2: 'not high — the parameters only need a few gentle more tweaks', g3: 'still high — every comparison forces a hard tweak of the parameters', g4: 'off the charts — pure guessing, the parameters get tweaked hard' },
    ntTitle: '🎛️ Interactive · Feed the model bigger with your own hands',
    ntHint: 'Pick a continuation question + drag the training slider',
    ntAria: 'Next-token training demo: given a piece of preceding text, the model reports a probability for each of four candidate tokens',
    ntProbHead: 'The probability table the model reports (the higher the bet, the more it believes that is the next token)',
    ntAnswer: (tok) => <>The correct answer "{tok}" is right there in the source text — no one needs to label it</>,
    ntScore: 'Current "how-far-off" level: ',
    ntChips: [['poem', '床前明月光'], ['grammar', 'Cause & commonsense'], ['fact', 'World fact'], ['code', 'Write code']],
    ntSliderLabel: 'Training',
    ntReport: (tok, p) => <>The probability it gives the correct answer "{tok}": {p}</>,

    // ② Pretraining pipeline
    plData: {
      raw: { title: '① Raw material: load the internet onto trucks', desc: 'The bulk is a whole-web snapshot of public web pages (the industry often uses Common Crawl, think of it as "a periodic backup of the internet"), plus books, encyclopedias, papers, and code repos. The raw data is counted in the tens of trillions of tokens — but more than half of it is ads, gibberish, and the nonsense of junk sites, far less glamorous than it sounds.' },
      clean: { title: '② Cleaning: the dirtiest work, the most valuable work', desc: 'Deduplicate (the same viral piece reposted tens of thousands of times), strip ads and navigation templates, filter out harmful and private content, score by quality and drop whole pages, then like mixing a recipe decide what share goes to code, multilingual text, and encyclopedias. Most of the raw data is culled at this step — the model\'s ceiling is set right here (the industrial reality behind Lesson 5\'s "data is king").' },
      tok: { title: '③ Tokenization: cut it into a form the model recognizes', desc: 'The clean text is cut into a token stream (Lesson 11). From this moment on, the model no longer sees "articles" and "sentences," only one tens-of-trillions-link chain of tokens, waiting to be sliced segment by segment into continuation questions.' },
      train: { title: '④ Training: one loop running for months on end', desc: 'Slice a piece of preceding text → guess the next token → compare with the source → backpropagate and tweak the parameters. This loop from Lessons 4 and 6 runs day and night on tens of thousands of GPUs for months, repeated trillions of times. When a machine crashes mid-run, it climbs back up from the most recent "checkpoint" and keeps going.' },
      base: { title: '⑤ Finished product: the base model (the bare shell)', desc: 'It has read the whole internet and is full of knowledge — but it can only continue text, not converse. It is ChatGPT\'s "bare shell": knowledge, grammar, and reasoning are already cast into the parameters; the "interior finishing" (training it into an obedient assistant) is the job of next lesson\'s SFT and RLHF.' },
    },
    plTitle: '🎛️ Interactive · The pretraining pipeline',
    plHint: 'Click any station in the diagram, or a button below',
    plAria: 'Pretraining pipeline: web pages, books, and code go through cleaning and tokenization, enter the next-token prediction training loop, and produce a base model',
    plChips: [['raw', '① Raw'], ['clean', '② Clean'], ['tok', '③ Tokenize'], ['train', '④ Train'], ['base', '⑤ Product']],
    plSvg: {
      s1: '① Raw', s1a: '🌐 Web pages', s1b: '📚 Books · Wiki', s1c: '💻 Code · Papers', s1d: 'Tens of trillions of tokens of raw data',
      s2: '② Clean', s2t: 'Data cleaning', s2a: 'Dedup · de-ad', s2b: 'Filter harmful content', s2c: 'Mix: code · multilingual', s2d: 'Grunt work · sets the ceiling',
      s3: '③ Tokenize', s3t: 'Tokenize', s3a: 'Cut into a token stream', s3b: '(Lesson 11)',
      s4: '④ Train', s4t: 'The "predict next word" loop', s4a: 'Guess → compare → tweak params', s4b: '× trillions', s4c: 'The Lesson 4 / 6 loop · internet scale',
      s5: '⑤ Product', s5t: 'Base model', s5a: 'Base Model', s5b: 'Full of knowledge · only continues', s5c: 'Train into an assistant → Lesson 13',
    },

    // ③ Tease the base model
    bpPrompts: {
      q1: { input: '中国的首都是哪里？',
        base: { out: 'This is a common question from a second-grade "Thinking Training" workbook. Please choose the correct answer from the following options: A. Shanghai　B. Beijing　C. Guangzhou…', why: 'It is continuing, not answering: in the training corpus this sentence most often appears on test papers, followed by options and instructions rather than an answer.' },
        asst: { out: 'Beijing.', why: 'After next lesson\'s training, it understands the social contract that "this is a question, I should answer it directly."' } },
      q2: { input: '中国的首都是',
        base: { out: 'Beijing. Beijing is the capital of the People\'s Republic of China, as well as the nation\'s political and cultural center…', why: 'Look! The knowledge was in the parameters all along. Shape the input so that "writing straight on gives the answer" and it continues quickly and accurately — the problem was never "not knowing," but "not obeying."' },
        asst: { out: 'Beijing.', why: 'The assistant model does not care about the shape of the input — half a sentence or a full question, it answers either way.' } },
      q3: { input: '怎么煮溏心蛋？',
        base: { out: 'How do you sear a steak? How do you toast bread? How do you mix a decent vinaigrette? — the 20 questions kitchen beginners search most', why: 'It treats your question as the first line of some "list of questions," so it continues with the second line, the third line. For a document completer, this is entirely reasonable.' },
        asst: { out: 'Start in cold water, bring to a boil then turn to medium heat for 6 minutes, scoop out and plunge into ice water immediately — set whites, runny yolk.', why: 'The assistant model treats it as a request for help and gives the steps — this "answer whatever you ask" behavior is trained in next lesson.' } },
      q4: { input: '问：中国的首都是哪里？\n答：',
        base: { out: 'Beijing.', why: 'Clever! Arrange the input as a "Q&A document" and, to continue this document sensibly, the base model has to follow the format and write out the answer — this trick is the prototype of prompt engineering (Lesson 16).' },
        asst: { out: 'Beijing.', why: 'For the assistant model this template is superfluous — it answers anyway.' } },
    },
    bpTitle: '🎛️ Interactive · Tease the base model',
    bpHint: 'Swap the input, swap the model, see what it continues',
    bpInputLabel: 'The text you type',
    bpOutBase: 'Base model continues ↓',
    bpOutAsst: 'Assistant model answers ↓',
    bpStep1: 'Step 1 · Pick an input',
    bpStep2: 'Step 2 · Pick a model',
    bpPromptChips: [['q1', '① Ask directly'], ['q2', '② Leave a half-sentence'], ['q3', '③ Ask for a tutorial'], ['q4', '④ The Q&A-template trick']],
    bpModelChips: [['base', 'Base model'], ['asst', 'Trained assistant']],

    // Body
    goalsTitle: '🎯 What You’ll Learn',
    goals: [
      <>State in one sentence what pretraining does: predict the next token, tweak the parameters when wrong, repeat trillions of times</>,
      <>Understand why "self-supervised" is the key to scale: text carries its own answers, dropping human labeling, so you dare to use the whole internet as your textbook</>,
      <>Grasp "compression is intelligence": why playing the continuation game to perfection makes grammar, facts, reasoning, and programming all into byproducts</>,
      <>See through several everyday phenomena: ChatGPT spitting out text character by character, giving a different answer each time, knowledge having a cutoff date — each maps to one mechanism in this lesson</>,
      <>Recognize the freshly baked "base model": full of knowledge yet only able to continue text — and "tease" it once with your own hands to feel what "the knowledge is there, but it won\'t obey" means</>,
    ],

    conceptTitle: '💡 Core Idea: One Game, Played a Trillion Times',
    conceptLead: 'Last lesson we said that to a large model, the world is a string of tokens. This lesson answers the next question: once it has tens of trillions of tokens, what is it actually learning? The answer is unbelievably plain — all of pretraining does just one thing: play a word-continuation game.',
    concCards: [
      { label: 'Step 1 · Pose the question', en: <>Give a piece of <b>preceding text</b></>, zh: <>Grab a random slice from the corpus: "床前明月光，疑是地上" — and have the model guess the next token. What it outputs is not a single word but a <b>probability table</b>: 霜 92%, 雪 3%, 水 1%… every candidate gets a bet.</> },
      { label: 'Step 2 · Check the answer', en: <>The answer is <b>right there in the source text</b></>, zh: <>The next character in the source, "霜," is the correct answer — no need for a teacher to set the question, no need for a grader. Every position in text naturally carries its own answer; this is called <b>self-supervised learning</b>.</> },
      { label: 'Step 3 · Fine-tune', en: <>Wrong? <b>Tweak the parameters</b></>, zh: <>Guessed off? Use backpropagation to compute how much each parameter is to blame and tweak each a little — exactly the "guess → compare → fine-tune" loop from Lessons 4 and 6. Then move to the next piece of text and repeat trillions of times.</> },
    ],
    concExEn: <>The entire training objective fits in one line: push <b>P(next token | preceding text)</b> as high as possible</>,
    concExZh: <>This is the lesson\'s only formula, translated symbol by symbol: <b>P</b> means "probability"; the vertical bar <b>|</b> in the middle reads as "given." The whole thing in plain words: looking at this preceding text, the probability you assign to the word that actually appeared in the source should keep getting higher. The more absurd the guess, the harder the parameters get tweaked. All of pretraining has no second objective.</>,
    concP1: <>Talk is cheap — the trainer below lets you experience it with your own hands. Pick a continuation question, then drag the "Training" slider and watch the model go from pure guessing step by step to a veteran betting 95%. Note one detail: <b>the four questions improve at different speeds</b>; the more common a pattern is in the corpus, the earlier it is learned.</>,
    concP2: <>The real magic of this game is in step two. Lesson 2 said the most expensive part of supervised learning is <b>human-labeled answers</b> — labeling a million cat photos takes a whole team, and a million is where it tops out. The answers in word continuation come with the text itself, so the labeling cost drops to zero; the ceiling on training scale then jumps from "how many labelers can you afford" to "how big is the internet." This is the first secret to why large models can be "large": <b>it is not that the game is sophisticated, but that this game has an infinite supply.</b> No other task can do this — to make the model learn "translation" you must first hire people to align a million sentence pairs; to learn "summarization" you must first hire people to write a million summaries; only "predict the next word" turns every sentence on the entire internet into a ready-made question.</>,

    compTitle: '📖 Compression Is Intelligence: How Continuation Adds Up to "Understanding"',
    compLead: 'A reasonable doubt: how could such a simple game ever produce intelligence? The key is in "getting it right." Internet corpora hold everything imaginable, and getting all kinds of sentences right takes more than memorizing — each kind of continuation question forces the model to learn a real skill:',
    compThead: ['A continuation question really found in the corpus', 'To get it right, you must…'],
    compRows: [
      { ex: <>"他学习非常努力，因此成绩<Fill />"</>, must: <><b>Master grammar and commonsense cause-and-effect</b> — continue with "提高了" (improved), not "下降了" (declined)</> },
      { ex: <>"法国的首都是<Fill />"</>, must: <><b>Remember world facts</b> — you must have "巴黎" (Paris) stored inside</> },
      { ex: <>Last page of a detective novel: "凶手就是<Fill />"</>, must: <><b>Long-range reasoning</b> — follow tens of thousands of words of setup and crack the case yourself</> },
      { ex: <>"def add(a, b): return <Fill />"</>, must: <><b>Write code</b> — read the function name and parameters and continue with a + b</> },
    ],
    compP1: <>Now crank the scale to the max: a corpus of tens of trillions of tokens has to fit into a "brain capacity" of only hundreds of billions of parameters — two orders of magnitude apart, the source text simply will not fit. Picture a top student cramming for an exam: a three-thousand-page textbook, but only one page of notes allowed. They cannot shrink the original onto it; they can only <b>distill</b>: condense ten thousand example problems into a few methods, condense a whole chapter of history into causal threads. The model faces the very same multiple-choice problem, and it has no other choice — better to store one fact than ten thousand phrasings of "Paris is the capital of France"; better to learn grammar and patterns than to memorize all the code on GitHub.</>,
    compP2: <>There is a deeper reason compression is unavoidable: <b>rote memorization simply cannot score high in this game.</b> The sentences in the corpus vary endlessly, and the preceding text sliced out tomorrow is almost certain to be unseen — a model that memorizes the source falls apart the moment it leaves the exam room (Lesson 5\'s overfitting). Only by distilling patterns can it still continue unseen sentences correctly. The more accurate the prediction, the deeper the distillation — this is the industry saying <b>"compression is intelligence."</b></>,
    compP3: <>This also explains a phenomenon you use every day but rarely think about: ask ChatGPT to "write a poem about programmers in Li Bai\'s style" — this poem does not exist on the internet, yet it can write one — because what the parameters store is not the source text of any poem but the <b>pattern itself</b> of "Li Bai\'s style." Grammar, facts, logic, translation, programming — none of them is a separately taught course; all are byproducts of playing one game to perfection. Of course, the coin has a flip side: compression is <b>lossy</b>, and details get mashed together and confused — note this down, we will settle the account under "common misconceptions."</>,

    autoTitle: '📖 The Secret of Spitting Out Text Character by Character: A Live Broadcast of Continuation',
    autoLead: 'In training it plays continuation; in use — it still plays continuation, just in reverse: this time there is no source to check against, so the model picks a word from its own probability table, appends it to the end of the preceding text, recomputes the whole thing, and continues the next one… rolling out character by character until it produces a "time to stop" signal. This "continuing on itself" play is called autoregressive generation. Remember it, and several "weird phenomena" you see in ChatGPT instantly all make sense:',
    autoCards: [
      { label: 'What you see', en: <>The answer <b>pops out character by character</b></>, zh: <><b>The mechanism behind it:</b> not a typewriter effect. Each token is a complete round of continuation — only after computing one is there a next, and what you see is a live broadcast of the generation in progress.</> },
      { label: 'What you see', en: <>The same question, <b>a different answer each time</b></>, zh: <><b>The mechanism behind it:</b> the model outputs a probability table, not a single answer — the product "draws lots" by probability to pick a word, and each draw naturally differs. How to control this randomness is the subject of Lesson 14\'s temperature.</> },
      { label: 'What you see', en: <>Long answers sometimes <b>drift further off the longer they go</b></>, zh: <><b>The mechanism behind it:</b> one wrong step, and every step after goes wrong — a wrongly continued word gets appended to the preceding text, and later continuation takes it as true and keeps fabricating along the error. There is no "undo button"; words written out cannot be taken back.</> },
      { label: 'What you see', en: <>The longer the output, the <b>slower and more expensive</b></>, zh: <><b>The mechanism behind it:</b> when continuing the 1000th character, all 999 before it must be re-read — every token is a round of full computation. This is also the root of APIs charging by token (Lesson 11).</> },
    ],
    autoP1: <>Following this mechanism, you can also see one of its innate limitations: a continuation model has <b>no global outline</b>. It does not draft in its head before putting pen to paper; it computes one step per character written — so it occasionally finds a contradiction halfway through and can only push on and smooth it over. How do you get a model to "draft first, think it through, then answer"? That is exactly the problem reasoning models set out to solve, see you in Lesson 23.</>,

    factoryTitle: '🏭 The Data Workshop: Grunt Work and Astronomical Numbers',
    factoryLead: '"Trained on the whole internet" sounds romantic, but the workshop floor is all grunt work. The pipeline below is now clickable — five stations from raw data to base model; click any station to see what it does, then we will zoom in on the dirtiest step.',
    factoryP1: <>Station ② is the least conspicuous yet the most critical. Raw web pages are full of ads, gibberish, template text, and nonsense auto-generated by junk sites — feed it straight in and that is what the model learns. The engineering each lab pours into this step is no less than training itself:</>,
    factoryCards: [
      { label: 'Grunt work 1', en: <><b>Deduplicate</b></>, zh: <>The same viral article reposted tens of thousands of times — without deduplication the model memorizes it by rote — Lesson 5\'s overfitting in a new disguise.</> },
      { label: 'Grunt work 2', en: <><b>Filter</b></>, zh: <>Strip ads and navigation templates, remove harmful content and private information, and throw out whole pages whose quality score is too low — the cull rate for raw internet data is astonishingly high.</> },
      { label: 'Fine work', en: <><b>Mixing ratio</b></>, zh: <>Like mixing a recipe, decide what share goes to code, multilingual text, encyclopedias, and dialogue. Feed it more code and the model\'s logical reasoning is usually stronger — a widely accepted rule of thumb in the field.</> },
      { label: 'Conclusion', en: <><b>Data sets the ceiling</b></>, zh: <>Lesson 5 said "data is king," and it holds here: with the same architecture and compute, whoever has cleaner data wins. The model\'s ceiling is set right at this cleaning step.</> },
    ],
    factoryP2: <>Finally, feel the scale of this game — why pretraining is "a game for the giants":</>,
    scaleCards: [
      { label: 'Training data', en: <>tens of trillions of <b>tokens</b></>, zh: <>Reading 8 hours a day, a person would need tens of thousands of years — the model "reads" it in a few months.</> },
      { label: 'Parameter count', en: <>hundreds of billions of <b>parameters</b></>, zh: <>Hundreds of billions of learnable "knobs" (Lesson 3\'s weights), together deciding what word comes next.</> },
      { label: 'Training time', en: <>running for <b>months</b></>, zh: <>Tens of thousands of top GPUs running around the clock; when one crashes mid-run it has to climb back from a checkpoint and rerun.</> },
      { label: 'Training cost', en: <>millions of dollars in <b>electricity</b></>, zh: <>The electricity bill alone runs into the millions of dollars, and the total cost is an order of magnitude higher — only a few players are left at the table.</> },
    ],
    factoryFootnote: <>※ The above are <b>order-of-magnitude illustrations</b> for flagship models around 2025; different models vary enormously, and exact figures should follow each company\'s official disclosures.</>,

    baseTitle: '📖 The Freshly Baked Base Model: Full of Knowledge, Yet Cannot Chat',
    baseLead: 'After burning months of electricity, what you get is not ChatGPT but a "base model." Give it the most accurate mental model: a universal document completer — whatever you type, it assumes it is the opening of some document on the internet and does its utmost to "finish" that document. It has read the whole internet, but it has only this one behavior pattern. Don\'t believe it? Ask it a question —',
    baseContrast1Tag: 'What you think it will answer',
    baseContrast1Big: <>"中国的首都是哪里？" (Where is China\'s capital?)<br />—— <span className="hl">Beijing.</span></>,
    baseContrast1Note: 'A question gets an answer — this is "assistant" behavior. Unfortunately, the assistant is not a direct product of pretraining.',
    baseContrast2Tag: 'What the base model might continue',
    baseContrast2Big: <>"中国的首都是哪里？" (Where is China\'s capital?)<br />—— <span className="gap">This is a second-grade test question.</span></>,
    baseContrast2Note: 'It is dutifully continuing: in the training corpus, this sentence is more often followed by test instructions and options A, B, C, D than by an answer.',
    baseP1: <>Note, the problem is not that it <b>does not know</b>, but that it <b>does not obey</b>: it has only the one behavior pattern of "continuing" and has no concept of the social contract that "you are asking, I should answer." The playground below has four inputs — feed it each in turn, and especially try ② and ④; you will see with your own eyes that "the knowledge was in the parameters all along, you just have to strike the right pose to draw it out":</>,
    baseP2: <>Input ④ deserves a closer look: early players found that arranging the input as "问：…" (Q:) on one line and "答：" (A:) on the next, the base model — to continue this "Q&A document" sensibly — has no choice but to obediently write out the answer — this trick is precisely the <b>prototype of prompt engineering</b> (Lesson 16). But a trick is still a trick: it works sometimes and not others, and it cannot trick out assistant qualities like "politeness," "refusing harmful requests," or "admitting when it does not know." Truly training the continuation machine into an assistant that answers everything and follows the rules takes another procedure: supervised fine-tuning and reinforcement learning from human feedback — the stars of the next lesson.</>,

    pitfallsTitle: '⚠️ Common Misconceptions',
    pitfalls: [
      {
        bad: 'A large model stores a database of source text inside, and answering a question is just "looking it up" there',
        good: 'There is not a single piece of source text in the parameters, only lossily compressed statistical patterns — answers are generated on the spot, not looked up',
        why: <><b>Cause:</b> treating the model as a search engine. Cramming tens of trillions of tokens into hundreds of billions of parameters is necessarily lossy compression: the upside is it learns to generalize, the price is that details get "confused" — mashing similar names, dates, and paper titles together and earnestly fabricating things that do not exist. This is one major root of hallucination (detailed in Lesson 29).</>,
      },
      {
        bad: 'The model surfs the web every day, continuously learning new knowledge',
        good: 'The moment training ends the parameters are frozen — it knows nothing of news or memes that come after',
        why: <><b>Cause:</b> mistaking the product\'s "web search" feature for the model\'s own ability. Retraining is too expensive to do daily, so every model has a "knowledge cutoff date." To get it to discuss the latest news, you have to feed the material into the context on the spot — this "bolt-on knowledge base" approach is called RAG, covered in Lesson 18.</>,
      },
    ],

    quizTitle: '✍️ Quick Quiz',
    quiz: [
      { q: '1. Pretraining claims to "need no human labeling," yet it is constantly checking answers — does this contradict Lesson 2\'s "supervised learning needs labels"?',
        a: <><b>No contradiction.</b> Pretraining is still "learning with answers," it is just that the answers do not have to be written by humans — the next token in the source is the ready-made correct answer, which is why it is called <b>self-supervised</b>. Precisely because it drops human labeling, the most expensive bottleneck, the data scale can be pushed from "millions of labeled samples" to "tens of trillions of tokens."</> },
      { q: '2. A friend says: "It memorized the whole internet, so it must store the original Wikipedia text inside, and answering is just looking it up." Rebut this with the word "compression," and explain hallucination along the way.',
        a: <><b>It cannot fit.</b> A corpus of tens of trillions of tokens is two orders of magnitude larger than hundreds of billions of parameters, so the model can only do lossy compression — distilling patterns and discarding the source text. So an answer is "regenerated on the spot" rather than "looked up"; and because the compression is lossy, similar details get confused, so it can earnestly fabricate a citation that does not exist — this is one major source of hallucination.</> },
      { q: '3. Give a freshly pretrained base model the input "怎么煮溏心蛋？" (How do you cook a soft-boiled egg?) — guess what it most likely outputs, and why?',
        a: <>It very likely <b>continues rather than tutors</b> — for example continuing with "怎么煎牛排？怎么烤吐司？" (How do you sear a steak? How do you toast bread?) (treating it as a list of food questions to keep extending), or continuing in the tone of a forum post. Because what it learned is "what most likely follows this text," not "answering a question." Training it into an assistant that answers everything is the job of next lesson\'s SFT and RLHF.</> },
      { q: '4. ChatGPT\'s answers always pop out character by character — is this a "typewriter effect" added by a product manager, or a consequence of the mechanism?',
        a: <><b>A consequence of the mechanism.</b> Generation is autoregressive continuation: continue one token, append it to the end of the preceding text, recompute, then continue the next — only after computing one is there a next, and what you see is a live broadcast. This also incidentally explains why the longer the output the slower it is, why APIs charge by output token, and why once it continues one word wrong, it keeps fabricating along the error.</> },
    ],
  },
}

// ============================================================
// ① 接龙训练台
// ============================================================
const BAR_X = 104, BAR_W = 244
const pctText = (p) => (p < 1 ? '<1%' : Math.round(p) + '%')

// 概率数组为演示数据，与训练量等级一一对应，不随语言变化
const NT_PROBS = {
  poem: [[25, 25, 25, 25], [31, 28, 25, 16], [48, 30, 17, 5], [80, 13, 6, 1], [97, 2, 0.7, 0.3]],
  grammar: [[25, 25, 25, 25], [46, 24, 19, 11], [71, 15, 11, 3], [89, 6, 4, 1], [96, 2, 1.5, 0.5]],
  fact: [[25, 25, 25, 25], [32, 27, 22, 19], [55, 25, 14, 6], [83, 10, 6, 1], [95, 3, 1.5, 0.5]],
  code: [[25, 25, 25, 25], [27, 26, 24, 23], [41, 29, 21, 9], [73, 17, 9, 1], [94, 4, 1.5, 0.5]],
}

function NextTokenTrainer({ c }) {
  const [cur, setCur] = useState('poem')
  const [lvl, setLvl] = useState(0)
  const s = c.ntSents[cur]
  const probs = NT_PROBS[cur][lvl]
  const L = c.ntLevels[lvl]
  const pc = probs[s.correct]
  let grade, color
  if (pc >= 85) { grade = c.ntGrade.g1; color = 'var(--sage)' }
  else if (pc >= 55) { grade = c.ntGrade.g2; color = 'var(--amber)' }
  else if (pc >= 35) { grade = c.ntGrade.g3; color = 'var(--amber)' }
  else { grade = c.ntGrade.g4; color = 'var(--terracotta)' }

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.ntTitle}</span>
        <span className="demo-hint">{c.ntHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage">
          <svg id="nt-svg" viewBox="0 0 440 318" width="420" role="img" aria-label={c.ntAria}>
            <text x="220" y="28" textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--fg-0)">{s.ctx}</text>
            <text x="220" y="52" textAnchor="middle" fontSize="11.5" fill="var(--fg-2)">{c.ntProbHead}</text>
            {[0, 1, 2, 3].map((i) => {
              const y = 70 + i * 50
              const isC = i === s.correct
              return (
                <g key={i}>
                  <text x="4" y={y + 14} fontSize="13" fontWeight={isC ? 700 : 400} fill="var(--fg-0)">{s.tokens[i]}{isC ? ' ✓' : ''}</text>
                  <rect x={BAR_X} y={y} width={BAR_W} height="20" rx="10" fill="var(--bg-inset)" />
                  <rect className="bar-fill" x={BAR_X} y={y} width={(probs[i] / 100) * BAR_W} height="20" rx="10" fill={isC ? 'var(--sage)' : 'var(--sky)'} fillOpacity={isC ? 0.95 : 0.55} />
                  <text x="356" y={y + 15} fontSize="12.5" fontWeight="600" fill={isC ? 'var(--sage)' : 'var(--fg-1)'}>{pctText(probs[i])}</text>
                </g>
              )
            })}
            <text x="220" y="292" textAnchor="middle" fontSize="12" fill="var(--fg-2)">{c.ntAnswer(s.tokens[s.correct])}</text>
            <text x="220" y="311" textAnchor="middle" fontSize="12.5" fontWeight="600" fill={color}>{c.ntScore}{grade}</text>
          </svg>
        </div>
        <div className="demo-side">
          <div className="chips">
            {c.ntChips.map(([k, label]) => (
              <button key={k} className={`chip${k === cur ? ' active' : ''}`} onClick={() => setCur(k)}>{label}</button>
            ))}
          </div>
          <SliderRow label={c.ntSliderLabel} min={0} max={4} step={1} value={lvl} onChange={(v) => setLvl(Math.round(v))} format={() => L.val} />
          <h4>{L.name}</h4>
          <div className="period">{L.period}</div>
          <p>{L.desc}</p>
          <p>{s.note}</p>
          <p style={{ fontWeight: 600, color: 'var(--fg-0)' }}>{c.ntReport(s.tokens[s.correct], pctText(pc))}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ② 预训练流水线
// ============================================================
function PipelineDemo({ c }) {
  const [key, setKey] = useState('raw')
  const cls = (k) => `pl-stage${k === key ? ' active' : ' dim'}`
  const on = (k) => ({ onClick: () => setKey(k) })
  const t = c.plSvg
  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.plTitle}</span>
        <span className="demo-hint">{c.plHint}</span>
      </div>
      <div className="flow-body">
        <svg id="pl-svg" viewBox="0 0 940 220" role="img" aria-label={c.plAria}>
          <defs>
            <marker id="plarr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--fg-2)" />
            </marker>
          </defs>
          <g className={cls('raw')} {...on('raw')}>
            <text x="69" y="24" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--fg-2)">{t.s1}</text>
            <rect x="10" y="46" width="118" height="36" rx="8" fill="var(--sky-bg)" stroke="var(--sky)" strokeWidth="1" />
            <text x="69" y="69" textAnchor="middle" fontSize="13" fill="var(--fg-0)">{t.s1a}</text>
            <rect x="10" y="92" width="118" height="36" rx="8" fill="var(--sky-bg)" stroke="var(--sky)" strokeWidth="1" />
            <text x="69" y="115" textAnchor="middle" fontSize="13" fill="var(--fg-0)">{t.s1b}</text>
            <rect x="10" y="138" width="118" height="36" rx="8" fill="var(--sky-bg)" stroke="var(--sky)" strokeWidth="1" />
            <text x="69" y="161" textAnchor="middle" fontSize="13" fill="var(--fg-0)">{t.s1c}</text>
            <text x="69" y="203" textAnchor="middle" fontSize="11" fill="var(--fg-2)">{t.s1d}</text>
          </g>
          <line x1="134" y1="118" x2="154" y2="118" stroke="var(--fg-2)" strokeWidth="1.5" markerEnd="url(#plarr)" />
          <g className={cls('clean')} {...on('clean')}>
            <text x="232" y="24" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--fg-2)">{t.s2}</text>
            <rect x="160" y="58" width="144" height="120" rx="10" fill="var(--bg-inset)" stroke="var(--hairline-strong)" strokeWidth="1" />
            <text x="232" y="84" textAnchor="middle" fontSize="13.5" fontWeight="700" fill="var(--fg-0)">{t.s2t}</text>
            <text x="232" y="108" textAnchor="middle" fontSize="11.5" fill="var(--fg-1)">{t.s2a}</text>
            <text x="232" y="128" textAnchor="middle" fontSize="11.5" fill="var(--fg-1)">{t.s2b}</text>
            <text x="232" y="148" textAnchor="middle" fontSize="11.5" fill="var(--fg-1)">{t.s2c}</text>
            <text x="232" y="203" textAnchor="middle" fontSize="11" fill="var(--fg-2)">{t.s2d}</text>
          </g>
          <line x1="308" y1="118" x2="328" y2="118" stroke="var(--fg-2)" strokeWidth="1.5" markerEnd="url(#plarr)" />
          <g className={cls('tok')} {...on('tok')}>
            <text x="392" y="24" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--fg-2)">{t.s3}</text>
            <rect x="334" y="70" width="116" height="96" rx="10" fill="var(--amber-bg)" stroke="var(--amber)" strokeWidth="1" />
            <text x="392" y="102" textAnchor="middle" fontSize="13.5" fontWeight="700" fill="var(--fg-0)">{t.s3t}</text>
            <text x="392" y="126" textAnchor="middle" fontSize="11.5" fill="var(--fg-1)">{t.s3a}</text>
            <text x="392" y="144" textAnchor="middle" fontSize="11" fill="var(--fg-2)">{t.s3b}</text>
          </g>
          <line x1="454" y1="118" x2="474" y2="118" stroke="var(--fg-2)" strokeWidth="1.5" markerEnd="url(#plarr)" />
          <g className={cls('train')} {...on('train')}>
            <text x="593" y="24" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--fg-2)">{t.s4}</text>
            <rect x="480" y="50" width="226" height="136" rx="12" fill="var(--sage-bg)" stroke="var(--sage)" strokeWidth="1.5" />
            <text x="593" y="78" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--fg-0)">{t.s4t}</text>
            <text x="593" y="106" textAnchor="middle" fontSize="12.5" fill="var(--fg-0)">{t.s4a}</text>
            <path d="M 584 146 A 16 16 0 1 1 568 130" fill="none" stroke="var(--sage)" strokeWidth="1.8" markerEnd="url(#plarr)" />
            <text x="594" y="150" fontSize="11.5" fontWeight="600" fill="var(--fg-1)">{t.s4b}</text>
            <text x="593" y="203" textAnchor="middle" fontSize="11" fill="var(--fg-2)">{t.s4c}</text>
          </g>
          <line x1="710" y1="118" x2="730" y2="118" stroke="var(--fg-2)" strokeWidth="1.5" markerEnd="url(#plarr)" />
          <g className={cls('base')} {...on('base')}>
            <text x="810" y="24" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--fg-2)">{t.s5}</text>
            <rect x="736" y="62" width="148" height="112" rx="12" fill="var(--bg-inset)" stroke="var(--fg-0)" strokeWidth="1.5" />
            <text x="810" y="96" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--fg-0)">{t.s5t}</text>
            <text x="810" y="116" textAnchor="middle" fontSize="11" fill="var(--fg-2)">{t.s5a}</text>
            <text x="810" y="142" textAnchor="middle" fontSize="11.5" fill="var(--fg-1)">{t.s5b}</text>
            <text x="810" y="203" textAnchor="middle" fontSize="11" fill="var(--fg-2)">{t.s5c}</text>
          </g>
        </svg>
      </div>
      <div className="pl-detail">
        <div className="chips">
          {c.plChips.map(([k, label]) => (
            <button key={k} className={`chip${k === key ? ' active' : ''}`} onClick={() => setKey(k)}>{label}</button>
          ))}
        </div>
        <h4>{c.plData[key].title}</h4>
        <p>{c.plData[key].desc}</p>
      </div>
    </div>
  )
}

// ============================================================
// ③ 调戏一下基座模型
// ============================================================
function BaseModelDemo({ c }) {
  const [curP, setCurP] = useState('q1')
  const [curM, setCurM] = useState('base')
  const [typed, setTyped] = useState('')
  const timerRef = useRef(null)
  const d = c.bpPrompts[curP][curM]

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    const text = d.out
    if (reduceMotion()) { setTyped(text); return }
    setTyped('')
    let i = 0
    timerRef.current = setInterval(() => {
      i++
      setTyped(text.slice(0, i))
      if (i >= text.length) { clearInterval(timerRef.current); timerRef.current = null }
    }, 26)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [curP, curM])

  return (
    <div className="card demo">
      <div className="demo-head">
        <span className="demo-title">{c.bpTitle}</span>
        <span className="demo-hint">{c.bpHint}</span>
      </div>
      <div className="demo-body">
        <div className="demo-stage io-stage">
          <div className="io-stack">
            <div className="io-block">
              <div className="io-label">{c.bpInputLabel}</div>
              <div className="io-text">{c.bpPrompts[curP].input}</div>
            </div>
            <div className={`io-block out${curM === 'asst' ? ' asst' : ''}`}>
              <div className="io-label">{curM === 'base' ? c.bpOutBase : c.bpOutAsst}</div>
              <div className="io-text"><span>{typed}</span><span className="bp-caret" aria-hidden="true" /></div>
            </div>
          </div>
        </div>
        <div className="demo-side">
          <div className="side-step first">{c.bpStep1}</div>
          <div className="chips">
            {c.bpPromptChips.map(([k, label]) => (
              <button key={k} className={`chip${k === curP ? ' active' : ''}`} onClick={() => setCurP(k)}>{label}</button>
            ))}
          </div>
          <div className="side-step">{c.bpStep2}</div>
          <div className="chips">
            {c.bpModelChips.map(([k, label]) => (
              <button key={k} className={`chip${k === curM ? ' active' : ''}`} onClick={() => setCurM(k)}>{label}</button>
            ))}
          </div>
          <p>{d.why}</p>
        </div>
      </div>
    </div>
  )
}

// 函数声明（而非箭头常量）会被提升到模块顶部，
// 以便文件开头的双语内容层 C 在初始化时即可引用 <Fill />，避免 TDZ 报错导致整课懒加载卡死。
function Fill() {
  return <span className="fill" />
}

export default function L12() {
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
          {c.concCards.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.en}</div><div className="zh">{u.zh}</div></div>
          ))}
        </div>
        <div className="example mt14">
          <div className="en">{c.concExEn}</div>
          <div className="zh">{c.concExZh}</div>
        </div>
        <p className="lead mt14">{c.concP1}</p>
        <NextTokenTrainer c={c} />
        <p className="lead mt14">{c.concP2}</p>
      </Lsec>

      <Lsec title={c.compTitle} lead={c.compLead}>
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="match">
            <thead><tr><th>{c.compThead[0]}</th><th>{c.compThead[1]}</th></tr></thead>
            <tbody>
              {c.compRows.map((r, i) => (
                <tr key={i}><td className="ex">{r.ex}</td><td>{r.must}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="lead mt14">{c.compP1}</p>
        <p className="lead">{c.compP2}</p>
        <p className="lead">{c.compP3}</p>
      </Lsec>

      <Lsec title={c.autoTitle} lead={c.autoLead}>
        <div className="use-grid cols-2">
          {c.autoCards.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.en}</div><div className="zh">{u.zh}</div></div>
          ))}
        </div>
        <p className="lead mt14">{c.autoP1}</p>
      </Lsec>

      <Lsec title={c.factoryTitle} lead={c.factoryLead}>
        <PipelineDemo c={c} />
        <p className="lead mt14">{c.factoryP1}</p>
        <div className="use-grid cols-2">
          {c.factoryCards.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.en}</div><div className="zh">{u.zh}</div></div>
          ))}
        </div>
        <p className="lead mt14">{c.factoryP2}</p>
        <div className="use-grid cols-4">
          {c.scaleCards.map((u, i) => (
            <div className="card use-card" key={i}><div className="label">{u.label}</div><div className="en">{u.en}</div><div className="zh">{u.zh}</div></div>
          ))}
        </div>
        <p className="footnote mt14">{c.factoryFootnote}</p>
      </Lsec>

      <Lsec title={c.baseTitle} lead={c.baseLead}>
        <div className="contrast">
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-ink">{c.baseContrast1Tag}</span></div>
            <div className="big">{c.baseContrast1Big}</div>
            <p className="note">{c.baseContrast1Note}</p>
          </div>
          <div className="card contrast-card">
            <div className="tag"><span className="pill pill-terracotta">{c.baseContrast2Tag}</span></div>
            <div className="big">{c.baseContrast2Big}</div>
            <p className="note">{c.baseContrast2Note}</p>
          </div>
        </div>
        <p className="lead mt14">{c.baseP1}</p>
        <BaseModelDemo c={c} />
        <p className="lead mt14">{c.baseP2}</p>
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
    </>
  )
}
