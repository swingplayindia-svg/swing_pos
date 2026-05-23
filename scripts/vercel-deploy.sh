#!/usr/bin/env bash
# Deploy to Vercel from your machine — no Bitbucket required.
# Usage: ./scripts/vercel-deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env.local ]]; then
  echo "Missing .env.local"
  exit 1
fi

if ! npx vercel whoami &>/dev/null; then
  echo "Run: npx vercel login"
  exit 1
fi

if [[ ! -f .vercel/project.json ]]; then
  echo "Linking project (CLI only, no Git)..."
  npx vercel link --yes
fi

echo "Syncing env vars (production only)..."
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
  key="${line%%=*}"
  val="${line#*=}"
  printf '%s' "$val" | npx vercel env add "$key" production --force
done < .env.local

echo "Deploying (prefer IPv4 if your network blocks IPv6)..."
export NODE_OPTIONS="${NODE_OPTIONS:-} --dns-result-order=ipv4first"
npx vercel deploy --prod --yes

echo ""
echo "If deploy succeeded, add your *.vercel.app URL in Firebase → Auth → Authorized domains."
echo "To remove Bitbucket from this project: vercel.com → Project → Settings → Git → Disconnect."
