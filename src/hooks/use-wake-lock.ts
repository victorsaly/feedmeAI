import { useEffect, useState } from 'react'

/** Keep the screen on while this is mounted. The browser drops the lock when
 *  the page is hidden, so it is asked for again each time it comes back.
 *  Returns whether the screen is being held, for the screen to say so. */
export function useWakeLock(): boolean {
  const [held, setHeld] = useState(false)
  useEffect(() => {
    if (!('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let live = true
    const ask = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const got = await navigator.wakeLock.request('screen')
        if (!live) { got.release(); return }
        lock = got
        setHeld(true)
        got.addEventListener('release', () => setHeld(false))
      } catch {
        // low battery or refused: cooking still works, the screen just sleeps
      }
    }
    ask()
    document.addEventListener('visibilitychange', ask)
    return () => { live = false; document.removeEventListener('visibilitychange', ask); lock?.release().catch(() => {}) }
  }, [])
  return held
}
