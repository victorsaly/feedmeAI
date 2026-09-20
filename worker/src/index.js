/**
 * feedmeai-api
 *
 * Holds what the static site (GitHub Pages) never should: the SearchAPI key
 * behind the shopping search, and every signed-in user's todo list.
 *
 * Sign-in itself is not implemented here. It belongs to arcade-api
 * (api.victorsaly.com), which already runs Google OAuth for the other
 * victorsaly.com sites -- one account, one name, across all of them. This
 * worker holds no session secret of its own; every request is checked by
 * asking arcade-api who the bearer token belongs to. That costs one extra
 * fetch per request and buys real isolation: leaking this worker's secrets
 * never leaks a session, and this worker cannot mint one.
 */

const json = (data, init = {}) =>
  new Response(JSON.stringify(data), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json; charset=utf-8", ...(init.headers ?? {}) },
  });

const origins = (env) => (env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

const CORS = (origin, allowed) => ({
  "access-control-allow-origin": allowed.includes(origin) ? origin : allowed[0] ?? "",
  "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "access-control-allow-headers": "content-type,authorization",
  "access-control-max-age": "86400",
  vary: "origin",
});

const now = () => Math.floor(Date.now() / 1000);

/** Who this bearer token belongs to, per arcade-api -- or null. */
async function currentUser(request, env) {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;
  const response = await fetch(`${env.ARCADE_API}/v1/me`, { headers: { authorization: header } }).catch(() => null);
  if (!response || !response.ok) return null;
  return response.json().catch(() => null);
}

async function route(request, env, url) {
  const { pathname } = url;
  const method = request.method;

  if (pathname === "/v1/todos") {
    const user = await currentUser(request, env);
    if (!user) return json({ error: "sign in first" }, { status: 401 });

    if (method === "GET") {
      const { results } = await env.DB.prepare(
        "SELECT id, recipe_id AS recipeId, recipe_name AS recipeName, ingredient, checked, created_at AS createdAt FROM todos WHERE user_id = ? ORDER BY created_at DESC",
      ).bind(user.id).all();
      return json({ todos: (results ?? []).map((t) => ({ ...t, checked: Boolean(t.checked) })) });
    }

    if (method === "POST") {
      const body = await request.json().catch(() => null);
      const ingredient = typeof body?.ingredient === "string" ? body.ingredient.trim() : "";
      if (!ingredient || ingredient.length > 200) return json({ error: "an ingredient is required" }, { status: 400 });
      const recipeId = typeof body?.recipeId === "string" ? body.recipeId.slice(0, 100) : null;
      const recipeName = typeof body?.recipeName === "string" ? body.recipeName.slice(0, 200) : null;
      const id = crypto.randomUUID();
      await env.DB.prepare(
        "INSERT INTO todos (id, user_id, recipe_id, recipe_name, ingredient, checked, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)",
      ).bind(id, user.id, recipeId, recipeName, ingredient, now()).run();
      return json({ id, recipeId, recipeName, ingredient, checked: false }, { status: 201 });
    }
  }

  const todoMatch = pathname.match(/^\/v1\/todos\/([\w-]+)$/);
  if (todoMatch) {
    const user = await currentUser(request, env);
    if (!user) return json({ error: "sign in first" }, { status: 401 });
    const id = todoMatch[1];

    if (method === "PATCH") {
      const body = await request.json().catch(() => null);
      if (typeof body?.checked !== "boolean") return json({ error: "bad request" }, { status: 400 });
      const result = await env.DB.prepare("UPDATE todos SET checked = ? WHERE id = ? AND user_id = ?")
        .bind(body.checked ? 1 : 0, id, user.id)
        .run();
      if (!result.meta.changes) return json({ error: "not found" }, { status: 404 });
      return json({ ok: true });
    }

    if (method === "DELETE") {
      const result = await env.DB.prepare("DELETE FROM todos WHERE id = ? AND user_id = ?").bind(id, user.id).run();
      if (!result.meta.changes) return json({ error: "not found" }, { status: 404 });
      return json({ ok: true });
    }
  }

  if (method === "GET" && pathname === "/v1/shopping/search") {
    const user = await currentUser(request, env);
    if (!user) return json({ error: "sign in first" }, { status: 401 });

    const q = (url.searchParams.get("q") ?? "").trim();
    const country = (url.searchParams.get("country") ?? "").toLowerCase();
    if (!q) return json({ error: "missing query" }, { status: 400 });
    if (!/^[a-z]{2}$/.test(country)) return json({ error: "a two-letter country code is required" }, { status: 400 });
    if (!env.SEARCHAPI_KEY) return json({ error: "shopping search is not configured" }, { status: 503 });

    const search = new URL("https://www.searchapi.io/api/v1/search");
    search.searchParams.set("engine", "google_shopping");
    search.searchParams.set("q", q.slice(0, 200));
    search.searchParams.set("gl", country);
    search.searchParams.set("api_key", env.SEARCHAPI_KEY);

    const response = await fetch(search).catch(() => null);
    if (!response || !response.ok) return json({ error: "shopping search failed" }, { status: 502 });
    const data = await response.json().catch(() => null);
    const items = (data?.shopping_results ?? []).slice(0, 20).map((r) => ({
      title: r.title,
      price: r.price ?? null,
      link: r.product_link ?? r.link ?? null,
      source: r.source ?? null,
      thumbnail: r.thumbnail ?? null,
    }));
    return json({ items }, { headers: { "cache-control": "public, max-age=300" } });
  }

  return json({ error: "not found" }, { status: 404 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("origin") ?? "";
    const cors = CORS(origin, origins(env));
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    try {
      const response = await route(request, env, url);
      for (const [k, v] of Object.entries(cors)) response.headers.set(k, v);
      return response;
    } catch (error) {
      console.error("feedmeai-api", error?.stack ?? error);
      return json({ error: "unavailable" }, { status: 500, headers: cors });
    }
  },
};
