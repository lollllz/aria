import { getUser } from '@netlify/identity'
import { sql } from './_neon.mts'

// Link verified Identity accounts to existing Neon users by confirmed email.
export async function currentUser() {
  const user = await getUser()
  if (!user?.email || !user.confirmedAt) return null
  const rows = await sql`
    insert into users (email, name, picture)
    values (${user.email}, ${user.name || user.email}, ${user.pictureUrl ?? null})
    on conflict (email) do update
      set name = excluded.name, picture = excluded.picture
    returning id, name, email, picture`
  return rows[0]
}
