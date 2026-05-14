import { Moon, Sun } from 'lucide-react'

function ThemeToggle({ isDarkMode, onToggle }) {
  return (
    <button
      aria-label="Toggle dark mode"
      className="inline-flex h-10 w-[4.25rem] shrink-0 items-center rounded-full border border-[#e4dccb] bg-white/70 p-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:w-[4.5rem]"
      onClick={onToggle}
      type="button"
    >
      <span
        className={`grid size-8 place-items-center rounded-full bg-[#1f6f50] text-white shadow-sm transition-transform duration-300 dark:bg-[#2ddfa3] dark:text-[#071a16] ${
          isDarkMode ? 'translate-x-8' : 'translate-x-0'
        }`}
      >
        {isDarkMode ? <Moon size={17} /> : <Sun size={17} />}
      </span>
    </button>
  )
}

export default ThemeToggle
