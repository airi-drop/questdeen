import TopNavbar from './TopNavbar'
import { navItems } from '../data/dashboard'

function AppShell({
  activePage = 'dashboard',
  children,
  isDarkMode,
  onNavigate,
  onResetLocalData,
  onToggleDarkMode,
  user,
}) {
  return (
    <div className="relative min-h-svh overflow-hidden bg-[#f5f0e6] text-[#17352b] transition-colors duration-300 dark:bg-[#071a16] dark:text-[#f7f3e8]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(31,111,80,0.09),transparent_30%),radial-gradient(circle_at_86%_12%,rgba(217,164,65,0.10),transparent_28%)] dark:bg-[radial-gradient(circle_at_14%_8%,rgba(45,223,163,0.08),transparent_30%),radial-gradient(circle_at_86%_12%,rgba(230,184,74,0.08),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.008] dark:opacity-[0.012] [background-image:linear-gradient(30deg,currentColor_12%,transparent_12.5%,transparent_87%,currentColor_87.5%,currentColor),linear-gradient(150deg,currentColor_12%,transparent_12.5%,transparent_87%,currentColor_87.5%,currentColor)] [background-size:64px_112px] text-[#0f3d2e] dark:text-[#f7f3e8]" />
      <div className="relative min-h-svh px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-8 lg:pt-6 xl:px-10">
        <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-6">
          <TopNavbar
            activePage={activePage}
            isDarkMode={isDarkMode}
            onNavigate={onNavigate}
            onResetLocalData={onResetLocalData}
            onToggleDarkMode={onToggleDarkMode}
            user={user}
          />
          <main className="flex min-w-0 flex-1 flex-col gap-5">{children}</main>
        </div>
      </div>
      <nav className="fixed inset-x-4 bottom-4 z-30 rounded-[1.6rem] border border-[#e4dccb] bg-[#fffdf7]/90 p-2 shadow-[0_18px_45px_rgba(44,35,19,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#10241d]/92 lg:hidden">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
        >
          {navItems
            .map((item) => (
              <a
                className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition-all ${
                  item.key === activePage
                    ? 'bg-[#1f6f50] text-white dark:bg-[#2ddfa3] dark:text-[#071a16]'
                    : 'text-[#6f7e76] dark:text-[#a7b8b2]'
                }`}
                href="#"
                key={item.label}
                onClick={(event) => {
                  event.preventDefault()
                  onNavigate?.(item.key)
                }}
              >
                <item.icon size={18} />
                {item.label}
              </a>
            ))}
        </div>
      </nav>
    </div>
  )
}

export default AppShell
