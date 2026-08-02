import { NavLink, Link } from 'react-router-dom'
import { LayoutTemplate, Store, MousePointer2 } from 'lucide-react'
import ariaMark from '../assets/aria-mark.svg'

const links = [
  { to: '/canvas', label: 'Canvas', icon: MousePointer2 },
  { to: '/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/marketplace', label: 'Marketplace', icon: Store },
]

export default function Navbar() {
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
        <button className="rounded-lg px-3 py-1.5 text-sm font-medium text-aria-muted hover:text-aria-text">
          Log in
        </button>
        <Link
          to="/canvas"
          className="rounded-lg bg-gradient-to-r from-aria-brand to-aria-brand-2 px-3.5 py-1.5 text-sm font-semibold text-white shadow-lg shadow-aria-brand/20 transition hover:opacity-90"
        >
          Start building
        </Link>
      </div>
    </header>
  )
}
