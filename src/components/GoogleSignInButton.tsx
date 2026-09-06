import { useEffect, useRef, useState } from 'react'
import { loadGis, GOOGLE_CLIENT_ID } from '../lib/googleAuth'

// Renders Google's official "Sign in with Google" button. Calls onCredential
// with the returned ID token (JWT). Renders nothing if no Client ID is configured.
export default function GoogleSignInButton({ onCredential }: { onCredential: (jwt: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    let cancelled = false
    loadGis()
      .then(() => {
        if (cancelled || !ref.current) return
        const g = (window as any).google
        g.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (resp: { credential: string }) => onCredential(resp.credential),
        })
        g.accounts.id.renderButton(ref.current, {
          theme: 'filled_black', size: 'large', shape: 'pill', text: 'continue_with', width: 280,
        })
        setStatus('ready')
      })
      .catch(() => { if (!cancelled) setStatus('error') })
    return () => { cancelled = true }
  }, [onCredential])

  if (!GOOGLE_CLIENT_ID) return null
  if (status === 'error') {
    return <p className="text-sm text-red-300">Could not load Google Sign-In. Try refreshing the page.</p>
  }
  return (
    <div>
      {status === 'loading' && <p className="sr-only">Loading Google Sign-In…</p>}
      <div
        ref={ref}
        className="flex min-h-10 justify-center"
        aria-busy={status === 'loading'}
      />
    </div>
  )
}
