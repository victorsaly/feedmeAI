import type { Idea } from '@/lib/kitchen'

/* Recipes to browse, as pictures: two to a row on a phone, more on a wide
 * screen. A recipe with no picture keeps its tile, with the name on the
 * interior-light ground, so the grid never has a hole in it. */
export function IdeaGrid({ ideas, onOpen }: { ideas: Idea[]; onOpen: (idea: Idea) => void }) {
  return (
    <ul className="tiles">
      {ideas.map((idea) => (
        <li key={idea.id}>
          <button type="button" className="strip-tile grid-tile" onClick={() => onOpen(idea)}>
            {idea.image ? <img src={idea.image} alt="" loading="lazy" /> : <span className="grid-blank" aria-hidden="true" />}
            <span className="strip-title">{idea.title}</span>
            <span className="strip-meta">{idea.minutes} min</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
