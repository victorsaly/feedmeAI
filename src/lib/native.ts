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
