import { EntryType } from './types'

export const CATEGORY_GROUPS = [
  { id: 'contracts', label: 'Contract' },
  { id: 'appointments', label: 'Appointments' },
]

export const ICON_OPTIONS = [
  { id: 'fa-file-lines', label: 'Document' },
  { id: 'fa-calendar-check', label: 'Calendar' },
  { id: 'fa-heart-pulse', label: 'Health' },
  { id: 'fa-coins', label: 'Finance' },
  { id: 'fa-shield-halved', label: 'Insurance' },
  { id: 'fa-house', label: 'Rent' },
  { id: 'fa-wifi', label: 'Internet' },
  { id: 'fa-sim-card', label: 'SIM Card' },
  { id: 'fa-bolt', label: 'Electricity' },
  { id: 'fa-arrows-rotate', label: 'Subscription' },
  { id: 'fa-user', label: 'Personal' },
  { id: 'fa-calendar-day', label: 'Event' },
  { id: 'fa-user-group', label: 'Friends' },
  { id: 'fa-briefcase', label: 'Work' },
  { id: 'fa-bell', label: 'Reminder' },
  { id: 'fa-clipboard-list', label: 'Checklist' },
]

export const DEFAULT_CATEGORIES = [
  {
    id: 'contracts',
    name: 'General',
    group: 'contracts',
    entryType: EntryType.CONTRACT,
    icon: 'fa-file-lines',
    locked: true,
  },
  {
    id: 'rent',
    name: 'Rent',
    group: 'contracts',
    entryType: EntryType.CONTRACT,
    icon: 'fa-house',
    locked: true,
  },
  {
    id: 'insurance',
    name: 'Insurance',
    group: 'contracts',
    entryType: EntryType.INSURANCE,
    icon: 'fa-shield-halved',
    locked: true,
  },
  {
    id: 'internet',
    name: 'Internet',
    group: 'contracts',
    entryType: EntryType.CONTRACT,
    icon: 'fa-wifi',
    locked: true,
  },
  {
    id: 'sim-card',
    name: 'SIM Card',
    group: 'contracts',
    entryType: EntryType.CONTRACT,
    icon: 'fa-sim-card',
    locked: true,
  },
  {
    id: 'electricity',
    name: 'Electricity',
    group: 'contracts',
    entryType: EntryType.CONTRACT,
    icon: 'fa-bolt',
    locked: true,
  },
  {
    id: 'subscriptions',
    name: 'Subscriptions',
    group: 'contracts',
    entryType: EntryType.CONTRACT,
    icon: 'fa-arrows-rotate',
    locked: true,
  },
  {
    id: 'appointments',
    name: 'Appointments',
    group: 'appointments',
    entryType: EntryType.APPOINTMENT,
    icon: 'fa-calendar-check',
    locked: true,
  },
  {
    id: 'health',
    name: 'Health',
    group: 'appointments',
    entryType: EntryType.HEALTH,
    icon: 'fa-heart-pulse',
    locked: true,
  },
  {
    id: 'finance',
    name: 'Finance',
    group: 'contracts',
    entryType: EntryType.FINANCE,
    icon: 'fa-coins',
    locked: true,
  },
  {
    id: 'personal',
    name: 'Personal',
    group: 'appointments',
    entryType: EntryType.PERSONAL,
    icon: 'fa-user',
    locked: true,
  },
  {
    id: 'events',
    name: 'Events',
    group: 'appointments',
    entryType: EntryType.EVENT,
    icon: 'fa-calendar-day',
    locked: true,
  },
  {
    id: 'friends',
    name: 'Friends',
    group: 'appointments',
    entryType: EntryType.FRIEND,
    icon: 'fa-user-group',
    locked: true,
  },
  {
    id: 'work',
    name: 'Work',
    group: 'appointments',
    entryType: EntryType.WORK,
    icon: 'fa-briefcase',
    locked: true,
  },
]

export const getCategoryByName = (categories, name) =>
  categories.find((category) => category.name === name)

export const getCategoryIcon = (categories, name) =>
  getCategoryByName(categories, name)?.icon || 'fa-tag'
