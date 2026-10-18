import StudioIcon from './StudioIcon'
import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { LayoutTemplate, Store, MousePointer2, X, User, Server } from 'lucide-react'
import { useProfileStore } from '../store/profileStore'
import IdentitySignIn from './IdentitySignIn'
import { logout } from '@netlify/identity'
import Dialog from './Dialog'

const links = [
  { to: '/canvas', label: 'Canvas', icon: MousePointer2 },
  { to: '/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/marketplace', label: 'Marketplace', icon: Store },
  { to: '/settings', label: 'Hosting', icon: Server },
]

export default function Navbar() {
  const { name, picture, signOut } = useProfileStore()
  const [open, setOpen] = useState(false)
  const [signoutError, setSignoutError] = useState('')
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    setSignoutError('')
    try {
      await logout()
      signOut()
    } catch {
      setSignoutError('Could not sign out. Please try again.')
    } finally { setSigningOut(false) }
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
            onClick={handleSignOut}
            disabled={signingOut}
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
            onClick={() => setOpen(true)}
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

      {signoutError && <p role="alert" className="text-sm text-aria-muted">{signoutError}</p>}
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

          <IdentitySignIn />
        </Dialog>
      )}
    </header>
  )
}
