/*
 * Shared user/account data shapes.
 *
 * Auth, profile, settings, and social screens should agree on these fields
 * when the backend starts returning real users and profiles.
 */
/**
 * @typedef {Object} User
 * @property {number|string} id
 * @property {string} email
 * @property {string} [username]
 */

/**
 * @typedef {Object} UserProfile
 * @property {number|string} id
 * @property {number|string} user_id
 * @property {string} username
 * @property {string} [full_name]
 * @property {number} [age]
 * @property {number} [height_cm]
 * @property {number} [weight_kg]
 * @property {string} [bio]
 * @property {string} [profile_picture_url]
 */

export {};
