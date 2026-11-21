import { CaretRight } from '@phosphor-icons/react'
import { SAMPLE } from '@/lib/sample'

/* A real result on the first screen, before anyone spends a photo: the
 * sample photo with what was read in it stuck on, and what it turned into.
 * Tapping it opens the whole recorded run. */
export function SampleCard({ onOpen }: { onOpen: () => void }) {
  const { items, ideas, photo } = SAMPLE
  return (
    <section aria-labelledby="sample-title" className="sample">
      <header className="label">
        <h2 id="sample-title">From a sample photo</h2>
        <span className="label-note">recorded, no AI call</span>
      </header>
      <button type="button" className="sample-card" onClick={onOpen}>
        <span className="sample-photo">
          <img src={photo} alt="" />
          <span className="sample-magnets" aria-hidden="true">
            {items.slice(0, 3).map((i) => <span key={i.name} className="magnet"><span className="magnet-name">{i.name}</span></span>)}
            <span className="magnet">+{items.length - 3}</span>
          </span>
        </span>
        <span className="sample-text">
          <span className="sample-title">{items.length} things in, {ideas.length} dinners out</span>
          <span className="sample-ideas">{ideas.slice(0, 3).map((i) => i.title).join(' · ')}</span>
        </span>
        <CaretRight size={18} className="idea-caret" />
      </button>
    </section>
  )
}
