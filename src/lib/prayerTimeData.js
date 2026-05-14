import {
  CalculationMethod,
  Coordinates,
  Madhab,
  PrayerTimes,
} from 'adhan'
import { SETTINGS_ID, createDefaultSettingsRecord } from './defaultData'
import { getTodayKey } from './date'
import { initDB } from './db'

export const DEFAULT_LOCATION = {
  latitude: -6.2,
  longitude: 106.816666,
  accuracy: null,
  label: 'Jakarta, Indonesia',
  source: 'default',
  updatedAt: null,
}

export function getReadableLocationLabel(location) {
  const label = location?.label?.trim()

  if (label && label !== 'Current location' && label !== 'Saved location') {
    return label
  }

  return 'Lokasi berhasil disimpan'
}

function getDistanceKm(firstLocation, secondLocation) {
  if (
    typeof firstLocation?.latitude !== 'number' ||
    typeof firstLocation?.longitude !== 'number' ||
    typeof secondLocation?.latitude !== 'number' ||
    typeof secondLocation?.longitude !== 'number'
  ) {
    return Number.POSITIVE_INFINITY
  }

  const earthRadiusKm = 6371
  const toRadians = (degrees) => (degrees * Math.PI) / 180
  const latDistance = toRadians(secondLocation.latitude - firstLocation.latitude)
  const lonDistance = toRadians(secondLocation.longitude - firstLocation.longitude)
  const firstLat = toRadians(firstLocation.latitude)
  const secondLat = toRadians(secondLocation.latitude)
  const haversine =
    Math.sin(latDistance / 2) ** 2 +
    Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(lonDistance / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

function hasFreshReverseGeocode(location) {
  if (!location?.reverseGeocodedAt || !location?.label) {
    return false
  }

  const ageMs = Date.now() - new Date(location.reverseGeocodedAt).getTime()

  return ageMs < REVERSE_GEOCODE_CACHE_DAYS * 24 * 60 * 60 * 1000
}

function getAddressPart(address, keys) {
  return keys.map((key) => address?.[key]).find(Boolean) || ''
}

function normalizeProvince(province) {
  const provinceMap = {
    'Daerah Istimewa Yogyakarta': 'DI Yogyakarta',
    'Daerah Khusus Ibukota Jakarta': 'DKI Jakarta',
    'Special Capital Region of Jakarta': 'DKI Jakarta',
    Banten: 'Banten',
    Jakarta: 'DKI Jakarta',
    'West Java': 'Jawa Barat',
    'Central Java': 'Jawa Tengah',
    'East Java': 'Jawa Timur',
    Yogyakarta: 'DI Yogyakarta',
  }

  return provinceMap[province] || province
}

function createLocationLabel({ city, district, province }) {
  const normalizedProvince = normalizeProvince(province)
  const normalizedDistrict =
    district && !/^kecamatan\s/i.test(district)
      ? `Kecamatan ${district}`
      : district

  if (normalizedDistrict && city) {
    return `${normalizedDistrict}, ${city}`
  }

  if (city && normalizedProvince) {
    return `${city}, ${normalizedProvince}`
  }

  if (normalizedDistrict && normalizedProvince) {
    return `${normalizedDistrict}, ${normalizedProvince}`
  }

  return city || normalizedDistrict || normalizedProvince || ''
}

async function reverseGeocodeLocation(location) {
  if (!navigator.onLine) {
    return null
  }

  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(location.latitude),
    lon: String(location.longitude),
    addressdetails: '1',
    zoom: '12',
    'accept-language': 'id',
  })
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
    {
      headers: {
        Accept: 'application/json',
      },
    },
  )

  if (!response.ok) {
    throw new Error('Reverse geocoding failed.')
  }

  const result = await response.json()
  const address = result.address || {}
  const city = getAddressPart(address, [
    'city',
    'town',
    'municipality',
    'city_district',
  ])
  const district = getAddressPart(address, [
    'suburb',
    'district',
    'subdistrict',
    'village',
    'neighbourhood',
  ])
  const county = getAddressPart(address, ['county', 'regency'])
  const province = getAddressPart(address, ['state', 'region'])
  const label = createLocationLabel({
    city: city || county,
    district,
    province,
  })

  return {
    city: city || county,
    district,
    province: normalizeProvince(province),
    label: label || result.display_name || '',
    formattedLabel: label || result.display_name || '',
    reverseGeocodedAt: new Date().toISOString(),
    reverseGeocodeProvider: 'nominatim',
  }
}

export const CALCULATION_METHOD_OPTIONS = [
  { value: 'singapore', label: 'Indonesia / Singapore / Malaysia' },
  { value: 'muslimWorldLeague', label: 'Muslim World League' },
  { value: 'ummAlQura', label: 'Umm Al-Qura' },
  { value: 'karachi', label: 'Karachi' },
  { value: 'egyptian', label: 'Egyptian' },
  { value: 'dubai', label: 'Dubai' },
  { value: 'moonsighting', label: 'Moonsighting Committee' },
]

