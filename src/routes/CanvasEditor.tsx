import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Type, Heading, Square, Circle, Image as ImageIcon, MousePointerClick,
  Undo2, Redo2, Trash2, Sparkles, Home, Eye, Grid3x3, Link2, Plus, X, Upload,
  Monitor, Tablet, Smartphone, Wand2, Download,
} from 'lucide-react'
import JSZip from 'jszip'
import { exportSite, type ExportDesign } from '../lib/exportSite'
import { useCanvasStore } from '../store/canvasStore'
import { DEVICE_FRAMES, type CanvasElement, type DeviceId, type ElementKind } from '../types'
import { effectiveGeo, autoLayout, autoLayoutHeight, type EffGeo } from '../lib/device'
import Inspector from '../components/canvas/Inspector'
import LinkMap from '../components/canvas/LinkMap'
import EffectMaker from '../components/canvas/EffectMaker'
import { useEffectsStore } from '../store/effectsStore'

const palette: { kind: ElementKind; label: string; icon: typeof Type }[] = [
  { kind: 'heading', label: 'Heading', icon: Heading },
  { kind: 'text', label: 'Text', icon: Type },
  { kind: 'button', label: 'Button', icon: MousePointerClick },
  { kind: 'rectangle', label: 'Rectangle', icon: Square },
  { kind: 'ellipse', label: 'Ellipse', icon: Circle },
  { kind: 'image', label: 'Image', icon: ImageIcon },
]

const DEVICES: { id: DeviceId; label: string; icon: typeof Monitor }[] = [
  { id: 'desktop', label: 'Desktop', icon: Monitor },
  { id: 'tablet', label: 'Tablet', icon: Tablet },
  { id: 'mobile', label: 'Mobile', icon: Smartphone },
]

type DragState =
  | { mode: 'move'; id: string; startX: number; startY: number; origX: number; origY: number }
  | { mode: 'resize'; id: string; handle: string; startX: number; startY: number; orig: EffGeo }
  | null

const HANDLES = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w']

