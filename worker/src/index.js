/**
 * feedmeai-api
 *
 * Holds what the static site (GitHub Pages) never should: the SearchAPI key
 * behind the shopping search, the Spoonacular key behind real recipes and
 * cooking videos, and every signed-in user's todo list.
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

/**
 * The supermarkets worth sending someone to, per country, and how to reach
 * their search. `match` is tested against SearchAPI's free-form `seller`.
 * Only the ones with a real online shop: Aldi and Lidl are not here because
 * neither delivers groceries in the UK, so a link would go nowhere useful.
 *
 * The search-URL shapes are the retailers' public ones as of 2026-09; they
 * are not versioned APIs and a redesign can move them. Fix them here only.
 */
const shop = (key, label, match, search) => ({ key, label, match, search: (q) => search(encodeURIComponent(q)) });
const SUPERMARKETS = {
  gb: [
    shop("tesco", "Tesco", /tesco/i, (q) => `https://www.tesco.com/groceries/en-GB/search?query=${q}`),
    shop("sainsburys", "Sainsbury's", /sainsbury/i, (q) => `https://www.sainsburys.co.uk/gol-ui/SearchResults/${q}`),
    shop("asda", "ASDA", /asda/i, (q) => `https://groceries.asda.com/search/${q}`),
    shop("morrisons", "Morrisons", /morrisons/i, (q) => `https://groceries.morrisons.com/search?entry=${q}`),
    shop("waitrose", "Waitrose", /waitrose/i, (q) => `https://www.waitrose.com/ecom/shop/search?&searchTerm=${q}`),
    shop("ocado", "Ocado", /ocado/i, (q) => `https://www.ocado.com/search?entry=${q}`),
    shop("iceland", "Iceland", /iceland/i, (q) => `https://www.iceland.co.uk/search?q=${q}`),
    shop("coop", "Co-op", /co-?op/i, (q) => `https://shop.coop.co.uk/search?q=${q}`),
  ],
  // Other countries: no shortlist yet, so results pass through unfiltered
  // with Google's own links. Add a list here to turn filtering on.
};

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

    // Verified against a live response: the retailer is `seller` (free-form:
    // "Tesco", "sainsburys.co.uk", "Morrisons.com", "Asda Groceries"), and
    // every link SearchAPI gives is a Google Shopping page -- the retailer's
    // own URL is not exposed. So where we know the country's supermarkets we
    // keep only their listings and link to *their* search for the product.
    const stores = SUPERMARKETS[country] ?? [];
    const storeFor = (seller) => stores.find((s) => s.match.test(seller ?? ""));
    const results = data?.shopping_results ?? [];
    const kept = stores.length ? results.filter((r) => storeFor(r.seller)) : results;
    const items = kept.slice(0, 20).map((r) => {
      const store = storeFor(r.seller);
      return {
        title: r.title,
        price: r.price ?? null,
        link: store ? store.search(r.title ?? q) : (r.product_link ?? r.offers_link ?? null),
        googleLink: r.product_link ?? r.offers_link ?? null,
        source: store ? store.label : (r.seller ?? null),
        thumbnail: r.thumbnail ?? null,
        delivery: r.delivery_return ?? null,
      };
    });
    // The whole shortlist too, each with a search for the plain query, so the
    // page can offer "look on Ocado" even when Google surfaced nothing there.
    const shops = stores.map((s) => ({ key: s.key, label: s.label, link: s.search(q) }));
    return json({ items, shops }, { headers: { "cache-control": "public, max-age=300" } });
  }

  if (method === "GET" && pathname.startsWith("/v1/recipes/")) return recipes(request, env, url);
  if (pathname === "/v1/ai" || pathname.startsWith("/v1/ai/")) return ai(request, env, url);

  return json({ error: "not found" }, { status: 404 });
}

/* ---------- OpenAI, so the key never ships in the page ----------
 * The photo flow works signed out — that's the front door of the app — so
 * these are open, but metered: a daily count per address (per account
 * when signed in, which is more generous). The prompts live here rather
 * than in the browser so the proxy can only do what the app does. */

const OPENAI = "https://api.openai.com/v1";
const MODEL = "gpt-4o-mini";
const DAILY = { anonymous: 40, signedIn: 250 };

const MEAL_PHRASE = { breakfast: "breakfast dishes", lunch: "lunches", dinner: "dinners", dessert: "desserts" };

