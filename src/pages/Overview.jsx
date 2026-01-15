import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import { Card, Button } from '../components/UI'
import { CATEGORIES, getCategoryIcon } from '../constants'
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

  const formatDate = (value) =>
    new Date(value).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

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
        className={`entry-row${isDue ? ' entry-row--due' : ''}`}
        onClick={() => setSelectedEntry(entry)}
      >
        <div className="entry-main">
          <h4 className="entry-title">{entry.title}</h4>
          <div className="entry-meta">
            <div>
              <span className="category-inline">
                <i className={`fa-solid ${getCategoryIcon(entry.category)} category-icon`}></i>
                {entry.category}
              </span>{' '}
              •{' '}
              <span className={`entry-status${isDue ? ' entry-status--due' : ''}`}>
                {entry.status}
              </span>
              {entry.startAt && (
                <span className="entry-start"> • Start {formatDate(entry.startAt)}</span>
              )}
            </div>
          </div>
        </div>
        <div className="entry-right">
          {entry.expirationDate ? (
            <span className="exp-badge">Exp {formatDate(entry.expirationDate)}</span>
          ) : (
            <span />
          )}
          <i className="fa-solid fa-chevron-right entry-chevron"></i>
        </div>
      </div>
    )
  }

  const ArchiveRow = ({ entry }) => (
    <div
      className="archive-row"
      onClick={() => setSelectedEntry(entry)}
    >
      <span className="archive-title">{entry.title}</span>
      <span className="archive-date">
        {entry.expirationDate
          ? formatDate(entry.expirationDate)
          : entry.startAt
            ? formatDate(entry.startAt)
            : '—'}
      </span>
    </div>
  )

  return (
    <div className="overview">
      <div className="overview-stats">
        <Card className="stat-card">
          <span className="stat-value">{activeContracts}</span>
          <span className="stat-label">Contracts without upcoming deadline</span>
        </Card>
        <Card className="stat-card stat-card--warning">
          <span className="stat-value stat-value--warning">{deadlineApproaching}</span>
          <span className="stat-label stat-label--warning">Deadline Approaching</span>
        </Card>
        <Card className="stat-card">
          <span className="stat-value">{upcomingAppointmentsCount}</span>
          <span className="stat-label">Upcoming Appointments</span>
        </Card>
      </div>

      <div className="overview-grid">
        <div className="overview-main">
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Contracts</h2>
              <Button
                variant="secondary"
                onClick={() => {
                  setModalCategory('Contracts')
                  setIsModalOpen(true)
                }}
              >
                + Add entry
              </Button>
            </div>
            <div className="entry-list">
              {entriesLoading ? (
                <div className="list-state">Loading...</div>
              ) : activeContractEntries.length === 0 ? (
                <div className="list-state list-state--muted">No active contracts.</div>
              ) : (
                <div className="list-rows">
                  {activeContractEntries.map((entry) => (
                    <EntryRow key={entry.id} entry={entry} />
                  ))}
                </div>
              )}
              {archivedContractEntries.length > 0 && (
                <div className="archive-block">
                  <button
                    className="archive-toggle"
                    onClick={() => setShowContractArchive((prev) => !prev)}
                  >
                    <span className="archive-toggle-text">
                      Archive ({archivedContractEntries.length})
                    </span>
                    <i
                      className={`fa-solid fa-chevron-${showContractArchive ? 'up' : 'down'}`}
                    ></i>
                  </button>
                  {showContractArchive && (
                    <div className="archive-list">
                      {archivedContractEntries.map((entry) => (
                        <ArchiveRow key={entry.id} entry={entry} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Appointments & Events</h2>
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
            <div className="entry-list">
              {entriesLoading ? (
                <div className="list-state">Loading...</div>
              ) : activeAppointmentEntries.length === 0 ? (
                <div className="list-state list-state--muted">
                  No upcoming appointments or events.
                </div>
              ) : (
                <div className="list-rows">
                  {activeAppointmentEntries.map((entry) => (
                    <EntryRow key={entry.id} entry={entry} />
                  ))}
                </div>
              )}
              {archivedAppointmentEntries.length > 0 && (
                <div className="archive-block">
                  <button
                    className="archive-toggle"
                    onClick={() => setShowAppointmentArchive((prev) => !prev)}
                  >
                    <span className="archive-toggle-text">
                      Archive ({archivedAppointmentEntries.length})
                    </span>
                    <i
                      className={`fa-solid fa-chevron-${showAppointmentArchive ? 'up' : 'down'}`}
                    ></i>
                  </button>
                  {showAppointmentArchive && (
                    <div className="archive-list">
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

        <div className="overview-side">
          <Card>
            <h3 className="card-title">Filter</h3>
            <div className="filter-list filter-list--scroll">
              {CATEGORIES.map((cat) => (
                <label key={cat} className="filter-item">
                  <input
                    type="checkbox"
                    className="filter-checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                  />
                  <i className={`fa-solid ${getCategoryIcon(cat)} filter-icon`}></i>
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="card-title">Last Documents</h3>
            <div className="doc-list">
              {documents.length === 0 ? (
                <p className="empty-text">No documents uploaded.</p>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="doc-item">
                    <div className="doc-icon">
                      <i className="fa-solid fa-file-pdf"></i>
                    </div>
                    <span className="doc-name">{doc.filename}</span>
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
