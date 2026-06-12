import { Link, useNavigate, useLocation } from 'react-router-dom'

// 毛玻璃吸顶导航。品牌回首页；区块链接在首页内平滑滚动，跨页则先回首页再滚动。
export default function Nav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  function goSection(e, id) {
    e.preventDefault()
    const scroll = () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    if (pathname === '/') {
      scroll()
    } else {
      navigate('/')
      // 等首页挂载后再滚动
      setTimeout(scroll, 60)
    }
  }

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link className="brand" to="/">
          <span className="brand-dot">AI</span>Path
        </Link>
        <div className="nav-links">
          <a href="/#idea" onClick={(e) => goSection(e, 'idea')}>设计理念</a>
          <a href="/#path" onClick={(e) => goSection(e, 'path')}>学习路线</a>
          <a href="/#usage" onClick={(e) => goSection(e, 'usage')}>怎么学</a>
        </div>
      </div>
    </nav>
  )
}
