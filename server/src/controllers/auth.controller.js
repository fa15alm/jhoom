const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const openDb = require("../db/connection");
const env = require("../config/env");
const { sendTransactionalEmail } = require("../services/email.service");

function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

function createToken() {
    return crypto.randomBytes(32).toString("hex");
}

function buildPublicUrl(path) {
    return `${env.publicAppUrl.replace(/\/$/, "")}${path}`;
}

function buildFrontendUrl(req, path) {
    const origin = env.frontendUrl || req.get("origin") || env.publicAppUrl;
    return `${origin.replace(/\/$/, "")}${path}`;
}

function signSession(user) {
    return jwt.sign(
        { id: user.id, email: user.email },
        env.jwtSecret,
        { expiresIn: "7d" }
    );
}

async function createEmailVerification(db, userId, email) {
    const token = createToken();
    const tokenHash = hashToken(token);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    await db.run(
        `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at, created_at)
         VALUES (?, ?, ?, ?)`,
        [userId, tokenHash, expiresAt, now.toISOString()]
    );

    const verificationUrl = buildPublicUrl(`/api/auth/email-verification/confirm?token=${token}`);

    await sendTransactionalEmail({
        to: email,
        subject: "Verify your Jhoom email",
        text: `Verify your Jhoom account here: ${verificationUrl}`,
    }).catch((error) => {
        console.warn("Email verification send failed:", error.message);
    });

    return verificationUrl;
}

// Register a new user
const register = async (req, res) => {
    try {
        // Get values sent from frontend
        const email = req.body.email.trim().toLowerCase();
        const { password } = req.body;
        const username = req.body.username.trim();

        // Basic validation
        if (!email || !password || !username) {
            return res.status(400).json({
                error: "Email, password and username are required",
            });
        }

        // Open database connection
        const db = await openDb();

        // Check if email already exists
        const existingUser = await db.get(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (existingUser) {
            return res.status(400).json({
                error: "Email already exists",
            });
        }

        // Check if username already exists
        const existingUsername = await db.get(
            "SELECT * FROM profiles WHERE username = ?",
            [username]
        );

        if (existingUsername) {
            return res.status(400).json({
                error: "Username already taken",
            });
        }

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Current timestamp for created_at and updated_at
        const now = new Date().toISOString();

        // Insert into users table
        const userResult = await db.run(
            `INSERT INTO users (email, password_hash, created_at, updated_at)
            VALUES (?, ?, ?, ?)`,
            [email, hashedPassword, now, now]
        );

        // Insert matching profile row
        await db.run(
            `INSERT INTO profiles (
                user_id, username, created_at, updated_at
            ) VALUES (?, ?, ?, ?)`,
            [userResult.lastID, username, now, now]
        );

        // Create token for logged-in session
        const token = signSession({ id: userResult.lastID, email });
        const emailVerificationUrl = await createEmailVerification(db, userResult.lastID, email);

        // Send response
        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: userResult.lastID,
                email,
                username,
            },
            emailVerificationUrl: env.nodeEnv === "production" ? undefined : emailVerificationUrl,
        });
    } catch (error) {
        res.status(500).json({
        error: error.message,
        });
    }
};

// Log in an existing user
const login = async (req, res) => {
    try {
        const email = req.body.email.trim().toLowerCase();
        const { password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required",
            });
        }

        const db = await openDb();

        // Find user by email
        const user = await db.get(
            `SELECT users.*, profiles.username
             FROM users
             LEFT JOIN profiles ON profiles.user_id = users.id
             WHERE users.email = ?`,
            [email]
        );

        if (!user) {
            return res.status(400).json({
                error: "Invalid email or password",
            });
        }

        // Compare entered password with stored hash
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(400).json({
                error: "Invalid email or password",
            });
        }

        // Create login token
        const token = signSession(user);

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                emailVerified: Boolean(user.email_verified_at),
            },
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
        });
    }
};

const requestPasswordReset = async (req, res) => {
    try {
        const email = req.body.email.trim().toLowerCase();
        const db = await openDb();
        const user = await db.get("SELECT id, email FROM users WHERE email = ?", [email]);
        let resetUrl;

        if (user) {
            const token = createToken();
            const tokenHash = hashToken(token);
            const now = new Date();
            const expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();

            await db.run(
                `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at)
                 VALUES (?, ?, ?, ?)`,
                [user.id, tokenHash, expiresAt, now.toISOString()]
            );

            resetUrl = buildFrontendUrl(req, `/reset-password?token=${token}`);

            await sendTransactionalEmail({
                to: user.email,
                subject: "Reset your Jhoom password",
                text: `Reset your Jhoom password here: ${resetUrl}`,
            }).catch((error) => {
                console.warn("Password reset email send failed:", error.message);
            });
        }

        res.json({
            message: "If an account exists for that email, a reset link has been sent.",
            resetUrl: env.nodeEnv === "production" ? undefined : resetUrl,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const confirmPasswordReset = async (req, res) => {
    try {
        const { token, password } = req.body;
        const db = await openDb();
        const tokenHash = hashToken(token);
        const now = new Date().toISOString();
        const resetToken = await db.get(
            `SELECT * FROM password_reset_tokens
             WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?`,
            [tokenHash, now]
        );

        if (!resetToken) {
            return res.status(400).json({ error: "Reset link is invalid or expired." });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await db.run(
            "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
            [passwordHash, now, resetToken.user_id]
        );

        await db.run(
            "UPDATE password_reset_tokens SET used_at = ? WHERE id = ?",
            [now, resetToken.id]
        );

        res.json({ message: "Password reset successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const requestEmailVerification = async (req, res) => {
    try {
        const db = await openDb();
        const user = await db.get("SELECT id, email, email_verified_at FROM users WHERE id = ?", [req.user.id]);

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        if (user.email_verified_at) {
            return res.json({ message: "Email already verified." });
        }

        const emailVerificationUrl = await createEmailVerification(db, user.id, user.email);

        res.json({
            message: "Verification email sent.",
            emailVerificationUrl: env.nodeEnv === "production" ? undefined : emailVerificationUrl,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const confirmEmailVerification = async (req, res) => {
    try {
        const token = req.body.token || req.query.token;

        if (!token) {
            return res.status(400).json({ error: "Verification token is required." });
        }

        const db = await openDb();
        const tokenHash = hashToken(token);
        const now = new Date().toISOString();
        const verificationToken = await db.get(
            `SELECT * FROM email_verification_tokens
             WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?`,
            [tokenHash, now]
        );

        if (!verificationToken) {
            return res.status(400).json({ error: "Verification link is invalid or expired." });
        }

        await db.run(
            "UPDATE users SET email_verified_at = ?, updated_at = ? WHERE id = ?",
            [now, now, verificationToken.user_id]
        );

        await db.run(
            "UPDATE email_verification_tokens SET used_at = ? WHERE id = ?",
            [now, verificationToken.id]
        );

        if (req.method === "GET") {
            return res.type("html").send("<p>Email verified. You can return to Jhoom.</p>");
        }

        res.json({ message: "Email verified successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    register,
    login,
    requestPasswordReset,
    confirmPasswordReset,
    requestEmailVerification,
    confirmEmailVerification,
};
