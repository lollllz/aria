import type { Config, Context } from '@netlify/functions'
import { sql, json, preflight } from './_neon.mts'
import { currentUser } from './_identity.mts'
import { verifyRequestOrigin } from '@netlify/identity'

// GET  /api/sites            -> list the authenticated user's sites
// GET  /api/sites?id=<uuid>  -> one site
// POST /api/sites            -> create/update a site  { id?, name, data }
export default async (req: Request, _ctx: Context) => {
  const pre = preflight(req)
  if (pre) return pre

  if (req.method === 'POST' || req.method === 'DELETE') {
    try { verifyRequestOrigin(req) } catch { return json({ error: 'origin mismatch' }, 403) }
  }

  try {
    const user = await currentUser()
    if (!user) return json({ error: 'sign in required' }, 401)
    const url = new URL(req.url)

    if (req.method === 'GET') {
      const id = url.searchParams.get('id')
      if (id) {
        const rows = await sql`select * from sites where id = ${id} and user_id = ${user.id}`
        return rows[0] ? json(rows[0]) : json({ error: 'not found' }, 404)
      }
      const rows = await sql`select id, name, updated_at from sites where user_id = ${user.id} order by updated_at desc`
      return json(rows)
    }

    if (req.method === 'POST') {
      const b = await req.json()
      if (!b?.name || !b?.data) return json({ error: 'name and data required' }, 400)
      if (b.id) {
        const rows = await sql`
          update sites set name = ${b.name}, data = ${b.data}, updated_at = now()
          where id = ${b.id} and user_id = ${user.id} returning id, name, updated_at`
        return rows[0] ? json(rows[0]) : json({ error: 'not found' }, 404)
      }
      const rows = await sql`
        insert into sites (user_id, name, data)
        values (${user.id}, ${b.name}, ${b.data})
        returning id, name, updated_at`
      return json(rows[0], 201)
    }

    if (req.method === 'DELETE') {
      const id = url.searchParams.get('id')
      if (!id) return json({ error: 'id required' }, 400)
      const rows = await sql`delete from sites where id = ${id} and user_id = ${user.id} returning id`
      if (!rows.length) return json({ error: 'not found' }, 404)
      return json({ deleted: id })
    }

    return json({ error: 'method not allowed' }, 405)
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
}

export const config: Config = { path: '/api/sites' }
