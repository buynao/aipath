// ============================================================
// 词向量星空控制器（three.js，框架无关）
//   createCosmos(host) → { select(key), startAnalogy(), dispose() }
// React 负责胶囊与文案；控制器负责 3D 场景、群落高亮、关系箭头与类比动画。
// 36 个中文词、6 个语义簇，坐标为教学手工摆放。
// ============================================================
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const GROUP_COLOR = { animal: '--sage', food: '--amber', emotion: '--terracotta', job: '--sky', royal: '--fg-0', capital: '--fg-0' }
const WORDS = [
  ['猫', 'animal', -7.5, 3.5, -1.5], ['狗', 'animal', -6.4, 3.1, -2.3], ['老虎', 'animal', -7.9, 2.3, -2.8],
  ['兔子', 'animal', -6.1, 4.1, -1.0], ['大象', 'animal', -8.5, 3.0, -3.3], ['熊猫', 'animal', -7.0, 4.4, -2.7],
  ['米饭', 'food', 7.4, -1.6, 3.4], ['面条', 'food', 6.5, -2.3, 2.6], ['饺子', 'food', 7.9, -2.7, 3.1],
  ['披萨', 'food', 6.1, -1.3, 3.9], ['汉堡', 'food', 6.8, -3.1, 4.0], ['寿司', 'food', 8.0, -0.9, 2.4],
  ['开心', 'emotion', -1.4, -5.4, 5.4], ['悲伤', 'emotion', -2.7, -6.6, 4.6], ['愤怒', 'emotion', -1.7, -7.1, 5.9],
  ['平静', 'emotion', -2.9, -5.1, 5.2], ['惊讶', 'emotion', -0.9, -6.1, 4.3], ['害怕', 'emotion', -2.2, -6.0, 6.3],
  ['医生', 'job', 3.4, 6.4, -4.6], ['教师', 'job', 2.5, 5.6, -5.5], ['工程师', 'job', 3.9, 6.9, -5.6],
  ['厨师', 'job', 2.1, 6.2, -4.1], ['警察', 'job', 3.0, 5.1, -5.9], ['律师', 'job', 4.1, 5.8, -4.3],
  ['国王', 'royal', -2.4, 0.8, -7.4], ['女王', 'royal', 0.25, 0.95, -6.15],
  ['男人', 'royal', -4.0, -0.6, -8.2], ['女人', 'royal', -1.6, -0.8, -6.8],
  ['王子', 'royal', -3.2, 2.2, -8.8], ['公主', 'royal', -0.8, 2.0, -7.4],
  ['中国', 'capital', 7.6, 0.6, -4.2], ['北京', 'capital', 9.2, 3.2, -4.4],
  ['日本', 'capital', 6.2, -0.6, -5.8], ['东京', 'capital', 7.8, 2.0, -6.0],
  ['法国', 'capital', 7.0, -1.6, -2.6], ['巴黎', 'capital', 8.6, 1.0, -2.8],
]
const MATCH = {
  all: () => true,
  animal: (it) => it.g === 'animal',
  food: (it) => it.g === 'food',
  emotion: (it) => it.g === 'emotion',
  job: (it) => it.g === 'job',
  relation: (it) => it.g === 'royal' || it.g === 'capital',
}

