// ============================================================
// 卷积扫描演示控制器（canvas，框架无关）
//   createConvScan(canvas, { onStatus, onPlaying })
//   → { selectKernel, togglePlay, step, reset, dispose }
// React 负责核的选择/按钮/文案；控制器负责画布绘制与逐格扫描。
// ============================================================
const FONT = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", sans-serif'
const N = 12, K = 3, M = N - K + 1 // 12×12 输入 · 3×3 核 · 10×10 特征图

const PATTERN = [
  '............', '.##########.', '.##########.', '........##..',
  '.......##...', '......##....', '.....##.....', '.....##.....',
  '....##......', '....##......', '...##.......', '............',
]
const IMG = []
PATTERN.forEach((row, r) => {
  for (let c = 0; c < N; c++) {
    const i = r * N + c
    IMG.push(row[c] === '#' ? 222 + ((i * 31) % 34) : 6 + ((i * 29) % 17))
  }
})

const b = 1 / 9
export const KERNELS = {
  h: { name: '水平边缘核', sub: '检测上下方向的亮度跳变', maxAbs: 1,
    desc: '上排 −1、下排 +1：窗口里“上暗下亮”得正高分，“上亮下暗”得负高分（取绝对值后同样点亮）。看特征图：7 的横杠轮廓被点亮，笔画内部和空白处一片漆黑 —— 没有变化，就没有响应。',
    w: [[-1, -1, -1], [0, 0, 0], [1, 1, 1]], norm: (s) => Math.min(1, Math.abs(s) / 600) },
  v: { name: '垂直边缘核', sub: '检测左右方向的亮度跳变', maxAbs: 1,
    desc: '左列 −1、右列 +1：专找“左右亮度突变”。这次轮到 7 的斜笔画两侧发亮，横杠中段反而安静 —— 同一张图，换一个核，“看到”的世界完全不同。',
    w: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], norm: (s) => Math.min(1, Math.abs(s) / 600) },
  sharp: { name: '锐化核', sub: '放大每个像素与邻居的差异', maxAbs: 5,
    desc: '中心 5、上下左右 −1：等于“自己 − 邻居平均”再放大，差异被强化。输出仍像原图，但笔画边缘变“脆”。修图软件里的「锐化」按钮，底层就是这张 3×3 小表格。',
    w: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], norm: (s) => Math.min(1, Math.max(0, s) / 255) },
  blur: { name: '模糊核', sub: '把每个像素换成邻域平均值', maxAbs: b,
    desc: '9 个格子都是 1/9：每个像素被换成 3×3 邻域的平均值，尖锐的笔画被抹开。毛玻璃效果、隐私打码的第一步，往往就是它。',
    w: [[b, b, b], [b, b, b], [b, b, b]], norm: (s) => Math.min(1, Math.max(0, s) / 255) },
}

const W = 684, H = 304
const IX = 10, IY = 36, IC = 20
const KX = 288, KY = 102, KC = 36
const OX = 430, OY = 36, OC = 24