let usageReady = false;
/** How many AI calls this caller has made today, after counting this one. */
async function spend(request, env, user) {
  if (!usageReady) {
    await env.DB.prepare("CREATE TABLE IF NOT EXISTS usage (key TEXT PRIMARY KEY, count INTEGER NOT NULL, updated_at INTEGER NOT NULL)").run();
    usageReady = true;
  }
  const who = user ? `u:${user.id}` : `ip:${request.headers.get("cf-connecting-ip") ?? "unknown"}`;
  const key = `${who}:${new Date().toISOString().slice(0, 10)}`;
  const row = await env.DB.prepare(
    "INSERT INTO usage (key, count, updated_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = count + 1, updated_at = excluded.updated_at RETURNING count",
  ).bind(key, now()).first();
  return { count: row?.count ?? 1, limit: user ? DAILY.signedIn : DAILY.anonymous };
}

async function chatJSON(env, system, user, maxTokens) {
  const response = await fetch(`${OPENAI}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: maxTokens,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    }),
  }).catch(() => null);
  if (!response) return { error: json({ error: "the AI is unreachable" }, { status: 502 }) };
  if (response.status === 429) return { error: json({ error: "the AI is rate-limited right now" }, { status: 429 }) };
  if (!response.ok) return { error: json({ error: `the AI answered ${response.status}` }, { status: 502 }) };
  const data = await response.json().catch(() => null);
  const content = data?.choices?.[0]?.message?.content;
  if (!content) return { error: json({ error: "the AI answered nothing" }, { status: 502 }) };
  try {
    return { data: JSON.parse(content) };
  } catch {
    return { error: json({ error: "the AI answered nonsense" }, { status: 502 }) };
  }
}

const str = (s, max = 200) => (typeof s === "string" ? s.trim().slice(0, max) : "");
const strs = (a, max = 40) => (Array.isArray(a) ? a.filter((x) => typeof x === "string").map((x) => x.trim().slice(0, 80)).filter(Boolean).slice(0, max) : []);
/** { name, amount? } pairs — amount is a rough phrase from the vision model
 *  or the person's own edit, never a real measurement. */
const ingredientItems = (a, max = 40) =>
  Array.isArray(a)
    ? a
        .filter((x) => x && typeof x.name === "string" && x.name.trim())
        .map((x) => ({
          name: x.name.trim().slice(0, 80),
          amount: typeof x.amount === "string" && x.amount.trim() ? x.amount.trim().slice(0, 40) : undefined,
        }))
        .slice(0, max)
    : [];
const describeItems = (items) => items.map((i) => (i.amount ? `${i.name} (${i.amount})` : i.name)).join(", ");

async function ai(request, env, url) {
  if (request.method === "GET" && url.pathname === "/v1/ai") return json({ ready: Boolean(env.OPENAI_API_KEY) });
  if (request.method !== "POST") return json({ error: "not found" }, { status: 404 });
  if (!env.OPENAI_API_KEY) return json({ error: "the AI is not configured" }, { status: 503 });

  const user = await currentUser(request, env);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return json({ error: "bad request" }, { status: 400 });

  const { pathname } = url;
  if (pathname === "/v1/ai/image" && !user) return json({ error: "sign in first" }, { status: 401 });

  const { count, limit } = await spend(request, env, user);
  if (count > limit) return json({ error: "that's the AI's limit for today from here — sign in for more, or try tomorrow" }, { status: 429 });

  if (pathname === "/v1/ai/identify") {
    const image = str(body.image, 2_000_000);
    if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image)) return json({ error: "an image is required" }, { status: 400 });
    const { data, error } = await chatJSON(
      env,
      "You list the food ingredients visible in a photo of a fridge, cupboard, or worktop. " +
        'Be specific ("red bell pepper", "cheddar"), skip kitchenware and packaging you cannot read, ' +
        "merge duplicates, and give each a confidence from 0.5 to 1. Lowercase names. " +
        'Also judge roughly how much of each is visible, in 2-4 words ("a small piece", "half a bag", ' +
        '"plenty", "one"). This is a rough guess from a photo, not a measurement — keep it vague, never ' +
        "invent a precise weight or count you can't actually see. " +
        'Reply with JSON: {"ingredients":[{"name":"...","confidence":0.9,"amount":"a small piece"}]}',
      [
        { type: "text", text: "What food is in this photo?" },
        { type: "image_url", image_url: { url: image, detail: "low" } },
      ],
      500,
    );
    if (error) return error;
    return json({ ingredients: Array.isArray(data.ingredients) ? data.ingredients : [] });
  }

  if (pathname === "/v1/ai/suggest") {
    const items = ingredientItems(body.items);
    const meal = MEAL_PHRASE[body.meal] ? body.meal : "dinner";
    if (!items.length) return json({ error: "ingredients are required" }, { status: 400 });
    const { data, error } = await chatJSON(
      env,
      `You are a practical home cook. Given what someone has in, propose 5 ${MEAL_PHRASE[meal]} they could make. ` +
        "Prefer dishes that use several of their items and need at most 2–3 extras beyond pantry staples " +
        "(salt, pepper, oil, butter, sugar, flour, vinegar, soy sauce, stock, dried herbs and spices). " +
        "The amount in parentheses after an item, when given, is a rough guess of how much is actually " +
        "there — take it seriously: a small piece of chicken suits one modest serving, not a family roast. " +
        'If an item is scarce, either size the whole dish to it or name it in "missing" as needing more, ' +
        'never assume there is more of something than described. ' +
        'Mix quick and slower, plain and interesting. "uses" must repeat their item names exactly, without the amount. ' +
        'Reply with JSON: {"ideas":[{"title":"...","blurb":"one sentence, why it suits what they have",' +
        '"minutes":25,"uses":["..."],"missing":["..."]}]}',
      [{ type: "text", text: `They have: ${describeItems(items)}.` }],
      900,
    );
    if (error) return error;
    return json({ ideas: Array.isArray(data.ideas) ? data.ideas : [] });
  }

  if (pathname === "/v1/ai/expand") {
    const title = str(body.title);
    const blurb = str(body.blurb, 300);
    const items = ingredientItems(body.items);
    const uses = strs(body.uses);
    const missing = strs(body.missing);
    if (!title) return json({ error: "a title is required" }, { status: 400 });
    const { data, error } = await chatJSON(
      env,
      "Write a clear, reliable home recipe. Metric and imperial quantities where useful. " +
        "Short numbered steps, each one action, with the timing or cue for doneness inside the step. " +
        "Where an ingredient's amount was described as scarce, keep this recipe's own quantity for it " +
        "realistic against that — don't call for far more of it than what's actually there. " +
        "Also estimate the nutrition per serving as best you reasonably can from the ingredients — " +
        "say so is an estimate, not a lab figure. " +
        'Reply with JSON: {"description":"two sentences","minutes":25,"difficulty":"Easy|Medium|Hard",' +
        '"ingredients":["quantity + item", ...],"steps":["...", ...],' +
        '"nutrition":{"calories":420,"protein":"18g","carbs":"52g","fat":"14g"}}',
      [
        {
          type: "text",
          text:
            `Recipe: ${title}. ${blurb}\n` +
            `They have: ${items.length ? describeItems(items) : "not said"}.\n` +
            `Build it around: ${uses.join(", ") || title}. Extras allowed: ${missing.join(", ") || "pantry staples only"}.`,
        },
      ],
      1200,
    );
    if (error) return error;
    return json(data);
  }

  if (pathname === "/v1/ai/image") {
    const title = str(body.title);
    const blurb = str(body.blurb, 300);
    if (!title) return json({ error: "a title is required" }, { status: 400 });
    const response = await fetch(`${OPENAI}/images/generations`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt:
          `A simple, appetising photo of the finished dish "${title}" — ${blurb} ` +
          "Natural light, on a plate, shot from above. No text, no hands, no branding.",
        n: 1,
        size: "1024x1024",
        quality: "standard",
      }),
    }).catch(() => null);
    if (!response || !response.ok) return json({ url: null });
    const data = await response.json().catch(() => null);
    return json({ url: data?.data?.[0]?.url ?? null });
  }

  return json({ error: "not found" }, { status: 404 });
}

/* ---------- Spoonacular, behind the same sign-in as shopping search ----------
 * The free tier is 150 points a day, so anonymous traffic must not be able
 * to spend it. Results are reshaped to what the app already understands
 * (Idea / Recipe in src/lib/kitchen.ts) so the browser never sees the raw
 * Spoonacular schema and the key never leaves here. */

const MEAL_TYPE = { breakfast: "breakfast", lunch: "main course", dinner: "main course", dessert: "dessert" };

async function spoonacular(env, path, params) {
  const target = new URL(`https://api.spoonacular.com${path}`);
  for (const [k, v] of Object.entries(params)) target.searchParams.set(k, String(v));
  target.searchParams.set("apiKey", env.SPOONACULAR_KEY);
  const response = await fetch(target).catch(() => null);
  if (!response) return { error: json({ error: "recipe search failed" }, { status: 502 }) };
  if (response.status === 402) return { error: json({ error: "recipe search is over its daily limit" }, { status: 503 }) };
  if (!response.ok) return { error: json({ error: "recipe search failed" }, { status: 502 }) };
  const data = await response.json().catch(() => null);
  if (!data) return { error: json({ error: "recipe search failed" }, { status: 502 }) };
  return { data };
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const stripHtml = (s) =>
  typeof s === "string"
    ? s
        .replace(/<[^>]+>/g, "")
        .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) =>
          e[0] === "#" ? String.fromCodePoint(parseInt(e.slice(e[1] === "x" ? 2 : 1), e[1] === "x" ? 16 : 10)) : ENTITIES[e.toLowerCase()] ?? m,
        )
        .replace(/\s+/g, " ")
        .trim()
    : "";
