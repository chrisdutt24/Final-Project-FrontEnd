import React, { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal, Button } from './UI'
import { CATEGORIES, CATEGORY_MAP } from '../constants'
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
  return withTime ? parsed.toLocaleString() : parsed.toLocaleDateString()
}

export const EntryDetailsModal = ({ isOpen, onClose, entry }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Contracts')
  const [status, setStatus] = useState(EntryStatus.ACTIVE)
  const [dateValue, setDateValue] = useState('')
  const [notes, setNotes] = useState('')

  const queryClient = useQueryClient()

  const isContractOrInsurance = useMemo(
    () => category === 'Contracts' || category === 'Insurance',
    [category]
  )

  useEffect(() => {
    if (!entry) return
    setIsEditing(false)
    setTitle(entry.title || '')
    setCategory(entry.category || 'Contracts')
    setStatus(entry.status || EntryStatus.ACTIVE)
    setNotes(entry.notes || '')
    const entryDate = entry.expirationDate || entry.startAt || ''
    setDateValue(getInputValue(entryDate, !(entry.category === 'Contracts' || entry.category === 'Insurance')))
  }, [entry])

  const updateMutation = useMutation({
    mutationFn: async () => {
      const type = CATEGORY_MAP[category] || EntryType.PERSONAL
      const payload = {
        title: title || 'Untitled',
        category,
        status,
        type,
        notes: notes || '',
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

  const deleteMutation = useMutation({
    mutationFn: async () => api.entries.delete(entry.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] })
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Entry Details">
      {!isEditing ? (
        <div className="space-y-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-400">Title</div>
            <div className="text-lg font-semibold text-gray-900">{entry.title}</div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400">Category</div>
              <div className="text-gray-800">{entry.category || '—'}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400">Status</div>
              <div className="text-gray-800">{entry.status || '—'}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400">
                {entry.category === 'Contracts' || entry.category === 'Insurance'
                  ? 'Expiration'
                  : 'Date & Time'}
              </div>
              <div className="text-gray-800">
                {entry.category === 'Contracts' || entry.category === 'Insurance'
                  ? formatDisplayDate(entry.expirationDate, false)
                  : formatDisplayDate(entry.startAt, true)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400">Last Updated</div>
              <div className="text-gray-800">
                {formatDisplayDate(entry.updatedAt || entry.createdAt, true)}
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-400">Notes</div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">
              {entry.notes || 'No notes added.'}
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white"
              placeholder="e.g. Health Insurance"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div className="flex space-x-4">
              <label className="flex items-center text-sm text-gray-700">
                <input
                  type="radio"
                  name="status"
                  value={EntryStatus.ACTIVE}
                  checked={status === EntryStatus.ACTIVE}
                  onChange={() => setStatus(EntryStatus.ACTIVE)}
                  className="mr-2 bg-white"
                />
                Active
              </label>
              <label className="flex items-center text-sm text-yellow-600 font-medium">
                <input
                  type="radio"
                  name="status"
                  value={EntryStatus.DUE}
                  checked={status === EntryStatus.DUE}
                  onChange={() => setStatus(EntryStatus.DUE)}
                  className="mr-2 bg-white"
                />
                Due
              </label>
              <label className="flex items-center text-sm text-green-600 font-medium">
                <input
                  type="radio"
                  name="status"
                  value={EntryStatus.DONE}
                  checked={status === EntryStatus.DONE}
                  onChange={() => setStatus(EntryStatus.DONE)}
                  className="mr-2 bg-white"
                />
                Done
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {isContractOrInsurance ? 'Expiration Date' : 'Date & Time'}
            </label>
            <input
              type={isContractOrInsurance ? 'date' : 'datetime-local'}
              value={dateValue}
              onChange={(event) => setDateValue(event.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white"
              placeholder="Additional details..."
            />
          </div>

          <div className="flex items-center justify-between pt-2">
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
