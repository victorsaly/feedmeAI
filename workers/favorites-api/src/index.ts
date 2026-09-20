/**
 * Saved recipes, kept server-side under whichever account is signed in —
 * a sibling to feedmeai-api's todos table (same D1 database, its own
 * `favorites` table, its own worker so nothing there is touched).
 *
 * Identity works exactly the way feedmeai-api already documents it
 * (see feedmeAI's src/lib/account.ts): the bearer token is not trusted
 * locally, it's forwarded to arcade-api's /v1/me on every request, and
 * whatever id that returns is the row owner. No email, no password, no
 * secret of our own to leak.
 */

export interface Env {
  DB: D1Database
}

const ARCADE_AUTH = 'https://api.victorsaly.com'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
} as const

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...CORS },
  })
}

async function identify(request: Request): Promise<string | null> {
  const auth = request.headers.get('authorization')
  if (!auth) return null
  try {
    const res = await fetch(`${ARCADE_AUTH}/v1/me`, { headers: { authorization: auth } })
    if (!res.ok) return null
    const data = (await res.json()) as { id?: string }
    return data.id ?? null
  } catch {
    return null
  }
}

/** A recipe as the frontend's Recipe type shapes it — see kitchen.ts. */
interface RecipePayload {
  id: string
  title: string
  description?: string
  cookingTime?: string
  difficulty?: string
  ingredients: string[]
  instructions: string[]
  nutrition?: unknown
  image?: string
  previewImage?: string
  credit?: unknown
  video?: unknown
  createdAt?: string
}

interface Row {
  id: string
  title: string
  description: string
  cooking_time: string
  difficulty: string
  ingredients: string
  instructions: string
  nutrition: string | null
  image: string | null
  preview_image: string | null
  credit: string | null
  video: string | null
  created_at: number
}

function rowToRecipe(r: Row) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    cookingTime: r.cooking_time,
    difficulty: r.difficulty,
    ingredients: JSON.parse(r.ingredients),
    instructions: JSON.parse(r.instructions),
    nutrition: r.nutrition ? JSON.parse(r.nutrition) : undefined,
    image: r.image ?? undefined,
    previewImage: r.preview_image ?? undefined,
    credit: r.credit ? JSON.parse(r.credit) : undefined,
    video: r.video ? JSON.parse(r.video) : undefined,
    createdAt: new Date(r.created_at).toISOString(),
    isFavorite: true,
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS })

    const url = new URL(request.url)
    const parts = url.pathname.split('/').filter(Boolean) // ["v1", "favorites", maybe id]
    if (parts[0] !== 'v1' || parts[1] !== 'favorites') return json({ error: 'not found' }, 404)

    const userId = await identify(request)
    if (!userId) return json({ error: 'sign in required' }, 401)

    if (request.method === 'GET' && parts.length === 2) {
      const { results } = await env.DB.prepare(
        'SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC',
      )
        .bind(userId)
        .all<Row>()
      return json({ favorites: (results ?? []).map(rowToRecipe) })
    }

    if (request.method === 'POST' && parts.length === 2) {
      let body: RecipePayload
      try {
        body = await request.json()
      } catch {
        return json({ error: 'invalid body' }, 400)
      }
      if (!body?.id || !body.title || !Array.isArray(body.ingredients) || !Array.isArray(body.instructions)) {
        return json({ error: 'missing required fields' }, 400)
      }
      const createdAtMs = body.createdAt ? Date.parse(body.createdAt) || Date.now() : Date.now()
      await env.DB.prepare(
        `INSERT INTO favorites
           (user_id, id, title, description, cooking_time, difficulty, ingredients, instructions,
            nutrition, image, preview_image, credit, video, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, id) DO UPDATE SET
           title = excluded.title,
           description = excluded.description,
           cooking_time = excluded.cooking_time,
           difficulty = excluded.difficulty,
           ingredients = excluded.ingredients,
           instructions = excluded.instructions,
           nutrition = excluded.nutrition,
           image = excluded.image,
           preview_image = excluded.preview_image,
           credit = excluded.credit,
           video = excluded.video`,
      )
        .bind(
          userId,
          body.id,
          body.title,
          body.description ?? '',
          body.cookingTime ?? '',
          body.difficulty ?? 'Easy',
          JSON.stringify(body.ingredients),
          JSON.stringify(body.instructions),
          body.nutrition ? JSON.stringify(body.nutrition) : null,
          body.image ?? null,
          body.previewImage ?? null,
          body.credit ? JSON.stringify(body.credit) : null,
          body.video ? JSON.stringify(body.video) : null,
          createdAtMs,
        )
        .run()
      return json({ ok: true })
    }

    if (request.method === 'DELETE' && parts.length === 3) {
      const id = decodeURIComponent(parts[2])
      await env.DB.prepare('DELETE FROM favorites WHERE user_id = ? AND id = ?').bind(userId, id).run()
      return json({ ok: true })
    }

    return json({ error: 'not found' }, 404)
  },
}
