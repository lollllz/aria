import { compileEffect } from './effects'
import type { CanvasElement, CanvasPage, CustomEffect, PageMeta } from '../types'

export interface ExportDesign {
  name: string
  frame: CanvasPage
  pages: PageMeta[]
  elements: CanvasElement[]
  effects: CustomEffect[]
  autoAdaptive: boolean
}

// Built-in animation keyframes/classes, shipped with every export.
const ANIM_CSS = `@keyframes aria-pulse{0%,100%{transform:scale(1)}50%{transform:scale(calc(1 + 0.06 * var(--aria-anim-amt,1)))}}
@keyframes aria-float{0%,100%{transform:translateY(0)}50%{transform:translateY(calc(-8px * var(--aria-anim-amt,1)))}}
@keyframes aria-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(calc(-14px * var(--aria-anim-amt,1)))}}
@keyframes aria-glow{0%,100%{box-shadow:0 0 0 0 transparent}50%{box-shadow:0 0 calc(26px * var(--aria-anim-amt,1)) calc(6px * var(--aria-anim-amt,1)) var(--aria-glow,rgba(124,92,255,.7))}}
@keyframes aria-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(calc(-3px * var(--aria-anim-amt,1)))}40%{transform:translateX(calc(3px * var(--aria-anim-amt,1)))}60%{transform:translateX(calc(-2px * var(--aria-anim-amt,1)))}80%{transform:translateX(calc(2px * var(--aria-anim-amt,1)))}}
@keyframes aria-shine{0%{left:-160%}60%,100%{left:160%}}
.aria-anim-pulse{animation:aria-pulse var(--aria-anim-dur,1.6s) ease-in-out infinite}
.aria-anim-float{animation:aria-float var(--aria-anim-dur,2.4s) ease-in-out infinite}
.aria-anim-bounce{animation:aria-bounce var(--aria-anim-dur,1.4s) cubic-bezier(.5,0,.5,1) infinite}
.aria-anim-glow{animation:aria-glow var(--aria-anim-dur,1.8s) ease-in-out infinite}
.aria-anim-shake{animation:aria-shake var(--aria-anim-dur,.6s) ease-in-out infinite}
.aria-anim-tilt{transition:transform calc(var(--aria-anim-dur,1.6s) * 0.16) ease}
.aria-anim-tilt:hover{transform:rotate(calc(-4deg * var(--aria-anim-amt,1))) scale(calc(1 + 0.04 * var(--aria-anim-amt,1)))}
.aria-anim-pop{transition:transform calc(var(--aria-anim-dur,1.2s) * 0.14) ease}
.aria-anim-pop:hover{transform:scale(calc(1 + 0.08 * var(--aria-anim-amt,1)))}
.aria-anim-shine{position:relative}
.aria-anim-shine::after{content:'';position:absolute;top:0;left:-160%;width:70%;height:100%;background:linear-gradient(120deg,transparent,rgba(255,255,255,.5),transparent);transform:skewX(-20deg);animation:aria-shine var(--aria-anim-dur,2.2s) ease-in-out infinite;pointer-events:none}
.aria-svg>svg{width:100%;height:100%;display:block}`

const RESET_CSS = `*{box-sizing:border-box}html,body,#root{margin:0;height:100%}
body{font-family:'Inter',ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}`

