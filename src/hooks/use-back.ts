import { useEffect, useRef } from 'react'

export interface Layer {
  open: boolean
  /** what the back button does when this is the top open layer */
  close: () => void
}

/**
 * Make the back button close what is on top instead of leaving the app.
 *
 * The app has no routes: a recipe, the cooking screen and a photo's results
 * are all state. Each open one is a "layer", listed bottom to top; the number
 * open is how many entries this hook keeps in the browser's history. Opening
 * pushes one, closing in the app takes one back out, and a real back press
 * closes the top layer.
 */
export function useBack(layers: Layer[]) {
  const depth = useRef(0)
  const ours = useRef(false) // the next popstate is one we caused
  const latest = useRef(layers)
  latest.current = layers
  const want = layers.filter((l) => l.open).length

  useEffect(() => {
    const diff = want - depth.current
    if (diff > 0) for (let n = 0; n < diff; n++) history.pushState({ feedme: depth.current + n + 1 }, '')
    if (diff < 0) { ours.current = true; history.go(diff) }
    depth.current = want
  }, [want])

  useEffect(() => {
    // A reload keeps the entry's state but not the layers it stood for.
    if (history.state?.feedme) history.replaceState(null, '')
    const onPop = (e: PopStateEvent) => {
      if (ours.current) { ours.current = false; return }
      const target = Math.max(0, Number((e.state as { feedme?: number } | null)?.feedme ?? 0))
      if (target > depth.current) { ours.current = true; history.go(depth.current - target); return } // forward: nothing to reopen
      const open = latest.current.filter((l) => l.open)
      for (let n = depth.current; n > target && open.length; n--) open.pop()!.close()
      depth.current = target
    }
    addEventListener('popstate', onPop)
    return () => removeEventListener('popstate', onPop)
  }, [])
}
