import { SETTINGS_ID, createDefaultSettingsRecord, createDefaultUserRecord } from "./defaultData";
import { initDB, DB_NAME } from "./db";
import { requestToPromise, transactionToPromise } from "./dbUtils";

const BACKUP_STORES = ["users", "prayers", "quests", "achievements", "ibadah_log", "settings", "prayer_schedules", "activities"];

async function getExistingStores(db) {
  return BACKUP_STORES.filter((store) => db.objectStoreNames.contains(store));
}

export async function exportBackupData() {
  const db = await initDB();
  const stores = await getExistingStores(db);
  const data = {};

  await Promise.all(
    stores.map(async (store) => {
      data[store] = await requestToPromise(db.transaction(store, "readonly").objectStore(store).getAll());
    }),
  );

  return {
    app: "QuestDeen",
    database: DB_NAME,
    exportedAt: new Date().toISOString(),
    version: 1,
    data,
  };
}

export function downloadBackup(backup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const dateKey = new Date().toISOString().slice(0, 10);

  anchor.href = url;
  anchor.download = `questdeen-backup-${dateKey}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function validateBackup(backup) {
  return backup && backup.app === "QuestDeen" && backup.data && Array.isArray(backup.data.users) && Array.isArray(backup.data.settings);
}

export async function importBackupData(backup) {
  if (!validateBackup(backup)) {
    throw new Error("Invalid QuestDeen backup file.");
  }

  const db = await initDB();
  const stores = await getExistingStores(db);
  const transaction = db.transaction(stores, "readwrite");

  stores.forEach((store) => {
    const objectStore = transaction.objectStore(store);
    objectStore.clear();
    (backup.data[store] || []).forEach((record) => objectStore.put(record));
  });

  await transactionToPromise(transaction);
}

export async function resetLocalData() {
  const db = await initDB();
  const stores = await getExistingStores(db);
  const transaction = db.transaction(stores, "readwrite");

  stores.forEach((store) => transaction.objectStore(store).clear());

  const user = createDefaultUserRecord();
  transaction.objectStore("users").put(user);
  transaction.objectStore("settings").put({
    ...createDefaultSettingsRecord(user.id),
    id: SETTINGS_ID,
  });

  await transactionToPromise(transaction);
}
