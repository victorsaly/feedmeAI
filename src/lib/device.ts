/** "phone" on a phone, "device" on anything else: copy that says where
 *  something is kept should not call a laptop a phone. */
export const DEVICE = /Mobi|Android|iPhone|iPod/i.test(navigator.userAgent) ? 'phone' : 'device'

const ID_KEY = 'feedme-device'
let memory: string | undefined

/** A random name for this device, made once. It is how someone with no
 *  account gets their own daily allowance rather than sharing one with
 *  everybody on the same network. It says nothing about the device. */
export function deviceId(): string {
  try {
    const kept = localStorage.getItem(ID_KEY)
    if (kept) return kept
    const made = crypto.randomUUID()
    localStorage.setItem(ID_KEY, made)
    return made
  } catch {
    return (memory ??= crypto.randomUUID())
  }
}
