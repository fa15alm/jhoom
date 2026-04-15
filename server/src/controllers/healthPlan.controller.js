const openDb = require("../db/connection");

//helper: format response
function parseHealthPlan(row) {
  return {
    id: row.id,
    userId: row.user_id,
    answers: JSON.parse(row.answers_json || "{}"),
    plan: JSON.parse(row.plan_json || "{}"),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

//simple MVP plan generator
function buildPlanFromAnswers(answers) {
  return {
    title: answers.goal || "Fitness Plan",
    summary: `${answers.activityLevel || "Beginner"} - ${answers.trainingDays || "3 days/week"}`,
    sections: [
      {
        title: "Training",
        body: `Train ${answers.trainingDays || "3 days/week"} focused on ${answers.goal || "fitness"}.`,
      },
      {
        title: "Recovery",
        body: `Sleep target: ${answers.sleepGoal || "7-8 hours"}.`,
      },
      {
        title: "Nutrition",
        body: `Follow a ${answers.dietaryPreference || "balanced"} diet.`,
      },
    ],
    targets: {
      stepsPerDay: 8000,
      caloriesBurnedPerDay: 500,
    },
  };
}

//get health plan
const getHealthPlan = async (req, res) => {
  try {
    const db = await openDb();

    const row = await db.get(
      "SELECT * FROM health_plans WHERE user_id = ?",
      [req.user.id]
    );

    if (!row) {
      return res.status(404).json({ error: "Health plan not found" });
    }

    res.json(parseHealthPlan(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//create health plan
const generateHealthPlan = async (req, res) => {
  try {
    const db = await openDb();
    const answers = req.body;

    if (!answers.goal || !answers.activityLevel) {
      return res.status(400).json({
        error: "goal and activityLevel are required",
      });
    }

    const now = new Date().toISOString();
    const plan = buildPlanFromAnswers(answers);

    await db.run(
      `INSERT INTO health_plans
       (user_id, answers_json, plan_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         answers_json = excluded.answers_json,
         plan_json = excluded.plan_json,
         updated_at = excluded.updated_at`,
      [
        req.user.id,
        JSON.stringify(answers),
        JSON.stringify(plan),
        now,
        now,
      ]
    );

    const row = await db.get(
      "SELECT * FROM health_plans WHERE user_id = ?",
      [req.user.id]
    );

    res.status(201).json(parseHealthPlan(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//update health plan
const updateHealthPlan = async (req, res) => {
  try {
    const db = await openDb();
    const now = new Date().toISOString();

    const existing = await db.get(
      "SELECT * FROM health_plans WHERE user_id = ?",
      [req.user.id]
    );

    if (!existing) {
      return res.status(404).json({ error: "Health plan not found" });
    }

    const nextAnswers =
      req.body.answers || JSON.parse(existing.answers_json || "{}");

    const nextPlan =
      req.body.plan || JSON.parse(existing.plan_json || "{}");

    await db.run(
      `UPDATE health_plans
       SET answers_json = ?, plan_json = ?, updated_at = ?
       WHERE user_id = ?`,
      [
        JSON.stringify(nextAnswers),
        JSON.stringify(nextPlan),
        now,
        req.user.id,
      ]
    );

    const row = await db.get(
      "SELECT * FROM health_plans WHERE user_id = ?",
      [req.user.id]
    );

    res.json(parseHealthPlan(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getHealthPlan,
  generateHealthPlan,
  updateHealthPlan,
};
