import { useEffect, useRef, useState } from 'react'
import { Download, RotateCcw, Upload } from 'lucide-react'
import AppShell from '../components/AppShell'
import Card from '../components/Card'
import {
  downloadBackup,
  exportBackupData,
  importBackupData,
  resetLocalData,
  validateBackup,
} from '../lib/backupData'
import { getOrCreateActiveUser } from '../lib/db'

function Backup({ activePage = 'backup', onNavigate, isDarkMode, onToggleDarkMode }) {
  const [message, setMessage] = useState('')
  const [user, setUser] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    getOrCreateActiveUser().then(setUser).catch(console.error)
  }, [])

  const handleExport = async () => {
    const backup = await exportBackupData()
    downloadBackup(backup)
    setMessage('Backup exported successfully.')
  }

  const handleImport = async (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const backup = JSON.parse(await file.text())

      if (!validateBackup(backup)) {
        setMessage('Invalid QuestDeen backup file.')
        return
      }

      const confirmed = window.confirm(
        'Importing this backup will replace local QuestDeen data. Continue?',
      )

      if (!confirmed) {
        return
      }

      await importBackupData(backup)
      setUser(await getOrCreateActiveUser())
      setMessage('Backup imported successfully.')
    } catch (error) {
      console.error('Failed to import backup:', error)
      setMessage('Failed to import backup.')
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleReset = async () => {
    const confirmed = window.confirm(
      'Reset all local QuestDeen data on this device? This cannot be undone.',
    )

    if (!confirmed) {
      return
    }

    await resetLocalData()
    setUser(await getOrCreateActiveUser())
    setMessage('Local data reset. Default user recreated.')
  }

  return (
    <AppShell
      activePage={activePage}
      isDarkMode={isDarkMode}
      onNavigate={onNavigate}
      onToggleDarkMode={onToggleDarkMode}
      user={user}
    >
      <section className="relative min-w-0 overflow-hidden rounded-[2rem] border border-[#d6cbb6] bg-[#0f3d2e] p-6 text-white shadow-[0_18px_45px_rgba(44,35,19,0.14)] dark:border-white/10 dark:bg-[#10241d] sm:p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d9a441] dark:text-[#e6b84a]">
          Settings
        </p>
        <h1 className="mt-3 break-words text-[clamp(1.75rem,3vw,2.75rem)] font-bold leading-tight tracking-tight">
          Backup and offline readiness.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#dce8dd] sm:text-base">
          Export, import, or reset the local IndexedDB data stored on this
          device.
        </p>
      </section>

      {message && (
        <p className="rounded-2xl border border-[#c7dbc0] bg-[#dde8d2]/70 px-4 py-3 text-sm font-semibold text-[#1f6f50] dark:border-[#2ddfa3]/20 dark:bg-[#2ddfa3]/10 dark:text-[#2ddfa3]">
          {message}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <Download className="mb-4 text-[#1f6f50] dark:text-[#2ddfa3]" />
          <h2 className="text-xl font-bold text-[#17352b] dark:text-[#f7f3e8]">
            Export backup
          </h2>
          <p className="mt-2 text-sm text-[#6f7e76] dark:text-[#a7b8b2]">
            Download all QuestDeen local data as a JSON backup.
          </p>
          <button
            className="mt-5 rounded-xl bg-[#1f6f50] px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 dark:bg-[#2ddfa3] dark:text-[#071a16]"
            onClick={handleExport}
            type="button"
          >
            Export Data
          </button>
        </Card>

        <Card>
          <Upload className="mb-4 text-[#1f6f50] dark:text-[#2ddfa3]" />
          <h2 className="text-xl font-bold text-[#17352b] dark:text-[#f7f3e8]">
            Import backup
          </h2>
          <p className="mt-2 text-sm text-[#6f7e76] dark:text-[#a7b8b2]">
            Restore a QuestDeen JSON backup after confirmation.
          </p>
          <input
            accept="application/json"
            className="mt-5 w-full rounded-xl border border-[#e4dccb] bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/[0.04]"
            onChange={handleImport}
            ref={fileInputRef}
            type="file"
          />
        </Card>

        <Card>
          <RotateCcw className="mb-4 text-[#9a3d2f]" />
          <h2 className="text-xl font-bold text-[#17352b] dark:text-[#f7f3e8]">
            Danger zone
          </h2>
          <p className="mt-2 text-sm text-[#6f7e76] dark:text-[#a7b8b2]">
            Clear QuestDeen local data only, then recreate default settings.
          </p>
          <button
            className="mt-5 rounded-xl bg-[#9a3d2f] px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5"
            onClick={handleReset}
            type="button"
          >
            Reset Local Data
          </button>
        </Card>
      </div>
    </AppShell>
  )
}

export default Backup
