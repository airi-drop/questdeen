import { useEffect, useState } from 'react'
import { Check, Clock3, MapPin, Navigation, Radio, XCircle } from 'lucide-react'
import Card from './Card'
import {
  DEFAULT_LOCATION,
  formatCountdown,
  getReadableLocationLabel,
} from '../lib/prayerTimeData'

const statusStyles = {
  upcoming:
    'border-[#e4dccb] bg-white/60 opacity-80 dark:border-white/10 dark:bg-white/[0.04]',
  active:
    'border-[#d9a441] bg-[#fff8e6] shadow-[0_0_28px_rgba(217,164,65,0.22)] dark:border-[#e6b84a]/60 dark:bg-[#e6b84a]/10 dark:shadow-[0_0_28px_rgba(230,184,74,0.16)]',
  completed:
    'border-[#c7dbc0] bg-[#eef5e9] dark:border-[#2ddfa3]/20 dark:bg-[#2ddfa3]/10',
  missed:
    'border-[#e7c8bd] bg-[#f8ece8] opacity-75 dark:border-[#c56b5c]/30 dark:bg-[#9a3d2f]/10',
}

const statusIcons = {
  upcoming: Clock3,
  active: Radio,
  completed: Check,
  missed: XCircle,
}

const statusLabels = {
  upcoming: 'Upcoming',
  active: 'Active',
  completed: 'Completed',
  missed: 'Missed',
}

function PrayerTrackerCard({
  currentPrayer,
  nextPrayer,
  onRequestLocation,
  onTogglePrayer,
  prayerSchedule,
  prayers,
  updatingPrayer,
}) {
  const [now, setNow] = useState(new Date())
  const completedCount = prayers.filter((prayer) => prayer.isDone).length
  const totalPrayers = prayers.length || 5
  const progress = Math.round((completedCount / totalPrayers) * 100)
  const countdown = nextPrayer
    ? formatCountdown(new Date(nextPrayer.startsAt), now)
    : '00:00:00'
  const location = prayerSchedule?.location || DEFAULT_LOCATION
  const locationLabel = getReadableLocationLabel(location)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <Card className="md:col-span-2 xl:col-span-8">
      <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1f6f50] dark:text-[#2ddfa3]">
            Prayer tracker
          </p>
          <h2 className="mt-2 break-words text-[clamp(1.35rem,2.2vw,1.75rem)] font-bold leading-tight tracking-tight text-[#17352b] dark:text-[#f7f3e8]">
            {completedCount} of {totalPrayers} prayers completed
          </h2>
        </div>
        <div className="shrink-0 rounded-2xl border border-[#dde8d2] bg-[#dde8d2] px-4 py-2 text-sm font-bold text-[#1f6f50] dark:border-[#2ddfa3]/20 dark:bg-[#2ddfa3]/10 dark:text-[#2ddfa3]">
          {progress}% today
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-[#d6cbb6] bg-[#0f3d2e] p-5 text-white shadow-[0_14px_34px_rgba(44,35,19,0.12)] dark:border-white/10 dark:bg-[#10241d]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d9a441] dark:text-[#e6b84a]">
            Next Prayer
          </p>
          <div className="mt-3 flex min-w-0 flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h3 className="break-words text-3xl font-bold leading-none">
                {nextPrayer?.name || 'Complete'}
              </h3>
              <p className="mt-2 text-sm font-semibold text-[#dce8dd]">
                Starts in: {countdown}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-right">
              <p className="text-xs text-[#dce8dd]">Time</p>
              <p className="text-lg font-bold">{nextPrayer?.time || '--:--'}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-[#dce8dd]">
            Current prayer: {currentPrayer?.name || 'Before Subuh'}
          </p>
        </div>

        <div className="rounded-2xl border border-[#e4dccb] bg-white/60 p-5 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#dde8d2] text-[#1f6f50] dark:bg-[#2ddfa3]/10 dark:text-[#2ddfa3]">
              <MapPin size={19} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#17352b] dark:text-[#f7f3e8]">
                {locationLabel}
              </p>
              <p className="mt-1 text-xs leading-5 text-[#6f7e76] dark:text-[#a7b8b2]">
                {location.source === 'default' ? 'default location' : 'browser location'}
              </p>
            </div>
          </div>
          <button
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1f6f50] px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 dark:bg-[#2ddfa3] dark:text-[#071a16]"
            onClick={onRequestLocation}
            type="button"
          >
            <Navigation size={16} />
            Use My Location
          </button>
        </div>
      </div>

      <div className="mt-6 h-3 overflow-hidden rounded-full bg-[#ebe4d4] dark:bg-white/10">
        <div
          className="h-full rounded-full bg-[#1f6f50] transition-all duration-500 dark:bg-[#2ddfa3]"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-6 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {prayers.map((prayer) => {
          const Icon = statusIcons[prayer.timingStatus] || Clock3

          return (
            <button
              aria-pressed={prayer.isDone}
              className={`min-w-0 rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#1f6f50] focus:ring-offset-2 focus:ring-offset-[#fffdf7] dark:focus:ring-[#2ddfa3] dark:focus:ring-offset-[#10241d] ${statusStyles[prayer.timingStatus] || statusStyles.upcoming}`}
              key={prayer.name}
              disabled={updatingPrayer === prayer.prayer}
              onClick={() => onTogglePrayer(prayer)}
              type="button"
            >
              <div
                className={`mb-3 grid size-9 place-items-center rounded-xl ${
                  prayer.timingStatus === 'completed'
                    ? 'bg-[#1f6f50] text-white dark:bg-[#2ddfa3] dark:text-[#071a16]'
                    : prayer.timingStatus === 'active'
                      ? 'bg-[#d9a441] text-[#2d2408] dark:bg-[#e6b84a]'
                      : prayer.timingStatus === 'missed'
                        ? 'bg-[#ead0c8] text-[#9a3d2f] dark:bg-[#9a3d2f]/20 dark:text-[#ffb4a8]'
                        : 'bg-[#f2eadb] text-[#6f7e76] dark:bg-white/10 dark:text-[#a7b8b2]'
                }`}
              >
                <Icon size={18} />
              </div>
            <p className="break-words font-bold text-[#17352b] dark:text-[#f7f3e8]">{prayer.name}</p>
            <p className="mt-1 text-sm text-[#6f7e76] dark:text-[#a7b8b2]">
              {prayer.time}
            </p>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-[#6f7e76] dark:text-[#a7b8b2]">
                {statusLabels[prayer.timingStatus] || 'Upcoming'}
              </p>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

export default PrayerTrackerCard
