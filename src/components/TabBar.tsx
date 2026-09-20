import { BookOpen, Heart } from '@phosphor-icons/react'

export type Tab = 'fridge' | 'recipes' | 'saved'

interface TabBarProps {
  tab: Tab
  savedCount: number
  onChange: (tab: Tab) => void
}

/*
 * Three peer destinations, so a tab bar: the fridge (the photo and what it
 * found), the built-in recipes, and what you've saved. Switching tabs does
 * not animate; it happens too often to deserve motion. The bar hides in
 * Cook, where nothing should compete with the step.
 */
export function TabBar({ tab, savedCount, onChange }: TabBarProps) {
  const tabs: { id: Tab; label: string; icon: (active: boolean) => React.ReactNode }[] = [
    { id: 'fridge', label: 'Fridge', icon: (a) => <FridgeIcon filled={a} /> },
    { id: 'recipes', label: 'Recipes', icon: (a) => <BookOpen size={24} weight={a ? 'fill' : 'regular'} /> },
    { id: 'saved', label: 'Saved', icon: (a) => <Heart size={24} weight={a ? 'fill' : 'regular'} /> },
  ]
  return (
    <nav className="tabs" aria-label="Sections">
      {tabs.map((t) => {
        const active = tab === t.id
        return (
          <button
            key={t.id}
            type="button"
            className={`tab ${active ? 'is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
            onClick={() => onChange(t.id)}
          >
            <span className="tab-icon">
              {t.icon(active)}
              {t.id === 'saved' && savedCount > 0 && <span className="tab-badge">{savedCount}</span>}
            </span>
            <span className="tab-label">{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

/* The mark, in the same 24px stroke grammar as the Phosphor icons beside it. */
function FridgeIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <rect x="5" y="2" width="14" height="20" rx="3.5"
        fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 9.5h14" stroke={filled ? '#fff' : 'currentColor'} strokeWidth="1.6" />
      <path d="M15 5v2.5M15 12.5v4" stroke={filled ? '#fff' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
