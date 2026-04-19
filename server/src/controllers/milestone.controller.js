const openDb = require("../db/connection");
const { getLatestLoggedWeightKg } = require("../services/weight.service");

const GOAL_TYPES = new Set([
  "weight",
  "steps",
  "sleep",
  "workouts",
  "calories",
  "custom",
]);

function normaliseNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseJson(value, fallback = null) {
  try {
    return JSON.parse(value || "");
  } catch {
    return fallback;
  }
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentWeekRange() {
  const start = new Date();
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - daysSinceMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    startDateKey: formatDateKey(start),
    endDateKey: formatDateKey(end),
  };
}

function parseLogValues(row) {
  return parseJson(row.values_json, {}) || {};
}

function parseTimeToMinutes(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(value || "").trim());

  if (!match) {
    return null;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

function calculateSleepHours(values) {
  const explicitHours = normaliseNumber(values.hours, 0);

  if (explicitHours > 0) {
    return explicitHours;
  }

  const bedtimeMinutes = parseTimeToMinutes(values.bedtime);
  const wakeTimeMinutes = parseTimeToMinutes(values.wakeTime);

  if (bedtimeMinutes == null || wakeTimeMinutes == null) {
    return 0;
  }

  let durationMinutes = wakeTimeMinutes - bedtimeMinutes;

  if (durationMinutes <= 0) {
    durationMinutes += 24 * 60;
  }

  return Number((durationMinutes / 60).toFixed(1));
}

function buildWeekMetrics(logs) {
  const dailyStepTotals = new Map();
  const dailySleepTotals = new Map();
  let workoutCount = 0;
  let caloriesBurnedTotal = 0;

  logs.forEach((row) => {
    const values = parseLogValues(row);

    if (row.type_key === "steps") {
      dailyStepTotals.set(
        row.date_key,
        (dailyStepTotals.get(row.date_key) || 0) + normaliseNumber(values.steps, 0)
      );
    }

    if (row.type_key === "sleep") {
      dailySleepTotals.set(
        row.date_key,
        (dailySleepTotals.get(row.date_key) || 0) + calculateSleepHours(values)
      );
    }

    if (["workout", "cardio"].includes(row.type_key)) {
      workoutCount += 1;
    }

    if (["caloriesBurned", "cardio", "workout"].includes(row.type_key)) {
      caloriesBurnedTotal += normaliseNumber(values.calories, 0);
    }
  });

  return {
    dailyStepTotals,
    dailySleepTotals,
    workoutCount,
    caloriesBurnedTotal,
  };
}

function formatCompactNumber(value) {
  const rounded = Number(value);
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
}

function buildWeightProgress(config, profileWeightKg, row) {
  const targetWeightKg = normaliseNumber(config.targetWeightKg, row.target_value);
  const startingWeightKg = normaliseNumber(config.startingWeightKg, profileWeightKg);
  const currentWeightKg = normaliseNumber(profileWeightKg, row.current_value);
  let progress = 0;
  let completed = false;

  if (targetWeightKg > 0 && startingWeightKg > 0 && currentWeightKg > 0) {
    if (targetWeightKg === startingWeightKg) {
      completed = currentWeightKg === targetWeightKg;
      progress = completed ? 1 : 0;
    } else if (targetWeightKg < startingWeightKg) {
      completed = currentWeightKg <= targetWeightKg;
      progress = (startingWeightKg - currentWeightKg) / (startingWeightKg - targetWeightKg);
    } else {
      completed = currentWeightKg >= targetWeightKg;
      progress = (currentWeightKg - startingWeightKg) / (targetWeightKg - startingWeightKg);
    }
  }

  return {
    targetValue: targetWeightKg,
    currentValue: currentWeightKg,
    unit: "kg",
    detail: `Reach ${formatCompactNumber(targetWeightKg)} kg`,
    progress: Math.max(0, Math.min(progress, 1)),
    progressLabel: currentWeightKg
      ? `${formatCompactNumber(currentWeightKg)} / ${formatCompactNumber(targetWeightKg)} kg`
      : "Set current weight in profile",
    completed,
  };
}

function buildAutoTrackedProgress(row, config, metrics, profile) {
  switch (row.goal_type) {
    case "weight":
      return buildWeightProgress(config, profile?.weight_kg, row);
    case "steps": {
      const dailyTarget = normaliseNumber(config.dailyTarget, 8000);
      const targetDays = normaliseNumber(config.targetDays, 4);
      const currentDays = Array.from(metrics.dailyStepTotals.values()).filter(
        (total) => total >= dailyTarget
      ).length;

      return {
        targetValue: targetDays,
        currentValue: currentDays,
        unit: "days",
        detail: `${Math.round(dailyTarget).toLocaleString("en-GB")} steps for ${targetDays} days`,
        progress: targetDays > 0 ? Math.min(currentDays / targetDays, 1) : 0,
        progressLabel: `${currentDays}/${targetDays}`,
        completed: currentDays >= targetDays,
      };
    }
    case "sleep": {
      const nightlyTargetHours = normaliseNumber(config.nightlyTargetHours, 7);
      const targetDays = normaliseNumber(config.targetDays, 5);
      const currentDays = Array.from(metrics.dailySleepTotals.values()).filter(
        (total) => total >= nightlyTargetHours
      ).length;

      return {
        targetValue: targetDays,
        currentValue: currentDays,
        unit: "nights",
        detail: `${formatCompactNumber(nightlyTargetHours)} h sleep for ${targetDays} nights`,
        progress: targetDays > 0 ? Math.min(currentDays / targetDays, 1) : 0,
        progressLabel: `${currentDays}/${targetDays}`,
        completed: currentDays >= targetDays,
      };
    }
    case "workouts": {
      const targetSessions = normaliseNumber(config.targetSessions, 4);
      const currentSessions = metrics.workoutCount;

      return {
        targetValue: targetSessions,
        currentValue: currentSessions,
        unit: "sessions",
        detail: `Complete ${targetSessions} workouts this week`,
        progress: targetSessions > 0 ? Math.min(currentSessions / targetSessions, 1) : 0,
        progressLabel: `${currentSessions}/${targetSessions}`,
        completed: currentSessions >= targetSessions,
      };
    }
    case "calories": {
      const targetCalories = normaliseNumber(config.targetCalories, 2000);
      const currentCalories = Math.round(metrics.caloriesBurnedTotal);

      return {
        targetValue: targetCalories,
        currentValue: currentCalories,
        unit: "kcal",
        detail: `Burn ${Math.round(targetCalories).toLocaleString("en-GB")} kcal this week`,
        progress: targetCalories > 0 ? Math.min(currentCalories / targetCalories, 1) : 0,
        progressLabel: `${currentCalories.toLocaleString("en-GB")}/${Math.round(targetCalories).toLocaleString("en-GB")} kcal`,
        completed: currentCalories >= targetCalories,
      };
    }
    default:
      return null;
  }
}

function parseMilestone(row, context = {}) {
  const goalType = GOAL_TYPES.has(row.goal_type) ? row.goal_type : "custom";
  const config = parseJson(row.goal_config_json, {}) || {};

  if (goalType !== "custom") {
    const autoTracked = buildAutoTrackedProgress(row, config, context.metrics || {}, context.profile || null);
    const completed = row.status === "completed" || autoTracked.completed;

    return {
      id: row.id,
      title: row.title,
      detail: autoTracked.detail,
      goalType,
      config,
      targetValue: autoTracked.targetValue,
      currentValue: autoTracked.currentValue,
      unit: autoTracked.unit,
      targetDate: row.deadline,
      status: completed ? "completed" : row.status,
      progress: autoTracked.progress,
      progressLabel: autoTracked.progressLabel,
      completed,
      isAutoTracked: true,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  const targetValue = normaliseNumber(row.target_value, 1);
  const currentValue = normaliseNumber(row.current_value, 0);
  const progress = targetValue > 0 ? Math.min(currentValue / targetValue, 1) : 0;
  const completed = row.status === "completed" || progress >= 1;

  return {
    id: row.id,
    title: row.title,
    detail: row.description || `${formatCompactNumber(targetValue)} ${row.unit || "target"}`,
    goalType: "custom",
    config,
    targetValue,
    currentValue,
    unit: row.unit,
    targetDate: row.deadline,
    status: row.status,
    progress,
    progressLabel: row.unit
      ? `${formatCompactNumber(Math.min(currentValue, targetValue))} / ${formatCompactNumber(targetValue)} ${row.unit}`
      : `${Math.round(progress * 100)}%`,
    completed,
    isAutoTracked: false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getMilestoneContext(db, userId) {
  const { startDateKey, endDateKey } = getCurrentWeekRange();
  const [profile, weekLogs] = await Promise.all([
    db.get("SELECT * FROM profiles WHERE user_id = ?", [userId]),
    db.all(
      `SELECT * FROM logs
       WHERE user_id = ? AND date_key >= ? AND date_key <= ?
       ORDER BY date_key DESC, created_at DESC`,
      [userId, startDateKey, endDateKey]
    ),
  ]);

  return {
    profile: profile
      ? {
          ...profile,
          weight_kg: (await getLatestLoggedWeightKg(db, userId)) ?? profile.weight_kg,
        }
      : profile,
    metrics: buildWeekMetrics(weekLogs),
  };
}

async function buildStoredGoalValues(db, userId, payload, existingRow = null) {
  const goalType = (payload.goalType || payload.goal_type || existingRow?.goal_type || "custom").toLowerCase();

  if (!GOAL_TYPES.has(goalType)) {
    throw new Error("goalType is not supported");
  }

  const title = (payload.title || existingRow?.title || "").trim();

  if (!title) {
    throw new Error("title is required");
  }

  if (goalType === "custom") {
    const nextCompleted =
      typeof payload.completed === "boolean"
        ? payload.completed
        : existingRow?.status === "completed";

    const targetValue = normaliseNumber(payload.targetValue, existingRow?.target_value || 1);
    const currentValue = normaliseNumber(
      payload.currentValue,
      existingRow?.current_value || (nextCompleted ? targetValue : 0)
    );
    const unit = (payload.unit || existingRow?.unit || "target").trim();

    return {
      title,
      description: (payload.detail || payload.description || existingRow?.description || "Custom target").trim(),
      goalType,
      targetValue,
      currentValue,
      unit,
      goalConfigJson: JSON.stringify({}),
      targetDate: payload.targetDate ?? payload.deadline ?? existingRow?.deadline ?? null,
      status: nextCompleted ? "completed" : "active",
    };
  }

  const profile = await db.get("SELECT * FROM profiles WHERE user_id = ?", [userId]);
  const effectiveWeightKg = (await getLatestLoggedWeightKg(db, userId)) ?? profile?.weight_kg;
  const existingConfig = parseJson(existingRow?.goal_config_json, {}) || {};
  let config = {};
  let targetValue = existingRow?.target_value || 0;
  let unit = existingRow?.unit || "";

  if (goalType === "weight") {
    const targetWeightKg = normaliseNumber(payload.targetWeightKg, existingConfig.targetWeightKg);

    if (!targetWeightKg) {
      throw new Error("targetWeightKg is required");
    }

    const startingWeightKg = normaliseNumber(
      existingConfig.startingWeightKg,
      effectiveWeightKg
    );

    if (!startingWeightKg) {
      throw new Error("Log your current weight or set it in profile before creating a weight goal");
    }

    config = { targetWeightKg, startingWeightKg };
    targetValue = targetWeightKg;
    unit = "kg";
  }

  if (goalType === "steps") {
    const dailyTarget = normaliseNumber(payload.dailyTarget, existingConfig.dailyTarget || 8000);
    const targetDays = normaliseNumber(payload.targetDays, existingConfig.targetDays || 4);

    if (!dailyTarget || !targetDays) {
      throw new Error("dailyTarget and targetDays are required");
    }

    config = { dailyTarget, targetDays };
    targetValue = targetDays;
    unit = "days";
  }

  if (goalType === "sleep") {
    const nightlyTargetHours = normaliseNumber(
      payload.nightlyTargetHours,
      existingConfig.nightlyTargetHours || 7
    );
    const targetDays = normaliseNumber(payload.targetDays, existingConfig.targetDays || 5);

    if (!nightlyTargetHours || !targetDays) {
      throw new Error("nightlyTargetHours and targetDays are required");
    }

    config = { nightlyTargetHours, targetDays };
    targetValue = targetDays;
    unit = "nights";
  }

  if (goalType === "workouts") {
    const targetSessions = normaliseNumber(
      payload.targetSessions,
      existingConfig.targetSessions || 4
    );

    if (!targetSessions) {
      throw new Error("targetSessions is required");
    }

    config = { targetSessions };
    targetValue = targetSessions;
    unit = "sessions";
  }

  if (goalType === "calories") {
    const targetCalories = normaliseNumber(
      payload.targetCalories,
      existingConfig.targetCalories || 2000
    );

    if (!targetCalories) {
      throw new Error("targetCalories is required");
    }

    config = { targetCalories };
    targetValue = targetCalories;
    unit = "kcal";
  }

  return {
    title,
    description: payload.detail || payload.description || existingRow?.description || "",
    goalType,
    targetValue,
    currentValue: existingRow?.current_value || 0,
    unit,
    goalConfigJson: JSON.stringify(config),
    targetDate: payload.targetDate ?? payload.deadline ?? existingRow?.deadline ?? null,
    status: existingRow?.status === "completed" ? "completed" : "active",
  };
}

const getMilestones = async (req, res) => {
  try {
    const db = await openDb();
    const [rows, context] = await Promise.all([
      db.all(
        `SELECT * FROM goals
         WHERE user_id = ?
         ORDER BY updated_at DESC, created_at DESC`,
        [req.user.id]
      ),
      getMilestoneContext(db, req.user.id),
    ]);

    res.json(rows.map((row) => parseMilestone(row, context)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createMilestone = async (req, res) => {
  try {
    const db = await openDb();
    const now = new Date().toISOString();
    const storedGoal = await buildStoredGoalValues(db, req.user.id, req.body);

    const result = await db.run(
      `INSERT INTO goals
       (user_id, title, description, goal_type, target_value, current_value, unit, goal_config_json, deadline, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        storedGoal.title,
        storedGoal.description,
        storedGoal.goalType,
        storedGoal.targetValue,
        storedGoal.currentValue,
        storedGoal.unit,
        storedGoal.goalConfigJson,
        storedGoal.targetDate,
        storedGoal.status,
        now,
        now,
      ]
    );

    const row = await db.get("SELECT * FROM goals WHERE id = ?", [result.lastID]);
    const context = await getMilestoneContext(db, req.user.id);
    res.status(201).json(parseMilestone(row, context));
  } catch (err) {
    const statusCode = /required|supported|before creating/i.test(err.message) ? 400 : 500;
    res.status(statusCode).json({ error: err.message });
  }
};

const updateMilestone = async (req, res) => {
  try {
    const db = await openDb();
    const existing = await db.get(
      "SELECT * FROM goals WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );

    if (!existing) {
      return res.status(404).json({ error: "Milestone not found" });
    }

    const storedGoal = await buildStoredGoalValues(db, req.user.id, req.body, existing);
    const nextStatus =
      storedGoal.goalType === "custom"
        ? storedGoal.status
        : "active";

    await db.run(
      `UPDATE goals
       SET title = ?,
           description = ?,
           goal_type = ?,
           target_value = ?,
           current_value = ?,
           unit = ?,
           goal_config_json = ?,
           deadline = ?,
           status = ?,
           updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [
        storedGoal.title,
        storedGoal.description,
        storedGoal.goalType,
        storedGoal.targetValue,
        storedGoal.currentValue,
        storedGoal.unit,
        storedGoal.goalConfigJson,
        storedGoal.targetDate,
        nextStatus,
        new Date().toISOString(),
        req.params.id,
        req.user.id,
      ]
    );

    const row = await db.get("SELECT * FROM goals WHERE id = ?", [req.params.id]);
    const context = await getMilestoneContext(db, req.user.id);
    res.json(parseMilestone(row, context));
  } catch (err) {
    const statusCode = /required|supported|before creating/i.test(err.message) ? 400 : 500;
    res.status(statusCode).json({ error: err.message });
  }
};

const deleteMilestone = async (req, res) => {
  try {
    const db = await openDb();
    const result = await db.run(
      "DELETE FROM goals WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Milestone not found" });
    }

    res.json({ message: "Milestone deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
};
