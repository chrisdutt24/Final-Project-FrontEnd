import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import { Card, Button } from '../components/UI'
import { AddEntryModal } from '../components/AddEntryModal'
import { EntryDetailsModal } from '../components/EntryDetailsModal'

export const Appointments = () => {
  const [isCalendarView, setIsCalendarView] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState(null)

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['entries', 'appointments', selectedFilters],
    queryFn: () => api.entries.list({ onlyAppointments: true, category: selectedFilters }),
  })

  const now = new Date()
  const upcoming = entries.filter((entry) => entry.startAt && new Date(entry.startAt) >= now)
  const past = entries.filter((entry) => entry.startAt && new Date(entry.startAt) < now)

  const filters = ['Events', 'Friends', 'Work', 'Health', 'Finance', 'Personal']

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
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
        <div className="flex items-center space-x-4">
          <div className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-600">
            {upcoming.length} upcoming
          </div>
          <div className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-600">
            {entries.length} in total
          </div>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" onClick={() => setIsCalendarView(!isCalendarView)}>
            {isCalendarView ? 'Change to list view' : 'Change to calendar view'}
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>+ Add new entry</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card className="min-h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>
            ) : entries.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                No appointments scheduled.
              </div>
            ) : isCalendarView ? (
              <div className="space-y-6">
                {Object.entries(groupedAppointments).map(([date, appts]) => (
                  <div key={date}>
                    <h3 className="font-bold text-gray-900 border-b pb-2 mb-4">{date}</h3>
                    <div className="space-y-3">
                      {appts.map((appt) => (
                        <div
                          key={appt.id}
                          className="p-3 bg-gray-50 rounded border border-gray-100 flex justify-between items-center"
                        >
                          <div>
                            <span className="text-xs font-semibold text-gray-500 block">
                              {new Date(appt.startAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span className="font-medium text-gray-900">{appt.title}</span>
                          </div>
                          <span className="text-xs text-gray-400">{appt.category}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {upcoming.map((entry) => (
                  <div
                    key={entry.id}
                    className="py-4 flex items-center justify-between hover:bg-gray-50 px-2 rounded cursor-pointer group"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <div>
                      <h4 className="font-medium text-gray-900">{entry.title}</h4>
                      <p className="text-xs text-gray-500">
                        {entry.startAt ? new Date(entry.startAt).toLocaleString() : 'No date'} •{' '}
                        {entry.category}
                      </p>
                    </div>
                    <i className="fa-solid fa-chevron-right text-gray-300 text-sm group-hover:text-black"></i>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card>
            <h3 className="font-bold mb-4 text-gray-900">Filter</h3>
            <div className="space-y-2">
              {filters.map((filter) => (
                <label key={filter} className="flex items-center text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-3 rounded border-gray-300 text-black focus:ring-black bg-white"
                    checked={selectedFilters.includes(filter)}
                    onChange={() => toggleFilter(filter)}
                  />
                  {filter}
                </label>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="font-bold mb-4 text-gray-900">Past Appointments</h3>
            <div className="space-y-4">
              {past.length === 0 ? (
                <p className="text-sm text-gray-400">No past records.</p>
              ) : (
                past.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="pb-3 border-b border-gray-50 last:border-0">
                    <div className="text-[10px] text-gray-400 uppercase">
                      {new Date(entry.startAt).toLocaleDateString()}
                    </div>
                    <div className="text-sm font-medium text-gray-700">{entry.title}</div>
                    <div className="text-[10px] text-gray-400 italic truncate">
                      {entry.notes || 'No location info'}
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
