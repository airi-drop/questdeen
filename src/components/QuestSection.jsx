import { Gift } from 'lucide-react'
import Card from './Card'

function QuestSection({ title, quests, actionControls = {} }) {
  return (
    <Card>
      <div className="mb-5 flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1f6f50] dark:text-[#2ddfa3]">
            Quests
          </p>
          <h2 className="mt-1 break-words text-xl font-bold tracking-tight text-[#17352b] dark:text-[#f7f3e8]">
            {title}
          </h2>
        </div>
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-[#ead7ad] bg-[#f7ead0] text-[#9a6a13] dark:border-[#e6b84a]/20 dark:bg-[#e6b84a]/10 dark:text-[#e6b84a]">
          <Gift size={19} />
        </div>
      </div>

      <div className="space-y-4">
        {quests.map((quest) => (
          <article
            className="rounded-2xl border border-[#e4dccb] bg-white/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#c7dbc0] hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-[#2ddfa3]/25 dark:hover:bg-white/[0.06]"
            key={quest.title}
          >
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="break-words font-bold text-[#17352b] dark:text-[#f7f3e8]">
                  {quest.title}
                </h3>
                <p className="mt-1 text-sm font-medium text-[#1f6f50] dark:text-[#2ddfa3]">
                  {quest.progress}/{quest.target} - {quest.reward}
                </p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold ${
                  quest.isCompleted
                    ? 'border-[#c7dbc0] bg-[#dde8d2] text-[#1f6f50] dark:border-[#2ddfa3]/20 dark:bg-[#2ddfa3]/10 dark:text-[#2ddfa3]'
                    : 'border-[#ead7ad] bg-[#f7ead0] text-[#9a6a13] dark:border-[#e6b84a]/20 dark:bg-[#e6b84a]/10 dark:text-[#e6b84a]'
                }`}
              >
                {quest.isCompleted ? 'Completed' : `${quest.percent}%`}
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#ebe4d4] dark:bg-white/10">
              <div
                className="h-full rounded-full bg-[#1f6f50] transition-all duration-500 dark:bg-[#2ddfa3]"
                style={{ width: `${quest.percent}%` }}
              />
            </div>
            {actionControls[quest.questKey] && (
              <div className="mt-4">{actionControls[quest.questKey]}</div>
            )}
          </article>
        ))}
      </div>
    </Card>
  )
}

export default QuestSection
