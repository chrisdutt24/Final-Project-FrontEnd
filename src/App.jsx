import React, { useEffect, useLayoutEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Navbar } from './components/Navbar'
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
        <Outlet />
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
