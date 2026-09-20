import { Trash, CaretRight, Camera } from '@phosphor-icons/react'
import { formatDistanceToNow } from 'date-fns'
import type { Haul } from '@/lib/history'

interface HaulHistoryProps {
  hauls: Haul[]
  onOpen: (haul: Haul) => void
  onRemove: (id: string) => void
}

/* Earlier photos, newest first: the thumbnail, what was in it, how many
 * ideas came of it. Tapping one brings that whole screen back as it was. */
export function HaulHistory({ hauls, onOpen, onRemove }: HaulHistoryProps) {
  if (hauls.length === 0) return null
  return (
    <section aria-labelledby="history-title" className="history">
      <header className="label">
        <h2 id="history-title" style={{ font: 'inherit', margin: 0, letterSpacing: 'inherit' }}>Recent</h2>
        <span className="label-note">kept on this device</span>
      </header>
      <ul className="idea-list">
        {hauls.map((h, n) => {
          const opened = Object.keys(h.recipes ?? {}).length
          return (
            <li key={h.id} className="idea saved-row" style={{ animationDelay: `${n * 45}ms` }}>
              <button type="button" className="idea-btn" onClick={() => onOpen(h)}>
                {h.photo ? <img className="saved-photo" src={h.photo} alt="" /> : <span className="saved-photo history-blank"><Camera size={18} /></span>}
                <span className="idea-main">
                  <span className="idea-title">{h.items.slice(0, 3).map((i) => i.name).join(', ')}{h.items.length > 3 ? ` +${h.items.length - 3}` : ''}</span>
                  <span className="idea-meta">
                    <span>{formatDistanceToNow(new Date(h.createdAt), { addSuffix: true })}</span>
                    <span>{h.ideas.length} ideas</span>
                    {opened > 0 && <span>{opened} opened</span>}
                  </span>
                </span>
                <CaretRight size={18} className="idea-caret" />
              </button>
              <button type="button" className="saved-remove" aria-label="Forget this one" onClick={() => onRemove(h.id)}>
                <Trash size={18} />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
