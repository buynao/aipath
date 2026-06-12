import { useEffect, useRef } from 'react'

// 首页 hero：一个正在“思考”的神经网络
// 伪 3D 透视投影（慢速转动 + 鼠标视差）+ 琥珀色信号脉冲拖尾
// 交互：鼠标掠过 / 点按一个神经元，会点亮它并沿网络向后级联放电
// 纯 Canvas 2D 实现，无额外依赖；颜色取自设计系统 CSS 变量
export default function NeuralNetViz() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const LAYERS = [5, 7, 7, 4]
    const PERIOD = 4600 // 一轮前向传播的时长（ms）
    const FOCAL = 3.4 // 透视焦距（世界坐标单位）
    const MAX_SPARKS = 240
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    let colors = {}
    let nodes = []
    let edges = []
    let activeIds = new Set()
    let sparks = [] // 鼠标点燃后沿边级联的脉冲
    let cycle = -1
    let raf = 0
    let running = false
    let visible = true
    let last = 0
    let w = 0
    let h = 0

    const view = { yaw: 0, pitch: 0.1 }
    const mouse = { x: -1e4, y: -1e4, yaw: 0, pitch: 0 }

    function readColors() {
      const s = getComputedStyle(document.documentElement)
      colors = {
        accent: s.getPropertyValue('--accent').trim(),
        amber: s.getPropertyValue('--amber').trim() || '#BA8651',
        hairline: s.getPropertyValue('--hairline-strong').trim(),
        card: s.getPropertyValue('--bg-lift').trim(),
      }
    }

    function build() {
      nodes = []
      edges = []
      LAYERS.forEach((count, li) => {
        for (let i = 0; i < count; i++) {
          nodes.push({
            layer: li,
            x: (li / (LAYERS.length - 1) - 0.5) * 2.3,
            y: ((i + 1) / (count + 1) - 0.5) * 1.75,
            z: (Math.random() - 0.5) * 0.85,
            wobble: Math.random() * Math.PI * 2,
            fire: 0, // 被点燃后的余晖，逐帧衰减
            out: [],
            sx: 0,
            sy: 0,
            s: 1,
          })
        }
      })
      const byLayer = LAYERS.map((_, li) => nodes.filter((n) => n.layer === li))
      for (let li = 0; li < LAYERS.length - 1; li++) {
        byLayer[li].forEach((a, ai) =>
          byLayer[li + 1].forEach((b, bi) => {
            const e = { a, b, gap: li, id: li + ':' + ai + ':' + bi }
            edges.push(e)
            a.out.push(e)
          }),
        )
      }
    }

    function resize() {
      const dpr = window.devicePixelRatio || 1
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function pickActive() {
      activeIds = new Set(edges.filter(() => Math.random() < 0.5).map((e) => e.id))
    }

    function project(t) {
      const scale = Math.min(w * 0.36, h * 0.52)
      const ca = Math.cos(view.yaw)
      const sa = Math.sin(view.yaw)
      const cb = Math.cos(view.pitch)
      const sb = Math.sin(view.pitch)
      nodes.forEach((n) => {
        const wob = reduceMotion.matches ? 0 : Math.sin(t * 0.0011 + n.wobble) * 0.035
        const y = n.y + wob
        const x1 = n.x * ca + n.z * sa
        const z1 = -n.x * sa + n.z * ca
        const y1 = y * cb - z1 * sb
        const z2 = y * sb + z1 * cb
        const s = FOCAL / (FOCAL + z2)
        n.sx = w / 2 + x1 * s * scale
        n.sy = h / 2 + y1 * s * scale
        n.s = s
      })
    }

    function glowDot(x, y, radius, color, alpha) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, radius)
      g.addColorStop(0, color)
      g.addColorStop(1, 'transparent')
      ctx.globalAlpha = alpha
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }

    // 一颗沿边运动的信号：发光头部 + 渐隐拖尾
    function drawSignal(e, p, intensity) {
      const hx = e.a.sx + (e.b.sx - e.a.sx) * p
      const hy = e.a.sy + (e.b.sy - e.a.sy) * p
      const t0 = Math.max(0, p - 0.24)
      const tx = e.a.sx + (e.b.sx - e.a.sx) * t0
      const ty = e.a.sy + (e.b.sy - e.a.sy) * t0
      const s = (e.a.s + e.b.s) / 2
      const grad = ctx.createLinearGradient(tx, ty, hx, hy)
      grad.addColorStop(0, 'transparent')
      grad.addColorStop(1, colors.amber)
      ctx.globalAlpha = intensity
      ctx.strokeStyle = grad
      ctx.lineWidth = 1.6 * s
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(tx, ty)
      ctx.lineTo(hx, hy)
      ctx.stroke()
      ctx.globalAlpha = 1
      glowDot(hx, hy, 9 * s, colors.amber, intensity * 0.8)
      ctx.globalAlpha = intensity
      ctx.fillStyle = colors.amber
      ctx.beginPath()
      ctx.arc(hx, hy, 2.4 * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }

    function ignite(n, k) {
      n.fire = Math.max(n.fire, k)
      if (k <= 0.3 || sparks.length > MAX_SPARKS) return
      n.out.forEach((e) => {
        sparks.push({ e, p: 0, v: 0.0011 + Math.random() * 0.0006, k: k * 0.6 })
      })
    }

    function draw(t, wave) {
      ctx.clearRect(0, 0, w, h)

      // 结构：墨色细线，近实远虚
      edges.forEach((e) => {
        const s = (e.a.s + e.b.s) / 2
        ctx.globalAlpha = Math.max(0.3, Math.min(1, (s - 0.78) * 2.4))
        ctx.strokeStyle = colors.hairline
        ctx.lineWidth = s
        ctx.beginPath()
        ctx.moveTo(e.a.sx, e.a.sy)
        ctx.lineTo(e.b.sx, e.b.sy)
        ctx.stroke()
      })
      ctx.globalAlpha = 1

      // 前向传播波：沿激活边运动的信号
      edges.forEach((e) => {
        if (!activeIds.has(e.id)) return
        const p = wave - e.gap
        if (p <= 0 || p >= 1) return
        drawSignal(e, p, Math.sin(p * Math.PI))
      })

      // 鼠标点燃的级联脉冲
      sparks.forEach((sp) => {
        if (sp.p > 0 && sp.p < 1) drawSignal(sp.e, sp.p, sp.k)
      })

      // 节点：远的先画，近的盖在上面
      const order = [...nodes].sort((a, b) => a.s - b.s)
      order.forEach((n) => {
        const d = wave - n.layer
        const lit = Math.min(1, Math.exp(-(d * d) / 0.06) + n.fire)
        const r = Math.max(4.5, Math.min(7.5, w / 100)) * n.s
        if (lit > 0.04) glowDot(n.sx, n.sy, r * 3.4, colors.amber, lit * 0.55)
        ctx.fillStyle = colors.card
        ctx.beginPath()
        ctx.arc(n.sx, n.sy, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = colors.hairline
        ctx.lineWidth = 1
        ctx.stroke()
        if (lit > 0.02) {
          ctx.globalAlpha = lit
          ctx.fillStyle = colors.accent
          ctx.beginPath()
          ctx.arc(n.sx, n.sy, r - 1.5, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1
        }
      })
    }

    function step(dt, t) {
      // 视角：自转 + 鼠标视差，缓动跟随
      const targetYaw = Math.sin(t * 0.00016) * 0.18 + mouse.yaw
      const targetPitch = 0.1 + mouse.pitch
      view.yaw += (targetYaw - view.yaw) * 0.05
      view.pitch += (targetPitch - view.pitch) * 0.05

      sparks = sparks.filter((sp) => {
        sp.p += sp.v * dt
        if (sp.p >= 1) {
          ignite(sp.e.b, sp.k)
          return false
        }
        return true
      })
      nodes.forEach((n) => {
        n.fire = Math.max(0, n.fire - dt * 0.0009)
      })
    }

    function frame(t) {
      const dt = Math.min(t - last || 16, 64)
      last = t
      const c = Math.floor(t / PERIOD)
      if (c !== cycle) {
        cycle = c
        pickActive()
      }
      step(dt, t)
      project(t)
      draw(t, ((t % PERIOD) / PERIOD) * (LAYERS.length + 0.4) - 0.3)
      raf = requestAnimationFrame(frame)
    }

    function drawStatic() {
      view.yaw = 0.4
      view.pitch = 0.14
      project(0)
      draw(0, 1.5)
    }

    function start() {
      if (running || reduceMotion.matches) return
      running = true
      last = 0
      raf = requestAnimationFrame(frame)
    }

    function stop() {
      running = false
      cancelAnimationFrame(raf)
    }

    function nearestNode(x, y) {
      let best = null
      let bestD = 26
      nodes.forEach((n) => {
        const d = Math.hypot(n.sx - x, n.sy - y)
        if (d < bestD) {
          bestD = d
          best = n
        }
      })
      return best
    }

    function onPointerMove(e) {
      mouse.x = e.offsetX
      mouse.y = e.offsetY
      mouse.yaw = (mouse.x / w - 0.5) * 0.5
      mouse.pitch = (mouse.y / h - 0.5) * 0.3
      const n = nearestNode(mouse.x, mouse.y)
      canvas.style.cursor = n ? 'pointer' : 'default'
      if (n && n.fire < 0.35) ignite(n, 1)
    }

    function onPointerDown(e) {
      const n = nearestNode(e.offsetX, e.offsetY)
      if (n) ignite(n, 1)
    }

    function onPointerLeave() {
      mouse.yaw = 0
      mouse.pitch = 0
      canvas.style.cursor = 'default'
    }

    readColors()
    build()
    resize()
    pickActive()

    const onScheme = () => readColors()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', onScheme)

    const ro = new ResizeObserver(() => {
      resize()
      if (reduceMotion.matches) drawStatic()
    })
    ro.observe(canvas)

    // 滚出视口时暂停动画
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
      else stop()
    })
    io.observe(canvas)

    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointerleave', onPointerLeave)

    if (reduceMotion.matches) drawStatic()
    else start()

    return () => {
      stop()
      ro.disconnect()
      io.disconnect()
      mq.removeEventListener('change', onScheme)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: 300, touchAction: 'pan-y' }}
      aria-label="一个正在运行的神经网络动画：信号从输入层逐层传向输出层，鼠标触碰可点亮神经元"
    />
  )
}
