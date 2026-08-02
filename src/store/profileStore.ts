import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Lightweight local profile. Real accounts arrive with the Neon/Netlify backend;
// for now this just remembers a display name (used as the marketplace author).
interface ProfileState {
  name: string
  setName: (name: string) => void
  signOut: () => void
}

export const useProfileStore = create<ProfileState>()(persist((set) => ({
  name: '',
  setName: (name) => set({ name: name.trim() }),
  signOut: () => set({ name: '' }),
}), { name: 'aria-profile' }))
