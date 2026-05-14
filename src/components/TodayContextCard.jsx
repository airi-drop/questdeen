import { CalendarDays, Clock3, MoonStar, RefreshCw } from 'lucide-react'
import Card from './Card'
import {
  formatWIBTime,
  getDailyResetStatus,
  getDayName,
  getGregorianDate,
  getHijriDateParts,
  getWeekKey,
} from '../lib/date'

function TodayContextCard({ now }) {
  const hijriDate = getHijriDateParts(now)
  const items = [
    {
      label: 'Hari Ini',
      value: getDayName(now),
      detail: getGregorianDate(now),
      icon: CalendarDays,
    },
    {
      label: 'Waktu',
      value: formatWIBTime(now),
      detail: getDailyResetStatus(now),
      icon: Clock3,
    },
    {
      label: 'Minggu',
      value: getWeekKey(now),
      detail: 'Periode quest mingguan',
      icon: RefreshCw,
    },
    {
      label: 'Hijriah',
      value: hijriDate.weekday,
      detail: hijriDate.detail,
      icon: MoonStar,
    },
  ]

  return (
    <Card>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div
            className="min-w-0 rounded-2xl border border-[#e4dccb] bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.04]"
            key={item.label}
          >
            <div className="mb-3 flex items-center gap-2 text-[#1f6f50] dark:text-[#2ddfa3]">
              <item.icon size={18} />
              <p className="text-xs font-bold tracking-[0.04em]">
                {item.label}
              </p>
            </div>
            <p className="break-words text-base font-bold text-[#17352b] dark:text-[#f7f3e8]">
              {item.value}
            </p>
            <p className="mt-1 break-words text-sm text-[#6f7e76] dark:text-[#a7b8b2]">
              {item.detail}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default TodayContextCard
