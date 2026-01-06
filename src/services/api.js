import { EntryStatus, EntryType } from '../types'
import { INITIAL_ENTRIES, INITIAL_DOCUMENTS } from '../constants'

let dbEntries = [...INITIAL_ENTRIES]
let dbDocuments = [...INITIAL_DOCUMENTS]
let currentUser = { id: 'demo-user', email: 'demo@demo.com' }

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const api = {
  auth: {
    me: async () => {
      await sleep(300)
      return currentUser
    },
    login: async (email) => {
      await sleep(500)
      currentUser = { id: Math.random().toString(36).substr(2, 9), email }
      return currentUser
    },
    logout: async () => {
      await sleep(200)
      currentUser = null
    },
    register: async (email) => {
      await sleep(500)
      currentUser = { id: Math.random().toString(36).substr(2, 9), email }
      return currentUser
    },
  },
  entries: {
    list: async (filters = {}) => {
      await sleep(400)
      let results = [...dbEntries]
      if (filters.category && filters.category.length > 0) {
        results = results.filter((entry) => filters.category?.includes(entry.category))
      }
      if (filters.onlyAppointments) {
        results = results.filter(
          (entry) =>
            [
              EntryType.APPOINTMENT,
              EntryType.EVENT,
              EntryType.HEALTH,
              EntryType.FRIEND,
              EntryType.WORK,
            ].includes(entry.type) || entry.category === 'Appointments'
        )
      }
      return results.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    },
    create: async (data) => {
      await sleep(500)
      const newEntry = {
        id: Math.random().toString(36).substr(2, 9),
        userId: currentUser?.id || 'anon',
        title: data.title || 'Untitled',
        category: data.category || 'Personal',
        status: data.status || EntryStatus.ACTIVE,
        type: data.type || EntryType.PERSONAL,
        expirationDate: data.expirationDate,
        startAt: data.startAt,
        notes: data.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      dbEntries.push(newEntry)
      return newEntry
    },
    delete: async (id) => {
      await sleep(300)
      dbEntries = dbEntries.filter((entry) => entry.id !== id)
    },
  },
  documents: {
    list: async (limit) => {
      await sleep(300)
      const sorted = [...dbDocuments].sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      )
      return limit ? sorted.slice(0, limit) : sorted
    },
    create: async (entryId, filename) => {
      await sleep(400)
      const newDoc = {
        id: Math.random().toString(36).substr(2, 9),
        userId: currentUser?.id || 'anon',
        entryId,
        filename,
        fileUrl: '#',
        mimeType: 'application/octet-stream',
        uploadedAt: new Date().toISOString(),
      }
      dbDocuments.push(newDoc)
      return newDoc
    },
  },
}
