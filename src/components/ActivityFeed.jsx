import { History } from 'lucide-react'
import Card from './Card'

function ActivityFeed({ activities }) {
  return (
    <Card>
      <div className="mb-5 flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1f6f50] dark:text-[#2ddfa3]">
            History
          </p>
          <h2 className="mt-1 break-words text-xl font-bold tracking-tight text-[#17352b] dark:text-[#f7f3e8]">
            Recent Activity
          </h2>
        </div>
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-[#ead7ad] bg-[#f7ead0] text-[#9a6a13] dark:border-[#e6b84a]/20 dark:bg-[#e6b84a]/10 dark:text-[#e6b84a]">
          <History size={19} />
        </div>
      </div>

      <div className="space-y-3">
        {activities.length === 0 && (
          <p className="rounded-2xl border border-[#e4dccb] bg-white/60 p-4 text-sm text-[#6f7e76] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#a7b8b2]">
            No activity yet.
          </p>
        )}
        {activities.map((activity) => (
          <article
            className="flex gap-3 rounded-2xl border border-[#e4dccb] bg-white/50 p-3 dark:border-white/10 dark:bg-white/[0.035]"
            key={activity.id}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#dde8d2] text-base dark:bg-[#2ddfa3]/10">
              {activity.icon}
            </span>
            <div className="min-w-0">
              <p className="break-words text-sm font-bold text-[#17352b] dark:text-[#f7f3e8]">
                {activity.title}
              </p>
              <p className="mt-1 text-xs text-[#6f7e76] dark:text-[#a7b8b2]">
                {activity.description}
              </p>
              <p className="mt-1 text-xs font-semibold text-[#1f6f50] dark:text-[#2ddfa3]">
                {activity.dateLabel}
                {activity.xpEarned ? ` - +${activity.xpEarned} XP` : ''}
              </p>
            </div>
          </article>
        ))}
      </div>
    </Card>
  )
}

export default ActivityFeed
