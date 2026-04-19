const openDb = require("../db/connection");
const { getLatestLoggedWeightKg } = require("../services/weight.service");

async function hydrateEffectiveWeight(db, profile, { overrideNull = true } = {}) {
    if (!profile) {
        return profile;
    }

    if (!overrideNull && profile.weight_kg == null) {
        return profile;
    }

    const latestLoggedWeightKg = await getLatestLoggedWeightKg(db, profile.user_id);

    if (latestLoggedWeightKg == null) {
        return profile;
    }

    return {
        ...profile,
        weight_kg: latestLoggedWeightKg,
    };
}

// Get the logged-in user's full profile
const getMyProfile = async (req, res) => {
    try {
        const db = await openDb();

        const profile = await db.get(
            `SELECT profiles.*, users.email, users.email_verified_at
             FROM profiles
             JOIN users ON users.id = profiles.user_id
             WHERE profiles.user_id = ?`,
            [req.user.id]
        );

        if (!profile) {
            return res.status(404).json({
                error: "Profile not found",
            });
        }

        res.json(await hydrateEffectiveWeight(db, profile));
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
            username,
            email,
            full_name,
            date_of_birth,
            age,
            height_cm,
            weight_kg,
            bio,
            profile_picture_url,
            is_dob_public,
            is_age_public,
            is_height_public,
            is_weight_public,
        } = req.body;

        if (username) {
            const existingUsername = await db.get(
                "SELECT * FROM profiles WHERE username = ? AND user_id != ?",
                [username, req.user.id]
            );

            if (existingUsername) {
                return res.status(400).json({
                    error: "Username already taken",
                });
            }
        }

        const nextEmail = email ? email.trim().toLowerCase() : null;

        if (nextEmail) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
                return res.status(400).json({ error: "Enter a valid email address" });
            }

            const existingEmail = await db.get(
                "SELECT * FROM users WHERE email = ? AND id != ?",
                [nextEmail, req.user.id]
            );

            if (existingEmail) {
                return res.status(400).json({ error: "Email already exists" });
            }
        }

        const existingProfile = await db.get(
            "SELECT * FROM profiles WHERE user_id = ?",
            [req.user.id]
        );

        if (!existingProfile) {
            return res.status(404).json({
                error: "Profile not found",
            });
        }

        const now = new Date().toISOString();

        if (nextEmail) {
            await db.run(
                `UPDATE users
                 SET email = ?,
                     email_verified_at = NULL,
                     updated_at = ?
                 WHERE id = ?`,
                [nextEmail, now, req.user.id]
            );
        }

        // Update profile row
        await db.run(
            `UPDATE profiles
            SET username = COALESCE(?, username),
                full_name = ?,
                date_of_birth = ?,
                age = ?,
                height_cm = ?,
                weight_kg = ?,
                bio = ?,
                profile_picture_url = ?,
                is_dob_public = ?,
                is_age_public = ?,
                is_height_public = ?,
                is_weight_public = ?,
                updated_at = ?
            WHERE user_id = ?`,
            [
                username,
                full_name ?? existingProfile.full_name,
                date_of_birth ?? existingProfile.date_of_birth,
                age ?? existingProfile.age,
                height_cm ?? existingProfile.height_cm,
                weight_kg ?? existingProfile.weight_kg,
                bio ?? existingProfile.bio,
                profile_picture_url ?? existingProfile.profile_picture_url,
                typeof is_dob_public === "boolean" ? (is_dob_public ? 1 : 0) : existingProfile.is_dob_public,
                typeof is_age_public === "boolean" ? (is_age_public ? 1 : 0) : existingProfile.is_age_public,
                typeof is_height_public === "boolean" ? (is_height_public ? 1 : 0) : existingProfile.is_height_public,
                typeof is_weight_public === "boolean" ? (is_weight_public ? 1 : 0) : existingProfile.is_weight_public,
                now,
                req.user.id,
            ]
        );

        res.json({
            message: "Profile updated successfully",
            profile: await hydrateEffectiveWeight(
                db,
                await db.get(
                `SELECT profiles.*, users.email, users.email_verified_at
                 FROM profiles
                 JOIN users ON users.id = profiles.user_id
                 WHERE profiles.user_id = ?`,
                    [req.user.id]
                )
            ),
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
                CASE WHEN is_dob_public = 1 THEN date_of_birth ELSE NULL END AS date_of_birth,
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

        res.json(await hydrateEffectiveWeight(db, profile, { overrideNull: false }));
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
