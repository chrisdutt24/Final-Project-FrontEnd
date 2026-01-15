import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import { Card, Button } from '../components/UI'
import { CATEGORIES } from '../constants'
import { EntryType, EntryStatus } from '../types'
import { AddEntryModal } from '../components/AddEntryModal'
import { EntryDetailsModal } from '../components/EntryDetailsModal'

export const Overview = () => {
  const [selectedCategories, setSelectedCategories] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalCategory, setModalCategory] = useState('Contracts')
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [showContractArchive, setShowContractArchive] = useState(false)
  const [showAppointmentArchive, setShowAppointmentArchive] = useState(false)

  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['entries', selectedCategories],
    queryFn: () => api.entries.list({ category: selectedCategories }),
  })

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => api.documents.list(5),
  })

  const activeContracts = entries.filter(
    (entry) =>
      [EntryType.CONTRACT, EntryType.INSURANCE].includes(entry.type) &&
      entry.status === EntryStatus.ACTIVE
  ).length

  const fourteenDaysFromNow = new Date()
  fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14)
  const deadlineApproaching = entries.filter((entry) => {
    if (entry.status === EntryStatus.DONE) return false
    if (!entry.expirationDate) return false
    const exp = new Date(entry.expirationDate)
    return exp <= fourteenDaysFromNow && exp >= new Date()
  }).length

  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
  const upcomingAppointmentsCount = entries.filter((entry) => {
    if (!entry.startAt) return false
    const start = new Date(entry.startAt)
    return start <= sevenDaysFromNow && start >= new Date()
  }).length

  const contractEntries = entries.filter(
    (entry) =>
      entry.category === 'Contracts' ||
      entry.type === EntryType.CONTRACT ||
      entry.type === EntryType.INSURANCE
  )

  const appointmentEntries = entries.filter(
    (entry) =>
      entry.category === 'Appointments' ||
      [
        EntryType.APPOINTMENT,
        EntryType.EVENT,
        EntryType.HEALTH,
        EntryType.FRIEND,
        EntryType.WORK,
      ].includes(entry.type)
  )

  const activeContractEntries = contractEntries.filter((entry) => entry.status !== EntryStatus.DONE)
  const archivedContractEntries = contractEntries.filter((entry) => entry.status === EntryStatus.DONE)
  const activeAppointmentEntries = appointmentEntries.filter((entry) => entry.status !== EntryStatus.DONE)
  const archivedAppointmentEntries = appointmentEntries.filter((entry) => entry.status === EntryStatus.DONE)

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((item) => item !== cat) : [...prev, cat]
    )
  }

  const EntryRow = ({ entry }) => {
    const isContract =
      entry.category === 'Contracts' ||
      [EntryType.CONTRACT, EntryType.INSURANCE].includes(entry.type)
    const isDue = isContract && entry.status === EntryStatus.DUE
    return (
    <div
      className={`p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
        isDue ? 'border-l-4 border-red-500 bg-red-50' : ''
      }`}
      onClick={() => setSelectedEntry(entry)}
    >
      <div>
        <h4 className="font-medium text-gray-900">{entry.title}</h4>
        <div className="mt-1 text-xs text-gray-500 space-y-1">
          <div className="flex items-center justify-between gap-3">
            <span>
              {entry.category} •{' '}
              <span className={isDue ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                {entry.status}
              </span>
            </span>
            {entry.expirationDate && (
              <span className="px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 font-semibold whitespace-nowrap">
                Exp {new Date(entry.expirationDate).toLocaleDateString()}
              </span>
            )}
          </div>
          {entry.startAt && (
            <div className="text-gray-500">
              Date {new Date(entry.startAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
      <i className="fa-solid fa-chevron-right text-gray-300 text-sm"></i>
    </div>
    )
  }

  const ArchiveRow = ({ entry }) => (
    <div
      className="px-4 py-3 flex items-center justify-between text-sm text-gray-500 hover:bg-gray-50 cursor-pointer"
      onClick={() => setSelectedEntry(entry)}
    >
      <span className="truncate">{entry.title}</span>
      <span className="text-xs text-gray-400">
        {entry.expirationDate
          ? new Date(entry.expirationDate).toLocaleDateString()
          : entry.startAt
            ? new Date(entry.startAt).toLocaleDateString()
            : '—'}
      </span>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col items-center justify-center py-8">
          <span className="text-4xl font-bold text-gray-900">{activeContracts}</span>
          <span className="text-sm text-gray-500 uppercase tracking-wide mt-1 text-center">
            Active Contracts
          </span>
        </Card>
        <Card className="flex flex-col items-center justify-center py-8 border-yellow-200 bg-yellow-50">
          <span className="text-4xl font-bold text-yellow-700">{deadlineApproaching}</span>
          <span className="text-sm text-yellow-600 uppercase tracking-wide mt-1 text-center">
            Deadline Approaching
          </span>
        </Card>
        <Card className="flex flex-col items-center justify-center py-8">
          <span className="text-4xl font-bold text-gray-900">{upcomingAppointmentsCount}</span>
          <span className="text-sm text-gray-500 uppercase tracking-wide mt-1 text-center">
            Upcoming Appointments
          </span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Contracts</h2>
              <Button
                onClick={() => {
                  setModalCategory('Contracts')
                  setIsModalOpen(true)
                }}
              >
                + Add entry
              </Button>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {entriesLoading ? (
                <div className="p-8 text-center text-gray-400">Loading...</div>
              ) : activeContractEntries.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm italic">
                  No active contracts.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {activeContractEntries.map((entry) => (
                    <EntryRow key={entry.id} entry={entry} />
                  ))}
                </div>
              )}
              {archivedContractEntries.length > 0 && (
                <div className="border-t border-gray-100 bg-gray-50">
                  <button
                    className="w-full px-4 py-2 text-xs text-gray-500 flex items-center justify-between hover:text-gray-700"
                    onClick={() => setShowContractArchive((prev) => !prev)}
                  >
                    <span>Archive ({archivedContractEntries.length})</span>
                    <i
                      className={`fa-solid fa-chevron-${showContractArchive ? 'up' : 'down'}`}
                    ></i>
                  </button>
                  {showContractArchive && (
                    <div className="divide-y divide-gray-200">
                      {archivedContractEntries.map((entry) => (
                        <ArchiveRow key={entry.id} entry={entry} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Appointments & Events</h2>
              <Button
                variant="secondary"
                onClick={() => {
                  setModalCategory('Appointments')
                  setIsModalOpen(true)
                }}
              >
                + Add entry
              </Button>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {entriesLoading ? (
                <div className="p-8 text-center text-gray-400">Loading...</div>
              ) : activeAppointmentEntries.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm italic">
                  No upcoming appointments or events.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {activeAppointmentEntries.map((entry) => (
                    <EntryRow key={entry.id} entry={entry} />
                  ))}
                </div>
              )}
              {archivedAppointmentEntries.length > 0 && (
                <div className="border-t border-gray-100 bg-gray-50">
                  <button
                    className="w-full px-4 py-2 text-xs text-gray-500 flex items-center justify-between hover:text-gray-700"
                    onClick={() => setShowAppointmentArchive((prev) => !prev)}
                  >
                    <span>Archive ({archivedAppointmentEntries.length})</span>
                    <i
                      className={`fa-solid fa-chevron-${showAppointmentArchive ? 'up' : 'down'}`}
                    ></i>
                  </button>
                  {showAppointmentArchive && (
                    <div className="divide-y divide-gray-200">
                      {archivedAppointmentEntries.map((entry) => (
                        <ArchiveRow key={entry.id} entry={entry} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card>
            <h3 className="font-bold mb-4 text-gray-900">Filter</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {CATEGORIES.map((cat) => (
                <label key={cat} className="flex items-center text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-3 rounded border-gray-300 text-black focus:ring-black bg-white"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                  />
                  {cat}
                </label>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="font-bold mb-4 text-gray-900">Last Documents</h3>
            <div className="space-y-4">
              {documents.length === 0 ? (
                <p className="text-sm text-gray-400">No documents uploaded.</p>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="flex items-center text-sm">
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500 mr-3">
                      <i className="fa-solid fa-file-pdf"></i>
                    </div>
                    <span className="truncate text-gray-700 hover:text-black hover:underline cursor-pointer">
                      {doc.filename}
                    </span>
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
        defaultCategory={modalCategory}
      />
      <EntryDetailsModal
        isOpen={Boolean(selectedEntry)}
        onClose={() => setSelectedEntry(null)}
        entry={selectedEntry}
      />
    </div>
  )
}