function ElementView({
  el, geo, editable, selected, preview, onSelect, onStartMove, onStartResize, onEditContent, onActivate,
}: {
  el: CanvasElement
  geo: EffGeo
  editable: boolean
  selected: boolean
  preview: boolean
  onSelect: (id: string) => void
  onStartMove: (e: React.PointerEvent, el: CanvasElement, geo: EffGeo) => void
  onStartResize: (e: React.PointerEvent, handle: string, el: CanvasElement, geo: EffGeo) => void
  onEditContent: (id: string, content: string) => void
  onActivate: (el: CanvasElement) => void
}) {
  const s = el.style
  const hasHook = preview && el.action.type !== 'none'
  const canEdit = editable && !el.locked
  const isTextKind = el.kind === 'text' || el.kind === 'heading' || el.kind === 'button'
  const [editing, setEditing] = useState(false)
  const editRef = useRef<HTMLDivElement>(null)

  // When entering inline edit: seed the box with the current text (React leaves
  // the children alone while editing, so typing never gets reconciled away),
  // focus it, and select all.
  useEffect(() => {
    if (editing && editRef.current) {
      const node = editRef.current
      node.textContent = el.content
      node.focus()
      const r = document.createRange()
      r.selectNodeContents(node)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(r)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  // Outer wrapper owns position, rotation and selection; it never animates so
  // handles stay put. The inner box owns the visual style + animation class,
  // which lets hover transforms (tilt/pop) win over any base transform.
  const outer: React.CSSProperties = {
    position: 'absolute',
    left: geo.x, top: geo.y, width: geo.width, height: geo.height,
    transform: `rotate(${el.rotation}deg)`,
    opacity: s.opacity,
    cursor: preview ? (hasHook ? 'pointer' : 'default') : canEdit ? 'move' : 'default',
    userSelect: preview ? 'auto' : 'none',
  }

  const inner: React.CSSProperties = {
    width: '100%', height: '100%',
    borderRadius: el.kind === 'ellipse' ? '50%' : s.radius,
    background: s.background === 'transparent' ? 'transparent' : s.background,
    border: s.borderWidth ? `${s.borderWidth}px solid ${s.borderColor}` : undefined,
    boxShadow: s.shadow ? '0 12px 30px -8px rgba(0,0,0,0.45)' : undefined,
    color: s.color,
    fontSize: s.fontSize * geo.fontScale,
    fontWeight: s.fontWeight,
    textAlign: s.textAlign,
    letterSpacing: s.letterSpacing,
    lineHeight: s.lineHeight,
    padding: el.kind === 'svg' ? 0 : s.padding * geo.fontScale,
    display: 'flex',
    alignItems: el.kind === 'button' ? 'center' : 'flex-start',
    justifyContent: s.textAlign === 'center' ? 'center' : s.textAlign === 'right' ? 'flex-end' : 'flex-start',
    overflow: 'hidden',
    boxSizing: 'border-box',
  }

  const animClass =
    !s.animation || s.animation === 'none'
      ? ''
      : s.animation.startsWith('fx:')
        ? `aria-fx-${s.animation.slice(3)}`
        : `aria-anim-${s.animation}`
  const svgClass = el.kind === 'svg' ? 'aria-svg' : ''

  // Per-element animation tuning, fed to the keyframes via CSS variables.
  if (s.animation !== 'none') {
    Object.assign(inner, {
      '--aria-anim-dur': `${s.animDuration}s`,
      '--aria-anim-amt': s.animIntensity,
      '--aria-glow': s.glowColor,
    } as React.CSSProperties)
  }

  const content =
    el.kind === 'image' ? (
      <img src={el.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} draggable={false} />
    ) : el.kind === 'svg' ? (
      <div style={{ width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: el.content }} />
    ) : (
      el.content
    )

  return (
    <div
      id={`el-${el.id}`}
      style={outer}
      onPointerDown={(e) => {
        if (preview || editing) return
        e.stopPropagation()
        onSelect(el.id)
        if (canEdit) onStartMove(e, el, geo)
      }}
      onClick={(e) => {
        if (preview && hasHook) { e.stopPropagation(); onActivate(el) }
      }}
      onDoubleClick={(e) => {
        if (preview || !isTextKind || !canEdit) return
        e.stopPropagation()
        setEditing(true)
      }}
      className={!preview && selected && !editing ? 'outline-2 outline-aria-brand' : undefined}
    >
      <div
        ref={editRef}
        style={{ ...inner, cursor: editing ? 'text' : inner.cursor, outline: editing ? '2px solid #7c5cff' : undefined }}
        className={`${animClass} ${svgClass}`.trim() || undefined}
        contentEditable={editing}
        suppressContentEditableWarning
        onPointerDown={(e) => { if (editing) e.stopPropagation() }}
        onInput={() => { if (editing) onEditContent(el.id, editRef.current?.innerText ?? '') }}
        onBlur={() => {
          if (!editing) return
          onEditContent(el.id, (editRef.current?.innerText ?? '').trim())
          setEditing(false)
        }}
        onKeyDown={(e) => {
          if (editing && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur() }
          if (editing && e.key === 'Escape') { e.preventDefault(); setEditing(false) }
        }}
      >
        {editing ? null : content}
      </div>

      {!preview && selected && canEdit && !editing &&
        HANDLES.map((h) => {
          const pos: React.CSSProperties = { position: 'absolute' }
          if (h.includes('n')) pos.top = -5
          if (h.includes('s')) pos.bottom = -5
          if (h.includes('w')) pos.left = -5
          if (h.includes('e')) pos.right = -5
          if (h === 'n' || h === 's') { pos.left = '50%'; pos.marginLeft = -5 }
          if (h === 'e' || h === 'w') { pos.top = '50%'; pos.marginTop = -5 }
          const cursor =
            h === 'n' || h === 's' ? 'ns-resize' :
            h === 'e' || h === 'w' ? 'ew-resize' :
            h === 'nw' || h === 'se' ? 'nwse-resize' : 'nesw-resize'
          return (
            <div
              key={h}
              onPointerDown={(e) => { e.stopPropagation(); onStartResize(e, h, el, geo) }}
              style={{ ...pos, width: 10, height: 10, background: '#fff', border: '1.5px solid #7c5cff', borderRadius: 3, cursor, transform: `rotate(${-el.rotation}deg)` }}
            />
          )
        })}
    </div>
  )
}

export default function CanvasEditor() {
  const {
    page, pages, currentPageId, elements, selectedId,
    addElement, addSvg, updateElement, select, removeElement, duplicateElement,
    clear, loadStarter, undo, redo,
    addPage, removePage, renamePage, setCurrentPage,
    device, autoAdaptive, setDevice, setAutoAdaptive, setGeo,
  } = useCanvasStore()
  const [preview, setPreview] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [showLinkMap, setShowLinkMap] = useState(false)
  const makerOpen = useEffectsStore((s) => s.makerOpen)
  const customEffects = useEffectsStore((s) => s.customEffects)
  const drag = useRef<DragState>(null)
  const svgInput = useRef<HTMLInputElement>(null)

  // Read an uploaded .svg file's text and drop it on the canvas as vector art.
  const onSvgFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result || '')
      if (text.includes('<svg')) addSvg(text, file.name.replace(/\.svg$/i, ''))
      else alert('That file does not look like an SVG.')
    }
    reader.readAsText(file)
    e.target.value = '' // allow re-uploading the same file
  }

  const pageElements = elements.filter((e) => e.pageId === currentPageId)
  const selected = elements.find((e) => e.id === selectedId) ?? null

  // Auto-adaptive reflow map for the current (non-desktop) device.
  const autoMap =
    autoAdaptive && device !== 'desktop' ? autoLayout(pageElements, device, page.width) : null

  // Current device frame + whether elements are hand-editable on this device.
  const baseFrame = device === 'desktop' ? { width: page.width, height: page.height } : DEVICE_FRAMES[device]
  const frame = autoMap
    ? { width: baseFrame.width, height: Math.max(baseFrame.height, autoLayoutHeight(autoMap)) }
    : baseFrame
  const geoEditable = !(autoAdaptive && device !== 'desktop')
  const geoFor = (el: CanvasElement): EffGeo =>
    autoMap?.[el.id] ?? effectiveGeo(el, device, false, page.width)

  useEffect(() => {
    if (elements.length === 0) loadStarter()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = drag.current
      if (!d) return
      if (d.mode === 'move') {
        setGeo(d.id, { x: d.origX + (e.clientX - d.startX), y: d.origY + (e.clientY - d.startY) })
      } else {
        const dx = e.clientX - d.startX
        const dy = e.clientY - d.startY
        const o = d.orig
        let { x, y, width, height } = o
        if (d.handle.includes('e')) width = Math.max(12, o.width + dx)
        if (d.handle.includes('s')) height = Math.max(12, o.height + dy)
        if (d.handle.includes('w')) { width = Math.max(12, o.width - dx); x = o.x + (o.width - width) }
        if (d.handle.includes('n')) { height = Math.max(12, o.height - dy); y = o.y + (o.height - height) }
        setGeo(d.id, { x, y, width, height })
      }
    }
    const onUp = () => { drag.current = null }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [setGeo])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return }
      if (mod && e.key.toLowerCase() === 'd' && selectedId) { e.preventDefault(); duplicateElement(selectedId); return }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) { e.preventDefault(); removeElement(selectedId); return }
      if (selectedId && geoEditable && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        const el = elements.find((x) => x.id === selectedId)
        if (!el) return
        const g = geoFor(el)
        const step = e.shiftKey ? 10 : 1
        setGeo(selectedId, {
          x: g.x + (e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0),
          y: g.y + (e.key === 'ArrowDown' ? step : e.key === 'ArrowUp' ? -step : 0),
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, elements, undo, redo, duplicateElement, removeElement, setGeo, geoEditable, device, autoAdaptive])

  const startMove = (e: React.PointerEvent, _el: CanvasElement, geo: EffGeo) => {
    drag.current = { mode: 'move', id: _el.id, startX: e.clientX, startY: e.clientY, origX: geo.x, origY: geo.y }
  }
  const startResize = (e: React.PointerEvent, handle: string, _el: CanvasElement, geo: EffGeo) => {
    drag.current = { mode: 'resize', id: _el.id, handle, startX: e.clientX, startY: e.clientY, orig: { ...geo } }
  }

  // Switch which device we're viewing/editing (frame size derives from it).
  const applyDevice = (d: (typeof DEVICES)[number]) => setDevice(d.id)

  // Export the whole design to a downloadable Vite + React project.
  const exportZip = async () => {
    const design: ExportDesign = {
      name: 'Aria Site',
      frame: page,
      pages,
      elements,
      effects: customEffects,
      autoAdaptive,
    }
    const zip = new JSZip()
    for (const [path, contents] of Object.entries(exportSite(design))) zip.file(path, contents)
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'aria-site.zip'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Run an element's user-defined hook while previewing.
  const activate = (el: CanvasElement) => {
    const a = el.action
    if (a.type === 'url' && a.target) {
      window.open(a.target, '_blank', 'noopener')
    } else if (a.type === 'page') {
      setCurrentPage(a.target)
    } else if (a.type === 'element') {
      const target = elements.find((e) => e.id === a.target)
      if (!target) return
      if (target.pageId !== currentPageId) setCurrentPage(target.pageId)
      setTimeout(() => {
        const node = document.getElementById(`el-${target.id}`)
        node?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        node?.animate(
          [{ boxShadow: '0 0 0 0 rgba(124,92,255,0.9)' }, { boxShadow: '0 0 0 12px rgba(124,92,255,0)' }],
          { duration: 700 },
        )
      }, 40)
    }
  }

  return (
    <div className="flex h-full flex-col bg-aria-bg">
      {/* Top bar */}
      <div className="flex h-12 items-center justify-between border-b border-aria-border px-3">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-aria-muted hover:bg-aria-panel hover:text-aria-text">
            <Home size={16} /> Aria
          </Link>
          <span className="h-5 w-px bg-aria-border" />
          <button onClick={undo} title="Undo (⌘Z)" className="rounded-lg p-2 text-aria-muted hover:bg-aria-panel hover:text-aria-text"><Undo2 size={16} /></button>
          <button onClick={redo} title="Redo (⌘⇧Z)" className="rounded-lg p-2 text-aria-muted hover:bg-aria-panel hover:text-aria-text"><Redo2 size={16} /></button>
          <button onClick={() => setShowGrid((g) => !g)} title="Toggle grid" className={`rounded-lg p-2 hover:bg-aria-panel ${showGrid ? 'text-aria-brand-2' : 'text-aria-muted'}`}><Grid3x3 size={16} /></button>
        </div>

        <div className="flex items-center gap-0.5 rounded-lg border border-aria-border bg-aria-panel p-0.5">
          {DEVICES.map((d) => (
            <button
              key={d.id}
              onClick={() => applyDevice(d)}
              title={d.label}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition ${
                device === d.id ? 'bg-aria-panel-2 text-aria-text' : 'text-aria-muted hover:text-aria-text'
              }`}
            >
              <d.icon size={16} />
              <span className="hidden sm:inline">{d.label}</span>
            </button>
          ))}
          <span className="mx-0.5 h-4 w-px bg-aria-border" />
          <button
            onClick={() => setAutoAdaptive(!autoAdaptive)}
            title="Auto-adaptive: mirror the desktop layout onto smaller screens, scaled to fit"
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition ${
              autoAdaptive ? 'bg-aria-brand/20 text-aria-brand-2' : 'text-aria-muted hover:text-aria-text'
            }`}
          >
            <Wand2 size={15} />
            <span className="hidden sm:inline">Auto</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {!preview && (
            <>
              <button onClick={() => setShowLinkMap(true)} className="flex items-center gap-1.5 rounded-lg border border-aria-border px-3 py-1.5 text-sm text-aria-muted hover:text-aria-text">
                <Link2 size={15} /> Link Map
              </button>
              <button onClick={loadStarter} className="flex items-center gap-1.5 rounded-lg border border-aria-border px-3 py-1.5 text-sm text-aria-muted hover:text-aria-text"><Sparkles size={15} /> Starter</button>
              <button onClick={exportZip} title="Export a Vite + React project" className="flex items-center gap-1.5 rounded-lg border border-aria-border px-3 py-1.5 text-sm text-aria-muted hover:text-aria-text"><Download size={15} /> Export code</button>
              <button onClick={clear} title="Clear this page" className="rounded-lg p-2 text-aria-muted hover:bg-red-500/10 hover:text-red-400"><Trash2 size={16} /></button>
            </>
          )}
          <button onClick={() => { setPreview((p) => !p); select(null) }} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${preview ? 'bg-aria-brand-2 text-black' : 'bg-gradient-to-r from-aria-brand to-aria-brand-2 text-white'}`}>
            <Eye size={15} /> {preview ? 'Editing off' : 'Preview'}
          </button>
        </div>
      </div>

      {/* Page tabs */}
      <div className="flex h-10 items-center gap-1 border-b border-aria-border bg-aria-panel px-3">
        {pages.map((p) => (
          <div
            key={p.id}
            className={`group flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm transition ${
              p.id === currentPageId ? 'bg-aria-panel-2 text-aria-text' : 'text-aria-muted hover:text-aria-text'
            }`}
          >
            <button
              onClick={() => setCurrentPage(p.id)}
              onDoubleClick={() => { const n = prompt('Rename page', p.name); if (n) renamePage(p.id, n) }}
              className="font-medium"
            >
              {p.name}
            </button>
            {!preview && pages.length > 1 && p.id === currentPageId && (
              <button onClick={() => removePage(p.id)} title="Delete page" className="rounded p-0.5 text-aria-muted hover:text-red-400">
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        {!preview && (
          <>
            <button onClick={addPage} title="Add page" className="ml-1 flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-aria-muted hover:bg-aria-panel-2 hover:text-aria-text">
              <Plus size={14} /> Page
            </button>
            <span className="ml-auto text-xs text-aria-muted">Double-click a tab to rename</span>
          </>
        )}
      </div>

      <div className="flex min-h-0 flex-1">
        {!preview && (
          <aside className="w-16 shrink-0 border-r border-aria-border bg-aria-panel py-3">
            <div className="flex flex-col items-center gap-1">
              {palette.map(({ kind, label, icon: Icon }) => (
                <button
                  key={kind}
                  title={`Add ${label}`}
                  onClick={() => addElement(kind)}
                  className="group flex w-14 flex-col items-center gap-1 rounded-lg py-2 text-aria-muted transition hover:bg-aria-panel-2 hover:text-aria-text"
                >
                  <Icon size={18} />
                  <span className="text-[10px]">{label}</span>
                </button>
              ))}
              <div className="my-1 h-px w-8 bg-aria-border" />
              <button
                title="Upload your own SVG (from Illustrator, Figma…)"
                onClick={() => svgInput.current?.click()}
                className="group flex w-14 flex-col items-center gap-1 rounded-lg py-2 text-aria-brand-2 transition hover:bg-aria-panel-2"
              >
                <Upload size={18} />
                <span className="text-[10px]">SVG</span>
              </button>
              <input ref={svgInput} type="file" accept=".svg,image/svg+xml" onChange={onSvgFile} className="hidden" />
            </div>
          </aside>
        )}

        <div
          className={`min-w-0 flex-1 overflow-auto p-10 ${showGrid && !preview ? 'aria-grid-bg' : ''}`}
          onPointerDown={() => select(null)}
        >
          <div className="grid min-h-full place-items-center">
            {(() => {
              const phone = device === 'mobile'
              const frameEl = (
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{
                    width: frame.width, height: frame.height, background: page.background,
                    position: 'relative', borderRadius: phone ? 36 : 6,
                    boxShadow: phone ? 'none' : '0 20px 60px -20px rgba(0,0,0,0.6)',
                    outline: preview ? 'none' : '1px solid #2a2a37', overflow: 'hidden',
                  }}
                >
                  {pageElements.map((el) => (
                    <ElementView
                      key={el.id}
                      el={el}
                      geo={geoFor(el)}
                      editable={geoEditable}
                      selected={el.id === selectedId}
                      preview={preview}
                      onSelect={select}
                      onStartMove={startMove}
                      onStartResize={startResize}
                      onEditContent={(id, content) => updateElement(id, { content })}
                      onActivate={activate}
                    />
                  ))}
                </div>
              )

              // Wrap the mobile artboard in a phone bezel with a notch.
              if (phone) {
                return (
                  <div
                    style={{
                      padding: 12, borderRadius: 52, background: '#0b0b0f',
                      border: '2px solid #2a2a37', position: 'relative',
                      boxShadow: '0 30px 80px -20px rgba(0,0,0,0.75)',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
                        width: 130, height: 26, background: '#0b0b0f', borderRadius: 16, zIndex: 5,
                      }}
                    />
                    {frameEl}
                  </div>
                )
              }
              return frameEl
            })()}
          </div>
        </div>

        {!preview && (
          <aside className="w-72 shrink-0 border-l border-aria-border bg-aria-panel">
            <Inspector element={selected} />
          </aside>
        )}
      </div>

      {showLinkMap && <LinkMap onClose={() => setShowLinkMap(false)} />}
      {makerOpen && <EffectMaker />}
    </div>
  )
}
