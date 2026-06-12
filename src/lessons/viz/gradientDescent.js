// ============================================================
// 梯度下降 3D 演示控制器（three.js，框架无关）
// 由 React 组件在 useEffect 中创建，通过回调把状态/损失历史回传给 UI。
//   createGradientDescent(container, { getLR, onStatus, onHistory, onPlaying })
//   → { step, togglePlay, reset, dispose }
// onStatus(html)      状态文案（含简单 HTML）
// onHistory(points)   损失历史 [{ step, loss }]，交给 Recharts 绘制
// onPlaying(bool)     播放/暂停状态，用于按钮文案
// ============================================================
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

// 损失地形：两三个高斯峰谷叠加 + 缓碗
const G = (x, z, cx, cz, s) => Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / s)
function lossFn(x, z) {
  return (
    1.8 -
    2.1 * G(x, z, -1.4, -1.1, 1.2) - // 深谷：接近全局最优
    1.15 * G(x, z, 1.7, 1.4, 0.7) + // 浅坑：局部最优
    1.35 * G(x, z, 0.9, -1.3, 1.1) + // 山峰
    0.14 * (x * x + z * z) // 缓碗，让边缘也有坡度
  )
}
function grad(x, z) {
  const h = 0.012
  return [
    (lossFn(x + h, z) - lossFn(x - h, z)) / (2 * h),
    (lossFn(x, z + h) - lossFn(x, z - h)) / (2 * h),
  ]
}

