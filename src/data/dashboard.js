import {
  BookOpenCheck,
  BarChart3,
  CalendarCheck,
  Flame,
  Home,
  MoonStar,
  Settings,
  Sparkles,
  Star,
  Trophy,
} from 'lucide-react'

export const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: Home },
  { key: 'prayers', label: 'Prayers', icon: MoonStar },
  { key: 'quests', label: 'Quests', icon: CalendarCheck },
  { key: 'quran', label: 'Quran', icon: BookOpenCheck },
  { key: 'achievement', label: 'Achievement', icon: Trophy },
  { key: 'statistics', label: 'Statistics', icon: BarChart3 },
  { key: 'backup', label: 'Backup', icon: Settings },
]

export const prayers = [
  { name: 'Fajr', time: '4:36 AM', isDone: true },
  { name: 'Dhuhr', time: '12:08 PM', isDone: true },
  { name: 'Asr', time: '3:31 PM', isDone: false },
  { name: 'Maghrib', time: '6:21 PM', isDone: false },
  { name: 'Isha', time: '7:42 PM', isDone: false },
]

export const stats = [
  {
    label: 'Total XP',
    value: '12,840',
    detail: '+420 XP today',
    icon: Sparkles,
    tone: 'emerald',
  },
  {
    label: 'Current Streak',
    value: '18 days',
    detail: 'Best streak: 32 days',
    icon: Flame,
    tone: 'amber',
  },
]

export const dailyQuests = [
  { title: 'Complete all prayers', reward: '120 XP', progress: 40 },
  { title: 'Read 10 Quran verses', reward: '80 XP', progress: 70 },
  { title: 'Evening dhikr session', reward: '60 XP', progress: 20 },
]

export const weeklyQuests = [
  { title: 'Attend Jumuah prayer', reward: '250 XP', progress: 100 },
  { title: 'Give charity', reward: '180 XP', progress: 65 },
  { title: 'Memorize a short surah', reward: '300 XP', progress: 35 },
]

export const achievements = [
  { title: 'Fajr Guardian', detail: 'Prayed Fajr 7 days in a row', icon: Star },
  { title: 'Quest Champion', detail: 'Finished 20 daily quests', icon: Trophy },
  { title: 'Light Seeker', detail: 'Read Quran for 14 days', icon: MoonStar },
]
