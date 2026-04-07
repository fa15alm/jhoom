require('dotenv').config();

// node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
// ^ creates 128char hex string to use as secret

const env = {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'DEV180703f5e331d5e1b2657c01d82bb201c0baecd17af235cea2b2b6450b8aa7cfa3db49ba2ff57c4ac1f86fdb74ab72ff1bc84f3f5b85eed2528c222c31f4f',
    dbPath: process.env.DB_PATH || './jhoom.db',
};

module.exports = env;