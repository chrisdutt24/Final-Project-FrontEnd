const SETTINGS_KEY = 'lifeAdmin.settings.dateTime'

export const DEFAULT_DATE_SETTINGS = {
  dateFormat: 'DD.MM.YYYY',
  timeFormat: '24',
}

const getLocale = (dateFormat) =>
  dateFormat === 'MM/DD/YYYY' ? 'en-US' : 'de-DE'

export const loadDateTimeSettings = () => {
  if (typeof window === 'undefined') return DEFAULT_DATE_SETTINGS
  const raw = window.localStorage.getItem(SETTINGS_KEY)
  if (!raw) return DEFAULT_DATE_SETTINGS
  try {
    const parsed = JSON.parse(raw)
    return {
      dateFormat: parsed?.dateFormat || DEFAULT_DATE_SETTINGS.dateFormat,
      timeFormat: parsed?.timeFormat || DEFAULT_DATE_SETTINGS.timeFormat,
    }
  } catch {
    return DEFAULT_DATE_SETTINGS
  }
}

export const saveDateTimeSettings = (settings) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export const formatDateWithSettings = (value, settings) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const locale = getLocale(settings.dateFormat)
  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export const formatTimeWithSettings = (value, settings) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const locale = getLocale(settings.dateFormat)
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: settings.timeFormat === '12',
  })
}

export const formatDateTimeWithSettings = (value, settings) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const locale = getLocale(settings.dateFormat)
  return date.toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: settings.timeFormat === '12',
  })
}

export const formatDate = (value) => formatDateWithSettings(value, loadDateTimeSettings())

export const formatTime = (value) => formatTimeWithSettings(value, loadDateTimeSettings())

export const formatDateTime = (value) =>
  formatDateTimeWithSettings(value, loadDateTimeSettings())
