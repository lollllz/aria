import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { LayoutTemplate, Store, MousePointer2, X, User } from 'lucide-react'
import ariaMark from '../assets/aria-mark.svg'
import { useProfileStore } from '../store/profileStore'

const links = [
  { to: '/canvas', label: 'Canvas', icon: MousePointer2 },
  { to: '/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/marketplace', label: 'Marketplace', icon: Store },
]

export default function Navbar() {
  const { name, setName, signOut } = useProfileStore()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-aria-border bg-aria-bg/80 px-5 backdrop-blur">
      <Link to="/" className="flex items-center gap-2">
        <img src={ariaMark} alt="Aria" className="h-8 w-8" />
        <span className="text-lg font-bold tracking-tight">Aria</span>
        <span className="ml-1 rounded-full border border-aria-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-aria-muted">
          beta
        </span>
      </Link>

      <nav className="flex items-center gap-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-aria-panel-2 text-aria-text'
                  : 'text-aria-muted hover:bg-aria-panel hover:text-aria-text'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        {name ? (
          <button
            onClick={signOut}
            title="Sign out"
            className="flex items-center gap-2 rounded-lg border border-aria-border px-3 py-1.5 text-sm font-medium text-aria-text hover:bg-aria-panel"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-aria-brand to-aria-brand-2 text-xs font-bold text-white">
              {name[0]?.toUpperCase()}
            </span>
            {name}
          </button>
        ) : (
          <button
            onClick={() => { setDraft(''); setOpen(true) }}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-aria-muted hover:text-aria-text"
          >
            Log in
          </button>
        )}
        <Link
          to="/canvas"
          className="rounded-lg bg-gradient-to-r from-aria-brand to-aria-brand-2 px-3.5 py-1.5 text-sm font-semibold text-white shadow-lg shadow-aria-brand/20 transition hover:opacity-90"
        >
          Start building
        </Link>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-aria-border bg-aria-panel p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold"><User size={18} /> Sign in</h2>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-aria-muted hover:bg-aria-panel-2 hover:text-aria-text"><X size={18} /></button>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-aria-muted">
              Full accounts arrive with cloud sync. For now, pick a display name — it's saved on this device and used as the author on anything you publish.
            </p>
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) { setName(draft); setOpen(false) } }}
              placeholder="Display name"
              className="w-full rounded-lg border border-aria-border bg-aria-panel-2 px-3 py-2 text-sm outline-none focus:border-aria-brand"
            />
            <button
              onClick={() => { if (draft.trim()) { setName(draft); setOpen(false) } }}
              disabled={!draft.trim()}
              className="mt-4 w-full rounded-lg bg-gradient-to-r from-aria-brand to-aria-brand-2 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
