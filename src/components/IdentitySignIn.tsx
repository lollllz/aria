import { useEffect, useState } from 'react'
import { getSettings, oauthLogin } from '@netlify/identity'
import type { AuthProvider } from '@netlify/identity'

const labels: Partial<Record<AuthProvider, string>> = {
  google: 'Google', github: 'GitHub', gitlab: 'GitLab', bitbucket: 'Bitbucket',
}

export default function IdentitySignIn() {
  const [providers, setProviders] = useState<AuthProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<AuthProvider | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getSettings().then((settings) => {
      if (!cancelled) setProviders((Object.keys(labels) as AuthProvider[]).filter((p) => settings.providers[p]))
    }).catch(() => {
      if (!cancelled) setError('Sign-in is unavailable. Enable Netlify Identity on the deployed site and try again.')
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const start = (provider: AuthProvider) => {
    setBusy(provider)
    setError('')
    try { oauthLogin(provider) } catch (err) {
      // The SDK throws this signal after starting navigation.
      if (err instanceof Error && err.message === 'Redirecting to OAuth provider') return
      setError('Could not start sign-in. Please try again.')
      setBusy(null)
    }
  }

  return <div className="mt-4 space-y-3">
    <p className="text-sm leading-relaxed text-aria-muted">Sign in to save your sites and publish to the marketplace.</p>
    {loading && <p role="status" className="text-sm text-aria-muted">Loading sign-in options…</p>}
    {providers.map((p) => <button key={p} onClick={() => start(p)} disabled={busy !== null}
      className="a-cta min-h-11 w-full rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60">
      {busy === p ? 'Opening sign-in…' : `Continue with ${labels[p]}`}
    </button>)}
    {!loading && !error && providers.length === 0 && <p role="status" className="text-sm text-aria-muted">
      No sign-in provider is enabled yet. Enable Google in Netlify Identity → Registration → External providers.
    </p>}
    {error && <p role="alert" className="text-sm text-aria-muted">{error}</p>}
  </div>
}
