import { useMemo, useState } from 'react'
import { X, Wand2, Save, Share2, Sparkles } from 'lucide-react'
import { compileEffect, EFFECT_TEMPLATE, useEffectsStore } from '../../store/effectsStore'
import { useMarketplaceStore } from '../../store/marketplaceStore'
import { useProfileStore } from '../../store/profileStore'
import { api } from '../../lib/api'
import { cloudEnabled, marketItemToBody } from '../../lib/cloud'
import type { MarketItem } from '../../types'

const PREVIEW_ID = 'preview'

export default function EffectMaker() {
  const { closeMaker, addEffect } = useEffectsStore()
  const addItem = useMarketplaceStore((s) => s.addItem)
  const author = useProfileStore((s) => s.name) || 'you'
  const [name, setName] = useState('My effect')
  const [css, setCss] = useState(EFFECT_TEMPLATE)
  const [shared, setShared] = useState(false)

  // Live-compiled CSS for the preview swatch (scoped to a throwaway class).
  const previewCss = useMemo(() => compileEffect(css, PREVIEW_ID), [css])

  const save = () => {
    addEffect(name, css, author)
    closeMaker()
  }

  const share = async () => {
    const id = addEffect(name, css, author)
    const item: MarketItem = {
      id: `fx-${id}`,
      title: name.trim() || 'Custom effect',
      author,
      category: 'theme',
      kind: 'effect',
      license: 'MIT',
      rating: 5,
      downloads: 0,
      cover: 'linear-gradient(135deg,#7c5cff,#22d3ee)',
      tags: ['effect', 'animation'],
      description: 'A custom animation effect shared to the Aria marketplace.',
      effectCss: css,
      effectName: name.trim() || 'Custom effect',
    }
    // Publish to the shared catalogue when a database is connected; otherwise
    // keep it in this device's marketplace.
    if (cloudEnabled()) {
      try { await api.publishMarket(marketItemToBody(item) as never) } catch { addItem(item) }
    } else {
      addItem(item)
    }
    setShared(true)
  }

  return (
    <div className="a-fade-in fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={closeMaker}>
      {/* preview styles are injected live */}
      <style>{`.aria-fx-${PREVIEW_ID}{}${previewCss}`}</style>

      <div className="a-pop-in flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-aria-border bg-aria-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-aria-border px-5 py-3">
          <h2 className="flex items-center gap-2 text-base font-bold"><Wand2 size={17} className="text-aria-brand-2" /> Effect Maker</h2>
          <button onClick={closeMaker} className="rounded-lg p-1.5 text-aria-muted hover:bg-aria-panel-2 hover:text-aria-text"><X size={18} /></button>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 md:grid-cols-[1fr_300px]">
          {/* Code editor */}
          <div className="flex min-h-0 flex-col border-r border-aria-border">
            <div className="border-b border-aria-border px-4 py-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-aria-muted">Effect name</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-aria-border bg-aria-panel-2 px-2 py-1.5 text-sm outline-none focus:border-aria-brand" />
            </div>
            <div className="flex items-center justify-between px-4 pt-2 text-[11px] font-semibold uppercase tracking-wider text-aria-muted">
              CSS <span className="font-normal normal-case text-aria-muted">target <code className="text-aria-brand-2">.effect</code></span>
            </div>
            <textarea
              value={css} onChange={(e) => setCss(e.target.value)} spellCheck={false}
              className="min-h-[280px] flex-1 resize-none bg-transparent px-4 py-2 font-mono text-[12px] leading-relaxed text-aria-text outline-none"
            />
          </div>

          {/* Live preview */}
          <div className="flex min-h-0 flex-col">
            <div className="border-b border-aria-border px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-aria-muted">Live preview</div>
            <div className="flex flex-1 items-center justify-center bg-aria-bg p-6"
              style={{ ['--aria-anim-dur' as string]: '1.4s', ['--aria-anim-amt' as string]: 1, ['--aria-glow' as string]: '#7c5cff' }}>
              <button className={`aria-fx-${PREVIEW_ID} rounded-xl bg-gradient-to-r from-aria-brand to-aria-brand-2 px-6 py-3 text-sm font-semibold text-white shadow-lg`}>
                Sample button
              </button>
            </div>
            <div className="border-t border-aria-border px-4 py-3 text-[11px] leading-relaxed text-aria-muted">
              <p className="mb-1 flex items-center gap-1 font-semibold text-aria-text"><Sparkles size={12} className="text-aria-brand-2" /> Tips</p>
              Use <code className="text-aria-brand-2">.effect</code> for the element, and the
              <code className="text-aria-brand-2"> var(--aria-anim-*)</code> variables so the Speed / Intensity controls still work. Scripts and <code>@import</code> are stripped.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-aria-border px-5 py-3">
          <span className="text-xs text-aria-muted">{shared ? '✓ Shared to the marketplace' : 'Saved effects appear in the animation picker.'}</span>
          <div className="flex gap-2">
            <button onClick={share} disabled={shared}
              className="flex items-center gap-1.5 rounded-lg border border-aria-border px-4 py-2 text-sm font-semibold text-aria-text transition hover:bg-aria-panel-2 disabled:opacity-40">
              <Share2 size={15} /> {shared ? 'Shared' : 'Save & share'}
            </button>
            <button onClick={save}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-aria-brand to-aria-brand-2 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
              <Save size={15} /> Save effect
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
