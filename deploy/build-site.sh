#!/usr/bin/env bash
# Build Neo site static files into deploy/site-dist for the docker gateway.
# Run from repo root OR anywhere; needs sibling neologistics path.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE="${NEO_SITE_PATH:-$ROOT/../connectosWebsite1/neologistics}"
OUT="$ROOT/deploy/site-dist"

if [[ ! -d "$SITE" ]]; then
  echo "Neo site not found at: $SITE"
  echo "Set NEO_SITE_PATH to the neologistics folder."
  exit 1
fi

echo "Building Neo site from $SITE ..."
cd "$SITE"
npm ci
# Same-origin APIs via nginx; portal on same host under /app/
export VITE_PORTAL_URL="/app/"
npm run build

rm -rf "$OUT"
mkdir -p "$OUT"
cp -R dist/* "$OUT/"
echo "Wrote $OUT"
ls -la "$OUT" | head
