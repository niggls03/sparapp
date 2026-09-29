import { NavLink, Outlet } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'Übersicht', icon: '🏠', end: true },
  { to: '/transaktionen', label: 'Buchungen', icon: '📋', end: false },
  { to: '/fixkosten', label: 'Fixkosten', icon: '🔁', end: false },
  { to: '/sparziele', label: 'Sparziele', icon: '🎯', end: false },
  { to: '/einstellungen', label: 'Mehr', icon: '⚙️', end: false },
]

export function Layout() {
  return (
    <div className="flex min-h-full flex-col">
      <main
        className="flex-1 overflow-y-auto pb-24"
        style={{ paddingTop: 'var(--safe-top)' }}
      >
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t backdrop-blur"
        style={{
          borderColor: 'var(--border)',
          background: 'color-mix(in srgb, var(--surface-1) 92%, transparent)',
          paddingBottom: 'var(--safe-bottom)',
        }}
      >
        <div className="mx-auto flex max-w-md">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
                  isActive ? '' : ''
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? 'var(--series-1)' : 'var(--text-muted)',
              })}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
