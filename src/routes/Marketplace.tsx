import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Download, Search, Upload, X, Plus, Check, MousePointer2, Wand2, Cloud, CloudOff, Loader2 } from 'lucide-react'
import { buildSiteElements, styleFromMarketItem, sectionsForCategory } from '../lib/buildTemplate'
import { useCanvasStore } from '../store/canvasStore'
import { useMarketplaceStore } from '../store/marketplaceStore'
import { useEffectsStore } from '../store/effectsStore'
import { useProfileStore } from '../store/profileStore'
import { api } from '../lib/api'
import { cloudEnabled, rowToMarketItem, marketItemToBody } from '../lib/cloud'
import type { MarketCategory, MarketItem } from '../types'
import Dialog from '../components/Dialog'

const cats: (MarketCategory | 'all')[] = ['all', 'business', 'portfolio', 'landing', 'restaurant', 'blog', 'theme']
const kinds = ['all', 'template', 'theme', 'creation', 'effect'] as const

function Stars({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-0.5 text-amber-400" aria-label={`${n.toFixed(1)} out of 5 stars`}>
      <Star size={13} fill="currentColor" aria-hidden />
      <span className="text-xs font-semibold text-aria-text" aria-hidden>{n.toFixed(1)}</span>
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
      <button onClick={onDetail} aria-label={`${item.title} details`} className="relative block h-36 text-left" style={{ background: item.cover }}>
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
            <h2 className="truncate font-semibold hover:text-aria-brand-2">{item.title}</h2>
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
          <span className="flex items-center gap-1 text-xs text-aria-muted" aria-label={`${item.downloads.toLocaleString()} downloads`}>
            <Download size={13} aria-hidden /> {item.downloads.toLocaleString()}
          </span>
          {item.kind === 'effect' ? (
            owned ? (
              <span className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400"><Check size={13} /> Installed</span>
            ) : (
              <button onClick={onGet} className="a-cta flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition">
                <Wand2 size={13} aria-hidden /> Add effect
              </button>
            )
          ) : owned ? (
            <button onClick={onOpen} className="flex items-center gap-1.5 rounded-lg bg-aria-panel-2 px-3.5 py-1.5 text-xs font-semibold text-aria-text transition hover:bg-aria-border">
              <MousePointer2 size={13} /> Open in Canvas
            </button>
          ) : (
            <button onClick={onGet} className="a-cta rounded-lg px-3.5 py-1.5 text-xs font-semibold transition">
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
    <Dialog
      onClose={onClose}
      labelledBy="market-detail-title"
      panelClassName="a-pop-in w-full max-w-xl overflow-hidden rounded-2xl border border-aria-border bg-aria-panel"
    >
      <div className="relative h-44" style={{ background: item.cover }}>
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-lg bg-black/40 p-1.5 text-white backdrop-blur hover:bg-black/60"
        >
          <X size={16} aria-hidden />
        </button>
        <span className="absolute left-4 top-4 rounded-full bg-black/40 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur">{item.kind}</span>
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="market-detail-title" className="text-xl font-bold">{item.title}</h2>
            <p className="text-sm text-aria-muted">by {item.author}</p>
          </div>
          <Stars n={item.rating} />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-aria-muted">{item.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <span className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">{item.license} · Free</span>
          {item.tags.map((t) => <span key={t} className="rounded-md bg-aria-panel-2 px-2 py-0.5 text-[11px] text-aria-muted">#{t}</span>)}
          <span className="ml-auto flex items-center gap-1 text-xs text-aria-muted" aria-label={`${item.downloads.toLocaleString()} downloads`}>
            <Download size={13} aria-hidden /> {item.downloads.toLocaleString()}
          </span>
        </div>
        <div className="mt-6 flex gap-2">
          {item.kind === 'effect' ? (
            owned ? (
              <span className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-3 text-sm font-semibold text-emerald-400">
                <Check size={16} aria-hidden /> Installed — in the animation picker
              </span>
            ) : (
              <button onClick={onGet} className="a-cta flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition">
                <Wand2 size={16} aria-hidden /> Add effect
              </button>
            )
          ) : (
            <>
              <button onClick={onOpen} className="a-cta flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition">
                <MousePointer2 size={16} aria-hidden /> Open in Canvas
              </button>
              {!owned ? (
                <button onClick={onGet} className="rounded-xl border border-aria-border px-5 py-3 text-sm font-semibold text-aria-text transition hover:bg-aria-panel-2">
                  Get free
                </button>
              ) : (
                <span className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-400">
                  <Check size={16} aria-hidden /> In library
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </Dialog>
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
    <Dialog
      onClose={onClose}
      labelledBy="upload-title"
      panelClassName="a-pop-in w-full max-w-lg rounded-2xl border border-aria-border bg-aria-panel p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 id="upload-title" className="flex items-center gap-2 text-lg font-bold"><Upload size={18} aria-hidden /> Publish to marketplace</h2>
        <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-aria-muted hover:bg-aria-panel-2 hover:text-aria-text">
          <X size={18} aria-hidden />
        </button>
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-aria-muted">Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-aria-border bg-aria-panel-2 px-3 py-2 text-sm focus:border-aria-brand" />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-aria-muted">Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value as MarketCategory)}
              className="w-full rounded-lg border border-aria-border bg-aria-panel-2 px-3 py-2 text-sm focus:border-aria-brand">
              {(cats.filter((c) => c !== 'all') as MarketCategory[]).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-aria-muted">License</span>
            <select value={license} onChange={(e) => setLicense(e.target.value as MarketItem['license'])}
              className="w-full rounded-lg border border-aria-border bg-aria-panel-2 px-3 py-2 text-sm focus:border-aria-brand">
              {licenses.map((l) => <option key={l} value={l}>{l} license</option>)}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-aria-muted">Tags (comma separated)</span>
          <input value={tags} onChange={(e) => setTags(e.target.value)}
            className="w-full rounded-lg border border-aria-border bg-aria-panel-2 px-3 py-2 text-sm focus:border-aria-brand" />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-aria-muted">Short description</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            className="w-full resize-none rounded-lg border border-aria-border bg-aria-panel-2 px-3 py-2 text-sm focus:border-aria-brand" />
        </label>

        <div>
          <p id="cover-label" className="mb-1.5 text-xs font-medium text-aria-muted">Cover</p>
          <div role="radiogroup" aria-labelledby="cover-label" className="flex gap-2">
            {covers.map((c, i) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={cover === c}
                aria-label={`Cover style ${i + 1}`}
                onClick={() => setCover(c)}
                className={`h-10 flex-1 rounded-lg border-2 transition ${cover === c ? 'border-white' : 'border-transparent'}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-dashed border-aria-border bg-aria-panel-2/50 px-3 py-4 text-sm text-aria-muted">
          <Upload size={18} aria-hidden /> Drop your CSS / project files here (demo — no real upload)
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-aria-muted hover:text-aria-text">Cancel</button>
        <button onClick={publish} disabled={!title.trim()}
          className="a-cta rounded-lg px-4 py-2 text-sm font-semibold transition">
          Publish
        </button>
      </div>
    </Dialog>
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
  const [remote, setRemote] = useState<MarketItem[] | null>(null)
  const [loadingRemote, setLoadingRemote] = useState(cloudEnabled())

  // Pull the shared catalogue from the database. Seed/local items stay visible
  // so the page still works when the backend is unreachable.
  useEffect(() => {
    if (!cloudEnabled()) { setLoadingRemote(false); return }
    let cancelled = false
    api.listMarket()
      .then((rows) => { if (!cancelled) setRemote((rows as unknown as Record<string, unknown>[]).map(rowToMarketItem)) })
      .catch(() => { if (!cancelled) setRemote(null) })
      .finally(() => { if (!cancelled) setLoadingRemote(false) })
    return () => { cancelled = true }
  }, [])

  // Shared (cloud) items first, then anything local that isn't already there.
  const allItems = useMemo(() => {
    if (!remote) return items
    const seen = new Set(remote.map((r) => r.title + '|' + r.author))
    return [...remote, ...items.filter((i) => !seen.has(i.title + '|' + i.author))]
  }, [remote, items])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return allItems.filter((i) => {
      if (cat !== 'all' && i.category !== cat) return false
      if (kind !== 'all' && i.kind !== kind) return false
      if (query && !`${i.title} ${i.author} ${i.tags.join(' ')}`.toLowerCase().includes(query)) return false
      return true
    })
  }, [allItems, cat, kind, q])

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
      // Count the download in the shared catalogue too (best-effort).
      if (cloudEnabled()) {
        api.getFree(item.id)
          .then(() => setRemote((prev) => prev?.map((r) => (r.id === item.id ? { ...r, downloads: r.downloads + 1 } : r)) ?? prev))
          .catch(() => {})
      }
      if (item.kind === 'effect' && item.effectCss) {
        installEffect(item.effectName || item.title, item.effectCss, item.author)
        flash(`“${item.title}” installed — find it in the animation picker`)
        return
      }
    }
    flash(`“${item.title}” added to your library`)
  }

  // Publish: write to the shared catalogue when connected, else keep it local.
  const publish = async (i: MarketItem) => {
    setUploadOpen(false)
    if (!cloudEnabled()) {
      addItem(i)
      flash(`“${i.title}” published on this device`)
      return
    }
    try {
      const row = await api.publishMarket(marketItemToBody(i) as never)
      const saved = rowToMarketItem(row as unknown as Record<string, unknown>)
      setRemote((prev) => [saved, ...(prev ?? [])])
      flash(`“${i.title}” published to the marketplace`)
    } catch {
      addItem(i)
      flash(`“${i.title}” saved locally — could not reach the marketplace`)
    }
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
          <p className="mt-1.5 flex items-center gap-1.5 text-xs">
            {loadingRemote ? (
              <span className="flex items-center gap-1.5 text-aria-muted"><Loader2 size={12} className="animate-spin" /> Loading shared catalogue…</span>
            ) : remote ? (
              <span className="flex items-center gap-1.5 text-emerald-400"><Cloud size={12} /> Shared marketplace · {remote.length} published by the community</span>
            ) : (
              <span className="flex items-center gap-1.5 text-aria-muted"><CloudOff size={12} /> Showing local items — connect a database to share</span>
            )}
          </p>
        </div>
        <button onClick={() => setUploadOpen(true)}
          className="a-cta flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg shadow-aria-brand/20 transition">
          <Plus size={16} aria-hidden /> Upload creation
        </button>
      </div>

      {/* Controls */}
      <div className="a-fade-up a-d1 mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-aria-border bg-aria-panel px-3 py-2">
          <Search size={16} className="text-aria-muted" aria-hidden />
          <label htmlFor="market-search" className="sr-only">Search marketplace</label>
          <input
            id="market-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search themes, creations, authors…"
            className="w-56 bg-transparent text-sm placeholder:text-aria-muted"
          />
        </div>
        <div role="group" aria-label="Category" className="flex flex-wrap gap-1.5">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition ${
                cat === c ? 'border-aria-brand bg-aria-brand/15 text-aria-text' : 'border-aria-border text-aria-muted hover:text-aria-text'
              }`}>
              {c}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Kind" className="ml-auto flex items-center gap-1 rounded-lg border border-aria-border bg-aria-panel p-0.5">
          {kinds.map((k) => (
            <button key={k} onClick={() => setKind(k)} aria-pressed={kind === k}
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
          onPublish={publish}
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
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl border border-aria-border bg-aria-panel-2 px-4 py-2.5 text-sm font-medium text-aria-text shadow-2xl"
        >
          <span className="flex items-center gap-2"><Check size={15} aria-hidden className="text-emerald-400" /> {toast}</span>
        </div>
      )}
    </div>
  )
}
