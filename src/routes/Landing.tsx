import { Link } from 'react-router-dom'
import {
  MousePointer2, LayoutTemplate, Store, ArrowRight, Wand2, Code2, Upload,
  Sparkles, Smartphone, Link2, Download, Zap,
} from 'lucide-react'
import { useReveal } from '../lib/useReveal'

const pillars = [
  {
    to: '/canvas',
    icon: MousePointer2,
    title: 'Drag-and-drop Canvas',
    body: 'A blank page and total freedom. Drop text, shapes, buttons and images anywhere — like a design tool for the web. No code required.',
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
    body: 'Browse and publish CSS themes and full website creations. Everything is free to use, remix and share. An open market for the web.',
    accent: 'from-pink-500 to-aria-brand',
  },
]

const audience = [
  { icon: Wand2, label: 'Non-coders', text: 'Drag-and-drop like a graphics app.' },
  { icon: Code2, label: 'Designers', text: 'Upload and share your CSS creations.' },
  { icon: Upload, label: 'Businesses', text: 'Launch a site without a developer.' },
]

const features = [
  { icon: Sparkles, title: 'Motion built in', body: 'Eight animation presets plus a code editor for your own effects — with custom colour, speed and intensity.' },
  { icon: Smartphone, title: 'Every screen', body: 'Design desktop, tablet and mobile independently, or let auto-adapt reflow the layout for you.' },
  { icon: Link2, title: 'Real interactions', body: 'Wire buttons to pages, elements or URLs, then map the whole flow visually and click through it live.' },
  { icon: Download, title: 'Own your code', body: 'Export a ready-to-run Vite + React project at any time. No lock-in — it is your site.' },
  { icon: Zap, title: 'Saves as you go', body: 'Your work persists automatically, so a refresh never costs you a thing.' },
  { icon: Store, title: 'Share anything', body: 'Publish templates, themes and effects to the marketplace for anyone to install in one click.' },
]

export default function Landing() {
  useReveal()

  return (
    <div className="relative overflow-hidden">
      {/* Ambient background glow (Apple-style depth) */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px]">
        <div className="a-drift absolute left-1/2 top-[-220px] h-[560px] w-[860px] -translate-x-1/2 rounded-full bg-aria-brand/22 blur-[130px]" />
        <div className="a-drift absolute left-[16%] top-[60px] h-[360px] w-[420px] rounded-full bg-aria-brand-2/14 blur-[120px] [animation-delay:-5s]" />
        <div className="a-drift absolute right-[12%] top-[10px] h-[340px] w-[380px] rounded-full bg-pink-500/12 blur-[120px] [animation-delay:-9s]" />
      </div>

      <div className="mx-auto max-w-6xl px-6">
        {/* Hero */}
        <section className="flex flex-col items-center pt-24 pb-20 text-center">
          <span className="a-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-aria-border bg-aria-panel/70 px-4 py-1.5 text-xs font-medium text-aria-muted backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aria-brand-2 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-aria-brand-2" />
            </span>
            WordPress freedom · design-tool ease · an open market
          </span>

          <h1 className="a-fade-up a-d1 max-w-3xl text-[clamp(2.6rem,7vw,4.5rem)] font-bold leading-[1.05] tracking-tight">
            <span className="a-gradient-text">Build any website</span>
            <br />
            by dragging it into place.
          </h1>

          <p className="a-fade-up a-d2 mt-7 max-w-xl text-lg leading-relaxed text-aria-muted">
            Aria is a website builder for everyone — pick a template, tune the settings,
            or design pixel-by-pixel on a blank canvas. Then share your creations in an open marketplace.
          </p>

          <div className="a-fade-up a-d3 mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/canvas"
              className="a-cta group flex items-center gap-2 rounded-2xl px-7 py-3.5 text-base font-semibold shadow-[0_10px_40px_-12px] shadow-aria-brand/60 transition hover:shadow-[0_16px_50px_-12px] hover:shadow-aria-brand/70"
            >
              Open the canvas
              <ArrowRight size={18} aria-hidden className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/templates"
              className="rounded-2xl border border-aria-border bg-aria-panel/70 px-7 py-3.5 text-base font-semibold text-aria-text backdrop-blur transition hover:border-aria-brand/40 hover:bg-aria-panel-2"
            >
              Browse templates
            </Link>
          </div>

          <div className="a-fade-up a-d4 mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-aria-muted">
            {audience.map(({ icon: Icon, label, text }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon size={16} aria-hidden className="text-aria-brand-2" />
                <span className="font-semibold text-aria-text">{label}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Pillars */}
        <section className="grid gap-5 pb-24 sm:grid-cols-3">
          {pillars.map(({ to, icon: Icon, title, body, accent }, i) => (
            <Link
              key={to}
              to={to}
              data-reveal-delay={i * 90}
              className="a-reveal a-lift group relative overflow-hidden rounded-3xl border border-aria-border bg-aria-panel/80 p-7 backdrop-blur hover:border-aria-brand/50"
            >
              {/* Hover sheen */}
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <div className={`mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
                <Icon size={22} aria-hidden />
              </div>
              <h2 className="mb-2 text-lg font-semibold">{title}</h2>
              <p className="text-sm leading-relaxed text-aria-muted">{body}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-aria-brand-2 opacity-0 transition-all duration-300 group-hover:gap-2 group-hover:opacity-100">
                Explore <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </section>

        {/* Feature grid */}
        <section className="pb-28">
          <h2 className="a-reveal text-center text-[clamp(1.8rem,4vw,2.6rem)] font-bold tracking-tight">
            Everything you need, built in
          </h2>
          <p className="a-reveal mx-auto mt-4 max-w-lg text-center text-aria-muted" data-reveal-delay="80">
            Design freely, make it move, ship it anywhere.
          </p>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, body }, i) => (
              <div
                key={title}
                data-reveal-delay={i * 70}
                className="a-reveal a-lift rounded-2xl border border-aria-border bg-aria-panel/60 p-6 backdrop-blur hover:border-aria-brand/40"
              >
                <Icon size={20} aria-hidden className="mb-4 text-aria-brand-2" />
                <h3 className="mb-1.5 font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-aria-muted">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="a-reveal relative mb-24 overflow-hidden rounded-[2rem] border border-aria-border bg-gradient-to-br from-aria-panel to-aria-panel-2 px-8 py-16 text-center">
          <div aria-hidden className="a-drift pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-aria-brand/20 blur-[100px]" />
          <h2 className="relative text-[clamp(1.7rem,4vw,2.4rem)] font-bold tracking-tight">Ready to build something?</h2>
          <p className="relative mx-auto mt-3 max-w-md text-aria-muted">
            Open a blank canvas and drag your first element into place.
          </p>
          <Link
            to="/canvas"
            className="a-cta group relative mt-8 inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-base font-semibold shadow-[0_10px_40px_-12px] shadow-aria-brand/60"
          >
            Start building
            <ArrowRight size={18} aria-hidden className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </section>
      </div>
    </div>
  )
}
