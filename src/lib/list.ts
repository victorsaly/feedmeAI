/**
 * The shopping list, held on this device first.
 *
 * It is read in a supermarket, where the signal goes, and by people who have
 * not signed in. So the copy in this browser is the one the screen shows:
 * every change lands here at once. With an account, the same change is sent
 * to feedmeai-api (see todos.ts) so the list follows you to another device;
 * anything that could not be sent is remembered and sent the next time the
 * list loads. Without an account it simply stays here.
 */

import { useSyncExternalStore } from 'react'
import { addTodo, fetchTodos, removeTodo, setTodoChecked, type Todo } from '@/lib/todos'

export type Item = Todo

const KEY = 'feedme-list'
const PENDING_KEY = 'feedme-list-pending'

/** changes made while the server could not be reached */
interface Pending { checked: Record<string, boolean>; removed: string[] }

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
const write = (key: string, value: unknown) => {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* private mode: kept for this visit only */ }
}

// what is in storage is only trusted if it has the shape it should: a list that is not a list would stop the app opening
const kept = read<unknown>(KEY, [])
let items: Item[] = Array.isArray(kept) ? (kept as Item[]).filter((i) => i && typeof i.id === 'string' && typeof i.ingredient === 'string') : []
const queued = read<Partial<Pending> | null>(PENDING_KEY, null)
let pending: Pending = { checked: queued?.checked && typeof queued.checked === 'object' ? queued.checked : {}, removed: Array.isArray(queued?.removed) ? queued.removed : [] }
const listeners = new Set<() => void>()

function set(next: Item[]) {
  items = next
  write(KEY, items)
  for (const l of listeners) l()
}
const savePending = () => write(PENDING_KEY, pending)
const isLocal = (id: string) => id.startsWith('local-')

export function useList(): Item[] {
  return useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb) }, () => items, () => items)
}

/** Bring this device and the account into line: send what is only here,
 *  then take the account's list. Offline, the list on screen is left as is. */
export async function syncList(token: string | null): Promise<void> {
  if (!token) return
  for (const item of items.filter((i) => isLocal(i.id))) {
    const made = await addTodo(token, item.ingredient, item.recipeId && item.recipeName ? { id: item.recipeId, name: item.recipeName } : undefined)
    if (!made) return // no connection: try again next time
    if (item.checked) await setTodoChecked(token, made.id, true)
    set(items.map((i) => (i.id === item.id ? { ...made, checked: item.checked } : i)))
  }
  for (const id of [...pending.removed]) {
    if (await removeTodo(token, id)) pending.removed = pending.removed.filter((r) => r !== id)
  }
  for (const [id, checked] of Object.entries(pending.checked)) {
    if (await setTodoChecked(token, id, checked)) delete pending.checked[id]
  }
  savePending()
  const fresh = await fetchTodos(token)
  if (fresh) set(fresh.filter((t) => !pending.removed.includes(t.id)).map((t) => (t.id in pending.checked ? { ...t, checked: pending.checked[t.id] } : t)))
}

export async function addItem(token: string | null, ingredient: string, recipe?: { id: string; name: string }): Promise<Item> {
  const local: Item = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ingredient,
    recipeId: recipe?.id ?? null,
    recipeName: recipe?.name ?? null,
    checked: false,
  }
  set([local, ...items])
  if (!token) return local
  const made = await addTodo(token, ingredient, recipe)
  if (!made) return local // stays here, sent on the next sync
  set(items.map((i) => (i.id === local.id ? made : i)))
  return made
}

export async function checkItem(token: string | null, id: string, checked: boolean): Promise<void> {
  set(items.map((i) => (i.id === id ? { ...i, checked } : i)))
  if (!token || isLocal(id)) return
  if (!(await setTodoChecked(token, id, checked))) { pending.checked[id] = checked; savePending() }
}

export async function removeItem(token: string | null, id: string): Promise<void> {
  set(items.filter((i) => i.id !== id))
  if (!token || isLocal(id)) return
  if (!(await removeTodo(token, id))) { pending.removed.push(id); savePending() }
}

/** Forget the list on this device as well: for deleting an account's data. */
export function clearList(): void {
  pending = { checked: {}, removed: [] }
  savePending()
  set([])
}

/** When signing out, what is on screen stays on this device as a local list. */
export function keepLocally(): void {
  pending = { checked: {}, removed: [] }
  savePending()
  set(items.map((i) => (isLocal(i.id) ? i : { ...i, id: `local-${i.id}` })))
}
