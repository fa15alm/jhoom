const openDb = require("../db/connection");

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatShortDate(dateKey) {
  return parseDateKey(dateKey).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function getWeekStart(date = new Date()) {
  const weekStart = new Date(date);
  const daysSinceMonday = (weekStart.getDay() + 6) % 7;
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - daysSinceMonday);
  return weekStart;
}

function getWeekDates() {
  const weekStart = getWeekStart();

  return WEEK_DAYS.map((day, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return {
      day,
      dateKey: formatDateKey(date),
    };
  });
}

function toNumber(value) {
  if (value == null || value === "") {
    return 0;
  }

  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseJson(value, fallback = {}) {
  try {
    return JSON.parse(value || "");
  } catch {
    return fallback;
  }
}

function parseValues(row) {
  return parseJson(row.values_json, {});
}

function parseTimeToMinutes(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(value || "").trim());

  if (!match) {
    return null;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

function calculateSleepHours(values) {
  const explicitHours = toNumber(values.hours);

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

function sumByDay(logs, dateKey, predicate, valueGetter) {
  return logs
    .filter((log) => log.date_key === dateKey && predicate(log))
    .reduce((total, log) => total + valueGetter(parseValues(log), log), 0);
}

function getCurrentStreak(dateKeys) {
  const uniqueKeys = new Set(dateKeys);
  const cursor = new Date();

  if (!uniqueKeys.has(formatDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;

  while (uniqueKeys.has(formatDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getTomorrowWorkout(plan) {
  const trainingSection = plan?.sections?.find((section) =>
    String(section.title || "").toLowerCase().includes("training")
  );

  return {
    workout: plan?.title || "Plan a session",
    focus: trainingSection?.body || "Log a workout, walk, meal, or sleep entry.",
  };
}

function getRecentWeightSeries(logs, limit = 7) {
  const series = [];
  const seenDateKeys = new Set();

  for (const row of logs) {
    if (seenDateKeys.has(row.date_key)) {
      continue;
    }

    const weight = toNumber(parseValues(row).weight);

    if (weight <= 0) {
      continue;
    }

    seenDateKeys.add(row.date_key);
    series.push({
      dateKey: row.date_key,
      label: formatShortDate(row.date_key),
      value: Number(weight.toFixed(1)),
    });

    if (series.length >= limit) {
      break;
    }
  }

  return series.reverse();
}

function formatWeightValue(value) {
  if (!Number.isFinite(value)) {
    return null;
  }

  return `${value.toFixed(1)} kg`;
}

function buildDashboardTargets(goalRows) {
  const latestActiveGoalByType = new Map();

  goalRows.forEach((row) => {
    if (!row.goal_type || latestActiveGoalByType.has(row.goal_type)) {
      return;
    }

    latestActiveGoalByType.set(row.goal_type, row);
  });

  const stepsGoal = latestActiveGoalByType.get("steps");
  const caloriesGoal = latestActiveGoalByType.get("calories");
  const stepsConfig = parseJson(stepsGoal?.goal_config_json, {});
  const caloriesConfig = parseJson(caloriesGoal?.goal_config_json, {});
  const dailyStepTarget = toNumber(stepsConfig.dailyTarget);
  const weeklyCaloriesTarget = toNumber(caloriesConfig.targetCalories);

  return {
    weeklyStepsTarget: dailyStepTarget > 0
      ? {
          label: "Milestone target",
          displayValue: `${Math.round(dailyStepTarget).toLocaleString("en-GB")} steps`,
          lineValue: dailyStepTarget,
        }
      : null,
    weeklyCaloriesTarget: weeklyCaloriesTarget > 0
      ? {
          label: "Milestone target",
          displayValue: `${Math.round(weeklyCaloriesTarget).toLocaleString("en-GB")} kcal this week`,
          lineValue: null,
        }
      : null,
  };
}

const getDashboardSummary = async (req, res) => {
  try {
    const db = await openDb();
    const today = new Date();
    const monthKey = formatDateKey(today).slice(0, 7);
    const weekDates = getWeekDates();
    const weekStartKey = weekDates[0].dateKey;
    const weekEndKey = weekDates[6].dateKey;

    const [weekLogs, monthLogs, allLogDates, healthPlanRow, profileRow, recentWeightLogs, goalRows] = await Promise.all([
      db.all(
        `SELECT * FROM logs
         WHERE user_id = ? AND date_key >= ? AND date_key <= ?
         ORDER BY date_key ASC`,
        [req.user.id, weekStartKey, weekEndKey]
      ),
      db.all(
        `SELECT * FROM logs
         WHERE user_id = ? AND date_key LIKE ?
         ORDER BY date_key ASC`,
        [req.user.id, `${monthKey}%`]
      ),
      db.all(
        "SELECT DISTINCT date_key FROM logs WHERE user_id = ? ORDER BY date_key DESC",
        [req.user.id]
      ),
      db.get("SELECT * FROM health_plans WHERE user_id = ?", [req.user.id]),
      db.get("SELECT weight_kg FROM profiles WHERE user_id = ?", [req.user.id]),
      db.all(
        `SELECT * FROM logs
         WHERE user_id = ? AND type_key = 'weight'
         ORDER BY date_key DESC, updated_at DESC, created_at DESC, id DESC`,
        [req.user.id]
      ),
      db.all(
        `SELECT * FROM goals
         WHERE user_id = ? AND status = 'active'
         ORDER BY updated_at DESC, created_at DESC`,
        [req.user.id]
      ),
    ]);

    const plan = healthPlanRow ? JSON.parse(healthPlanRow.plan_json || "{}") : null;
    const todayKey = formatDateKey(today);
    const tomorrow = getTomorrowWorkout(plan);
    const dashboardTargets = buildDashboardTargets(goalRows);

    const weeklyCaloriesBurned = weekDates.map(({ day, dateKey }) => ({
      day,
      value: Math.round(sumByDay(
        weekLogs,
        dateKey,
        (log) => ["caloriesBurned", "cardio", "workout"].includes(log.type_key),
        (values) => toNumber(values.calories)
      )),
    }));

    const weeklyStepsCompleted = weekDates.map(({ day, dateKey }) => ({
      day,
      value: Math.round(sumByDay(
        weekLogs,
        dateKey,
        (log) => log.type_key === "steps",
        (values) => toNumber(values.steps)
      )),
    }));

    const weeklySleepTime = weekDates.map(({ day, dateKey }) => {
      const sleepLogs = weekLogs.filter((log) => log.date_key === dateKey && log.type_key === "sleep");
      const total = sleepLogs.reduce((sum, log) => sum + calculateSleepHours(parseValues(log)), 0);

      return {
        day,
        value: sleepLogs.length > 0 ? Number(total.toFixed(1)) : 0,
      };
    });

    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const monthlyWorkoutsCompleted = Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const dateKey = `${monthKey}-${String(day).padStart(2, "0")}`;
      const hasWorkout = monthLogs.some((log) =>
        log.date_key === dateKey && ["workout", "cardio"].includes(log.type_key)
      );

      return {
        day: String(day),
        value: hasWorkout ? 1 : 0,
      };
    });

    const todayCalories = weeklyCaloriesBurned.find((entry) => entry.day === WEEK_DAYS[(today.getDay() + 6) % 7])?.value || 0;
    const todayCaloriesEaten = Math.round(sumByDay(
      weekLogs,
      todayKey,
      (log) => log.type_key === "nutrition",
      (values) => toNumber(values.calories)
    ));
    const todaySteps = weeklyStepsCompleted.find((entry) => entry.day === WEEK_DAYS[(today.getDay() + 6) % 7])?.value || 0;
    const todaySleep = weeklySleepTime.find((entry) => entry.day === WEEK_DAYS[(today.getDay() + 6) % 7])?.value || 0;
    const workoutsThisWeek = weekLogs.filter((log) => ["workout", "cardio"].includes(log.type_key)).length;
    const weightProgressSeries = getRecentWeightSeries(recentWeightLogs);
    const latestLoggedWeightKg = weightProgressSeries[weightProgressSeries.length - 1]?.value ?? null;
    const profileWeightKg = toNumber(profileRow?.weight_kg);
    const currentWeightKg = latestLoggedWeightKg ?? (profileWeightKg > 0 ? profileWeightKg : null);

    res.json({
      streakCount: String(getCurrentStreak(allLogDates.map((row) => row.date_key))),
      caloriesBurned: `${todayCalories} kcal`,
      caloriesEaten: `${todayCaloriesEaten} kcal`,
      sleepTime: `${todaySleep} h`,
      steps: `${todaySteps.toLocaleString("en-GB")} steps`,
      currentWeight: formatWeightValue(currentWeightKg) || "Add log",
      workoutsThisWeek: `${workoutsThisWeek} done`,
      tomorrowsWorkout: tomorrow.workout,
      tomorrowsFocus: tomorrow.focus,
      weeklyCaloriesTarget: dashboardTargets.weeklyCaloriesTarget,
      weeklyStepsTarget: dashboardTargets.weeklyStepsTarget,
      weeklyCaloriesBurned,
      weeklyStepsCompleted,
      weeklySleepTime,
      weightProgressSeries,
      monthlyWorkoutsCompleted,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getDashboardSummary,
};
