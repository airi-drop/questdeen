import { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import Statistics from "./pages/Statistics";
import Backup from "./pages/Backup";
import ErrorBoundary from "./components/ErrorBoundary";
import { getSettings, updateSettings } from "./lib/db";
import { resetLocalData } from "./lib/backupData";

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [dataVersion, setDataVersion] = useState(0);
  const [themeMode, setThemeMode] = useState("light");
  const [systemDarkMode, setSystemDarkMode] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  const isDarkMode = themeMode === "system" ? systemDarkMode : themeMode === "dark";

  useEffect(() => {
    getSettings()
      .then((settings) => {
        setThemeMode(settings.theme || "light");
      })
      .catch((error) => {
        console.error("Failed to load app settings:", error);
        // Use default theme if settings fail to load
      });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => setSystemDarkMode(media.matches);

    media.addEventListener("change", handleChange);

    return () => media.removeEventListener("change", handleChange);
  }, []);

  const handleThemeChange = async (nextThemeMode) => {
    setThemeMode(nextThemeMode);
    await updateSettings({ theme: nextThemeMode });
  };

  const handleResetLocalData = async () => {
    await resetLocalData();
    setThemeMode("light");
    setActivePage("dashboard");
    setDataVersion((currentVersion) => currentVersion + 1);
  };

  const pageProps = {
    activePage,
    isDarkMode,
    onNavigate: setActivePage,
    onResetLocalData: handleResetLocalData,
    onThemeChange: handleThemeChange,
    onToggleDarkMode: async () => {
      try {
        await handleThemeChange(isDarkMode ? "light" : "dark");
      } catch (error) {
        console.error("Failed to toggle dark mode:", error);
        // Toggle UI state even if settings save fails
        setThemeMode(isDarkMode ? "light" : "dark");
      }
    },
  };

  return (
    <ErrorBoundary>
      {activePage === "backup" ? (
        <Backup key={`backup-${dataVersion}`} {...pageProps} themeMode={themeMode} />
      ) : activePage === "statistics" ? (
        <Statistics key={`statistics-${dataVersion}`} {...pageProps} />
      ) : (
        <Dashboard key={`dashboard-${dataVersion}`} {...pageProps} />
      )}
    </ErrorBoundary>
  );
}

export default App;
