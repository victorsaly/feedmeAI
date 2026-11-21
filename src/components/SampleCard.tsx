import { CaretRight } from '@phosphor-icons/react'
import { SAMPLE } from '@/lib/sample'

/* A real result on the first screen, before anyone spends a photo: what one
 * photo turned into. Tapping it opens the whole recorded run. */
export function SampleCard({ onOpen }: { onOpen: () => void }) {
  const { items, ideas, photo } = SAMPLE
  const lead = ideas.find((i) => i.missing.length > 1) ?? ideas[0]
  return (
    <section aria-labelledby="sample-title" className="history">
      <header className="label">
        <h2 id="sample-title" style={{ font: 'inherit', margin: 0, letterSpacing: 'inherit' }}>From a sample photo</h2>
        <span className="label-note">recorded, no AI call</span>
      </header>
      <ul className="idea-list">
        <li className="idea saved-row">
          <button type="button" className="idea-btn" onClick={onOpen}>
            <img className="saved-photo" src={photo} alt="" />
            <span className="idea-main">
              <span className="idea-title">{items.length} things in, {ideas.length} dinners out</span>
              <span className="idea-blurb">
                {items.slice(0, 3).map((i) => i.name).join(', ')} +{items.length - 3}
              </span>
              <span className="idea-meta">
                <span>{lead.title}</span>
                <span>{lead.minutes} min</span>
                <span className="idea-missing">needs {lead.missing.join(', ')}</span>
              </span>
            </span>
            <CaretRight size={18} className="idea-caret" />
          </button>
        </li>
      </ul>
    </section>
  )
}
