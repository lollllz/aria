import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Landing from './routes/Landing'
import CanvasEditor from './routes/CanvasEditor'
import Templates from './routes/Templates'
import Marketplace from './routes/Marketplace'
import EffectStyles from './components/canvas/EffectStyles'

function Shell() {
  const { pathname } = useLocation()
  // The canvas editor is full-bleed and provides its own chrome.
  const bareChrome = pathname.startsWith('/canvas')

  return (
    <div className="flex h-full flex-col">
      {!bareChrome && <Navbar />}
      <main className="min-h-0 flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/canvas" element={<CanvasEditor />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/marketplace" element={<Marketplace />} />
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
