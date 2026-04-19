const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const path = require("path");
const fs = require("fs");
const env = require("../config/env");

async function openDb() {
  const filename = path.isAbsolute(env.dbPath)
    ? env.dbPath
    : path.resolve(__dirname, "../..", env.dbPath);

  fs.mkdirSync(path.dirname(filename), { recursive: true });

  return open({
    filename,
    driver: sqlite3.Database,
  });
}

module.exports = openDb;
