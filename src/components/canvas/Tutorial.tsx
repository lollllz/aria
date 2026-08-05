import { useState } from 'react'
import {
  MousePointerClick, Move, Palette, Link2, Smartphone, Rocket, X, ArrowRight, ArrowLeft, Wand2,
} from 'lucide-react'

const STEPS = [
  {
    icon: Rocket,
    title: 'Welcome to Aria',
    body: 'Build a website by dragging pieces onto a blank canvas — like a design tool, no code needed. Here’s a 30-second tour. You can reopen it anytime from the “?” button.',
  },
  {
    icon: MousePointerClick,
    title: 'Add anything',
    body: 'Use the left palette to drop in headings, text, buttons, shapes and images. The last tool lets you upload your own SVG from Illustrator or Figma to use as custom art or buttons.',
  },
  {
    icon: Move,
    title: 'Move, resize, edit',
    body: 'Drag an element anywhere. Select it and pull the handles to resize. Double-click text to edit it right on the canvas. Arrow keys nudge; ⌘Z undoes.',
  },
  {
    icon: Palette,
    title: 'Style & animate',
    body: 'The right panel controls colour, type, radius and more. Give any element one of 8 animations — glow, float, pulse… — with your own colour and speed, or code a brand-new effect in the Effect Maker.',
  },
  {
    icon: Link2,
    title: 'Wire it together',
    body: 'Give a button a hook: go to another page, scroll to an element, or open a URL. Open the Link Map to connect things visually, then hit Preview to click through it.',
  },
  {
    icon: Smartphone,
    title: 'Pages & devices',
    body: 'Add pages with the tabs up top, and switch Desktop / Tablet / Mobile. Each device keeps its own layout — or turn on Auto to fit smaller screens automatically.',
  },
  {
    icon: Wand2,
    title: 'Publish & keep',
    body: 'Your work saves automatically. Hit Preview to try it live, or Export code to download a ready-to-run Vite + React project. That’s it — start building!',
  },
]

export default function Tutorial({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0)
  const step = STEPS[i]
  const Icon = step.icon
  const last = i === STEPS.length - 1

  return (
    <div className="a-fade-in fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="a-pop-in w-full max-w-md overflow-hidden rounded-2xl border border-aria-border bg-aria-panel shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Gradient header with the step icon */}
        <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-aria-brand to-aria-brand-2">
          <Icon size={44} className="text-white" strokeWidth={1.75} />
          <button onClick={onClose} title="Skip tutorial" className="absolute right-3 top-3 rounded-lg bg-black/25 p-1.5 text-white backdrop-blur hover:bg-black/40">
            <X size={16} />
          </button>
          <span className="absolute left-4 top-3 text-xs font-semibold text-white/80">{i + 1} / {STEPS.length}</span>
        </div>

        <div className="px-6 py-5">
          <h2 className="text-lg font-bold">{step.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-aria-muted">{step.body}</p>

          {/* Progress dots */}
          <div className="mt-5 flex items-center justify-center gap-1.5">
            {STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                className={`h-1.5 rounded-full transition-all ${idx === i ? 'w-5 bg-aria-brand' : 'w-1.5 bg-aria-border hover:bg-aria-muted'}`}
                aria-label={`Step ${idx + 1}`}
              />
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              onClick={() => (i === 0 ? onClose() : setI(i - 1))}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-aria-muted hover:text-aria-text"
            >
              {i === 0 ? 'Skip' : <><ArrowLeft size={15} /> Back</>}
            </button>
            <button
              onClick={() => (last ? onClose() : setI(i + 1))}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-aria-brand to-aria-brand-2 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {last ? 'Start building' : <>Next <ArrowRight size={15} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
