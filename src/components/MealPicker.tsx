import { Coffee, SunHorizon, Moon, IceCream } from '@phosphor-icons/react'
import { MEALS, type Meal } from '@/lib/kitchen'

interface MealPickerProps {
  value: Meal
  onChange: (meal: Meal) => void
}

const ICON: Record<Meal, typeof Coffee> = {
  breakfast: Coffee,
  lunch: SunHorizon,
  dinner: Moon,
  dessert: IceCream,
}

/*
 * Four pills, one active. The default is whatever the clock says (see
 * mealForNow in kitchen.ts) unless the person has picked one before, in
 * which case that choice sticks — this is the one bit of the app that
 * remembers you.
 */
export function MealPicker({ value, onChange }: MealPickerProps) {
  return (
    <div className="meals" role="radiogroup" aria-label="Meal">
      {MEALS.map((m) => {
        const Icon = ICON[m.id]
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
            <Icon size={18} weight={active ? 'fill' : 'regular'} />
            {m.label}
          </button>
        )
      })}
    </div>
  )
}