export function createGradientDescent(container, opts) {
  const { getLR, onStatus, onHistory, onPlaying } = opts
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim()

  const YS = 0.55
  const LMIN = 0.1
  const LMAX = 4.4

  // ----- 渲染器 / 场景 / 相机 -----
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(container.clientWidth, container.clientHeight)
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100)
  camera.position.set(5.2, 4.4, 5.6)

  scene.add(new THREE.AmbientLight(0xffffff, 0.85))
  const sun = new THREE.DirectionalLight(0xffffff, 1.6)
  sun.position.set(4, 8, 3)
  scene.add(sun)

  // ----- 地形 -----
  const geo = new THREE.PlaneGeometry(6, 6, 96, 96)
  geo.rotateX(-Math.PI / 2)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, lossFn(pos.getX(i), pos.getZ(i)) * YS)
  }
  geo.computeVertexNormals()
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3))

  const terrainMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 })
  scene.add(new THREE.Mesh(geo, terrainMat))

  const wireMat = new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, opacity: 0.14 })
  const wireMesh = new THREE.Mesh(geo, wireMat)
  wireMesh.position.y = 0.006
  scene.add(wireMesh)

  // ----- 小球与轨迹 -----
  const ballMat = new THREE.MeshStandardMaterial({ emissiveIntensity: 0.35 })
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16), ballMat)
  scene.add(ball)

  const MAXP = 800
  const trailArr = new Float32Array(MAXP * 3)
  const trailGeo = new THREE.BufferGeometry()
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailArr, 3))
  trailGeo.setDrawRange(0, 0)
  const trailMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.9 })
  const trail = new THREE.Line(trailGeo, trailMat)
  trail.frustumCulled = false
  scene.add(trail)
  let trailCount = 0

  // ----- 主题取色 -----
  function applyColors() {
    const low = new THREE.Color(cssVar('--sage'))
    const high = new THREE.Color(cssVar('--amber'))
    const ink = new THREE.Color(cssVar('--fg-0'))
    const hot = new THREE.Color(cssVar('--terracotta'))
    const col = geo.attributes.color
    const c = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const t = Math.min(1, Math.max(0, (pos.getY(i) / YS - LMIN) / (LMAX - LMIN)))
      c.copy(low).lerp(high, Math.pow(t, 0.85))
      col.setXYZ(i, c.r, c.g, c.b)
    }
    col.needsUpdate = true
    wireMat.color.copy(ink)
    trailMat.color.copy(ink)
    ballMat.color.copy(hot)
    ballMat.emissive.copy(hot)
  }
  applyColors()

  // ----- 交互控制 -----
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 0.7, 0)
  controls.enablePan = false
  controls.minDistance = 3.5
  controls.maxDistance = 13
  controls.maxPolarAngle = 1.45
  controls.enableDamping = !reduceMotion
  controls.update()

  // ----- 下山状态机 -----
  let px = 0
  let pz = 0
  let steps = 0
  let done = false
  let playing = false
  let hist = []

  function render() {
    renderer.render(scene, camera)
  }
  function placeBall() {
    ball.position.set(px, lossFn(px, pz) * YS + 0.12, pz)
  }
  function pushTrail() {
    if (trailCount >= MAXP) return
    const i = trailCount * 3
    trailArr[i] = px
    trailArr[i + 1] = lossFn(px, pz) * YS + 0.07
    trailArr[i + 2] = pz
    trailCount++
    trailGeo.setDrawRange(0, trailCount)
    trailGeo.attributes.position.needsUpdate = true
  }
  function emitHistory() {
    onHistory(hist.map((loss, i) => ({ step: i, loss: Math.min(Math.max(loss, 0), 4.6) })))
  }
  function setPlaying(v) {
    playing = v
    onPlaying(v)
  }
  function finish() {
    done = true
    setPlaying(false)
    const L = lossFn(px, pz)
    if (L < 0.8) {
      onStatus(
        '<span class="ok">✓ 到达最深的谷底！</span>脚下几乎全平（梯度 ≈ 0），损失停在 <span class="num">' +
          L.toFixed(2) + '</span>，共走 <span class="num">' + steps + '</span> 步。',
      )
    } else if (L < 1.6) {
      onStatus(
        '<span class="ok">✓ 停进了一个坑底</span>（损失 <span class="num">' +
          L.toFixed(2) + '</span>）。旋转地形看看 —— 远处还有更深的谷。这就是<b>局部最优</b>。',
      )
    } else {
      onStatus('⏸ 停在了一处平地（鞍点或山顶附近），梯度 ≈ 0 也会卡住。换个起点再试。')
    }
  }
  function diverge() {
    done = true
    setPlaying(false)
    onStatus('<span class="warn">✗ 学习率太大，小球被甩出了山谷！</span>调小学习率，点「重新随机起点」再来。')
  }
  function doStep() {
    if (done) return
    const [gx, gz] = grad(px, pz)
    if (Math.hypot(gx, gz) < 0.03) {
      finish()
      emitHistory()
      return
    }
    const lr = getLR()
    px -= lr * gx
    pz -= lr * gz
    steps++
    const L = lossFn(px, pz)
    hist.push(L)
    placeBall()
    pushTrail()
    if (!isFinite(L) || Math.abs(px) > 3.6 || Math.abs(pz) > 3.6) {
      diverge()
    } else {
      onStatus('第 <span class="num">' + steps + '</span> 步 · 当前损失 <span class="num">' + L.toFixed(3) + '</span>')
      if (steps >= 500) {
        setPlaying(false)
        onStatus('走了 <span class="num">500</span> 步还没停 —— 学习率太小会磨蹭很久，调大一点试试？')
      }
    }
    emitHistory()
  }
  function randomStart() {
    setPlaying(false)
    done = false
    steps = 0
    for (let i = 0; i < 30; i++) {
      px = -2.7 + Math.random() * 5.4
      pz = -2.7 + Math.random() * 5.4
      if (lossFn(px, pz) > 1.4) break
    }
    hist = [lossFn(px, pz)]
    trailCount = 0
    trailGeo.setDrawRange(0, 0)
    placeBall()
    pushTrail()
    emitHistory()
    onStatus('新起点就绪（损失 <span class="num">' + hist[0].toFixed(2) + '</span>）。点「自动播放」开始下山。')
    if (reduceMotion) render()
  }

  // ----- 自适应尺寸 / 主题切换 -----
  const ro = new ResizeObserver(() => {
    const w = container.clientWidth
    const h = container.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    if (reduceMotion) render()
  })
  ro.observe(container)

  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const onScheme = () => {
    applyColors()
    if (reduceMotion) render()
  }
  mq.addEventListener('change', onScheme)

  // ----- 渲染循环 -----
  randomStart()
  let lastStep = 0
  if (reduceMotion) {
    controls.addEventListener('change', render)
    render()
  } else {
    renderer.setAnimationLoop((t) => {
      controls.update()
      if (playing && t - lastStep > 160) {
        lastStep = t
        doStep()
      }
      render()
    })
  }

  // ----- 对外接口 -----
  return {
    step() {
      doStep()
      if (reduceMotion) render()
    },
    togglePlay() {
      if (done) {
        onStatus('这一程已结束 —— 点「重新随机起点」再来一次。')
        return
      }
      if (reduceMotion) {
        let guard = 0
        while (!done && guard++ < 400) doStep()
        render()
        return
      }
      setPlaying(!playing)
    },
    reset: randomStart,
    dispose() {
      renderer.setAnimationLoop(null)
      ro.disconnect()
      mq.removeEventListener('change', onScheme)
      controls.dispose()
      renderer.dispose()
      geo.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    },
  }
}
