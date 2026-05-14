import { Check, Clock3 } from 'lucide-react'
import Card from './Card'

function PrayerTrackerCard({ prayers, onTogglePrayer, updatingPrayer }) {
  const completedCount = prayers.filter((prayer) => prayer.isDone).length
  const totalPrayers = prayers.length || 5
  const progress = Math.round((completedCount / totalPrayers) * 100)

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

      <div className="mt-6 h-3 overflow-hidden rounded-full bg-[#ebe4d4] dark:bg-white/10">
        <div
          className="h-full rounded-full bg-[#1f6f50] transition-all duration-500 dark:bg-[#2ddfa3]"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-6 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {prayers.map((prayer) => (
          <button
            aria-pressed={prayer.isDone}
            className={`min-w-0 rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#1f6f50] focus:ring-offset-2 focus:ring-offset-[#fffdf7] dark:focus:ring-[#2ddfa3] dark:focus:ring-offset-[#10241d] ${
              prayer.isDone
                ? 'border-[#c7dbc0] bg-[#eef5e9] dark:border-[#2ddfa3]/20 dark:bg-[#2ddfa3]/10'
                : 'border-[#e4dccb] bg-white/60 dark:border-white/10 dark:bg-white/[0.04]'
            }`}
            key={prayer.name}
            disabled={updatingPrayer === prayer.prayer}
            onClick={() => onTogglePrayer(prayer)}
            type="button"
          >
            <div
              className={`mb-3 grid size-9 place-items-center rounded-xl ${
                prayer.isDone
                  ? 'bg-[#1f6f50] text-white dark:bg-[#2ddfa3] dark:text-[#071a16]'
                  : 'bg-[#f2eadb] text-[#6f7e76] dark:bg-white/10 dark:text-[#a7b8b2]'
              }`}
            >
              {prayer.isDone ? <Check size={18} /> : <Clock3 size={18} />}
            </div>
            <p className="break-words font-bold text-[#17352b] dark:text-[#f7f3e8]">{prayer.name}</p>
            <p className="mt-1 text-sm text-[#6f7e76] dark:text-[#a7b8b2]">
              {prayer.time}
            </p>
          </button>
        ))}
      </div>
    </Card>
  )
}

export default PrayerTrackerCard
