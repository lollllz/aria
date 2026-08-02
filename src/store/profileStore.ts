import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Signed-in user. Populated by Google Sign-In (verified server-side) or, as a
// fallback when Google isn't configured, a local display name.
interface ProfileState {
  userId: string        // Neon user id, or Google sub, or '' when signed out
  name: string          // display name (also used as the marketplace author)
  email: string
  picture: string       // avatar URL
  setUser: (u: { userId: string; name: string; email?: string; picture?: string }) => void
  setName: (name: string) => void
  signOut: () => void
}

export const useProfileStore = create<ProfileState>()(persist((set) => ({
  userId: '',
  name: '',
  email: '',
  picture: '',
  setUser: (u) => set({ userId: u.userId, name: u.name.trim(), email: u.email ?? '', picture: u.picture ?? '' }),
  setName: (name) => set({ name: name.trim(), userId: name.trim() ? 'local' : '' }),
  signOut: () => set({ userId: '', name: '', email: '', picture: '' }),
}), { name: 'aria-profile' }))
