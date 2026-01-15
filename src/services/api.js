import { EntryStatus, EntryType } from '../types'
import { DEFAULT_CATEGORIES, INITIAL_ENTRIES, INITIAL_DOCUMENTS } from '../constants'

const STORAGE_KEYS = {
  entries: 'lifeAdmin.entries',
  documents: 'lifeAdmin.documents',
  user: 'lifeAdmin.user',
  categories: 'lifeAdmin.categories',
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
const storedCategories = loadJson(STORAGE_KEYS.categories, DEFAULT_CATEGORIES)
const storedUser = loadJson(STORAGE_KEYS.user, null)

const DUE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000
const PLACEHOLDER_DOCS = new Set([
  'Internship Certificate.pdf',
  'internet_contract.pdf',
  'insurance_policy.pdf',
])

const normalizeEntry = (entry) => {
  const normalized = { ...entry }
  if (normalized.category === 'Contracts' || normalized.category === 'Contract') {
    normalized.category = 'General'
  }
  if (!normalized.category && normalized.type === EntryType.INSURANCE) {
    normalized.category = 'Insurance'
  }
  return normalized
}

const LOCKED_CATEGORY_NAMES = new Set(DEFAULT_CATEGORIES.map((category) => category.name))

const normalizeCategory = (category) => {
  let name = category.name?.trim() || 'Untitled'
  if (name === 'Contracts' || name === 'Contract') {
    name = 'General'
  }
  const fallback = DEFAULT_CATEGORIES.find((item) => item.name === name)
  const group = category.group || fallback?.group || 'appointments'
  const entryType =
    category.entryType ||
    fallback?.entryType ||
    (group === 'contracts' ? EntryType.CONTRACT : EntryType.APPOINTMENT)
  return {
    id: category.id || Math.random().toString(36).slice(2),
    name,
    group,
    entryType,
    icon: category.icon || fallback?.icon || 'fa-tag',
    locked: category.locked ?? LOCKED_CATEGORY_NAMES.has(name),
  }
}

let dbCategories = Array.isArray(storedCategories)
  ? storedCategories.map(normalizeCategory)
  : DEFAULT_CATEGORIES.map(normalizeCategory)
let categoriesChanged = false
const defaultCategories = DEFAULT_CATEGORIES.map(normalizeCategory)
defaultCategories.forEach((category) => {
  if (!dbCategories.some((item) => item.name.toLowerCase() === category.name.toLowerCase())) {
    dbCategories.push(category)
    categoriesChanged = true
  }
})
const defaultIds = new Set(defaultCategories.map((category) => category.id))
const dedupedCategories = new Map()
dbCategories.forEach((category) => {
  const key = category.name.toLowerCase()
  const existing = dedupedCategories.get(key)
  if (!existing) {
    dedupedCategories.set(key, category)
    return
  }
  const existingIsDefault = defaultIds.has(existing.id)
  const candidateIsDefault = defaultIds.has(category.id)
  if (candidateIsDefault && !existingIsDefault) {
    dedupedCategories.set(key, category)
    categoriesChanged = true
  } else if (!candidateIsDefault && !existingIsDefault && category.locked && !existing.locked) {
    dedupedCategories.set(key, category)
    categoriesChanged = true
  }
})
dbCategories = Array.from(dedupedCategories.values())
if (Array.isArray(storedCategories) && storedCategories.length !== dbCategories.length) {
  categoriesChanged = true
}
const defaultOrder = new Map(
  defaultCategories.map((category, index) => [category.name.toLowerCase(), index])
)
dbCategories = [...dbCategories].sort((a, b) => {
  const aIndex = defaultOrder.get(a.name.toLowerCase())
  const bIndex = defaultOrder.get(b.name.toLowerCase())
  const aIsDefault = aIndex !== undefined
  const bIsDefault = bIndex !== undefined
  if (aIsDefault && bIsDefault) return aIndex - bIndex
  if (aIsDefault) return -1
  if (bIsDefault) return 1
  return 0
})
if (categoriesChanged) {
  saveJson(STORAGE_KEYS.categories, dbCategories)
}

const getCategoryByName = (name) => dbCategories.find((category) => category.name === name)

const getCategoryGroup = (entry) => {
  const category = getCategoryByName(entry.category)
  if (category?.group) return category.group
  if ([EntryType.CONTRACT, EntryType.INSURANCE].includes(entry.type)) return 'contracts'
  if (
    [
      EntryType.APPOINTMENT,
      EntryType.EVENT,
      EntryType.HEALTH,
      EntryType.FRIEND,
      EntryType.WORK,
    ].includes(entry.type)
  ) {
    return 'appointments'
  }
  return 'appointments'
}

const getEntryTypeForCategory = (categoryName) =>
  getCategoryByName(categoryName)?.entryType || EntryType.PERSONAL

const applyDueStatus = (entry) => {
  const isContract = getCategoryGroup(entry) === 'contracts'
  if (!isContract || !entry.expirationDate || entry.status === EntryStatus.DONE) {
    return entry
  }
  const expDate = new Date(entry.expirationDate)
  if (Number.isNaN(expDate.getTime())) return entry
  const isDue = expDate.getTime() <= Date.now() + DUE_WINDOW_MS
  const nextStatus = isDue ? EntryStatus.DUE : EntryStatus.ACTIVE
  if (entry.status === nextStatus) return entry
  return {
    ...entry,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  }
}

const applyAppointmentArchive = (entry) => {
  const isAppointment = getCategoryGroup(entry) === 'appointments'
  if (!isAppointment || !entry.startAt || entry.status === EntryStatus.DONE) {
    return entry
  }
  const startDate = new Date(entry.startAt)
  if (Number.isNaN(startDate.getTime())) return entry
  if (startDate.getTime() >= Date.now()) return entry
  return {
    ...entry,
    status: EntryStatus.DONE,
    updatedAt: new Date().toISOString(),
  }
}

const getSortTimestamp = (entry) => {
  const group = getCategoryGroup(entry)
  const dateValue = group === 'contracts' ? entry.expirationDate : group === 'appointments' ? entry.startAt : entry.createdAt
  if (!dateValue) return Number.POSITIVE_INFINITY
  const parsed = new Date(dateValue).getTime()
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed
}

let dbEntries = Array.isArray(storedEntries) ? [...storedEntries] : [...INITIAL_ENTRIES]
dbEntries = dbEntries.map(normalizeEntry)
let dbDocuments = Array.isArray(storedDocuments) ? [...storedDocuments] : [...INITIAL_DOCUMENTS]
const beforeDocsCount = dbDocuments.length
dbDocuments = dbDocuments.filter((doc) => !PLACEHOLDER_DOCS.has(doc.filename))
let currentUser =
  storedUser && typeof storedUser === 'object'
    ? storedUser
    : { id: 'demo-user', email: 'demo@demo.com' }

if (!storedUser) {
  saveJson(STORAGE_KEYS.user, currentUser)
}
saveJson(STORAGE_KEYS.entries, dbEntries)
saveJson(STORAGE_KEYS.categories, dbCategories)
if (dbDocuments.length !== beforeDocsCount) {
  saveJson(STORAGE_KEYS.documents, dbDocuments)
}

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
      let changed = false
      const nextEntries = dbEntries.map((entry) => {
        const updated = applyAppointmentArchive(applyDueStatus(entry))
        if (updated !== entry) changed = true
        return updated
      })
      if (changed) {
        dbEntries = nextEntries
        saveJson(STORAGE_KEYS.entries, dbEntries)
      }
      let results = [...dbEntries]
      if (filters.category && filters.category.length > 0) {
        results = results.filter((entry) => filters.category?.includes(entry.category))
      }
      if (filters.onlyAppointments) {
        results = results.filter((entry) => getCategoryGroup(entry) === 'appointments')
      }
      return results.sort((a, b) => {
        const aTime = getSortTimestamp(a)
        const bTime = getSortTimestamp(b)
        if (aTime !== bTime) return aTime - bTime
        const aCreated = new Date(a.createdAt).getTime()
        const bCreated = new Date(b.createdAt).getTime()
        if (Number.isNaN(aCreated) || Number.isNaN(bCreated)) return 0
        return bCreated - aCreated
      })
    },
    create: async (data) => {
      await sleep(500)
      const newEntry = normalizeEntry({
        id: Math.random().toString(36).substr(2, 9),
        userId: currentUser?.id || 'anon',
        title: data.title || 'Untitled',
        category: data.category || 'Personal',
        status: data.status || EntryStatus.ACTIVE,
        type: data.type || getEntryTypeForCategory(data.category),
        expirationDate: data.expirationDate,
        startAt: data.startAt,
        companyName: data.companyName || '',
        portalUrl: data.portalUrl || '',
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
          type: data.category ? getEntryTypeForCategory(data.category) : entry.type,
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
      dbDocuments = dbDocuments.filter((doc) => doc.entryId !== id)
      saveJson(STORAGE_KEYS.entries, dbEntries)
      saveJson(STORAGE_KEYS.documents, dbDocuments)
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
        fileUrl: `https://example.com/documents/${encodeURIComponent(filename)}`,
        mimeType: 'application/octet-stream',
        uploadedAt: new Date().toISOString(),
      }
      dbDocuments.push(newDoc)
      saveJson(STORAGE_KEYS.documents, dbDocuments)
      return newDoc
    },
  },
  categories: {
    list: async () => {
      await sleep(200)
      return [...dbCategories]
    },
    create: async (data) => {
      await sleep(300)
      const name = data.name?.trim()
      if (!name) throw new Error('Name is required')
      if (dbCategories.some((category) => category.name.toLowerCase() === name.toLowerCase())) {
        throw new Error('Category already exists')
      }
      const entryType = data.group === 'contracts' ? EntryType.CONTRACT : EntryType.APPOINTMENT
      const newCategory = normalizeCategory({
        id: Math.random().toString(36).slice(2),
        name,
        group: data.group || 'appointments',
        entryType,
        icon: data.icon || 'fa-tag',
        locked: false,
      })
      dbCategories.push(newCategory)
      saveJson(STORAGE_KEYS.categories, dbCategories)
      return newCategory
    },
    update: async (id, data) => {
      await sleep(300)
      const target = dbCategories.find((category) => category.id === id)
      if (!target) throw new Error('Category not found')
      if (target.locked) throw new Error('Category is locked')
      const nextName = data.name?.trim() || target.name
      if (
        dbCategories.some(
          (category) =>
            category.id !== id && category.name.toLowerCase() === nextName.toLowerCase()
        )
      ) {
        throw new Error('Category already exists')
      }
      const nextGroup = data.group || target.group
      const nextEntryType = nextGroup === 'contracts' ? EntryType.CONTRACT : EntryType.APPOINTMENT
      const nextIcon = data.icon || target.icon
      dbCategories = dbCategories.map((category) =>
        category.id === id
          ? {
              ...category,
              name: nextName,
              group: nextGroup,
              entryType: nextEntryType,
              icon: nextIcon,
            }
          : category
      )
      const previousName = target.name
      if (previousName !== nextName || nextEntryType !== target.entryType) {
        dbEntries = dbEntries.map((entry) =>
          entry.category === previousName
            ? {
                ...entry,
                category: nextName,
                type: nextEntryType,
                updatedAt: new Date().toISOString(),
              }
            : entry
        )
        saveJson(STORAGE_KEYS.entries, dbEntries)
      }
      saveJson(STORAGE_KEYS.categories, dbCategories)
      return dbCategories.find((category) => category.id === id)
    },
    delete: async (id) => {
      await sleep(300)
      const target = dbCategories.find((category) => category.id === id)
      if (!target) throw new Error('Category not found')
      if (target.locked) throw new Error('Category is locked')
      dbCategories = dbCategories.filter((category) => category.id !== id)
      saveJson(STORAGE_KEYS.categories, dbCategories)
      const fallback = getCategoryByName('Personal') || dbCategories[0]
      if (fallback) {
        dbEntries = dbEntries.map((entry) =>
          entry.category === target.name
            ? {
                ...entry,
                category: fallback.name,
                type: fallback.entryType || EntryType.PERSONAL,
                updatedAt: new Date().toISOString(),
              }
            : entry
        )
        saveJson(STORAGE_KEYS.entries, dbEntries)
      }
      return true
    },
  },
}
