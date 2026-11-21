import { BookOpen, ListChecks } from '@phosphor-icons/react'

export type Tab = 'fridge' | 'list' | 'recipes'

interface TabBarProps {
  tab: Tab
  listCount: number
  onChange: (tab: Tab) => void
}

/*
 * Three places, in the order of the job: the fridge (the photo and what to
 * cook from it), the list (what to buy), and recipes (browse, and what you
 * have saved). Switching tabs does not animate; it happens too often to
 * deserve motion. The bar hides in Cook, where nothing should compete with
 * the step. On a wide screen the same bar sits in the header.
 */
export function TabBar({ tab, listCount, onChange }: TabBarProps) {
  const tabs: { id: Tab; label: string; icon: (active: boolean) => React.ReactNode; count?: number }[] = [
    { id: 'fridge', label: 'Fridge', icon: (a) => <FridgeIcon filled={a} /> },
    { id: 'list', label: 'List', icon: (a) => <ListChecks size={24} weight={a ? 'fill' : 'regular'} />, count: listCount },
    { id: 'recipes', label: 'Recipes', icon: (a) => <BookOpen size={24} weight={a ? 'fill' : 'regular'} /> },
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
              {Boolean(t.count) && <span className="tab-badge" aria-label={`${t.count} to buy`}>{t.count}</span>}
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
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="2.5" width="14" height="19" rx="3.5" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 9.5h14" stroke={filled ? 'var(--cold)' : 'currentColor'} strokeWidth="1.6" />
      <path d="M15.5 5.5v1.5M15.5 12.5v3" stroke={filled ? 'var(--cold)' : 'currentColor'} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
