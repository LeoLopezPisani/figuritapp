import * as SQLite from "expo-sqlite";
import { COUNTRY_METADATA } from "../constants/countries";
import { supabase } from "./supabase";

export interface Sticker {
  id: string;
  number: string;
  count: number;
}
export interface Country {
  name: string;
  group: string;
  orderIndex: number;
  stickers: Sticker[];
}

let dbInstance: SQLite.SQLiteDatabase | null = null;

async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) dbInstance = await SQLite.openDatabaseAsync("figuritapp.db");
  return dbInstance;
}

export async function initializeDatabase(): Promise<void> {
  const db = await getDB();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS stickers (
      user_id TEXT NOT NULL,
      sticker_id TEXT NOT NULL,
      country_code TEXT NOT NULL,
      number TEXT NOT NULL,
      count INTEGER DEFAULT 0,
      PRIMARY KEY (user_id, sticker_id)
    );
  `);
}

async function syncToCloud(userId: string, stickerId: string, count: number) {
  try {
    const { error } = await supabase
      .from("stickers")
      .upsert({ user_id: userId, sticker_id: stickerId, count: count });

    if (error)
      console.error("[Sync] Error uploading to Supabase:", error.message);
  } catch (err) {
    console.error("[Sync] Network error:", err);
  }
}

export async function seedUserAlbum(userId: string): Promise<void> {
  const db = await getDB();

  await db.withTransactionAsync(async () => {
    for (const [code, meta] of Object.entries(COUNTRY_METADATA)) {
      let seedQuery =
        "INSERT INTO stickers (user_id, sticker_id, country_code, number, count) VALUES ";
      const queryValues: any[] = [];

      if (meta.specialStickers) {
        meta.specialStickers.forEach((spId) => {
          seedQuery += `(?, ?, ?, ?, 0),`;
          queryValues.push(userId, spId, code, spId.split("_")[1]);
        });
      }
      for (let i = 1; i <= meta.total; i++) {
        seedQuery += `(?, ?, ?, ?, 0),`;
        queryValues.push(userId, `${code}_${i}`, code, i.toString());
      }

      seedQuery = seedQuery.slice(0, -1) + ";";

      // FIX CRÍTICO: Usamos ...queryValues para desenrollar el array en argumentos sueltos
      await db.runAsync(seedQuery, ...queryValues);
    }
  });
  console.log(`[SQLite] Seed transaccional completado para: ${userId}`);
}

export async function pullCloudData(userId: string): Promise<void> {
  const db = await getDB();
  const { data, error } = await supabase
    .from("stickers")
    .select("sticker_id, count")
    .eq("user_id", userId);

  if (error || !data) return;

  await db.withTransactionAsync(async () => {
    for (const item of data) {
      // FIX: Parámetros pasados sueltos, sin array
      await db.runAsync(
        "UPDATE stickers SET count = ? WHERE user_id = ? AND sticker_id = ?",
        item.count,
        userId,
        item.sticker_id,
      );
    }
  });
  console.log(
    `[SQLite] Sincronización desde la nube completada para: ${userId}`,
  );
}

export async function getAlbumData(
  userId: string,
): Promise<Record<string, Country>> {
  const db = await getDB();

  // FIX: userId pasado directamente, sin corchetes
  const rows: any[] = await db.getAllAsync(
    "SELECT sticker_id as id, country_code, number, count FROM stickers WHERE user_id = ?;",
    userId,
  );

  const structuredData: Record<string, Country> = {};
  Object.entries(COUNTRY_METADATA).forEach(([code, meta]) => {
    structuredData[code] = {
      name: meta.name,
      group: meta.group,
      orderIndex: meta.orderIndex,
      stickers: [],
    };
  });

  rows.forEach((row) => {
    if (structuredData[row.country_code]) {
      structuredData[row.country_code].stickers.push({
        id: row.id,
        number: row.number,
        count: row.count,
      });
    }
  });
  return structuredData;
}

export async function incrementSticker(
  userId: string,
  stickerId: string,
): Promise<void> {
  const db = await getDB();

  // FIX: Parámetros sin array
  await db.runAsync(
    "UPDATE stickers SET count = count + 1 WHERE user_id = ? AND sticker_id = ?;",
    userId,
    stickerId,
  );
  const row: any = await db.getFirstAsync(
    "SELECT count FROM stickers WHERE user_id = ? AND sticker_id = ?",
    userId,
    stickerId,
  );

  if (row) syncToCloud(userId, stickerId, row.count);
}

export async function decrementSticker(
  userId: string,
  stickerId: string,
): Promise<void> {
  const db = await getDB();

  // FIX: Parámetros sin array
  await db.runAsync(
    "UPDATE stickers SET count = CASE WHEN count > 0 THEN count - 1 ELSE 0 END WHERE user_id = ? AND sticker_id = ?;",
    userId,
    stickerId,
  );
  const row: any = await db.getFirstAsync(
    "SELECT count FROM stickers WHERE user_id = ? AND sticker_id = ?",
    userId,
    stickerId,
  );

  if (row) syncToCloud(userId, stickerId, row.count);
}

export async function incrementMultipleStickers(
  userId: string,
  stickerIds: string[],
): Promise<void> {
  const db = await getDB();
  for (const id of stickerIds) {
    // FIX: Parámetros sin array
    await db.runAsync(
      "UPDATE stickers SET count = count + 1 WHERE user_id = ? AND sticker_id = ?;",
      userId,
      id,
    );
    const row: any = await db.getFirstAsync(
      "SELECT count FROM stickers WHERE user_id = ? AND sticker_id = ?",
      userId,
      id,
    );
    if (row) syncToCloud(userId, id, row.count);
  }
}

export interface ScanResult {
  id: string;
  isNew: boolean;
}

export async function checkScannedStickers(
  userId: string,
  stickerIds: string[],
): Promise<ScanResult[]> {
  const db = await getDB();

  const placeholders = stickerIds.map(() => "?").join(",");

  const query = `SELECT sticker_id, count FROM stickers WHERE user_id = ? AND sticker_id IN (${placeholders});`;

  const rows: any[] = await db.getAllAsync(query, userId, ...stickerIds);

  // mapa en memoria [id -> count] para cruzar los datos rápido
  const currentCounts = new Map<string, number>(
    rows.map((r) => [r.sticker_id, r.count]),
  );

  // Mapeo el array original para devolver el veredicto
  return stickerIds.map((id) => {
    const currentCount = currentCounts.get(id) || 0;
    return {
      id,
      isNew: currentCount === 0,
    };
  });
}
