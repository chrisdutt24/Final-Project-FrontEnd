import { EntryStatus, EntryType } from '../types'
import { DEFAULT_CATEGORIES } from '../constants'

const STORAGE_KEYS = {
  entries: 'lifeAdmin.entries',
  documents: 'lifeAdmin.documents',
  user: 'lifeAdmin.user',
  users: 'lifeAdmin.users',
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

const removeKey = (key) => {
  if (!hasWindow) return
  try {
    window.localStorage.removeItem(key)
  } catch (error) {
    // Ignore storage failures.
  }
}

const toPublicUser = (user) => {
  if (!user) return null
  return {
    id: user.id,
    email: user.email,
  }
}

const storedUser = loadJson(STORAGE_KEYS.user, null)
const storedUsers = loadJson(STORAGE_KEYS.users, [])

const users = Array.isArray(storedUsers) ? storedUsers : []
let currentUser = null
if (storedUser && typeof storedUser === 'object') {
  const match = users.find((user) => user.id === storedUser.id)
  if (match) currentUser = toPublicUser(match)
}

const DUE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000
const PLACEHOLDER_DOCS = [
  'Internship Certificate.pdf',
  'internet_contract.pdf',
  'insurance_policy.pdf',
]

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

const LOCKED_CATEGORY_NAMES = DEFAULT_CATEGORIES.map((category) => category.name)

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
    locked: category.locked ?? LOCKED_CATEGORY_NAMES.includes(name),
  }
}

let dbEntries = []
let dbDocuments = []
let dbCategories = []

const getUserKey = (key, userId) => `${key}.${userId}`

const loadEntriesForUser = (userId) => {
  const key = getUserKey(STORAGE_KEYS.entries, userId)
  let entries = loadJson(key, null)
  if (!Array.isArray(entries)) {
    const legacy = loadJson(STORAGE_KEYS.entries, null)
    entries = Array.isArray(legacy) ? legacy : []
    saveJson(key, entries)
  }
  return entries.map((entry) => {
    const normalized = normalizeEntry(entry)
    if (!normalized.userId) normalized.userId = userId
    return normalized
  })
}

const loadDocumentsForUser = (userId) => {
  const key = getUserKey(STORAGE_KEYS.documents, userId)
  let documents = loadJson(key, null)
  if (!Array.isArray(documents)) {
    const legacy = loadJson(STORAGE_KEYS.documents, null)
    documents = Array.isArray(legacy) ? legacy : []
    saveJson(key, documents)
  }
  const filtered = documents.filter((doc) => !PLACEHOLDER_DOCS.includes(doc.filename))
  return filtered.map((doc) => {
    const nextDoc = {
      ...doc,
      userId: doc.userId || userId,
    }
    if (nextDoc.fileUrl && nextDoc.fileUrl.includes('https://example.com/documents/')) {
      nextDoc.fileUrl = ''
    }
    return nextDoc
  })
}

const buildCategories = (rawCategories) => {
  let categoriesChanged = false
  let categories = Array.isArray(rawCategories)
    ? rawCategories.map(normalizeCategory)
    : DEFAULT_CATEGORIES.map(normalizeCategory)
  const defaultCategories = DEFAULT_CATEGORIES.map(normalizeCategory)

  defaultCategories.forEach((category) => {
    const exists = categories.some(
      (item) => item.name.toLowerCase() === category.name.toLowerCase()
    )
    if (!exists) {
      categories.push(category)
      categoriesChanged = true
    }
  })

  const deduped = []
  categories.forEach((category) => {
    const key = category.name.toLowerCase()
    const existingIndex = deduped.findIndex(
      (item) => item.name.toLowerCase() === key
    )
    if (existingIndex === -1) {
      deduped.push(category)
      return
    }
    const existing = deduped[existingIndex]
    const existingIsDefault = defaultCategories.some((item) => item.id === existing.id)
    const candidateIsDefault = defaultCategories.some((item) => item.id === category.id)
    if (candidateIsDefault && !existingIsDefault) {
      deduped[existingIndex] = category
      categoriesChanged = true
      return
    }
    if (!candidateIsDefault && !existingIsDefault && category.locked && !existing.locked) {
      deduped[existingIndex] = category
      categoriesChanged = true
    }
  })

  if (deduped.length !== categories.length) {
    categoriesChanged = true
  }
  categories = deduped

  const defaultOrder = defaultCategories.map((category) => category.name.toLowerCase())
  categories = [...categories].sort((a, b) => {
    const aIndex = defaultOrder.indexOf(a.name.toLowerCase())
    const bIndex = defaultOrder.indexOf(b.name.toLowerCase())
    const aIsDefault = aIndex !== -1
    const bIsDefault = bIndex !== -1
    if (aIsDefault && bIsDefault) return aIndex - bIndex
    if (aIsDefault) return -1
    if (bIsDefault) return 1
    return 0
  })

  return { categories, categoriesChanged }
}

