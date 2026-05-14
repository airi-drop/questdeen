import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  Calculator,
  Camera,
  Download,
  MapPinned,
  Palette,
  RotateCcw,
  Upload,
  User,
} from 'lucide-react'
import AppShell from '../components/AppShell'
import Card from '../components/Card'
import {
  downloadBackup,
  exportBackupData,
  importBackupData,
  resetLocalData,
  validateBackup,
} from '../lib/backupData'
import {
  getOrCreateActiveUser,
  getSettings,
  updateActiveUser,
  updateSettings,
} from '../lib/db'
import {
  CALCULATION_METHOD_OPTIONS,
  MADHAB_OPTIONS,
  getDefaultPrayerSettings,
  getReadableLocationLabel,
  requestAndStoreLocation,
  requestNotificationPermission,
  DEFAULT_LOCATION,
} from '../lib/prayerTimeData'

const REMINDER_OFFSETS = [5, 10, 15, 30]

function Backup({
  activePage = 'backup',
  isDarkMode,
  onNavigate,
  onResetLocalData,
  onThemeChange,
  onToggleDarkMode,
  themeMode = 'light',
}) {
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [profileNameInput, setProfileNameInput] = useState('')
  const [settings, setSettings] = useState(null)
  const [user, setUser] = useState(null)
  const fileInputRef = useRef(null)
  const profileImageInputRef = useRef(null)

  const refreshLocalState = async () => {
    const [activeUser, storedSettings] = await Promise.all([
      getOrCreateActiveUser(),
      getSettings(),
    ])

    setUser(activeUser)
    setSettings(storedSettings)
    setProfileNameInput(activeUser.name || '')

    return { activeUser, storedSettings }
  }

  useEffect(() => {
    Promise.all([getOrCreateActiveUser(), getSettings()])
      .then(([activeUser, storedSettings]) => {
        setUser(activeUser)
        setSettings(storedSettings)
        setProfileNameInput(activeUser.name || '')
      })
      .catch(console.error)
  }, [])

  const prayerSettings = getDefaultPrayerSettings(settings || {})
  const location = user?.location || DEFAULT_LOCATION
  const locationLabel = getReadableLocationLabel(location)

  const showMessage = (nextMessage) => {
    setErrorMessage('')
    setMessage(nextMessage)
  }

  const showError = (nextMessage) => {
    setMessage('')
    setErrorMessage(nextMessage)
  }

  const handleExport = async () => {
    const backup = await exportBackupData()
    downloadBackup(backup)
    showMessage('Backup exported successfully.')
  }

  const handleSaveProfile = async () => {
    const name = profileNameInput.trim()

    if (!name) {
      showError('Name cannot be empty.')
      return
    }

    const savedUser = await updateActiveUser({
      name,
      avatarInitial: name.slice(0, 1).toUpperCase(),
    })

    setUser(savedUser)
    setProfileNameInput(savedUser.name || '')
    showMessage('Profile saved.')
  }

  const handleProfileImageChange = async (event) => {
    const file = event.target.files?.[0]

    if (!file || !user) {
      return
    }

    if (!file.type.startsWith('image/')) {
      showError('Please choose an image file.')
      return
    }

    const profileImage = await new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
    const savedUser = await updateActiveUser({ profileImage })

    setUser(savedUser)
    showMessage('Profile photo saved.')

    if (profileImageInputRef.current) {
      profileImageInputRef.current.value = ''
    }
  }

  const handleImport = async (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const backup = JSON.parse(await file.text())

      if (!validateBackup(backup)) {
        showError('Invalid QuestDeen backup file.')
        return
      }

      const confirmed = window.confirm(
        'Importing this backup will replace local QuestDeen data. Continue?',
      )

      if (!confirmed) {
        return
      }

      await importBackupData(backup)
      const { storedSettings } = await refreshLocalState()
      await onThemeChange?.(storedSettings.theme || 'light')
      showMessage('Backup imported successfully.')
    } catch (error) {
      console.error('Failed to import backup:', error)
      showError('Failed to import backup. Check that the file is a QuestDeen JSON export.')
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

    if (onResetLocalData) {
      await onResetLocalData()
      return
    }

    await resetLocalData()
    const { storedSettings } = await refreshLocalState()
    await onThemeChange?.(storedSettings.theme || 'light')
    showMessage('Local data reset. Default user recreated.')
  }

  const handlePrayerSettingChange = async (updates) => {
    const nextSettings = await updateSettings({
      prayerSettings: {
        ...prayerSettings,
        ...updates,
      },
    })

    setSettings(nextSettings)
    showMessage('Prayer settings saved.')
  }

  const handleAppSettingChange = async (updates) => {
    const nextSettings = await updateSettings(updates)

    setSettings(nextSettings)
    showMessage('App preferences saved.')
  }

  const handleThemePreferenceChange = async (nextThemeMode) => {
    await onThemeChange?.(nextThemeMode)
    setSettings((currentSettings) => ({
      ...(currentSettings || {}),
      theme: nextThemeMode,
    }))
    showMessage('App preferences saved.')
  }

  const handleLocationRequest = async () => {
    try {
      await requestAndStoreLocation({ forceReverseGeocode: true })
      const nextUser = await getOrCreateActiveUser()

      setUser(nextUser)
      showMessage('Location saved for prayer time calculations.')
    } catch (error) {
      console.error('Failed to request location:', error)
      showError(error.message || 'Could not read browser location.')
    }
  }

  const handleNotificationRequest = async () => {
    try {
      const permission = await requestNotificationPermission()

      if (permission === 'granted') {
        await handlePrayerSettingChange({ notificationsEnabled: true })
        showMessage('Prayer notifications enabled.')
      } else {
        showError('Notification permission was not granted.')
      }
    } catch (error) {
      console.error('Failed to request notifications:', error)
      showError(error.message || 'Notifications are not available.')
    }
  }

  return (
    <AppShell
      activePage={activePage}
      isDarkMode={isDarkMode}
      onNavigate={onNavigate}
      onResetLocalData={onResetLocalData}
      onToggleDarkMode={onToggleDarkMode}
      user={user}
    >
      <section className="relative min-w-0 overflow-hidden rounded-[2rem] border border-[#d6cbb6] bg-[#0f3d2e] p-6 text-white shadow-[0_18px_45px_rgba(44,35,19,0.14)] dark:border-white/10 dark:bg-[#10241d] sm:p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d9a441] dark:text-[#e6b84a]">
          Settings
        </p>
        <h1 className="mt-3 break-words text-[clamp(1.75rem,3vw,2.75rem)] font-bold leading-tight tracking-tight">
          Profile & Preferences
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#dce8dd] sm:text-base">
          Manage prayer calculations, app preferences, local backup, and PWA
          data on this device.
        </p>
      </section>

      {message && (
        <p className="rounded-2xl border border-[#c7dbc0] bg-[#dde8d2]/70 px-4 py-3 text-sm font-semibold text-[#1f6f50] dark:border-[#2ddfa3]/20 dark:bg-[#2ddfa3]/10 dark:text-[#2ddfa3]">
          {message}
        </p>
      )}
      {errorMessage && (
        <p className="rounded-2xl border border-[#e7c8bd] bg-[#f8ece8] px-4 py-3 text-sm font-semibold text-[#9a3d2f] dark:border-[#c56b5c]/30 dark:bg-[#9a3d2f]/10 dark:text-[#ffb4a8]">
          {errorMessage}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <User className="mb-4 text-[#1f6f50] dark:text-[#2ddfa3]" />
          <h2 className="text-xl font-bold text-[#17352b] dark:text-[#f7f3e8]">
            Profile
          </h2>
          <div className="mt-5 flex min-w-0 items-center gap-4">
            {user?.profileImage ? (
              <img
                alt=""
                className="size-20 shrink-0 rounded-2xl object-cover shadow-sm"
                src={user.profileImage}
              />
            ) : (
              <div className="grid size-20 shrink-0 place-items-center rounded-2xl bg-[#d9a441] text-3xl font-bold text-[#2d2408] dark:bg-[#e6b84a]">
                {(user?.avatarInitial || user?.name || 'A').slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-[#17352b] dark:text-[#f7f3e8]">
                {user?.name || 'Guest'}
              </p>
              <p className="mt-1 text-sm text-[#6f7e76] dark:text-[#a7b8b2]">
                Level {user?.level || 1} · {user?.totalXP || 0} XP
              </p>
              <p className="mt-1 text-sm text-[#6f7e76] dark:text-[#a7b8b2]">
                Current streak: {user?.currentStreak || 0} days
              </p>
            </div>
          </div>

          <label className="mt-5 block text-sm font-semibold text-[#17352b] dark:text-[#f7f3e8]">
            Display name
            <input
              className="mt-2 w-full rounded-xl border border-[#e4dccb] bg-white/70 px-3 py-2 text-sm text-[#17352b] outline-none transition focus:border-[#1f6f50] focus:ring-2 focus:ring-[#1f6f50]/20 dark:border-white/10 dark:bg-[#071a16] dark:text-[#f7f3e8]"
              onChange={(event) => setProfileNameInput(event.target.value)}
              value={profileNameInput}
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded-xl bg-[#1f6f50] px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 dark:bg-[#2ddfa3] dark:text-[#071a16]"
              onClick={handleSaveProfile}
              type="button"
            >
              Save Profile
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-[#dde8d2] bg-[#dde8d2] px-4 py-2 text-sm font-bold text-[#1f6f50] transition hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 dark:border-[#2ddfa3]/20 dark:bg-[#2ddfa3]/10 dark:text-[#2ddfa3]"
              onClick={() => profileImageInputRef.current?.click()}
              type="button"
            >
              <Camera size={16} />
              Upload Photo
            </button>
            <input
              accept="image/*"
              className="hidden"
              onChange={handleProfileImageChange}
              ref={profileImageInputRef}
              type="file"
            />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <Palette className="mb-4 text-[#1f6f50] dark:text-[#2ddfa3]" />
          <h2 className="text-xl font-bold text-[#17352b] dark:text-[#f7f3e8]">
            App preferences
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-[#17352b] dark:text-[#f7f3e8]">
              Theme
              <select
                className="mt-2 w-full rounded-xl border border-[#e4dccb] bg-white/70 px-3 py-2 text-sm text-[#17352b] outline-none transition focus:border-[#1f6f50] focus:ring-2 focus:ring-[#1f6f50]/20 dark:border-white/10 dark:bg-[#071a16] dark:text-[#f7f3e8]"
                onChange={(event) =>
                  handleThemePreferenceChange(event.target.value)
                }
                value={themeMode}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-[#17352b] dark:text-[#f7f3e8]">
              Language
              <select
                className="mt-2 w-full rounded-xl border border-[#e4dccb] bg-white/70 px-3 py-2 text-sm text-[#17352b] outline-none transition focus:border-[#1f6f50] focus:ring-2 focus:ring-[#1f6f50]/20 dark:border-white/10 dark:bg-[#071a16] dark:text-[#f7f3e8]"
                onChange={(event) =>
                  handleAppSettingChange({ language: event.target.value })
                }
                value={settings?.language || 'id'}
              >
                <option value="id">Indonesian</option>
              </select>
            </label>
          </div>
          <p className="mt-4 text-sm text-[#6f7e76] dark:text-[#a7b8b2]">
            Theme and language preferences are saved to IndexedDB and applied
            across future visits.
          </p>
        </Card>

        <Card className="lg:col-span-3">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Calculator className="mb-4 text-[#1f6f50] dark:text-[#2ddfa3]" />
              <h2 className="text-xl font-bold text-[#17352b] dark:text-[#f7f3e8]">
                Prayer settings
              </h2>
              <p className="mt-2 text-sm text-[#6f7e76] dark:text-[#a7b8b2]">
                Calculation, madhab, location, and reminder preferences are stored locally.
              </p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-[#1f6f50] px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 dark:bg-[#2ddfa3] dark:text-[#071a16]"
              onClick={handleLocationRequest}
              type="button"
            >
              <MapPinned size={16} />
              Refresh Location
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="min-w-0 text-sm font-semibold text-[#17352b] dark:text-[#f7f3e8]">
              Calculation method
              <select
                className="mt-2 w-full rounded-xl border border-[#e4dccb] bg-white/70 px-3 py-2 text-sm text-[#17352b] outline-none transition focus:border-[#1f6f50] focus:ring-2 focus:ring-[#1f6f50]/20 dark:border-white/10 dark:bg-[#071a16] dark:text-[#f7f3e8]"
                onChange={(event) =>
                  handlePrayerSettingChange({ calculationMethod: event.target.value })
                }
                value={prayerSettings.calculationMethod}
              >
                {CALCULATION_METHOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="min-w-0 text-sm font-semibold text-[#17352b] dark:text-[#f7f3e8]">
              Madhab
              <select
                className="mt-2 w-full rounded-xl border border-[#e4dccb] bg-white/70 px-3 py-2 text-sm text-[#17352b] outline-none transition focus:border-[#1f6f50] focus:ring-2 focus:ring-[#1f6f50]/20 dark:border-white/10 dark:bg-[#071a16] dark:text-[#f7f3e8]"
                onChange={(event) =>
                  handlePrayerSettingChange({ madhab: event.target.value })
                }
                value={prayerSettings.madhab}
              >
                {MADHAB_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="min-w-0 text-sm font-semibold text-[#17352b] dark:text-[#f7f3e8]">
              Reminder offset
              <select
                className="mt-2 w-full rounded-xl border border-[#e4dccb] bg-white/70 px-3 py-2 text-sm text-[#17352b] outline-none transition focus:border-[#1f6f50] focus:ring-2 focus:ring-[#1f6f50]/20 dark:border-white/10 dark:bg-[#071a16] dark:text-[#f7f3e8]"
                onChange={(event) =>
                  handlePrayerSettingChange({
                    notificationOffsetMinutes: Number(event.target.value),
                  })
                }
                value={prayerSettings.notificationOffsetMinutes}
              >
                {REMINDER_OFFSETS.map((offset) => (
                  <option key={offset} value={offset}>
                    {offset} minutes
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-2xl border border-[#e4dccb] bg-white/50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-sm font-bold text-[#17352b] dark:text-[#f7f3e8]">
                Saved location
              </p>
              <p className="mt-2 text-sm font-semibold text-[#17352b] dark:text-[#f7f3e8]">
                {locationLabel}
              </p>
              <p className="mt-1 text-xs leading-5 text-[#6f7e76] dark:text-[#a7b8b2]">
                {location.source === 'default' ? 'default location' : 'browser location'}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="flex items-center gap-3 rounded-2xl border border-[#e4dccb] bg-white/50 p-4 text-sm font-semibold dark:border-white/10 dark:bg-white/[0.04]">
              <input
                checked={prayerSettings.notificationsEnabled}
                onChange={(event) =>
                  handlePrayerSettingChange({
                    notificationsEnabled: event.target.checked,
                  })
                }
                type="checkbox"
              />
              Prayer notifications
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-[#e4dccb] bg-white/50 p-4 text-sm font-semibold dark:border-white/10 dark:bg-white/[0.04]">
              <input
                checked={prayerSettings.notifyBeforePrayer}
                onChange={(event) =>
                  handlePrayerSettingChange({
                    notifyBeforePrayer: event.target.checked,
                  })
                }
                type="checkbox"
              />
              Notify before prayer
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-[#e4dccb] bg-white/50 p-4 text-sm font-semibold dark:border-white/10 dark:bg-white/[0.04]">
              <input
                checked={prayerSettings.notifyAtPrayerTime}
                onChange={(event) =>
                  handlePrayerSettingChange({
                    notifyAtPrayerTime: event.target.checked,
                  })
                }
                type="checkbox"
              />
              Notify at prayer time
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-[#e4dccb] bg-white/50 p-4 text-sm font-semibold dark:border-white/10 dark:bg-white/[0.04]">
              <input
                checked={prayerSettings.autoLocationRefresh}
                onChange={(event) =>
                  handlePrayerSettingChange({
                    autoLocationRefresh: event.target.checked,
                  })
                }
                type="checkbox"
              />
              Auto location refresh
            </label>
          </div>

          <button
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#dde8d2] bg-[#dde8d2] px-4 py-2 text-sm font-bold text-[#1f6f50] transition hover:-translate-y-0.5 dark:border-[#2ddfa3]/20 dark:bg-[#2ddfa3]/10 dark:text-[#2ddfa3]"
            onClick={handleNotificationRequest}
            type="button"
          >
            <Bell size={16} />
            Allow Notifications
          </button>
        </Card>

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
