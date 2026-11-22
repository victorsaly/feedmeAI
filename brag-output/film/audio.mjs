/*
 * The soundtrack, written as one piece: the interface sounds are notes in the
 * same key as the music and go through the same reverb, so they sit inside the
 * track rather than on top of it. Every cue time below is a real moment in the
 * footage (magnets landing, the two ticks, the price reveal), not a guess.
 *
 * C major, 100bpm. Out: brag-audio.wav, 48k stereo, 20.5s + tail.
 */
import fs from 'node:fs'

const SR = 48000, DUR = 21.2, N = Math.round(SR * DUR)
const L = new Float64Array(N), R = new Float64Array(N)

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12)           // midi → Hz
const C4 = 60
const add = (buf, i, v) => { if (i >= 0 && i < N) buf[i] += v }

/* one-pole lowpass, per voice */
function lp(x, state, cut) {
  const a = Math.exp(-2 * Math.PI * cut / SR)
  state.y = (1 - a) * x + a * state.y
  return state.y
}

/* ---- voices ------------------------------------------------------------ */

function pad(tStart, midis, dur, gain) {
  const s = Math.round(tStart * SR), len = Math.round(dur * SR)
  const st = { y: 0 }
  for (const m of midis) {
    for (const det of [-0.055, 0, 0.055]) {
      const f = NOTE(m + det)
      let ph = Math.random() * 6.283
      for (let i = 0; i < len; i++) {
        const t = i / SR
        const env = Math.min(1, t / 0.55) * Math.min(1, (dur - t) / 0.7)
        if (env <= 0) continue
        ph += 2 * Math.PI * f / SR
        const v = lp(Math.sin(ph) * 0.6 + Math.sin(ph * 2) * 0.12, st, 1400) * env * gain
        add(L, s + i, v * 0.55); add(R, s + i, v * 0.55)
      }
    }
  }
}

function bass(tStart, midi, dur, gain) {
  const s = Math.round(tStart * SR), len = Math.round(dur * SR)
  const f = NOTE(midi); let ph = 0
  for (let i = 0; i < len; i++) {
    const t = i / SR
    const env = Math.min(1, t / 0.02) * Math.exp(-t * 1.5) * Math.min(1, (dur - t) / 0.15)
    ph += 2 * Math.PI * f / SR
    const v = (Math.sin(ph) + Math.sin(ph * 2) * 0.10) * env * gain
    add(L, s + i, v); add(R, s + i, v)
  }
}

/* marimba-ish: fast attack, short decay, second harmonic */
function pluck(tStart, midi, gain, decay = 2.8, panL = 0.5) {
  const s = Math.round(tStart * SR), len = Math.round(1.1 * SR)
  const f = NOTE(midi); let ph = 0
  for (let i = 0; i < len; i++) {
    const t = i / SR
    const env = Math.min(1, t / 0.004) * Math.exp(-t * decay)
    ph += 2 * Math.PI * f / SR
    const v = (Math.sin(ph) + Math.sin(ph * 2.01) * 0.26 + Math.sin(ph * 3) * 0.06) * env * gain
    add(L, s + i, v * (1 - panL)); add(R, s + i, v * panL)
  }
}

function kick(tStart, gain) {
  const s = Math.round(tStart * SR), len = Math.round(0.22 * SR)
  let ph = 0
  for (let i = 0; i < len; i++) {
    const t = i / SR
    const f = 115 * Math.exp(-t * 26) + 48
    ph += 2 * Math.PI * f / SR
    const v = Math.sin(ph) * Math.exp(-t * 11) * gain
    add(L, s + i, v); add(R, s + i, v)
  }
}

/* brushed noise, kept back in the mix */
function brush(tStart, gain, dur = 0.06) {
  const s = Math.round(tStart * SR), len = Math.round(dur * SR)
  const st = { y: 0 }
  for (let i = 0; i < len; i++) {
    const t = i / SR
    const env = Math.exp(-t * 34)
    const v = lp((Math.random() * 2 - 1), st, 5200) * env * gain
    add(L, s + i, v * 0.9); add(R, s + i, v * 1.1)
  }
}

/* the interface tick: a note, not a beep */
function tick(tStart, midi, gain, pan = 0.5) {
  const s = Math.round(tStart * SR), len = Math.round(0.5 * SR)
  const f = NOTE(midi); let ph = 0
  for (let i = 0; i < len; i++) {
    const t = i / SR
    const env = Math.min(1, t / 0.002) * Math.exp(-t * 13)
    ph += 2 * Math.PI * f / SR
    const v = (Math.sin(ph) + Math.sin(ph * 3) * 0.10) * env * gain
    add(L, s + i, v * (1 - pan) * 2); add(R, s + i, v * pan * 2)
  }
}

function swell(tStart, dur, gain) {
  const s = Math.round(tStart * SR), len = Math.round(dur * SR)
  const st = { y: 0 }
  for (let i = 0; i < len; i++) {
    const t = i / SR, x = t / dur
    const env = Math.sin(Math.PI * x) ** 2
    const v = lp(Math.random() * 2 - 1, st, 900 + 2600 * x) * env * gain
    add(L, s + i, v); add(R, s + i, v)
  }
}

/* ---- the arrangement --------------------------------------------------- */

