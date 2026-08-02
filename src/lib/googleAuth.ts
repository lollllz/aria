// Google Identity Services (GIS) — works on a static site (GitHub Pages).
// The Client ID is public and safe to ship; token verification happens server-side.
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

let loading: Promise<void> | null = null

// Lazily inject the GIS script once.
export function loadGis(): Promise<void> {
  if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) return Promise.resolve()
  if (loading) return loading
  loading = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(s)
  })
  return loading
}

export interface GoogleProfile { sub: string; name: string; email: string; picture: string }

// Decode a Google ID token (JWT) client-side for immediate display. The server
// still re-verifies before trusting it for anything that writes to the DB.
export function decodeIdToken(token: string): GoogleProfile {
  const part = token.split('.')[1] ?? ''
  const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'))
  const p = JSON.parse(json) as Record<string, string>
  return { sub: p.sub, name: p.name || p.email, email: p.email, picture: p.picture }
}
