import React, { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Modal, Button } from './UI'
import { DEFAULT_CATEGORIES, getCategoryIcon } from '../constants'
import { EntryStatus, EntryType } from '../types'
import { api } from '../services/api'

const getInputValue = (value, withTime) => {
  if (!value) return ''
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value)
  if (!withTime && isDateOnly) return value

  const isLocalDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)
  if (withTime && isLocalDateTime && !value.endsWith('Z') && !value.includes('+')) {
    return value.slice(0, 16)
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  const offsetMs = parsed.getTimezoneOffset() * 60000
  const local = new Date(parsed.getTime() - offsetMs)
  return local.toISOString().slice(0, withTime ? 16 : 10)
}

const formatDisplayDate = (value, withTime) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return withTime
    ? parsed.toLocaleString()
    : parsed.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
}

const getPortalHref = (value) => {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export const EntryDetailsModal = ({ isOpen, onClose, entry }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('General')
  const [dateValue, setDateValue] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [portalUrl, setPortalUrl] = useState('')
  const [notes, setNotes] = useState('')

  const queryClient = useQueryClient()

  const { data: categories = DEFAULT_CATEGORIES } = useQuery({
    queryKey: ['categories'],
    queryFn: api.categories.list,
    initialData: DEFAULT_CATEGORIES,
  })

  const categoryMap = useMemo(
    () => new Map(categories.map((cat) => [cat.name, cat])),
    [categories]
  )
  const activeCategory = categoryMap.get(category) || categories[0]
  const isContractOrInsurance = activeCategory?.group === 'contracts'

  useEffect(() => {
    if (!entry) return
    const entryCategory = categoryMap.get(entry.category)
    const entryIsContractLike = entryCategory
      ? entryCategory.group === 'contracts'
      : [EntryType.CONTRACT, EntryType.INSURANCE].includes(entry.type)
    const normalizedCategory = entryCategory?.name || entry.category || 'General'
    setIsEditing(false)
    setTitle(entry.title || '')
    setCategory(normalizedCategory)
    setNotes(entry.notes || '')
    setCompanyName(entry.companyName || '')
    setPortalUrl(entry.portalUrl || '')
    const entryDate = entryIsContractLike ? entry.expirationDate : entry.startAt
    setDateValue(getInputValue(entryDate || '', !entryIsContractLike))
  }, [entry, categoryMap])

  const updateMutation = useMutation({
    mutationFn: async () => {
      const type = activeCategory?.entryType || EntryType.PERSONAL
      const payload = {
        title: title || 'Untitled',
        category: activeCategory?.name || category,
        type,
        notes: notes || '',
        companyName: companyName.trim() || '',
        portalUrl: portalUrl.trim() || '',
        expirationDate: isContractOrInsurance ? dateValue || null : null,
        startAt: isContractOrInsurance ? null : dateValue || null,
      }
      return api.entries.update(entry.id, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      setIsEditing(false)
      onClose()
    },
  })

  const markDoneMutation = useMutation({
    mutationFn: async () => api.entries.update(entry.id, { status: EntryStatus.DONE }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      onClose()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => api.entries.delete(entry.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      onClose()
    },
  })

  const handleDelete = () => {
    if (!entry) return
    if (!window.confirm(`Delete "${entry.title}"?`)) return
    deleteMutation.mutate()
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!entry) return
    updateMutation.mutate()
  }

  if (!entry) return null
  const displayCategory = categoryMap.get(entry.category)?.name || entry.category
  const entryGroup =
    categoryMap.get(entry.category)?.group ||
    ([EntryType.CONTRACT, EntryType.INSURANCE].includes(entry.type) ? 'contracts' : 'appointments')
  const entryIsContract = entryGroup === 'contracts'
  const statusIsDue = entryIsContract && entry.status === EntryStatus.DUE
  const statusClasses = statusIsDue ? 'details-value details-value--due' : 'details-value'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Entry Details">
      {!isEditing ? (
        <div className="details">
          <div className="details-block">
            <div className="details-label">Title</div>
            <div className="details-title">{entry.title}</div>
          </div>
          <div className="details-grid">
            <div className="details-item">
              <div className="details-label">Category</div>
              <div className="details-value details-value--icon">
                <i
                  className={`fa-solid ${getCategoryIcon(categories, displayCategory)} category-icon`}
                ></i>
                {displayCategory || '—'}
              </div>
            </div>
            <div className="details-item">
              <div className="details-label">Status</div>
              <div className={statusClasses}>{entry.status || '—'}</div>
            </div>
            <div className="details-item">
              <div className="details-label">Company</div>
              <div className="details-value">{entry.companyName || '—'}</div>
            </div>
            <div className="details-item">
              <div className="details-label">Customer Portal</div>
              <div className="details-value">
                {entry.portalUrl ? (
                  <a
                    className="details-link"
                    href={getPortalHref(entry.portalUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {entry.portalUrl}
                  </a>
                ) : (
                  '—'
                )}
              </div>
            </div>
            <div className="details-item">
              <div className="details-label">
                {entryIsContract ? 'Expiration' : 'Date & Time'}
              </div>
              <div
                className={
                  entryIsContract
                    ? 'details-value details-value--emphasis'
                    : 'details-value'
                }
              >
                {entryIsContract
                  ? formatDisplayDate(entry.expirationDate, false)
                  : formatDisplayDate(entry.startAt, true)}
              </div>
            </div>
            <div className="details-item">
              <div className="details-label">Last Updated</div>
              <div className="details-value">
                {formatDisplayDate(entry.updatedAt || entry.createdAt, true)}
              </div>
            </div>
          </div>
          <div className="details-block">
            <div className="details-label">Notes</div>
            <div className="details-notes">{entry.notes || 'No notes added.'}</div>
          </div>
          <div className="details-actions">
            <div className="details-actions-left">
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
              {entry.status !== EntryStatus.DONE && (
                <Button
                  variant="ghost"
                  className="btn--action"
                  onClick={() => markDoneMutation.mutate()}
                  disabled={markDoneMutation.isPending}
                >
                  {markDoneMutation.isPending ? 'Saving...' : 'Mark as done'}
                </Button>
              )}
            </div>
            <Button variant="danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="form form--entry">
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="form-input"
              placeholder="e.g. Health Insurance"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="form-select"
            >
              {categories.map((cat) => (
                <option key={cat.id || cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              {isContractOrInsurance ? 'Expiration Date' : 'Date & Time'}
            </label>
            <input
              type={isContractOrInsurance ? 'date' : 'datetime-local'}
              value={dateValue}
              onChange={(event) => setDateValue(event.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              className="form-input"
              placeholder="e.g. Vodafone"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Customer Portal URL</label>
            <input
              type="url"
              value={portalUrl}
              onChange={(event) => setPortalUrl(event.target.value)}
              className="form-input"
              placeholder="https://portal.company.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="form-textarea"
              placeholder="Additional details..."
            />
          </div>

          <div className="details-actions">
            <Button variant="secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
