# Blocks & Ledgers — whiteboard film (work in progress)

A 53-second vertical explainer of "Basics with Block: Blocks and Distributed Ledgers" (blackboardblock on Medium), made with the Lemo-Opuscar **Whiteboard Explainer** style.

## Brief (fixed)

- Source: https://blackboardblock.medium.com/basics-with-block-blocks-and-distributed-ledgers-ef7ec49010fb (the author's own article and character "Block").
- English. **No voice, no subtitles**: every word is handwritten on the board.
- Vertical 1080×1920, 24 fps, ~52 s, music + foley, −14 LUFS. No storyboard stop.

## Status

- [x] Library fetched, core + music tiers installed
- [x] `TREATMENT.md` written
- [x] Demo compared (DIRECTOR.md §11); post-comparison decisions now in `TREATMENT.md` (plucked/synth score at 100 BPM, one instrument per ingredient; signature shot = vertical track down the chain; no pull-back past the board edge)
- [x] `engine/wb.js` copied and made size-aware (`setView(w, h)`: ink canvas, `applyCam`, `toScreen`, `toWorld`, wall fill, wrapping sheen); round magnet prop added
- [x] Fonts: `fonts/EMSTech.json` (OFL, `fonts/OFL.txt`)
- [x] `index.html` + `film.js` (page contract: `DUR`, `render(t)`, `READY`, `EV`, `TEXTS`) → style frames → full build
- [x] `music.py`, `mix.py` → `build.sh` → rendered with `--size 1080x1920`, muxed at −14 LUFS, `readcheck.mjs` passes
- [x] Self-check and deliver: `block-ledgers.mp4`, `poster.jpg`, `TREATMENT.md`, `CREDITS`, `build.sh` + source. The film carries no library credit or watermark.

## Build

`sh build.sh` (set `LIB=` at its top, or in the environment, to the Lemo-Opuscar library; `PLAYWRIGHT_CHROME=` if Playwright's own browser isn't installed). Outputs `block-ledgers.mp4` and `poster.jpg`; work files go to `out/`.

## To continue elsewhere

Install the `lemo-opuscar` skill (or clone https://github.com/lemomo-ai/lemo-opuscar), run its `setup.sh` and `setup.sh deps music`, then `setup.sh demo whiteboard` to read the engine. Work in this folder; set `LIB=<library path>` at the top of `build.sh`.