const names = (list) => (Array.isArray(list) ? list.map((i) => i?.name).filter((n) => typeof n === "string") : []);

/** One complexSearch result as the app's idea row. */
const found = (r) => ({
  id: r.id,
  title: stripHtml(r.title),
  image: r.image ?? null,
  minutes: typeof r.readyInMinutes === "number" ? r.readyInMinutes : null,
  uses: names(r.usedIngredients),
  missing: names(r.missedIngredients),
});

/** One embeddable YouTube video of the dish being made, via the Data API,
 *  or null. Length isn't in the search response and isn't worth a second
 *  call. */
async function youtube(env, title) {
  const search = new URL("https://www.googleapis.com/youtube/v3/search");
  search.searchParams.set("part", "snippet");
  search.searchParams.set("type", "video");
  search.searchParams.set("videoEmbeddable", "true");
  search.searchParams.set("safeSearch", "strict");
  search.searchParams.set("maxResults", "1");
  search.searchParams.set("q", `${title} recipe`);
  search.searchParams.set("key", env.YOUTUBE_API_KEY);
  const response = await fetch(search).catch(() => null);
  if (!response || !response.ok) return null;
  const data = await response.json().catch(() => null);
  const hit = data?.items?.[0];
  if (!hit?.id?.videoId) return null;
  return {
    youtubeId: hit.id.videoId,
    title: stripHtml(hit.snippet?.title ?? title),
    thumbnail: hit.snippet?.thumbnails?.high?.url ?? hit.snippet?.thumbnails?.default?.url ?? null,
    seconds: null,
  };
}

