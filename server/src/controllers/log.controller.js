const openDb = require("../db/connection");
const { syncProfileWeightFromLatestLog } = require("../services/weight.service");

const ALLOWED_LOG_TYPES = new Set([
  "workout",
  "cardio",
  "nutrition",
  "caloriesBurned",
  "sleep",
  "steps",
  "weight",
]);

const EXPECTED_UNITS = {
  workout: { weight: "kg" },
  cardio: { duration: "min", distance: "km", calories: "kcal" },
  nutrition: { calories: "kcal", protein: "g", carbs: "g" },
  caloriesBurned: { calories: "kcal", duration: "min" },
  sleep: { hours: "h" },
  steps: { distance: "km", activeMinutes: "min" },
  weight: { weight: "kg" },
};

function validateLogPayload({ dateKey, typeKey, name, values }, { partial = false } = {}) {
  if (!partial && (!dateKey || !typeKey || !name || !values)) {
    return "dateKey, typeKey, name, and values are required";
  }

  if (dateKey && !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return "dateKey must use YYYY-MM-DD format";
  }

  if (typeKey && !ALLOWED_LOG_TYPES.has(typeKey)) {
    return "typeKey is not supported";
  }

  if (values != null && (typeof values !== "object" || Array.isArray(values))) {
    return "values must be an object";
  }

  if (typeKey === "sleep" && values) {
    const bedtime = String(values.bedtime || "").trim();
    const wakeTime = String(values.wakeTime || "").trim();
    const hours = values.hours;
    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (!partial || bedtime || wakeTime || hours != null) {
      if (!bedtime || !wakeTime) {
        return "sleep logs require bedtime and wakeTime";
      }

      if (!timePattern.test(bedtime) || !timePattern.test(wakeTime)) {
        return "sleep times must use 24h format like 23:00";
      }
    }
  }

  if (typeKey === "weight" && values) {
    const weight = Number(values.weight);

    if (!Number.isFinite(weight) || weight <= 0) {
      return "weight logs require a positive weight value";
    }
  }

  const units = EXPECTED_UNITS[typeKey] || {};
  const invalidUnitField = Object.entries(values || {}).find(([field, value]) => {
    if (!units[field] || value == null || value === "") {
      return false;
    }

    const stringValue = String(value).toLowerCase();
    return /[a-z]/i.test(stringValue) && !stringValue.includes(units[field].toLowerCase());
  });

  if (invalidUnitField) {
    return `${invalidUnitField[0]} should use ${units[invalidUnitField[0]]}`;
  }

  return null;
}

//helper: convert DB row to frontend-friendly object
function parseLog(row) {
  return {
    id: row.id,
    userId: row.user_id,
    dateKey: row.date_key,
    typeKey: row.type_key,
    name: row.name,
    values: JSON.parse(row.values_json || "{}"),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

//get logs
const getLogs = async (req, res) => {
  try {
    const db = await openDb();

    const filters = ["user_id = ?"];
    const values = [req.user.id];

    if (req.query.date) {
      filters.push("date_key = ?");
      values.push(req.query.date);
    }

    if (req.query.month) {
      filters.push("date_key LIKE ?");
      values.push(`${req.query.month}%`);
    }

    if (req.query.type) {
      filters.push("type_key = ?");
      values.push(req.query.type);
    }

    const rows = await db.all(
      `SELECT * FROM logs
       WHERE ${filters.join(" AND ")}
       ORDER BY date_key DESC, created_at DESC`,
      values
    );

    res.json(rows.map(parseLog));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//create log
const createLog = async (req, res) => {
  try {
    const db = await openDb();

    const { dateKey, typeKey, name, values } = req.body;

    const validationError = validateLogPayload({ dateKey, typeKey, name, values });

    if (validationError) {
      return res.status(400).json({
        error: validationError,
      });
    }

    const now = new Date().toISOString();

    const result = await db.run(
      `INSERT INTO logs 
       (user_id, date_key, type_key, name, values_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        dateKey,
        typeKey,
        name,
        JSON.stringify(values),
        now,
        now,
      ]
    );

    const row = await db.get(
      "SELECT * FROM logs WHERE id = ?",
      [result.lastID]
    );

    if (typeKey === "weight") {
      await syncProfileWeightFromLatestLog(db, req.user.id);
    }

    res.status(201).json(parseLog(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//update log
const updateLog = async (req, res) => {
  try {
    const db = await openDb();

    const { dateKey, typeKey, name, values } = req.body;

    const validationError = validateLogPayload(
      { dateKey, typeKey, name, values },
      { partial: true }
    );

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const existing = await db.get(
      "SELECT * FROM logs WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );

    if (!existing) {
      return res.status(404).json({ error: "Log not found" });
    }

    const now = new Date().toISOString();

    const nextDateKey = dateKey ?? existing.date_key;
    const nextTypeKey = typeKey ?? existing.type_key;
    const nextName = name ?? existing.name;
    const nextValues = values ?? JSON.parse(existing.values_json || "{}");

    await db.run(
      `UPDATE logs
       SET date_key = ?,
           type_key = ?,
           name = ?,
           values_json = ?,
           updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [
        nextDateKey,
        nextTypeKey,
        nextName,
        JSON.stringify(nextValues),
        now,
        req.params.id,
        req.user.id,
      ]
    );

    const row = await db.get(
      "SELECT * FROM logs WHERE id = ?",
      [req.params.id]
    );

    if (existing.type_key === "weight" || nextTypeKey === "weight") {
      await syncProfileWeightFromLatestLog(db, req.user.id);
    }

    res.json(parseLog(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//delete log
const deleteLog = async (req, res) => {
  try {
    const db = await openDb();

    const existing = await db.get(
      "SELECT * FROM logs WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );

    if (!existing) {
      return res.status(404).json({ error: "Log not found" });
    }

    await db.run(
      "DELETE FROM logs WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );

    if (existing.type_key === "weight") {
      await syncProfileWeightFromLatestLog(db, req.user.id);
    }

    res.json({ message: "Log deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getLogs,
  createLog,
  updateLog,
  deleteLog,
};
