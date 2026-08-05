// Frontend data layer. Points at the Netlify Functions API in production
// (VITE_API_BASE = your Netlify site URL) and same-origin in local dev.
import type { CanvasElement, CanvasPage, CustomEffect, MarketItem, PageMeta } from '../types'

import { apiBase } from '../store/settingsStore'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return res.json() as Promise<T>
}

export interface HealthReport {
  ok: boolean
  db: boolean
  tables?: string[]
  missing?: string[]
  googleConfigured?: boolean
  error?: string
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
  // Probe an arbitrary backend (used by the Database setup tool before saving).
  health: async (base?: string): Promise<HealthReport> => {
    const root = (base ?? apiBase()).replace(/\/+$/, '')
    if (!root) return { ok: false, db: false, error: 'No API URL configured' }
    try {
      const res = await fetch(`${root}/api/health`, { headers: { 'content-type': 'application/json' } })
      if (!res.ok) return { ok: false, db: false, error: `HTTP ${res.status}` }
      return (await res.json()) as HealthReport
    } catch (e) {
      return { ok: false, db: false, error: e instanceof Error ? e.message : String(e) }
    }
  },

  listSites: (userId?: string) => req<SiteRow[]>(`/api/sites${userId ? `?userId=${userId}` : ''}`),
  getSite: (id: string) => req<SiteRow>(`/api/sites?id=${id}`),
  saveSite: (site: { id?: string; userId?: string; name: string; data: SiteData }) =>
    req<SiteRow>('/api/sites', { method: 'POST', body: JSON.stringify(site) }),

  // Verify a Google ID token server-side and upsert the user in Neon.
  authWithGoogle: (credential: string) =>
    req<{ id: string; name: string; email: string; picture?: string }>('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    }),

  listMarket: (opts: { kind?: string; category?: string; q?: string } = {}) => {
    const p = new URLSearchParams(Object.entries(opts).filter(([, v]) => v) as [string, string][])
    return req<MarketItem[]>(`/api/market${p.toString() ? `?${p}` : ''}`)
  },
  publishMarket: (item: Partial<MarketItem> & { title: string; kind: string; category: string }) =>
    req<MarketItem>('/api/market', { method: 'POST', body: JSON.stringify(item) }),
  getFree: (id: string) => req<{ downloads: number }>(`/api/market?id=${id}&get=1`, { method: 'POST' }),
}
