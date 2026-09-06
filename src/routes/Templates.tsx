import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Settings2, ArrowRight } from 'lucide-react'
import { templates } from '../data/templates'
import { buildSiteElements } from '../lib/buildTemplate'
import { useCanvasStore } from '../store/canvasStore'
import type { MarketCategory, SiteSettings, SiteTemplate, TemplateStyle } from '../types'

const categories: (MarketCategory | 'all')[] = ['all', 'business', 'portfolio', 'landing', 'restaurant', 'blog']
const fonts = ['Template default', 'Inter', 'Georgia', 'Poppins', 'monospace'] as const

// Render a marketplace-quality mini-site that reflects the template's full
// identity — colours, fonts, corner + button treatment, hero layout — while
// letting the settings panel override name / tagline / accent / font / theme.
function TemplatePreview({ tpl, settings }: { tpl: SiteTemplate; settings: SiteSettings }) {
  const st = tpl.style
  const dark = settings.darkMode
  const bg = dark ? '#0b0b0f' : st.bg
  const surface = dark ? '#1a1a24' : st.surface
  const text = dark ? '#e7e7ee' : st.text
  const muted = dark ? '#9a9aad' : st.muted
  const accent = settings.accent
  const bodyFont = settings.font === 'Template default'
    ? st.bodyFont
    : settings.font === 'monospace' ? 'ui-monospace, monospace' : `'${settings.font}', sans-serif`
  const headingFont = settings.font === 'Template default' ? st.headingFont : bodyFont
  const uppercase = st.uppercase ? { textTransform: 'uppercase' as const, letterSpacing: '0.05em' } : {}

  const buttonStyle: React.CSSProperties = (() => {
    switch (st.buttonStyle) {
      case 'outline': return { background: 'transparent', color: accent, border: `1.5px solid ${accent}`, borderRadius: st.radius }
      case 'pill': return { background: accent, color: '#fff', borderRadius: 999 }
      case 'sharp': return { background: accent, color: '#fff', borderRadius: 0 }
      case 'glow': return { background: accent, color: '#fff', borderRadius: st.radius, boxShadow: `0 8px 24px -6px ${accent}` }
      default: return { background: accent, color: '#fff', borderRadius: st.radius }
    }
  })()

  const split = st.heroLayout === 'split'
  const align = st.heroLayout === 'centered' ? 'center' : 'left'

  return (
    <div aria-hidden="true" className="overflow-hidden rounded-xl border border-aria-border shadow-2xl" style={{ background: bg, color: text, fontFamily: bodyFont }}>
      {/* Nav */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${surface}` }}>
        <span className="text-lg font-black" style={{ color: accent, fontFamily: headingFont, ...uppercase }}>
          {settings.siteName || 'Your Brand'}
        </span>
        <div className="hidden gap-5 text-xs sm:flex" style={{ color: muted, ...uppercase }}>
          {tpl.sections.slice(0, 4).map((s) => <span key={s}>{s}</span>)}
        </div>
      </div>

      {/* Hero */}
      <div className={`grid gap-6 px-8 py-12 ${split ? 'grid-cols-[1.2fr_1fr] items-center' : 'grid-cols-1'}`} style={{ textAlign: split ? 'left' : align }}>
        <div className={split ? '' : align === 'center' ? 'mx-auto max-w-md' : 'max-w-lg'}>
          <p className="text-3xl font-black leading-tight sm:text-4xl" style={{ fontFamily: headingFont, ...uppercase }}>
            {settings.tagline || 'A tagline that sells your idea.'}
          </p>
          <p className="mt-3 text-sm" style={{ color: muted }}>{tpl.blurb}</p>
          <span className="mt-6 inline-block px-5 py-2.5 text-sm font-semibold" style={buttonStyle}>Get started</span>
        </div>
        {split && (
          <div className="aspect-[4/3] w-full rounded-xl" style={{ background: `linear-gradient(135deg, ${accent}, ${st.accent2})`, borderRadius: st.radius }} />
        )}
      </div>

      {/* Section blocks */}
      <div className="grid grid-cols-3 gap-3 px-8 pb-10">
        {tpl.sections.slice(0, 3).map((s) => (
          <div key={s} className="p-4" style={{ background: surface, borderRadius: st.radius }}>
            <div className="mb-2 h-6 w-6" style={{ background: accent, borderRadius: st.buttonStyle === 'sharp' ? 0 : st.radius }} />
            <p className="text-sm font-semibold" style={{ fontFamily: headingFont, ...uppercase }}>{s}</p>
            <p className="mt-1 text-xs" style={{ color: muted }}>Lorem ipsum dolor sit amet.</p>
          </div>
        ))}
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
    siteName: 'Your Brand',
    tagline: 'A tagline that sells your idea.',
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
    setSettings((s) => ({ ...s, accent: t.accent }))
  }

  // Generate a real, editable design from the template + current settings, then
  // open it in the canvas on its own page.
  const useTemplate = () => {
    const st = active.style
    const dark = settings.darkMode
    const font =
      settings.font === 'Template default'
        ? st.bodyFont
        : settings.font === 'monospace'
          ? 'ui-monospace, monospace'
          : `'${settings.font}', sans-serif`
    const effStyle: TemplateStyle = {
      ...st,
      accent: settings.accent,
      bg: dark ? '#0b0b0f' : st.bg,
      surface: dark ? '#1a1a24' : st.surface,
      text: dark ? '#e7e7ee' : st.text,
      muted: dark ? '#9a9aad' : st.muted,
      bodyFont: font,
      headingFont: settings.font === 'Template default' ? st.headingFont : font,
    }
    const seeds = buildSiteElements({
      style: effStyle,
      sections: active.sections,
      siteName: settings.siteName || active.name,
      tagline: settings.tagline || 'A tagline that sells your idea.',
      blurb: active.blurb,
    })
    loadDesign(`${active.name} site`, seeds, effStyle.bg)
    navigate('/canvas')
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="a-fade-up mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
        <p className="text-sm text-aria-muted">Each one has its own distinct look. Pick a starting point, tune the settings, make it yours.</p>
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

      <div className="a-fade-up a-d2 grid gap-6 lg:grid-cols-[280px_1fr_260px]">
        {/* Template list */}
        <div className="a-stagger space-y-2">
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
        <div>
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
                className="h-8 w-8 cursor-pointer rounded-md border border-aria-border bg-transparent" />
              <input value={settings.accent} onChange={(e) => setSettings({ ...settings, accent: e.target.value })}
                aria-label="Accent color hex"
                className="flex-1 rounded-md border border-aria-border bg-aria-panel-2 px-2 py-1.5 text-sm focus:border-aria-brand" />
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