const BEAT = 0.6                                  // 100bpm
const CHORDS = [                                  // [t, root midi, triad]
  [0.00, C4, [C4, C4 + 7, C4 + 12]],              // C  — sparse hook
  [2.40, C4, [C4, C4 + 4, C4 + 7, C4 + 12]],      // C  — the photo goes in
  [4.80, C4 + 7, [C4 + 7, C4 + 11, C4 + 14]],     // G
  [7.20, C4 + 9, [C4 + 9, C4 + 12, C4 + 16]],     // Am — the recipe
  [9.60, C4 + 5, [C4 + 5, C4 + 9, C4 + 12]],      // F
  [12.00, C4, [C4, C4 + 4, C4 + 7, C4 + 12]],     // C  — the list
  [14.40, C4 + 7, [C4 + 7, C4 + 11, C4 + 14]],    // G  — the prices
  [16.80, C4, [C4, C4 + 4, C4 + 7, C4 + 12, C4 + 16]], // C — land it
]

CHORDS.forEach(([t, root, notes], i) => {
  const end = i < CHORDS.length - 1 ? CHORDS[i + 1][0] : 20.9
  pad(t, notes, end - t + 0.35, i === 0 ? 0.085 : 0.115)
  if (t >= 2.4) bass(t, root - 24, Math.min(end - t, 1.6), 0.30)
})

/* pulse: in at the photo, out under the outro */
for (let b = 0; b * BEAT + 2.4 < 17.6; b++) {
  const t = 2.4 + b * BEAT
  kick(t, t < 6.0 ? 0.20 : 0.26)
  if (b % 2 === 1) brush(t + BEAT / 2, 0.055)
  if (t > 13.8) brush(t + BEAT / 4, 0.035, 0.04)   // lift for the shops
}

/* the motif — pentatonic, so nothing can clash with the ticks */
const PENT = [0, 2, 4, 7, 9, 12, 14, 16]
const motif = [0, 4, 2, 7, 4, 9, 7, 12]
for (let b = 0; b < 26; b++) {
  const t = 2.4 + b * BEAT
  if (t > 17.4) break
  const deg = motif[b % motif.length] + (t >= 7.2 && t < 12 ? 2 : 0)
  pluck(t, C4 + 12 + deg, t < 6 ? 0.075 : 0.10, 3.1, b % 2 ? 0.62 : 0.38)
  if (t >= 13.8) pluck(t + BEAT / 2, C4 + 19 + PENT[b % PENT.length] % 12, 0.05, 4.2, b % 2 ? 0.3 : 0.7)
}

/* ---- the interface, in key --------------------------------------------- */

/* ten ingredients landing on the door: 3.02 → 3.72 in the footage */
const RIPPLE = [0, 4, 7, 9, 12, 16]   // six magnets on the door now
RIPPLE.forEach((deg, i) => tick(3.02 + i * 0.07, C4 + 24 + deg, 0.055, i / 5))

/* the two + taps, and the recipe opening */
tick(6.55, C4 + 24, 0.05, 0.5)
tick(10.30, C4 + 28, 0.075, 0.35)
tick(10.85, C4 + 31, 0.075, 0.65)

/* the cut to the list, and the prices landing */
swell(12.02, 0.30, 0.055)
tick(12.28, C4 + 24, 0.05, 0.5)
tick(13.60, C4 + 26, 0.05, 0.5)   // "Find the cheapest shop"
tick(15.90, C4 + 28, 0.04, 0.6)   // all shops
swell(14.20, 0.34, 0.05)
;[0, 4, 7, 14].forEach((d, i) => pluck(14.42 + i * 0.055, C4 + 12 + d, 0.10, 2.2, 0.5))

/* the outro lands */
;[0, 7, 12, 16, 19].forEach((d, i) => pluck(17.62 + i * 0.045, C4 + d, 0.11, 1.5, 0.5))
kick(17.62, 0.30)

/* ---- one space for everything ------------------------------------------ */

function reverb(buf, taps, mix) {
  const wet = new Float64Array(N)
  for (const [ms, g] of taps) {
    const d = Math.round(ms / 1000 * SR)
    let fb = 0
    for (let i = d; i < N; i++) {
      const x = buf[i - d] + fb * 0.34
      fb = x
      wet[i] += x * g
    }
  }
  const st = { y: 0 }
  for (let i = 0; i < N; i++) buf[i] = buf[i] * (1 - mix * 0.35) + lp(wet[i], st, 3200) * mix
}
reverb(L, [[57, 0.22], [83, 0.17], [127, 0.12]], 0.30)
reverb(R, [[61, 0.22], [91, 0.17], [139, 0.12]], 0.30)

/* ---- mix down ----------------------------------------------------------- */

let peak = 0
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]))
const norm = 0.84 / peak
for (let i = 0; i < N; i++) {
  const t = i / SR
  const fade = Math.min(1, t / 0.25) * (t > 19.9 ? Math.max(0, 1 - (t - 19.9) / 1.3) : 1)
  for (const b of [L, R]) {
    let v = b[i] * norm * fade
    b[i] = Math.tanh(v * 1.08) * 0.94          // soft limit, nothing spiky
  }
}

/* ---- wav ---------------------------------------------------------------- */

const bytes = Buffer.alloc(44 + N * 4)
bytes.write('RIFF', 0); bytes.writeUInt32LE(36 + N * 4, 4); bytes.write('WAVE', 8)
bytes.write('fmt ', 12); bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20)
bytes.writeUInt16LE(2, 22); bytes.writeUInt32LE(SR, 24); bytes.writeUInt32LE(SR * 4, 28)
bytes.writeUInt16LE(4, 32); bytes.writeUInt16LE(16, 34)
bytes.write('data', 36); bytes.writeUInt32LE(N * 4, 40)
for (let i = 0; i < N; i++) {
  bytes.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[i] * 32767))), 44 + i * 4)
  bytes.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(R[i] * 32767))), 46 + i * 4)
}
fs.writeFileSync(new URL('./audio.wav', import.meta.url), bytes)
console.log('wrote brag-audio.wav', (bytes.length / 1e6).toFixed(1), 'MB', DUR, 's')
