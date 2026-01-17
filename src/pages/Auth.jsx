import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { Button } from '../components/UI'

export const Auth = () => {
  const queryClient = useQueryClient()
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [registerError, setRegisterError] = useState('')
  const [message, setMessage] = useState('')

  const loginMutation = useMutation({
    mutationFn: (data) => api.auth.login(data.email, data.password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setLoginError('')
      setMessage('')
    },
    onError: (error) => {
      setLoginError(error?.message || 'Login failed')
    },
  })

  const registerMutation = useMutation({
    mutationFn: (data) => api.auth.register(data.email, data.password),
    onSuccess: () => {
      setRegisterError('')
      setMessage('Account created. Please log in.')
      setRegisterEmail('')
      setRegisterPassword('')
    },
    onError: (error) => {
      setRegisterError(error?.message || 'Registration failed')
    },
  })

  const handleLogin = (event) => {
    event.preventDefault()
    setLoginError('')
    setMessage('')
    loginMutation.mutate({ email: loginEmail, password: loginPassword })
  }

  const handleRegister = (event) => {
    event.preventDefault()
    setRegisterError('')
    setMessage('')
    registerMutation.mutate({ email: registerEmail, password: registerPassword })
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Welcome to LifeSync</h1>
        <p className="auth-subtitle">
          Create an account, then log in to see your entries.
        </p>

        {message && <div className="auth-message">{message}</div>}

        <div className="auth-section">
          <h2 className="auth-section-title">Create Account</h2>
          <form onSubmit={handleRegister} className="form">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                required
                value={registerEmail}
                onChange={(event) => setRegisterEmail(event.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                value={registerPassword}
                onChange={(event) => setRegisterPassword(event.target.value)}
                className="form-input"
              />
            </div>
            {registerError && <div className="form-error">{registerError}</div>}
            <Button type="submit" className="btn-block" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? 'Creating...' : 'Create Account'}
            </Button>
          </form>
        </div>

        <div className="auth-divider"></div>

        <div className="auth-section">
          <h2 className="auth-section-title">Login</h2>
          <form onSubmit={handleLogin} className="form">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                className="form-input"
              />
            </div>
            {loginError && <div className="form-error">{loginError}</div>}
            <Button type="submit" className="btn-block" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