const loadCategoriesForUser = (userId) => {
  const key = getUserKey(STORAGE_KEYS.categories, userId)
  let categories = loadJson(key, null)
  if (!Array.isArray(categories)) {
    const legacy = loadJson(STORAGE_KEYS.categories, null)
    categories = Array.isArray(legacy) ? legacy : DEFAULT_CATEGORIES
    saveJson(key, categories)
  }
  const result = buildCategories(categories)
  if (result.categoriesChanged) {
    saveJson(key, result.categories)
  }
  return result.categories
}

const loadUserData = (user) => {
  if (!user) {
    dbEntries = []
    dbDocuments = []
    dbCategories = DEFAULT_CATEGORIES.map(normalizeCategory)
    return
  }
  dbEntries = loadEntriesForUser(user.id)
  dbDocuments = loadDocumentsForUser(user.id)
  dbCategories = loadCategoriesForUser(user.id)
}

const saveEntries = () => {
  if (!currentUser) return
  const key = getUserKey(STORAGE_KEYS.entries, currentUser.id)
  saveJson(key, dbEntries)
}

const saveDocuments = () => {
  if (!currentUser) return
  const key = getUserKey(STORAGE_KEYS.documents, currentUser.id)
  saveJson(key, dbDocuments)
}

const saveCategories = () => {
  if (!currentUser) return
  const key = getUserKey(STORAGE_KEYS.categories, currentUser.id)
  saveJson(key, dbCategories)
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

loadUserData(currentUser)
if (currentUser) {
  saveJson(STORAGE_KEYS.user, currentUser)
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const api = {
  auth: {
    me: async () => {
      await sleep(300)
      return currentUser
    },
    login: async (email, password) => {
      await sleep(500)
      if (!email || !password) {
        throw new Error('Email and password are required')
      }
      const user = users.find(
        (item) => item.email.toLowerCase() === email.toLowerCase()
      )
      if (!user) {
        throw new Error('Account not found')
      }
      if (user.password !== password) {
        throw new Error('Wrong password')
      }
      currentUser = toPublicUser(user)
      saveJson(STORAGE_KEYS.user, currentUser)
      loadUserData(currentUser)
      return currentUser
    },
    logout: async () => {
      await sleep(200)
      currentUser = null
      saveJson(STORAGE_KEYS.user, currentUser)
      loadUserData(currentUser)
    },
    register: async (email, password) => {
      await sleep(500)
      if (!email || !password) {
        throw new Error('Email and password are required')
      }
      const exists = users.some(
        (item) => item.email.toLowerCase() === email.toLowerCase()
      )
      if (exists) {
        throw new Error('Account already exists')
      }
      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        password,
      }
      users.push(newUser)
      saveJson(STORAGE_KEYS.users, users)
      return toPublicUser(newUser)
    },
    changePassword: async (currentPassword, newPassword) => {
      await sleep(400)
      if (!currentUser) {
        throw new Error('Please log in first')
      }
      if (!currentPassword || !newPassword) {
        throw new Error('Please fill in all password fields')
      }
      const index = users.findIndex((item) => item.id === currentUser.id)
      if (index === -1) {
        throw new Error('Account not found')
      }
      if (users[index].password !== currentPassword) {
        throw new Error('Current password is incorrect')
      }
      users[index] = { ...users[index], password: newPassword }
      saveJson(STORAGE_KEYS.users, users)
      return true
    },
    changeEmail: async (currentPassword, newEmail) => {
      await sleep(400)
      if (!currentUser) {
        throw new Error('Please log in first')
      }
      if (!currentPassword || !newEmail) {
        throw new Error('Please fill in all email fields')
      }
      const trimmedEmail = newEmail.trim()
      if (!trimmedEmail) {
        throw new Error('Email is required')
      }
      const index = users.findIndex((item) => item.id === currentUser.id)
      if (index === -1) {
        throw new Error('Account not found')
      }
      if (users[index].password !== currentPassword) {
        throw new Error('Current password is incorrect')
      }
      const exists = users.some(
        (item) =>
          item.id !== currentUser.id && item.email.toLowerCase() === trimmedEmail.toLowerCase()
      )
      if (exists) {
        throw new Error('Email is already in use')
      }
      users[index] = { ...users[index], email: trimmedEmail }
      saveJson(STORAGE_KEYS.users, users)
      currentUser = { ...currentUser, email: trimmedEmail }
      saveJson(STORAGE_KEYS.user, currentUser)
      return currentUser
    },
    deleteAccount: async () => {
      await sleep(400)
      if (!currentUser) {
        throw new Error('Please log in first')
      }
      const userId = currentUser.id
      const nextUsers = users.filter((item) => item.id !== userId)
      users.length = 0
      nextUsers.forEach((item) => users.push(item))
      saveJson(STORAGE_KEYS.users, users)
      removeKey(getUserKey(STORAGE_KEYS.entries, userId))
      removeKey(getUserKey(STORAGE_KEYS.documents, userId))
      removeKey(getUserKey(STORAGE_KEYS.categories, userId))
      saveJson(STORAGE_KEYS.user, null)
      currentUser = null
      loadUserData(currentUser)
      return true
    },
  },
  entries: {
    list: async (filters = {}) => {
      await sleep(400)
      if (!currentUser) return []
      let changed = false
      const nextEntries = dbEntries.map((entry) => {
        const updated = applyAppointmentArchive(applyDueStatus(entry))
        if (updated !== entry) changed = true
        return updated
      })
      if (changed) {
        dbEntries = nextEntries
        saveEntries()
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
      if (!currentUser) {
        throw new Error('Please log in first')
      }
      const newEntry = normalizeEntry({
        id: Math.random().toString(36).substr(2, 9),
        userId: currentUser.id,
        title: data.title || 'Untitled',
        category: data.category || 'Personal',
        status: data.status || EntryStatus.ACTIVE,
        type: data.type || getEntryTypeForCategory(data.category),
        expirationDate: data.expirationDate,
        startAt: data.startAt,
        companyName: data.companyName || '',
        portalUrl: data.portalUrl || '',
        location: data.location || '',
        notes: data.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      dbEntries.push(newEntry)
      saveEntries()
      return newEntry
    },
    update: async (id, data) => {
      await sleep(400)
      if (!currentUser) {
        throw new Error('Please log in first')
      }
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
      saveEntries()
      return updatedEntry
    },
    delete: async (id) => {
      await sleep(300)
      if (!currentUser) {
        throw new Error('Please log in first')
      }
      dbEntries = dbEntries.filter((entry) => entry.id !== id)
      dbDocuments = dbDocuments.filter((doc) => doc.entryId !== id)
      saveEntries()
      saveDocuments()
    },
  },
  documents: {
    list: async (limit) => {
      await sleep(300)
      if (!currentUser) return []
      const sorted = [...dbDocuments].sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      )
      return limit ? sorted.slice(0, limit) : sorted
    },
    removeByEntry: async (entryId) => {
      await sleep(200)
      if (!currentUser) {
        throw new Error('Please log in first')
      }
      dbDocuments = dbDocuments.filter((doc) => doc.entryId !== entryId)
      saveDocuments()
      return true
    },
    create: async (entryId, file) => {
      await sleep(400)
      if (!currentUser) {
        throw new Error('Please log in first')
      }
      const isFileObject = file && typeof file === 'object'
      const filename = isFileObject ? file.name : file
      const fileUrl = isFileObject ? file.dataUrl : ''
      const mimeType = isFileObject ? file.type || 'application/octet-stream' : 'application/octet-stream'
      const newDoc = {
        id: Math.random().toString(36).substr(2, 9),
        userId: currentUser.id,
        entryId,
        filename: filename || 'document',
        fileUrl: fileUrl || '',
        mimeType,
        uploadedAt: new Date().toISOString(),
      }
      dbDocuments.push(newDoc)
      saveDocuments()
      return newDoc
    },
  },
  categories: {
    list: async () => {
      await sleep(200)
      if (!currentUser) return DEFAULT_CATEGORIES.map(normalizeCategory)
      return [...dbCategories]
    },
    create: async (data) => {
      await sleep(300)
      if (!currentUser) {
        throw new Error('Please log in first')
      }
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
      saveCategories()
      return newCategory
    },
    update: async (id, data) => {
      await sleep(300)
      if (!currentUser) {
        throw new Error('Please log in first')
      }
      const target = dbCategories.find((category) => category.id === id)
      if (!target) throw new Error('Category not found')
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
        saveEntries()
      }
      saveCategories()
      return dbCategories.find((category) => category.id === id)
    },
    delete: async (id) => {
      await sleep(300)
      if (!currentUser) {
        throw new Error('Please log in first')
      }
      const target = dbCategories.find((category) => category.id === id)
      if (!target) throw new Error('Category not found')
      dbCategories = dbCategories.filter((category) => category.id !== id)
      saveCategories()
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
        saveEntries()
      }
      return true
    },
  },
}
