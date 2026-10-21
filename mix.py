"""Foley + score → mix.wav (no voice). Every stroke on the board makes its own marker sound, shaped by the engine's
hand-speed curve; pan follows the stroke's screen x, closer camera = louder.
Layers: room tone | foley (marker, magnets, eraser, ding, cap, whooshes) | score (silence before the cheat, rewind on the eraser)."""
import sys, os, json, numpy as np, soundfile as sf
LIB = os.environ.get('LIB') or sys.exit('set LIB to the Lemo-Opuscar library folder')
sys.path.insert(0, LIB)
from core.audio.sfx import SR, bp, lp, hp, add, limit
from core.audio import sampler as S
HERE = os.path.dirname(os.path.abspath(__file__))
ev = json.load(open(os.path.join(HERE, 'events.json'))); E = ev['ev']; DUR = ev['dur']
C = next(e for e in E if e['type'] == 'cues'); BAR = C['BAR']
rng = np.random.default_rng(11)
NS = int((DUR + 1) * SR)
fol, room = np.zeros((NS, 2), np.float32), np.zeros((NS, 2), np.float32)
tt = lambda d: np.arange(int(d * SR)) / SR
def db(x): return 10 ** (x / 20)
def dec(d, tau): return np.exp(-tt(d) / tau)
SIL0, SIL1 = C['sil0'], C['sil1']
quiet = lambda t: SIL0 - .05 <= t < SIL1 - .02                    # the silence before the cheat: room tone only

# ───────── marker on a glossy board
_band = {}
def band(n, lo, hi):                                      # cached long filtered noise, sliced randomly
    k = (lo, hi)
    if k not in _band: _band[k] = bp(rng.standard_normal(SR * 8), lo, hi, 2).astype(np.float32)
    b = _band[k]; i = int(rng.integers(0, len(b) - n - 1)); return b[i:i + n]
def squeak(d, br=1.):
    m = int(d * SR); ts = np.arange(m) / SR; f0 = rng.uniform(1500, 2600) * br
    f = f0 * (1 + .03 * np.sin(2 * np.pi * rng.uniform(7, 13) * ts) + .05 * rng.standard_normal() * ts / d)
    sq = np.sin(2 * np.pi * np.cumsum(f) / SR) + .3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return sq * np.sin(np.pi * ts / d) ** 1.5 * .35
def marker(dur, length, kind, pen, z=1., force_squeak=False):
    d = max(.03, dur); n = int(d * SR); u = np.linspace(0, 1, n)
    v = 1 - .8 * np.cos(2 * np.pi * u)                    # hand speed (the engine's prog derivative)
    a = (v / 1.8) ** .8 * np.minimum(1, u * d / .006) * np.minimum(1, (1 - u) * d / .012)
    br = {'black': 1.0, 'black2': .97, 'green': .94, 'red': 1.1}.get(pen, 1.)   # each colour sounds slightly different
    hiss = band(n, 2200 * br, 7500 * br) * (.55 + .45 * v / 1.8)       # felt on gloss
    body = band(n, 500 * br, 1500 * br) * .45
    grain = (rng.random(n) < .004 * (1 + v)) * rng.standard_normal(n) * .8   # stick-slip ticks
    x = (hiss + body + bp(grain, 1500, 6000)) * a
    if force_squeak or (kind != 'dash' and length > 160 and rng.random() < .22):   # the dry-erase squeak
        s0 = rng.uniform(.15, .45) * d; sd = min(d - s0, rng.uniform(.08, .18) * (2 if force_squeak else 1))
        if sd > .03: i0 = int(s0 * SR); q = squeak(sd, br); x[i0:i0 + len(q)] += q[:len(x) - i0]
    k = int(.004 * SR); x[:k] += bp(rng.standard_normal(k), 2500, 6500) * np.linspace(1, 0, k) * 1.4   # nib lands
    return x * .32 * min(1.3, z ** .5)
def tap(z=1.):
    n = int(.03 * SR); return bp(rng.standard_normal(n), 1800, 6000) * dec(.03, .004) * .36 * min(1.3, z ** .5)

