import { Flame, Sparkles, Trophy } from 'lucide-react'
import { initDB } from './db'
import { addDays, getTodayKey } from './date'
import {
  createPrayerTimingState,
  getFirstPrayerFromSchedule,
  getPrayerScheduleForDate,
  getTodayPrayerSchedule,
} from './prayerTimeData'
import { getLevelFromXP } from './xp'

export const PRAYER_XP = 10

export const PRAYER_NAMES = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya']

const PRAYER_LABELS = {
  subuh: 'Subuh',
  dzuhur: 'Dzuhur',
  ashar: 'Ashar',
  maghrib: 'Maghrib',
  isya: 'Isya',
}

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

function getPrayerId(userId, date, prayer) {
  return `${userId}:${date}:${prayer}`
}

function createPendingPrayer(userId, date, prayer) {
  return {
    id: getPrayerId(userId, date, prayer),
    userId,
    date,
    prayer,
    status: 'pending',
    xpEarned: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function toPrayerView(record) {
  return {
    id: record.id,
    name: PRAYER_LABELS[record.prayer],
    prayer: record.prayer,
    time: '',
    isDone: record.status === 'done',
    status: record.status,
    xpEarned: record.xpEarned || 0,
  }
}

function getCompletedDateSet(records) {
  const dates = new Map()

  records.forEach((record) => {
    if (record.status !== 'done') {
      return
    }

    const prayers = dates.get(record.date) || new Set()
    prayers.add(record.prayer)
    dates.set(record.date, prayers)
  })

  return new Set(
    [...dates.entries()]
      .filter(([, prayers]) => PRAYER_NAMES.every((prayer) => prayers.has(prayer)))
      .map(([date]) => date),
  )
}

function calculateStreak(records, todayKey = getTodayKey()) {
  const completedDates = getCompletedDateSet(records)
  let cursor = completedDates.has(todayKey) ? todayKey : addDays(todayKey, -1)
  let streak = 0

  while (completedDates.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }

  return streak
}

async function getUserPrayerRecords(userId) {
  const db = await initDB()
  const records = await requestToPromise(
    db.transaction('prayers', 'readonly').objectStore('prayers').getAll(),
  )

  return records.filter((record) => record.userId === userId)
}

export async function getPrayerDashboardData(user, settings, now = new Date()) {
  const db = await initDB()
  const todayKey = getTodayKey()
  const prayerStore = db.transaction('prayers', 'readonly').objectStore('prayers')
  const todayRecords = await Promise.all(
    PRAYER_NAMES.map((prayer) =>
      requestToPromise(prayerStore.get(getPrayerId(user.id, todayKey, prayer))),
    ),
  )
  const normalizedRecords = todayRecords.map((record, index) => {
    return record || createPendingPrayer(user.id, todayKey, PRAYER_NAMES[index])
  })
  const completedCount = normalizedRecords.filter(
    (record) => record.status === 'done',
  ).length
  const todayXP = normalizedRecords.reduce(
    (total, record) => total + (record.xpEarned || 0),
    0,
  )
  const schedule = await getTodayPrayerSchedule(user, settings, now)
  const timingState = createPrayerTimingState({
    prayers: normalizedRecords.map(toPrayerView),
    schedule,
    now,
  })
  const nextPrayer =
    timingState.nextPrayer ||
    getFirstPrayerFromSchedule(
      await getPrayerScheduleForDate(user, settings, addDays(todayKey, 1)),
    )

  return {
    date: todayKey,
    prayers: timingState.prayers,
    nextPrayer,
    currentPrayer: timingState.currentPrayer,
    prayerSchedule: schedule,
    completedCount,
    todayXP,
    stats: [
      {
        label: 'Total XP',
        value: String(user.totalXP || 0),
        detail: `+${todayXP} XP today`,
        icon: Sparkles,
        tone: 'emerald',
      },
      {
        label: 'Current Level',
        value: `Level ${user.level || getLevelFromXP(user.totalXP || 0)}`,
        detail: `${completedCount} prayers completed today`,
        icon: Trophy,
        tone: 'amber',
      },
      {
        label: 'Current Streak',
        value: `${user.currentStreak || 0} days`,
        detail: `Best streak: ${user.bestStreak || 0} days`,
        icon: Flame,
        tone: 'amber',
      },
    ],
  }
}

export async function setTodayPrayerStatus(userId, prayer, nextStatus) {
  const db = await initDB()
  const date = getTodayKey()
  const now = new Date().toISOString()
  const prayerId = getPrayerId(userId, date, prayer)
  const existingPrayer = await requestToPromise(
    db.transaction('prayers', 'readonly').objectStore('prayers').get(prayerId),
  )
  const existingUser = await requestToPromise(
    db.transaction('users', 'readonly').objectStore('users').get(userId),
  )

  if (!existingUser) {
    throw new Error(`User not found: ${userId}`)
  }

  const shouldAwardXP = nextStatus === 'done' && !(existingPrayer?.xpEarned > 0)
  const prayerRecord = {
    ...(existingPrayer || createPendingPrayer(userId, date, prayer)),
    status: nextStatus,
    xpEarned: existingPrayer?.xpEarned || (shouldAwardXP ? PRAYER_XP : 0),
    xpAwardedAt:
      existingPrayer?.xpAwardedAt || (shouldAwardXP ? now : undefined),
    updatedAt: now,
  }
  const nextTotalXP = (existingUser.totalXP || 0) + (shouldAwardXP ? PRAYER_XP : 0)

  await new Promise((resolve, reject) => {
    const transaction = db.transaction(['prayers', 'users'], 'readwrite')

    transaction.objectStore('prayers').put(prayerRecord)
    transaction.objectStore('users').put({
      ...existingUser,
      totalXP: nextTotalXP,
      level: getLevelFromXP(nextTotalXP),
      lastActiveDate: date,
      updatedAt: now,
    })
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })

  const allPrayerRecords = await getUserPrayerRecords(userId)
  const currentStreak = calculateStreak(allPrayerRecords, date)
  const refreshedUser = await requestToPromise(
    db.transaction('users', 'readonly').objectStore('users').get(userId),
  )
  const userWithStreak = {
    ...refreshedUser,
    currentStreak,
    bestStreak: Math.max(refreshedUser.bestStreak || 0, currentStreak),
    updatedAt: new Date().toISOString(),
  }
  const transaction = db.transaction('users', 'readwrite')

  transaction.objectStore('users').put(userWithStreak)
  await transactionToPromise(transaction)

  return userWithStreak
}
