import { MEALS, type Meal } from '@/lib/kitchen'

interface MealPickerProps {
  value: Meal
  onChange: (meal: Meal) => void
}

/*
 * One segmented control, four meals. The default is whatever the clock says
 * (see mealForNow in kitchen.ts) unless the person has picked one before, in
 * which case that choice sticks — this is the one bit of the app that
 * remembers you.
 */
export function MealPicker({ value, onChange }: MealPickerProps) {
  return (
    <div className="meals" role="radiogroup" aria-label="Meal">
      {MEALS.map((m) => {
        const active = value === m.id
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={active}
            className={`meal-chip ${active ? 'is-active' : ''}`}
            onClick={() => onChange(m.id)}
          >
            {m.label}
          </button>
        )
      })}
    </div>
  )
}
