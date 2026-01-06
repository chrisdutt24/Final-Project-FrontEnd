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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white">
              <i className="fa-solid fa-box"></i>
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">LifeSync</span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `text-sm font-medium ${isActive ? 'text-black' : 'text-gray-500 hover:text-black'}`
              }
            >
              Overview
            </NavLink>
            <NavLink
              to="/appointments"
              className={({ isActive }) =>
                `text-sm font-medium ${isActive ? 'text-black' : 'text-gray-500 hover:text-black'}`
              }
            >
              Appointments
            </NavLink>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => {
                setIsLoginDropdownOpen(!isLoginDropdownOpen)
                setIsSettingsDropdownOpen(false)
              }}
              className="text-sm font-medium text-gray-600 hover:text-black flex items-center"
            >
              {user ? user.email : 'Login'}
              <i className="fa-solid fa-chevron-down ml-2 text-xs"></i>
            </button>

            {isLoginDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                {!user ? (
                  <>
                    <button
                      onClick={() => setIsLoginModalOpen(true)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => setIsRegisterModalOpen(true)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Create Account
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => logoutMutation.mutate()}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setIsSettingsDropdownOpen(!isSettingsDropdownOpen)
                setIsLoginDropdownOpen(false)
              }}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
            >
              <i className="fa-solid fa-gear"></i>
            </button>

            {isSettingsDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Settings
                </div>
                <button
                  onClick={() => navigate('/settings/account')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Account
                </button>
                <button
                  onClick={() => navigate('/settings/notifications')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Notifications
                </button>
                <button
                  onClick={() => navigate('/settings/dates')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Dates & Times
                </button>
                <button
                  onClick={() => navigate('/settings/categories')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Edit Categories
                </button>
                <button
                  onClick={() => navigate('/settings/storage')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Storage & Documents
                </button>
                <button
                  onClick={() => navigate('/settings/privacy')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Privacy & Security
                </button>
                <div className="border-t border-gray-100 mt-1">
                  <button
                    onClick={() => logoutMutation.mutate()}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">E-Mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:ring-black focus:border-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:ring-black focus:border-black"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Create Account"
      >
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">E-Mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:ring-black focus:border-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:ring-black focus:border-black"
            />
          </div>
          <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </form>
      </Modal>
    </nav>
  )
}
