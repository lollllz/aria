import { Link } from 'react-router-dom'
import { MousePointer2, LayoutTemplate, Store, ArrowRight, Wand2, Code2, Upload } from 'lucide-react'

const pillars = [
  {
    to: '/canvas',
    icon: MousePointer2,
    title: 'Drag-and-drop Canvas',
    body: 'A blank page and total freedom. Drop text, shapes, buttons and images anywhere — like PowerPoint for the web. No code required.',
    accent: 'from-aria-brand to-indigo-500',
  },
  {
    to: '/templates',
    icon: LayoutTemplate,
    title: 'Templates & settings',
    body: 'Start from a business, portfolio, restaurant or landing template and tune it with simple settings. Live for your brand in minutes.',
    accent: 'from-aria-brand-2 to-sky-500',
  },
  {
    to: '/marketplace',
    icon: Store,
    title: 'Open marketplace',
    body: 'Browse and publish CSS themes and full website creations. Designers sell their work; builders launch faster. An open market for the web.',
    accent: 'from-pink-500 to-aria-brand',
  },
]

const audience = [
  { icon: Wand2, label: 'Non-coders', text: 'Drag-and-drop like a graphics app.' },
  { icon: Code2, label: 'Designers', text: 'Upload and sell your CSS creations.' },
  { icon: Upload, label: 'Businesses', text: 'Launch a site without a developer.' },
]

export default function Landing() {
  return (
    <div className="mx-auto max-w-6xl px-6">
      {/* Hero */}
      <section className="flex flex-col items-center pt-20 pb-16 text-center">
        <span className="mb-5 rounded-full border border-aria-border bg-aria-panel px-4 py-1.5 text-xs font-medium text-aria-muted">
          WordPress freedom · design-tool ease · an open market
        </span>
        <h1 className="max-w-3xl bg-gradient-to-br from-white to-aria-muted bg-clip-text text-5xl font-black leading-tight tracking-tight text-transparent sm:text-6xl">
          Build any website by dragging it into place.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-aria-muted">
          Aria is a website builder for everyone — pick a template, tune the settings,
          or design pixel-by-pixel on a blank canvas. Then buy and sell creations in an open marketplace.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/canvas"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-aria-brand to-aria-brand-2 px-6 py-3 text-base font-semibold text-white shadow-xl shadow-aria-brand/25 transition hover:opacity-90"
          >
            Open the canvas <ArrowRight size={18} />
          </Link>
          <Link
            to="/templates"
            className="rounded-xl border border-aria-border bg-aria-panel px-6 py-3 text-base font-semibold text-aria-text transition hover:bg-aria-panel-2"
          >
            Browse templates
          </Link>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-aria-muted">
          {audience.map(({ icon: Icon, label, text }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon size={16} className="text-aria-brand-2" />
              <span className="font-semibold text-aria-text">{label}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section className="grid gap-5 pb-24 sm:grid-cols-3">
        {pillars.map(({ to, icon: Icon, title, body, accent }) => (
          <Link
            key={to}
            to={to}
            className="group relative overflow-hidden rounded-2xl border border-aria-border bg-aria-panel p-6 transition hover:-translate-y-1 hover:border-aria-brand/50"
          >
            <div className={`mb-4 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${accent} text-white`}>
              <Icon size={22} />
            </div>
            <h3 className="mb-2 text-lg font-bold">{title}</h3>
            <p className="text-sm leading-relaxed text-aria-muted">{body}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-aria-brand-2 opacity-0 transition group-hover:opacity-100">
              Explore <ArrowRight size={14} />
            </span>
          </Link>
        ))}
      </section>
    </div>
  )
}
