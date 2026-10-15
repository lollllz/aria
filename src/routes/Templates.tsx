import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Settings2, ArrowRight } from 'lucide-react'
import { templates } from '../data/templates'
import { buildSiteElements } from '../lib/buildTemplate'
import { useCanvasStore } from '../store/canvasStore'
import type { MarketCategory, SiteSettings, SiteTemplate, TemplateStyle } from '../types'

const categories: (MarketCategory | 'all')[] = ['all', 'business', 'portfolio', 'landing', 'restaurant', 'blog']
const fonts = ['Template default', 'Inter', 'Georgia', 'Poppins', 'monospace'] as const

function templateStyle(tpl: SiteTemplate, settings: SiteSettings): TemplateStyle {
  const font = settings.font === 'Template default' ? tpl.style.bodyFont
    : settings.font === 'monospace' ? 'ui-monospace, monospace' : `${settings.font}, sans-serif`
  return {
    ...tpl.style,
    accent: settings.accent,
    bg: settings.darkMode ? '#151915' : tpl.style.bg,
    surface: settings.darkMode ? '#282e29' : tpl.style.surface,
    text: settings.darkMode ? '#f1f3e8' : tpl.style.text,
    muted: settings.darkMode ? '#b7c0b1' : tpl.style.muted,
    bodyFont: font,
    headingFont: settings.font === 'Template default' ? tpl.style.headingFont : font,
  }
}

function TemplatePreview({ tpl, settings }: { tpl: SiteTemplate; settings: SiteSettings }) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const resize = () => setScale(frame.clientWidth / 960)
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])
  const style = templateStyle(tpl, settings)
  const elements = buildSiteElements({style, sections:tpl.sections,
    siteName:settings.siteName || tpl.name, tagline:settings.tagline || tpl.tagline || tpl.name, blurb:tpl.blurb})
  return (
    <div ref={frameRef} role="img" aria-label={`${tpl.name} website preview`} className="template-live-preview">
        <div className="template-preview-artboard" style={{width:960,height:720,background:style.bg,transform:`scale(${scale})`}}>
          {elements.map((el,i) => <div key={i} style={{position:'absolute',left:el.x,top:el.y,width:el.width,height:el.height,
            background:el.style.background,color:el.style.color,fontFamily:el.style.fontFamily,
            fontSize:el.style.fontSize,fontWeight:el.style.fontWeight,lineHeight:el.style.lineHeight,
            letterSpacing:el.style.letterSpacing,textAlign:el.style.textAlign,
            borderRadius:el.kind === 'ellipse' ? '50%' : el.style.radius,
            padding:el.style.padding,boxSizing:'border-box',overflow:'hidden',
            display:el.kind === 'button' ? 'flex' : 'block',alignItems:'center',justifyContent:'center'}}>
            {el.kind === 'svg' ? <div className="aria-svg" style={{width:'100%',height:'100%'}} dangerouslySetInnerHTML={{__html:el.content}} /> : el.content}
          </div>)}
        </div>
    </div>
  )
}

