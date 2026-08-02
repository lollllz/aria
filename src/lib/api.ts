// Frontend data layer. Points at the Netlify Functions API in production
// (VITE_API_BASE = your Netlify site URL) and same-origin in local dev.
import type { CanvasElement, CanvasPage, CustomEffect, MarketItem, PageMeta } from '../types'

const BASE = import.meta.env.VITE_API_BASE ?? ''

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return res.json() as Promise<T>
}

// The full design document we persist per site.
export interface SiteData {
  frame: CanvasPage
  pages: PageMeta[]
  elements: CanvasElement[]
  effects: CustomEffect[]
  autoAdaptive: boolean
}
export interface SiteRow { id: string; name: string; updated_at: string; data?: SiteData }

export const api = {
  listSites: (userId?: string) => req<SiteRow[]>(`/api/sites${userId ? `?userId=${userId}` : ''}`),
  getSite: (id: string) => req<SiteRow>(`/api/sites?id=${id}`),
  saveSite: (site: { id?: string; userId?: string; name: string; data: SiteData }) =>
    req<SiteRow>('/api/sites', { method: 'POST', body: JSON.stringify(site) }),

  listMarket: (opts: { kind?: string; category?: string; q?: string } = {}) => {
    const p = new URLSearchParams(Object.entries(opts).filter(([, v]) => v) as [string, string][])
    return req<MarketItem[]>(`/api/market${p.toString() ? `?${p}` : ''}`)
  },
  publishMarket: (item: Partial<MarketItem> & { title: string; kind: string; category: string }) =>
    req<MarketItem>('/api/market', { method: 'POST', body: JSON.stringify(item) }),
  getFree: (id: string) => req<{ downloads: number }>(`/api/market?id=${id}&get=1`, { method: 'POST' }),
}
