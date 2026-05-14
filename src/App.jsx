import { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import Statistics from './pages/Statistics'
import Backup from './pages/Backup'
import { getSettings, updateSettings } from './lib/db'
import { resetLocalData } from './lib/backupData'

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [dataVersion, setDataVersion] = useState(0)
  const [themeMode, setThemeMode] = useState('light')
  const [systemDarkMode, setSystemDarkMode] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches,
  )
  const isDarkMode =
    themeMode === 'system' ? systemDarkMode : themeMode === 'dark'

  useEffect(() => {
    getSettings()
      .then((settings) => {
        setThemeMode(settings.theme || 'light')
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => setSystemDarkMode(media.matches)

    media.addEventListener('change', handleChange)

    return () => media.removeEventListener('change', handleChange)
  }, [])

  const handleThemeChange = async (nextThemeMode) => {
    setThemeMode(nextThemeMode)
    await updateSettings({ theme: nextThemeMode })
  }

  const handleResetLocalData = async () => {
    await resetLocalData()
    setThemeMode('light')
    setActivePage('dashboard')
    setDataVersion((currentVersion) => currentVersion + 1)
  }

  const pageProps = {
    activePage,
    isDarkMode,
    onNavigate: setActivePage,
    onResetLocalData: handleResetLocalData,
    onThemeChange: handleThemeChange,
    onToggleDarkMode: () =>
      handleThemeChange(isDarkMode ? 'light' : 'dark').catch(console.error),
    }

  return activePage === 'backup' ? (
    <Backup key={`backup-${dataVersion}`} {...pageProps} themeMode={themeMode} />
  ) : activePage === 'statistics' ? (
    <Statistics key={`statistics-${dataVersion}`} {...pageProps} />
  ) : (
    <Dashboard
      key={`dashboard-${dataVersion}`}
      {...pageProps}
    />
  )
}

export default App
