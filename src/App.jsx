import { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import Statistics from './pages/Statistics'
import Backup from './pages/Backup'

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [activePage, setActivePage] = useState('dashboard')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  const pageProps = {
    activePage,
    isDarkMode,
    onNavigate: setActivePage,
    onToggleDarkMode: () => setIsDarkMode((currentMode) => !currentMode),
  }

  return activePage === 'backup' ? (
    <Backup {...pageProps} />
  ) : activePage === 'statistics' ? (
    <Statistics {...pageProps} />
  ) : (
    <Dashboard
      {...pageProps}
    />
  )
}

export default App
