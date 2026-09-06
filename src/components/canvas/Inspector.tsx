import { useId } from 'react'
import { sanitizeSvg, useCanvasStore } from '../../store/canvasStore'
import { useEffectsStore } from '../../store/effectsStore'
import { effectiveGeo } from '../../lib/device'
import { ANIMATIONS, ANIM_DEFAULT_DURATION, type ActionType, type CanvasElement } from '../../types'
import {
  Trash2, Copy, ArrowUp, ArrowDown, Lock, Unlock, AlignLeft, AlignCenter, AlignRight, Zap, Wand2, Plus,
} from 'lucide-react'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="w-24 shrink-0 text-xs font-medium text-aria-muted">{label}</span>
      <div className="flex flex-1 items-center justify-end gap-2">{children}</div>
    </div>
  )
}

function Num({ value, onChange, min, max, step = 1, disabled, label }: {
  value: number; onChange: (n: number) => void; min?: number; max?: number; step?: number; disabled?: boolean; label: string
}) {
  return (
    <input
      type="number" aria-label={label} value={Math.round(value * 100) / 100} min={min} max={max} step={step} disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-20 rounded-md border border-aria-border bg-aria-panel-2 px-2 py-1 text-right text-sm text-aria-text focus:border-aria-brand disabled:opacity-40"
    />
  )
}

