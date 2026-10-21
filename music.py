"""Original score for "Blocks & Ledgers": plucked and synthesized, 100 BPM, F major (the ledger moves to B-flat).
Kalimba ostinato + music box + upright bass pizzicato (core/audio/pluck.py) + a synthesized shaker.
One instrument enters per recipe ingredient; full stop into silence before the cheat. Reads events.json; writes music/score.wav."""
import sys, os, json, numpy as np, soundfile as sf
LIB = os.environ.get('LIB') or sys.exit('set LIB to the Lemo-Opuscar library folder')
sys.path.insert(0, LIB)
from core.audio import pluck as P
from core.audio.sfx import SR, bp, add
from core.audio import sampler as S
HERE = os.path.dirname(os.path.abspath(__file__))
ev = json.load(open(os.path.join(HERE, 'events.json'))); E = ev['ev']; DUR = ev['dur']
C = next(e for e in E if e['type'] == 'cues'); B = C['BEAT']; BAR = C['BAR']
cues = lambda typ: [e for e in E if e['type'] == typ]
bar = lambda n: (n - 1) * BAR                                       # downbeat of bar n
NS = int((DUR + 3) * SR); mix = np.zeros((NS, 2), np.float32)
rng = np.random.default_rng(5)
_cache = {}
def note(inst, p, t, d=None, v=.7, pan=0., g=1.):
    if t < 0 or t >= DUR: return
    k = (inst, p, d, round(v, 2))
    if k not in _cache: _cache[k] = P.pluck(inst, p, d, vel=v)
    add(mix, _cache[k], t, g, pan)
def shaker(t, v=.5, pan=.15):                                       # synthesized: band-passed noise grain, fast attack
    n = int(.07 * SR); tt = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 4200, 11000) * np.minimum(1, tt / .006) * np.exp(-tt / .022)
    add(mix, (x * .22 * v).astype(np.float32), t, 1, pan)

# ── harmony
CH = {'F': ['F', 'A', 'C'], 'C': ['C', 'E', 'G'], 'Dm': ['D', 'F', 'A'], 'Bb': ['Bb', 'D', 'F'], 'Gm': ['G', 'Bb', 'D'],
      'Eb': ['Eb', 'G', 'Bb'], 'Am': ['A', 'C', 'E'], 'Gsus': ['G', 'C', 'D']}
ROOT = {'F': 'F2', 'C': 'C2', 'Dm': 'D2', 'Bb': 'Bb1', 'Gm': 'G1', 'Eb': 'Eb2', 'Am': 'A1', 'Gsus': 'G1'}
def m(p): return P.midi(p)
def ost(b, ch, v=.55, pan=-.2, octv=4, half=False):                   # kalimba 8ths: r 5 8 5 10 5 8 5
    r, t3, f5 = (m(CH[ch][i] + str(octv)) for i in range(3))
    if t3 < r: t3 += 12
    if f5 < r: f5 += 12
    fig = [r, f5, r + 12, f5, t3 + 12, f5, r + 12, f5]
    for i, p in enumerate(fig):
        if half and i % 2: continue
        note('kalimba', p, bar(b) + i * B / 2, .5, v * (1 if i % 4 == 0 else .8), pan)
def bass(b, ch, v=.8, walk=True):
    r = m(ROOT[ch]); note('upright_bass_pizz', r, bar(b), .5, v, 0)
    if walk: note('upright_bass_pizz', r + 7, bar(b) + 2 * B, .4, v * .8, 0); note('upright_bass_pizz', r + 12, bar(b) + 3.5 * B, .2, v * .6, 0)
def shake(b, v=.5, bars=1):
    for i in range(16 * bars): shaker(bar(b) + i * B / 4, v * (1 if i % 4 == 0 else .55 if i % 2 == 0 else .35))
THEME = [(0, 'C6', 1), (1, 'A5', 1), (2, 'F5', .5), (2.5, 'G5', .5), (3, 'A5', 1),          # music box, two bars
         (4, 'G5', 1), (5, 'E5', 1), (6, 'C5', 2)]
THEME2 = [(0, 'D6', 1), (1, 'C6', 1), (2, 'A5', .5), (2.5, 'Bb5', .5), (3, 'C6', 1), (4, 'A5', 1.5), (5.5, 'G5', .5), (6, 'F5', 2)]
def theme(b, th=THEME, v=.5, pan=.3, k=0):
    for o, p, d in th: note('music_box', m(p) + k, bar(b) + o * B, d * B, v, pan)

