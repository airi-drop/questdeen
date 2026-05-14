import { initDB } from "./db";
import { getLevelFromXP } from "./xp";
import { requestToPromise, transactionToPromise } from "./dbUtils";

const ACHIEVEMENTS = [
  {
    badgeKey: "first_prayer",
    title: "Langkah Pertama",
    detail: "Selesaikan shalat pertama.",
    xpReward: 10,
    icon: "🌙",
    target: 1,
  },
  {
    badgeKey: "streak_3",
    title: "Istiqomah Pemula",
    detail: "Capai streak shalat 3 hari.",
    xpReward: 25,
    icon: "🌱",
    target: 3,
  },
  {
    badgeKey: "streak_7",
    title: "Seminggu Penuh",
    detail: "Capai streak shalat 7 hari.",
    xpReward: 75,
    icon: "⚡",
    target: 7,
  },
  {
    badgeKey: "streak_30",
    title: "Sebulan Istiqomah",
    detail: "Capai streak shalat 30 hari.",
    xpReward: 300,
    icon: "🕌",
    target: 30,
  },
  {
    badgeKey: "quran_100",
    title: "Pecinta Qur'an",
    detail: "Baca total 100 ayat Quran.",
    xpReward: 50,
    icon: "📖",
    target: 100,
  },
  {
    badgeKey: "quest_10",
    title: "Quest Hunter",
    detail: "Selesaikan 10 quest.",
    xpReward: 100,
    icon: "⚔️",
    target: 10,
  },
  {
    badgeKey: "subuh_warrior",
    title: "Pejuang Subuh",
    detail: "Selesaikan Subuh 7 kali.",
    xpReward: 150,
    icon: "🌅",
    target: 7,
  },
];

async function getAll(storeName) {
  const db = await initDB();

  return requestToPromise(db.transaction(storeName, "readonly").objectStore(storeName).getAll());
}

function getAchievementId(userId, badgeKey) {
  return `${userId}:${badgeKey}`;
}

function getAchievementProgress({ prayers, logs, quests, userId, currentStreak }) {
  const completedPrayers = prayers.filter((record) => record.userId === userId && record.status === "done");
  const totalAyat = logs.filter((record) => record.userId === userId && (record.type === "tilawah" || record.type === "quran")).reduce((total, record) => total + (Number(record.ayatCount ?? record.amount) || 0), 0);
  const completedQuestCount = quests.filter((quest) => quest.userId === userId && quest.isCompleted).length;
  const subuhCount = completedPrayers.filter((record) => record.prayer === "subuh").length;

  return {
    first_prayer: completedPrayers.length,
    streak_3: currentStreak,
    streak_7: currentStreak,
    streak_30: currentStreak,
    quran_100: totalAyat,
    quest_10: completedQuestCount,
    subuh_warrior: subuhCount,
  };
}

function getProgressText(template, progress) {
  return `${Math.min(progress, template.target)}/${template.target}`;
}

function toAchievementView(template, record, progress) {
  return {
    id: record?.id || `locked:${template.badgeKey}`,
    userId: record?.userId,
    badgeKey: template.badgeKey,
    title: template.title,
    detail: template.detail,
    icon: template.icon,
    xpReward: template.xpReward,
    xpEarned: record?.xpEarned || 0,
    target: template.target,
    unlockedAt: record?.unlockedAt || null,
    isUnlocked: Boolean(record),
    progress,
    progressText: getProgressText(template, progress),
  };
}

export async function refreshAchievements(user) {
  const db = await initDB();
  const [prayers, logs, quests, existingAchievements] = await Promise.all([getAll("prayers"), getAll("ibadah_log"), getAll("quests"), getAll("achievements")]);
  const unlockedByKey = new Set(existingAchievements.filter((achievement) => achievement.userId === user.id).map((achievement) => achievement.badgeKey));
  const progressByKey = getAchievementProgress({
    prayers,
    logs,
    quests,
    userId: user.id,
    currentStreak: user.currentStreak || 0,
  });
  const now = new Date().toISOString();
  const newlyUnlocked = ACHIEVEMENTS.filter((achievement) => progressByKey[achievement.badgeKey] >= achievement.target && !unlockedByKey.has(achievement.badgeKey));

  if (newlyUnlocked.length > 0) {
    const xpToAward = newlyUnlocked.reduce((total, achievement) => total + achievement.xpReward, 0);
    const totalXP = (user.totalXP || 0) + xpToAward;
    const transaction = db.transaction(["achievements", "users"], "readwrite");
    const achievementStore = transaction.objectStore("achievements");

    newlyUnlocked.forEach((achievement) => {
      achievementStore.put({
        id: getAchievementId(user.id, achievement.badgeKey),
        userId: user.id,
        badgeKey: achievement.badgeKey,
        xpReward: achievement.xpReward,
        xpEarned: achievement.xpReward,
        unlockedAt: now,
      });
    });
    transaction.objectStore("users").put({
      ...user,
      totalXP,
      level: getLevelFromXP(totalXP),
      updatedAt: now,
    });
    await transactionToPromise(transaction);
  }

  const achievements = await getAll("achievements");
  const recordsByKey = new Map(achievements.filter((achievement) => achievement.userId === user.id).map((achievement) => [achievement.badgeKey, achievement]));

  return {
    achievements: ACHIEVEMENTS.map((template) => toAchievementView(template, recordsByKey.get(template.badgeKey), progressByKey[template.badgeKey] || 0)).sort((a, b) => {
      if (a.isUnlocked && !b.isUnlocked) {
        return -1;
      }
      if (!a.isUnlocked && b.isUnlocked) {
        return 1;
      }
      if (a.isUnlocked && b.isUnlocked) {
        return new Date(b.unlockedAt) - new Date(a.unlockedAt);
      }

      return ACHIEVEMENTS.findIndex((item) => item.badgeKey === a.badgeKey) - ACHIEVEMENTS.findIndex((item) => item.badgeKey === b.badgeKey);
    }),
    newlyUnlocked: newlyUnlocked.map((achievement) => ({
      ...achievement,
      isUnlocked: true,
      xpEarned: achievement.xpReward,
    })),
  };
}
