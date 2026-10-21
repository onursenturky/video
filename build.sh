#!/bin/sh
# Blocks & Ledgers — rebuild the whole film from this folder: events → score → mix → frames → master → poster.
#   sh build.sh            (LIB below must point at the Lemo-Opuscar library: https://github.com/lemomo-ai/lemo-opuscar)
LIB=${LIB:-$HOME/lemo-opuscar}
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
# optional: PLAYWRIGHT_CHROME=/path/to/chrome-headless-shell when Playwright's own browser is not installed
SIZE="--size 1080x1920"
PY="$LIB/.venv/bin/python"
cd "$LIB"
node core/render/events.mjs "$HERE" $SIZE                                  # every stroke, wipe, magnet, cue → events.json
"$PY" "$HERE/music.py"                                                     # score (reads events.json) → music/score.wav
"$PY" "$HERE/mix.py"                                                       # foley + score + room → mix.wav
node core/render/video.mjs "$HERE" $SIZE --fps 24 --workers 4 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/mix.wav" "$HERE/block-ledgers.mp4" 24 1
node core/render/still.mjs "$HERE" 26.0 --q 'poster=1&nopens=1' $SIZE --prefix po_ --out "$HERE/out/stills"
cp "$HERE/out/stills/po_26.0.jpg" "$HERE/poster.jpg"
node core/render/readcheck.mjs "$HERE" $SIZE
echo "built $HERE/block-ledgers.mp4"
