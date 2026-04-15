/*
 * Shared progress-related data shapes.
 *
 * Dashboard charts and milestone cards should eventually consume objects that
 * match these shapes, regardless of whether the values come from logs or AI goals.
 */
/**
 * @typedef {Object} ProgressPoint
 * @property {string} label
 * @property {number} value
 * @property {boolean} [isFuture]
 */

/**
 * @typedef {Object} Milestone
 * @property {number|string} id
 * @property {string} title
 * @property {string} detail
 * @property {string} category
 * @property {number} progress
 * @property {boolean} completed
 * @property {string} [targetDate]
 */

export {};
