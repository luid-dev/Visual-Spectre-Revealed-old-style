// Global constants for the visualizer: assets, geometry, timing and audio calibration.

export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 60,
} as const;

export const ASSETS = {
  audio:
    "I Could Be The One [Avicii vs Nicky Romero] Jet Zeith Edit previuw wav.wav",
  background: "fondo youtube 16 9.jpeg",
  logoWhite: "isoLOGOBlanco.png",
  logoBlack: "isoLOGONegro.png",
} as const;

// Source logo is 7522x3512.
export const LOGO_ASPECT = 7522 / 3512;

// Track length, used as the fallback duration if the audio cannot be probed.
export const FALLBACK_DURATION_SECONDS = 130.3;

export type Axis = { x1: number; y1: number; x2: number; y2: number };

// The diagonal everything is built on: it splits the lit / dark halves of the
// artwork and carries the spectrum.
export const SPECTRUM_AXIS: Axis = { x1: 0, y1: 0, x2: 1080, y2: 1080 };

export const PARALLAX = {
  background: 0.5,
  logo: 1.2,
  spectrum: 1.7,
  particles: 2.4,
} as const;

export const GIANT_LOGO = {
  centerX: 540,
  centerY: 450,
  width: 860,
  // Dark copy behind the logo, down-left.
  shadowOffset: { x: -34, y: 34 },
} as const;

export const TRACK_TEXT = {
  centerX: 1920 * 0.72,
  top: 1080 * 0.4,
} as const;

export const INTRO = {
  // Solid accent screen with logo + loader.
  solidEnd: 90,
  // Diagonal opening wipe.
  wipeEnd: 140,
  // The logo cuts in on the first kick found in this window (frames).
  hitSearchEnd: 90,
  fallbackHitFrame: 30,
} as const;

// Color flood over the lit half when a high-energy section (drop) starts.
export const FLOOD = {
  rampIn: 40,
  hold: 420,
  rampOut: 80,
  // Section detection on the bass level averaged over the next `lookAhead`
  // frames, with hysteresis.
  lookAhead: 90,
  enter: 0.45,
  exit: 0.3,
} as const;

// Kick detection, used to re-draw the big wireframe shapes on every hit.
export const ONSETS = {
  minLevel: 0.42,
  minRise: 0.22,
  minGap: 18,
} as const;

// Each strand of the spectrum is the spectrum N frames ago, so the strands
// bundle when the sound is steady and split apart on transients.
export const STRAND_DELAYS = [0, 3, 6, 10, 14, 19] as const;

export const BINS = 128;

// Inclusive bin ranges.
export const BANDS = {
  bass: [0, 10],
  mids: [11, 50],
  highs: [51, 127],
} as const;

// Raw band means measured on this track (p10 → p99) with
// scripts/calibrate-audio.cjs. Re-run it if you swap the audio file.
export const BAND_RANGE = {
  bass: { floor: 0.05, ceil: 0.25 },
  mids: { floor: 0.009, ceil: 0.036 },
  highs: { floor: 0.0025, ceil: 0.0135 },
} as const;

// p95 magnitude per bin [bin, value], used to flatten the spectrum so highs
// move as much as lows.
export const BIN_REFERENCE: ReadonlyArray<readonly [number, number]> = [
  [0, 1.03],
  [1, 0.605],
  [2, 0.34],
  [5, 0.141],
  [10, 0.076],
  [20, 0.042],
  [30, 0.03],
  [50, 0.0252],
  [80, 0.0137],
  [100, 0.0083],
  [127, 0.0053],
];

// Weights for the current frame and the 2 previous ones.
export const SMOOTHING_WEIGHTS = [0.5, 0.3, 0.2] as const;
