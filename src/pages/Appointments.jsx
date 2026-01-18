import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import { Card, Button } from '../components/UI'
import { AddEntryModal } from '../components/AddEntryModal'
import { EntryDetailsModal } from '../components/EntryDetailsModal'
import { EntryStatus } from '../types'
import { DEFAULT_CATEGORIES, getCategoryIcon } from '../constants'
import { formatDate, formatDateTime, formatTime } from '../utils/dateFormat'

export const Appointments = () => {
  const [isCalendarView, setIsCalendarView] = useState(true)
  const [selectedFilters, setSelectedFilters] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showAllPast, setShowAllPast] = useState(false)
  const [presetStartAt, setPresetStartAt] = useState('')
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [pickerMonth, setPickerMonth] = useState(0)
  const [pickerYear, setPickerYear] = useState(0)

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

  useEffect(() => {
    setShowAllPast(false)
  }, [selectedFilters.join(',')])

  const now = new Date()
  const activeEntries = entries.filter((entry) => entry.status !== EntryStatus.DONE)
  const upcoming = activeEntries.filter((entry) => entry.startAt && new Date(entry.startAt) >= now)
  const past = entries.filter(
    (entry) => entry.startAt && new Date(entry.startAt) < now
  )
  const pastVisible = showAllPast ? past : past.slice(0, 2)

  const appointmentFilters = categories.filter((category) => category.group === 'appointments')

  const toggleFilter = (filter) => {
    setSelectedFilters((prev) =>
      prev.includes(filter) ? prev.filter((item) => item !== filter) : [...prev, filter]
    )
  }

  const clearFilters = () => setSelectedFilters([])

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
  const yearOptions = []
  for (let yearOption = year - 5; yearOption <= year + 5; yearOption += 1) {
    yearOptions.push(yearOption)
  }
  const goToPreviousMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const openMonthPicker = () => {
    setPickerMonth(month)
    setPickerYear(year)
    setShowMonthPicker(true)
  }

  const applyMonthPicker = () => {
    setCurrentDate(new Date(pickerYear, pickerMonth, 1))
    setShowMonthPicker(false)
  }

  const closeMonthPicker = () => {
    setShowMonthPicker(false)
  }

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

  const openCreateForDate = (dayNumber) => {
    if (!dayNumber) return
    const date = new Date(year, month, dayNumber)
    const offsetMs = date.getTimezoneOffset() * 60000
    const local = new Date(date.getTime() - offsetMs)
    setPresetStartAt(local.toISOString().slice(0, 16))
    setIsModalOpen(true)
  }

  const handleOpenNewEntry = () => {
    setPresetStartAt('')
    setIsModalOpen(true)
  }

  return (
    <div className="appointments">
      <div className="appointments-header">
        <h1 className="appointments-title">Appointments</h1>
        <div className="appointments-actions">
          <Button variant="secondary" onClick={() => setIsCalendarView(!isCalendarView)}>
            {isCalendarView ? 'Change to list view' : 'Change to calendar view'}
          </Button>
          <Button onClick={handleOpenNewEntry}>+ Add new entry</Button>
        </div>
      </div>

      <div className="appointments-grid">
        <div className="appointments-main">
          <Card className="appointments-card">
            {isLoading ? (
              <div className="appointments-state">Loading...</div>
            ) : isCalendarView ? (
              <div className="calendar">
                <div className="calendar-header">
                  <div className="calendar-nav">
                    <button
                      type="button"
                      className="calendar-nav-button"
                      onClick={goToPreviousMonth}
                      aria-label="Previous month"
                    >
                      <i className="fa-solid fa-chevron-left"></i>
                    </button>
                    <h3 className="calendar-month">
                      {monthNames[month]} {year}
                    </h3>
                    <button
                      type="button"
                      className="calendar-nav-button"
                      onClick={goToNextMonth}
                      aria-label="Next month"
                    >
                      <i className="fa-solid fa-chevron-right"></i>
                    </button>
                    <button
                      type="button"
                      className="calendar-today-button"
                      onClick={goToToday}
                    >
                      Jump To Today
                    </button>
                    <button
                      type="button"
                      className="calendar-jump-button"
                      onClick={openMonthPicker}
                    >
                      Select Manually
                    </button>
                  </div>
                  <div className="calendar-today">Today: {formatDate(now)}</div>
                </div>
                {showMonthPicker && (
                  <div className="calendar-jump">
                    <select
                      className="calendar-jump-select"
                      value={pickerMonth}
                      onChange={(event) => setPickerMonth(Number(event.target.value))}
                    >
                      {monthNames.map((label, index) => (
                        <option key={label} value={index}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <select
                      className="calendar-jump-select"
                      value={pickerYear}
                      onChange={(event) => setPickerYear(Number(event.target.value))}
                    >
                      {yearOptions.map((yearOption) => (
                        <option key={yearOption} value={yearOption}>
                          {yearOption}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="calendar-jump-apply"
                      onClick={applyMonthPicker}
                    >
                      Go
                    </button>
                    <button
                      type="button"
                      className="calendar-jump-cancel"
                      onClick={closeMonthPicker}
                    >
                      Cancel
                    </button>
                  </div>
                )}
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
                      <button
                        key={`${month}-${index}`}
                        className={`calendar-cell calendar-cell-button${
                          isCurrentMonth ? '' : ' calendar-cell--muted'
                        }${isToday ? ' calendar-cell--today' : ''}`}
                        onClick={() => {
                          if (isCurrentMonth) {
                            openCreateForDate(dayNumber)
                          }
                        }}
                        disabled={!isCurrentMonth}
                      >
                        <div className="calendar-date">{isCurrentMonth ? dayNumber : ''}</div>
                        <div className="calendar-events">
                          {dayItems.map((item) => (
                            <button
                              key={item.id}
                              className="calendar-event"
                              onClick={(event) => {
                                event.stopPropagation()
                                setSelectedEntry(item)
                              }}
                            >
                              <span className="calendar-event-time">
                                {formatTime(item.startAt)}
                              </span>
                              <span className="calendar-event-title">{item.title}</span>
                            </button>
                          ))}
                        </div>
                      </button>
                    )
                  })}
                </div>
                {entries.length === 0 && (
                  <div className="calendar-empty">
                    {selectedFilters.length > 0
                      ? "No appointments found for the selected categories."
                      : "No appointments scheduled."}
                  </div>
                )}
              </div>
            ) : (
              <div className="entry-list">
                <div className="list-rows">
                  {entries.length === 0 && (
                    <div className="appointments-state">
                      No appointments scheduled.
                    </div>
                  )}
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
            <div className="filter-header">
              <h3 className="card-title">Filter</h3>
              <button
                className="filter-clear"
                type="button"
                onClick={clearFilters}
                disabled={selectedFilters.length === 0}
              >
                Clear all
              </button>
            </div>
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
                pastVisible.map((entry) => (
                  <div key={entry.id} className="past-item">
                    <div className="past-date">{formatDate(entry.startAt)}</div>
                    <div className="past-title">{entry.title}</div>
                    <div className="past-notes">
                      {entry.location || entry.notes || 'No location info'}
                    </div>
                  </div>
                ))
              )}
              {past.length > 2 && (
                <button
                  type="button"
                  className="past-toggle"
                  onClick={() => setShowAllPast((prev) => !prev)}
                >
                  {showAllPast ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          </Card>

        </div>
      </div>

      <AddEntryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setPresetStartAt('')
        }}
        defaultCategory="Appointments"
        presetStartAt={presetStartAt}
      />
      <EntryDetailsModal
        isOpen={Boolean(selectedEntry)}
        onClose={() => setSelectedEntry(null)}
        entry={selectedEntry}
      />
    </div>
  )
}
