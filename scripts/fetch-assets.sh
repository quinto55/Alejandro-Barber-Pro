#!/usr/bin/env bash
# One-time download of Alejandro's own photos from his Booksy profile.
# Re-runnable: skips files already present.
set -euo pipefail
cd "$(dirname "$0")/.."

CDN="https://d2zdpiztbgorvt.cloudfront.net/region1/us/1114924"
LOGO="$CDN/logo/1cb19e2a7c0044eaaae241228b07f1-a-l-e-j-a-n-d-r-o-b-a-r-b-e-r--logo-3b13416b3ee94685a7788248111b05-booksy.jpeg"

mkdir -p assets/portfolio

[ -f assets/logo-src.jpg ] || curl -fsS -o assets/logo-src.jpg "$LOGO"

n=0
while read -r id; do
  [ -z "$id" ] && continue
  n=$((n+1))
  out=$(printf 'assets/portfolio/cut-%02d.jpg' "$n")
  [ -f "$out" ] && continue
  curl -fsS -o "$out" "$CDN/service_photos/$id.jpeg"
done < scripts/ids.txt

echo "logo: $([ -f assets/logo-src.jpg ] && echo ok || echo MISSING)"
echo "photos: $(ls assets/portfolio/*.jpg 2>/dev/null | wc -l)/32"
