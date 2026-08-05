import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DbProvider = 'neon' | 'other'

// Lets a client point this Aria install at their OWN backend/database at runtime,
// without rebuilding. Only the public API URL lives here — the database
// connection string never touches the browser (it stays in server env vars).
interface SettingsState {
  apiBase: string          // e.g. https://your-api.netlify.app
  provider: DbProvider
  setApiBase: (v: string) => void
  setProvider: (p: DbProvider) => void
  reset: () => void
}

export const useSettingsStore = create<SettingsState>()(persist((set) => ({
  apiBase: '',
  provider: 'neon',
  setApiBase: (v) => set({ apiBase: v.trim().replace(/\/+$/, '') }),
  setProvider: (provider) => set({ provider }),
  reset: () => set({ apiBase: '', provider: 'neon' }),
}), { name: 'aria-settings' }))

// The effective API base: a user-configured backend wins over the build-time default.
export function apiBase(): string {
  const configured = useSettingsStore.getState().apiBase
  return configured || (import.meta.env.VITE_API_BASE ?? '')
}