// The exported runtime — a small, framework-only renderer for the design JSON.
// Ported from the editor's ElementView + device logic, no editor deps.
const RUNTIME = `import { useState, useEffect } from 'react'

export const DEVICE_FRAMES = { tablet: { width: 768, height: 1024 }, mobile: { width: 390, height: 844 } }

export function pickDevice() {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1280
  return w >= 1024 ? 'desktop' : w >= 640 ? 'tablet' : 'mobile'
}

export function effectiveGeo(el, device, desktopW) {
  if (device === 'desktop') return { x: el.x, y: el.y, width: el.width, height: el.height, fontScale: 1 }
  const o = el[device] || {}
  return { x: o.x != null ? o.x : el.x, y: o.y != null ? o.y : el.y,
    width: o.width != null ? o.width : el.width, height: o.height != null ? o.height : el.height, fontScale: 1 }
}

const SAFE_TOP = 44
export function autoLayout(elems, device, desktopW) {
  const scale = DEVICE_FRAMES[device].width / desktopW
  const sorted = [...elems].sort((a, b) => a.y - b.y || a.x - b.x)
  const bands = []
  for (const el of sorted) {
    const b = bands[bands.length - 1]
    if (b && el.y < b.maxY - 8) { b.items.push(el); b.maxY = Math.max(b.maxY, el.y + el.height) }
    else bands.push({ items: [el], minY: el.y, maxY: el.y + el.height })
  }
  const out = {}
  let cursor = SAFE_TOP
  for (const b of bands) {
    for (const el of b.items) out[el.id] = { x: el.x * scale, y: cursor + (el.y - b.minY) * scale,
      width: el.width * scale, height: el.height * scale, fontScale: scale }
    cursor += (b.maxY - b.minY) * scale
  }
  return out
}

function Element({ el, geo, onNavigate }) {
  const s = el.style
  const outer = {
    position: 'absolute', left: geo.x, top: geo.y, width: geo.width, height: geo.height,
    transform: 'rotate(' + el.rotation + 'deg)', opacity: s.opacity,
    cursor: el.action && el.action.type !== 'none' ? 'pointer' : 'default',
  }
  const inner = {
    width: '100%', height: '100%',
    borderRadius: el.kind === 'ellipse' ? '50%' : s.radius,
    background: s.background === 'transparent' ? 'transparent' : s.background,
    border: s.borderWidth ? s.borderWidth + 'px solid ' + s.borderColor : undefined,
    boxShadow: s.shadow ? '0 12px 30px -8px rgba(0,0,0,0.45)' : undefined,
    color: s.color, fontSize: s.fontSize * geo.fontScale, fontWeight: s.fontWeight,
    textAlign: s.textAlign, letterSpacing: s.letterSpacing, lineHeight: s.lineHeight,
    padding: el.kind === 'svg' ? 0 : s.padding * geo.fontScale,
    display: 'flex', alignItems: el.kind === 'button' ? 'center' : 'flex-start',
    justifyContent: s.textAlign === 'center' ? 'center' : s.textAlign === 'right' ? 'flex-end' : 'flex-start',
    overflow: 'hidden', boxSizing: 'border-box',
  }
  if (s.animation && s.animation !== 'none') {
    inner['--aria-anim-dur'] = s.animDuration + 's'
    inner['--aria-anim-amt'] = s.animIntensity
    inner['--aria-glow'] = s.glowColor
  }
  const animClass = !s.animation || s.animation === 'none' ? ''
    : s.animation.indexOf('fx:') === 0 ? 'aria-fx-' + s.animation.slice(3) : 'aria-anim-' + s.animation
  const cls = (animClass + ' ' + (el.kind === 'svg' ? 'aria-svg' : '')).trim()

  const onClick = () => {
    const a = el.action
    if (!a || a.type === 'none') return
    if (a.type === 'url' && a.target) window.open(a.target, '_blank')
    else if (a.type === 'page') onNavigate(a.target)
    else if (a.type === 'element') { const n = document.getElementById('el-' + a.target); if (n) n.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
  }

  let content = el.content
  if (el.kind === 'image') content = <img src={el.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
  else if (el.kind === 'svg') content = <div style={{ width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: el.content }} />

  return (
    <div id={'el-' + el.id} style={outer} onClick={onClick}>
      <div style={inner} className={cls || undefined}>{content}</div>
    </div>
  )
}

export function Page({ design, page, device, onNavigate }) {
  const els = design.elements.filter((e) => e.pageId === page.id)
  const desktopW = design.frame.width
  const auto = design.autoAdaptive && device !== 'desktop' ? autoLayout(els, device, desktopW) : null
  const frameW = device === 'desktop' ? desktopW : DEVICE_FRAMES[device].width
  const geoFor = (el) => (auto && auto[el.id]) ? auto[el.id] : effectiveGeo(el, device, desktopW)
  let bottom = device === 'desktop' ? design.frame.height : DEVICE_FRAMES[device].height
  els.forEach((el) => { const g = geoFor(el); bottom = Math.max(bottom, g.y + g.height) })
  return (
    <div style={{ minHeight: '100vh', background: '#0b0b0f', display: 'flex', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: frameW, height: bottom, background: design.frame.background, overflow: 'hidden' }}>
        {els.map((el) => <Element key={el.id} el={el} geo={geoFor(el)} onNavigate={onNavigate} />)}
      </div>
    </div>
  )
}
`

const APP = `import { useState, useEffect } from 'react'
import design from './design.json'
import { Page, pickDevice } from './runtime.jsx'

export default function App() {
  const [pageId, setPageId] = useState(design.pages[0] && design.pages[0].id)
  const [device, setDevice] = useState(pickDevice())
  useEffect(() => {
    const on = () => setDevice(pickDevice())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  const page = design.pages.find((p) => p.id === pageId) || design.pages[0]
  if (!page) return <div style={{ color: '#fff', padding: 40 }}>Empty site.</div>
  return <Page design={design} page={page} device={device} onNavigate={setPageId} />
}
`

const MAIN = `import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
createRoot(document.getElementById('root')).render(<App />)
`

const VITE_CONFIG = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()] })
`

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'aria-site'

// Produce a complete, compilable Vite + React project as a { path: contents } map.
export function exportSite(design: ExportDesign): Record<string, string> {
  const name = slug(design.name)
  const effectsCss = design.effects.map((e) => compileEffect(e.css, e.id)).join('\n\n')

  const pkg = {
    name,
    private: true,
    version: '0.0.0',
    type: 'module',
    scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
    dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
    devDependencies: { '@vitejs/plugin-react': '^4.3.1', vite: '^5.4.0' },
  }

  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${design.name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`

  return {
    'package.json': JSON.stringify(pkg, null, 2),
    'vite.config.js': VITE_CONFIG,
    'index.html': indexHtml,
    '.gitignore': 'node_modules\ndist\n',
    'README.md': `# ${design.name}\n\nExported from Aria.\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`,
    'src/main.jsx': MAIN,
    'src/App.jsx': APP,
    'src/runtime.jsx': RUNTIME,
    'src/design.json': JSON.stringify(
      { name: design.name, frame: design.frame, pages: design.pages, elements: design.elements, autoAdaptive: design.autoAdaptive },
      null,
      2,
    ),
    'src/styles.css': `${RESET_CSS}\n\n/* built-in animations */\n${ANIM_CSS}\n\n/* custom effects */\n${effectsCss}\n`,
  }
}
