import { initDB } from "./db";
import { getTodayKey, getWeekDateKeys, getWeekKey } from "./date";
import { getLevelFromXP } from "./xp";
import { requestToPromise, transactionToPromise } from "./dbUtils";

const DAILY_QUESTS = [
  {
    questKey: "full_day_prayers",
    title: "Complete all prayers",
    target: 5,
    xpReward: 50,
  },
  {
    questKey: "quran_10_ayat",
    title: "Read 10 Quran verses",
    target: 10,
    xpReward: 80,
  },
  {
    questKey: "evening_dhikr",
    title: "Evening dhikr session",
    target: 1,
    xpReward: 60,
  },
];

const WEEKLY_QUESTS = [
  {
    questKey: "full_week_prayers",
    title: "Complete all prayers for 7 days",
    target: 7,
    xpReward: 250,
  },
  {
    questKey: "weekly_sedekah",
    title: "Give charity",
    target: 1,
    xpReward: 180,
  },
  {
    questKey: "memorize_short_surah",
    title: "Memorize a short surah",
    target: 1,
    xpReward: 300,
  },
];

const PRAYERS = ["subuh", "dzuhur", "ashar", "maghrib", "isya"];

function getQuestId(userId, type, period, questKey) {
  return `${userId}:${type}:${period}:${questKey}`;
}

