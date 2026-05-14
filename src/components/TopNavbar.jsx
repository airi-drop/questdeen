import { Bell, Compass, Flame } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { navItems } from '../data/dashboard'

function TopNavbar({
  activePage = 'dashboard',
  isDarkMode,
  onNavigate,
  onToggleDarkMode,
  user,
}) {
  return (
    <header className="sticky top-4 z-20 rounded-[1.75rem] border border-[#e4dccb] bg-[#fffdf7]/90 px-3 py-3 shadow-[0_18px_45px_rgba(44,35,19,0.10)] backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-[#10241d]/90 sm:px-4">
      <div className="flex min-w-0 items-center justify-between gap-2 lg:gap-4">
        <a
          className="flex min-w-0 shrink-0 items-center gap-3"
          href="#"
          onClick={(event) => {
            event.preventDefault()
            onNavigate?.('dashboard')
          }}
        >
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#1f6f50] text-white shadow-sm dark:bg-[#2ddfa3] dark:text-[#071a16] sm:size-11">
            <Compass size={23} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold tracking-tight text-[#0f3d2e] dark:text-[#f7f3e8]">
              QuestDeen
            </p>
            <p className="hidden text-xs font-semibold uppercase tracking-[0.16em] text-[#6f7e76] dark:text-[#a7b8b2] sm:block">
              Habit journey
            </p>
          </div>
        </a>

        <nav className="hidden min-w-0 flex-1 items-center justify-center rounded-2xl bg-[#f5f0e6] p-1 dark:bg-[#071a16]/70 lg:flex">
          {navItems.map((item) => (
            <a
              className={`min-w-0 rounded-xl px-2.5 py-2 text-[13px] font-semibold transition-all duration-200 xl:px-3.5 xl:text-sm 2xl:px-4 ${
                item.key === activePage
                  ? 'bg-[#1f6f50] text-white shadow-sm dark:bg-[#2ddfa3] dark:text-[#071a16]'
                  : 'text-[#6f7e76] hover:bg-white hover:text-[#0f3d2e] dark:text-[#a7b8b2] dark:hover:bg-white/8 dark:hover:text-[#f7f3e8]'
              }`}
              href="#"
              key={item.label}
              onClick={(event) => {
                event.preventDefault()
                onNavigate?.(item.key)
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden items-center gap-2 rounded-2xl border border-[#dde8d2] bg-[#dde8d2]/70 px-3 py-2.5 text-[#0f3d2e] dark:border-[#2ddfa3]/20 dark:bg-[#2ddfa3]/10 dark:text-[#2ddfa3] md:flex">
            <Flame className="text-[#d9a441] dark:text-[#e6b84a]" size={17} />
            <span className="text-sm font-bold">
              {user?.currentStreak || 0} days
            </span>
          </div>
          <button
            aria-label="Notifications"
            className="grid size-10 shrink-0 place-items-center rounded-2xl border border-[#e4dccb] bg-white/70 text-[#1f6f50] transition-all hover:-translate-y-0.5 hover:shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-[#2ddfa3]"
            type="button"
          >
            <Bell size={19} />
          </button>
          <ThemeToggle isDarkMode={isDarkMode} onToggle={onToggleDarkMode} />
          <button
            aria-label="Open profile and settings"
            className={`flex shrink-0 items-center gap-2 rounded-2xl border p-1 transition-all hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 dark:border-white/10 sm:pr-3 ${
              activePage === 'backup'
                ? 'border-[#1f6f50] bg-[#dde8d2] dark:bg-[#2ddfa3]/10'
                : 'border-[#e4dccb] bg-white/70 dark:bg-white/[0.04]'
            }`}
            onClick={() => onNavigate?.('backup')}
            type="button"
          >
            {user?.profileImage ? (
              <img
                alt=""
                className="size-8 rounded-xl object-cover"
                src={user.profileImage}
              />
            ) : (
              <div className="grid size-8 place-items-center rounded-xl bg-[#d9a441] text-[#2d2408] text-sm font-bold dark:bg-[#e6b84a]">
                {(user?.avatarInitial || user?.name || 'A').slice(0, 1).toUpperCase()}
              </div>
            )}
            <span className="hidden max-w-28 truncate text-sm font-bold text-[#17352b] dark:text-[#f7f3e8] sm:inline">
              {user?.name || 'Guest'}
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default TopNavbar
