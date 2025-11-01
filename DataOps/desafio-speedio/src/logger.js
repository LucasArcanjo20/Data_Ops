import fs from "fs";

const LOG_FILE = "./data/logs.json";

export function logEvent(event, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    ...details,
  };

  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n");
  console.log(`🧾 [LOG] ${event}`, details);
}
