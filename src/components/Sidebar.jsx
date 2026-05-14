import { Compass, Crown, ShieldCheck } from 'lucide-react'
import { navItems } from '../data/dashboard'

function Sidebar() {
  return (
    <aside className="fixed left-5 top-5 z-30 hidden h-[calc(100svh-2.5rem)] w-68 rounded-[2rem] border border-white/12 bg-[#102922]/75 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl dark:bg-[#102922]/72 lg:flex lg:flex-col">
      <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-[0_0_38px_rgba(0,208,132,0.08)]">
        <div className="flex items-center gap-3">
          <div className="relative grid size-12 place-items-center rounded-2xl bg-[#00d084] text-[#062119] shadow-[0_0_28px_rgba(0,208,132,0.42)]">
            <Compass size={25} />
            <span className="absolute -right-1 -top-1 size-3 rounded-full bg-[#f5c542] shadow-[0_0_16px_rgba(245,197,66,0.72)]" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-[#f7f3e8]">
              QuestDeen
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#22d3ee]">
              Deen OS
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#071a16]/60 px-3 py-2 text-xs font-semibold text-[#a7b8b2]">
          <ShieldCheck className="text-[#f5c542]" size={16} />
          Spiritual rank: Seeker
        </div>
      </div>

      <nav className="mt-5 space-y-2">
        {navItems.map((item) => (
          <a
            className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
              item.isActive
                ? 'border border-[#00d084]/40 bg-[#00d084]/14 text-[#f7f3e8] shadow-[0_0_30px_rgba(0,208,132,0.20),inset_0_1px_0_rgba(255,255,255,0.10)]'
                : 'border border-transparent text-[#a7b8b2] hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/[0.07] hover:text-[#f7f3e8]'
            }`}
            href="#"
            key={item.label}
          >
            {item.isActive && (
              <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-[#00d084] shadow-[0_0_18px_rgba(0,208,132,0.92)]" />
            )}
            <item.icon
              className={item.isActive ? 'text-[#00d084]' : 'text-[#6fd0bf]'}
              size={19}
            />
            {item.label}
          </a>
        ))}
      </nav>

      <div className="mt-auto rounded-3xl border border-white/12 bg-white/[0.06] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-[#f5c542] text-[#1c1703] shadow-[0_0_24px_rgba(245,197,66,0.22)]">
            <Crown size={20} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#f7f3e8]">
              Level 24 Seeker
            </p>
            <p className="text-xs text-[#a7b8b2]">760 XP to ascend</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#00d084] to-[#22d3ee]" />
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
