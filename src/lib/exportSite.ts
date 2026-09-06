import { compileEffect } from './effects'
import type { CanvasElement, CanvasPage, CustomEffect, PageMeta, SiteDbConfig } from '../types'

export interface ExportDesign {
  name: string
  frame: CanvasPage
  pages: PageMeta[]
  elements: CanvasElement[]
  effects: CustomEffect[]
  autoAdaptive: boolean
  /** When enabled, a working database connector is bundled with the export. */
  db?: SiteDbConfig
}

const PG_TYPE: Record<string, string> = {
  text: 'text',
  number: 'numeric',
  boolean: 'boolean',
  timestamp: 'timestamptz',
}

const safeName = (s: string) => s.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, '') || 'items'

// ── Files bundled into the export when the site has a database ─────────────
function dbFiles(db: SiteDbConfig, siteName: string): Record<string, string> {
  const collections = db.collections.filter((c) => c.name.trim())

  const schema = `-- Schema for ${siteName}
-- Run once against your database:  psql "$DATABASE_URL" -f db/schema.sql
create extension if not exists "pgcrypto";

${collections.map((c) => {
  const t = safeName(c.name)
  const cols = c.fields
    .filter((f) => f.name.trim())
    .map((f) => `  ${safeName(f.name)} ${PG_TYPE[f.type] ?? 'text'},`)
    .join('\n')
  return `create table if not exists ${t} (
  id uuid primary key default gen_random_uuid(),
${cols}
  created_at timestamptz not null default now()
);`
}).join('\n\n')}
`

  // One serverless endpoint per collection: GET to list, POST to insert.
  const fn = `import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)
const ALLOWED = ${JSON.stringify(collections.map((c) => safeName(c.name)))}
const cors = {
  'access-control-allow-origin': process.env.ALLOWED_ORIGIN || '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type',
}
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...cors } })

// /api/data/:collection  — GET lists rows, POST inserts one.
export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  try {
    const url = new URL(req.url)
    const name = url.pathname.split('/').filter(Boolean).pop()
    // Only tables defined in the site's schema are reachable.
    if (!ALLOWED.includes(name)) return json({ error: 'unknown collection' }, 404)

    if (req.method === 'GET') {
      const rows = await sql(\`select * from \${name} order by created_at desc limit 200\`)
      return json(rows)
    }

    if (req.method === 'POST') {
      const body = await req.json()
      const keys = Object.keys(body).filter((k) => /^[a-z0-9_]+$/i.test(k))
      if (!keys.length) return json({ error: 'no fields' }, 400)
      const cols = keys.join(', ')
      const params = keys.map((_, i) => '$' + (i + 1)).join(', ')
      const rows = await sql(
        \`insert into \${name} (\${cols}) values (\${params}) returning *\`,
        keys.map((k) => body[k]),
      )
      return json(rows[0], 201)
    }

    return json({ error: 'method not allowed' }, 405)
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
}

export const config = { path: '/api/data/:collection' }
`

  const client = `// Tiny database client for this site.
// Set VITE_API_BASE to your deployed API (leave empty when same-origin).
const BASE = (import.meta.env.VITE_API_BASE || '').replace(/\\/+$/, '')

async function request(path, init) {
  const res = await fetch(BASE + path, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init && init.headers) },
  })
  if (!res.ok) throw new Error(res.status + ' ' + (await res.text()))
  return res.json()
}

/** List rows from a collection, newest first. */
export const list = (collection) => request('/api/data/' + collection)

/** Insert a row, e.g. save({ name, email, message }) into "contacts". */
export const save = (collection, row) =>
  request('/api/data/' + collection, { method: 'POST', body: JSON.stringify(row) })

export const db = { list, save }
export default db
`

  const example = collections[0]
  const readme = `# Database

This site ships with a working database connector.

## 1. Create a database
${db.provider === 'neon'
  ? 'Create a free project at https://neon.tech and copy the **pooled** connection string.'
  : 'Provision any Postgres database and copy its connection string.'}

## 2. Create the tables
\`\`\`bash
psql "$DATABASE_URL" -f db/schema.sql
\`\`\`

Collections in this site: ${collections.map((c) => '`' + safeName(c.name) + '`').join(', ') || '(none)'}

## 3. Deploy the API
The endpoint lives in \`netlify/functions/data.mjs\` (Netlify). Deploy the project,
then set these environment variables **on the server**:

| Variable | Value |
| --- | --- |
| \`DATABASE_URL\` | your connection string (keep secret) |
| \`ALLOWED_ORIGIN\` | the origin your site is served from |

Install the driver once: \`npm i @neondatabase/serverless\`

## 4. Use it in your site
\`\`\`js
import db from './src/lib/db.js'

${example ? `// read
const rows = await db.list('${safeName(example.name)}')

// write
await db.save('${safeName(example.name)}', { ${example.fields.filter((f) => f.name).slice(0, 3).map((f) => `${safeName(f.name)}: '…'`).join(', ')} })` : "const rows = await db.list('items')"}
\`\`\`

> Your connection string stays on the server — it is never exposed to the browser.
`

  return {
    'db/schema.sql': schema,
    'netlify/functions/data.mjs': fn,
    'src/lib/db.js': client,
    'DATABASE.md': readme,
  }
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
.aria-svg>svg{width:100%;height:100%;display:block}
@media (prefers-reduced-motion:reduce){.aria-anim-pulse,.aria-anim-float,.aria-anim-bounce,.aria-anim-glow,.aria-anim-shake,.aria-anim-shine::after{animation:none!important}.aria-anim-tilt:hover,.aria-anim-pop:hover{transform:none!important}}`

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

  const onActivate = () => {
    const a = el.action
    if (!a || a.type === 'none') return
    if (a.type === 'url' && a.target) window.open(a.target, '_blank', 'noopener')
    else if (a.type === 'page') onNavigate(a.target)
    else if (a.type === 'element') {
      const n = document.getElementById('el-' + a.target)
      if (n) {
        const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
        n.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
      }
    }
  }
  const hooked = el.action && el.action.type !== 'none'
  const onKeyDown = (e) => {
    if (!hooked) return
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onActivate() }
  }

  let content = el.content
  if (el.kind === 'image') content = <img src={el.content} alt={el.alt || el.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
  else if (el.kind === 'svg') content = <div style={{ width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: el.content }} />

  if (el.action && el.action.type === 'url' && el.action.target) {
    return (
      <a id={'el-' + el.id} href={el.action.target} target="_blank" rel="noopener noreferrer" style={outer} onClick={(e) => { e.preventDefault(); onActivate() }}>
        <div style={inner} className={cls || undefined}>{content}</div>
      </a>
    )
  }

  return (
    <div id={'el-' + el.id} style={outer} onClick={hooked ? onActivate : undefined} role={hooked ? 'button' : undefined} tabIndex={hooked ? 0 : undefined} onKeyDown={onKeyDown}>
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

  const hasDb = Boolean(design.db?.enabled && design.db.collections.some((c) => c.name.trim()))

  const pkg = {
    name,
    private: true,
    version: '0.0.0',
    type: 'module',
    scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
    dependencies: {
      react: '^18.3.1',
      'react-dom': '^18.3.1',
      ...(hasDb ? { '@neondatabase/serverless': '^0.10.4' } : {}),
    },
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
    ...(hasDb
      ? {
          ...dbFiles(design.db as SiteDbConfig, design.name),
          '.env.example': `# API base for the database endpoints (leave empty when same-origin)\nVITE_API_BASE=\n\n# Server-only — never commit real values\nDATABASE_URL=\nALLOWED_ORIGIN=\n`,
          'netlify.toml': `[build]\n  command = "npm run build"\n  publish = "dist"\n\n[functions]\n  node_bundler = "esbuild"\n  directory = "netlify/functions"\n`,
        }
      : {}),
  }
}
