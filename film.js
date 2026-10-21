// "Basics with Block: Blocks and Distributed Ledgers" — Whiteboard Explainer, vertical 1080×1920, no voice, no subtitles.
// One tall board (4000 × 7600). Left column: hook → recipe card → the chain riding down. Right: the ledger and its copies.
// Bottom left: the sum. Every time below is on the 100 BPM grid (beat 0.6 s, bar 2.4 s); bar n starts at (n − 1) × 2.4 s.
import * as W from './engine/wb.js';
import { clamp, lerp, mulberry } from '/core/lib.js';

export const BPM = 100, BEAT = 60 / BPM, BAR = 4 * BEAT, END = 22 * BAR;   // 52.8 s
const INK = { black: '#23262c', green: '#2e8b57', red: '#c8363a' };
const bar = n => (n - 1) * BAR;                                            // downbeat of bar n

export async function build(VW, VH) {
  W.setView(VW, VH);
  await W.loadFont('tech', 'fonts/EMSTech.json');
  const q = new URLSearchParams(location.search);
  const tl = new W.Timeline();
  const K = new W.Pen('black', INK.black, { park: [VW + 260, VH * .62] });
  const K2 = new W.Pen('black2', INK.black, { park: [VW + 300, VH * .82] });
  const G = new W.Pen('green', INK.green, { park: [VW + 240, VH * .40] });
  const R = new W.Pen('red', INK.red, { park: [VW + 280, VH * .25] });
  const PENS = [K, K2, G, R];
  const D = (pen, shapes, a, b, o = {}) => tl.draw(pen, shapes, a, { by: b, ...o });   // draw inside a window [a, b]

  // every board text goes through T so TEXTS(t) can report it (same id = one block of text, parts joined)
  const TX = new Map();
  const T = (id, str, x, y, o = {}) => {
    const s = W.text(str, x, y, { w: Math.max(5, (o.h ?? 60) * .13), ...o });
    const e = TX.get(id) || { id, parts: [], strokes: [], hide: o.hide ?? 1e9 }; e.parts.push(str); e.strokes.push(...s); TX.set(id, e);
    return s;
  };

  // ───────── shapes
  const cube = (cx, cy, s, o = {}) => {                    // a block: front square, top and side faces
    const x = cx - s / 2, y = cy - s / 2, d = s * .3, oo = { w: 10, ...o };
    return [...W.rect(x, y, s, s, { over: 7, ...oo }),
      W.line(x, y, x + d, y - d, oo), W.line(x + d, y - d, x + s + d, y - d, oo), W.line(x + s + d, y - d, x + s, y, oo),
      W.line(x + s + d, y - d, x + s + d, y + s - d, oo), W.line(x + s + d, y + s - d, x + s, y + s, oo)];
  };
  const mascot = (cx, cy, s) => {                          // Block: a cube with stick arms and legs and two eyes, waving
    const x = cx - s / 2, y = cy - s / 2, d = s * .3, o = { w: Math.max(6, s * .055) };
    const eye = (ex, ey) => W.line(ex, ey, ex + s * .01, ey + s * .09, { w: s * .075, bow: 0, jitter: 0 });
    const hand = [x + s + d * .5 + s * .38, y + s * .02];
    return {
      body: [...cube(cx, cy, s, o), eye(x + s * .34, y + s * .36), eye(x + s * .62, y + s * .36),
        W.line(x + s * .3, y + s, x + s * .24, y + s * 1.42, o), W.line(x + s * .24, y + s * 1.42, x + s * .08, y + s * 1.45, o),
        W.line(x + s * .7, y + s, x + s * .76, y + s * 1.42, o), W.line(x + s * .76, y + s * 1.42, x + s * .92, y + s * 1.45, o),
        W.line(x, y + s * .55, x - s * .34, y + s * .9, o),
        W.line(x + s + d * .5, y + s * .45, ...hand, o)],
      waves: [W.arc(hand[0] + s * .05, hand[1] - s * .02, s * .18, -2.2, -.6, o), W.arc(hand[0] + s * .05, hand[1] - s * .02, s * .32, -2.3, -.5, o)],
    };
  };
  const book = (cx, cy, o = {}) => {                       // a record book: page, binding line, ruled rows
    const w = 720, h = 900, x = cx - w / 2, y = cy - h / 2, oo = { w: 8, ...o };
    return [...W.rect(x, y, w, h, { over: 6, ...oo }), W.line(x + 40, y + 12, x + 42, y + h - 12, { ...oo, w: 6 }),
      ...[0, 1, 2].map(k => W.line(x + 60, y + 238 + k * 140, x + w - 30, y + 236 + k * 140, { w: 4, alpha: .5 }))];
  };
  const ROWS = [['Ana → Ben', '5'], ['Ben → Cem', '2'], ['Cem → Ana', '1']];
  const rows = (id, cx, cy) => {                           // the ledger lines inside a book; returns strokes per row
    const x = cx - 360, y = cy - 450;
    return ROWS.map(([who, amt], k) => [...T(id + '.r' + k, who, x + 74, y + 200 + k * 140, { h: 52 }), ...T(id + '.a' + k, amt, x + 560, y + 200 + k * 140, { h: 52 })]);
  };

  // ghost marks: faint residue of old lessons
  const ghosts = [], gR = mulberry(31);
  for (let i = 0; i < 64; i++) {
    const x = gR() * 3700 + 150, y = gR() * 7300 + 150, k = gR();
    const o = { w: 12, alpha: .05 + gR() * .05, color: gR() < .2 ? '#8aa0c8' : '#9aa0a8' };
    if (k < .3) ghosts.push(...W.text(['x = 4', 'hash', 'TUE', 'q.3', 'p2p', 'nonce', 'due fri', '→ 12', 'ok!', '#0'][i % 10], x, y, { h: 50 + gR() * 40, ...o }));
    else if (k < .55) ghosts.push(W.circle(x, y, 40 + gR() * 110, o));
    else if (k < .8) ghosts.push(...W.arrow(x, y, x + (gR() - .5) * 500, y + (gR() - .5) * 300, o));
    else ghosts.push(W.line(x, y, x + 200 + gR() * 500, y + (gR() - .5) * 80, o));
  }

  // ═════════ 1 · HOOK (bars 1–2)
  tl.cue(.1, 'cap');
  D(K, T('hook', 'A BLOCK IS', 200, 820, { h: 110, w: 13 }), .2, .95, { minGap: .02, maxGap: .05 });
  D(K, T('hook', 'A CAKE.', 200, 1000, { h: 110, w: 13 }), 1.0, 1.78, { minGap: .02, maxGap: .05 });
  tl.cue(1.8, 'stop');
  const B0 = mascot(990, 960, 150);
  D(K, B0.body, 1.9, 2.95, { minGap: .02, maxGap: .06 });
  D(K, B0.waves[0], 3.0, 3.15); D(K, B0.waves[1], 3.6, 3.78);

  // ═════════ 2 · RECIPE (bars 3–6): one line per bar, one instrument per line
  D(K2, W.roundRect(170, 1240, 1060, 1120, 40, { w: 9 }), bar(3) - .55, bar(3) - .05);
  D(K, T('title', 'Recipe: one block', 220, 1370, { h: 72, w: 9 }), bar(3) + .05, bar(3) + 1.4, { minGap: .02, maxGap: .05 });
  D(K, W.curve([[220, 1405], [640, 1398], [1080, 1410]], { w: 8, over: 14 }), bar(3) + 1.45, bar(3) + 1.75);
  const L = [[1540, '1 cup transactions'], [1720, '½ cup timestamp'], [1900, '1 cup previous block']];
  // each line gets a tiny drawing beside it: a list, a clock, a cube with an arrow pointing back at it
  const ICON = [
    [W.roundRect(1012, 1478, 66, 82, 8, { w: 6 }), ...[0, 1, 2].map(k => W.line(1026, 1500 + k * 20, 1064, 1500 + k * 20, { w: 5 }))],
    [W.circle(1062, 1700, 40, { w: 6 }), W.line(1062, 1700, 1062, 1672, { w: 6, bow: 0 }), W.line(1062, 1700, 1082, 1708, { w: 6, bow: 0 })],
    [...cube(1070, 1886, 54, { w: 5 }), ...W.arrow(1212, 1886, 1132, 1886, { w: 5, head: 16 })]];
  L.forEach(([y, s], k) => {
    const a = bar(4 + k); tl.cue(a, 'ingredient', { k });
    D(K, T('ing' + k, s, 220, y, { h: 58, w: 7.5 }), a, a + 1.2, { minGap: .02, maxGap: .05 });
    D(K, ICON[k], a + 1.25, a + 1.75);
  });
  D(K, T('bake', 'Bake it.', 220, 2140, { h: 84, w: 10 }), bar(7), bar(7) + .6, { minGap: .02, maxGap: .05 });
  tl.cue(bar(7), 'ingredient', { k: 3 });

  // ═════════ 3 · BAKE (bars 7–8): ingredients circled into a bowl, an arrow drops, the block appears
  const C1 = [700, 2900], S = 340;
  D(K, W.circle(700, 1730, 545, { ry: 285, w: 9, a0: -2.6, lap: .3 }), bar(7) + .65, bar(7) + 1.15);
  tl.cue(bar(7) + .7, 'squeak');
  D(K, W.arrow(735, 1985, 720, 2585, { w: 9, head: 30 }), bar(7) + 1.2, bar(7) + 1.6);
  D(K, cube(...C1, S), bar(7) + 1.62, bar(8) - .3, { minGap: .02, maxGap: .05 });
  const x1 = C1[0] - S / 2, y1 = C1[1] - S / 2, dd = S * .3;
  D(K, W.hatch([[x1 + S, y1], [x1 + S + dd, y1 - dd], [x1 + S + dd, y1 + S - dd], [x1 + S, y1 + S]], { spacing: 22, w: 6 }), bar(8) - .28, bar(8) - .04);
  tl.cue(bar(8), 'ding');
  D(K, T('b1', '#1', 700, 2935, { h: 96, w: 11, align: 'center' }), bar(8) + .05, bar(8) + .32);
  D(K, T('b1label', 'Block #1', 700, 3170, { h: 64, w: 8, align: 'center' }), bar(8) + .4, bar(8) + .95);
  const MAG = [];                                          // magnets that lock each block: {x, y, t}
  MAG.push({ x: x1 + 26, y: y1 + 26, t: bar(8) + 1.2 });
  D(K, T('lock', 'locks it in place', 700, 3262, { h: 46, w: 6, align: 'center' }), bar(8) + 1.25, bar(8) + 2.0);

  // ═════════ 4 · CHAIN (bars 9–11): the pen draws the link down, the camera rides it, a block lands on each downbeat
  const C2 = [700, 4000], C3 = [700, 5100];
  D(K, W.arrow(700, 3312, 702, 3692, { w: 9, head: 30 }), bar(9) + .1, bar(9) + 1.1);
  D(K, cube(...C2, S), bar(9) + 1.15, bar(10) - .1, { minGap: .02, maxGap: .05 });
  D(K, T('b2', '#2', 700, 3990, { h: 90, w: 11, align: 'center' }), bar(10) - .05, bar(10) + .2);
  D(K, T('b2p', 'prev #1', 700, 4100, { h: 44, w: 6, align: 'center' }), bar(10) + .25, bar(10) + .6);
  MAG.push({ x: C2[0] - S / 2 + 26, y: C2[1] - S / 2 + 26, t: bar(10) });
  D(K, W.arrow(700, 4205, 698, 4792, { w: 9, head: 30 }), bar(10) + .65, bar(10) + 1.5);
  D(K, cube(...C3, S), bar(10) + 1.55, bar(11) - .1, { minGap: .02, maxGap: .05 });
  D(K, T('b3', '#3', 700, 5090, { h: 90, w: 11, align: 'center' }), bar(11) - .05, bar(11) + .2);
  D(K, T('b3p', 'prev #2', 700, 5200, { h: 44, w: 6, align: 'center' }), bar(11) + .25, bar(11) + .6);
  MAG.push({ x: C3[0] - S / 2 + 26, y: C3[1] - S / 2 + 26, t: bar(11) });
  D(G, T('chain', 'a chain of blocks', 700, 5400, { h: 56, w: 7, align: 'center' }), bar(10) + 1.3, bar(10) + 2.15, { minGap: .02, maxGap: .05 });
  D(G, T('chain', '= BLOCKCHAIN', 700, 5515, { h: 76, w: 9, align: 'center' }), bar(10) + 2.2, bar(11) + .3, { minGap: .02, maxGap: .05 });

  // ═════════ 5 · LEDGER (bars 12–13): whip right to a record book
  const LB = [2600, 4500];
  tl.cue(bar(12) - .15, 'whip');
  D(K, T('ltitle', "What's a ledger?", 2600, 3870, { h: 76, w: 9, align: 'center' }), bar(12) + .55, bar(12) + 1.4, { minGap: .02, maxGap: .05 });
  D(K2, book(...LB), bar(12) + .5, bar(12) + 1.2);
  const mainRows = rows('L', ...LB);
  mainRows.forEach((r, k) => D(K, r, bar(12) + 1.5 + k * .62, bar(12) + 2.05 + k * .62, { minGap: .02, maxGap: .05 }));
  D(K, [...T('def', 'who sent what,', LB[0] - 286, LB[1] + 230, { h: 42, w: 6 }), ...T('def', 'to whom, when', LB[0] - 286, LB[1] + 300, { h: 42, w: 6 })], bar(13) + .95, bar(13) + 2.1, { minGap: .02, maxGap: .05 });

  // ═════════ 6 · COPIES (bars 14–15): one book becomes nine
  const COLS = [1800, 2600, 3400], RWS = [4500, 5480, 6460];
  const copies = [];
  for (const y of RWS) for (const x of COLS) if (!(x === LB[0] && y === LB[1])) copies.push([x, y]);
  const CHEAT = 4;                                         // copies[4] = middle row, right column
  copies.forEach(([x, y], i) => {
    const pen = i < 4 ? K2 : K, a = bar(14) + .3 + (i % 4) * .55;
    D(pen, [...book(x, y), ...rows('C' + i, x, y).flat()], a, a + .5, { minGap: .006, maxGap: .015 });
    tl.cue(a, 'copy', { k: i });
  });
  D(G, T('shared', 'shared with everyone', 2600, 7140, { h: 110, w: 13, align: 'center' }), bar(14) + 1.05, bar(14) + 2.3, { minGap: .02, maxGap: .05 });

  // ═════════ 7 · CHEAT (bars 16–18): silence, one copy's 5 becomes 500, the others outvote it, the eraser rewinds
  const [cx, cy] = copies[CHEAT];
  const five = TX.get('C' + CHEAT + '.a0').strokes, fx1 = Math.max(...five.map(s => s.box[2]));
  const zeros = T('cheat', '00', fx1 + 2, cy - 450 + 200, { h: 52, color: INK.red, hide: bar(18) + 1.0 });
  const zx0 = Math.min(...zeros.map(s => s.box[0])) + 6, zx1 = Math.max(...zeros.map(s => s.box[2])) + 10;
  tl.cue(bar(16), 'silence', { dur: .8 });
  D(R, zeros, bar(16) + .8, bar(16) + 1.45, { minGap: .03, maxGap: .06 });
  tl.cue(bar(16) + .8, 'squeak', { red: 1 });
  const voters = [LB, ...copies.filter((_, i) => i !== CHEAT)];
  const tickAt = voters.map((_, k) => bar(17) + .6 + k * BEAT / 4);
  voters.forEach(([x, y], k) => { D(G, T('tick' + k, '✓', x + 190, y + 400, { h: 160, w: 16 }), tickAt[k], tickAt[k] + .12); tl.cue(tickAt[k], 'tick', { k }); });
  const crossAt = bar(17) + .6 + 8 * BEAT / 4 + .05;
  D(R, T('cross', '×', cx + 190, cy + 400, { h: 170, w: 16, color: INK.red }), crossAt, crossAt + .3);
  tl.cue(crossAt, 'cross');
  D(K, T('vote', '8 say 5 · 1 says 500', 2600, 7420, { h: 110, w: 13, align: 'center' }), crossAt + .35, crossAt + 1.4, { minGap: .02, maxGap: .05 });
  const rw0 = bar(18) + .2, rwDur = .8;                    // the eraser runs back over the "00"
  tl.erase(W.zigzag(zx0, cy - 450 + 200 - 62, zx1 - zx0, 74, 3), rw0, rwDur, { width: 46, strength: .92 });
  tl.cue(rw0, 'rewind', { dur: rwDur });

  // ═════════ 8 · SUM (bars 19–20) and 9 · END (bars 21–22), at the bottom left under the chain
  const EQ = 700;
  D(K, T('eq', 'BLOCKS', EQ, 6130, { h: 120, w: 14, align: 'center' }), bar(19) + 1.8, bar(19) + 2.45, { minGap: .02, maxGap: .05 });
  D(K, T('eq', '+ DISTRIBUTED LEDGER', EQ, 6300, { h: 58, w: 7.5, align: 'center' }), bar(20), bar(20) + 1.05, { minGap: .015, maxGap: .04 });
  D(G, T('eq', '= BLOCKCHAIN', EQ, 6480, { h: 84, w: 10, align: 'center' }), bar(20) + 1.1, bar(20) + 1.75, { minGap: .02, maxGap: .05 });
  D(G, W.circle(EQ + 10, 6445, 505, { ry: 100, w: 9, a0: -2.8, lap: .25 }), bar(20) + 1.8, bar(20) + 2.1);
  D(G, W.circle(EQ + 4, 6448, 520, { ry: 112, w: 8, a0: -2.5, lap: .2 }), bar(20) + 2.12, bar(21) - .02);
  tl.cue(bar(20) + 1.8, 'circle'); tl.cue(bar(20) + 2.12, 'circle', { k: 1 });
  D(K, T('sign', 'blackboardblock', EQ, 6830, { h: 64, w: 8, align: 'center' }), bar(21) + .2, bar(21) + 1.2, { minGap: .02, maxGap: .05 });
  const B1 = mascot(EQ - 30, 7150, 180);
  D(K, B1.body, bar(21) + 1.3, bar(21) + 2.3, { minGap: .02, maxGap: .06 });
  D(K, B1.waves[0], bar(22), bar(22) + .15); D(K, B1.waves[1], bar(22) + BEAT, bar(22) + BEAT + .18);
  tl.cue(bar(22) + 2 * BEAT, 'capOn');
  tl.end();

  // ───────── camera (t, x, y, zoom, rot, ease). Never past the board edge: |y − H/2| and |x − W/2| stay inside.
  const cam = new W.Camera([
    [0, 700, 960, 1.0],
    [4.6, 700, 930, 1.04, 0, 's'],                        // hook: slow push
    [bar(3) + .6, 700, 1700, .96, 0, 'io'],               // settle on the recipe card
    [bar(4), 700, 1730, .96, 0, 'l'],
    [bar(4) + .5, 700, 1760, .96, 0, 'io'],               // small tilt per line
    [bar(5), 700, 1765, .96, 0, 'l'],
    [bar(5) + .5, 700, 1795, .96, 0, 'io'],
    [bar(6), 700, 1800, .96, 0, 'l'],
    [bar(6) + .5, 700, 1830, .96, 0, 'io'],
    [bar(7) + 1.4, 700, 1840, .96, 0, 'l'],
    [bar(8) + .3, 700, 2860, 1.3, 0, 'io'],               // push into the block
    [bar(9) + .1, 700, 2930, 1.3, 0, 'l'],
    [bar(9) + 1.15, 700, 3560, 1.06, 0, 'io'],            // ride the arrow down…
    [bar(10), 700, 3980, 1.0, 0, 'io'],                   // …block #2 lands
    [bar(10) + .6, 700, 4040, 1.0, 0, 'l'],
    [bar(10) + 1.55, 700, 4680, 1.0, 0, 'io'],            // ride again
    [bar(11), 700, 5060, .98, 0, 'io'],
    [bar(12) - .05, 700, 5120, .98, 0, 'l'],
    [bar(12) + .35, 2600, 4380, 1.0, 0, 'io'],            // whip to the ledger
    [bar(14) - .1, 2600, 4400, 1.0, 0, 'l'],
    [bar(14) + .9, 2600, 5300, .42, 0, 'io'],             // pull back: nine books
    [bar(15) + 1.9, 2600, 5300, .43, 0, 'l'],
    [bar(16), 3390, 5420, .96, 0, 'io'],                  // into one copy…
    [bar(16) + 1.6, 3420, 5340, 1.12, 0, 'l'],            // …creeping through the silence
    [bar(17) - .1, 3420, 5340, 1.12, 0, 'l'],
    [bar(17) + .55, 2600, 5300, .42, 0, 'io'],            // pull back for the vote
    [bar(17) + 1.9, 2600, 5300, .42, 0, 'l'],
    [bar(18) + .15, 2770, 5800, .54, 0, 'io'],            // closer on the cheat copy and the count, for the eraser
    [bar(19), 2775, 5800, .55, 0, 'l'],
    [bar(19) + .8, 1990, 4085, .274, 0, 'io'],            // wide: the whole lesson, inside the board's edges
    [bar(19) + 1.3, 1990, 4085, .276, 0, 'l'],
    [bar(20) - .05, 700, 6600, 1.0, 0, 'io'],             // push down to the sum
    [bar(21), 700, 6610, 1.0, 0, 'l'],
    [END, 700, 6620, 1.02, 0, 's'],
  ]);

  const board = new W.Board(tl, { ghosts, W: 4000, H: 7600 });
  board.objs.push({ draw: (ctx, t, c) => { for (const m of MAG) if (t > m.t - .3) W.drawRoundMagnet(ctx, m.x, m.y, c, { size: 44, lift: clamp((m.t - t) / .3) }); } });
  board.objs.push({ draw: (ctx, t, c) => { for (const e of tl.erasers) W.drawEraser(ctx, e, t, c, { label: '#8d939b', size: 120 }); } });
  if (!q.has('nopens')) board.objs.push({ draw: (ctx, t, c) => { for (const p of PENS) W.drawMarker(ctx, p, W.penPose(p, t, cam), c, t); } });
  for (const m of MAG) tl.cue(m.t, 'magnet');

  // ───────── texts for readcheck: full text from its first stroke, box in screen px
  const texts = [...TX.values()].map(e => ({ id: e.id, text: e.parts.join(' '), t0: Math.min(...e.strokes.map(s => s.t0)), hide: e.hide, strokes: e.strokes,
    box: [Math.min(...e.strokes.map(s => s.box[0])), Math.min(...e.strokes.map(s => s.box[1])), Math.max(...e.strokes.map(s => s.box[2])), Math.max(...e.strokes.map(s => s.box[3]))] }));
  const TEXTS = t => {
    const c = cam.at(t), out = [];
    for (const e of texts) {
      if (t < e.t0 || t >= e.hide) continue;
      const [a, b, cc, d] = e.box, P = [[a, b], [cc, b], [a, d], [cc, d]].map(([x, y]) => W.toScreen(c, x, y));
      out.push({ id: e.id, text: e.text, x0: Math.min(...P.map(p => p[0])), y0: Math.min(...P.map(p => p[1])), x1: Math.max(...P.map(p => p[0])), y1: Math.max(...P.map(p => p[1])) });
    }
    return out;
  };
  for (const e of texts) if (e.hide < 1e9) for (const s of e.strokes) s.hide = t => t >= e.hide;   // erased text stops being drawn after the wipe

  // ───────── frame render with camera motion blur on fast moves
  const off = new OffscreenCanvas(VW, VH), oc = off.getContext('2d');
  const posterCam = new W.Camera([[0, 880, 4100, .62]]);         // poster: the chain, inside the board's edges
  function render(ctx, t) {
    if (q.has('poster')) { board.render(ctx, t, posterCam); return; }
    const dt = 1 / 24, a = cam.at(t), b = cam.at(Math.max(0, t - dt));
    const sp = Math.hypot((a.x - b.x) * a.z, (a.y - b.y) * a.z) + Math.abs(Math.log(a.z / b.z)) * 1100;
    const N = sp > 14 ? Math.min(12, Math.ceil(sp * .5 / 4)) : 1;       // 180° shutter, ≤ 4 px between sub-frames
    if (N === 1) { board.render(ctx, t, cam); return; }
    for (let i = 0; i < N; i++) {
      board.render(oc, t - dt * .5 * i / (N - 1), cam);
      ctx.globalAlpha = 1 / (i + 1); ctx.drawImage(off, 0, 0);
    }
    ctx.globalAlpha = 1;
  }

  const ev = tl.ev.slice().sort((a, b) => a.t - b.t);
  for (const e of ev) if (e.x != null) { const c = cam.at(e.t), [px, py] = W.toScreen(c, e.x, e.y); e.pan = +clamp((px - VW / 2) / (VW * .75), -.7, .7).toFixed(2); e.z = +c.z.toFixed(2); e.on = px > -100 && px < VW + 100 && py > -100 && py < VH + 100 ? 1 : 0; }
  return { dur: END, render, ev, texts: TEXTS, cam, tl,
    cues: { BPM, BEAT, BAR, tickAt, crossAt, rw0, rwDur, ding: bar(8), whip: bar(12) - .15, sil0: bar(16), sil1: bar(16) + .8, capOn: bar(22) + 2 * BEAT, magnets: MAG.map(m => m.t) } };
}
