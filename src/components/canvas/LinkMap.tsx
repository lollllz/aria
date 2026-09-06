import { useMemo, useState } from 'react'
import { X, MousePointerClick, FileText, Link2, Unlink, Info } from 'lucide-react'
import { useCanvasStore } from '../../store/canvasStore'
import type { CanvasElement } from '../../types'
import Dialog from '../Dialog'

// ── Layout constants for the node graph ─────────────────────────────────────
const CARD_W = 240
const GAP_X = 130
const HEADER_H = 44
const ROW_H = 30
const PAD = 40
const TOP = 40

const isInteractive = (e: CanvasElement) => e.kind === 'button'

export default function LinkMap({ onClose }: { onClose: () => void }) {
  const { pages, elements, setAction } = useCanvasStore()
  const [linkingFrom, setLinkingFrom] = useState<string | null>(null)

  // Group elements by page, preserving order.
  const byPage = useMemo(() => {
    const map: Record<string, CanvasElement[]> = {}
    for (const p of pages) map[p.id] = []
    for (const e of elements) (map[e.pageId] ??= []).push(e)
    return map
  }, [pages, elements])

  // Precompute card positions and per-element row anchors.
  const layout = useMemo(() => {
    const cards = pages.map((p, i) => {
      const rows = byPage[p.id] ?? []
      const x = PAD + i * (CARD_W + GAP_X)
      const height = HEADER_H + Math.max(rows.length, 1) * ROW_H + 12
      return { page: p, x, y: TOP, height, rows }
    })
    // element id -> anchor points
    const anchors: Record<string, { page: { x: number; y: number }; left: number; right: number; rowY: number }> = {}
    for (const c of cards) {
      c.rows.forEach((el, ri) => {
        const rowY = c.y + HEADER_H + ri * ROW_H + ROW_H / 2
        anchors[el.id] = { page: { x: c.x, y: c.y + HEADER_H / 2 }, left: c.x, right: c.x + CARD_W, rowY }
      })
    }
    const pageAnchor: Record<string, { x: number; y: number }> = {}
    for (const c of cards) pageAnchor[c.page.id] = { x: c.x, y: c.y + HEADER_H / 2 }
    const width = PAD * 2 + cards.length * CARD_W + (cards.length - 1) * GAP_X
    const maxH = Math.max(...cards.map((c) => c.y + c.height), 320) + PAD
    return { cards, anchors, pageAnchor, width, maxH }
  }, [pages, byPage])

  // Build the list of edges (button -> target) to draw.
  const edges = useMemo(() => {
    const out: { id: string; x1: number; y1: number; x2: number; y2: number; color: string }[] = []
    for (const el of elements) {
      if (el.action.type !== 'page' && el.action.type !== 'element') continue
      const src = layout.anchors[el.id]
      if (!src) continue
      let tx: number, ty: number
      if (el.action.type === 'page') {
        const t = layout.pageAnchor[el.action.target]
        if (!t) continue
        tx = t.x; ty = t.y
      } else {
        const t = layout.anchors[el.action.target]
        if (!t) continue
        tx = t.left; ty = t.rowY
      }
      // exit from whichever side of the source card is closer to the target
      const x1 = tx >= src.right ? src.right : src.left
      out.push({ id: el.id, x1, y1: src.rowY, x2: tx, y2: ty, color: '#7c5cff' })
    }
    return out
  }, [elements, layout])

  const startLink = (elId: string) => setLinkingFrom((cur) => (cur === elId ? null : elId))

  const completeToPage = (pageId: string) => {
    if (!linkingFrom) return
    setAction(linkingFrom, { type: 'page', target: pageId })
    setLinkingFrom(null)
  }
  const completeToElement = (elId: string) => {
    if (!linkingFrom || linkingFrom === elId) return
    setAction(linkingFrom, { type: 'element', target: elId })
    setLinkingFrom(null)
  }

  const targetLabel = (el: CanvasElement) => {
    if (el.action.type === 'none') return null
    if (el.action.type === 'url') return el.action.target || 'URL'
    if (el.action.type === 'page') return pages.find((p) => p.id === el.action.target)?.name ?? '—'
    return elements.find((e) => e.id === el.action.target)?.name ?? '—'
  }

  return (
    <Dialog
      onClose={onClose}
      labelledBy="linkmap-title"
      fullscreen
      zClass="z-50"
      panelClassName="flex h-full flex-col"
    >
      <div className="flex h-12 items-center justify-between border-b border-aria-border px-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Link2 size={16} aria-hidden className="text-aria-brand-2" />
          <h2 id="linkmap-title" className="text-sm font-semibold">Link Map</h2>
          <span className="ml-2 hidden items-center gap-1 text-xs font-normal text-aria-muted sm:flex">
            <Info size={13} aria-hidden /> Activate a button, then a page or element to wire the hook.
          </span>
        </div>
        <button onClick={onClose} className="flex items-center gap-1.5 rounded-lg border border-aria-border px-3 py-1.5 text-sm text-aria-muted hover:text-aria-text">
          <X size={15} aria-hidden /> Close
        </button>
      </div>

      {/* Graph canvas */}
      <div className="min-h-0 flex-1 overflow-auto aria-grid-bg p-2">
        <div className="relative" style={{ width: layout.width, height: layout.maxH }}>
          {/* Edges */}
          <svg aria-hidden className="pointer-events-none absolute inset-0" width={layout.width} height={layout.maxH}>
            <defs>
              <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L8,3 L0,6 Z" fill="#7c5cff" />
              </marker>
            </defs>
            {edges.map((e) => {
              const midX = (e.x1 + e.x2) / 2
              return (
                <path
                  key={e.id}
                  d={`M${e.x1},${e.y1} C${midX},${e.y1} ${midX},${e.y2} ${e.x2},${e.y2}`}
                  fill="none" stroke={e.color} strokeWidth={2} markerEnd="url(#arrow)" opacity={0.85}
                />
              )
            })}
          </svg>

          {/* Page cards */}
          {layout.cards.map((c) => (
            <div
              key={c.page.id}
              className="absolute rounded-xl border border-aria-border bg-aria-panel shadow-xl"
              style={{ left: c.x, top: c.y, width: CARD_W }}
            >
              {/* Card header = page node (a valid link target) */}
              <button
                onClick={() => completeToPage(c.page.id)}
                disabled={!linkingFrom}
                style={{ height: HEADER_H }}
                className={`flex w-full items-center gap-2 rounded-t-xl border-b border-aria-border px-3 text-left text-sm font-semibold transition ${
                  linkingFrom ? 'cursor-crosshair bg-aria-brand/15 hover:bg-aria-brand/30' : 'bg-aria-panel-2'
                }`}
                aria-label={linkingFrom ? `Link to page ${c.page.name}` : c.page.name}
              >
                <FileText size={15} className="text-aria-brand-2" />
                <span className="truncate">{c.page.name}</span>
                <span className="ml-auto text-[10px] font-normal text-aria-muted">page</span>
              </button>

              {/* Element rows */}
              <div className="py-1">
                {c.rows.length === 0 && (
                  <div className="px-3 py-2 text-xs text-aria-muted">No elements</div>
                )}
                {c.rows.map((el) => {
                  const interactive = isInteractive(el)
                  const linking = linkingFrom === el.id
                  const label = targetLabel(el)
                  // What clicking the row does depends on mode:
                  //  - idle + interactive button → start a link from it
                  //  - linking + any other element → complete an element link
                  const clickable = interactive || Boolean(linkingFrom)
                  const onRowClick = () => {
                    if (linking) { setLinkingFrom(null); return }
                    if (linkingFrom) completeToElement(el.id)
                    else if (interactive) startLink(el.id)
                  }
                  const hint = interactive && !linkingFrom
                    ? 'Start a link from this button'
                    : linkingFrom
                      ? 'Link to this element'
                      : undefined
                  return (
                    <div
                      key={el.id}
                      style={{ height: ROW_H }}
                      className={`group flex items-center gap-2 px-3 text-xs ${
                        linking ? 'bg-aria-brand/30' : ''
                      }`}
                    >
                      {clickable ? (
                        <button
                          type="button"
                          onClick={onRowClick}
                          aria-pressed={linking}
                          aria-label={`${el.name}${label ? `, linked to ${label}` : ''}. ${hint ?? ''}`}
                          title={hint}
                          className={`flex min-w-0 flex-1 items-center gap-2 rounded-md text-left ${
                            linkingFrom ? 'cursor-crosshair hover:bg-aria-panel-2' : interactive ? 'hover:bg-aria-panel-2' : ''
                          }`}
                        >
                          {interactive ? (
                            <MousePointerClick size={13} aria-hidden className="shrink-0 text-aria-brand" />
                          ) : (
                            <span aria-hidden className="h-2 w-2 shrink-0 rounded-sm bg-aria-border" />
                          )}
                          <span className={`truncate ${interactive ? 'text-aria-text' : 'text-aria-muted'}`}>
                            {el.name}
                          </span>
                          {label && (
                            <span className="ml-auto flex items-center gap-1 rounded bg-aria-brand/15 px-1.5 py-0.5 text-[10px] text-aria-brand-2">
                              → {label}
                            </span>
                          )}
                        </button>
                      ) : (
                        <>
                          <span aria-hidden className="h-2 w-2 shrink-0 rounded-sm bg-aria-border" />
                          <span className="truncate text-aria-muted">{el.name}</span>
                        </>
                      )}

                      {interactive && (
                        <div className={`flex items-center gap-1 ${label && !clickable ? 'ml-auto' : ''}`}>
                          {el.action.type !== 'none' && (
                            <button
                              onClick={(ev) => { ev.stopPropagation(); setAction(el.id, { type: 'none', target: '' }) }}
                              aria-label={`Unlink ${el.name}`}
                              title="Unlink"
                              className="rounded p-1 text-aria-muted hover:text-red-400"
                            >
                              <Unlink size={12} aria-hidden />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer hint while linking */}
      {linkingFrom && (
        <div role="status" aria-live="polite" className="border-t border-aria-border bg-aria-panel px-4 py-2 text-center text-xs text-aria-brand-2">
          Linking from “{elements.find((e) => e.id === linkingFrom)?.name}” — activate a page header or an element to connect, or activate the same button again to cancel.
        </div>
      )}
    </Dialog>
  )
}