export const MADHAB_OPTIONS = [
  { value: 'shafi', label: 'Shafi' },
  { value: 'hanafi', label: 'Hanafi' },
]

const PRAYER_TIME_KEYS = {
  subuh: 'fajr',
  dzuhur: 'dhuhr',
  ashar: 'asr',
  maghrib: 'maghrib',
  isya: 'isha',
}

const METHOD_FACTORIES = {
  singapore: CalculationMethod.Singapore,
  muslimWorldLeague: CalculationMethod.MuslimWorldLeague,
  ummAlQura: CalculationMethod.UmmAlQura,
  karachi: CalculationMethod.Karachi,
  egyptian: CalculationMethod.Egyptian,
  dubai: CalculationMethod.Dubai,
  moonsighting: CalculationMethod.MoonsightingCommittee,
}

let notificationTimers = []
const LOCATION_REFRESH_DISTANCE_KM = 0.7
const REVERSE_GEOCODE_CACHE_DAYS = 14

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function transactionToPromise(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

export function getDefaultPrayerSettings(settings = {}) {
  return {
    ...createDefaultSettingsRecord(settings.activeUserId || undefined).prayerSettings,
    ...(settings.prayerSettings || {}),
  }
}

function createCalculationParams(prayerSettings = {}) {
  const method = prayerSettings.calculationMethod || 'singapore'
  const params = (METHOD_FACTORIES[method] || CalculationMethod.Singapore)()

  params.madhab =
    prayerSettings.madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi

  return params
}

function getLocation(user) {
  return typeof user?.location?.latitude === 'number' &&
    typeof user?.location?.longitude === 'number'
    ? user.location
    : DEFAULT_LOCATION
}

function getCacheId(userId, date) {
  return `${userId}:${date}`
}

function formatPrayerTime(date) {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(date)
    .replace('.', ':')
}

function serializeTimes(prayerTimes) {
  return Object.fromEntries(
    Object.entries(PRAYER_TIME_KEYS).map(([prayer, adhanKey]) => [
      prayer,
      prayerTimes[adhanKey].toISOString(),
    ]),
  )
}

function calculateTimes({ date = new Date(), location, prayerSettings }) {
  const coordinates = new Coordinates(location.latitude, location.longitude)
  const params = createCalculationParams(prayerSettings)
  const prayerTimes = new PrayerTimes(coordinates, date, params)

  return serializeTimes(prayerTimes)
}

async function getCachedSchedule(userId, date) {
  const db = await initDB()

  return requestToPromise(
    db.transaction('prayer_schedules', 'readonly')
      .objectStore('prayer_schedules')
      .get(getCacheId(userId, date)),
  )
}

async function saveCachedSchedule(schedule) {
  const db = await initDB()
  const transaction = db.transaction('prayer_schedules', 'readwrite')

  transaction.objectStore('prayer_schedules').put(schedule)
  await transactionToPromise(transaction)
}

function isSameCalculation(cachedSchedule, location, prayerSettings) {
  return (
    cachedSchedule?.location?.latitude === location.latitude &&
    cachedSchedule?.location?.longitude === location.longitude &&
    cachedSchedule?.location?.label === location.label &&
    cachedSchedule?.calculationMethod === prayerSettings.calculationMethod &&
    cachedSchedule?.madhab === prayerSettings.madhab
  )
}

function dateFromKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number)

  return new Date(year, month - 1, day)
}

export async function getPrayerScheduleForDate(user, settings, dateKey) {
  const date = dateKey || getTodayKey()
  const prayerSettings = getDefaultPrayerSettings(settings)
  const location = getLocation(user)
  const cachedSchedule = await getCachedSchedule(user.id, date)

  if (cachedSchedule && isSameCalculation(cachedSchedule, location, prayerSettings)) {
    return cachedSchedule
  }

  const schedule = {
    id: getCacheId(user.id, date),
    userId: user.id,
    date,
    times: calculateTimes({ date: dateFromKey(date), location, prayerSettings }),
    location,
    calculationMethod: prayerSettings.calculationMethod,
    madhab: prayerSettings.madhab,
    generatedAt: new Date().toISOString(),
  }

  await saveCachedSchedule(schedule)

  return schedule
}

export function getFirstPrayerFromSchedule(schedule) {
  const startsAt = new Date(schedule.times.subuh)

  return {
    prayer: 'subuh',
    name: 'Subuh',
    time: formatPrayerTime(startsAt),
    startsAt: startsAt.toISOString(),
  }
}

export async function getTodayPrayerSchedule(user, settings, now = new Date()) {
  return getPrayerScheduleForDate(user, settings, getTodayKey(now))
}

