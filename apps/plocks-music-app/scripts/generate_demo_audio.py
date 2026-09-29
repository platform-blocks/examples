"""Generate the six original, short instrumental loops bundled with the example.

Requires numpy and ffmpeg. Run from any directory with:
    python3 scripts/generate_demo_audio.py
"""

from pathlib import Path
import subprocess
import tempfile
import wave

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "audio"
OUT.mkdir(parents=True, exist_ok=True)
SAMPLE_RATE = 22050

# name, tempo, four chord roots (MIDI), semitone intervals, melody pattern, seed
TRACKS = [
    ("golden-hour", 94, [57, 53, 60, 55], [0, 3, 7, 10], [0, 2, 1, 3, 2, 1, 0, 1], 8),
    ("afterglow", 88, [62, 58, 65, 60], [0, 3, 7, 10], [2, 1, 0, 2, 3, 1, 2, 0], 13),
    ("night-drive", 110, [52, 48, 55, 50], [0, 3, 7, 10], [0, 1, 2, 1, 3, 2, 1, 0], 21),
    ("blue-apartment", 84, [55, 60, 57, 62], [0, 4, 7, 11], [1, 3, 2, 1, 0, 2, 3, 2], 34),
    ("soft-focus", 76, [60, 57, 65, 55], [0, 4, 7, 11], [3, 2, 1, 0, 2, 1, 0, 1], 55),
    ("side-streets", 116, [53, 49, 56, 51], [0, 3, 7, 10], [0, 2, 3, 1, 2, 0, 1, 3], 89),
]


def frequency(midi):
    return 440.0 * (2.0 ** ((midi - 69) / 12.0))


def add_note(buffer, start, duration, midi, level, decay, kind="bell"):
    first = int(start * SAMPLE_RATE)
    count = min(int(duration * SAMPLE_RATE), len(buffer) - first)
    if count <= 0:
        return
    t = np.arange(count, dtype=np.float64) / SAMPLE_RATE
    f = frequency(midi)
    if kind == "pad":
        envelope = np.minimum(1.0, t * 5) * np.minimum(1.0, (duration - t) * 3)
        tone = np.sin(2 * np.pi * f * t) + 0.22 * np.sin(2 * np.pi * f * 2.01 * t)
    elif kind == "bass":
        envelope = np.exp(-decay * t) * np.minimum(1.0, t * 70)
        tone = np.sin(2 * np.pi * f * t) + 0.12 * np.sin(2 * np.pi * f * 2 * t)
    else:
        envelope = np.exp(-decay * t) * np.minimum(1.0, t * 110)
        tone = np.sin(2 * np.pi * f * t) + 0.38 * np.sin(2 * np.pi * f * 2 * t)
    buffer[first:first + count] += level * envelope * tone


def add_noise(buffer, start, duration, level, seed, decay):
    first = int(start * SAMPLE_RATE)
    count = min(int(duration * SAMPLE_RATE), len(buffer) - first)
    if count <= 0:
        return
    rng = np.random.default_rng(seed)
    t = np.arange(count, dtype=np.float64) / SAMPLE_RATE
    noise = rng.uniform(-1, 1, count)
    high_pass = noise - np.convolve(noise, np.ones(12) / 12, mode="same")
    buffer[first:first + count] += level * high_pass * np.exp(-decay * t)


def render(track):
    name, bpm, roots, chord, melody, seed = track
    beat = 60 / bpm
    bars = 8
    seconds = bars * 4 * beat
    buffer = np.zeros(int(seconds * SAMPLE_RATE), dtype=np.float64)

    for bar in range(bars):
        root = roots[bar % len(roots)]
        bar_start = bar * beat * 4
        for interval in chord:
            add_note(buffer, bar_start, beat * 3.98, root + interval, 0.038, 0, "pad")
        for step in range(4):
            beat_start = bar_start + step * beat
            add_note(buffer, beat_start, beat * 0.86, root - 12, 0.17, 4.4, "bass")
            if step in (0, 2):
                add_note(buffer, beat_start, 0.25, 36, 0.25, 27, "bass")
            else:
                add_noise(buffer, beat_start, 0.12, 0.055, seed + bar * 4 + step, 24)
            for half in range(2):
                note_index = melody[(bar * 8 + step * 2 + half) % len(melody)]
                pitch = root + chord[note_index] + (12 if (bar + half) % 3 == 0 else 0)
                add_note(buffer, beat_start + half * beat / 2, beat * 0.49, pitch, 0.085, 5.3)
                add_noise(buffer, beat_start + half * beat / 2, 0.055, 0.021,
                          seed * 100 + bar * 8 + step * 2 + half, 75)

    fade = min(int(SAMPLE_RATE * 0.3), len(buffer) // 4)
    buffer[:fade] *= np.linspace(0, 1, fade)
    buffer[-fade:] *= np.linspace(1, 0, fade)
    buffer = np.tanh(buffer * 2.1) * 0.83
    samples = (buffer * 32767).astype("<i2")

    with tempfile.TemporaryDirectory() as temp:
        wav_path = Path(temp) / f"{name}.wav"
        with wave.open(str(wav_path), "wb") as output:
            output.setnchannels(1)
            output.setsampwidth(2)
            output.setframerate(SAMPLE_RATE)
            output.writeframes(samples.tobytes())
        subprocess.run([
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav_path),
            "-codec:a", "libmp3lame", "-q:a", "5", str(OUT / f"{name}.mp3"),
        ], check=True)
    print(f"{name}: {seconds:.1f}s")


for item in TRACKS:
    render(item)
