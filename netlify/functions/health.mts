import type { Config, Context } from '@netlify/functions'
import { sql, json, preflight } from './_neon.mts'

// GET /api/health -> reports whether the API can reach the database, and which
// tables exist. Used by the in-app Database setup tool to verify a connection.
export default async (req: Request, _ctx: Context) => {
  const pre = preflight(req)
  if (pre) return pre

  if (!process.env.DATABASE_URL) {
    return json({ ok: false, db: false, error: 'DATABASE_URL is not set on the server' }, 200)
  }

  try {
    const rows = await sql`
      select table_name from information_schema.tables
      where table_schema = 'public' and table_name in ('users','sites','market_items')`
    const tables = rows.map((r: Record<string, string>) => r.table_name)
    const required = ['users', 'sites', 'market_items']
    const missing = required.filter((t) => !tables.includes(t))
    return json({
      ok: missing.length === 0,
      db: true,
      tables,
      missing,
      googleConfigured: Boolean(process.env.GOOGLE_CLIENT_ID),
    })
  } catch (err) {
    return json({ ok: false, db: false, error: String(err) }, 200)
  }
}

export const config: Config = { path: '/api/health' }
