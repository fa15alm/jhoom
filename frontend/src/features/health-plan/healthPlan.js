/*
 * Temporary frontend health-plan store.
 *
 * This module keeps onboarding answers and generated-plan text available across
 * screens during a single app session. It is deliberately isolated so backend
 * persistence can replace it later without rewriting the dashboard, AI coach,
 * onboarding, or recommendations screens.
 */
const defaultOnboardingAnswers = {
  dateOfBirth: "",
  height: "",
  weight: "",
  goal: "",
  activityLevel: "",
  sex: "",
  trainingDays: "",
  equipment: "",
  limitations: "",
  dietaryPreference: "",
  sleepGoal: "",
  additionalGoals: "",
};

// Module-level state keeps the generated plan available across screens during one app session.
// This is not permanent storage; it resets when the app reloads.
let storedOnboardingAnswers = { ...defaultOnboardingAnswers };
let storedGeneratedPlan = null;

export function getDefaultOnboardingAnswers() {
  // Return a copy so screens cannot accidentally mutate the source defaults.
  return { ...defaultOnboardingAnswers };
}

export function saveOnboardingAnswers(answers) {
  // Merge against defaults so missing fields always exist in the stored shape.
  storedOnboardingAnswers = {
    ...defaultOnboardingAnswers,
    ...answers,
  };
}

export function saveGeneratedHealthPlan(healthPlan) {
  if (!healthPlan) {
    storedGeneratedPlan = null;
    return;
  }

  storedGeneratedPlan = healthPlan;
  saveOnboardingAnswers(healthPlan.answers ?? {});
}

export function getGeneratedHealthPlan() {
  return storedGeneratedPlan;
}

export function getOnboardingAnswers() {
  // Return a copy so callers can read safely without changing module state.
  return { ...storedOnboardingAnswers };
}

export function hasGeneratedPlan() {
  // Goal and activity level are the minimum answers needed for useful plan copy.
  return Boolean(storedOnboardingAnswers.goal && storedOnboardingAnswers.activityLevel);
}

export function buildPlanPreview(answers = storedOnboardingAnswers) {
  if (storedGeneratedPlan?.plan?.sections) {
    return storedGeneratedPlan.plan.sections;
  }

  // The preview turns raw onboarding answers into simple user-facing plan sections.
  // Backend AI output can replace this deterministic copy later.
  const goal = answers.goal || "Build a balanced routine";
  const activityLevel = answers.activityLevel || "Beginner";
  const trainingDays = answers.trainingDays || "3 days per week";
  const sleepGoal = answers.sleepGoal || "7-8 hours";
  const equipment = answers.equipment || "bodyweight and available equipment";
  const dietaryPreference = answers.dietaryPreference || "balanced meals";

  return [
    {
      title: "Training",
      body: `${goal} with ${trainingDays.toLowerCase()} of structured movement using ${equipment.toLowerCase()}.`,
    },
    {
      title: "Recovery",
      body: `Keep recovery realistic for a ${activityLevel.toLowerCase()} routine, with a sleep target of ${sleepGoal.toLowerCase()}.`,
    },
    {
      title: "Nutrition",
      body: `Use ${dietaryPreference.toLowerCase()} as the starting point and adjust portions from daily logs.`,
    },
  ];
}

export function getCurrentPlanSections() {
  if (storedGeneratedPlan?.plan?.sections) {
    return storedGeneratedPlan.plan.sections;
  }

  const answers = getOnboardingAnswers();

  // If onboarding has not run yet, return a helpful empty-plan state.
  // This prevents the AI coach/recommendations screens from appearing broken.
  if (!hasGeneratedPlan()) {
    return [
      {
        title: "Today",
        body: "Complete onboarding to generate a plan that can guide workouts, nutrition, sleep, and recovery.",
      },
      {
        title: "Next step",
        body: "Tap New plan? to answer the setup questions and build your first AI health plan.",
      },
    ];
  }

  return [
    {
      title: "Today",
      body: `Focus on ${answers.goal.toLowerCase()} with one manageable action: train, walk, log meals, or protect sleep.`,
    },
    {
      title: "Workout focus",
      body: `${answers.trainingDays || "3 days per week"} planned around ${answers.equipment || "your available equipment"}. Adjust intensity for ${answers.activityLevel.toLowerCase()} level.`,
    },
    {
      title: "Recovery",
      body: `Aim for ${answers.sleepGoal || "7-8 hours"} sleep and note any limitations: ${answers.limitations || "none shared yet"}.`,
    },
    {
      title: "Nutrition",
      body: `${answers.dietaryPreference || "Balanced meals"} is the current nutrition preference. Logs will help tune calories and macros later.`,
    },
  ];
}

export function getPlanSummary() {
  if (storedGeneratedPlan?.plan) {
    return {
      title: storedGeneratedPlan.plan.title || "Custom plan",
      detail: storedGeneratedPlan.plan.summary || "Generated from onboarding and logs.",
    };
  }

  const answers = getOnboardingAnswers();

  // Dashboard/AI use this compact summary rather than duplicating plan text.
  // Keep summary generation here so all plan labels stay consistent.
  if (!hasGeneratedPlan()) {
    return {
      title: "No plan yet",
      detail: "Generate a custom plan from onboarding to unlock personalised guidance.",
    };
  }

  return {
    title: answers.goal,
    detail: `${answers.activityLevel} • ${answers.trainingDays || "Training days not set"} • ${answers.sleepGoal || "Sleep goal not set"}`,
  };
}
