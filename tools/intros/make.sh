#!/bin/zsh
# Re-record every intro video from the live demos and copy it into public/intros.
# Needs: the dev server running (npm run dev), Google Chrome, ffmpeg (brew install ffmpeg), Python 3.
# Usage: tools/intros/make.sh [nearmed parkassist saarag]   (SITE=http://localhost:3001 to point elsewhere)
set -e
cd "$(dirname "$0")"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PROJECTS=(${@:-nearmed parkassist saarag})
for P in $PROJECTS; do
  rm -rf out-$P
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --remote-debugging-port=9399 --user-data-dir="$PWD/.chrome-$P" about:blank >/dev/null 2>&1 &
  CP=$!; sleep 2
  node record.mjs 9399 $P "$PWD/out-$P"
  kill $CP; sleep 1; rm -rf "$PWD/.chrome-$P"
  ./build.sh $P
  cp out-$P/$P-intro.mp4 out-$P/$P-intro.jpg ../../public/intros/
  rm -rf out-$P
done
echo "Done. If a video's length changed, update intro.seconds in components/demos/projects.ts."
