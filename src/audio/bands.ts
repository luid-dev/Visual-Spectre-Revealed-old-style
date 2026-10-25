import { type MediaUtilsAudioData, visualizeAudio } from "@remotion/media-utils";
import {
  BAND_RANGE,
  BANDS,
  BIN_REFERENCE,
  BINS,
  SMOOTHING_WEIGHTS,
} from "../config";

export type Bands = { bass: number; mids: number; highs: number };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const meanRange = (values: number[], [from, to]: readonly [number, number]) => {
  let total = 0;
  for (let i = from; i <= to; i++) {
    total += values[i];
  }
  return total / (to - from + 1);
};

const normalizeBand = (raw: number, band: keyof typeof BAND_RANGE) => {
  const { floor, ceil } = BAND_RANGE[band];
  return clamp01((raw - floor) / (ceil - floor));
};

// Reference magnitude for a bin, linearly interpolated from BIN_REFERENCE.
const binReference = (() => {
  const table = new Array<number>(BINS);
  for (let bin = 0; bin < BINS; bin++) {
    const upper = BIN_REFERENCE.findIndex(([b]) => b >= bin);
    const [b1, v1] = BIN_REFERENCE[upper];
    const [b0, v0] = BIN_REFERENCE[Math.max(0, upper - 1)];
    const t = b1 === b0 ? 0 : (bin - b0) / (b1 - b0);
    table[bin] = v0 + (v1 - v0) * t;
  }
  return table;
})();

export const rawSpectrum = (
  audioData: MediaUtilsAudioData,
  frame: number,
  fps: number,
) =>
  visualizeAudio({
    audioData,
    fps,
    frame: Math.max(0, frame),
    numberOfSamples: BINS,
    // We do our own causal smoothing below.
    smoothing: false,
  });

// Weighted blend of the current frame and the 2 previous ones, so polygonal
// lines never jump between frames.
export const smoothedSpectrum = (
  audioData: MediaUtilsAudioData,
  frame: number,
  fps: number,
) => {
  const out = new Array<number>(BINS).fill(0);
  SMOOTHING_WEIGHTS.forEach((weight, back) => {
    const values = rawSpectrum(audioData, frame - back, fps);
    for (let i = 0; i < BINS; i++) {
      out[i] += values[i] * weight;
    }
  });
  return out;
};

export const bandsFromSpectrum = (spectrum: number[]): Bands => ({
  bass: Math.pow(normalizeBand(meanRange(spectrum, BANDS.bass), "bass"), 1.15),
  mids: normalizeBand(meanRange(spectrum, BANDS.mids), "mids"),
  highs: normalizeBand(meanRange(spectrum, BANDS.highs), "highs"),
});

// Per-bin level where ~1 means "loud for this frequency".
export const flattenSpectrum = (spectrum: number[]) =>
  spectrum.map((v, i) => Math.min(1.3, v / binReference[i]));

export const bassAt = (
  audioData: MediaUtilsAudioData,
  frame: number,
  fps: number,
) => bandsFromSpectrum(rawSpectrum(audioData, frame, fps)).bass;
