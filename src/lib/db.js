import { DEFAULT_USER_ID, SETTINGS_ID, createDefaultSettingsRecord, createDefaultUserRecord } from "./defaultData";
import { getTodayKey } from "./date";
import { requestToPromise as promisifyRequest, transactionToPromise as promisifyTransaction } from "./dbUtils";

const DB_NAME = "questdeen_db";
const DB_VERSION = 2;

let dbPromise;

function createStore(db, name, options = { keyPath: "id" }) {
  if (db.objectStoreNames.contains(name)) {
    return null;
  }

  return db.createObjectStore(name, options);
}

function setupSchema(db) {
  const users = createStore(db, "users");
  if (users) {
    users.createIndex("name", "name");
    users.createIndex("lastActiveDate", "lastActiveDate");
  }

  const prayers = createStore(db, "prayers");
  if (prayers) {
    prayers.createIndex("userId_date", ["userId", "date"]);
    prayers.createIndex("userId_prayer_date", ["userId", "prayer", "date"]);
    prayers.createIndex("status", "status");
    prayers.createIndex("userId_date_prayer_unique", ["userId", "date", "prayer"], {
      unique: true,
    });
  }

  const quests = createStore(db, "quests");
  if (quests) {
    quests.createIndex("userId_type_period", ["userId", "type", "period"]);
    quests.createIndex("userId_isCompleted", ["userId", "isCompleted"]);
    quests.createIndex("userId_questKey_period_unique", ["userId", "questKey", "period"], {
      unique: true,
    });
  }

  const achievements = createStore(db, "achievements");
  if (achievements) {
    achievements.createIndex("userId_badgeKey_unique", ["userId", "badgeKey"], {
      unique: true,
    });
  }

  const ibadahLog = createStore(db, "ibadah_log");
  if (ibadahLog) {
    ibadahLog.createIndex("userId_date", ["userId", "date"]);
    ibadahLog.createIndex("userId_type", ["userId", "type"]);
  }

  createStore(db, "settings");

  const prayerSchedules = createStore(db, "prayer_schedules");
  if (prayerSchedules) {
    prayerSchedules.createIndex("userId_date", ["userId", "date"], {
      unique: true,
    });
  }
}

export function initDB() {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB is not supported in this browser."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      setupSchema(request.result);
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

export async function getActiveUser() {
  const db = await initDB();
  const transaction = db.transaction(["settings", "users"], "readonly");
  const settings = await promisifyRequest(transaction.objectStore("settings").get(SETTINGS_ID));

  if (!settings?.activeUserId) {
    return null;
  }

  return promisifyRequest(transaction.objectStore("users").get(settings.activeUserId));
}

export async function getSettings() {
  const db = await initDB();
  const settings = await promisifyRequest(db.transaction("settings", "readonly").objectStore("settings").get(SETTINGS_ID));

  const defaultSettings = createDefaultSettingsRecord(settings?.activeUserId || DEFAULT_USER_ID);

  return {
    ...defaultSettings,
    ...(settings || {}),
    prayerSettings: {
      ...defaultSettings.prayerSettings,
      ...(settings?.prayerSettings || {}),
    },
  };
}

export async function updateSettings(updates) {
  const db = await initDB();
  const existingSettings = await getSettings();
  const settings = {
    ...existingSettings,
    ...updates,
    prayerSettings: {
      ...(existingSettings.prayerSettings || createDefaultSettingsRecord().prayerSettings),
      ...(updates.prayerSettings || {}),
    },
    updatedAt: new Date().toISOString(),
  };
  const transaction = db.transaction("settings", "readwrite");

  transaction.objectStore("settings").put(settings);
  await promisifyTransaction(transaction);

  return settings;
}

export async function updateActiveUser(updates) {
  const user = await getOrCreateActiveUser();
  const db = await initDB();
  const nextUser = {
    ...user,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  const transaction = db.transaction("users", "readwrite");

  transaction.objectStore("users").put(nextUser);
  await promisifyTransaction(transaction);

  return nextUser;
}

export async function createDefaultUser() {
  const db = await initDB();
  const now = new Date();
  const user = createDefaultUserRecord(now);
  const settings = createDefaultSettingsRecord(user.id);
  const transaction = db.transaction(["users", "settings"], "readwrite");

  transaction.objectStore("users").put(user);
  transaction.objectStore("settings").put(settings);

  await promisifyTransaction(transaction);

  return user;
}

export async function getOrCreateActiveUser() {
  const activeUser = await getActiveUser();

  if (activeUser) {
    return activeUser;
  }

  const db = await initDB();
  const existingDefaultUser = await promisifyRequest(db.transaction("users", "readonly").objectStore("users").get(DEFAULT_USER_ID));

  if (existingDefaultUser) {
    const transaction = db.transaction(["users", "settings"], "readwrite");
    const user = {
      ...existingDefaultUser,
      lastActiveDate: getTodayKey(),
      updatedAt: new Date().toISOString(),
    };

    transaction.objectStore("users").put(user);
    transaction.objectStore("settings").put(createDefaultSettingsRecord(user.id));
    await promisifyTransaction(transaction);

    return user;
  }

  return createDefaultUser();
}

export { DB_NAME, DB_VERSION };
