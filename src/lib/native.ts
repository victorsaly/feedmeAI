/**
 * The few places the iPhone app differs from the web app. Everything else is
 * the same code: the app is the built site inside a native shell (Capacitor).
 */

import { Capacitor } from '@capacitor/core'

/** true inside the iPhone (or Android) app, false in any browser */
export const isNative = Capacitor.isNativePlatform()

/**
 * A photo from the phone's own camera or library, as a File the rest of the
 * app already knows how to read. In the app this goes through the system's
 * camera and its own permission prompt rather than a web file input.
 * Resolves to null when the person backs out.
 */
export async function nativePhoto(from: 'camera' | 'library'): Promise<File | null> {
  const { Camera, MediaTypeSelection } = await import('@capacitor/camera')
  // the model reads a 768px copy; 1600 keeps the on-screen photo sharp without a 12MP upload
  const size = { quality: 85, targetWidth: 1600, targetHeight: 1600 }
  try {
    const shot = from === 'camera'
      ? await Camera.takePhoto({ ...size, correctOrientation: true })
      : (await Camera.chooseFromGallery({ ...size, mediaType: MediaTypeSelection.Photo, allowMultipleSelection: false })).results[0]
    if (!shot?.webPath) return null
    const blob = await (await fetch(shot.webPath)).blob()
    return new File([blob], 'photo.jpg', { type: blob.type || 'image/jpeg' })
  } catch {
    return null // cancelled, or permission refused: the buttons are still there to try again
  }
}

/** Hold the screen on (cooking) and let it sleep again. No-ops in a browser,
 *  which has its own wake lock (see use-wake-lock.ts). */
export async function keepAwake(on: boolean): Promise<boolean> {
  if (!isNative) return false
  try {
    const { KeepAwake } = await import('@capacitor-community/keep-awake')
    await (on ? KeepAwake.keepAwake() : KeepAwake.allowSleep())
    return on
  } catch {
    return false
  }
}

/* ---------- what only an app can do ---------- */

/** A small tap you can feel: ticking an item, adding to the list, a timer
 *  ending. Silent in a browser, where iPhones give a page no such thing. */
export async function haptic(kind: 'tick' | 'done' | 'alarm'): Promise<void> {
  if (!isNative) return
  try {
    const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics')
    if (kind === 'tick') await Haptics.impact({ style: ImpactStyle.Light })
    else await Haptics.notification({ type: kind === 'done' ? NotificationType.Success : NotificationType.Warning })
  } catch {
    // no taptic engine: nothing lost
  }
}

/** Hand text to the system share sheet. False when there is no sheet to
 *  hand it to, so the caller can copy it instead. */
export async function shareText(title: string, text: string): Promise<boolean> {
  try {
    if (isNative) {
      const { Share } = await import('@capacitor/share')
      await Share.share({ title, text, dialogTitle: title })
      return true
    }
    if (navigator.share) { await navigator.share({ title, text }); return true }
    return false
  } catch {
    return true // the sheet opened and was closed: that is an answer, not a failure
  }
}

const TIMER_ID = 4201 // one cooking timer at a time, so one fixed notification

/** Ring even if the phone is locked or the app is behind another: a cooking
 *  timer you only hear with the app open is not a timer. Asks for permission
 *  the first time. In a browser the on-screen timer is all there is. */
export async function ringAt(when: Date, title: string, body: string): Promise<void> {
  if (!isNative) return
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const { display } = await LocalNotifications.requestPermissions()
    if (display !== 'granted') return
    await LocalNotifications.schedule({ notifications: [{ id: TIMER_ID, title, body, schedule: { at: when }, sound: 'default' }] })
  } catch {
    // refused or unavailable: the timer on screen still runs
  }
}

export async function cancelRing(): Promise<void> {
  if (!isNative) return
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.cancel({ notifications: [{ id: TIMER_ID }] })
  } catch {
    // nothing was scheduled
  }
}
