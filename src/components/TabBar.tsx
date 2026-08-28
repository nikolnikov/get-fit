import { ActivityIcon, DropletIcon, ListIcon, SettingsIcon } from '../icons'
import type { Tab, TabDefinition } from '../types'

const TABS: TabDefinition[] = [
  { key: 'log', label: 'Log', icon: () => <ListIcon /> },
  { key: 'water', label: 'Water', icon: () => <DropletIcon /> },
  { key: 'weight', label: 'Weight', icon: () => <ActivityIcon /> },
  { key: 'settings', label: 'Settings', icon: () => <SettingsIcon /> },
]

type TabBarProps = {
  activeTab: Tab
  onChange: (tab: Tab) => void
}

export function TabBar({ activeTab, onChange }: TabBarProps) {
  return (
    <nav className="tabs">
      {TABS.map(({ key, label, icon }) => (
        <button
          key={key}
          type="button"
          className={`tabs__tab${activeTab === key ? ' tabs__tab--active' : ''}`}
          aria-pressed={activeTab === key}
          aria-label={label}
          onClick={() => onChange(key)}
        >
          {icon()}
        </button>
      ))}
    </nav>
  )
}
