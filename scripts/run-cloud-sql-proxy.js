const dotenv = require("dotenv");
dotenv.config();
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const PROXY_PATH = path.join(__dirname, "..", "bin", "cloud-sql-proxy");

// Check if CLOUD_SQL_INSTANCE env var is set
if (!process.env.CLOUD_SQL_INSTANCE) {
  console.error(
    "❌ Error: CLOUD_SQL_INSTANCE environment variable is not set!",
  );
  console.error(
    "\n   Add it to your .env file in the format: PROJECT_ID:REGION:INSTANCE_NAME",
  );
  console.error(
    '   Example: CLOUD_SQL_INSTANCE="my-project:us-central1:my-db"',
  );
  process.exit(1);
}

// Check if proxy binary exists
if (!fs.existsSync(PROXY_PATH)) {
  console.error("❌ Cloud SQL Proxy binary not found!");
  console.error('   Run "npm run db:setup-proxy" to download it.');
  process.exit(1);
}

console.log("🚀 Starting Cloud SQL Proxy...");
console.log(`   Instance: ${process.env.CLOUD_SQL_INSTANCE}`);
console.log("   Port: 5432 (localhost)");

const proxy = spawn(PROXY_PATH, [process.env.CLOUD_SQL_INSTANCE], {
  stdio: "inherit",
  env: {
    ...process.env,
  },
});

proxy.on("error", (error) => {
  console.error("❌ Failed to start Cloud SQL Proxy:", error.message);
  process.exit(1);
});

proxy.on("exit", (code) => {
  if (code !== 0) {
    console.error(`❌ Cloud SQL Proxy exited with code ${code}`);
    process.exit(code);
  }
});

// Handle Ctrl+C
process.on("SIGINT", () => {
  console.log("\n⏹️  Stopping Cloud SQL Proxy...");
  proxy.kill();
  process.exit(0);
});