# ── 1–2 hook: kalimba alone; a music-box ping on the full stop
ost(1, 'F', .45, half=True); ost(2, 'C', .5)
note('music_box', 'F6', next(e['t'] for e in cues('stop')), 1.2, .6, .35)
# ── 3–6 recipe: + one instrument per line
PROG = ['F', 'Dm', 'Bb', 'C']
for i, b in enumerate(range(3, 7)): ost(b, PROG[i], .55)
theme(4, v=.45)                                                     # line 1 (7.2): + music box
for b in (5, 6): bass(b, PROG[b - 3])                               # line 2 (9.6): + bass
for i in range(8): note('music_box', ['A6', 'C7', 'F6', 'C7', 'G6', 'C7', 'E6', 'C7'][i], bar(6) + .5 * B + i * B / 2, .2, .3, .45)   # line 3: counter-line
# ── 7–8 bake: "Bake it." = + shaker; hold F, kalimba run up into the ding
shake(7, .55, 2)
for b in (7, 8): bass(b, 'F', .8, walk=b == 7)
for p in ['F4', 'A4', 'C5', 'F5']: note('kalimba', p, bar(7), 2.2, .5, -.2)
for i, p in enumerate(['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'C6', 'F6']): note('kalimba', p, bar(7) + 1.2 + i * .1, .3, .4 + .03 * i, -.3 + .05 * i)
ding = C['ding']
for p in ['F3', 'C4', 'F4', 'A4', 'C5', 'F5']: note('kalimba', p, ding, 2.0, .45, -.1)
note('upright_bass_pizz', 'F1', ding, 1.0, .8, 0)
note('music_box', 'C7', ding + .3, .6, .35, .4); note('music_box', 'F7', ding + .6, .8, .3, .4)
# ── 9–11 chain: full groove; each block lands on a downbeat with a low bass note
for i, (b, ch) in enumerate([(9, 'F'), (10, 'Dm'), (11, 'Bb')]):
    ost(b, ch, .6); bass(b, ch, .85); shake(b, .6)
theme(9, v=.48); theme(11, THEME2[:5], v=.48)
for t in C['magnets'][1:]: note('upright_bass_pizz', 'F1' if t < 23 else 'D1', t, .9, .8, 0)
for b in (9, 10, 11): note('kalimba', 'C4' if b != 11 else 'D4', bar(b), 1.2, .55, .1)
# ── 12–13 ledger: B-flat, thinner: kalimba + shaker only
for b, ch in [(12, 'Bb'), (13, 'Gm')]: ost(b, ch, .5, pan=-.1); shake(b, .4)
note('music_box', 'Bb6', bar(12) + .55, 1.0, .45, .3)               # the whip lands
# ── 14–15 copies: one music-box note per copy, over kalimba + bass in B-flat
for b, ch in [(14, 'Eb'), (15, 'F')]: ost(b, ch, .45, half=True); bass(b, ch, .7, walk=False); shake(b, .35)
ARP = ['Bb5', 'D6', 'F6', 'Bb6', 'D7', 'F7', 'G6', 'Bb6']
for e in cues('copy'): note('music_box', ARP[e['k']], e['t'], .4, .5, -.4 + .1 * e['k'])
# ── 16–18 cheat: full stop 36.0–36.8 (mix.py keeps it clean); the ticks come back as pings; the cross is a low thud
for k, t in enumerate(C['tickAt']): note('music_box', ['F5', 'A5', 'C6', 'F6', 'A6', 'C7', 'F7', 'A7'][k], t, .4, .5, -.35 + .1 * k)
note('upright_bass_pizz', 'B0', C['crossAt'], 1.2, 1.0, 0); note('kalimba', 'B3', C['crossAt'], 1.0, .5, 0); note('kalimba', 'F4', C['crossAt'], 1.0, .45, 0)
note('upright_bass_pizz', 'C2', bar(17), 1.0, .5, 0)
ost(18, 'Gsus', .38, half=True); bass(18, 'C', .6, walk=False)
# (the eraser's rewind = bar 15 reversed and squeezed, placed in mix.py)
# ── 19–20 sum: everything back in F, a rising bass line, the theme an octave up
for b, ch in [(19, 'F'), (20, 'C')]: ost(b, ch, .62); shake(b, .6)
theme(19, v=.55)
for i, p in enumerate(['F1', 'G1', 'A1', 'Bb1', 'C2', 'D2', 'E2', 'F2']): note('upright_bass_pizz', p, bar(19) + i * 2 * B, .9, .85, 0)
circ = [e['t'] for e in cues('circle')]
for t in circ: note('music_box', 'F7', t, .6, .5, .3); note('kalimba', 'C6', t + .1, .6, .45, .2)
# ── 21–22 end: the ostinato thins to one note; ring-out under the cap
ost(21, 'F', .5); bass(21, 'F', .7, walk=False)
for i in range(4): note('kalimba', 'F5' if i < 3 else 'C5', bar(22) + i * B, .8, .45 - .06 * i, -.2)
for p in ['F3', 'C4', 'A4', 'F5']: note('kalimba', p, C['capOn'], 3.0, .45, 0)
note('upright_bass_pizz', 'F1', C['capOn'], 2.0, .7, 0); note('music_box', 'C7', C['capOn'] + .3, 1.5, .35, .35)

mix = S.room(mix, size=.35, mix=.14)
os.makedirs(os.path.join(HERE, 'music'), exist_ok=True)
sf.write(os.path.join(HERE, 'music/score.wav'), mix[:int((DUR + 1) * SR)], SR)
print('score peak', round(float(np.abs(mix).max()), 3), 'notes cached', len(_cache))