function Color({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const isGradient = value.includes('gradient')
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        aria-label={`${label} picker`}
        value={isGradient ? '#7c5cff' : value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-7 cursor-pointer rounded-md border border-aria-border bg-transparent"
      />
      <input
        aria-label={`${label} value`}
        value={value} onChange={(e) => onChange(e.target.value)}
        className="w-28 rounded-md border border-aria-border bg-aria-panel-2 px-2 py-1 text-xs text-aria-text focus:border-aria-brand"
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
  const contentId = useId()
  const imageUrlId = useId()
  const svgId = useId()
  const altId = useId()

  if (!element) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-aria-border px-4 py-3 text-sm font-semibold">Page</div>
        <div className="space-y-1 px-4 py-3">
          <Row label="Width"><Num label="Width" value={page.width} min={320} max={2000} onChange={(v) => setPage({ width: v })} /></Row>
          <Row label="Height"><Num label="Height" value={page.height} min={320} max={4000} onChange={(v) => setPage({ height: v })} /></Row>
          <Row label="Background"><Color label="Background" value={page.background} onChange={(v) => setPage({ background: v })} /></Row>
        </div>
        <div className="mt-auto px-4 py-4 text-xs leading-relaxed text-aria-muted">
          Select an element to edit it, or add one from the left palette. Tab to an element, then use arrow keys to nudge and Alt+arrows to resize.
        </div>
      </div>
    )
  }

  const s = element.style
  const showText = ['text', 'heading', 'button'].includes(element.kind)
  const animValue = element.style.animation

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex items-center justify-between border-b border-aria-border px-4 py-3">
        <span className="text-sm font-semibold capitalize">{element.name}</span>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Duplicate" title="Duplicate" onClick={() => duplicateElement(element.id)} className="rounded-md p-1.5 text-aria-muted hover:bg-aria-panel-2 hover:text-aria-text"><Copy size={15} aria-hidden /></button>
          <button type="button" aria-label="Bring forward" title="Bring forward" onClick={() => bringForward(element.id)} className="rounded-md p-1.5 text-aria-muted hover:bg-aria-panel-2 hover:text-aria-text"><ArrowUp size={15} aria-hidden /></button>
          <button type="button" aria-label="Send backward" title="Send backward" onClick={() => sendBackward(element.id)} className="rounded-md p-1.5 text-aria-muted hover:bg-aria-panel-2 hover:text-aria-text"><ArrowDown size={15} aria-hidden /></button>
          <button type="button" aria-label={element.locked ? 'Unlock' : 'Lock'} title={element.locked ? 'Unlock' : 'Lock'} onClick={() => updateElement(element.id, { locked: !element.locked })} className="rounded-md p-1.5 text-aria-muted hover:bg-aria-panel-2 hover:text-aria-text">
            {element.locked ? <Lock size={15} aria-hidden /> : <Unlock size={15} aria-hidden />}
          </button>
          <button type="button" aria-label="Delete" title="Delete" onClick={() => removeElement(element.id)} className="rounded-md p-1.5 text-red-400 hover:bg-red-500/10"><Trash2 size={15} aria-hidden /></button>
        </div>
      </div>

      <div className="space-y-4 px-4 py-3">
        {showText && (
          <section>
            <label htmlFor={contentId} className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-aria-muted">Content</label>
            <textarea
              id={contentId}
              value={element.content}
              onChange={(e) => updateElement(element.id, { content: e.target.value })}
              rows={2}
              className="w-full resize-y rounded-md border border-aria-border bg-aria-panel-2 px-2 py-1.5 text-sm text-aria-text focus:border-aria-brand"
            />
          </section>
        )}
        {element.kind === 'image' && (
          <section>
            <label htmlFor={imageUrlId} className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-aria-muted">Image URL</label>
            <input
              id={imageUrlId}
              value={element.content}
              onChange={(e) => updateElement(element.id, { content: e.target.value })}
              className="w-full rounded-md border border-aria-border bg-aria-panel-2 px-2 py-1.5 text-sm text-aria-text focus:border-aria-brand"
            />
            <label htmlFor={altId} className="mt-2 mb-1 block text-[11px] font-semibold uppercase tracking-wider text-aria-muted">Alt text</label>
            <input
              id={altId}
              value={element.alt ?? ''}
              onChange={(e) => updateElement(element.id, { alt: e.target.value })}
              placeholder={element.name}
              className="w-full rounded-md border border-aria-border bg-aria-panel-2 px-2 py-1.5 text-sm text-aria-text focus:border-aria-brand"
            />
          </section>
        )}
        {element.kind === 'svg' && (
          <section>
            <label htmlFor={svgId} className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-aria-muted">SVG source</label>
            <textarea
              id={svgId}
              value={element.content}
              onChange={(e) => updateElement(element.id, { content: sanitizeSvg(e.target.value) })}
              rows={4}
              spellCheck={false}
              className="w-full resize-y rounded-md border border-aria-border bg-aria-panel-2 px-2 py-1.5 font-mono text-[11px] text-aria-text focus:border-aria-brand"
            />
            <p className="mt-1 text-[11px] leading-relaxed text-aria-muted">
              Paste SVG from Illustrator/Figma, or use the <span className="text-aria-brand-2">SVG</span> tool in the left bar to upload a file. Give it an Interaction hook to turn your art into a button.
            </p>
          </section>
        )}

        <section>
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-aria-muted">
            <Zap size={12} aria-hidden /> Interaction
          </p>
          <Row label="On click">
            <select
              aria-label="On click"
              value={element.action.type}
              onChange={(e) => {
                const type = e.target.value as ActionType
                const target =
                  type === 'page' ? (pages[0]?.id ?? '') :
                  type === 'element' ? (elements.find((x) => x.id !== element.id)?.id ?? '') :
                  type === 'url' ? 'https://' : ''
                setAction(element.id, { type, target })
              }}
              className="w-40 rounded-md border border-aria-border bg-aria-panel-2 px-2 py-1 text-sm focus:border-aria-brand"
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
                aria-label="Target page"
                value={element.action.target}
                onChange={(e) => setAction(element.id, { type: 'page', target: e.target.value })}
                className="w-40 rounded-md border border-aria-border bg-aria-panel-2 px-2 py-1 text-sm focus:border-aria-brand"
              >
                {pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Row>
          )}
          {element.action.type === 'element' && (
            <Row label="Target">
              <select
                aria-label="Target element"
                value={element.action.target}
                onChange={(e) => setAction(element.id, { type: 'element', target: e.target.value })}
                className="w-40 rounded-md border border-aria-border bg-aria-panel-2 px-2 py-1 text-sm focus:border-aria-brand"
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
                aria-label="URL"
                value={element.action.target}
                onChange={(e) => setAction(element.id, { type: 'url', target: e.target.value })}
                placeholder="https://…"
                className="w-40 rounded-md border border-aria-border bg-aria-panel-2 px-2 py-1 text-sm focus:border-aria-brand"
              />
            </Row>
          )}
          <p className="mt-1 text-[11px] leading-relaxed text-aria-muted">
            Tip: open the <span className="text-aria-brand-2">Link Map</span> to wire this up visually.
          </p>
        </section>

        <section>
          <p id="anim-label" className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-aria-muted">
            <Wand2 size={12} aria-hidden /> Animation
          </p>
          <div className="grid grid-cols-3 gap-1.5">
          <div role="radiogroup" aria-labelledby="anim-label" className="contents">
            {ANIMATIONS.map((a) => (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={animValue === a.id}
                onClick={() => updateStyle(element.id, { animation: a.id, animDuration: ANIM_DEFAULT_DURATION[a.id] })}
                title={a.hoverOnly ? `${a.label} (on hover)` : a.label}
                className={`rounded-md border px-2 py-1.5 text-xs font-medium transition ${
                  animValue === a.id
                    ? 'border-aria-brand bg-aria-brand/15 text-aria-text'
                    : 'border-aria-border text-aria-muted hover:text-aria-text'
                }`}
              >
                {a.label}
                {a.hoverOnly && <span className="ml-0.5 text-[9px] text-aria-muted">˚</span>}
              </button>
            ))}
            {customEffects.map((fx) => {
              const val = `fx:${fx.id}`
              return (
                <button
                  key={fx.id}
                  type="button"
                  role="radio"
                  aria-checked={animValue === val}
                  onClick={() => updateStyle(element.id, { animation: val })}
                  title={`Custom: ${fx.name}`}
                  className={`truncate rounded-md border px-2 py-1.5 text-xs font-medium transition ${
                    animValue === val
                      ? 'border-aria-brand bg-aria-brand/15 text-aria-text'
                      : 'border-aria-brand/30 text-aria-brand-2 hover:text-aria-text'
                  }`}
                >
                  {fx.name}
                </button>
              )
            })}
          </div>
            <button
              type="button"
              onClick={openMaker}
              title="Create a custom effect from code"
              className="flex items-center justify-center gap-1 rounded-md border border-dashed border-aria-border px-2 py-1.5 text-xs font-medium text-aria-muted transition hover:border-aria-brand hover:text-aria-text"
            >
              <Plus size={12} aria-hidden /> New
            </button>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-aria-muted">˚ plays on hover · others loop · <span className="text-aria-brand-2">New</span> = code your own</p>

          {s.animation !== 'none' && (
            <div className="mt-2 rounded-lg border border-aria-border bg-aria-panel-2/40 px-2.5 py-1.5">
              {s.animation === 'glow' && (
                <Row label="Glow color"><Color label="Glow color" value={s.glowColor} onChange={(v) => updateStyle(element.id, { glowColor: v })} /></Row>
              )}
              <Row label="Speed (s)"><Num label="Speed in seconds" value={s.animDuration} min={0.2} max={6} step={0.1} onChange={(v) => updateStyle(element.id, { animDuration: v })} /></Row>
              <Row label="Intensity"><Num label="Intensity" value={s.animIntensity} min={0.2} max={3} step={0.1} onChange={(v) => updateStyle(element.id, { animIntensity: v })} /></Row>
            </div>
          )}
        </section>

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
              <Row label="X"><Num label="X" value={geo.x} disabled={!geoEditable} onChange={(v) => setGeo(element.id, { x: v })} /></Row>
              <Row label="Y"><Num label="Y" value={geo.y} disabled={!geoEditable} onChange={(v) => setGeo(element.id, { y: v })} /></Row>
              <Row label="Width"><Num label="Width" value={geo.width} min={8} disabled={!geoEditable} onChange={(v) => setGeo(element.id, { width: v })} /></Row>
              <Row label="Height"><Num label="Height" value={geo.height} min={8} disabled={!geoEditable} onChange={(v) => setGeo(element.id, { height: v })} /></Row>
              <Row label="Rotation"><Num label="Rotation" value={element.rotation} min={-180} max={180} onChange={(v) => updateElement(element.id, { rotation: v })} /></Row>
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

        <section>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-aria-muted">Style</p>
          <Row label="Fill"><Color label="Fill" value={s.background} onChange={(v) => updateStyle(element.id, { background: v })} /></Row>
          {showText && <Row label="Text color"><Color label="Text color" value={s.color} onChange={(v) => updateStyle(element.id, { color: v })} /></Row>}
          <Row label="Radius"><Num label="Radius" value={s.radius} min={0} max={999} onChange={(v) => updateStyle(element.id, { radius: v })} /></Row>
          <Row label="Opacity"><Num label="Opacity" value={s.opacity} min={0} max={1} step={0.05} onChange={(v) => updateStyle(element.id, { opacity: v })} /></Row>
          <Row label="Border"><Num label="Border width" value={s.borderWidth} min={0} max={40} onChange={(v) => updateStyle(element.id, { borderWidth: v })} /></Row>
          {s.borderWidth > 0 && <Row label="Border color"><Color label="Border color" value={s.borderColor} onChange={(v) => updateStyle(element.id, { borderColor: v })} /></Row>}
          <Row label="Shadow">
            <button
              type="button"
              role="switch"
              aria-checked={s.shadow}
              aria-label="Shadow"
              onClick={() => updateStyle(element.id, { shadow: !s.shadow })}
              className={`h-6 w-11 rounded-full p-0.5 transition ${s.shadow ? 'bg-aria-brand' : 'bg-aria-panel-2'}`}
            >
              <span className={`block h-5 w-5 rounded-full bg-white transition ${s.shadow ? 'translate-x-5' : ''}`} />
            </button>
          </Row>
        </section>

        {showText && (
          <section>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-aria-muted">Typography</p>
            <Row label="Font size"><Num label="Font size" value={s.fontSize} min={6} max={200} onChange={(v) => updateStyle(element.id, { fontSize: v })} /></Row>
            <Row label="Weight"><Num label="Weight" value={s.fontWeight} min={100} max={900} step={100} onChange={(v) => updateStyle(element.id, { fontWeight: v })} /></Row>
            <Row label="Letter"><Num label="Letter spacing" value={s.letterSpacing} min={-5} max={20} step={0.5} onChange={(v) => updateStyle(element.id, { letterSpacing: v })} /></Row>
            <Row label="Line height"><Num label="Line height" value={s.lineHeight} min={0.8} max={3} step={0.1} onChange={(v) => updateStyle(element.id, { lineHeight: v })} /></Row>
            <Row label="Align">
              <div role="radiogroup" aria-label="Text align" className="flex items-center gap-1 rounded-md border border-aria-border bg-aria-panel-2 p-0.5">
                {([['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]] as const).map(([a, Icon]) => (
                  <button
                    key={a}
                    type="button"
                    role="radio"
                    aria-checked={s.textAlign === a}
                    aria-label={a}
                    onClick={() => updateStyle(element.id, { textAlign: a })}
                    className={`rounded p-1 ${s.textAlign === a ? 'bg-aria-brand text-white' : 'text-aria-muted hover:text-aria-text'}`}
                  >
                    <Icon size={14} aria-hidden />
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
