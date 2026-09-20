import { useRef, useState } from 'react'
import { Camera, Images } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { optimizeForOpenAI } from '@/lib/image-optimizer'

interface PhotoPickerProps {
  /** called with the full-size data URL (to show) and the 768px one (to send) */
  onPhoto: (display: string, forAnalysis: string) => void
  /** while the photo is being read, the fridge light breathes and shows it */
  looking?: string
}

/*
 * The first screen. On a phone the camera is the whole point, so it is the
 * one big button; the library is the second. On a desktop the same area
 * takes a drop. Nothing here talks to the network.
 */
export function PhotoPicker({ onPhoto, looking }: PhotoPickerProps) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const libraryRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  async function take(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('That is not a photo. Try a JPEG, PNG or HEIC.')
      return
    }
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
      {looking ? (
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
          <button type="button" className="btn btn-primary btn-xl" onClick={() => cameraRef.current?.click()}>
            <Camera size={22} weight="bold" />
            Photograph it
          </button>
          <button type="button" className="btn btn-quiet btn-xl" onClick={() => libraryRef.current?.click()}>
            <Images size={22} />
            Choose a photo
          </button>
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

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
}
