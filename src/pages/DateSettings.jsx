import React, { useState } from 'react'
import { Card, Button } from '../components/UI'
import {
  loadDateTimeSettings,
  saveDateTimeSettings,
  formatDateWithSettings,
  formatTimeWithSettings,
  formatDateTimeWithSettings,
} from '../utils/dateFormat'

const DATE_OPTIONS = [
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (e.g. 31.12.2024)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (e.g. 12/31/2024)' },
]

const TIME_OPTIONS = [
  { value: '24', label: '24-hour (e.g. 14:30)' },
  { value: '12', label: '12-hour (e.g. 2:30 PM)' },
]

export const DateSettings = () => {
  const [settings, setSettings] = useState(loadDateTimeSettings())
  const [message, setMessage] = useState('')
  const now = new Date()

  const handleSave = (event) => {
    event.preventDefault()
    saveDateTimeSettings(settings)
    setMessage('Date & time settings saved.')
  }

  const previewDate = formatDateWithSettings(now, settings)
  const previewTime = formatTimeWithSettings(now, settings)
  const previewDateTime = formatDateTimeWithSettings(now, settings)

  return (
    <div className="settings-page">
      <div>
        <h1 className="page-title">Dates & Times</h1>
        <p className="page-subtitle">Choose how dates and times are displayed.</p>
      </div>

      <Card className="settings-card">
        <form onSubmit={handleSave} className="settings-form">
          <div className="settings-row">
            <div>
              <div className="settings-label">Date format</div>
              <p className="settings-help">Applies to entries and dashboards.</p>
            </div>
            <select
              className="form-select settings-control"
              value={settings.dateFormat}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, dateFormat: event.target.value }))
              }
            >
              {DATE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="settings-row">
            <div>
              <div className="settings-label">Time format</div>
              <p className="settings-help">Choose 24-hour or 12-hour time.</p>
            </div>
            <select
              className="form-select settings-control"
              value={settings.timeFormat}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, timeFormat: event.target.value }))
              }
            >
              {TIME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="settings-row settings-row--preview">
            <div>
              <div className="settings-label">Preview</div>
              <p className="settings-help">Example with your current settings.</p>
            </div>
            <div className="settings-preview">
              <div className="settings-preview-main">{previewDateTime}</div>
              <div className="settings-preview-sub">
                {previewDate} • {previewTime}
              </div>
            </div>
          </div>

          {message && <div className="form-success">{message}</div>}

          <div className="form-actions-inline">
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
