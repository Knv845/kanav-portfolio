"""Original background music for the intro videos, synthesised from scratch (stdlib only, no samples).
Usage: python3 music.py <name> <seconds> <out.wav>
Each project gets its own key, tempo and feel. Pads + bass + plucked arpeggio + soft drums, then a gentle limiter."""

import math
import random
import struct
import sys
import wave
from array import array

SR = 44100

TRACKS = {
    # name: (bpm, progression of chords as MIDI notes, arp pattern, swing)
    'nearmed': (100, [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]], [0, 1, 2, 1, 2, 0, 1, 2], 0.0),  # C G Am F
    'parkassist': (112, [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], [0, 2, 1, 2, 0, 2, 1, 2], 0.0),  # Am F C G
    'saarag': (90, [[62, 66, 69, 73], [57, 61, 64, 68], [59, 62, 66, 69], [55, 59, 62, 66]], [0, 1, 2, 3, 2, 1, 2, 3], 0.08),  # Dmaj7 Amaj7 Bm7 Gmaj7
}


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def render(name, seconds):
    bpm, prog, arp, swing = TRACKS[name]
    beat = 60.0 / bpm
    bar = beat * 4
    n = int(seconds * SR)
    L = array('f', bytes(4 * n))
    R = array('f', bytes(4 * n))
    rnd = random.Random(7)

    def add(start, buf_l, buf_r=None, pan=0.0):
        i0 = int(start * SR)
        gl, gr = math.cos((pan + 1) * math.pi / 4), math.sin((pan + 1) * math.pi / 4)
        for k, v in enumerate(buf_l):
            i = i0 + k
            if i >= n:
                break
            L[i] += v * gl * 1.41
            R[i] += (buf_r[k] if buf_r else v) * gr * 1.41

    def pad_note(freq, dur, amp):
        m = int(dur * SR)
        out_l, out_r = array('f', bytes(4 * m)), array('f', bytes(4 * m))
        a, r = 0.35 * SR, 0.6 * SR
        w1, w2, w3 = 2 * math.pi * freq / SR, 2 * math.pi * freq * 1.004 / SR, 2 * math.pi * freq * 2 / SR
        for k in range(m):
            env = min(1.0, k / a) * min(1.0, (m - k) / r)
            s1, s2, s3 = math.sin(w1 * k), math.sin(w2 * k), math.sin(w3 * k)
            out_l[k] = amp * env * (s1 + 0.18 * s3)
            out_r[k] = amp * env * (s2 + 0.18 * s3)
        return out_l, out_r

    def pluck(freq, dur, amp, decay=5.0, bright=0.35):
        m = int(dur * SR)
        out = array('f', bytes(4 * m))
        w = 2 * math.pi * freq / SR
        for k in range(m):
            t = k / SR
            env = math.exp(-decay * t) * min(1.0, k / 60)
            out[k] = amp * env * (math.sin(w * k) + bright * math.exp(-decay * 2 * t) * math.sin(2 * w * k) + 0.12 * math.sin(3 * w * k))
        return out

    def kick(amp):
        m = int(0.35 * SR)
        out = array('f', bytes(4 * m))
        ph = 0.0
        for k in range(m):
            t = k / SR
            f = 45 + 75 * math.exp(-t * 28)
            ph += 2 * math.pi * f / SR
            out[k] = amp * math.exp(-t * 9) * math.sin(ph)
        return out

    def hat(amp, dur=0.05):
        m = int(dur * SR)
        out = array('f', bytes(4 * m))
        prev = 0.0
        for k in range(m):
            x = rnd.uniform(-1, 1)
            out[k] = amp * math.exp(-k / SR * 60) * (x - prev)  # crude high-pass
            prev = x
        return out

    def clap(amp):
        m = int(0.18 * SR)
        out = array('f', bytes(4 * m))
        for k in range(m):
            t = k / SR
            burst = sum(math.exp(-max(0.0, t - o) * 45) for o in (0, 0.011, 0.022) if t >= o)
            out[k] = amp * 0.4 * burst * rnd.uniform(-1, 1) * math.exp(-t * 18)
        return out

    bars = int(seconds / bar) + 1
    K, H, C = kick(0.5), hat(0.035, 0.035), clap(0.08)
    for b in range(bars):
        chord = prog[b % len(prog)]
        t0 = b * bar
        # Pads: the whole bar, slightly overlapping the next
        for j, note in enumerate(chord):
            pl, pr = pad_note(hz(note), bar + 0.4, 0.06)
            add(t0, pl, pr, pan=(j - 1.5) * 0.25)
        # Bass: root on 1 and 3, a pickup on the "and" of 4 (from bar 2)
        root = hz(chord[0] - 24)
        if b >= 1:
            for at in (0, 2):
                add(t0 + at * beat, pluck(root, beat * 1.8, 0.20, decay=2.6, bright=0.5))
            add(t0 + 3.5 * beat, pluck(root * 1.5, beat * 0.5, 0.11, decay=6))
        # Arpeggio of chord tones an octave up (from bar 2), quiet and plucky
        if b >= 2:
            for step in range(8):
                note = chord[arp[step] % len(chord)] + 12
                sw = swing * beat if step % 2 else 0
                add(t0 + step * beat / 2 + sw, pluck(hz(note), 0.5, 0.065, decay=7), pan=0.35 if step % 2 else -0.35)
        # Drums: kick from bar 2, hats from bar 3, claps from bar 4
        if b >= 1:
            for at in (0, 2) if bpm < 100 else (0, 1.5, 2):
                add(t0 + at * beat, K)
        if b >= 2:
            for s in range(8):
                add(t0 + s * beat / 2 + (swing * beat if s % 2 else 0), H, pan=0.4)
        if b >= 3:
            for at in (1, 3):
                add(t0 + at * beat, C, pan=-0.1)

    # Fade in and out, soft limiter
    fade_in, fade_out = int(0.8 * SR), int(2.5 * SR)
    for i in range(n):
        g = min(1.0, i / fade_in) * min(1.0, (n - i) / fade_out)
        L[i] = math.tanh(L[i] * 1.6 * g) * 0.8
        R[i] = math.tanh(R[i] * 1.6 * g) * 0.8
    return L, R


def write(path, L, R):
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        frames = bytearray()
        for l, r in zip(L, R):
            frames += struct.pack('<hh', int(max(-1, min(1, l)) * 32767), int(max(-1, min(1, r)) * 32767))
        w.writeframes(bytes(frames))


if __name__ == '__main__':
    name, secs, out = sys.argv[1], float(sys.argv[2]), sys.argv[3]
    L, R = render(name, secs)
    write(out, L, R)
    print('wrote', out)
