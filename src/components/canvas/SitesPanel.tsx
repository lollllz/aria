import { useEffect, useState } from 'react'
import {
  Cloud, CloudOff, X, Loader2, Check, FilePlus2, FolderOpen, RefreshCw, LogIn,
} from 'lucide-react'
import { api, type SiteData, type SiteRow } from '../../lib/api'
import { cloudEnabled } from '../../lib/cloud'
import { useCanvasStore } from '../../store/canvasStore'
import { useEffectsStore } from '../../store/effectsStore'
import { useProfileStore } from '../../store/profileStore'
import { useSitesStore } from '../../store/sitesStore'

// Collects the whole design out of the stores.
export function collectSiteData(): SiteData {
  const c = useCanvasStore.getState()
  return {
    frame: c.page,
    pages: c.pages,
    elements: c.elements,
    effects: useEffectsStore.getState().customEffects,
    autoAdaptive: c.autoAdaptive,
  }
}

// Pushes a saved design back into the stores.
export function applySiteData(d: SiteData) {
  useCanvasStore.setState({
    page: d.frame,
    pages: d.pages?.length ? d.pages : [{ id: 'home', name: 'Home' }],
    elements: d.elements ?? [],
    currentPageId: d.pages?.[0]?.id ?? 'home',
    autoAdaptive: Boolean(d.autoAdaptive),
    selectedId: null,
    history: [],
    future: [],
  })
  if (d.effects) useEffectsStore.setState({ customEffects: d.effects })
}

export default function SitesPanel({ onClose }: { onClose: () => void }) {
  const { userId, name: userName } = useProfileStore()
  const { currentSiteId, currentSiteName, setCurrent, markSaved } = useSitesStore()
  const [rows, setRows] = useState<SiteRow[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [siteName, setSiteName] = useState(currentSiteName)
  const [savedFlash, setSavedFlash] = useState(false)

  const signedIn = Boolean(userId)
  const online = cloudEnabled()

  const refresh = async () => {
    if (!online || !signedIn) return
    setBusy('list'); setErr(null)
    try {
      setRows(await api.listSites(userId))
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally { setBusy(null) }
  }

  useEffect(() => { refresh() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [userId, online])

  const save = async (asNew: boolean) => {
    setBusy('save'); setErr(null)
    try {
      const row = await api.saveSite({
        id: asNew ? undefined : currentSiteId ?? undefined,
        userId,
        name: siteName.trim() || 'Untitled site',
        data: collectSiteData(),
      })
      setCurrent(row.id, row.name)
      markSaved()
      setSavedFlash(true)
      window.setTimeout(() => setSavedFlash(false), 1800)
      refresh()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally { setBusy(null) }
  }

  const load = async (id: string) => {
    setBusy(id); setErr(null)
    try {
      const row = await api.getSite(id)
      if (row.data) applySiteData(row.data)
      setCurrent(row.id, row.name)
      setSiteName(row.name)
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally { setBusy(null) }
  }

  return (
    <div className="a-fade-in fixed inset-0 z-[65] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="a-pop-in w-full max-w-lg overflow-hidden rounded-2xl border border-aria-border bg-aria-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-aria-border px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            {online ? <Cloud size={17} className="text-aria-brand-2" /> : <CloudOff size={17} className="text-aria-muted" />}
            My sites
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-aria-muted hover:bg-aria-panel-2 hover:text-aria-text"><X size={17} /></button>
        </div>

        {/* Requirements */}
        {!online ? (
          <div className="px-5 py-6 text-sm leading-relaxed text-aria-muted">
            Cloud saving is off because no database is connected. Open{' '}
            <span className="text-aria-brand-2">Database</span> in the top nav to connect one — your work still
            saves on this device in the meantime.
          </div>
        ) : !signedIn ? (
          <div className="flex flex-col items-center gap-3 px-5 py-8 text-center">
            <LogIn size={22} className="text-aria-muted" />
            <p className="text-sm leading-relaxed text-aria-muted">
              Sign in to save your designs to the cloud and open them on any device.
            </p>
          </div>
        ) : (
          <>
            {/* Save row */}
            <div className="border-b border-aria-border px-5 py-4">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-aria-muted">Site name</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') save(false) }}
                  placeholder="My site"
                  className="flex-1 rounded-xl border border-aria-border bg-aria-panel-2 px-3 py-2 text-sm outline-none transition-colors focus:border-aria-brand"
                />
                <button
                  onClick={() => save(false)}
                  disabled={busy === 'save'}
                  className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 ${
                    savedFlash ? 'bg-emerald-500' : 'bg-gradient-to-r from-aria-brand to-aria-brand-2 hover:opacity-90'
                  }`}
                >
                  {busy === 'save' ? <Loader2 size={15} className="animate-spin" /> : savedFlash ? <Check size={15} /> : <Cloud size={15} />}
                  {savedFlash ? 'Saved' : currentSiteId ? 'Save' : 'Save to cloud'}
                </button>
                {currentSiteId && (
                  <button
                    onClick={() => save(true)}
                    disabled={busy === 'save'}
                    title="Save as a new site"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-aria-border px-3 py-2 text-sm font-medium text-aria-muted hover:text-aria-text disabled:opacity-50"
                  >
                    <FilePlus2 size={15} /> Copy
                  </button>
                )}
              </div>
              <p className="mt-2 text-[11px] text-aria-muted">Signed in as {userName || 'you'}.</p>
            </div>

            {/* Saved sites */}
            <div className="max-h-[46vh] overflow-auto px-5 py-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-aria-muted">Saved sites</span>
                <button onClick={refresh} className="flex items-center gap-1 text-xs text-aria-muted hover:text-aria-text">
                  <RefreshCw size={12} className={busy === 'list' ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>

              {busy === 'list' && !rows.length ? (
                <div className="grid place-items-center py-8 text-aria-muted"><Loader2 size={18} className="animate-spin" /></div>
              ) : rows.length === 0 ? (
                <p className="py-6 text-center text-sm text-aria-muted">No saved sites yet — save your first one above.</p>
              ) : (
                <ul className="a-stagger space-y-1.5">
                  {rows.map((r) => (
                    <li key={r.id}>
                      <button
                        onClick={() => load(r.id)}
                        disabled={Boolean(busy)}
                        className={`a-press flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-300 disabled:opacity-60 ${
                          r.id === currentSiteId
                            ? 'border-aria-brand bg-aria-brand/10'
                            : 'border-aria-border hover:border-aria-brand/40 hover:bg-aria-panel-2'
                        }`}
                      >
                        <FolderOpen size={16} className="shrink-0 text-aria-brand-2" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{r.name}</span>
                          <span className="block text-[11px] text-aria-muted">
                            {new Date(r.updated_at).toLocaleString()}
                            {r.id === currentSiteId && ' · open'}
                          </span>
                        </span>
                        {busy === r.id && <Loader2 size={14} className="animate-spin text-aria-muted" />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {err && (
          <div className="a-pop-in border-t border-red-500/30 bg-red-500/[0.07] px-5 py-3 text-xs text-red-300">{err}</div>
        )}
      </div>
    </div>
  )
}