export function createPrayerTimingState({ prayers, schedule, now = new Date() }) {
  const timeline = prayers.map((prayer) => ({
    ...prayer,
    startsAt: new Date(schedule.times[prayer.prayer]),
  }))
  const nextPrayer =
    timeline.find((prayer) => prayer.startsAt.getTime() > now.getTime()) || null
  const activeIndex = timeline.findIndex((prayer, index) => {
    const nextStart = timeline[index + 1]?.startsAt

    return (
      prayer.startsAt.getTime() <= now.getTime() &&
      (!nextStart || now.getTime() < nextStart.getTime())
    )
  })

  return {
    prayers: timeline.map((prayer, index) => {
      let timingStatus = 'upcoming'

      if (prayer.isDone) {
        timingStatus = 'completed'
      } else if (index === activeIndex) {
        timingStatus = 'active'
      } else if (prayer.startsAt.getTime() < now.getTime()) {
        timingStatus = 'missed'
      }

      return {
        ...prayer,
        time: formatPrayerTime(prayer.startsAt),
        startsAt: prayer.startsAt.toISOString(),
        timingStatus,
      }
    }),
    nextPrayer: nextPrayer
      ? {
          prayer: nextPrayer.prayer,
          name: nextPrayer.name,
          time: formatPrayerTime(nextPrayer.startsAt),
          startsAt: nextPrayer.startsAt.toISOString(),
        }
      : null,
    currentPrayer:
      activeIndex >= 0
        ? {
            prayer: timeline[activeIndex].prayer,
            name: timeline[activeIndex].name,
            time: formatPrayerTime(timeline[activeIndex].startsAt),
            startsAt: timeline[activeIndex].startsAt.toISOString(),
          }
        : null,
  }
}

export function formatCountdown(targetDate, now = new Date()) {
  const distance = Math.max(0, targetDate.getTime() - now.getTime())
  const totalSeconds = Math.floor(distance / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, '0'))
    .join(':')
}

export async function requestAndStoreLocation({ forceReverseGeocode = false } = {}) {
  if (!('geolocation' in navigator)) {
    throw new Error('Geolocation is not supported in this browser.')
  }

  const position = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: 1000 * 60 * 30,
      timeout: 12000,
    })
  })
  const db = await initDB()
  const settings = await requestToPromise(
    db.transaction('settings', 'readonly').objectStore('settings').get(SETTINGS_ID),
  )
  const user = await requestToPromise(
    db.transaction('users', 'readonly')
      .objectStore('users')
      .get(settings?.activeUserId),
  )

  if (!user) {
    throw new Error('No active user found.')
  }

  const newCoordinates = {
    latitude: Number(position.coords.latitude.toFixed(6)),
    longitude: Number(position.coords.longitude.toFixed(6)),
  }
  const distanceKm = getDistanceKm(user.location, newCoordinates)
  const shouldReverseGeocode =
    forceReverseGeocode ||
    !hasFreshReverseGeocode(user.location) ||
    distanceKm >= LOCATION_REFRESH_DISTANCE_KM
  const existingLabel = user.location?.label?.trim()
  const location = {
    ...user.location,
    ...newCoordinates,
    accuracy: Math.round(position.coords.accuracy || 0),
    label: existingLabel || '',
    source: 'browser',
    updatedAt: new Date().toISOString(),
  }

  if (shouldReverseGeocode) {
    try {
      const geocodedLocation = await reverseGeocodeLocation(location)

      if (geocodedLocation?.label) {
        Object.assign(location, geocodedLocation)
      }
    } catch (error) {
      console.warn('Reverse geocoding failed:', error)
    }
  }

  if (!location.label) {
    location.label = 'Lokasi berhasil disimpan'
  }

  const transaction = db.transaction('users', 'readwrite')

  transaction.objectStore('users').put({
    ...user,
    location,
    updatedAt: new Date().toISOString(),
  })
  await transactionToPromise(transaction)

  return location
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    throw new Error('Notifications are not supported in this browser.')
  }

  return Notification.requestPermission()
}

function createNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return
  }

  new Notification(title, {
    body,
    icon: '/favicon.svg',
    tag: `questdeen:${title}:${body}`,
  })
}

export function schedulePrayerNotifications({ prayers, settings, now = new Date() }) {
  notificationTimers.forEach((timer) => window.clearTimeout(timer))
  notificationTimers = []

  const prayerSettings = getDefaultPrayerSettings(settings)

  if (
    !prayerSettings.notificationsEnabled ||
    !('Notification' in window) ||
    Notification.permission !== 'granted'
  ) {
    return
  }

  prayers.forEach((prayer) => {
    const startsAt = new Date(prayer.startsAt)
    const beforeAt = new Date(
      startsAt.getTime() - prayerSettings.notificationOffsetMinutes * 60000,
    )
    const beforeDelay = beforeAt.getTime() - now.getTime()
    const atDelay = startsAt.getTime() - now.getTime()

    if (prayerSettings.notifyBeforePrayer && beforeDelay > 0) {
      notificationTimers.push(
        window.setTimeout(() => {
          createNotification(
            'QuestDeen',
            `Waktu ${prayer.name} sebentar lagi.`,
          )
        }, beforeDelay),
      )
    }

    if (prayerSettings.notifyAtPrayerTime && atDelay > 0) {
      notificationTimers.push(
        window.setTimeout(() => {
          createNotification(
            'QuestDeen',
            `Saatnya menunaikan shalat ${prayer.name}.`,
          )
        }, atDelay),
      )
    }
  })
}