# ───────── props
def ring(fs, taus, amps, d):
    x = np.zeros(int(d * SR)); t = tt(d)
    for f, ta, am in zip(fs, taus, amps): x += np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * np.exp(-t / ta) * am
    return x
def magnet():                                             # click + steel face modes + board body thump
    d = .5; x = np.zeros(int(d * SR))
    c = bp(rng.standard_normal(int(.005 * SR)), 2000, 9000) * np.linspace(1, 0, int(.005 * SR)) * 1.5; x[:len(c)] += c
    x += ring([830, 1370, 2210, 3120], [.07, .05, .035, .02], [.35, .25, .15, .08], d)
    x += ring([140], [.1], [1.0], d) * .9
    return x * .7
def bell():                                               # the oven ding: long ring, runs over the first chain arrow (L-cut)
    d = 3.2; t = tt(d)
    x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / ta) for f, a, ta in [(1318.5, 1, 1.3), (2637, .45, .7), (3955, .22, .35), (1976, .2, .9), (5274, .1, .2)])
    return x * np.minimum(1, t / .002) * .5
def cap_pop():
    d = .25; x = np.zeros(int(d * SR))
    sl = bp(rng.standard_normal(int(.07 * SR)), 1200, 5000) * np.linspace(.2, 1, int(.07 * SR)) * .35; x[:len(sl)] += sl
    i = int(.07 * SR); p = ring([1750, 3400], [.03, .012], [.8, .3], d - .07); x[i:i + len(p)] += p
    x[i:i + 60] += rng.standard_normal(60) * .9
    return x * .6
def cap_on():
    d = .2; x = np.zeros(int(d * SR))
    for k, o in enumerate([0, .045]):
        i = int(o * SR); c = bp(rng.standard_normal(int(.006 * SR)), 2500, 9000) * np.linspace(1, 0, int(.006 * SR)); x[i:i + len(c)] += c * (1 - .4 * k)
        r = ring([2600], [.015], [.4], .06); x[i:i + len(r)] += r
    return x * .8
def eraser(d):                                            # felt rub, modulated by the zig-zag (and a little faster: a rewind)
    n = int(d * SR); t = tt(d)
    base = bp(rng.standard_normal(n), 250, 2600) * .6 + bp(rng.standard_normal(n), 2500, 6000) * .15
    mod = .45 + .55 * np.abs(np.sin(np.pi * t / d * 6))
    return base * mod * np.minimum(1, t / .04) * np.minimum(1, (d - t) / .06) * .55
def whoosh(d, v=1.):
    n = int(d * SR); t = tt(d); sh = np.sin(np.pi * t / d) ** 2
    return bp(rng.standard_normal(n), 300, 2400) * sh * .35 * v

def put(buf, x, t, g=1., pan=0.):
    if t < 0 or t >= DUR: return
    add(buf, np.asarray(x, np.float32), t, g, pan)

# ───────── place foley from events
sq_red = {round(e['t'], 2) for e in E if e['type'] == 'squeak' and e.get('red')}
sq_t = [e['t'] for e in E if e['type'] == 'squeak']
for e in E:
    ty, t = e['type'], e['t']; pan = e.get('pan', 0); z = e.get('z', 1); off = db(-9) if e.get('on', 1) == 0 else 1
    if ty in ('stroke', 'write', 'dash'):
        fs = any(abs(t - s) < .12 for s in sq_t)              # "Bake it." circle and the red "00" squeak on purpose
        put(fol, marker(e['dur'], e['len'], ty, e.get('pen'), z, fs), t, off * (.8 if ty == 'write' else 1.) * (1.15 if e.get('pen') == 'red' else 1), pan)
    elif ty == 'tap': put(fol, tap(z), t, off, pan)
    elif ty == 'magnet': put(fol, magnet(), t, .6, -.1)
    elif ty == 'erase': put(fol, eraser(e['dur']), t, 1.3, .25)
    elif ty == 'ding': put(fol, bell(), t, .4, 0)
    elif ty == 'cap': put(fol, cap_pop(), t, .55, .35)
    elif ty == 'capOn': put(fol, cap_on(), t, .6, .4)

