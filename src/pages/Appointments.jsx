import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import { Card, Button } from '../components/UI'
import { AddEntryModal } from '../components/AddEntryModal'
import { EntryDetailsModal } from '../components/EntryDetailsModal'
import { EntryStatus } from '../types'
import { DEFAULT_CATEGORIES, getCategoryIcon } from '../constants'

export const Appointments = () => {
  const [isCalendarView, setIsCalendarView] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [showArchive, setShowArchive] = useState(false)

  const { data: categories = DEFAULT_CATEGORIES } = useQuery({
    queryKey: ['categories'],
    queryFn: api.categories.list,
    initialData: DEFAULT_CATEGORIES,
  })

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['entries', 'appointments', selectedFilters],
    queryFn: () => api.entries.list({ onlyAppointments: true, category: selectedFilters }),
  })

  const now = new Date()
  const activeEntries = entries.filter((entry) => entry.status !== EntryStatus.DONE)
  const archivedEntries = entries.filter((entry) => entry.status === EntryStatus.DONE)
  const upcoming = activeEntries.filter((entry) => entry.startAt && new Date(entry.startAt) >= now)
  const past = activeEntries.filter((entry) => entry.startAt && new Date(entry.startAt) < now)

  const appointmentFilters = categories.filter((category) => category.group === 'appointments')

  const toggleFilter = (filter) => {
    setSelectedFilters((prev) =>
      prev.includes(filter) ? prev.filter((item) => item !== filter) : [...prev, filter]
    )
  }

  const groupedAppointments = upcoming.reduce((acc, entry) => {
    const date = entry.startAt ? new Date(entry.startAt).toLocaleDateString() : 'No Date'
    if (!acc[date]) acc[date] = []
    acc[date].push(entry)
    return acc
  }, {})

  return (
    <div className="appointments">
      <div className="appointments-header">
        <h1 className="appointments-title">Appointments</h1>
        <div className="appointments-badges">
          <div className="badge">
            {upcoming.length} upcoming
          </div>
          <div className="badge">
            {entries.length} in total
          </div>
        </div>
        <div className="appointments-actions">
          <Button variant="secondary" onClick={() => setIsCalendarView(!isCalendarView)}>
            {isCalendarView ? 'Change to list view' : 'Change to calendar view'}
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>+ Add new entry</Button>
        </div>
      </div>

      <div className="appointments-grid">
        <div className="appointments-main">
          <Card className="appointments-card">
            {isLoading ? (
              <div className="appointments-state">Loading...</div>
            ) : activeEntries.length === 0 ? (
              <div className="appointments-state">
                No appointments scheduled.
              </div>
            ) : isCalendarView ? (
              <div className="calendar-list">
                {Object.entries(groupedAppointments).map(([date, appts]) => (
                  <div key={date}>
                    <h3 className="calendar-title">{date}</h3>
                    <div className="calendar-items">
                      {appts.map((appt) => (
                        <div
                          key={appt.id}
                          className="calendar-item"
                        >
                          <div>
                            <span className="calendar-time">
                              {new Date(appt.startAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span className="calendar-name">{appt.title}</span>
                          </div>
                          <span className="calendar-category">
                            <i
                              className={`fa-solid ${getCategoryIcon(categories, appt.category)} category-icon`}
                            ></i>
                            {appt.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="appointment-list">
                {upcoming.map((entry) => (
                  <div
                    key={entry.id}
                    className="appointment-row"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <div>
                      <h4 className="appointment-row-title">{entry.title}</h4>
                      <p className="appointment-row-meta">
                        {entry.startAt
                          ? new Date(entry.startAt).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : 'No date'}{' '}
                        •{' '}
                        <span className="category-inline">
                          <i
                            className={`fa-solid ${getCategoryIcon(categories, entry.category)} category-icon`}
                          ></i>
                          {entry.category}
                        </span>
                      </p>
                    </div>
                    <i className="fa-solid fa-chevron-right appointment-row-chevron"></i>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="appointments-side">
          <Card>
            <h3 className="card-title">Filter</h3>
            <div className="filter-list">
              {appointmentFilters.map((filter) => (
                <label key={filter.id || filter.name} className="filter-item">
                  <input
                    type="checkbox"
                    className="filter-checkbox"
                    checked={selectedFilters.includes(filter.name)}
                    onChange={() => toggleFilter(filter.name)}
                  />
                  <i
                    className={`fa-solid ${getCategoryIcon(categories, filter.name)} filter-icon`}
                  ></i>
                  <span>{filter.name}</span>
                </label>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="card-title">Past Appointments</h3>
            <div className="past-list">
              {past.length === 0 ? (
                <p className="empty-text">No past records.</p>
              ) : (
                past.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="past-item">
                    <div className="past-date">
                      {new Date(entry.startAt).toLocaleDateString()}
                    </div>
                    <div className="past-title">{entry.title}</div>
                    <div className="past-notes">
                      {entry.notes || 'No location info'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {archivedEntries.length > 0 && (
            <Card className="archive-card">
              <button
                className="archive-toggle"
                onClick={() => setShowArchive((prev) => !prev)}
              >
                <span className="archive-toggle-text">Archive ({archivedEntries.length})</span>
                <i className={`fa-solid fa-chevron-${showArchive ? 'up' : 'down'}`}></i>
              </button>
              {showArchive && (
                <div className="archive-list">
                  {archivedEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="archive-row"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <span className="archive-title">{entry.title}</span>
                      <span className="archive-date">
                        {entry.startAt ? new Date(entry.startAt).toLocaleDateString() : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      <AddEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultCategory="Appointments"
      />
      <EntryDetailsModal
        isOpen={Boolean(selectedEntry)}
        onClose={() => setSelectedEntry(null)}
        entry={selectedEntry}
      />
    </div>
  )
}
