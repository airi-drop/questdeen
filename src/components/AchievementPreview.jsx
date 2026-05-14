import Card from './Card'

function AchievementPreview({ achievements }) {
  return (
    <Card>
      <div className="mb-5 min-w-0">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1f6f50] dark:text-[#2ddfa3]">
          Achievements
        </p>
        <h2 className="mt-1 break-words text-xl font-bold tracking-tight text-[#17352b] dark:text-[#f7f3e8]">
          Recent unlocks
        </h2>
      </div>

      <div className="grid min-w-0 gap-3 md:grid-cols-3">
        {achievements.length === 0 && (
          <p className="rounded-2xl border border-[#e4dccb] bg-white/60 p-4 text-sm text-[#6f7e76] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#a7b8b2] md:col-span-3">
            No achievements unlocked yet.
          </p>
        )}
        {achievements.map((achievement) => (
          <article
            className={`min-w-0 rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 ${
              achievement.isUnlocked
                ? 'border-[#e4dccb] bg-white/60 hover:border-[#ead7ad] hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-[#e6b84a]/25 dark:hover:bg-white/[0.06]'
                : 'border-[#e4dccb]/70 bg-white/35 opacity-70 dark:border-white/10 dark:bg-white/[0.025]'
            }`}
            key={achievement.title}
          >
            <div
              className={`mb-4 grid size-11 place-items-center rounded-2xl text-xl shadow-sm ${
                achievement.isUnlocked
                  ? 'bg-[#d9a441] text-[#2d2408] dark:bg-[#e6b84a]'
                  : 'bg-[#ebe4d4] text-[#6f7e76] dark:bg-white/10 dark:text-[#a7b8b2]'
              }`}
            >
              {achievement.icon}
            </div>
            <h3 className="break-words font-bold text-[#17352b] dark:text-[#f7f3e8]">
              {achievement.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#6f7e76] dark:text-[#a7b8b2]">
              {achievement.detail}
            </p>
            <p className="mt-3 text-xs font-bold text-[#1f6f50] dark:text-[#2ddfa3]">
              {achievement.isUnlocked
                ? `Unlocked +${achievement.xpEarned || achievement.xpReward || 0} XP`
                : `${achievement.progressText} - +${achievement.xpReward} XP`}
            </p>
          </article>
        ))}
      </div>
    </Card>
  )
}

export default AchievementPreview
