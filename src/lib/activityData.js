import { initDB } from './db'

const PRAYER_LABELS = {
  subuh: 'Subuh',
  dzuhur: 'Dzuhur',
  ashar: 'Ashar',
  maghrib: 'Maghrib',
  isya: 'Isya',
}

const LOG_LABELS = {
  tilawah: (record) => ({
    title: 'Added Quran ayat',
    description: `${record.ayatCount ?? record.amount} ayat recorded`,
    icon: '📖',
  }),
  quran: (record) => ({
    title: 'Added Quran ayat',
    description: `${record.ayatCount ?? record.amount} ayat recorded`,
    icon: '📖',
  }),
  dzikir: () => ({
    title: 'Completed dzikir',
    description: 'Evening dzikir marked complete',
    icon: '🌙',
  }),
  sedekah: () => ({
    title: 'Completed sedekah',
    description: 'Weekly sedekah marked complete',
    icon: '🤲',
  }),
  memorize_short_surah: () => ({
    title: 'Completed memorization',
    description: 'Short surah marked memorized',
    icon: '🕌',
  }),
}

const ACHIEVEMENT_LABELS = {
  first_prayer: 'Langkah Pertama',
  streak_3: 'Istiqomah Pemula',
  streak_7: 'Seminggu Penuh',
  streak_30: 'Sebulan Istiqomah',
  quran_100: "Pecinta Qur'an",
  quest_10: 'Quest Hunter',
  subuh_warrior: 'Pejuang Subuh',
}

function formatActivityDate(dateString) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  })
    .format(new Date(dateString))
    .replace('.', ':')
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function getAll(storeName) {
  const db = await initDB()

  return requestToPromise(
    db.transaction(storeName, 'readonly').objectStore(storeName).getAll(),
  )
}

export async function getRecentActivities(userId) {
  const [prayers, logs, quests, achievements] = await Promise.all([
    getAll('prayers'),
    getAll('ibadah_log'),
    getAll('quests'),
    getAll('achievements'),
  ])
  const activities = [
    ...prayers
      .filter((record) => record.userId === userId && record.status === 'done')
      .map((record) => ({
        id: `prayer:${record.id}`,
        type: 'prayer',
        icon: '✅',
        title: `Completed ${PRAYER_LABELS[record.prayer] || record.prayer} prayer`,
        description: 'Prayer marked complete',
        xpEarned: record.xpEarned || 0,
        createdAt: record.updatedAt || record.createdAt,
      })),
    ...logs
      .filter((record) => record.userId === userId)
      .map((record) => {
        const label = LOG_LABELS[record.type]?.(record) || {
          title: 'Ibadah logged',
          description: 'Progress updated',
          icon: '✨',
        }

        return {
          id: `log:${record.id}`,
          type: record.type,
          icon: label.icon,
          title: label.title,
          description: label.description,
          xpEarned: record.xpEarned || 0,
          createdAt: record.createdAt,
        }
      }),
    ...quests
      .filter((record) => record.userId === userId && record.isCompleted)
      .map((record) => ({
        id: `quest:${record.id}`,
        type: 'quest',
        icon: '🎯',
        title: `Finished ${record.title}`,
        description: 'Quest completed',
        xpEarned: record.xpEarned || record.xpReward || 0,
        createdAt: record.completedAt || record.updatedAt,
      })),
    ...achievements
      .filter((record) => record.userId === userId)
      .map((record) => ({
        id: `achievement:${record.id}`,
        type: 'achievement',
        icon: '🏆',
        title: 'Unlocked achievement',
        description: ACHIEVEMENT_LABELS[record.badgeKey] || record.badgeKey,
        xpEarned: record.xpEarned || record.xpReward || 0,
        createdAt: record.unlockedAt,
      })),
  ]

  return activities
    .filter((activity) => activity.createdAt)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((activity) => ({
      ...activity,
      dateLabel: formatActivityDate(activity.createdAt),
    }))
    .slice(0, 10)
}