export function createCosmos(host) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim()
  const cssColor = (n) => new THREE.Color(css(n).replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, 'rgb($1,$2,$3)'))

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2))
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, 4 / 3, 0.1, 300)
  camera.position.set(15, 8, 21)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 0, -1)
  controls.enableDamping = true
  controls.autoRotate = !reduced
  controls.autoRotateSpeed = 0.55
  controls.minDistance = 8
  controls.maxDistance = 70

  function dotTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 64
    const g = c.getContext('2d')
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.4, 'rgba(255,255,255,0.85)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }
  function labelTexture(text, color) {
    const fs = 46, pad = 14
    const probe = document.createElement('canvas').getContext('2d')
    const font = '600 ' + fs + 'px ui-sans-serif, system-ui, "PingFang SC", "Microsoft YaHei", sans-serif'
    probe.font = font
    const w = Math.ceil(probe.measureText(text).width) + pad * 2
    const c = document.createElement('canvas')
    c.width = w; c.height = fs + pad * 2
    const g = c.getContext('2d')
    g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'
    g.fillStyle = color
    g.fillText(text, c.width / 2, c.height / 2)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }

  const dotTex = dotTexture()
  const items = []
  const byName = {}
  WORDS.forEach(([t, g, x, y, z]) => {
    const dot = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: cssColor(GROUP_COLOR[g]), transparent: true, depthWrite: false }))
    dot.position.set(x, y, z)
    dot.scale.setScalar(0.85)
    const lbl = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture(t, css('--fg-0')), transparent: true, depthWrite: false }))
    lbl.position.set(x, y + 0.8, z)
    const H = 1.05
    lbl.scale.set((lbl.material.map.image.width / lbl.material.map.image.height) * H, H, 1)
    scene.add(dot, lbl)
    const item = { t, g, dot, lbl, pos: new THREE.Vector3(x, y, z) }
    items.push(item); byName[t] = item
  })

  // 背景星点（确定性散布，避免 Math.random 破坏 resume；用三角函数生成）
  const starN = 140, starPos = new Float32Array(starN * 3)
  for (let i = 0; i < starN; i++) {
    const rnd = (k) => { const v = Math.sin((i * 12.9898 + k * 78.233) * 43758.5453); return v - Math.floor(v) }
    const r = 15 + rnd(1) * 16, th = rnd(2) * Math.PI * 2, ph = Math.acos(2 * rnd(3) - 1)
    starPos[i * 3] = r * Math.sin(ph) * Math.cos(th)
    starPos[i * 3 + 1] = r * Math.cos(ph)
    starPos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th)
  }
  const starGeo = new THREE.BufferGeometry()
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
  const starMat = new THREE.PointsMaterial({ color: cssColor('--fg-2'), size: 0.09, transparent: true, opacity: 0.5 })
  scene.add(new THREE.Points(starGeo, starMat))

  const arrowGroup = new THREE.Group()
  scene.add(arrowGroup)
  function addArrow(fromName, toName, colorVar) {
    const a = byName[fromName].pos, b = byName[toName].pos
    const dir = new THREE.Vector3().subVectors(b, a)
    const len = dir.length()
    arrowGroup.add(new THREE.ArrowHelper(dir.normalize(), a, len, cssColor(colorVar), 0.8, 0.42))
  }
  function clearArrows() { while (arrowGroup.children.length) arrowGroup.remove(arrowGroup.children[0]) }

  let marker = null
  function clearMarker() {
    if (marker) { scene.remove(marker); marker = null }
    byName['女王'].dot.scale.setScalar(0.85)
  }
  function focus(fn) {
    items.forEach((it) => {
      const on = fn(it)
      it.dot.material.opacity = on ? 1 : 0.1
      it.lbl.material.opacity = on ? 0.95 : 0.07
    })
  }

  let analogy = null
  let currentKey = 'all'

  function select(key) {
    currentKey = key
    analogy = null
    clearArrows(); clearMarker()
    focus(MATCH[key] || MATCH.all)
    if (key === 'relation') {
      addArrow('国王', '女王', '--terracotta')
      addArrow('男人', '女人', '--terracotta')
      addArrow('王子', '公主', '--terracotta')
      addArrow('中国', '北京', '--sky')
      addArrow('日本', '东京', '--sky')
      addArrow('法国', '巴黎', '--sky')
    }
  }

  function startAnalogy() {
    clearArrows(); clearMarker()
    const cast = ['国王', '男人', '女人', '女王']
    focus((it) => cast.includes(it.t))
    const A = byName['男人'].pos, B = byName['女人'].pos, K = byName['国王'].pos
    const G = new THREE.Vector3().subVectors(B, A)
    const len = G.length()
    const nd = G.clone().normalize()
    const target = K.clone().add(G)
    const red = cssColor('--terracotta')
    const a1 = new THREE.ArrowHelper(nd, A, reduced ? len : 0.05, red, 0.8, 0.42)
    const a2 = new THREE.ArrowHelper(nd, A.clone(), len, red, 0.8, 0.42)
    a2.visible = reduced
    if (reduced) a2.position.copy(K)
    arrowGroup.add(a1, a2)
    marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: red, transparent: true, opacity: 0.85, depthWrite: false }))
    marker.position.copy(target)
    marker.scale.setScalar(1.5)
    marker.visible = reduced
    scene.add(marker)
    if (reduced) byName['女王'].dot.scale.setScalar(1.35)
    else analogy = { t0: performance.now(), a1, a2, len, A, K }
  }

  function tickAnalogy(now) {
    if (!analogy) return
    const ease = (x) => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3)
    const t = now - analogy.t0
    if (t < 900) {
      const l = Math.max(0.05, analogy.len * ease(t / 900))
      analogy.a1.setLength(l, Math.min(0.8, l * 0.5), Math.min(0.42, l * 0.3))
    } else if (t < 1200) {
      analogy.a1.setLength(analogy.len, 0.8, 0.42)
    } else if (t < 2400) {
      analogy.a2.visible = true
      analogy.a2.position.lerpVectors(analogy.A, analogy.K, ease((t - 1200) / 1200))
    } else {
      analogy.a2.position.copy(analogy.K)
      if (marker) marker.visible = true
      byName['女王'].dot.scale.setScalar(1.35)
      analogy = null
    }
  }

  const mq = matchMedia('(prefers-color-scheme: dark)')
  const onScheme = () => {
    const fg = css('--fg-0')
    items.forEach((it) => {
      it.dot.material.color.copy(cssColor(GROUP_COLOR[it.g]))
      it.lbl.material.map.dispose()
      it.lbl.material.map = labelTexture(it.t, fg)
      it.lbl.material.needsUpdate = true
    })
    starMat.color.copy(cssColor('--fg-2'))
    select(currentKey)
  }
  mq.addEventListener('change', onScheme)

  const ro = new ResizeObserver(() => {
    const w = host.clientWidth || 600, h = host.clientHeight || 450
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  })
  ro.observe(host)

  renderer.setAnimationLoop((now) => {
    controls.update()
    tickAnalogy(now)
    if (marker && marker.visible && !reduced) {
      marker.scale.setScalar(1.35 + 0.4 * (0.5 + 0.5 * Math.sin(now * 0.005)))
    }
    renderer.render(scene, camera)
  })

  select('all')

  return {
    select,
    startAnalogy,
    dispose() {
      renderer.setAnimationLoop(null)
      ro.disconnect()
      mq.removeEventListener('change', onScheme)
      controls.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement)
    },
  }
}
