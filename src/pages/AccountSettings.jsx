import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Button, Card } from '../components/UI'

export const AccountSettings = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: user } = useQuery({ queryKey: ['user'], queryFn: api.auth.me })

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [emailError, setEmailError] = useState('')

  const passwordMutation = useMutation({
    mutationFn: () => api.auth.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      setPasswordMessage('Password updated.')
      setPasswordError('')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    },
    onError: (error) => {
      setPasswordError(error?.message || 'Could not update password')
      setPasswordMessage('')
    },
  })

  const emailMutation = useMutation({
    mutationFn: () => api.auth.changeEmail(emailPassword, newEmail),
    onSuccess: (nextUser) => {
      queryClient.setQueryData(['user'], nextUser)
      setEmailMessage('Email updated.')
      setEmailError('')
      setEmailPassword('')
      setNewEmail('')
      setConfirmEmail('')
    },
    onError: (error) => {
      setEmailError(error?.message || 'Could not update email')
      setEmailMessage('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.auth.deleteAccount(),
    onSuccess: () => {
      queryClient.setQueryData(['user'], null)
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      navigate('/')
    },
  })

  const handlePasswordSubmit = (event) => {
    event.preventDefault()
    setPasswordMessage('')
    setPasswordError('')
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    passwordMutation.mutate()
  }

  const handleEmailSubmit = (event) => {
    event.preventDefault()
    setEmailMessage('')
    setEmailError('')
    if (!newEmail.trim()) {
      setEmailError('Email is required')
      return
    }
    if (newEmail.trim().toLowerCase() === (user?.email || '').toLowerCase()) {
      setEmailError('New email must be different')
      return
    }
    if (newEmail.trim() !== confirmEmail.trim()) {
      setEmailError('Emails do not match')
      return
    }
    emailMutation.mutate()
  }

  const handleDelete = () => {
    if (!window.confirm('Delete your account and all entries? This cannot be undone.')) {
      return
    }
    deleteMutation.mutate()
  }

  if (!user) return null

  return (
    <div className="account">
      <div>
        <h1 className="page-title">Account Settings</h1>
        <p className="page-subtitle">Manage your account and security.</p>
      </div>

      <Card className="account-card">
        <div className="account-section">
          <h3 className="account-section-title">Email</h3>
          <form className="account-form" onSubmit={handleEmailSubmit}>
            <div className="form-group">
              <label className="form-label">Current Email</label>
              <input type="email" value={user.email || ''} disabled className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">New Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Email</label>
              <input
                type="email"
                value={confirmEmail}
                onChange={(event) => setConfirmEmail(event.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                value={emailPassword}
                onChange={(event) => setEmailPassword(event.target.value)}
                className="form-input"
              />
            </div>
            {emailError && <div className="form-error">{emailError}</div>}
            {emailMessage && <div className="form-success">{emailMessage}</div>}
            <div className="form-actions-inline">
              <Button type="submit" disabled={emailMutation.isPending}>
                {emailMutation.isPending ? 'Updating...' : 'Update email'}
              </Button>
            </div>
          </form>
        </div>

        <div className="account-divider"></div>

        <div className="account-section">
          <h3 className="account-section-title">Password</h3>
          <form className="account-form" onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="form-input"
              />
            </div>
            {passwordError && <div className="form-error">{passwordError}</div>}
            {passwordMessage && <div className="form-success">{passwordMessage}</div>}
            <div className="form-actions-inline">
              <Button type="submit" disabled={passwordMutation.isPending}>
                {passwordMutation.isPending ? 'Updating...' : 'Update password'}
              </Button>
            </div>
          </form>
        </div>

        <div className="account-divider"></div>

        <div className="account-section">
          <h3 className="account-section-title">Delete Account</h3>
          <p className="account-text">
            This permanently removes your account and all entries. This action cannot be undone.
          </p>
          <Button variant="danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Deleting...' : 'Delete account'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
