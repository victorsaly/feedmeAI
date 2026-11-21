import { ideaFromLocal, recipesForMeal, type Idea, type Meal } from '@/lib/kitchen'

/* Dinner with no photo at all: the built-in recipes for this time of day,
 * as pictures to flick through. Each opens the same sheet an idea does. */
export function RecipeStrip({ meal, onOpen }: { meal: Meal; onOpen: (idea: Idea) => void }) {
  const recipes = recipesForMeal(meal)
  if (recipes.length === 0) return null
  return (
    <section aria-labelledby="strip-title" className="strip">
      <header className="label">
        <h2 id="strip-title">Or cook one of these</h2>
        <span className="label-note">no photo needed</span>
      </header>
      <ul className="strip-row">
        {recipes.map((r) => (
          <li key={r.id}>
            <button type="button" className="strip-tile" onClick={() => onOpen(ideaFromLocal(r))}>
              <img src={r.heroImage} alt="" loading="lazy" />
              <span className="strip-title">{r.title}</span>
              <span className="strip-meta">{r.totalTime}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
