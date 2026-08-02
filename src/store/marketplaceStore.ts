import { create } from 'zustand'
import { marketItems as seedItems } from '../data/marketplace'
import type { MarketItem } from '../types'

// Shared so items published from anywhere (e.g. the Effect Maker's "Share")
// show up in the Marketplace route.
interface MarketState {
  items: MarketItem[]
  addItem: (item: MarketItem) => void
  incrementDownloads: (id: string) => void
}

export const useMarketplaceStore = create<MarketState>((set) => ({
  items: seedItems,
  addItem: (item) => set((s) => ({ items: [item, ...s.items] })),
  incrementDownloads: (id) =>
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, downloads: i.downloads + 1 } : i)) })),
}))
