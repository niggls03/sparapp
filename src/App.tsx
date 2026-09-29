import { HashRouter, Route, Routes } from 'react-router-dom'
import { DataProvider, useData } from './state/DataContext'
import { Layout } from './components/Layout'
import { Onboarding } from './pages/Onboarding'
import { Dashboard } from './pages/Dashboard'
import { Transactions } from './pages/Transactions'
import { FixedCosts } from './pages/FixedCosts'
import { Goals } from './pages/Goals'
import { Settings } from './pages/Settings'

function Gate() {
  const { loading, profile } = useData()

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center" style={{ color: 'var(--text-muted)' }}>
        Lädt …
      </div>
    )
  }

  if (!profile) {
    return <Onboarding />
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/transaktionen" element={<Transactions />} />
        <Route path="/fixkosten" element={<FixedCosts />} />
        <Route path="/sparziele" element={<Goals />} />
        <Route path="/einstellungen" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export function App() {
  return (
    <DataProvider>
      <HashRouter>
        <Gate />
      </HashRouter>
    </DataProvider>
  )
}
