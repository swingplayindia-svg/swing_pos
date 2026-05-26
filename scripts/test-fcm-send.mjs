/**
 * Test FCM v1 send from CLI (loads .env.local).
 * Usage: node scripts/test-fcm-send.mjs [deviceToken]
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { JWT } from "google-auth-library";
import { request as httpsRequest } from "node:https";

function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY ?? "";
privateKey = privateKey.replace(/\\n/g, "\n");

const deviceToken = process.argv[2] || "invalid-token-for-auth-test";

const client = new JWT({
  email: clientEmail,
  key: privateKey,
  scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
});

const { access_token } = await client.authorize();
console.log("access_token length:", access_token?.length ?? 0);

const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
const payload = JSON.stringify({
  message: {
    token: deviceToken,
    notification: { title: "CLI test", body: "From test-fcm-send.mjs" },
  },
});

const parsed = new URL(url);
await new Promise((resolve, reject) => {
  const req = httpsRequest(
    {
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    },
    (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        console.log("HTTP", res.statusCode);
        console.log(raw);
        resolve();
      });
    },
  );
  req.on("error", reject);
  req.write(payload);
  req.end();
});
