const jwt = require("jsonwebtoken");
const env = require("../config/env");

// Protect routes that require login
const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Check header exists and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
        error: "No token provided",
        });
    }

    // Extract token from header
    const token = authHeader.split(" ")[1];

    try {
        // Verify token and attach decoded user data to request
        const decoded = jwt.verify(token, env.jwtSecret);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            error: "Invalid token",
        });
    }
};

module.exports = protect;