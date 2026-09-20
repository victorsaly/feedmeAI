/**
 * The shopping/todo list, kept server-side under whichever account is
 * signed in — feedmeai-api, not arcade-api, since a todo list isn't a game
 * score. Every call needs a session token from `@/lib/account`.
 */

const API = import.meta.env.VITE_FEEDME_API ?? 'https://feedmeai-api.still-union-ef8a.workers.dev'

export interface Todo {
  id: string
  recipeId: string | null
  recipeName: string | null
  ingredient: string
  checked: boolean
}

async function call<T>(path: string, token: string, opts: { method?: string; body?: unknown } = {}): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, {
      method: opts.method ?? 'GET',
      cache: 'no-store',
      headers: {
        authorization: `Bearer ${token}`,
        ...(opts.body ? { 'content-type': 'application/json' } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function listTodos(token: string): Promise<Todo[]> {
  const data = await call<{ todos: Todo[] }>('/v1/todos', token)
  return data?.todos ?? []
}

export async function addTodo(
  token: string,
  ingredient: string,
  recipe?: { id: string; name: string },
): Promise<Todo | null> {
  return call<Todo>('/v1/todos', token, {
    method: 'POST',
    body: { ingredient, recipeId: recipe?.id, recipeName: recipe?.name },
  })
}

export async function setTodoChecked(token: string, id: string, checked: boolean): Promise<boolean> {
  const data = await call<{ ok: boolean }>(`/v1/todos/${id}`, token, { method: 'PATCH', body: { checked } })
  return Boolean(data?.ok)
}

export async function removeTodo(token: string, id: string): Promise<boolean> {
  const data = await call<{ ok: boolean }>(`/v1/todos/${id}`, token, { method: 'DELETE' })
  return Boolean(data?.ok)
}
