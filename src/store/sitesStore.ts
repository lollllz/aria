import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Tracks which cloud site the canvas is currently editing, so "Save" updates
// that row instead of creating a duplicate every time.
interface SitesState {
  currentSiteId: string | null
  currentSiteName: string
  lastSavedAt: number | null
  setCurrent: (id: string | null, name?: string) => void
  markSaved: () => void
}

export const useSitesStore = create<SitesState>()(persist((set) => ({
  currentSiteId: null,
  currentSiteName: 'Untitled site',
  lastSavedAt: null,
  setCurrent: (id, name) => set((s) => ({ currentSiteId: id, currentSiteName: name ?? s.currentSiteName })),
  markSaved: () => set({ lastSavedAt: Date.now() }),
}), { name: 'aria-current-site' }))
