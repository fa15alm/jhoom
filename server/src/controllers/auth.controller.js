const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const openDb = require("../db/connection");
const env = require("../config/env");

// Register a new user
const register = async (req, res) => {
    try {
        // Get values sent from frontend
        const { email, password, username } = req.body;

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
        const token = jwt.sign(
            { id: userResult.lastID, email },
            env.jwtSecret,
            { expiresIn: "7d" }
        );

        // Send response
        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: userResult.lastID,
                email,
                username,
            },
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
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required",
            });
        }

        const db = await openDb();

        // Find user by email
        const user = await db.get(
            "SELECT * FROM users WHERE email = ?",
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
        const token = jwt.sign(
            { id: user.id, email: user.email },
            env.jwtSecret,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                email: user.email,
            },
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
        });
    }
};

module.exports = {
    register,
    login,
};