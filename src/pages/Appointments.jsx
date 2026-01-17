import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import { Card, Button } from '../components/UI'
import { AddEntryModal } from '../components/AddEntryModal'
import { EntryDetailsModal } from '../components/EntryDetailsModal'
import { EntryStatus } from '../types'
import { DEFAULT_CATEGORIES, getCategoryIcon } from '../constants'

export const Appointments = () => {
  const [isCalendarView, setIsCalendarView] = useState(true)
  const [selectedFilters, setSelectedFilters] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())

  const { data: categories = DEFAULT_CATEGORIES } = useQuery({
    queryKey: ['categories'],
    queryFn: api.categories.list,
    initialData: DEFAULT_CATEGORIES,
  })

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['entries', 'appointments', selectedFilters],
    queryFn: () => api.entries.list({ onlyAppointments: true, category: selectedFilters }),
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date())
    }, 60 * 1000)
    return () => clearInterval(timer)
  }, [])

  const now = new Date()
  const activeEntries = entries.filter((entry) => entry.status !== EntryStatus.DONE)
  const upcoming = activeEntries.filter((entry) => entry.startAt && new Date(entry.startAt) >= now)
  const past = entries.filter(
    (entry) => entry.startAt && new Date(entry.startAt) < now
  )

  const appointmentFilters = categories.filter((category) => category.group === 'appointments')

  const formatDateTime = (value) =>
    new Date(value).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const toggleFilter = (filter) => {
    setSelectedFilters((prev) =>
      prev.includes(filter) ? prev.filter((item) => item !== filter) : [...prev, filter]
    )
  }

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7

  const calendarEntries = activeEntries.filter((entry) => entry.startAt)
  const calendarMap = {}
  calendarEntries.forEach((entry) => {
    const date = new Date(entry.startAt)
    if (date.getFullYear() !== year || date.getMonth() !== month) return
    const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    if (!calendarMap[key]) calendarMap[key] = []
    calendarMap[key].push(entry)
  })
  Object.keys(calendarMap).forEach((key) => {
    calendarMap[key].sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
  })

  return (
    <div className="appointments">
      <div className="appointments-header">
        <h1 className="appointments-title">Appointments</h1>
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
              <div className="calendar">
                <div className="calendar-header">
                  <h3 className="calendar-month">
                    {monthNames[month]} {year}
                  </h3>
                  <div className="calendar-today">
                    Today: {now.toLocaleDateString()}
                  </div>
                </div>
                <div className="calendar-weekdays">
                  {weekDays.map((day) => (
                    <div key={day} className="calendar-weekday">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="calendar-grid">
                  {Array.from({ length: totalCells }).map((_, index) => {
                    const dayNumber = index - startOffset + 1
                    const isCurrentMonth = dayNumber >= 1 && dayNumber <= daysInMonth
                    const isToday =
                      isCurrentMonth &&
                      dayNumber === now.getDate() &&
                      month === now.getMonth() &&
                      year === now.getFullYear()
                    const key = `${year}-${month + 1}-${dayNumber}`
                    const dayItems = isCurrentMonth ? calendarMap[key] || [] : []
                    return (
                      <div
                        key={`${month}-${index}`}
                        className={`calendar-cell${
                          isCurrentMonth ? '' : ' calendar-cell--muted'
                        }${isToday ? ' calendar-cell--today' : ''}`}
                      >
                        <div className="calendar-date">{isCurrentMonth ? dayNumber : ''}</div>
                        <div className="calendar-events">
                          {dayItems.map((item) => (
                            <button
                              key={item.id}
                              className="calendar-event"
                              onClick={() => setSelectedEntry(item)}
                            >
                              <span className="calendar-event-time">
                                {new Date(item.startAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              <span className="calendar-event-title">{item.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="entry-list">
                <div className="list-rows">
                  {upcoming.map((entry) => (
                    <div
                      key={entry.id}
                      className="entry-row"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <div className="entry-main">
                        <h4 className="entry-title">{entry.title}</h4>
                        <div className="entry-meta">
                          <div>
                            <span className="category-inline">
                              <i
                                className={`fa-solid ${getCategoryIcon(categories, entry.category)} category-icon`}
                              ></i>
                              {entry.category}
                            </span>{' '}
                            • <span className="entry-status">{entry.status}</span>
                            {entry.startAt && (
                              <span className="entry-start">
                                {' '}
                                • {formatDateTime(entry.startAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="entry-right">
                        <span />
                        <i className="fa-solid fa-chevron-right entry-chevron"></i>
                      </div>
                    </div>
                  ))}
                </div>
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
                      {entry.location || entry.notes || 'No location info'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

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