export function createConvScan(canvas, { onStatus, onPlaying }) {
  const ctx = canvas.getContext('2d')
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let colors = {}
  function readColors() {
    const s = getComputedStyle(document.documentElement)
    colors = {
      fg0: s.getPropertyValue('--fg-0').trim(), fg1: s.getPropertyValue('--fg-1').trim(),
      fg2: s.getPropertyValue('--fg-2').trim(), hairS: s.getPropertyValue('--hairline-strong').trim(),
      accent: s.getPropertyValue('--accent').trim(), sage: s.getPropertyValue('--sage').trim(),
      terra: s.getPropertyValue('--terracotta').trim(), inset: s.getPropertyValue('--bg-inset').trim(),
    }
  }
  function setupCanvas() {
    const dpr = window.devicePixelRatio || 1
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = '100%'
    canvas.style.maxWidth = W + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  let cur = 'h', pos = -1, playing = false, timer = null
  let fmap = new Array(M * M).fill(null)

  function convAt(idx) {
    const r = Math.floor(idx / M), c = idx % M, k = KERNELS[cur]
    let s = 0
    for (let i = 0; i < K; i++) for (let j = 0; j < K; j++) s += IMG[(r + i) * N + (c + j)] * k.w[i][j]
    return k.norm(s)
  }
  const fmt = (v) => (Math.abs(v - b) < 1e-9 ? '1/9' : (v < 0 ? '−' : '') + Math.abs(v))

  function draw() {
    ctx.clearRect(0, 0, W, H)
    const k = KERNELS[cur]
    const has = pos >= 0
    const idx = Math.min(Math.max(pos, 0), M * M - 1)
    const r = Math.floor(idx / M), c = idx % M

    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = colors.fg2; ctx.font = '600 12px ' + FONT
    ctx.fillText('输入图像 12×12', IX + (IC * N) / 2, 24)
    ctx.fillText('卷积核 3×3', KX + KC * 1.5, KY - 12)
    ctx.fillText('特征图 10×10', OX + (OC * M) / 2, 24)
    ctx.font = '11px ' + FONT
    ctx.fillText('每格 = 一个 0~255 的亮度值', IX + (IC * N) / 2, IY + IC * N + 18)
    ctx.fillText('越亮 = 响应越强', OX + (OC * M) / 2, OY + OC * M + 18)
    ctx.font = '600 18px ' + FONT
    ctx.fillText('∗', 269, 164); ctx.fillText('=', 415, 164)

    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const v = IMG[i * N + j]
      ctx.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'
      ctx.fillRect(IX + j * IC + 0.5, IY + i * IC + 0.5, IC - 1, IC - 1)
    }

    if (has) {
      ctx.strokeStyle = colors.accent; ctx.lineWidth = 2.5
      ctx.strokeRect(IX + c * IC + 1, IY + r * IC + 1, IC * K - 2, IC * K - 2)
      ctx.globalAlpha = 0.3; ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(IX + (c + K) * IC, IY + r * IC); ctx.lineTo(KX, KY)
      ctx.moveTo(IX + (c + K) * IC, IY + (r + K) * IC); ctx.lineTo(KX, KY + KC * K)
      ctx.stroke(); ctx.globalAlpha = 1
    }

    for (let i = 0; i < K; i++) for (let j = 0; j < K; j++) {
      const x = KX + j * KC, y = KY + i * KC, w = k.w[i][j]
      ctx.fillStyle = colors.inset
      ctx.fillRect(x + 0.5, y + 0.5, KC - 1, KC - 1)
      if (w !== 0) {
        ctx.fillStyle = w > 0 ? colors.sage : colors.terra
        ctx.globalAlpha = 0.16 + (0.34 * Math.abs(w)) / k.maxAbs
        ctx.fillRect(x + 0.5, y + 0.5, KC - 1, KC - 1)
        ctx.globalAlpha = 1
      }
      ctx.fillStyle = colors.fg0
      ctx.font = (fmt(w) === '1/9' ? '700 11px ' : '700 14px ') + FONT
      ctx.textBaseline = 'middle'
      ctx.fillText(fmt(w), x + KC / 2, y + KC / 2 + 1)
      ctx.textBaseline = 'alphabetic'
    }
    ctx.strokeStyle = colors.hairS; ctx.lineWidth = 1
    ctx.strokeRect(KX + 0.5, KY + 0.5, KC * K - 1, KC * K - 1)

    ctx.fillStyle = colors.fg1; ctx.font = '600 12px ' + FONT
    ctx.fillText('响应强度 ' + (has && fmap[idx] != null ? fmap[idx].toFixed(2) : '—'), KX + KC * 1.5, KY + KC * K + 26)

    for (let i = 0; i < M; i++) for (let j = 0; j < M; j++) {
      const v = fmap[i * M + j]
      const g = v == null ? 8 : Math.round(8 + v * 247)
      ctx.fillStyle = 'rgb(' + g + ',' + g + ',' + g + ')'
      ctx.fillRect(OX + j * OC + 0.5, OY + i * OC + 0.5, OC - 1, OC - 1)
    }
    if (has) {
      ctx.strokeStyle = colors.accent; ctx.lineWidth = 2
      ctx.strokeRect(OX + c * OC + 1, OY + r * OC + 1, OC - 2, OC - 2)
    }
  }

  function setStatus() {
    if (pos < 0) onStatus('就绪 —— 点「播放」让探测器出发')
    else if (pos < M * M - 1) onStatus('扫描中 · 第 ' + (pos + 1) + '/100 格 · 输出位置（行 ' + (Math.floor(pos / M) + 1) + '，列 ' + ((pos % M) + 1) + '）')
    else onStatus('扫描完成 · 100 个响应值拼成了右侧特征图')
  }
  function setPlaying(v) { playing = v; onPlaying(v) }
  function stop() {
    setPlaying(false)
    if (timer) { clearInterval(timer); timer = null }
  }
  function step() {
    if (pos >= M * M - 1) { stop(); return }
    pos++
    fmap[pos] = convAt(pos)
    draw(); setStatus()
    if (pos >= M * M - 1) stop()
  }
  function resetMap() {
    pos = -1
    fmap = new Array(M * M).fill(null)
    draw(); setStatus()
  }
  function play() {
    if (pos >= M * M - 1) resetMap()
    setPlaying(true)
    timer = setInterval(step, 80)
  }
  function finish() {
    for (let i = 0; i < M * M; i++) fmap[i] = convAt(i)
    pos = M * M - 1
    stop(); draw(); setStatus()
  }

  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const onScheme = () => { readColors(); draw() }
  mq.addEventListener('change', onScheme)

  readColors()
  setupCanvas()

  return {
    selectKernel(key) {
      cur = key
      stop()
      if (reduceMotion) finish()
      else { resetMap(); play() }
    },
    togglePlay() { playing ? stop() : play() },
    step() { stop(); step() },
    reset() { stop(); resetMap() },
    dispose() {
      stop()
      mq.removeEventListener('change', onScheme)
    },
  }
}
