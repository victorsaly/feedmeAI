import { useSyncExternalStore } from 'react'

const subscribe = (cb: () => void) => {
  addEventListener('online', cb)
  addEventListener('offline', cb)
  return () => { removeEventListener('online', cb); removeEventListener('offline', cb) }
}

/** Whether the device believes it has a connection. Good enough to warn
 *  before a photo is spent on a request that cannot leave the phone. */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
}
