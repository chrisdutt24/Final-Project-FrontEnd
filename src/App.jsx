import React, { useEffect, useLayoutEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Navbar } from './components/Navbar'
import { Overview } from './pages/Overview'
import { Appointments } from './pages/Appointments'
import { CategorySettings } from './pages/CategorySettings'
import { AccountSettings } from './pages/AccountSettings'
import { NotificationsSettings } from './pages/NotificationsSettings'
import { DateSettings } from './pages/DateSettings'
import { Auth } from './pages/Auth'
import { api } from './services/api'

function App() {
  const location = useLocation()
  const { data: user, isLoading } = useQuery({ queryKey: ['user'], queryFn: api.auth.me })

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname, location.search, location.hash])

  useEffect(() => {
    console.log('LOCATION:', location.pathname, location.hash)
  }, [location.pathname, location.hash])

  useEffect(() => {
    const handleHashChange = () => {
      console.log('HASHCHANGE:', window.location.hash)
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

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
        <Routes key={location.key}>
          <Route path="/" element={<Overview />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/settings/account" element={<AccountSettings />} />
          <Route path="/settings/notifications" element={<NotificationsSettings />} />
          <Route path="/settings/dates" element={<DateSettings />} />
          <Route path="/settings/categories" element={<CategorySettings />} />
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
