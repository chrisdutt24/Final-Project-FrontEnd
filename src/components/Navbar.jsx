import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from './UI'

export const Navbar = () => {
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false)
  const [lastNavClick, setLastNavClick] = useState('')
  const [browserHash, setBrowserHash] = useState('')
  const dropdownRef = useRef(null)

  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const updateHash = () => setBrowserHash(window.location.hash || '')
    updateHash()
    window.addEventListener('hashchange', updateHash)
    return () => window.removeEventListener('hashchange', updateHash)
  }, [])

  const { data: user } = useQuery({ queryKey: ['user'], queryFn: api.auth.me })

  useEffect(() => {
    if (!isSettingsDropdownOpen) return
    const handleClickOutside = (event) => {
      if (!dropdownRef.current) return
      if (!dropdownRef.current.contains(event.target)) {
        setIsSettingsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isSettingsDropdownOpen])

  const logoutMutation = useMutation({
    mutationFn: api.auth.logout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setIsSettingsDropdownOpen(false)
      navigate('/')
    },
  })

  if (!user) return null

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-left">
          <Link to="/" className="navbar-brand">
            <div className="navbar-logo">
              <i className="fa-solid fa-box"></i>
            </div>
            <span className="navbar-title">LifeSync</span>
          </Link>
          <div className="navbar-links">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `navbar-link${isActive ? ' navbar-link--active' : ''}`
              }
              onClick={() => {
                setLastNavClick('overview')
              }}
            >
              Overview
            </NavLink>
            <NavLink
              to="/appointments"
              className={({ isActive }) =>
                `navbar-link${isActive ? ' navbar-link--active' : ''}`
              }
              onClick={() => {
                setLastNavClick('appointments')
              }}
            >
              Appointments
            </NavLink>
          </div>
        </div>

        <div className="navbar-actions">
          <div className="navbar-debug">
            Path: {location.pathname} {location.hash} • Hash: {browserHash || '(empty)'}
            {lastNavClick && ` • Click: ${lastNavClick}`}
          </div>
          <div className="navbar-user-email">{user.email}</div>
          <Button
            variant="secondary"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
          </Button>

          <div className="navbar-dropdown" ref={dropdownRef}>
            <button
              onClick={() => {
                setIsSettingsDropdownOpen(!isSettingsDropdownOpen)
              }}
              className="settings-button"
            >
              <i className="fa-solid fa-gear"></i>
            </button>

            {isSettingsDropdownOpen && (
              <div className="dropdown-menu dropdown-menu--settings">
                <div className="dropdown-header">Settings</div>
                <button
                  onClick={() => {
                    setIsSettingsDropdownOpen(false)
                    navigate('/settings/account')
                  }}
                  className="dropdown-item"
                >
                  Account
                </button>
                <button
                  onClick={() => {
                    setIsSettingsDropdownOpen(false)
                    navigate('/settings/notifications')
                  }}
                  className="dropdown-item"
                >
                  Notifications
                </button>
                <button
                  onClick={() => {
                    setIsSettingsDropdownOpen(false)
                    navigate('/settings/dates')
                  }}
                  className="dropdown-item"
                >
                  Dates & Times
                </button>
                <button
                  onClick={() => {
                    setIsSettingsDropdownOpen(false)
                    navigate('/settings/categories')
                  }}
                  className="dropdown-item"
                >
                  Edit Categories
                </button>
                <div className="dropdown-divider">
                  <button
                    onClick={() => logoutMutation.mutate()}
                    className="dropdown-item dropdown-item--danger"
                  >
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
