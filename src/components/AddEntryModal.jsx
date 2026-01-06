import React, { useState } from 'react'
import { Modal, Button } from './UI'
import { CATEGORIES, CATEGORY_MAP } from '../constants'
import { EntryStatus, EntryType } from '../types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'

export const AddEntryModal = ({ isOpen, onClose, defaultCategory }) => {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(defaultCategory || 'Contracts')
  const [status, setStatus] = useState(EntryStatus.ACTIVE)
  const [expirationDate, setExpirationDate] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState(null)

  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const type = CATEGORY_MAP[category] || EntryType.PERSONAL
      const entry = await api.entries.create({
        title,
        category,
        status,
        type,
        expirationDate: expirationDate || undefined,
        startAt:
          type === EntryType.APPOINTMENT || category === 'Appointments' ? expirationDate : undefined,
        notes,
      })
      if (file) {
        await api.documents.create(entry.id, file.name)
      }
      return entry
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      onClose()
      setTitle('')
      setCategory(defaultCategory || 'Contracts')
      setStatus(EntryStatus.ACTIVE)
      setExpirationDate('')
      setNotes('')
      setFile(null)
    },
  })

  const handleSubmit = (event) => {
    event.preventDefault()
    mutation.mutate()
  }

  const isContractOrInsurance = category === 'Contracts' || category === 'Insurance'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Entry">
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
            value={expirationDate}
            onChange={(event) => setExpirationDate(event.target.value)}
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

        <div>
          <label className="block text-sm font-medium text-gray-700">Upload Document</label>
          <input
            type="file"
            onChange={(event) => setFile(event.target.files ? event.target.files[0] : null)}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
          />
        </div>

        <div className="pt-2">
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
