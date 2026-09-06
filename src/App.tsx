import { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Landing from './routes/Landing'
import CanvasEditor from './routes/CanvasEditor'
import Templates from './routes/Templates'
import Marketplace from './routes/Marketplace'
import Settings from './routes/Settings'
import EffectStyles from './components/canvas/EffectStyles'

const TITLES: Record<string, string> = {
  '/': 'Aria — build any website by dragging it into place',
  '/canvas': 'Canvas · Aria',
  '/templates': 'Templates · Aria',
  '/marketplace': 'Marketplace · Aria',
  '/settings': 'Hosting · Aria',
}

function Shell() {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const firstNav = useRef(true)
  // The canvas editor is full-bleed and provides its own chrome.
  const bareChrome = pathname.startsWith('/canvas')

  useEffect(() => {
    document.title = TITLES[pathname] ?? 'Aria'
    if (firstNav.current) {
      firstNav.current = false
      return
    }
    mainRef.current?.focus()
  }, [pathname])

  return (
    <div className="relative flex h-full flex-col overflow-visible">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {!bareChrome && <Navbar />}
      {/* keyed by route so each page animates in on navigation */}
      <main
        ref={mainRef}
        id="main-content"
        key={pathname}
        tabIndex={-1}
        className="a-fade-in min-h-0 flex-1 outline-none"
      >
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/canvas" element={<CanvasEditor />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    // basename matches Vite `base` so routes work under /<repo>/ on GitHub Pages.
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <EffectStyles />
      <Shell />
    </BrowserRouter>
  )
}
