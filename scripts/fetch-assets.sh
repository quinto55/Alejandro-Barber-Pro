#!/usr/bin/env bash
# One-time download of Alejandro's own photos from his Booksy profile.
# Re-runnable: skips files already present.
set -euo pipefail
cd "$(dirname "$0")/.."

CDN="https://d2zdpiztbgorvt.cloudfront.net/region1/us/1114924"
# A photo of his suite. Raw source only — scripts/make-photos.py crops and
# resizes it into the asset the page actually loads. (The portrait is no
# longer fetched: assets/portrait-src.png was supplied directly and is
# committed.)
STUDIO="$CDN/biz_photo/09a611a0a25640e7a78eb40319be85-a-l-e-j-a-n-d-r-o-b-a-r-b-e-r--biz-photo-390e1b32017a4179bb6621dae4c812-booksy.jpeg"

mkdir -p assets/portfolio

if [ ! -f assets/studio-src.jpg ]; then
  curl -fsS -o assets/studio-src.jpg.part "$STUDIO"
  mv assets/studio-src.jpg.part assets/studio-src.jpg
fi

n=0
while read -r id; do
  [ -z "$id" ] && continue
  n=$((n+1))
  out=$(printf 'assets/portfolio/cut-%02d.jpg' "$n")
  [ -f "$out" ] && continue
  curl -fsS -o "$out.part" "$CDN/service_photos/$id.jpeg"
  mv "$out.part" "$out"
done < scripts/ids.txt

echo "studio:   $([ -f assets/studio-src.jpg ] && echo ok || echo MISSING)"
echo "photos: $(ls assets/portfolio/*.jpg 2>/dev/null | wc -l)/32"
