import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Download, Search, Upload, X, Plus, Check, MousePointer2, Wand2 } from 'lucide-react'
import { buildSiteElements, styleFromMarketItem, sectionsForCategory } from '../lib/buildTemplate'
import { useCanvasStore } from '../store/canvasStore'
import { useMarketplaceStore } from '../store/marketplaceStore'
import { useEffectsStore } from '../store/effectsStore'
import { useProfileStore } from '../store/profileStore'
import type { MarketCategory, MarketItem } from '../types'

const cats: (MarketCategory | 'all')[] = ['all', 'business', 'portfolio', 'landing', 'restaurant', 'blog', 'theme']
const kinds = ['all', 'template', 'theme', 'creation', 'effect'] as const

function Stars({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-0.5 text-amber-400">
      <Star size={13} fill="currentColor" />
      <span className="text-xs font-semibold text-aria-text">{n.toFixed(1)}</span>
    </span>
  )
}

function Card({ item, owned, onGet, onOpen, onDetail }: {
  item: MarketItem
  owned: boolean
  onGet: () => void
  onOpen: () => void
  onDetail: () => void
}) {
  return (
    <div className="a-lift group flex flex-col overflow-hidden rounded-2xl border border-aria-border bg-aria-panel/70 backdrop-blur hover:border-aria-brand/50">
      <button onClick={onDetail} className="relative block h-36 text-left" style={{ background: item.cover }}>
        <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur">
          {item.kind}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-xs font-bold text-white backdrop-blur">
          Free
        </span>
        {owned && (
          <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-emerald-300 backdrop-blur">
            <Check size={11} /> In library
          </span>
        )}
      </button>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <button onClick={onDetail} className="min-w-0 text-left">
            <h3 className="truncate font-semibold hover:text-aria-brand-2">{item.title}</h3>
            <p className="text-xs text-aria-muted">by {item.author}</p>
          </button>
          <Stars n={item.rating} />
        </div>
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-aria-muted">{item.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-1">
          <span className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">{item.license}</span>
          {item.tags.map((t) => (
            <span key={t} className="rounded-md bg-aria-panel-2 px-2 py-0.5 text-[10px] text-aria-muted">#{t}</span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-aria-muted"><Download size={13} /> {item.downloads.toLocaleString()}</span>
          {item.kind === 'effect' ? (
            owned ? (
              <span className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400"><Check size={13} /> Installed</span>
            ) : (
              <button onClick={onGet} className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-aria-brand to-aria-brand-2 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:opacity-90">
                <Wand2 size={13} /> Add effect
              </button>
            )
          ) : owned ? (
            <button onClick={onOpen} className="flex items-center gap-1.5 rounded-lg bg-aria-panel-2 px-3.5 py-1.5 text-xs font-semibold text-aria-text transition hover:bg-aria-border">
              <MousePointer2 size={13} /> Open in Canvas
            </button>
          ) : (
            <button onClick={onGet} className="rounded-lg bg-gradient-to-r from-aria-brand to-aria-brand-2 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:opacity-90">
              Get free
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailModal({ item, owned, onClose, onGet, onOpen }: {
  item: MarketItem
  owned: boolean
  onClose: () => void
  onGet: () => void
  onOpen: () => void
}) {
  return (
    <div className="a-fade-in fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="a-pop-in w-full max-w-xl overflow-hidden rounded-2xl border border-aria-border bg-aria-panel" onClick={(e) => e.stopPropagation()}>
        <div className="relative h-44" style={{ background: item.cover }}>
          <button onClick={onClose} className="absolute right-3 top-3 rounded-lg bg-black/40 p-1.5 text-white backdrop-blur hover:bg-black/60"><X size={16} /></button>
          <span className="absolute left-4 top-4 rounded-full bg-black/40 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur">{item.kind}</span>
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">{item.title}</h2>
              <p className="text-sm text-aria-muted">by {item.author}</p>
            </div>
            <Stars n={item.rating} />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-aria-muted">{item.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">{item.license} · Free</span>
            {item.tags.map((t) => <span key={t} className="rounded-md bg-aria-panel-2 px-2 py-0.5 text-[11px] text-aria-muted">#{t}</span>)}
            <span className="ml-auto flex items-center gap-1 text-xs text-aria-muted"><Download size={13} /> {item.downloads.toLocaleString()}</span>
          </div>
          <div className="mt-6 flex gap-2">
            {item.kind === 'effect' ? (
              owned ? (
                <span className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-3 text-sm font-semibold text-emerald-400">
                  <Check size={16} /> Installed — in the animation picker
                </span>
              ) : (
                <button onClick={onGet} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-aria-brand to-aria-brand-2 py-3 text-sm font-semibold text-white transition hover:opacity-90">
                  <Wand2 size={16} /> Add effect
                </button>
              )
            ) : (
              <>
                <button onClick={onOpen} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-aria-brand to-aria-brand-2 py-3 text-sm font-semibold text-white transition hover:opacity-90">
                  <MousePointer2 size={16} /> Open in Canvas
                </button>
                {!owned ? (
                  <button onClick={onGet} className="rounded-xl border border-aria-border px-5 py-3 text-sm font-semibold text-aria-text transition hover:bg-aria-panel-2">
                    Get free
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-400">
                    <Check size={16} /> In library
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const licenses = ['MIT', 'CC-BY', 'CC0', 'GPL'] as const

function UploadModal({ onClose, onPublish }: { onClose: () => void; onPublish: (i: MarketItem) => void }) {
  const author = useProfileStore((s) => s.name)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<MarketCategory>('theme')
  const [license, setLicense] = useState<MarketItem['license']>('MIT')
  const [tags, setTags] = useState('')
  const [description, setDescription] = useState('')

  const covers = [
    'linear-gradient(135deg,#7c5cff,#22d3ee)',
    'linear-gradient(135deg,#f472b6,#7c5cff)',
    'linear-gradient(135deg,#f97316,#eab308)',
    'linear-gradient(135deg,#10b981,#059669)',
  ]
  const [cover, setCover] = useState(covers[0])

  const publish = () => {
    if (!title.trim()) return
    onPublish({
      id: `u${Date.now()}`,
      title: title.trim(),
      author: author || 'you',
      category,
      kind: category === 'theme' ? 'theme' : 'creation',
      license,
      rating: 5,
      downloads: 0,
      cover,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 4),
      description: description.trim() || 'A fresh creation shared on the Aria marketplace.',
    })
  }

  return (
    <div className="a-fade-in fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="a-pop-in w-full max-w-lg rounded-2xl border border-aria-border bg-aria-panel p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Upload size={18} /> Publish to marketplace</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-aria-muted hover:bg-aria-panel-2 hover:text-aria-text"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-aria-border bg-aria-panel-2 px-3 py-2 text-sm outline-none focus:border-aria-brand" />

          <div className="grid grid-cols-2 gap-3">
            <select value={category} onChange={(e) => setCategory(e.target.value as MarketCategory)}
              className="rounded-lg border border-aria-border bg-aria-panel-2 px-3 py-2 text-sm outline-none focus:border-aria-brand">
              {(cats.filter((c) => c !== 'all') as MarketCategory[]).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={license} onChange={(e) => setLicense(e.target.value as MarketItem['license'])}
              className="rounded-lg border border-aria-border bg-aria-panel-2 px-3 py-2 text-sm outline-none focus:border-aria-brand">
              {licenses.map((l) => <option key={l} value={l}>{l} license</option>)}
            </select>
          </div>

          <input placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)}
            className="w-full rounded-lg border border-aria-border bg-aria-panel-2 px-3 py-2 text-sm outline-none focus:border-aria-brand" />

          <textarea placeholder="Short description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            className="w-full resize-none rounded-lg border border-aria-border bg-aria-panel-2 px-3 py-2 text-sm outline-none focus:border-aria-brand" />

          <div>
            <p className="mb-1.5 text-xs font-medium text-aria-muted">Cover</p>
            <div className="flex gap-2">
              {covers.map((c) => (
                <button key={c} onClick={() => setCover(c)}
                  className={`h-10 flex-1 rounded-lg border-2 transition ${cover === c ? 'border-white' : 'border-transparent'}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-dashed border-aria-border bg-aria-panel-2/50 px-3 py-4 text-sm text-aria-muted">
            <Upload size={18} /> Drop your CSS / project files here (demo — no real upload)
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-aria-muted hover:text-aria-text">Cancel</button>
          <button onClick={publish} disabled={!title.trim()}
            className="rounded-lg bg-gradient-to-r from-aria-brand to-aria-brand-2 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40">
            Publish
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Marketplace() {
  const navigate = useNavigate()
  const loadDesign = useCanvasStore((s) => s.loadDesign)
  const { items, addItem, incrementDownloads } = useMarketplaceStore()
  const installEffect = useEffectsStore((s) => s.addEffect)
  const [owned, setOwned] = useState<Set<string>>(new Set())
  const [cat, setCat] = useState<(typeof cats)[number]>('all')
  const [kind, setKind] = useState<(typeof kinds)[number]>('all')
  const [q, setQ] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [detail, setDetail] = useState<MarketItem | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return items.filter((i) => {
      if (cat !== 'all' && i.category !== cat) return false
      if (kind !== 'all' && i.kind !== kind) return false
      if (query && !`${i.title} ${i.author} ${i.tags.join(' ')}`.toLowerCase().includes(query)) return false
      return true
    })
  }, [items, cat, kind, q])

  const flash = (msg: string) => {
    setToast(msg)
    window.clearTimeout((flash as any)._t)
    ;(flash as any)._t = window.setTimeout(() => setToast(null), 2600)
  }

  // Add an item to the user's library: mark owned + bump downloads. Effect items
  // are installed straight into the animation picker.
  const getFree = (item: MarketItem) => {
    if (!owned.has(item.id)) {
      setOwned((s) => new Set(s).add(item.id))
      incrementDownloads(item.id)
      if (item.kind === 'effect' && item.effectCss) {
        installEffect(item.effectName || item.title, item.effectCss, item.author)
        flash(`“${item.title}” installed — find it in the animation picker`)
        return
      }
    }
    flash(`“${item.title}” added to your library`)
  }

  // Generate a real editable design from the item and open it in the canvas.
  const openInCanvas = (item: MarketItem) => {
    if (!owned.has(item.id)) getFree(item)
    const style = styleFromMarketItem(item)
    const seeds = buildSiteElements({
      style,
      sections: sectionsForCategory(item.category),
      siteName: item.title,
      tagline: item.description,
      blurb: `A ${item.category} starting point from the Aria marketplace.`,
    })
    loadDesign(`${item.title}`, seeds, style.bg)
    navigate('/canvas')
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="a-fade-up mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Marketplace</h1>
          <p className="text-sm text-aria-muted">Free &amp; open — every template, CSS theme and creation is free to use, remix and share.</p>
        </div>
        <button onClick={() => setUploadOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-aria-brand to-aria-brand-2 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-aria-brand/20 transition hover:opacity-90">
          <Plus size={16} /> Upload creation
        </button>
      </div>

      {/* Controls */}
      <div className="a-fade-up a-d1 mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-aria-border bg-aria-panel px-3 py-2">
          <Search size={16} className="text-aria-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search themes, creations, authors…"
            className="w-56 bg-transparent text-sm outline-none placeholder:text-aria-muted" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition ${
                cat === c ? 'border-aria-brand bg-aria-brand/15 text-aria-text' : 'border-aria-border text-aria-muted hover:text-aria-text'
              }`}>
              {c}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-aria-border bg-aria-panel p-0.5">
          {kinds.map((k) => (
            <button key={k} onClick={() => setKind(k)}
              className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition ${
                kind === k ? 'bg-aria-panel-2 text-aria-text' : 'text-aria-muted hover:text-aria-text'
              }`}>
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-aria-border py-24 text-center text-aria-muted">
          <p>No creations match your filters yet.</p>
        </div>
      ) : (
        <div className="a-stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <Card
              key={item.id}
              item={item}
              owned={owned.has(item.id)}
              onGet={() => getFree(item)}
              onOpen={() => openInCanvas(item)}
              onDetail={() => setDetail(item)}
            />
          ))}
        </div>
      )}

      {uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onPublish={(i) => { addItem(i); setUploadOpen(false); flash(`“${i.title}” published`) }}
        />
      )}

      {detail && (
        <DetailModal
          item={detail}
          owned={owned.has(detail.id)}
          onClose={() => setDetail(null)}
          onGet={() => getFree(detail)}
          onOpen={() => openInCanvas(detail)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl border border-aria-border bg-aria-panel-2 px-4 py-2.5 text-sm font-medium text-aria-text shadow-2xl">
          <span className="flex items-center gap-2"><Check size={15} className="text-emerald-400" /> {toast}</span>
        </div>
      )}
    </div>
  )
}
