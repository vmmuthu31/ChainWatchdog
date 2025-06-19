import "dotenv/config";
import { spawn } from "child_process";

const botProcess = spawn(
  "npx",
  ["ts-node", "-P", "tsconfig.bot.json", "./lib/telegram-bot/index.ts"],
  {
    stdio: "inherit",
    shell: true,
  }
);

botProcess.on("error", (error) => {
  console.error("Failed to start bot process:", error);
});

process.on("SIGINT", () => {
  botProcess.kill("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  botProcess.kill("SIGTERM");
  process.exit(0);
});
