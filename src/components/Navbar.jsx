import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal, Button } from './UI'

export const Navbar = () => {
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false)
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: user } = useQuery({ queryKey: ['user'], queryFn: api.auth.me })

  const loginMutation = useMutation({
    mutationFn: (inputEmail) => api.auth.login(inputEmail),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      setIsLoginModalOpen(false)
      setIsLoginDropdownOpen(false)
    },
  })

  const registerMutation = useMutation({
    mutationFn: (inputEmail) => api.auth.register(inputEmail),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      setIsRegisterModalOpen(false)
      setIsLoginDropdownOpen(false)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: api.auth.logout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      setIsSettingsDropdownOpen(false)
      navigate('/')
    },
  })

  const handleLogin = (event) => {
    event.preventDefault()
    loginMutation.mutate(email)
  }

  const handleRegister = (event) => {
    event.preventDefault()
    registerMutation.mutate(email)
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-left">
          <div className="navbar-brand">
            <div className="navbar-logo">
              <i className="fa-solid fa-box"></i>
            </div>
            <span className="navbar-title">LifeSync</span>
          </div>
          <div className="navbar-links">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `navbar-link${isActive ? ' navbar-link--active' : ''}`
              }
            >
              Overview
            </NavLink>
            <NavLink
              to="/appointments"
              className={({ isActive }) =>
                `navbar-link${isActive ? ' navbar-link--active' : ''}`
              }
            >
              Appointments
            </NavLink>
          </div>
        </div>

        <div className="navbar-actions">
          <div className="navbar-dropdown">
            <button
              onClick={() => {
                setIsLoginDropdownOpen(!isLoginDropdownOpen)
                setIsSettingsDropdownOpen(false)
              }}
              className="navbar-dropdown-button"
            >
              {user ? user.email : 'Login'}
              <i className="fa-solid fa-chevron-down navbar-dropdown-icon"></i>
            </button>

            {isLoginDropdownOpen && (
              <div className="dropdown-menu dropdown-menu--login">
                {!user ? (
                  <>
                    <button
                      onClick={() => setIsLoginModalOpen(true)}
                      className="dropdown-item"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => setIsRegisterModalOpen(true)}
                      className="dropdown-item"
                    >
                      Create Account
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => logoutMutation.mutate()}
                    className="dropdown-item dropdown-item--danger"
                  >
                    Logout
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="navbar-dropdown">
            <button
              onClick={() => {
                setIsSettingsDropdownOpen(!isSettingsDropdownOpen)
                setIsLoginDropdownOpen(false)
              }}
              className="settings-button"
            >
              <i className="fa-solid fa-gear"></i>
            </button>

            {isSettingsDropdownOpen && (
              <div className="dropdown-menu dropdown-menu--settings">
                <div className="dropdown-header">Settings</div>
                <button
                  onClick={() => navigate('/settings/account')}
                  className="dropdown-item"
                >
                  Account
                </button>
                <button
                  onClick={() => navigate('/settings/notifications')}
                  className="dropdown-item"
                >
                  Notifications
                </button>
                <button
                  onClick={() => navigate('/settings/dates')}
                  className="dropdown-item"
                >
                  Dates & Times
                </button>
                <button
                  onClick={() => navigate('/settings/categories')}
                  className="dropdown-item"
                >
                  Edit Categories
                </button>
                <button
                  onClick={() => navigate('/settings/storage')}
                  className="dropdown-item"
                >
                  Storage & Documents
                </button>
                <button
                  onClick={() => navigate('/settings/privacy')}
                  className="dropdown-item"
                >
                  Privacy & Security
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

      <Modal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} title="Login">
        <form onSubmit={handleLogin} className="form">
          <div className="form-group">
            <label className="form-label">E-Mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="form-input"
            />
          </div>
          <Button type="submit" className="btn-block" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Create Account"
      >
        <form onSubmit={handleRegister} className="form">
          <div className="form-group">
            <label className="form-label">E-Mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="form-input"
            />
          </div>
          <Button type="submit" className="btn-block" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </form>
      </Modal>
    </nav>
  )
}
