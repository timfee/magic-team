#!/usr/bin/env node

const https = require("https");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const VERSION = "v2.15.0";
const BIN_DIR = path.join(__dirname, "..", "bin");
const PROXY_PATH = path.join(BIN_DIR, "cloud-sql-proxy");

const getPlatformInfo = () => {
  const platform = process.platform;
  const arch = process.arch;

  const platformMap = {
    darwin: {
      arm64: `cloud-sql-proxy.darwin.arm64`,
      x64: `cloud-sql-proxy.darwin.amd64`,
    },
    linux: {
      arm64: `cloud-sql-proxy.linux.arm64`,
      x64: `cloud-sql-proxy.linux.amd64`,
    },
    win32: {
      x64: `cloud-sql-proxy.x64.exe`,
      arm64: `cloud-sql-proxy.x64.exe`, // Windows ARM uses x64 emulation
    },
  };

  if (!platformMap[platform] || !platformMap[platform][arch]) {
    throw new Error(
      `Unsupported platform: ${platform} ${arch}. Supported: darwin/linux (arm64/x64), win32 (x64)`,
    );
  }

  return {
    filename: platformMap[platform][arch],
    isWindows: platform === "win32",
  };
};

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    console.log(`Downloading from ${url}...`);
    const file = fs.createWriteStream(dest);

    https
      .get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Follow redirect
          return download(response.headers.location, dest)
            .then(resolve)
            .catch(reject);
        }

        if (response.statusCode !== 200) {
          reject(
            new Error(`Failed to download: HTTP ${response.statusCode}`),
          );
          return;
        }

        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
};

const setup = async () => {
  console.log("Setting up Cloud SQL Proxy...");

  // Create bin directory if it doesn't exist
  if (!fs.existsSync(BIN_DIR)) {
    fs.mkdirSync(BIN_DIR, { recursive: true });
  }

  // Check if already exists
  if (fs.existsSync(PROXY_PATH)) {
    console.log("Cloud SQL Proxy already exists at:", PROXY_PATH);
    return;
  }

  const { filename, isWindows } = getPlatformInfo();
  const url = `https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/${VERSION}/${filename}`;

  try {
    await download(url, PROXY_PATH);
    console.log("Downloaded successfully!");

    // Make executable (not needed on Windows)
    if (!isWindows) {
      fs.chmodSync(PROXY_PATH, "755");
      console.log("Made executable");
    }

    console.log("\n✅ Cloud SQL Proxy setup complete!");
    console.log(`   Binary location: ${PROXY_PATH}`);
    console.log(
      '\n   Run "npm run db:proxy" to start the proxy',
    );
  } catch (error) {
    console.error("Failed to setup Cloud SQL Proxy:", error.message);
    process.exit(1);
  }
};

setup();
