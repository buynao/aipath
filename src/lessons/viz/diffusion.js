// ============================================================
// 扩散模型 canvas 控制器（框架无关）
//   createDenoise(canvas, { onUpdate(step, caption, phase) })
//   createCfg(canvas, { onTier(title, desc) })
// 颜色取自设计 token，随深浅色重画。原理示意，非真实模型。
// ============================================================
const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim()

const PATTERNS = {
  rings(g, S) {
    g.fillStyle = cssVar('--bg-0'); g.fillRect(0, 0, S, S)
    const colors = [cssVar('--amber'), cssVar('--terracotta')]
    for (let i = 5; i >= 0; i--) {
      g.fillStyle = colors[i % 2]
      g.beginPath(); g.arc(S / 2, S / 2, S * 0.08 + i * S * 0.075, 0, Math.PI * 2); g.fill()
    }
  },
  mountain(g, S) {
    g.fillStyle = cssVar('--sky'); g.fillRect(0, 0, S, S)
    g.fillStyle = cssVar('--amber'); g.beginPath(); g.arc(S * 0.7, S * 0.3, S * 0.12, 0, Math.PI * 2); g.fill()
    g.fillStyle = cssVar('--sage'); g.beginPath()
    g.moveTo(0, S); g.lineTo(0, S * 0.62); g.lineTo(S * 0.34, S * 0.36); g.lineTo(S * 0.62, S * 0.66); g.lineTo(S * 0.8, S * 0.52); g.lineTo(S, S * 0.7); g.lineTo(S, S); g.closePath(); g.fill()
    g.fillStyle = cssVar('--fg-0')
    g.beginPath(); g.moveTo(0, S); g.lineTo(S * 0.18, S * 0.66); g.lineTo(S * 0.46, S); g.closePath(); g.fill()
    g.beginPath(); g.moveTo(S * 0.4, S); g.lineTo(S * 0.72, S * 0.6); g.lineTo(S, S); g.closePath(); g.fill()
  },
  checker(g, S) {
    const n = 8, cell = S / n
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      g.fillStyle = (r + c) % 2 === 0 ? cssVar('--terracotta') : cssVar('--bg-0')
      g.fillRect(c * cell, r * cell, cell + 1, cell + 1)
    }
  },
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createDenoise(canvas, { onUpdate }) {
  const ctx = canvas.getContext('2d')
  const S = canvas.width
  const MAX = 50
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const noise = new Uint8ClampedArray(S * S * 4)
  const rand = mulberry32(20250611)
  for (let i = 0; i < noise.length; i += 4) {
    noise[i] = rand() * 255; noise[i + 1] = rand() * 255; noise[i + 2] = rand() * 255; noise[i + 3] = 255
  }

  const targetC = document.createElement('canvas'); targetC.width = targetC.height = S
  const blurC = document.createElement('canvas'); blurC.width = blurC.height = S
  let currentKey = 'rings'
  let curStep = 0
  function buildTarget() {
    const g = targetC.getContext('2d')
    g.clearRect(0, 0, S, S)
    PATTERNS[currentKey](g, S)
  }

  function phaseText(p) {
    if (p === 0) return '🌫️ 纯噪声：这就是生成的起点 —— 一张随机雪花，画“藏”在里面。'
    if (p < 0.35) return '🎨 前几步先定大色块：去噪器在决定整体色调和布局往哪边走。'
    if (p < 0.75) return '🖼️ 轮廓浮现：构图和色块已定，细节还糊着 —— 中段步骤负责成形。'
    if (p < 1) return '🔍 细节冲刺：最后几步锐化边缘和纹理，画面越来越清晰。'
    return '✅ 去噪完成。这幅画不存在于任何素材库 —— 它是从噪声里被一步步“擦”出来的。'
  }

  function render(step) {
    curStep = step
    const p = step / MAX
    const w = p * p * (3 - 2 * p)
    const blurPx = (1 - p) * 6
    const b = blurC.getContext('2d')
    b.filter = 'none'; b.clearRect(0, 0, S, S); b.drawImage(targetC, 0, 0)
    if (blurPx > 0.05) { b.filter = 'blur(' + blurPx.toFixed(1) + 'px)'; b.drawImage(targetC, 0, 0); b.filter = 'none' }
    const img = b.getImageData(0, 0, S, S)
    const d = img.data
    for (let i = 0; i < d.length; i += 4) {
      d[i] = d[i] * w + noise[i] * (1 - w)
      d[i + 1] = d[i + 1] * w + noise[i + 1] * (1 - w)
      d[i + 2] = d[i + 2] * w + noise[i + 2] * (1 - w)
      d[i + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
    onUpdate(step, '步数 ' + step + ' / ' + MAX + ' · 噪声残留 ' + Math.round((1 - w) * 100) + '%', phaseText(p))
  }

  let raf = null
  function stopPlay() { if (raf) { cancelAnimationFrame(raf); raf = null } }

  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const onScheme = () => { buildTarget(); render(curStep) }
  mq.addEventListener('change', onScheme)

  buildTarget()
  render(reduced ? MAX : 0)

  return {
    max: MAX,
    setStep(step) { stopPlay(); render(step) },
    setPattern(key) { currentKey = key; buildTarget(); render(curStep) },
    play(onTick, onEnd) {
      if (raf) { stopPlay(); onEnd(); return }
      if (reduced) { render(MAX); onTick(MAX); onEnd(); return }
      const t0 = performance.now(), dur = 4000
      const frame = (t) => {
        const k = Math.min(1, (t - t0) / dur)
        const step = Math.round(k * MAX)
        render(step); onTick(step)
        if (k < 1) raf = requestAnimationFrame(frame)
        else { stopPlay(); onEnd() }
      }
      raf = requestAnimationFrame(frame)
    },
    isPlaying() { return !!raf },
    dispose() { stopPlay(); mq.removeEventListener('change', onScheme) },
  }
}

const CFG_TIERS = [
  { max: 4, title: '🙉 几乎不听导航', desc: '引导太弱：模型自由发挥，画面发灰、模糊，常常跑题 ——「落日」可能根本不出现。' },
  { max: 9, title: '✅ 贴题又自然', desc: '常用档位：既听文字的话，又保住画面的自然质感。多数产品的默认值就在这一带。' },
  { max: 14, title: '📢 越来越听话', desc: '更贴题了，但代价开始显现：颜色变艳、对比变冲，画面有点“用力过猛”。' },
  { max: 20, title: '🍭 过饱和警告', desc: '导航音量开到最大：颜色过饱和、画面发“塑料”—— 司机被吼得紧张，反而开不好车。' },
]

export function createCfg(canvas, { onTier }) {
  const ctx = canvas.getContext('2d')
  const S = canvas.width
  const base = document.createElement('canvas'); base.width = base.height = S
  let curCfg = 7
  function rebuild() { const g = base.getContext('2d'); g.clearRect(0, 0, S, S); PATTERNS.mountain(g, S) }

  function render(cfg) {
    curCfg = cfg
    ctx.clearRect(0, 0, S, S); ctx.filter = 'none'; ctx.drawImage(base, 0, 0)
    if (cfg < 7) {
      const k = (7 - cfg) / 6
      ctx.filter = 'saturate(' + (1 - k * 0.55).toFixed(2) + ') blur(' + (k * 2.4).toFixed(1) + 'px)'
      ctx.drawImage(base, 0, 0); ctx.filter = 'none'
    } else if (cfg > 8) {
      const k2 = (cfg - 8) / 12
      ctx.filter = 'saturate(' + (1 + k2 * 1.6).toFixed(2) + ') contrast(' + (1 + k2 * 0.4).toFixed(2) + ')'
      ctx.drawImage(base, 0, 0); ctx.filter = 'none'
    }
    const tier = CFG_TIERS.find((t) => cfg <= t.max) || CFG_TIERS[CFG_TIERS.length - 1]
    onTier(tier.title, tier.desc)
  }

  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const onScheme = () => { rebuild(); render(curCfg) }
  mq.addEventListener('change', onScheme)

  rebuild(); render(7)
  return {
    setCfg(cfg) { render(cfg) },
    dispose() { mq.removeEventListener('change', onScheme) },
  }
}
