import StudioIcon from './StudioIcon'
import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { LayoutTemplate, Store, MousePointer2, X, User, Server } from 'lucide-react'
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
    <header className="studio-nav sticky top-0 z-50 flex items-center justify-between border-b border-aria-border">
      <Link to="/" className="group flex items-center gap-2.5">
        <span className="studio-wordmark">aria<span><StudioIcon size={12} /></span></span>
      </Link>

      <nav aria-label="Primary" className="studio-nav-links flex items-center gap-1">
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
          Open canvas
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
