import type { Config, Context } from '@netlify/functions'
import { sql, json, preflight } from './_neon.mts'

// GET  /api/market                    -> list items (optional ?kind= &category= &q=)
// POST /api/market                    -> publish an item
// POST /api/market?id=<uuid>&get=1    -> increment downloads (a "Get free")
export default async (req: Request, _ctx: Context) => {
  const pre = preflight(req)
  if (pre) return pre

  try {
    const url = new URL(req.url)

    if (req.method === 'GET') {
      const kind = url.searchParams.get('kind')
      const category = url.searchParams.get('category')
      const q = url.searchParams.get('q')
      const rows = await sql`
        select * from market_items
        where (${kind}::text is null or kind = ${kind})
          and (${category}::text is null or category = ${category})
          and (${q}::text is null or title ilike ${'%' + (q ?? '') + '%'})
        order by created_at desc limit 200`
      return json(rows)
    }

    if (req.method === 'POST') {
      const id = url.searchParams.get('id')
      if (id && url.searchParams.get('get')) {
        const rows = await sql`update market_items set downloads = downloads + 1 where id = ${id} returning downloads`
        return json(rows[0])
      }
      const b = await req.json()
      if (!b?.title || !b?.kind || !b?.category) return json({ error: 'title, kind, category required' }, 400)
      const rows = await sql`
        insert into market_items (author, title, kind, category, license, cover, tags, description, effect_css, payload)
        values (${b.author ?? 'you'}, ${b.title}, ${b.kind}, ${b.category}, ${b.license ?? 'MIT'},
                ${b.cover ?? ''}, ${b.tags ?? []}, ${b.description ?? ''}, ${b.effectCss ?? null}, ${b.payload ?? null})
        returning *`
      return json(rows[0], 201)
    }

    return json({ error: 'method not allowed' }, 405)
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
}

export const config: Config = { path: '/api/market' }
