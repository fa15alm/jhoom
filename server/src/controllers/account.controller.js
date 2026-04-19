const bcrypt = require("bcrypt");
const openDb = require("../db/connection");

const exportAccountData = async (req, res) => {
  try {
    const db = await openDb();
    const user = await db.get(
      "SELECT id, email, email_verified_at, created_at, updated_at FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: "Account not found." });
    }

    const [
      profile,
      healthPlan,
      logs,
      goals,
      streak,
      posts,
      comments,
      connections,
    ] = await Promise.all([
      db.get("SELECT * FROM profiles WHERE user_id = ?", [req.user.id]),
      db.get("SELECT * FROM health_plans WHERE user_id = ?", [req.user.id]),
      db.all("SELECT * FROM logs WHERE user_id = ? ORDER BY date_key DESC", [req.user.id]),
      db.all("SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC", [req.user.id]),
      db.get("SELECT * FROM streaks WHERE user_id = ?", [req.user.id]),
      db.all("SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC", [req.user.id]),
      db.all("SELECT * FROM comments WHERE user_id = ? ORDER BY created_at DESC", [req.user.id]),
      db.all(
        "SELECT * FROM connections WHERE requester_id = ? OR receiver_id = ? ORDER BY updated_at DESC",
        [req.user.id, req.user.id]
      ),
    ]);

    res.json({
      exportedAt: new Date().toISOString(),
      user,
      profile,
      healthPlan: healthPlan
        ? {
            ...healthPlan,
            answers_json: JSON.parse(healthPlan.answers_json || "{}"),
            plan_json: JSON.parse(healthPlan.plan_json || "{}"),
          }
        : null,
      logs: logs.map((log) => ({
        ...log,
        values_json: JSON.parse(log.values_json || "{}"),
      })),
      goals,
      streak,
      posts,
      comments,
      connections,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const db = await openDb();
    const user = await db.get("SELECT * FROM users WHERE id = ?", [req.user.id]);

    if (!user) {
      return res.status(404).json({ error: "Account not found." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(400).json({ error: "Password is incorrect." });
    }

    await db.exec("BEGIN TRANSACTION");

    try {
      await db.run("DELETE FROM reports WHERE reporter_id = ? OR reported_user_id = ?", [req.user.id, req.user.id]);
      await db.run("DELETE FROM user_blocks WHERE blocker_id = ? OR blocked_id = ?", [req.user.id, req.user.id]);
      await db.run("DELETE FROM password_reset_tokens WHERE user_id = ?", [req.user.id]);
      await db.run("DELETE FROM email_verification_tokens WHERE user_id = ?", [req.user.id]);
      await db.run("DELETE FROM post_likes WHERE user_id = ?", [req.user.id]);
      await db.run("DELETE FROM comments WHERE user_id = ?", [req.user.id]);
      await db.run("DELETE FROM posts WHERE user_id = ?", [req.user.id]);
      await db.run("DELETE FROM connections WHERE requester_id = ? OR receiver_id = ?", [req.user.id, req.user.id]);
      await db.run("DELETE FROM goals WHERE user_id = ?", [req.user.id]);
      await db.run("DELETE FROM logs WHERE user_id = ?", [req.user.id]);
      await db.run("DELETE FROM streaks WHERE user_id = ?", [req.user.id]);
      await db.run("DELETE FROM health_plans WHERE user_id = ?", [req.user.id]);
      await db.run("DELETE FROM profiles WHERE user_id = ?", [req.user.id]);
      await db.run("DELETE FROM users WHERE id = ?", [req.user.id]);
      await db.exec("COMMIT");
    } catch (error) {
      await db.exec("ROLLBACK");
      throw error;
    }

    res.json({ message: "Account deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  exportAccountData,
  deleteAccount,
};
