import { sanitizeSvg, useCanvasStore } from '../../store/canvasStore'
import { useEffectsStore } from '../../store/effectsStore'
import { effectiveGeo } from '../../lib/device'
import { ANIMATIONS, ANIM_DEFAULT_DURATION, type ActionType, type CanvasElement } from '../../types'
import {
  Trash2, Copy, ArrowUp, ArrowDown, Lock, Unlock, AlignLeft, AlignCenter, AlignRight, Zap, Wand2, Plus,
} from 'lucide-react'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-3 py-1.5">
      <span className="w-24 shrink-0 text-xs font-medium text-aria-muted">{label}</span>
      <div className="flex flex-1 items-center justify-end gap-2">{children}</div>
    </label>
  )
}

function Num({ value, onChange, min, max, step = 1, disabled }: {
  value: number; onChange: (n: number) => void; min?: number; max?: number; step?: number; disabled?: boolean
}) {
  return (
    <input
      type="number" value={Math.round(value * 100) / 100} min={min} max={max} step={step} disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-20 rounded-md border border-aria-border bg-aria-panel-2 px-2 py-1 text-right text-sm text-aria-text outline-none focus:border-aria-brand disabled:opacity-40"
    />
  )
}

function Color({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const isGradient = value.includes('gradient')
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={isGradient ? '#7c5cff' : value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-7 cursor-pointer rounded-md border border-aria-border bg-transparent"
      />
      <input
        value={value} onChange={(e) => onChange(e.target.value)}
        className="w-28 rounded-md border border-aria-border bg-aria-panel-2 px-2 py-1 text-xs text-aria-text outline-none focus:border-aria-brand"
      />
    </div>
  )
}

export default function Inspector({ element }: { element: CanvasElement | null }) {
  const {
    updateElement, updateStyle, removeElement, duplicateElement, bringForward, sendBackward,
    page, setPage, setAction, pages, elements, device, autoAdaptive, setGeo,
  } = useCanvasStore()
  const customEffects = useEffectsStore((s) => s.customEffects)
  const openMaker = useEffectsStore((s) => s.openMaker)

  if (!element) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-aria-border px-4 py-3 text-sm font-semibold">Page</div>
        <div className="space-y-1 px-4 py-3">
          <Row label="Width"><Num value={page.width} min={320} max={2000} onChange={(v) => setPage({ width: v })} /></Row>
          <Row label="Height"><Num value={page.height} min={320} max={4000} onChange={(v) => setPage({ height: v })} /></Row>
          <Row label="Background"><Color value={page.background} onChange={(v) => setPage({ background: v })} /></Row>
        </div>
        <div className="mt-auto px-4 py-4 text-xs leading-relaxed text-aria-muted">
          Select an element to edit it, or drag one from the left palette onto the page.
        </div>
      </div>
    )
  }

  const s = element.style
  const showText = ['text', 'heading', 'button'].includes(element.kind)

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex items-center justify-between border-b border-aria-border px-4 py-3">
        <span className="text-sm font-semibold capitalize">{element.name}</span>
        <div className="flex items-center gap-1">
          <button title="Duplicate" onClick={() => duplicateElement(element.id)} className="rounded-md p-1.5 text-aria-muted hover:bg-aria-panel-2 hover:text-aria-text"><Copy size={15} /></button>
          <button title="Bring forward" onClick={() => bringForward(element.id)} className="rounded-md p-1.5 text-aria-muted hover:bg-aria-panel-2 hover:text-aria-text"><ArrowUp size={15} /></button>
          <button title="Send backward" onClick={() => sendBackward(element.id)} className="rounded-md p-1.5 text-aria-muted hover:bg-aria-panel-2 hover:text-aria-text"><ArrowDown size={15} /></button>
          <button title={element.locked ? 'Unlock' : 'Lock'} onClick={() => updateElement(element.id, { locked: !element.locked })} className="rounded-md p-1.5 text-aria-muted hover:bg-aria-panel-2 hover:text-aria-text">
            {element.locked ? <Lock size={15} /> : <Unlock size={15} />}
          </button>
          <button title="Delete" onClick={() => removeElement(element.id)} className="rounded-md p-1.5 text-red-400 hover:bg-red-500/10"><Trash2 size={15} /></button>
        </div>
      </div>

      <div className="space-y-4 px-4 py-3">
        {/* Content */}
        {showText && (
          <section>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-aria-muted">Content</p>
            <textarea
              value={element.content}
              onChange={(e) => updateElement(element.id, { content: e.target.value })}
              rows={2}
              className="w-full resize-y rounded-md border border-aria-border bg-aria-panel-2 px-2 py-1.5 text-sm text-aria-text outline-none focus:border-aria-brand"
            />
          </section>
        )}
        {element.kind === 'image' && (
          <section>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-aria-muted">Image URL</p>
            <input
              value={element.content}
              onChange={(e) => updateElement(element.id, { content: e.target.value })}
              className="w-full rounded-md border border-aria-border bg-aria-panel-2 px-2 py-1.5 text-sm text-aria-text outline-none focus:border-aria-brand"
            />
          </section>
        )}
        {element.kind === 'svg' && (
          <section>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-aria-muted">SVG source</p>
            <textarea
              value={element.content}
              onChange={(e) => updateElement(element.id, { content: sanitizeSvg(e.target.value) })}
              rows={4}
              spellCheck={false}
              className="w-full resize-y rounded-md border border-aria-border bg-aria-panel-2 px-2 py-1.5 font-mono text-[11px] text-aria-text outline-none focus:border-aria-brand"
            />
            <p className="mt-1 text-[11px] leading-relaxed text-aria-muted">
              Paste SVG from Illustrator/Figma, or use the <span className="text-aria-brand-2">SVG</span> tool in the left bar to upload a file. Give it an Interaction hook to turn your art into a button.
            </p>
          </section>
        )}

        {/* Interaction / hook — the user decides what this element does */}
        <section>
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-aria-muted">
            <Zap size={12} /> Interaction
          </p>
          <Row label="On click">
            <select
              value={element.action.type}
              onChange={(e) => {
                const type = e.target.value as ActionType
                // default target for the new type
                const target =
                  type === 'page' ? (pages[0]?.id ?? '') :
                  type === 'element' ? (elements.find((x) => x.id !== element.id)?.id ?? '') :
                  type === 'url' ? 'https://' : ''
                setAction(element.id, { type, target })
              }}
              className="w-40 rounded-md border border-aria-border bg-aria-panel-2 px-2 py-1 text-sm outline-none focus:border-aria-brand"
            >
              <option value="none">Nothing</option>
              <option value="page">Go to page</option>
              <option value="element">Scroll to element</option>
              <option value="url">Open URL</option>
            </select>
          </Row>

          {element.action.type === 'page' && (
            <Row label="Page">
              <select
                value={element.action.target}
                onChange={(e) => setAction(element.id, { type: 'page', target: e.target.value })}
                className="w-40 rounded-md border border-aria-border bg-aria-panel-2 px-2 py-1 text-sm outline-none focus:border-aria-brand"
              >
                {pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Row>
          )}
          {element.action.type === 'element' && (
            <Row label="Target">
              <select
                value={element.action.target}
                onChange={(e) => setAction(element.id, { type: 'element', target: e.target.value })}
                className="w-40 rounded-md border border-aria-border bg-aria-panel-2 px-2 py-1 text-sm outline-none focus:border-aria-brand"
              >
                {elements.filter((x) => x.id !== element.id).map((x) => (
                  <option key={x.id} value={x.id}>{x.name}</option>
                ))}
              </select>
            </Row>
          )}
          {element.action.type === 'url' && (
            <Row label="URL">
              <input
                value={element.action.target}
                onChange={(e) => setAction(element.id, { type: 'url', target: e.target.value })}
                placeholder="https://…"
                className="w-40 rounded-md border border-aria-border bg-aria-panel-2 px-2 py-1 text-sm outline-none focus:border-aria-brand"
              />
            </Row>
          )}
          <p className="mt-1 text-[11px] leading-relaxed text-aria-muted">
            Tip: open the <span className="text-aria-brand-2">Link Map</span> to wire this up visually.
          </p>
        </section>

        {/* Animation — 8 presets any element (esp. buttons) can use */}
        <section>
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-aria-muted">
            <Wand2 size={12} /> Animation
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {ANIMATIONS.map((a) => (
              <button
                key={a.id}
                onClick={() => updateStyle(element.id, { animation: a.id, animDuration: ANIM_DEFAULT_DURATION[a.id] })}
                title={a.hoverOnly ? `${a.label} (on hover)` : a.label}
                className={`rounded-md border px-2 py-1.5 text-xs font-medium transition ${
                  element.style.animation === a.id
                    ? 'border-aria-brand bg-aria-brand/15 text-aria-text'
                    : 'border-aria-border text-aria-muted hover:text-aria-text'
                }`}
              >
                {a.label}
                {a.hoverOnly && <span className="ml-0.5 text-[9px] text-aria-muted">˚</span>}
              </button>
            ))}
            {/* User-made effects */}
            {customEffects.map((fx) => {
              const val = `fx:${fx.id}`
              return (
                <button
                  key={fx.id}
                  onClick={() => updateStyle(element.id, { animation: val })}
                  title={`Custom: ${fx.name}`}
                  className={`truncate rounded-md border px-2 py-1.5 text-xs font-medium transition ${
                    element.style.animation === val
                      ? 'border-aria-brand bg-aria-brand/15 text-aria-text'
                      : 'border-aria-brand/30 text-aria-brand-2 hover:text-aria-text'
                  }`}
                >
                  {fx.name}
                </button>
              )
            })}
            {/* Open the maker */}
            <button
              onClick={openMaker}
              title="Create a custom effect from code"
              className="flex items-center justify-center gap-1 rounded-md border border-dashed border-aria-border px-2 py-1.5 text-xs font-medium text-aria-muted transition hover:border-aria-brand hover:text-aria-text"
            >
              <Plus size={12} /> New
            </button>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-aria-muted">˚ plays on hover · others loop · <span className="text-aria-brand-2">New</span> = code your own</p>

          {/* Per-animation tuning */}
          {s.animation !== 'none' && (
            <div className="mt-2 rounded-lg border border-aria-border bg-aria-panel-2/40 px-2.5 py-1.5">
              {s.animation === 'glow' && (
                <Row label="Glow color"><Color value={s.glowColor} onChange={(v) => updateStyle(element.id, { glowColor: v })} /></Row>
              )}
              <Row label="Speed (s)"><Num value={s.animDuration} min={0.2} max={6} step={0.1} onChange={(v) => updateStyle(element.id, { animDuration: v })} /></Row>
              <Row label="Intensity"><Num value={s.animIntensity} min={0.2} max={3} step={0.1} onChange={(v) => updateStyle(element.id, { animIntensity: v })} /></Row>
            </div>
          )}
        </section>

        {/* Layout — per-device geometry */}
        {(() => {
          const geo = effectiveGeo(element, device, autoAdaptive, page.width)
          const geoEditable = !(autoAdaptive && device !== 'desktop')
          const overridden = device !== 'desktop' && !autoAdaptive && element[device] != null
          return (
            <section>
              <p className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-aria-muted">
                Layout
                <span className="font-normal normal-case text-aria-muted">
                  {device === 'desktop' ? 'desktop' : autoAdaptive ? `${device} · auto` : overridden ? `${device} · custom` : `${device} · from desktop`}
                </span>
              </p>
              <Row label="X"><Num value={geo.x} disabled={!geoEditable} onChange={(v) => setGeo(element.id, { x: v })} /></Row>
              <Row label="Y"><Num value={geo.y} disabled={!geoEditable} onChange={(v) => setGeo(element.id, { y: v })} /></Row>
              <Row label="Width"><Num value={geo.width} min={8} disabled={!geoEditable} onChange={(v) => setGeo(element.id, { width: v })} /></Row>
              <Row label="Height"><Num value={geo.height} min={8} disabled={!geoEditable} onChange={(v) => setGeo(element.id, { height: v })} /></Row>
              <Row label="Rotation"><Num value={element.rotation} min={-180} max={180} onChange={(v) => updateElement(element.id, { rotation: v })} /></Row>
              {device !== 'desktop' && !autoAdaptive && (
                <p className="mt-1 text-[11px] leading-relaxed text-aria-muted">
                  Editing the <span className="text-aria-brand-2">{device}</span> layout only — desktop stays untouched.
                </p>
              )}
              {autoAdaptive && device !== 'desktop' && (
                <p className="mt-1 text-[11px] leading-relaxed text-aria-muted">
                  Auto-adaptive is on — this device mirrors desktop, scaled. Turn off <span className="text-aria-brand-2">Auto</span> to customize.
                </p>
              )}
            </section>
          )
        })()}

        {/* Style */}
        <section>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-aria-muted">Style</p>
          <Row label="Fill"><Color value={s.background} onChange={(v) => updateStyle(element.id, { background: v })} /></Row>
          {showText && <Row label="Text color"><Color value={s.color} onChange={(v) => updateStyle(element.id, { color: v })} /></Row>}
          <Row label="Radius"><Num value={s.radius} min={0} max={999} onChange={(v) => updateStyle(element.id, { radius: v })} /></Row>
          <Row label="Opacity"><Num value={s.opacity} min={0} max={1} step={0.05} onChange={(v) => updateStyle(element.id, { opacity: v })} /></Row>
          <Row label="Border"><Num value={s.borderWidth} min={0} max={40} onChange={(v) => updateStyle(element.id, { borderWidth: v })} /></Row>
          {s.borderWidth > 0 && <Row label="Border color"><Color value={s.borderColor} onChange={(v) => updateStyle(element.id, { borderColor: v })} /></Row>}
          <Row label="Shadow">
            <button
              onClick={() => updateStyle(element.id, { shadow: !s.shadow })}
              className={`h-6 w-11 rounded-full p-0.5 transition ${s.shadow ? 'bg-aria-brand' : 'bg-aria-panel-2'}`}
            >
              <span className={`block h-5 w-5 rounded-full bg-white transition ${s.shadow ? 'translate-x-5' : ''}`} />
            </button>
          </Row>
        </section>

        {/* Typography */}
        {showText && (
          <section>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-aria-muted">Typography</p>
            <Row label="Font size"><Num value={s.fontSize} min={6} max={200} onChange={(v) => updateStyle(element.id, { fontSize: v })} /></Row>
            <Row label="Weight"><Num value={s.fontWeight} min={100} max={900} step={100} onChange={(v) => updateStyle(element.id, { fontWeight: v })} /></Row>
            <Row label="Letter"><Num value={s.letterSpacing} min={-5} max={20} step={0.5} onChange={(v) => updateStyle(element.id, { letterSpacing: v })} /></Row>
            <Row label="Line height"><Num value={s.lineHeight} min={0.8} max={3} step={0.1} onChange={(v) => updateStyle(element.id, { lineHeight: v })} /></Row>
            <Row label="Align">
              <div className="flex items-center gap-1 rounded-md border border-aria-border bg-aria-panel-2 p-0.5">
                {([['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]] as const).map(([a, Icon]) => (
                  <button
                    key={a} onClick={() => updateStyle(element.id, { textAlign: a })}
                    className={`rounded p-1 ${s.textAlign === a ? 'bg-aria-brand text-white' : 'text-aria-muted hover:text-aria-text'}`}
                  >
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </Row>
          </section>
        )}
      </div>
    </div>
  )
}
