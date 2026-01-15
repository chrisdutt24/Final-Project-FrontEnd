import { EntryStatus, EntryType } from '../types'
import { INITIAL_ENTRIES, INITIAL_DOCUMENTS } from '../constants'

const STORAGE_KEYS = {
  entries: 'lifeAdmin.entries',
  documents: 'lifeAdmin.documents',
  user: 'lifeAdmin.user',
}

const hasWindow = typeof window !== 'undefined'

const loadJson = (key, fallback) => {
  if (!hasWindow) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch (error) {
    return fallback
  }
}

const saveJson = (key, value) => {
  if (!hasWindow) return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    // Ignore storage failures (private mode, quota exceeded).
  }
}

const storedEntries = loadJson(STORAGE_KEYS.entries, INITIAL_ENTRIES)
const storedDocuments = loadJson(STORAGE_KEYS.documents, INITIAL_DOCUMENTS)
const storedUser = loadJson(STORAGE_KEYS.user, null)

const normalizeEntry = (entry) => {
  const normalized = { ...entry }
  if (normalized.category === 'Insurance' || normalized.type === EntryType.INSURANCE) {
    normalized.category = 'Contracts'
  }
  return normalized
}

let dbEntries = Array.isArray(storedEntries) ? [...storedEntries] : [...INITIAL_ENTRIES]
dbEntries = dbEntries.map(normalizeEntry)
let dbDocuments = Array.isArray(storedDocuments) ? [...storedDocuments] : [...INITIAL_DOCUMENTS]
let currentUser =
  storedUser && typeof storedUser === 'object'
    ? storedUser
    : { id: 'demo-user', email: 'demo@demo.com' }

if (!storedUser) {
  saveJson(STORAGE_KEYS.user, currentUser)
}
saveJson(STORAGE_KEYS.entries, dbEntries)

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
      saveJson(STORAGE_KEYS.user, currentUser)
      return currentUser
    },
    logout: async () => {
      await sleep(200)
      currentUser = null
      saveJson(STORAGE_KEYS.user, currentUser)
    },
    register: async (email) => {
      await sleep(500)
      currentUser = { id: Math.random().toString(36).substr(2, 9), email }
      saveJson(STORAGE_KEYS.user, currentUser)
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
      const newEntry = normalizeEntry({
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
      })
      dbEntries.push(newEntry)
      saveJson(STORAGE_KEYS.entries, dbEntries)
      return newEntry
    },
    update: async (id, data) => {
      await sleep(400)
      let updatedEntry = null
      dbEntries = dbEntries.map((entry) => {
        if (entry.id !== id) return entry
        updatedEntry = normalizeEntry({
          ...entry,
          ...data,
          updatedAt: new Date().toISOString(),
        })
        return updatedEntry
      })
      saveJson(STORAGE_KEYS.entries, dbEntries)
      return updatedEntry
    },
    delete: async (id) => {
      await sleep(300)
      dbEntries = dbEntries.filter((entry) => entry.id !== id)
      saveJson(STORAGE_KEYS.entries, dbEntries)
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
      saveJson(STORAGE_KEYS.documents, dbDocuments)
      return newDoc
    },
  },
}