/** The title as given, then just the dish: before any "with"/"(",
 *  capped at three words. Skips a retry that would repeat the first. */
function queriesFor(title) {
  const core = title.split(/\s+(?:with|in|on|and|&|-|–|—)\s+|[(,:]/i)[0].trim().split(/\s+/).slice(0, 3).join(" ");
  return core && core.toLowerCase() !== title.toLowerCase() ? [title, core] : [title];
}

/** "Calories" → 420, "Protein" → "18g" — the four the app shows. */
function nutritionOf(info) {
  const nutrients = info?.nutrition?.nutrients;
  if (!Array.isArray(nutrients)) return null;
  const find = (name) => nutrients.find((n) => n?.name === name);
  const cal = find("Calories");
  if (!cal || typeof cal.amount !== "number") return null;
  const grams = (name) => { const n = find(name); return n && typeof n.amount === "number" ? `${Math.round(n.amount)}g` : "—"; };
  return { calories: Math.round(cal.amount), protein: grams("Protein"), carbs: grams("Carbohydrates"), fat: grams("Fat") };
}

function stepsOf(info) {
  const steps = (info?.analyzedInstructions ?? []).flatMap((block) => (block?.steps ?? []).map((s) => stripHtml(s?.step)));
  const clean = steps.filter(Boolean);
  if (clean.length) return clean;
  // Older entries only carry one prose blob; split it into sentences.
  return stripHtml(info?.instructions).split(/(?<=[.!?])\s+(?=[A-Z])/).map((s) => s.trim()).filter(Boolean);
}

async function recipes(request, env, url) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "sign in first" }, { status: 401 });
  if (!env.SPOONACULAR_KEY) return json({ error: "recipe search is not configured" }, { status: 503 });
  const { pathname } = url;

  if (pathname === "/v1/recipes/by-ingredients") {
    const ingredients = (url.searchParams.get("ingredients") ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).slice(0, 20);
    if (!ingredients.length) return json({ error: "missing ingredients" }, { status: 400 });
    const type = MEAL_TYPE[url.searchParams.get("meal") ?? ""];
    const number = Math.min(Math.max(parseInt(url.searchParams.get("number") ?? "4", 10) || 4, 1), 8);

    const { data, error } = await spoonacular(env, "/recipes/complexSearch", {
      includeIngredients: ingredients.join(","),
      ...(type ? { type } : {}),
      fillIngredients: true,
      addRecipeInformation: true,
      ignorePantry: true,
      sort: "max-used-ingredients",
      number,
    });
    if (error) return error;
    return json({ items: (data.results ?? []).map(found) }, { headers: { "cache-control": "private, max-age=3600" } });
  }

  if (pathname === "/v1/recipes/search") {
    const q = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
    const pick = (name, allowed) => {
      const v = (url.searchParams.get(name) ?? "").trim().toLowerCase();
      return v && allowed.test(v) ? v : "";
    };
    const cuisine = pick("cuisine", /^[a-z ]{2,30}$/);
    const type = pick("type", /^[a-z ]{2,30}$/) || MEAL_TYPE[url.searchParams.get("meal") ?? ""] || "";
    const diet = pick("diet", /^[a-z ]{2,30}$/);
    const maxReadyTime = Math.min(parseInt(url.searchParams.get("maxReadyTime") ?? "", 10) || 0, 600);
    if (!q && !cuisine && !diet && !maxReadyTime && !pick("type", /^[a-z ]{2,30}$/)) return json({ error: "missing query" }, { status: 400 });
    const number = Math.min(Math.max(parseInt(url.searchParams.get("number") ?? "12", 10) || 12, 1), 20);

    const { data, error } = await spoonacular(env, "/recipes/complexSearch", {
      ...(q ? { query: q } : {}),
      ...(cuisine ? { cuisine } : {}),
      ...(type ? { type } : {}),
      ...(diet ? { diet } : {}),
      ...(maxReadyTime ? { maxReadyTime } : {}),
      addRecipeInformation: true,
      sort: q ? "popularity" : "random",
      number,
    });
    if (error) return error;
    return json({ items: (data.results ?? []).map(found) }, { headers: { "cache-control": "private, max-age=3600" } });
  }

  if (pathname === "/v1/recipes/videos") {
    const q = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
    if (!q) return json({ error: "missing query" }, { status: 400 });
    // The model's titles run long ("Garlicky Tomato Spaghetti with a Soft
    // Egg"); a miss retries on the dish itself, the first few words.
    let video = null;
    for (const query of queriesFor(q)) {
      const { data, error } = await spoonacular(env, "/food/videos/search", { query, number: 1 });
      if (error) return error;
      const v = (data.videos ?? [])[0];
      if (v?.youTubeId) {
        video = { youtubeId: v.youTubeId, title: stripHtml(v.title ?? v.shortTitle), thumbnail: v.thumbnail ?? null, seconds: typeof v.length === "number" ? v.length : null };
        break;
      }
    }
    // Spoonacular's video index is thin; YouTube itself has nearly everything.
    if (!video && env.YOUTUBE_API_KEY) video = await youtube(env, q);
    return json({ video }, { headers: { "cache-control": "private, max-age=86400" } });
  }

  if (pathname === "/v1/recipes/image") {
    const q = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
    if (!q) return json({ error: "missing query" }, { status: 400 });
    let image = null;
    for (const query of queriesFor(q)) {
      const { data, error } = await spoonacular(env, "/recipes/complexSearch", { query, number: 1 });
      if (error) return error;
      const hit = (data.results ?? [])[0];
      if (hit?.image) { image = hit.image; break; }
    }
    return json({ image }, { headers: { "cache-control": "private, max-age=86400" } });
  }

  const one = pathname.match(/^\/v1\/recipes\/(\d{1,9})$/);
  if (one) {
    const { data, error } = await spoonacular(env, `/recipes/${one[1]}/information`, { includeNutrition: true });
    if (error) return error;
    const recipe = {
      id: data.id,
      title: stripHtml(data.title),
      image: data.image ?? null,
      minutes: typeof data.readyInMinutes === "number" ? data.readyInMinutes : null,
      servings: typeof data.servings === "number" ? data.servings : null,
      summary: stripHtml(data.summary).split(/(?<=[.!?])\s+/).slice(0, 2).join(" "),
      ingredients: (data.extendedIngredients ?? []).map((i) => stripHtml(i?.original)).filter(Boolean),
      steps: stepsOf(data),
      nutrition: nutritionOf(data),
      sourceName: data.sourceName ?? data.creditsText ?? null,
      sourceUrl: data.sourceUrl ?? data.spoonacularSourceUrl ?? null,
    };
    return json({ recipe }, { headers: { "cache-control": "private, max-age=86400" } });
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