# pens flying in / out of frame: a soft air pass after or before a long gap (never inside the silence)
by_pen = {}
for e in E:
    if e['type'] in ('stroke', 'write', 'dash', 'tap'): by_pen.setdefault(e['pen'], []).append(e)
for pen, L in by_pen.items():
    L.sort(key=lambda e: e['t'])
    for a, b in zip(L, L[1:]):
        if b['t'] - (a['t'] + a['dur']) > .75:
            if not quiet(a['t'] + a['dur']): put(fol, whoosh(.38, .3), a['t'] + a['dur'], 1, .5)
            if not quiet(b['t'] - .42): put(fol, whoosh(.42, .4), b['t'] - .42, 1, .4)
    put(fol, whoosh(.42, .4), L[0]['t'] - .42, 1, .4)

# camera moves: the whip (J-cut: it starts before the camera leaves the chain) and the big pull-backs
put(fol, whoosh(.75, 1.2), C['whip'], 1, .3)
for t0, d, v in [(BAR * 13 - .1, 1.0, .35), (BAR * 16 - .1, .7, .35), (BAR * 18, .85, .4), (BAR * 18 + 1.3, 1.2, .3)]:   # copies, vote, wide, push to the sum
    put(fol, whoosh(d, v), t0, 1, 0)

# ───────── room tone (the only sound in the silence)
rt = lp(rng.standard_normal(NS), 900) * .010 + lp(rng.standard_normal(NS), 180) * .012
room[:, 0] += rt; room[:, 1] += np.roll(rt, 311)
room = S.room(room, size=.35, mix=.25)

# ───────── score: full stop before the cheat; the eraser = bar 15 reversed and squeezed
mus, _ = sf.read(os.path.join(HERE, 'music/score.wav')); mus = mus[:NS].astype(np.float32)
if len(mus) < NS: mus = np.pad(mus, ((0, NS - len(mus)), (0, 0)))
a, b = int(BAR * 14 * SR), int(BAR * 15 * SR); seg = mus[a:b][::-1]
k = int(C['rwDur'] * SR); idx = np.linspace(0, len(seg) - 1, k)
rw = np.stack([np.interp(idx, np.arange(len(seg)), seg[:, c]) for c in range(2)], 1) * np.sin(np.pi * np.linspace(0, 1, k))[:, None] ** .5
i0, i1, f = int(SIL0 * SR), int(SIL1 * SR), int(.12 * SR)
mus[i0 - f:i0] *= np.linspace(1, 0, f)[:, None]; mus[i0:i1] = 0
i = int(C['rw0'] * SR); mus[i:i + k] += rw * .8
fol[i0:i1] = 0                                             # nothing but the room in the silence

# ───────── balance by RMS: foley on top (it is the voice of this film), score just under it
def rms(x): v = x[np.abs(x).max(1) > 1e-4]; return float(np.sqrt(np.mean(v ** 2))) if len(v) else 1.
fo_r, mu_r = rms(fol), rms(mus)
music = mus * (fo_r / mu_r) * db(-1.5)
mixd = fol + music + room * db(2)
mixd = np.stack([limit(mixd[:, c], .64) for c in range(2)], 1)   # headroom: mux.sh lifts it to −14 LUFS
# mux.sh compares the decoded length (loudnorm's progress, which lags ~3 s behind its look-ahead) with the file's length,
# allowing 5 %: a film under ~60 s trips it. Pad with digital silence (gated out of the loudness, cut at the picture's end).
out = mixd[:int(DUR * SR)].astype(np.float32)
sf.write(os.path.join(HERE, 'mix.wav'), np.pad(out, ((0, max(0, int(61 * SR) - len(out))), (0, 0))), SR)
stems = os.path.join(HERE, 'out/stems'); os.makedirs(stems, exist_ok=True)
for name, x in [('music', music), ('foley', fol), ('room', room * db(2))]:
    sf.write(os.path.join(stems, name + '.wav'), x[:int(DUR * SR)].astype(np.float32), SR)
print('rms foley/music', round(20 * np.log10(fo_r), 1), round(20 * np.log10(mu_r), 1), 'peak', round(float(np.abs(mixd).max()), 3))