function createQuestRecord(userId, type, period, template) {
  const now = new Date().toISOString();

  return {
    id: getQuestId(userId, type, period, template.questKey),
    userId,
    type,
    period,
    questKey: template.questKey,
    title: template.title,
    target: template.target,
    progress: 0,
    xpReward: template.xpReward,
    xpEarned: 0,
    isCompleted: false,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

function toQuestView(record) {
  const percent = Math.min(100, Math.round((record.progress / record.target) * 100));

  return {
    ...record,
    reward: `${record.xpReward} XP`,
    percent,
  };
}

async function getAllFromStore(storeName) {
  const db = await initDB();

  return requestToPromise(db.transaction(storeName, "readonly").objectStore(storeName).getAll());
}

async function getUser(userId) {
  const db = await initDB();

  return requestToPromise(db.transaction("users", "readonly").objectStore("users").get(userId));
}

async function updateUserXP(userId, xpToAward) {
  if (xpToAward <= 0) {
    return getUser(userId);
  }

  const db = await initDB();
  const user = await getUser(userId);
  const totalXP = (user.totalXP || 0) + xpToAward;
  const transaction = db.transaction("users", "readwrite");

  transaction.objectStore("users").put({
    ...user,
    totalXP,
    level: getLevelFromXP(totalXP),
    updatedAt: new Date().toISOString(),
  });
  await transactionToPromise(transaction);

  return { ...user, totalXP, level: getLevelFromXP(totalXP) };
}

function getCompletedPrayerCount(prayers, userId, date) {
  return prayers.filter((record) => record.userId === userId && record.date === date && record.status === "done").length;
}

function getFullPrayerDaysThisWeek(prayers, userId, weekDates) {
  return weekDates.filter((date) => {
    const completedPrayers = new Set(prayers.filter((record) => record.userId === userId && record.date === date && record.status === "done").map((record) => record.prayer));

    return PRAYERS.every((prayer) => completedPrayers.has(prayer));
  }).length;
}

function getTodayAyatCount(logs, userId, date) {
  return logs.filter((record) => record.userId === userId && record.date === date && (record.type === "tilawah" || record.type === "quran")).reduce((total, record) => total + (Number(record.ayatCount ?? record.amount) || 0), 0);
}

function hasLog(logs, userId, type, dates) {
  const dateSet = new Set(Array.isArray(dates) ? dates : [dates]);

  return logs.some((record) => record.userId === userId && record.type === type && dateSet.has(record.date));
}

async function applyQuestProgress(userId, templates, type, period, progressByKey) {
  const db = await initDB();
  const now = new Date().toISOString();
  const existingQuests = await getAllFromStore("quests");
  const user = await getUser(userId);
  let xpToAward = 0;

  const records = templates.map((template) => {
    const existingRecord = existingQuests.find((quest) => quest.userId === userId && quest.type === type && quest.period === period && quest.questKey === template.questKey);
    const progress = Math.min(template.target, Number(progressByKey[template.questKey]) || 0);
    const isCompleted = progress >= template.target;
    const previousXP = existingRecord?.xpEarned || 0;
    const shouldAwardXP = isCompleted && previousXP <= 0;

    if (shouldAwardXP) {
      xpToAward += template.xpReward;
    }

    return {
      ...(existingRecord || createQuestRecord(userId, type, period, template)),
      title: template.title,
      target: template.target,
      progress,
      xpReward: template.xpReward,
      xpEarned: previousXP || (shouldAwardXP ? template.xpReward : 0),
      isCompleted,
      completedAt: existingRecord?.completedAt || (isCompleted ? now : null),
      updatedAt: now,
    };
  });

  const transaction = db.transaction(["quests", "users"], "readwrite");
  const questStore = transaction.objectStore("quests");

  records.forEach((record) => questStore.put(record));

  if (xpToAward > 0) {
    const totalXP = (user.totalXP || 0) + xpToAward;

    transaction.objectStore("users").put({
      ...user,
      totalXP,
      level: getLevelFromXP(totalXP),
      updatedAt: now,
    });
  }

  await transactionToPromise(transaction);

  return records.map(toQuestView);
}

export async function refreshQuestData(userId) {
  const todayKey = getTodayKey();
  const weekKey = getWeekKey();
  const weekDates = getWeekDateKeys();
  const [prayers, logs] = await Promise.all([getAllFromStore("prayers"), getAllFromStore("ibadah_log")]);

  const dailyQuests = await applyQuestProgress(userId, DAILY_QUESTS, "daily", todayKey, {
    full_day_prayers: getCompletedPrayerCount(prayers, userId, todayKey),
    quran_10_ayat: getTodayAyatCount(logs, userId, todayKey),
    evening_dhikr: hasLog(logs, userId, "dzikir", todayKey) ? 1 : 0,
  });
  const weeklyQuests = await applyQuestProgress(userId, WEEKLY_QUESTS, "weekly", weekKey, {
    full_week_prayers: getFullPrayerDaysThisWeek(prayers, userId, weekDates),
    weekly_sedekah: hasLog(logs, userId, "sedekah", weekDates) ? 1 : 0,
    memorize_short_surah: hasLog(logs, userId, "memorize_short_surah", weekDates) ? 1 : 0,
  });

  return { dailyQuests, weeklyQuests };
}

export async function addQuranAyatLog(userId, amount, unit = "ayat") {
  const db = await initDB();
  const now = new Date();
  const numericAmount = Math.max(0, Number(amount) || 0);
  const ayatCount = numericAmount;
  const xpEarned = Math.floor(ayatCount / 10);
  const log = {
    id: `${userId}:tilawah:${now.toISOString()}`,
    userId,
    type: "tilawah",
    date: getTodayKey(now),
    amount: numericAmount,
    unit,
    ayatCount,
    xpEarned,
    createdAt: now.toISOString(),
  };
  const transaction = db.transaction("ibadah_log", "readwrite");

  transaction.objectStore("ibadah_log").put(log);
  await transactionToPromise(transaction);
  await updateUserXP(userId, xpEarned);

  return log;
}

export async function addSingleIbadahLog(userId, type) {
  const db = await initDB();
  const now = new Date();
  const date = getTodayKey(now);
  const existingLog = await requestToPromise(db.transaction("ibadah_log", "readonly").objectStore("ibadah_log").get(`${userId}:${type}:${date}`));

  if (existingLog) {
    return { created: false, log: existingLog };
  }

  const log = {
    id: `${userId}:${type}:${date}`,
    userId,
    type,
    date,
    amount: 1,
    unit: "completion",
    xpEarned: 0,
    createdAt: now.toISOString(),
  };
  const transaction = db.transaction("ibadah_log", "readwrite");

  transaction.objectStore("ibadah_log").put(log);
  await transactionToPromise(transaction);

  return { created: true, log };
}
