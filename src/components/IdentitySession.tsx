import { useEffect, useState } from 'react'
import { getUser, handleAuthCallback, onAuthChange } from '@netlify/identity'
import { useProfileStore } from '../store/profileStore'
import { api } from '../lib/api'
import { apiBase } from '../store/settingsStore'

// Deduplicate callback exchanges across React StrictMode's effect replay.
let initialization: ReturnType<typeof handleAuthCallback> | undefined

export default function IdentitySession() {
  const [error, setError] = useState('')
  useEffect(() => {
    let cancelled = false
    let revision = 0
    const sync = async () => {
      const current = ++revision
      const user = await getUser()
      if (cancelled || current !== revision) return
      if (!user) { useProfileStore.getState().signOut(); return }
      useProfileStore.getState().setUser({ userId: user.id, name: user.name || user.email || 'Member', email: user.email, picture: user.pictureUrl })
      if (!apiBase()) return
      try {
        const row = await api.currentUser()
        if (!cancelled && current === revision) useProfileStore.getState().setUser({ userId: row.id, name: row.name, email: row.email, picture: row.picture })
      } catch {
        if (!cancelled && current === revision) setError('Signed in, but cloud storage could not connect. Your canvas remains saved on this device.')
      }
    }
    const unsubscribe = onAuthChange(() => { void sync() })
    initialization ??= handleAuthCallback()
    initialization.then((result) => {
      if (!cancelled && (result?.type === 'invite' || result?.type === 'recovery')) {
        setError('This sign-in uses an email recovery or invitation link. Please sign in with an enabled external provider instead.')
      }
      return sync()
    }).catch(() => {
      if (!cancelled) { useProfileStore.getState().signOut(); setError('Sign-in could not finish. Please open Log in and try again.') }
    })
    return () => { cancelled = true; unsubscribe() }
  }, [])
  return error ? <div role="alert" className="border-b border-aria-border bg-aria-panel px-5 py-3 text-sm">{error}</div> : null
}
