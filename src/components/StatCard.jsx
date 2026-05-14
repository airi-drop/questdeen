import Card from './Card'

const toneStyles = {
  emerald: 'bg-[#dde8d2] text-[#1f6f50] border border-[#c7dbc0] dark:bg-[#2ddfa3]/10 dark:text-[#2ddfa3] dark:border-[#2ddfa3]/20',
  amber: 'bg-[#f7ead0] text-[#9a6a13] border border-[#ead7ad] dark:bg-[#e6b84a]/10 dark:text-[#e6b84a] dark:border-[#e6b84a]/20',
}

function StatCard({ stat }) {
  return (
    <Card>
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#6f7e76] dark:text-[#a7b8b2]">
            {stat.label}
          </p>
          <p className="mt-2 break-words text-[clamp(1.75rem,3vw,2.25rem)] font-bold leading-tight tracking-tight text-[#17352b] dark:text-[#f7f3e8]">
            {stat.value}
          </p>
          <p className="mt-2 text-sm font-medium text-[#1f6f50] dark:text-[#2ddfa3]">
            {stat.detail}
          </p>
        </div>
        <div className={`grid size-12 shrink-0 place-items-center rounded-2xl ${toneStyles[stat.tone]}`}>
          <stat.icon size={23} />
        </div>
      </div>
    </Card>
  )
}

export default StatCard
