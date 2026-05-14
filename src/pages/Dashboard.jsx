import { useCallback, useEffect, useState } from 'react'
import ActivityFeed from '../components/ActivityFeed'
import AchievementPreview from '../components/AchievementPreview'
import AppShell from '../components/AppShell'
import PrayerTrackerCard from '../components/PrayerTrackerCard'
import QuickIbadahLogCard from '../components/QuickIbadahLogCard'
import QuestSection from '../components/QuestSection'
import StatCard from '../components/StatCard'
import TodayContextCard from '../components/TodayContextCard'
import ToastStack from '../components/ToastStack'
import { getActiveUser, getOrCreateActiveUser, getSettings } from '../lib/db'
import { refreshAchievements } from '../lib/achievementData'
import { getRecentActivities } from '../lib/activityData'
import {
  getPrayerDashboardData,
  setTodayPrayerStatus,
} from '../lib/prayerData'
import {
  requestAndStoreLocation,
  schedulePrayerNotifications,
} from '../lib/prayerTimeData'
import {
  addQuranAyatLog,
  addSingleIbadahLog,
  refreshQuestData,
} from '../lib/questData'

function Dashboard({
  activePage = 'dashboard',
  isDarkMode,
  onNavigate,
  onResetLocalData,
  onToggleDarkMode,
}) {
  const [dashboardData, setDashboardData] = useState({
    user: null,
    prayers: [],
    stats: [],
    dailyQuests: [],
    weeklyQuests: [],
    achievements: [],
    activities: [],
    settings: null,
    nextPrayer: null,
    currentPrayer: null,
    prayerSchedule: null,
  })
  const [updatingPrayer, setUpdatingPrayer] = useState(null)
  const [quranAyatInput, setQuranAyatInput] = useState('')
  const [ibadahFeedback, setIbadahFeedback] = useState('')
  const [toasts, setToasts] = useState([])
  const [now, setNow] = useState(new Date())

  const loadDashboardData = useCallback(async () => {
    const user = await getOrCreateActiveUser()
    const questData = await refreshQuestData(user.id)
    const userAfterQuests = (await getActiveUser()) || user
    const achievementData = await refreshAchievements(userAfterQuests)
    const refreshedUser = (await getActiveUser()) || userAfterQuests
    const settings = await getSettings()
    const prayerData = await getPrayerDashboardData(refreshedUser, settings)
    const activities = await getRecentActivities(refreshedUser.id)
    const todayXP =
      prayerData.todayXP +
      questData.dailyQuests.reduce(
        (total, quest) => total + (quest.xpEarned || 0),
        0,
      )
    const stats = prayerData.stats.map((stat) => {
      if (stat.label !== 'Total XP') {
        return stat
      }

      return {
        ...stat,
        detail: `+${todayXP} XP today`,
      }
    })

    const nextData = {
      user: refreshedUser,
      prayers: prayerData.prayers,
      settings,
      nextPrayer: prayerData.nextPrayer,
      currentPrayer: prayerData.currentPrayer,
      prayerSchedule: prayerData.prayerSchedule,
      stats,
      dailyQuests: questData.dailyQuests,
      weeklyQuests: questData.weeklyQuests,
      achievements: achievementData.achievements,
      activities,
    }

    setDashboardData(nextData)

    return nextData
  }, [])

  useEffect(() => {
    // IndexedDB is the external local store for this screen; hydrate once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboardData().catch((error) => {
      console.error('Failed to load dashboard data:', error)
    })
  }, [loadDashboardData])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 60000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!dashboardData.prayers.length || !dashboardData.settings) {
      return undefined
    }

    schedulePrayerNotifications({
      prayers: dashboardData.prayers,
      settings: dashboardData.settings,
    })

    return undefined
  }, [dashboardData.prayers, dashboardData.settings])

  useEffect(() => {
    const refreshEnabled =
      dashboardData.settings?.prayerSettings?.autoLocationRefresh

    if (!refreshEnabled || dashboardData.user?.location || !navigator.permissions) {
      return undefined
    }

    navigator.permissions
      .query({ name: 'geolocation' })
      .then((permission) => {
        if (permission.state !== 'granted') {
          return
        }

        requestAndStoreLocation()
          .then(() => loadDashboardData())
          .catch((error) => {
            console.error('Failed to auto refresh location:', error)
          })
      })
      .catch(() => {})

    return undefined
  }, [dashboardData.settings, dashboardData.user, loadDashboardData])

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadDashboardData().catch((error) => {
        console.error('Failed to refresh prayer timing state:', error)
      })
    }, 60000)

    return () => window.clearInterval(timer)
  }, [loadDashboardData])

  const addToast = useCallback((title, message) => {
    const id = `${Date.now()}:${Math.random()}`

    setToasts((currentToasts) => [...currentToasts, { id, title, message }])
    window.setTimeout(() => {
      setToasts((currentToasts) =>
        currentToasts.filter((toast) => toast.id !== id),
      )
    }, 3600)
  }, [])

  const showProgressToasts = useCallback(
    (previousData, nextData) => {
      const previousQuestKeys = new Set(
        [...previousData.dailyQuests, ...previousData.weeklyQuests]
          .filter((quest) => quest.isCompleted)
          .map((quest) => quest.id),
      )
      const completedQuests = [
        ...nextData.dailyQuests,
        ...nextData.weeklyQuests,
      ].filter((quest) => quest.isCompleted && !previousQuestKeys.has(quest.id))
      const previousAchievementKeys = new Set(
        previousData.achievements
          .filter((achievement) => achievement.isUnlocked)
          .map((achievement) => achievement.badgeKey),
      )
      const unlockedAchievements = nextData.achievements.filter(
        (achievement) =>
          achievement.isUnlocked &&
          !previousAchievementKeys.has(achievement.badgeKey),
      )

      completedQuests.forEach((quest) => {
        addToast('Quest completed', `${quest.title} +${quest.xpEarned || quest.xpReward} XP`)
      })
      unlockedAchievements.forEach((achievement) => {
        addToast(
          'Achievement unlocked',
          `${achievement.title} +${achievement.xpEarned || achievement.xpReward || 0} XP`,
        )
      })
    },
    [addToast],
  )

  const handleTogglePrayer = async (prayer) => {
    if (!dashboardData.user) {
      return
    }

    const nextStatus = prayer.isDone ? 'pending' : 'done'
    setUpdatingPrayer(prayer.prayer)

    try {
      const user = await setTodayPrayerStatus(
        dashboardData.user.id,
        prayer.prayer,
        nextStatus,
      )
      await refreshQuestData(user.id)
      const nextData = await loadDashboardData()

      if (nextStatus === 'done' && !prayer.xpEarned) {
        addToast('Prayer completed', `${prayer.name} +10 XP`)
      }

      if (
        nextStatus === 'done' &&
        nextData.prayers.filter((item) => item.isDone).length === 5 &&
        dashboardData.prayers.filter((item) => item.isDone).length < 5
      ) {
        addToast('All prayers completed', 'Full day prayer quest progress updated.')
      }

      showProgressToasts(dashboardData, nextData)
    } catch (error) {
      console.error('Failed to update prayer:', error)
    } finally {
      setUpdatingPrayer(null)
    }
  }

  const handleRequestLocation = async () => {
    try {
      await requestAndStoreLocation({ forceReverseGeocode: true })
      addToast('Location updated', 'Prayer times now use your current location.')
      await loadDashboardData()
    } catch (error) {
      console.error('Failed to update location:', error)
      addToast('Location unavailable', error.message || 'Could not read browser location.')
    }
  }

  const handleAddQuranAyat = async () => {
    if (!dashboardData.user) {
      return
    }

    const amount = Number(quranAyatInput)

    if (!amount || amount <= 0) {
      setIbadahFeedback('Masukkan jumlah ayat terlebih dahulu.')
      return
    }

    const log = await addQuranAyatLog(dashboardData.user.id, amount)
    setQuranAyatInput('')
    setIbadahFeedback(`${amount} ayat ditambahkan. +${log.xpEarned} XP`)
    addToast('Tilawah added', `${amount} ayat +${log.xpEarned} XP`)
    const nextData = await loadDashboardData()
    showProgressToasts(dashboardData, nextData)
  }

  const handleAddSingleLog = async (type) => {
    if (!dashboardData.user) {
      return
    }

    const result = await addSingleIbadahLog(dashboardData.user.id, type)
    const feedbackByType = {
      dzikir: result.created
        ? 'Dzikir sore ditandai selesai.'
        : 'Dzikir sore sudah tercatat hari ini.',
      sedekah: result.created
        ? 'Sedekah ditandai selesai.'
        : 'Sedekah sudah tercatat hari ini.',
      memorize_short_surah: result.created
        ? 'Hafalan surah pendek ditandai selesai.'
        : 'Hafalan surah pendek sudah tercatat hari ini.',
    }

    setIbadahFeedback(feedbackByType[type] || 'Log ibadah tersimpan.')
    const nextData = await loadDashboardData()

    if (result.created) {
      addToast('Ibadah logged', feedbackByType[type])
    }

    showProgressToasts(dashboardData, nextData)
  }

  const weeklyQuestActions = {
    memorize_short_surah: (
      <button
        className="rounded-xl bg-[#1f6f50] px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 dark:bg-[#2ddfa3] dark:text-[#071a16]"
        onClick={() => handleAddSingleLog('memorize_short_surah')}
        type="button"
      >
        Mark memorized
      </button>
    ),
  }

  return (
    <AppShell
      activePage={activePage}
      isDarkMode={isDarkMode}
      onNavigate={onNavigate}
      onResetLocalData={onResetLocalData}
      onToggleDarkMode={onToggleDarkMode}
      user={dashboardData.user}
    >
      <section className="relative min-w-0 overflow-hidden rounded-[2rem] border border-[#d6cbb6] bg-[#0f3d2e] p-6 text-white shadow-[0_18px_45px_rgba(44,35,19,0.14)] dark:border-white/10 dark:bg-[#10241d] sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_12%,rgba(217,164,65,0.18),transparent_30%),linear-gradient(135deg,rgba(221,232,210,0.12),transparent_34%)]" />
        <div className="relative max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d9a441] dark:text-[#e6b84a]">
            Level 24
          </p>
          <h2 className="mt-3 break-words text-[clamp(1.75rem,3vw,2.75rem)] font-bold leading-tight tracking-tight">
            Build consistent worship with small daily wins.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#dce8dd] sm:text-base">
            Track prayers, complete quests, and grow a meaningful streak with an
            offline-first habit system designed for daily Muslim life.
          </p>
        </div>
      </section>

      <TodayContextCard now={now} />

      <div className="grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-12">
        <PrayerTrackerCard
          currentPrayer={dashboardData.currentPrayer}
          nextPrayer={dashboardData.nextPrayer}
          onTogglePrayer={handleTogglePrayer}
          onRequestLocation={handleRequestLocation}
          prayers={dashboardData.prayers}
          prayerSchedule={dashboardData.prayerSchedule}
          updatingPrayer={updatingPrayer}
        />
        <div className="grid min-w-0 gap-5 md:grid-cols-2 xl:col-span-4 xl:grid-cols-1">
          {dashboardData.stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </div>
      </div>

      <QuickIbadahLogCard
        ayatInput={quranAyatInput}
        dzikirDone={
          dashboardData.dailyQuests.find(
            (quest) => quest.questKey === 'evening_dhikr',
          )?.isCompleted
        }
        feedback={ibadahFeedback}
        onAddQuranAyat={handleAddQuranAyat}
        onAyatInputChange={setQuranAyatInput}
        onMarkDzikir={() => handleAddSingleLog('dzikir')}
        onMarkSedekah={() => handleAddSingleLog('sedekah')}
        sedekahDone={
          dashboardData.weeklyQuests.find(
            (quest) => quest.questKey === 'weekly_sedekah',
          )?.isCompleted
        }
      />

      <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-2">
        <QuestSection
          title="Daily quests"
          quests={dashboardData.dailyQuests}
        />
        <QuestSection
          actionControls={weeklyQuestActions}
          title="Weekly quests"
          quests={dashboardData.weeklyQuests}
        />
      </div>

      <div className="mt-5">
        <AchievementPreview achievements={dashboardData.achievements} />
      </div>

      <div className="mt-5">
        <ActivityFeed activities={dashboardData.activities} />
      </div>
      <ToastStack toasts={toasts} />
    </AppShell>
  )
}

export default Dashboard
