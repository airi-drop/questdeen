import { useEffect, useState } from 'react'
import {
  Award,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  Flame,
  Sparkles,
  Target,
} from 'lucide-react'
import AppShell from '../components/AppShell'
import Card from '../components/Card'
import { getStatisticsData } from '../lib/statsData'
import { getTodayKey } from '../lib/date'

const emptyStats = {
  user: null,
  summary: {
    totalCompletedPrayers: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalXP: 0,
    currentLevel: 1,
    totalQuranAyat: 0,
    completedQuests: 0,
    unlockedAchievements: 0,
    totalAchievements: 0,
  },
  weeklyPrayerProgress: [],
  monthlyPrayerOverview: [],
  quranStats: {
    totalAyat: 0,
    todayAyat: 0,
    weekAyat: 0,
    monthAyat: 0,
  },
  questStats: {
    dailyCompletedThisWeek: 0,
    weeklyCompletedThisMonth: 0,
    completionRate: 0,
    currentWeek: '',
  },
  achievements: {
    unlocked: 0,
    total: 0,
    nearestLocked: [],
  },
}

function SummaryCard({ icon: Icon, label, value, detail }) {
  return (
    <Card>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#6f7e76] dark:text-[#a7b8b2]">
            {label}
          </p>
          <p className="mt-2 break-words text-2xl font-bold text-[#17352b] dark:text-[#f7f3e8]">
            {value}
          </p>
          {detail && (
            <p className="mt-1 text-sm font-medium text-[#1f6f50] dark:text-[#2ddfa3]">
              {detail}
            </p>
          )}
        </div>
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl border border-[#dde8d2] bg-[#dde8d2] text-[#1f6f50] dark:border-[#2ddfa3]/20 dark:bg-[#2ddfa3]/10 dark:text-[#2ddfa3]">
          <Icon size={20} />
        </div>
      </div>
    </Card>
  )
}

function Statistics({ activePage = 'statistics', onNavigate, isDarkMode, onToggleDarkMode }) {
  const [stats, setStats] = useState(emptyStats)

  useEffect(() => {
    getStatisticsData()
      .then(setStats)
      .catch((error) => {
        console.error('Failed to load statistics:', error)
      })
  }, [])

  const summaryCards = [
    {
      label: 'Completed Prayers',
      value: stats.summary.totalCompletedPrayers,
      detail: 'All-time',
      icon: CalendarDays,
    },
    {
      label: 'Current Streak',
      value: `${stats.summary.currentStreak} days`,
      detail: `Best: ${stats.summary.bestStreak} days`,
      icon: Flame,
    },
    {
      label: 'Total XP',
      value: stats.summary.totalXP,
      detail: `Level ${stats.summary.currentLevel}`,
      icon: Sparkles,
    },
    {
      label: 'Quran Ayat',
      value: stats.summary.totalQuranAyat,
      detail: 'Total read',
      icon: BookOpenCheck,
    },
    {
      label: 'Completed Quests',
      value: stats.summary.completedQuests,
      detail: `${stats.questStats.completionRate}% completion rate`,
      icon: Target,
    },
    {
      label: 'Achievements',
      value: `${stats.summary.unlockedAchievements}/${stats.summary.totalAchievements}`,
      detail: 'Badges unlocked',
      icon: Award,
    },
  ]

  return (
    <AppShell
      activePage={activePage}
      isDarkMode={isDarkMode}
      onNavigate={onNavigate}
      onToggleDarkMode={onToggleDarkMode}
      user={stats.user}
    >
      <section className="relative min-w-0 overflow-hidden rounded-[2rem] border border-[#d6cbb6] bg-[#0f3d2e] p-6 text-white shadow-[0_18px_45px_rgba(44,35,19,0.14)] dark:border-white/10 dark:bg-[#10241d] sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_12%,rgba(217,164,65,0.18),transparent_30%),linear-gradient(135deg,rgba(221,232,210,0.12),transparent_34%)]" />
        <div className="relative max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d9a441] dark:text-[#e6b84a]">
            Statistics
          </p>
          <h1 className="mt-3 break-words text-[clamp(1.75rem,3vw,2.75rem)] font-bold leading-tight tracking-tight">
            Track your worship consistency with real local data.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#dce8dd] sm:text-base">
            Prayer, Quran, quest, achievement, and XP progress are aggregated
            from your offline IndexedDB records.
          </p>
        </div>
      </section>

      <div className="grid min-w-0 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        <Card>
          <div className="mb-5 flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1f6f50] dark:text-[#2ddfa3]">
                Prayer
              </p>
              <h2 className="mt-1 break-words text-xl font-bold text-[#17352b] dark:text-[#f7f3e8]">
                Weekly Prayer Progress
              </h2>
            </div>
            <BarChart3 className="shrink-0 text-[#1f6f50] dark:text-[#2ddfa3]" />
          </div>
          <div className="grid gap-3">
            {stats.weeklyPrayerProgress.map((day) => (
              <div
                className={`rounded-2xl border p-3 dark:border-white/10 ${
                  day.completed === 5
                    ? 'border-[#c7dbc0] bg-[#eef5e9] dark:bg-[#2ddfa3]/10'
                    : 'border-[#e4dccb] bg-white/60 dark:bg-white/[0.04]'
                }`}
                key={day.date}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <p className="w-10 text-sm font-bold text-[#17352b] dark:text-[#f7f3e8]">
                      {day.label}
                    </p>
                    <div
                      aria-label={`${day.label}: ${day.completed} dari 5 shalat selesai`}
                      className="flex gap-1.5"
                      title={`${day.date}: ${day.completed}/5 prayers`}
                    >
                      {Array.from({ length: 5 }, (_, index) => (
                        <span
                          className={`size-3 rounded-full ${
                            index < day.completed
                              ? 'bg-[#1f6f50] dark:bg-[#2ddfa3]'
                              : 'bg-[#ebe4d4] dark:bg-white/10'
                          }`}
                          key={index}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm font-bold text-[#1f6f50] dark:text-[#2ddfa3]">
                    {day.completed}/5
                  </p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ebe4d4] dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#1f6f50] transition-all dark:bg-[#2ddfa3]"
                    style={{
                      width: `${(day.completed / day.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-5">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1f6f50] dark:text-[#2ddfa3]">
              Prayer
            </p>
            <h2 className="mt-1 break-words text-xl font-bold text-[#17352b] dark:text-[#f7f3e8]">
              Monthly Prayer Overview
            </h2>
          </div>
          <div className="grid grid-cols-7 gap-2 sm:grid-cols-10 xl:grid-cols-7 2xl:grid-cols-10">
            {stats.monthlyPrayerOverview.map((day) => {
              const isToday = day.date === getTodayKey()
              const tone =
                day.completed === 5
                  ? 'bg-[#1f6f50] text-white dark:bg-[#2ddfa3] dark:text-[#071a16]'
                  : day.completed >= 3
                    ? 'bg-[#8fbd9f] text-[#0f3d2e] dark:bg-[#2ddfa3]/45 dark:text-[#f7f3e8]'
                    : day.completed >= 1
                      ? 'bg-[#dde8d2] text-[#0f3d2e] dark:bg-[#2ddfa3]/18 dark:text-[#f7f3e8]'
                      : 'bg-[#ebe4d4] text-[#6f7e76] dark:bg-white/8 dark:text-[#a7b8b2]'

              return (
                <div
                  aria-label={`${day.date}: ${day.completed} dari 5 shalat selesai`}
                  className={`grid aspect-square min-w-0 place-items-center rounded-xl text-xs font-bold ${tone} ${
                    isToday ? 'ring-2 ring-[#d9a441] ring-offset-2 ring-offset-[#fffdf7] dark:ring-[#e6b84a] dark:ring-offset-[#10241d]' : ''
                  }`}
                  key={day.date}
                  title={`${day.date}: ${day.completed}/5 prayers`}
                >
                  {day.day}
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-3">
        <Card>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1f6f50] dark:text-[#2ddfa3]">
            Quran
          </p>
          <h2 className="mt-1 text-xl font-bold text-[#17352b] dark:text-[#f7f3e8]">
            Quran Statistics
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ['Total', stats.quranStats.totalAyat],
              ['Today', stats.quranStats.todayAyat],
              ['This week', stats.quranStats.weekAyat],
              ['This month', stats.quranStats.monthAyat],
            ].map(([label, value]) => (
              <div
                className="rounded-2xl border border-[#e4dccb] bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.04]"
                key={label}
              >
                <p className="text-sm text-[#6f7e76] dark:text-[#a7b8b2]">
                  {label}
                </p>
                <p className="mt-1 text-2xl font-bold text-[#17352b] dark:text-[#f7f3e8]">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1f6f50] dark:text-[#2ddfa3]">
            Quests
          </p>
          <h2 className="mt-1 text-xl font-bold text-[#17352b] dark:text-[#f7f3e8]">
            Quest Statistics
          </h2>
          <div className="mt-5 space-y-3">
            <div className="flex justify-between gap-3 rounded-2xl border border-[#e4dccb] bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <span>Daily quests this week</span>
              <strong>{stats.questStats.dailyCompletedThisWeek}</strong>
            </div>
            <div className="flex justify-between gap-3 rounded-2xl border border-[#e4dccb] bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <span>Weekly quests this month</span>
              <strong>{stats.questStats.weeklyCompletedThisMonth}</strong>
            </div>
            <div className="rounded-2xl border border-[#e4dccb] bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex justify-between gap-3">
                <span>Completion rate</span>
                <strong>{stats.questStats.completionRate}%</strong>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ebe4d4] dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-[#1f6f50] dark:bg-[#2ddfa3]"
                  style={{ width: `${stats.questStats.completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1f6f50] dark:text-[#2ddfa3]">
            Achievements
          </p>
          <h2 className="mt-1 text-xl font-bold text-[#17352b] dark:text-[#f7f3e8]">
            Achievement Progress
          </h2>
          <p className="mt-4 text-3xl font-bold text-[#17352b] dark:text-[#f7f3e8]">
            {stats.achievements.unlocked}/{stats.achievements.total}
          </p>
          <div className="mt-5 space-y-3">
            {stats.achievements.nearestLocked.map((achievement) => (
              <div
                className="rounded-2xl border border-[#e4dccb] bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.04]"
                key={achievement.badgeKey}
              >
                <div className="flex justify-between gap-3">
                  <span className="font-bold">{achievement.title}</span>
                  <span className="text-sm text-[#6f7e76] dark:text-[#a7b8b2]">
                    {achievement.progressText}
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ebe4d4] dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#d9a441] dark:bg-[#e6b84a]"
                    style={{ width: `${achievement.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  )
}

export default Statistics
