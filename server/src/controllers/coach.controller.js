const openDb = require("../db/connection");

function parseJson(value, fallback) {
  try {
    return JSON.parse(value || "");
  } catch {
    return fallback;
  }
}

function buildSectionsFromPlan(plan) {
  if (Array.isArray(plan.sections) && plan.sections.length > 0) {
    return plan.sections;
  }

  return [
    {
      title: "Training",
      body: "Keep movement manageable today and log the result so your plan can adjust.",
    },
    {
      title: "Recovery",
      body: "Protect sleep and note soreness, energy, or any limitations after training.",
    },
    {
      title: "Nutrition",
      body: "Anchor meals around protein, fibre, and enough water for the day.",
    },
  ];
}

async function getCurrentPlan(req) {
  const db = await openDb();
  const row = await db.get("SELECT * FROM health_plans WHERE user_id = ?", [req.user.id]);

  if (!row) {
    return null;
  }

  return {
    answers: parseJson(row.answers_json, {}),
    plan: parseJson(row.plan_json, {}),
  };
}

const chat = async (req, res) => {
  try {
    const message = (req.body.message || req.body.question || "").trim();

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const currentPlan = await getCurrentPlan(req);
    const planTitle = currentPlan?.plan?.title || currentPlan?.answers?.goal || "your plan";
    const trainingDays = currentPlan?.answers?.trainingDays || "your planned training days";
    const sleepGoal = currentPlan?.answers?.sleepGoal || "your sleep goal";

    res.json({
      message: "Coach response generated",
      response: `For "${message}", keep it tied to ${planTitle}: choose one realistic action today, use ${trainingDays.toLowerCase()} as the training boundary, and protect ${sleepGoal.toLowerCase()} for recovery. Log what happens so the next adjustment has real data behind it.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const recommendations = async (req, res) => {
  try {
    const currentPlan = await getCurrentPlan(req);
    const sections = buildSectionsFromPlan(currentPlan?.plan || {});

    res.json(
      sections.map((section) => ({
        title: section.title,
        body: section.body,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  chat,
  recommendations,
};
