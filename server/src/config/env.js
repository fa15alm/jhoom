require('dotenv').config();

// node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
// ^ creates 128char hex string to use as secret

const DEFAULT_DEV_JWT_SECRET = 'DEV180703f5e331d5e1b2657c01d82bb201c0baecd17af235cea2b2b6450b8aa7cfa3db49ba2ff57c4ac1f86fdb74ab72ff1bc84f3f5b85eed2528c222c31f4f';

function parseCorsOrigins(value) {
    if (!value) {
        return [];
    }

    return value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
}

const env = {
    port: process.env.PORT || 5001,
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || DEFAULT_DEV_JWT_SECRET,
    dbPath: process.env.DB_PATH || './database.db',
    corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN),
    staticDir: process.env.STATIC_DIR || 'frontend/dist',
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    uploadMaxBytes: Number(process.env.UPLOAD_MAX_BYTES || 2 * 1024 * 1024),
    jsonLimit: process.env.JSON_LIMIT || '10mb',
    publicAppUrl: process.env.PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 5001}`,
    frontendUrl: process.env.FRONTEND_URL || '',
    emailFrom: process.env.EMAIL_FROM || '',
    resendApiKey: process.env.RESEND_API_KEY || '',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
};

if (env.nodeEnv === 'production' && env.jwtSecret === DEFAULT_DEV_JWT_SECRET) {
    throw new Error('JWT_SECRET must be set in production');
}

module.exports = env;
