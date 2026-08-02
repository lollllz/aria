import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { marketItems as seedItems } from '../data/marketplace'
import type { MarketItem } from '../types'

// Shared so items published from anywhere (e.g. the Effect Maker's "Share")
// show up in the Marketplace route. Persisted so uploads/shares survive refresh.
interface MarketState {
  items: MarketItem[]
  addItem: (item: MarketItem) => void
  incrementDownloads: (id: string) => void
}

export const useMarketplaceStore = create<MarketState>()(persist((set) => ({
  items: seedItems,
  addItem: (item) => set((s) => ({ items: [item, ...s.items] })),
  incrementDownloads: (id) =>
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, downloads: i.downloads + 1 } : i)) })),
}), {
  name: 'aria-market',
  version: 1,
  // Merge seed items with any the user published, de-duped by id (seeds win on shape).
  merge: (persisted, current) => {
    const p = persisted as Partial<MarketState> | undefined
    const seeded = current.items
    const saved = p?.items ?? []
    const seenIds = new Set(seeded.map((i) => i.id))
    const extras = saved.filter((i) => !seenIds.has(i.id))
    return { ...current, ...p, items: [...extras, ...seeded] }
  },
}))
