const { execSync, spawn } = require("node:child_process");

function handleSigterm() {
  spawn("npm", ["run", "dev:up"], {
    killSignal: "SIGINT",
    stdio: "inherit",
  });

  process.on("SIGINT", () => {
    process.stdout.write("\nCleaning up 🧹...");
    execSync("npm run services:stop");
  });
}

handleSigterm();
