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

let storedOnboardingAnswers = { ...defaultOnboardingAnswers };

export function getDefaultOnboardingAnswers() {
  return { ...defaultOnboardingAnswers };
}

export function saveOnboardingAnswers(answers) {
  storedOnboardingAnswers = {
    ...defaultOnboardingAnswers,
    ...answers,
  };
}

export function getOnboardingAnswers() {
  return { ...storedOnboardingAnswers };
}

export function hasGeneratedPlan() {
  return Boolean(storedOnboardingAnswers.goal && storedOnboardingAnswers.activityLevel);
}

export function buildPlanPreview(answers = storedOnboardingAnswers) {
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
  const answers = getOnboardingAnswers();

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
  const answers = getOnboardingAnswers();

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
