import { useEffect, useRef } from 'react'

// 首页 hero：一个正在“思考”的神经网络 —— 信号逐层前向传播
// 原 index.html 的 canvas 动画，封装为自适应 + 主题感知的 React 组件
export default function NeuralNetViz() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const LAYERS = [4, 6, 6, 3]
    const PERIOD = 4200
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    let colors = {}
    let nodes = []
    let edges = []
    let activeEdges = new Set()
    let cycle = -1
    let raf = 0

    function readColors() {
      const s = getComputedStyle(document.documentElement)
      colors = {
        fg: s.getPropertyValue('--fg-0').trim(),
        accent: s.getPropertyValue('--accent').trim(),
        hairline: s.getPropertyValue('--hairline-strong').trim(),
        card: s.getPropertyValue('--bg-lift').trim(),
      }
    }

    function layout() {
      const dpr = window.devicePixelRatio || 1
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      nodes = []
      edges = []
      LAYERS.forEach((count, li) => {
        const x = w * (0.1 + 0.8 * (li / (LAYERS.length - 1)))
        const layer = []
        for (let i = 0; i < count; i++) {
          const y = h * ((i + 1) / (count + 1))
          layer.push({ x, y, layer: li })
        }
        nodes.push(layer)
      })
      for (let li = 0; li < LAYERS.length - 1; li++) {
        nodes[li].forEach((a, ai) =>
          nodes[li + 1].forEach((b, bi) => {
            edges.push({ a, b, gap: li, id: li + ':' + ai + ':' + bi })
          }),
        )
      }
    }

    function pickActive() {
      activeEdges = new Set(edges.filter(() => Math.random() < 0.45).map((e) => e.id))
    }

    function draw(wave) {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      ctx.clearRect(0, 0, w, h)
      edges.forEach((e) => {
        ctx.strokeStyle = colors.hairline
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(e.a.x, e.a.y)
        ctx.lineTo(e.b.x, e.b.y)
        ctx.stroke()
      })
      edges.forEach((e) => {
        if (!activeEdges.has(e.id)) return
        const p = wave - e.gap
        if (p <= 0 || p >= 1) return
        const x = e.a.x + (e.b.x - e.a.x) * p
        const y = e.a.y + (e.b.y - e.a.y) * p
        ctx.globalAlpha = Math.sin(p * Math.PI)
        ctx.fillStyle = colors.accent
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      })
      nodes.flat().forEach((n) => {
        const d = wave - n.layer
        const lit = Math.exp(-(d * d) / 0.06)
        const r = Math.max(4.5, Math.min(7, w / 110))
        ctx.fillStyle = colors.card
        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = colors.hairline
        ctx.lineWidth = 1
        ctx.stroke()
        if (lit > 0.02) {
          ctx.globalAlpha = lit
          ctx.fillStyle = colors.accent
          ctx.beginPath()
          ctx.arc(n.x, n.y, r - 1.5, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1
        }
      })
    }

    function frame(t) {
      const c = Math.floor(t / PERIOD)
      if (c !== cycle) {
        cycle = c
        pickActive()
      }
      const wave = ((t % PERIOD) / PERIOD) * (LAYERS.length + 0.4) - 0.3
      draw(wave)
      raf = requestAnimationFrame(frame)
    }

    readColors()
    layout()
    pickActive()

    const onScheme = () => readColors()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', onScheme)

    const ro = new ResizeObserver(() => {
      layout()
      if (reduceMotion.matches) draw(1.5)
    })
    ro.observe(canvas)

    if (reduceMotion.matches) {
      draw(1.5)
    } else {
      raf = requestAnimationFrame(frame)
    }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      mq.removeEventListener('change', onScheme)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: 250 }}
      aria-label="一个正在运行的神经网络动画：信号从输入层逐层传向输出层"
    />
  )
}
