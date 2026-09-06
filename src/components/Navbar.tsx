import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { LayoutTemplate, Store, MousePointer2, X, User, Server } from 'lucide-react'
import ariaMark from '../assets/aria-mark.svg'
import { useProfileStore } from '../store/profileStore'
import GoogleSignInButton from './GoogleSignInButton'
import Dialog from './Dialog'
import { GOOGLE_CLIENT_ID, decodeIdToken } from '../lib/googleAuth'
import { api } from '../lib/api'
import { apiBase } from '../store/settingsStore'

const links = [
  { to: '/canvas', label: 'Canvas', icon: MousePointer2 },
  { to: '/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/marketplace', label: 'Marketplace', icon: Store },
  { to: '/settings', label: 'Hosting', icon: Server },
]

export default function Navbar() {
  const { name, picture, setUser, setName, signOut } = useProfileStore()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')

  // Google sign-in: show the user immediately from the token, then confirm/persist
  // via the backend (which re-verifies the token) when the API is configured.
  const onCredential = async (jwt: string) => {
    const p = decodeIdToken(jwt)
    setUser({ userId: p.sub, name: p.name, email: p.email, picture: p.picture })
    setOpen(false)
    if (apiBase()) {
      try {
        const u = await api.authWithGoogle(jwt)
        setUser({ userId: u.id, name: u.name, email: u.email, picture: u.picture })
      } catch { /* keep optimistic identity if the backend isn't reachable yet */ }
    }
  }

  return (
    <header className="a-glass a-slide-down sticky top-0 z-50 flex h-16 items-center justify-between border-b border-aria-border/70 px-5">
      <Link to="/" className="group flex items-center gap-2.5">
        <img
          src={ariaMark}
          alt=""
          className="h-8 w-8 transition-transform duration-500 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:rotate-[8deg] group-hover:scale-110"
        />
        <span className="text-lg font-semibold tracking-tight">Aria</span>
        <span className="ml-1 rounded-full border border-aria-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-aria-muted">
          beta
        </span>
      </Link>

      <nav aria-label="Primary" className="flex items-center gap-1 rounded-full border border-aria-border/70 bg-aria-panel/50 p-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            className={({ isActive }) =>
              `group relative flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-aria-panel-2 text-aria-text shadow-sm'
                  : 'text-aria-muted hover:bg-aria-panel hover:text-aria-text'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={16}
                  aria-hidden
                  className={`transition-transform duration-300 ${isActive ? 'text-aria-brand-2' : 'group-hover:scale-110'}`}
                />
                <span className="hidden sm:inline">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        {name ? (
          <button
            onClick={signOut}
            aria-label={`Sign out ${name}`}
            title="Sign out"
            className="flex items-center gap-2 rounded-lg border border-aria-border px-2.5 py-1.5 text-sm font-medium text-aria-text hover:bg-aria-panel"
          >
            {picture ? (
              <img src={picture} alt="" className="h-6 w-6 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <span aria-hidden className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-aria-brand to-aria-brand-2 text-xs font-bold text-white">
                {name[0]?.toUpperCase()}
              </span>
            )}
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
          className="a-cta rounded-lg px-3.5 py-1.5 text-sm font-semibold shadow-lg shadow-aria-brand/20 transition"
        >
          Start building
        </Link>
      </div>

      {open && (
        <Dialog
          onClose={() => setOpen(false)}
          labelledBy="signin-title"
          zClass="z-[60]"
          panelClassName="a-pop-in w-full max-w-sm rounded-2xl border border-aria-border bg-aria-panel p-6"
        >
          <div className="mb-1 flex items-center justify-between">
            <h2 id="signin-title" className="flex items-center gap-2 text-lg font-bold"><User size={18} aria-hidden /> Sign in to Aria</h2>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="rounded-lg p-1.5 text-aria-muted hover:bg-aria-panel-2 hover:text-aria-text"
            >
              <X size={18} aria-hidden />
            </button>
          </div>

          {GOOGLE_CLIENT_ID ? (
            <>
              <p className="mb-4 text-sm leading-relaxed text-aria-muted">
                Sign in with Google to save your sites and publish to the marketplace.
              </p>
              <div className="flex justify-center py-1">
                <GoogleSignInButton onCredential={onCredential} />
              </div>
            </>
          ) : (
            <>
              <p className="mb-4 text-sm leading-relaxed text-aria-muted">
                Pick a display name — it's saved on this device and used as the author on anything you publish. (Google Sign-In turns on once it's configured.)
              </p>
              <label htmlFor="display-name" className="mb-1 block text-xs font-medium text-aria-muted">Display name</label>
              <input
                id="display-name"
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) { setName(draft); setOpen(false) } }}
                placeholder="Display name"
                className="w-full rounded-lg border border-aria-border bg-aria-panel-2 px-3 py-2 text-sm focus:border-aria-brand"
              />
              <button
                onClick={() => { if (draft.trim()) { setName(draft); setOpen(false) } }}
                disabled={!draft.trim()}
                className="a-cta mt-4 w-full rounded-lg py-2.5 text-sm font-semibold transition"
              >
                Continue
              </button>
            </>
          )}
        </Dialog>
      )}
    </header>
  )
}
