import React, { useEffect, useState } from 'react'
import { Card, Button } from '../components/UI'

const SETTINGS_KEYS = {
  deadlinePopup: 'lifeAdmin.notifications.deadlinePopupEnabled',
  appointmentReminders: 'lifeAdmin.notifications.appointmentRemindersEnabled',
  deadlineDismissed: 'lifeAdmin.deadlinePopupDismissedIds',
}

const readBool = (key, fallback) => {
  if (typeof window === 'undefined') return fallback
  const raw = window.localStorage.getItem(key)
  if (raw === null) return fallback
  return raw === 'true'
}

const saveBool = (key, value) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, value ? 'true' : 'false')
}

export const NotificationsSettings = () => {
  const [deadlinePopupEnabled, setDeadlinePopupEnabled] = useState(() =>
    readBool(SETTINGS_KEYS.deadlinePopup, true)
  )
  const [appointmentRemindersEnabled, setAppointmentRemindersEnabled] = useState(() =>
    readBool(SETTINGS_KEYS.appointmentReminders, false)
  )
  const [message, setMessage] = useState('')

  useEffect(() => {
    saveBool(SETTINGS_KEYS.deadlinePopup, deadlinePopupEnabled)
  }, [deadlinePopupEnabled])

  useEffect(() => {
    saveBool(SETTINGS_KEYS.appointmentReminders, appointmentRemindersEnabled)
  }, [appointmentRemindersEnabled])

  const handleResetDismissed = () => {
    if (!window.confirm('Reset dismissed deadline alerts?')) return
    window.localStorage.removeItem(SETTINGS_KEYS.deadlineDismissed)
    setMessage('Deadline alerts have been reset.')
  }

  return (
    <div className="settings-page">
      <div>
        <h1 className="page-title">Notification Settings</h1>
        <p className="page-subtitle">Control how and when alerts appear.</p>
      </div>

      <Card className="settings-card">
        <div className="settings-row">
          <div>
            <div className="settings-label">Deadline pop-up</div>
            <p className="settings-help">
              Show a pop-up when contracts are expiring within the next weeks.
            </p>
          </div>
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={deadlinePopupEnabled}
              onChange={(event) => setDeadlinePopupEnabled(event.target.checked)}
            />
          </label>
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-label">Appointment reminders</div>
            <p className="settings-help">
              Prepare reminder alerts for upcoming appointments.
            </p>
          </div>
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={appointmentRemindersEnabled}
              onChange={(event) => setAppointmentRemindersEnabled(event.target.checked)}
            />
          </label>
        </div>

        <div className="settings-row settings-row--actions">
          <div>
            <div className="settings-label">Reset dismissed deadlines</div>
            <p className="settings-help">
              Show the deadline pop-up again for current contracts.
            </p>
          </div>
          <Button variant="secondary" onClick={handleResetDismissed}>
            Reset
          </Button>
        </div>

        {message && <div className="form-success">{message}</div>}
      </Card>
    </div>
  )
}
