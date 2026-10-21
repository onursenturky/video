# Blocks & Ledgers — whiteboard film (work in progress)

A 50-second vertical explainer of "Basics with Block: Blocks and Distributed Ledgers" (blackboardblock on Medium), made with the Lemo-Opuscar **Whiteboard Explainer** style.

## Brief (fixed)

- Source: https://blackboardblock.medium.com/basics-with-block-blocks-and-distributed-ledgers-ef7ec49010fb (the author's own article and character "Block").
- English. **No voice, no subtitles**: every word is handwritten on the board.
- Vertical 1080×1920, 24 fps, ~52 s, music + foley, −14 LUFS. No storyboard stop.

## Status

- [x] Library fetched, core + music tiers installed (`sh <skill>/scripts/setup.sh deps music`)
- [x] `TREATMENT.md` written
- [x] Demo compared (DIRECTOR.md §11). Changes decided after the comparison, **not yet reflected in TREATMENT.md**:
  - Score: not the demo's clockwork marimba/woodblock at 120 BPM. Use `core/audio/pluck.py` presets **kalimba + music_box + upright_bass_pizz**, synthesized shaker, ~100 BPM, one instrument added per recipe ingredient.
  - Signature shot = the vertical track down the chain, riding the pen's arrow. The ending does **not** pull back past the board edge to the wall (that is the demo's ending); end on the circled equation, cap on, Block waves.
- [ ] Copy `styles/whiteboard/demo/engine/wb.js` into `engine/` and make it size-aware: it hard-codes 1920×1080 (ink canvas, `applyCam` 960/540, `toScreen`, `toWorld`, wall fill, sheen). Use 1080×1920.
- [ ] Fonts: copy `EMSTech.json` from the demo's `fonts/` (OFL; credit lines in the demo `CREDITS`).
- [ ] `index.html` + `film.js` (page contract: `DUR`, `render(t)`, `READY`, `EV`, `TEXTS`) → style frames → full build.
- [ ] `music.py`, `mix.py` (foley from `EV`; see the demo's `mix.py` for marker/magnet/eraser synthesis) → `build.sh` → render with `--size 1080x1920`.
- [ ] Self-check and deliver (DIRECTOR.md §11): `block-ledgers.mp4`, `poster.jpg`, `TREATMENT.md`, `CREDITS`, `build.sh`. No LemoLab credit in the film.

## To continue elsewhere

Install the `lemo-opuscar` skill (or clone https://github.com/lemomo-ai/lemo-opuscar), run its `setup.sh` and `setup.sh deps music`, then `setup.sh demo whiteboard` to read the engine. Work in this folder; set `LIB=<library path>` at the top of `build.sh`.
