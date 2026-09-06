import { useState } from 'react'
import {
  MousePointerClick, Move, Palette, Link2, Smartphone, Rocket, X, ArrowRight, ArrowLeft, Wand2,
} from 'lucide-react'
import Dialog from '../Dialog'

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
    body: 'Tab to an element to select it. Arrow keys nudge; Alt+arrows resize. F2 or Enter edits text. Drag with the mouse, or pull the handles to resize. ⌘Z undoes.',
  },
  {
    icon: Palette,
    title: 'Style & animate',
    body: 'The right panel controls colour, type, radius and more. Give any element one of 8 animations — glow, float, pulse… — with your own colour and speed, or code a brand-new effect in the Effect Maker.',
  },
  {
    icon: Link2,
    title: 'Wire it together',
    body: 'Give a button a hook: go to another page, scroll to an element, or open a URL. Open the Link Map to connect things visually (keyboard: activate a button row, then a target), then hit Preview to tab through it.',
  },
  {
    icon: Smartphone,
    title: 'Pages & devices',
    body: 'Add pages with the tabs up top (F2 to rename), and switch Desktop / Tablet / Mobile. Each device keeps its own layout — or turn on Auto to fit smaller screens automatically.',
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
    <Dialog
      onClose={onClose}
      labelledBy="tutorial-title"
      zClass="z-[70]"
      panelClassName="a-pop-in w-full max-w-md overflow-hidden rounded-2xl border border-aria-border bg-aria-panel shadow-2xl"
    >
      <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-aria-brand to-aria-brand-2">
        <Icon size={44} aria-hidden className="text-white" strokeWidth={1.75} />
        <button
          onClick={onClose}
          aria-label="Skip tutorial"
          title="Skip tutorial"
          className="absolute right-3 top-3 rounded-lg bg-black/25 p-1.5 text-white backdrop-blur hover:bg-black/40"
        >
          <X size={16} aria-hidden />
        </button>
        <span className="absolute left-4 top-3 text-xs font-semibold text-white">{i + 1} / {STEPS.length}</span>
      </div>

      <div className="px-6 py-5">
        <h2 id="tutorial-title" className="text-lg font-bold">{step.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-aria-muted">{step.body}</p>

        <div role="tablist" aria-label="Tutorial steps" className="mt-5 flex items-center justify-center gap-1.5">
          {STEPS.map((s, idx) => (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={idx === i}
              aria-current={idx === i ? 'step' : undefined}
              aria-label={`Step ${idx + 1}: ${s.title}`}
              onClick={() => setI(idx)}
              className={`h-1.5 rounded-full transition-all ${idx === i ? 'w-5 bg-aria-brand' : 'w-1.5 bg-aria-border hover:bg-aria-muted'}`}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={() => (i === 0 ? onClose() : setI(i - 1))}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-aria-muted hover:text-aria-text"
          >
            {i === 0 ? 'Skip' : <><ArrowLeft size={15} aria-hidden /> Back</>}
          </button>
          <button
            onClick={() => (last ? onClose() : setI(i + 1))}
            className="a-cta flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition"
          >
            {last ? 'Start building' : <>Next <ArrowRight size={15} aria-hidden /></>}
          </button>
        </div>
      </div>
    </Dialog>
  )
}
