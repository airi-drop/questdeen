import { getTodayKey } from './date'
import { getLevelFromXP } from './xp'

export const DEFAULT_USER_ID = 'default-user'
export const SETTINGS_ID = 'settings'

export function createDefaultUserRecord(now = new Date()) {
  const totalXP = 0

  return {
    id: DEFAULT_USER_ID,
    name: 'Ahmed',
    totalXP,
    level: getLevelFromXP(totalXP),
    currentStreak: 0,
    bestStreak: 0,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    lastActiveDate: getTodayKey(now),
  }
}

export function createDefaultSettingsRecord(userId = DEFAULT_USER_ID) {
  return {
    id: SETTINGS_ID,
    activeUserId: userId,
    theme: 'light',
    notificationsEnabled: true,
    updatedAt: new Date().toISOString(),
  }
}
