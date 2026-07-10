import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";

const envPath = path.resolve(process.cwd(), ".env");

if (fs.existsSync(envPath)) {
  console.log(`.env already exists at ${envPath}. No changes made.`);
  process.exit(0);
}

const secret = randomBytes(32).toString("hex");
const content = `SESSION_SECRET=${secret}\nPORT=5000\nDATABASE_URL=postgresql://user:password@localhost:5432/secure_scan_pro_db\n`;

fs.writeFileSync(envPath, content, { encoding: "utf8", flag: "wx" });
console.log(`Created .env at ${envPath} with dummy values.`);
console.log("Update DATABASE_URL, SESSION_SECRET, and any other secrets before using in production.");
