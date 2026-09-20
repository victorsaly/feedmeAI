import { CaretRight, ArrowsClockwise } from '@phosphor-icons/react'
import type { Idea } from '@/lib/kitchen'

interface IdeaListProps {
  ideas: Idea[]
  state: 'idle' | 'loading' | 'ready' | 'error' | 'stale'
  source?: 'ai' | 'local'
  onOpen: (idea: Idea) => void
  onRefresh: () => void
  /** no heading — the section around it already has one */
  quiet?: boolean
  /** what went wrong, when state is 'error' */
  error?: string
  /** the h2 text — defaults to "Tonight" */
  heading?: string
  /** overrides the default empty-state copy */
  emptyMessage?: string
}

/*
 * The draft: a short list of dishes, each one line of why and what it costs
 * you in extras. Tapping one writes it out fully. When the list above has
 * been edited the draft is "stale" and offers to redo itself rather than
 * silently changing under the reader.
 */
export function IdeaList({ ideas, state, source, onOpen, onRefresh, quiet, error, heading = 'Tonight', emptyMessage }: IdeaListProps) {
  return (
    <section aria-labelledby={quiet ? undefined : 'ideas-title'} aria-busy={state === 'loading'}>
      {!quiet && <header className="label">
        <h2 id="ideas-title" style={{ font: 'inherit', margin: 0, letterSpacing: 'inherit' }}>{heading}</h2>
        {state === 'stale' && (
          <button type="button" className="btn btn-small" onClick={onRefresh}>
            <ArrowsClockwise size={16} weight="bold" /> Update ideas
          </button>
        )}
        {state === 'ready' && source === 'local' && (
          <span className="label-note">built-in recipes, no AI key set</span>
        )}
      </header>}

      {state === 'loading' && (
        <ul className="idea-list" aria-hidden="true">
          {[0, 1, 2, 3].map((n) => (
            <li key={n} className="idea idea-skeleton" style={{ animationDelay: `${n * 80}ms` }}>
              <span className="sk sk-title" />
              <span className="sk sk-line" />
              <span className="sk sk-meta" />
            </li>
          ))}
        </ul>
      )}

      {state === 'error' && (
        <div className="ideas-empty">
          <p>{error ?? "Couldn't reach the kitchen. Check the connection and try again."}</p>
          <button type="button" className="btn btn-small" onClick={onRefresh}>Try again</button>
        </div>
      )}

      {(state === 'ready' || state === 'stale') && ideas.length === 0 && (
        <div className="ideas-empty">
          <p>{emptyMessage ?? 'Nothing came back for that list. Add a couple more things and try again.'}</p>
        </div>
      )}

      {(state === 'ready' || state === 'stale') && ideas.length > 0 && (
        <ul className={`idea-list ${state === 'stale' ? 'is-stale' : ''}`}>
          {ideas.map((idea, n) => (
            <li key={idea.id} className="idea" style={{ animationDelay: `${n * 45}ms` }}>
              <button type="button" className="idea-btn" onClick={() => onOpen(idea)}>
                {idea.image && <img className="idea-thumb" src={idea.image} alt="" />}
                <span className="idea-main">
                  <span className="idea-title">{idea.title}</span>
                  <span className="idea-blurb">{idea.blurb}</span>
                  <span className="idea-meta">
                    <span>{idea.minutes} min</span>
                    {idea.uses.length > 0 && <span>uses {idea.uses.length} of yours</span>}
                    {idea.missing.length > 0 && (
                      <span className="idea-missing">needs {idea.missing.slice(0, 3).join(', ')}</span>
                    )}
                    {idea.uses.length > 0 && idea.missing.length === 0 && (
                      <span className="idea-complete">nothing extra</span>
                    )}
                  </span>
                </span>
                <CaretRight size={18} className="idea-caret" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
