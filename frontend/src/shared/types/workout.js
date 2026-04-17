/*
 * Shared workout data shapes.
 *
 * Workout logs, AI-generated workout plan items, dashboard cards, and milestones
 * can share these documented shapes when backend plan/log data is connected.
 */
/**
 * @typedef {Object} WorkoutLog
 * @property {number|string} id
 * @property {string} dateKey
 * @property {string} name
 * @property {string} typeKey
 * @property {Record<string, string>} values
 */

/**
 * @typedef {Object} WorkoutPlanItem
 * @property {string} id
 * @property {string} title
 * @property {string} focus
 * @property {string} scheduledDate
 */

export {};
