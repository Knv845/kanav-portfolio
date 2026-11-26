#!/bin/zsh
# build.sh <project>: music + frames -> intro MP4 and poster
set -e
P=$1; D=out-$P
SECS=$(python3 -c "import json;print(json.load(open('$D/meta.json'))['seconds'])")
python3 music.py $P $SECS $D/music.wav >/dev/null
ffmpeg -v error -y -f concat -safe 0 -i $D/frames.ffconcat -i $D/music.wav \
  -vf "fps=30,scale=1920:1080:flags=lanczos,format=yuv420p" -c:v libx264 -preset slow -crf 23 -profile:v high \
  -af "loudnorm=I=-18:TP=-1.5:LRA=11" -c:a aac -b:a 160k -ar 44100 -movflags +faststart -shortest $D/$P-intro.mp4
ffmpeg -v error -y -ss 2.2 -i $D/$P-intro.mp4 -frames:v 1 -vf scale=1280:-2 -q:v 3 $D/$P-intro.jpg
ffprobe -v error -show_entries format=duration,size -of compact $D/$P-intro.mp4
