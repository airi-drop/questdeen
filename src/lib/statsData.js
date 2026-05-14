import { getOrCreateActiveUser } from "./db";
import { getTodayKey, getWeekDateKeys, getWeekKey } from "./date";
import { refreshAchievements } from "./achievementData";
import { initDB } from "./db";
import { requestToPromise } from "./dbUtils";

const PRAYERS = ["subuh", "dzuhur", "ashar", "maghrib", "isya"];
const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Ahad"];

async function getAll(storeName) {
  const db = await initDB();

  return requestToPromise(db.transaction(storeName, "readonly").objectStore(storeName).getAll());
}

function getCurrentMonthDateKeys(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => getTodayKey(new Date(year, month, index + 1)));
}

function countCompletedPrayers(prayers, userId, date) {
  return new Set(prayers.filter((record) => record.userId === userId && record.date === date && record.status === "done").map((record) => record.prayer)).size;
}

function getAyatTotal(logs, userId, dateKeys) {
  const dateSet = new Set(Array.isArray(dateKeys) ? dateKeys : [dateKeys]);

  return logs.filter((record) => record.userId === userId && dateSet.has(record.date) && (record.type === "tilawah" || record.type === "quran")).reduce((total, record) => total + (Number(record.ayatCount ?? record.amount) || 0), 0);
}

function getCompletionRate(quests, userId) {
  const userQuests = quests.filter((quest) => quest.userId === userId);

  if (userQuests.length === 0) {
    return 0;
  }

  const completed = userQuests.filter((quest) => quest.isCompleted).length;

  return Math.round((completed / userQuests.length) * 100);
}

function getNearestLockedAchievements(achievements) {
  return achievements
    .filter((achievement) => !achievement.isUnlocked)
    .map((achievement) => ({
      ...achievement,
      percent: Math.min(100, Math.round((achievement.progress / achievement.target) * 100)),
    }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 3);
}

export async function getStatisticsData() {
  const user = await getOrCreateActiveUser();
  const [prayers, quests, logs] = await Promise.all([getAll("prayers"), getAll("quests"), getAll("ibadah_log")]);
  const achievementData = await refreshAchievements(user);
  const todayKey = getTodayKey();
  const weekKeys = getWeekDateKeys();
  const monthKeys = getCurrentMonthDateKeys();
  const weekKey = getWeekKey();
  const totalCompletedPrayers = prayers.filter((record) => record.userId === user.id && record.status === "done").length;
  const totalQuranAyat = getAyatTotal(
    logs,
    user.id,
    logs.map((log) => log.date),
  );
  const completedQuests = quests.filter((quest) => quest.userId === user.id && quest.isCompleted);
  const unlockedAchievements = achievementData.achievements.filter((achievement) => achievement.isUnlocked);
  const weeklyPrayerProgress = weekKeys.map((date, index) => ({
    date,
    label: DAY_LABELS[index],
    completed: countCompletedPrayers(prayers, user.id, date),
    total: PRAYERS.length,
  }));
  const monthlyPrayerOverview = monthKeys.map((date) => ({
    date,
    day: Number(date.slice(-2)),
    completed: countCompletedPrayers(prayers, user.id, date),
    total: PRAYERS.length,
  }));
  const dailyCompletedThisWeek = completedQuests.filter((quest) => quest.type === "daily" && weekKeys.includes(quest.period)).length;
  const weeklyCompletedThisMonth = completedQuests.filter((quest) => {
    if (quest.type !== "weekly") {
      return false;
    }

    const completedAt = quest.completedAt ? new Date(quest.completedAt) : null;

    if (!completedAt) {
      return false;
    }

    const completedDateKey = getTodayKey(completedAt);

    return monthKeys.includes(completedDateKey);
  }).length;

  return {
    user,
    summary: {
      totalCompletedPrayers,
      currentStreak: user.currentStreak || 0,
      bestStreak: user.bestStreak || 0,
      totalXP: user.totalXP || 0,
      currentLevel: user.level || 1,
      totalQuranAyat,
      completedQuests: completedQuests.length,
      unlockedAchievements: unlockedAchievements.length,
      totalAchievements: achievementData.achievements.length,
    },
    weeklyPrayerProgress,
    monthlyPrayerOverview,
    quranStats: {
      totalAyat: totalQuranAyat,
      todayAyat: getAyatTotal(logs, user.id, todayKey),
      weekAyat: getAyatTotal(logs, user.id, weekKeys),
      monthAyat: getAyatTotal(logs, user.id, monthKeys),
    },
    questStats: {
      dailyCompletedThisWeek,
      weeklyCompletedThisMonth,
      completionRate: getCompletionRate(quests, user.id),
      currentWeek: weekKey,
    },
    achievements: {
      unlocked: unlockedAchievements.length,
      total: achievementData.achievements.length,
      nearestLocked: getNearestLockedAchievements(achievementData.achievements),
    },
  };
}