export default function Templates() {
  const navigate = useNavigate()
  const loadDesign = useCanvasStore((s) => s.loadDesign)
  const [cat, setCat] = useState<(typeof categories)[number]>('all')
  const [activeId, setActiveId] = useState(templates[0].id)
  const active = templates.find((t) => t.id === activeId)!

  const [settings, setSettings] = useState<SiteSettings>({
    siteName: active.name,
    tagline: active.tagline || active.name,
    accent: active.accent,
    font: 'Template default',
    darkMode: false,
  })

  const filtered = useMemo(
    () => (cat === 'all' ? templates : templates.filter((t) => t.category === cat)),
    [cat],
  )

  const pick = (t: SiteTemplate) => {
    setActiveId(t.id)
    setSettings((s) => ({ ...s, accent: t.accent, siteName: s.siteName === active.name ? t.name : s.siteName, tagline: s.tagline === active.tagline ? t.tagline || t.name : s.tagline }))
  }

  // Generate a real, editable design from the template + current settings, then
  // open it in the canvas on its own page.
  const useTemplate = () => {
    const effStyle = templateStyle(active, settings)
    const seeds = buildSiteElements({
      style: effStyle,
      sections: active.sections,
      siteName: settings.siteName || active.name,
      tagline: settings.tagline || active.tagline || active.name,
      blurb: active.blurb,
    })
    loadDesign(`${active.name} site`, seeds, effStyle.bg)
    navigate('/canvas')
  }

  return (
    <div className="studio-page mx-auto max-w-7xl px-6 py-8">
      <div className="a-fade-up mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
        <p className="text-sm text-aria-muted">Six starting points with a point of view. Choose a direction, then make it your own.</p>
      </div>

      <div className="a-fade-up a-d1 mb-6 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            aria-pressed={cat === c}
            className={`a-press rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition-all duration-300 ${
              cat === c ? 'border-aria-brand bg-aria-brand/15 text-aria-text shadow-[0_0_0_3px] shadow-aria-brand/10' : 'border-aria-border text-aria-muted hover:border-aria-brand/40 hover:text-aria-text'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="a-fade-up a-d2 grid gap-6 xl:grid-cols-[200px_minmax(0,1fr)_220px]">
        {/* Template list */}
        <div className="template-picker a-stagger space-y-2">
          {filtered.map((t) => (
            <button
              key={t.id}
              onClick={() => pick(t)}
              aria-pressed={t.id === activeId}
              className={`a-press flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-300 ${
                t.id === activeId ? 'border-aria-brand bg-aria-panel shadow-[0_0_0_3px] shadow-aria-brand/10' : 'border-aria-border hover:border-aria-brand/40 hover:bg-aria-panel'
              }`}
            >
              {/* Mini identity swatch */}
              <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg text-xs font-black" style={{ background: t.style.bg, color: t.style.accent, fontFamily: t.style.headingFont }}>
                {t.name[0]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-semibold">{t.name}
                  {t.id === activeId && <Check size={14} aria-hidden className="text-aria-brand" />}
                </span>
                <span className="block truncate text-xs text-aria-muted">{t.style.vibe}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Live preview */}
        <div className="min-w-0">
          <TemplatePreview tpl={active} settings={settings} />
          <button
            onClick={useTemplate}
            className="a-cta mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition"
          >
            Use “{active.name}” &amp; open in Canvas <ArrowRight size={16} aria-hidden />
          </button>
        </div>

        {/* Settings panel */}
        <div className="rounded-xl border border-aria-border bg-aria-panel p-4">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold"><Settings2 size={16} aria-hidden /> Settings</h2>

          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-medium text-aria-muted">Site name</span>
            <input value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              className="w-full rounded-md border border-aria-border bg-aria-panel-2 px-2 py-1.5 text-sm focus:border-aria-brand" />
          </label>

          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-medium text-aria-muted">Tagline</span>
            <textarea value={settings.tagline} onChange={(e) => setSettings({ ...settings, tagline: e.target.value })} rows={2}
              className="w-full resize-none rounded-md border border-aria-border bg-aria-panel-2 px-2 py-1.5 text-sm focus:border-aria-brand" />
          </label>

          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-medium text-aria-muted">Accent color</span>
            <div className="flex items-center gap-2">
              <input type="color" value={settings.accent} onChange={(e) => setSettings({ ...settings, accent: e.target.value })}
                aria-label="Accent color"
                className="h-8 w-8 shrink-0 cursor-pointer rounded-md border border-aria-border bg-transparent" />
              <input value={settings.accent} onChange={(e) => setSettings({ ...settings, accent: e.target.value })}
                aria-label="Accent color hex"
                className="min-w-0 w-0 flex-1 rounded-md border border-aria-border bg-aria-panel-2 px-2 py-1.5 text-sm focus:border-aria-brand" />
            </div>
          </label>

          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-medium text-aria-muted">Font</span>
            <select value={settings.font} onChange={(e) => setSettings({ ...settings, font: e.target.value as SiteSettings['font'] })}
              className="w-full rounded-md border border-aria-border bg-aria-panel-2 px-2 py-1.5 text-sm focus:border-aria-brand">
              {fonts.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>

          <div className="flex items-center justify-between py-1">
            <span id="dark-mode-label" className="text-xs font-medium text-aria-muted">Force dark mode</span>
            <button
              type="button"
              role="switch"
              aria-checked={settings.darkMode}
              aria-labelledby="dark-mode-label"
              onClick={() => setSettings({ ...settings, darkMode: !settings.darkMode })}
              className={`h-6 w-11 rounded-full p-0.5 transition ${settings.darkMode ? 'bg-aria-brand' : 'bg-aria-panel-2'}`}
            >
              <span className={`block h-5 w-5 rounded-full bg-white transition ${settings.darkMode ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
