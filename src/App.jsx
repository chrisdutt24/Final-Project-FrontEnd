import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Navbar } from './components/Navbar'
import { Overview } from './pages/Overview'
import { Appointments } from './pages/Appointments'
import { CategorySettings } from './pages/CategorySettings'
import { Auth } from './pages/Auth'
import { api } from './services/api'

function App() {
  const { data: user, isLoading } = useQuery({ queryKey: ['user'], queryFn: api.auth.me })

  const SettingsPlaceholder = ({ title }) => (
    <div className="settings">
      <h1 className="settings-title">{title}</h1>
      <p className="settings-text">This setting section is under development for the MVP.</p>
      <div className="settings-back">
        <Link to="/" className="settings-back-link">← Back to Overview</Link>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="app-shell">
        <main className="app-main">
          <div className="list-state">Loading...</div>
        </main>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return (
    <div className="app-shell">
      <Navbar />

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/settings/account" element={<SettingsPlaceholder title="Account Settings" />} />
          <Route path="/settings/notifications" element={<SettingsPlaceholder title="Notifications" />} />
          <Route path="/settings/dates" element={<SettingsPlaceholder title="Dates & Times" />} />
          <Route path="/settings/categories" element={<CategorySettings />} />
          <Route path="/settings/storage" element={<SettingsPlaceholder title="Storage & Documents" />} />
          <Route path="/settings/privacy" element={<SettingsPlaceholder title="Privacy & Security" />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <div className="app-footer-inner">
          <div className="app-footer-content">
            <div className="app-footer-copy">&copy; 2024 LifeSync</div>
            <div className="app-footer-links">
              <a href="#" className="app-footer-link">Terms & Conditions</a>
              <a href="#" className="app-footer-link">Imprint</a>
              <a href="#" className="app-footer-link">Jobs</a>
              <a href="#" className="app-footer-link">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
