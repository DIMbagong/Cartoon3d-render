#!/bin/bash
# Segmented full render, resumable: skips segments whose mp4 already exists.
cd ~/workspace/cartoon3d-test || exit 1
export CHROME_PATH=~/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
export REMOTION_TMP=~/workspace/.tmp/remotion-tmp TMPDIR=~/workspace/.tmp
export GL_MODE=swangle COMP_ID=BridgeShort720
RANGES=("0 202" "203 405" "406 608" "609 811" "812 1014" "1015 1216" "1217 1418" "1419 1620" "1621 1822" "1823 2024")
i=0
for r in "${RANGES[@]}"; do
  set -- $r
  out="out/seg-$i.mp4"
  if [ -s "$out" ]; then echo "SEG $i SKIP (exists)"; else
    echo "SEG $i START frames $1-$2 $(date +%H:%M:%S)"
    node scripts/render.mjs "$1" "$2" 1 "$out" 1 >> out/render-all.log 2>&1 \
      && echo "SEG $i DONE $(date +%H:%M:%S)" || echo "SEG $i FAILED $(date +%H:%M:%S)"
  fi
  i=$((i+1))
done
echo "ALL SEGMENTS PROCESSED $(date +%H:%M:%S)"
