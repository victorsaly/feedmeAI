import { useRef, useState } from 'react'
import { Camera, Images } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { optimizeForOpenAI } from '@/lib/image-optimizer'
import { isNative, nativePhoto } from '@/lib/native'

interface PhotoPickerProps {
  /** called with the full-size data URL (to show) and the 768px one (to send) */
  onPhoto: (display: string, forAnalysis: string) => void
  /** open the recorded sample run instead: no photo, no network */
  onSample?: () => void
  /** while the photo is being read, the fridge light breathes and shows it */
  looking?: string
}

/*
 * The first screen. On a phone the camera is the whole point, so it is the
 * one big button; the library is the second. On a desktop the same area
 * takes a drop. In the iPhone app both buttons go to the system's own camera
 * and photo library instead. Nothing here talks to the network. The third way in is the
 * recorded sample, for someone who wants to see a result before giving a photo.
 */
export function PhotoPicker({ onPhoto, onSample, looking }: PhotoPickerProps) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const libraryRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  // the photo waiting for a yes, the first time: it leaves the device for an AI service
  const [held, setHeld] = useState<File>()

  async function take(file: File | undefined, agreed = hasAgreed()) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('That is not a photo. Try a JPEG, PNG or HEIC.')
      return
    }
    if (!agreed) { setHeld(file); return }
    try {
      const [display, small] = await Promise.all([readAsDataURL(file), optimizeForOpenAI(file)])
      onPhoto(display, small)
    } catch {
      toast.error("Couldn't read that photo. Try another one.")
    }
  }

  return (
    <div
      className={`fridge ${over ? 'is-over' : ''} ${looking ? 'is-looking' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files[0]) }}
    >
      {held ? (
        <div className="consent" role="group" aria-labelledby="consent-title">
          <h2 id="consent-title">Before your first photo</h2>
          <p>
            To read it, your photo is sent to OpenAI, an AI service. We don’t store the photo, and it isn’t tied
            to your name. <a href="https://feedmeai.victorsaly.com/privacy/" target="_blank" rel="noopener noreferrer">How your data is handled</a>
          </p>
          <div className="consent-actions">
            <button type="button" className="btn btn-quiet" onClick={() => setHeld(undefined)}>Not now</button>
            <button type="button" className="btn btn-primary" onClick={() => { agree(); const file = held; setHeld(undefined); take(file, true) }}>
              Send my photo
            </button>
          </div>
        </div>
      ) : looking ? (
        <div className="analyzing" role="status">
          <span className="scan" aria-hidden="true">
            <img src={looking} alt="" />
          </span>
          <span className="analyzing-text">
            Looking…
            <span className="analyzing-sub">Reading what's on the shelves</span>
          </span>
        </div>
      ) : (
        <>
          <button type="button" className="btn btn-primary btn-xl" onClick={() => (isNative ? nativePhoto('camera').then((f) => take(f ?? undefined)) : cameraRef.current?.click())}>
            <Camera size={22} weight="bold" />
            Photograph it
          </button>
          <button type="button" className="btn btn-quiet btn-xl" onClick={() => (isNative ? nativePhoto('library').then((f) => take(f ?? undefined)) : libraryRef.current?.click())}>
            <Images size={22} />
            Choose a photo
          </button>
          {onSample && (
            <button type="button" className="btn btn-ghost picker-sample" onClick={onSample}>
              Try a sample photo
            </button>
          )}
          <p className="picker-hint">
            Open the door, or lay it out on the worktop. Good light, labels facing you.
            <span className="desktop-only"> Or drop a photo here.</span>
          </p>
        </>
      )}

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden
        onChange={(e) => { take(e.target.files?.[0]); e.target.value = '' }} />
      <input ref={libraryRef} type="file" accept="image/*" hidden
        onChange={(e) => { take(e.target.files?.[0]); e.target.value = '' }} />
    </div>
  )
}

const AGREED = 'feedme-ai-consent'
/** Asked once per device: sending a photo to a third-party AI is the
 *  person's call, and the App Store requires that it is asked. */
function hasAgreed(): boolean {
  try { return localStorage.getItem(AGREED) === 'yes' } catch { return false }
}
function agree() {
  try { localStorage.setItem(AGREED, 'yes') } catch { /* asked again next time */ }
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
}
