const openDb = require("../db/connection");

// Get the logged-in user's full profile
const getMyProfile = async (req, res) => {
    try {
        const db = await openDb();

        const profile = await db.get(
            "SELECT * FROM profiles WHERE user_id = ?",
            [req.user.id]
        );

        if (!profile) {
            return res.status(404).json({
                error: "Profile not found",
            });
        }

        res.json(profile);
    } catch (error) {
        res.status(500).json({
            error: error.message,
        });
    }
};

// Update the logged-in user's profile
const updateMyProfile = async (req, res) => {
    try {
        const db = await openDb();

        // Get values from frontend
        const {
            full_name,
            age,
            height_cm,
            weight_kg,
            bio,
            profile_picture_url,
            is_age_public,
            is_height_public,
            is_weight_public,
        } = req.body;

        // Update profile row
        await db.run(
            `UPDATE profiles
            SET full_name = ?,
                age = ?,
                height_cm = ?,
                weight_kg = ?,
                bio = ?,
                profile_picture_url = ?,
                is_age_public = ?,
                is_height_public = ?,
                is_weight_public = ?,
                updated_at = ?
            WHERE user_id = ?`,
            [
                full_name,
                age,
                height_cm,
                weight_kg,
                bio,
                profile_picture_url,
                is_age_public ? 1 : 0,
                is_height_public ? 1 : 0,
                is_weight_public ? 1 : 0,
                new Date().toISOString(),
                req.user.id,
            ]
        );

        res.json({
            message: "Profile updated successfully",
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
        });
    }
};

// Get another user's public profile only
const getUserProfile = async (req, res) => {
    try {
        const db = await openDb();

        const profile = await db.get(
            `SELECT
                id,
                user_id,
                username,
                full_name,
                bio,
                profile_picture_url,
                CASE WHEN is_age_public = 1 THEN age ELSE NULL END AS age,
                CASE WHEN is_height_public = 1 THEN height_cm ELSE NULL END AS height_cm,
                CASE WHEN is_weight_public = 1 THEN weight_kg ELSE NULL END AS weight_kg
            FROM profiles
            WHERE user_id = ?`,
            [req.params.id]
        );

        if (!profile) {
            return res.status(404).json({
                error: "Profile not found",
            });
        }

        res.json(profile);
    } catch (error) {
        res.status(500).json({
            error: error.message,
        });
    }
};

module.exports = {
    getMyProfile,
    updateMyProfile,
    getUserProfile,
};