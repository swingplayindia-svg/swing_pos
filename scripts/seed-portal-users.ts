/**
 * Create demo Firebase Auth users for Swing Portal.
 *
 * Usage (from project root, with .env.local containing Firebase Admin vars):
 *   npm run seed:users
 *   npm run seed:users -- --turf-id=V45RXsGSSjcGTGQWhvwE
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  DEFAULT_SEED_PORTAL_USERS,
  seedPortalUsers,
} from "../lib/portal-users-admin";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function parseTurfIdArg(): string | undefined {
  const arg = process.argv.find((a) => a.startsWith("--turf-id="));
  return arg?.split("=")[1]?.trim() || undefined;
}

async function main() {
  loadEnvLocal();
  const turfId = parseTurfIdArg();

  console.log("Seeding Swing Portal users…");
  if (turfId) console.log(`Linking owners to turf: ${turfId}`);

  const { created, skipped } = await seedPortalUsers(
    DEFAULT_SEED_PORTAL_USERS,
    { turfIdForOwners: turfId },
  );

  for (const u of created) {
    console.log(`✓ Created ${u.role}: ${u.email} (${u.uid})`);
  }
  for (const s of skipped) {
    console.log(`⊘ Skipped ${s}`);
  }

  if (created.length === 0 && skipped.length === 0) {
    console.log("Nothing to do.");
  } else {
    console.log("\nDefault password for new accounts: SwingPortal2026!");
    console.log("Admin login: /login");
    console.log("Owner login: /owner/login");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
