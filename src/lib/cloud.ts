import type { MarketItem } from '../types'
import { apiBase } from '../store/settingsStore'

// Cloud is "on" only when an API URL is configured. Everything degrades to
// local-only storage when it isn't, so the app always works offline.
export const cloudEnabled = () => Boolean(apiBase())

// The API returns raw Postgres rows (snake_case, numeric-as-string). Normalise
// them into the shape the UI already uses.
export function rowToMarketItem(r: Record<string, unknown>): MarketItem {
  return {
    id: String(r.id),
    title: String(r.title ?? 'Untitled'),
    author: String(r.author ?? 'anonymous'),
    category: (r.category ?? 'theme') as MarketItem['category'],
    kind: (r.kind ?? 'creation') as MarketItem['kind'],
    license: (r.license ?? 'MIT') as MarketItem['license'],
    rating: Number(r.rating ?? 5),
    downloads: Number(r.downloads ?? 0),
    cover: String(r.cover ?? 'linear-gradient(135deg,#7c5cff,#22d3ee)'),
    tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
    description: String(r.description ?? ''),
    effectCss: (r.effect_css ?? r.effectCss ?? undefined) as string | undefined,
    // The table has no effect_name column, so the title doubles as the label.
    effectName: (r.effectName as string | undefined) ?? (r.effect_css ? String(r.title) : undefined),
  }
}

// Payload for POST /api/market.
export function marketItemToBody(i: MarketItem) {
  return {
    title: i.title,
    author: i.author,
    kind: i.kind,
    category: i.category,
    license: i.license,
    cover: i.cover,
    tags: i.tags,
    description: i.description,
    effectCss: i.effectCss ?? null,
  }
}
