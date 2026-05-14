import { BookOpenCheck, Check, HeartHandshake, MoonStar } from 'lucide-react'
import Card from './Card'

function QuickIbadahLogCard({
  ayatInput,
  feedback,
  onAddQuranAyat,
  onAyatInputChange,
  onMarkDzikir,
  onMarkSedekah,
  sedekahDone,
  dzikirDone,
}) {
  return (
    <Card>
      <div className="mb-5 min-w-0">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1f6f50] dark:text-[#2ddfa3]">
            Ibadah log
          </p>
          <h2 className="mt-1 break-words text-xl font-bold tracking-tight text-[#17352b] dark:text-[#f7f3e8]">
            Quick Ibadah Log
          </h2>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-[#e4dccb] bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="mb-3 flex items-center gap-2 text-[#1f6f50] dark:text-[#2ddfa3]">
            <BookOpenCheck size={18} />
            <p className="text-sm font-bold">Tilawah Quran</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              className="min-w-0 flex-1 rounded-xl border border-[#e4dccb] bg-white px-3 py-2 text-sm text-[#17352b] outline-none focus:border-[#1f6f50] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#f7f3e8]"
              min="0"
              onChange={(event) => onAyatInputChange(event.target.value)}
              placeholder="Masukkan jumlah ayat"
              type="number"
              value={ayatInput}
            />
            <button
              className="rounded-xl bg-[#1f6f50] px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 dark:bg-[#2ddfa3] dark:text-[#071a16]"
              onClick={onAddQuranAyat}
              type="button"
            >
              Tambah
            </button>
          </div>
          <p className="mt-2 text-xs font-medium text-[#6f7e76] dark:text-[#a7b8b2]">
            10 ayat = 1 XP
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            className={`flex min-w-0 items-center gap-3 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
              dzikirDone
                ? 'border-[#c7dbc0] bg-[#dde8d2]/70 dark:border-[#2ddfa3]/20 dark:bg-[#2ddfa3]/10'
                : 'border-[#e4dccb] bg-white/60 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]'
            }`}
            disabled={dzikirDone}
            onClick={onMarkDzikir}
            type="button"
          >
            {dzikirDone ? (
              <Check className="shrink-0 text-[#1f6f50] dark:text-[#2ddfa3]" />
            ) : (
              <MoonStar className="shrink-0 text-[#1f6f50] dark:text-[#2ddfa3]" />
            )}
            <span className="min-w-0">
              <span className="block break-words text-sm font-bold text-[#17352b] dark:text-[#f7f3e8]">
                Evening dzikir
              </span>
              <span className="mt-1 block text-xs text-[#6f7e76] dark:text-[#a7b8b2]">
                {dzikirDone ? 'Completed today' : 'Tap to complete today'}
              </span>
            </span>
          </button>
          <button
            className={`flex min-w-0 items-center gap-3 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
              sedekahDone
                ? 'border-[#c7dbc0] bg-[#dde8d2]/70 dark:border-[#2ddfa3]/20 dark:bg-[#2ddfa3]/10'
                : 'border-[#e4dccb] bg-white/60 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]'
            }`}
            disabled={sedekahDone}
            onClick={onMarkSedekah}
            type="button"
          >
            {sedekahDone ? (
              <Check className="shrink-0 text-[#1f6f50] dark:text-[#2ddfa3]" />
            ) : (
              <HeartHandshake className="shrink-0 text-[#1f6f50] dark:text-[#2ddfa3]" />
            )}
            <span className="min-w-0">
              <span className="block break-words text-sm font-bold text-[#17352b] dark:text-[#f7f3e8]">
                Sedekah
              </span>
              <span className="mt-1 block text-xs text-[#6f7e76] dark:text-[#a7b8b2]">
                {sedekahDone ? 'Completed this week' : 'Tap to complete this week'}
              </span>
            </span>
          </button>
        </div>

        {feedback && (
          <p className="rounded-2xl border border-[#c7dbc0] bg-[#dde8d2]/70 px-4 py-3 text-sm font-semibold text-[#1f6f50] dark:border-[#2ddfa3]/20 dark:bg-[#2ddfa3]/10 dark:text-[#2ddfa3]">
            {feedback}
          </p>
        )}
      </div>
    </Card>
  )
}

export default QuickIbadahLogCard
