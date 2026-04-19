function normaliseNumber(value, fallback = null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseValues(row) {
  try {
    return JSON.parse(row.values_json || "{}");
  } catch {
    return {};
  }
}

async function getLatestWeightLog(db, userId) {
  return db.get(
    `SELECT * FROM logs
     WHERE user_id = ? AND type_key = 'weight'
     ORDER BY date_key DESC, updated_at DESC, created_at DESC, id DESC
     LIMIT 1`,
    [userId]
  );
}

async function getLatestLoggedWeightKg(db, userId) {
  const row = await getLatestWeightLog(db, userId);

  if (!row) {
    return null;
  }

  return normaliseNumber(parseValues(row).weight, null);
}

async function syncProfileWeightFromLatestLog(db, userId) {
  const latestWeightKg = await getLatestLoggedWeightKg(db, userId);

  await db.run(
    `UPDATE profiles
     SET weight_kg = ?, updated_at = ?
     WHERE user_id = ?`,
    [latestWeightKg, new Date().toISOString(), userId]
  );

  return latestWeightKg;
}

module.exports = {
  getLatestWeightLog,
  getLatestLoggedWeightKg,
  syncProfileWeightFromLatestLog,
};
