const openDb = require("../db/connection");

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

    const rows = await db.all(
      `SELECT * FROM logs 
       WHERE user_id = ? 
       ORDER BY date_key DESC, created_at DESC`,
      [req.user.id]
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

    //basic validation 
    if (!dateKey || !typeKey || !name || !values) {
      return res.status(400).json({
        error: "dateKey, typeKey, name, and values are required",
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

    const existing = await db.get(
      "SELECT * FROM logs WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );

    if (!existing) {
      return res.status(404).json({ error: "Log not found" });
    }

    const now = new Date().toISOString();

    await db.run(
      `UPDATE logs
       SET date_key = ?,
           type_key = ?,
           name = ?,
           values_json = ?,
           updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [
        dateKey,
        typeKey,
        name,
        JSON.stringify(values),
        now,
        req.params.id,
        req.user.id,
      ]
    );

    const row = await db.get(
      "SELECT * FROM logs WHERE id = ?",
      [req.params.id]
    );

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
