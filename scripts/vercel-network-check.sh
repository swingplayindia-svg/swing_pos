#!/usr/bin/env bash
# Quick checks when Vercel deploy fails with ENETUNREACH
set -u
echo "=== DNS ==="
nslookup api.vercel.com 2>&1 || true
echo ""
echo "=== HTTPS (api.vercel.com) ==="
curl -sS -o /dev/null -w "HTTP %{http_code}\n" --connect-timeout 10 https://api.vercel.com 2>&1 || echo "curl failed"
echo ""
echo "=== Ping (may be blocked; that's OK) ==="
ping -c 2 api.vercel.com 2>&1 || true
echo ""
echo "If curl fails: try another network (phone hotspot), turn VPN off, or use IPv4:"
echo "  NODE_OPTIONS='--dns-result-order=ipv4first' npx vercel deploy --prod"
