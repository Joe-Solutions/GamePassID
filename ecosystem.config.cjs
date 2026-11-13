const fs = require("fs");
const path = require("path");

/** Parse KEY=VALUE lines; keep quoted values intact (DATABASE_URL has &). */
function loadEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const fileEnv = loadEnvFile(path.join(__dirname, ".env"));

module.exports = {
  apps: [
    {
      name: "gamepassid",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3210",
      cwd: "/var/www/GamePassID",
      env: {
        NODE_ENV: "production",
        PORT: 3210,
        // Must come from host .env — RDS requires SSL; bare URL → P1010 / pg_hba "no encryption".
        DATABASE_URL: fileEnv.DATABASE_URL,
        AUTH_SECRET: fileEnv.AUTH_SECRET,
      },
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "400M",
    },
  ],
};
