import type { MediaUtilsAudioData } from "@remotion/media-utils";
import { interpolate } from "remotion";
import { FLOOD, INTRO, ONSETS } from "../config";
import { bassAt } from "./bands";

// Whole-track bass analysis, computed once per tab: running sum (particle
// travel), kick onsets (wireframes) and drop starts (color flood).

const STRIDE = 2;
const HIT_THRESHOLD = 0.38;

export type TrackCurve = {
  accumAt: (frame: number) => number;
  // Index of the last onset at or before `frame` (-1 if none) and its frame.
  lastOnset: (frame: number) => { index: number; frame: number };
  onsetLevel: (index: number) => number;
  onsetFrame: (index: number) => number;
  floodAt: (frame: number) => number;
  hitFrame: number;
};

const lastAtOrBefore = (sorted: number[], frame: number) => {
  let lo = 0;
  let hi = sorted.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] <= frame) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
};

export const buildTrackCurve = (
  audioData: MediaUtilsAudioData,
  fps: number,
): TrackCurve => {
  const totalFrames = Math.ceil(audioData.durationInSeconds * fps);
  const samples = Math.ceil(totalFrames / STRIDE) + 1;
  const bass = new Float32Array(samples);
  for (let k = 0; k < samples; k++) {
    bass[k] = bassAt(audioData, k * STRIDE, fps);
  }

  const cumulative = new Float32Array(samples + 1);
  for (let k = 0; k < samples; k++) {
    cumulative[k + 1] = cumulative[k] + bass[k] * STRIDE;
  }

  const onsets: number[] = [];
  const onsetLevels: number[] = [];
  for (let k = 3; k < samples; k++) {
    const frame = k * STRIDE;
    const before = Math.min(bass[k - 1], bass[k - 2], bass[k - 3]);
    const gapOk = onsets.length === 0 || frame - onsets[onsets.length - 1] >= ONSETS.minGap;
    if (bass[k] > ONSETS.minLevel && bass[k] - before > ONSETS.minRise && gapOk) {
      onsets.push(frame);
      onsetLevels.push(bass[k]);
    }
  }

  // Look-ahead average so a drop is flagged on its first kick, not after.
  const window = Math.round(FLOOD.lookAhead / STRIDE);
  const ahead = (k: number) => {
    const end = Math.min(samples, k + window);
    return (cumulative[end] - cumulative[k]) / STRIDE / Math.max(1, end - k);
  };
  const sectionStarts: number[] = [];
  let armed = true;
  for (let k = 0; k < samples; k++) {
    const level = ahead(k);
    if (armed && level > FLOOD.enter) {
      sectionStarts.push(k * STRIDE);
      armed = false;
    } else if (level < FLOOD.exit) {
      armed = true;
    }
  }

  let hitFrame: number = INTRO.fallbackHitFrame;
  for (let f = 0; f <= INTRO.hitSearchEnd; f++) {
    if (bassAt(audioData, f, fps) > HIT_THRESHOLD) {
      hitFrame = f;
      break;
    }
  }

  return {
    accumAt: (frame) => {
      const pos = Math.max(0, frame) / STRIDE;
      const i = Math.min(samples - 1, Math.floor(pos));
      const t = Math.min(1, pos - i);
      return cumulative[i] + (cumulative[i + 1] - cumulative[i]) * t;
    },
    lastOnset: (frame) => {
      const index = lastAtOrBefore(onsets, frame);
      return { index, frame: index >= 0 ? onsets[index] : -Infinity };
    },
    onsetLevel: (index) => onsetLevels[index] ?? 0,
    onsetFrame: (index) => onsets[index] ?? -Infinity,
    floodAt: (frame) => {
      const i = lastAtOrBefore(sectionStarts, frame);
      if (i < 0) {
        return 0;
      }
      const age = frame - sectionStarts[i];
      return interpolate(
        age,
        [0, FLOOD.rampIn, FLOOD.rampIn + FLOOD.hold, FLOOD.rampIn + FLOOD.hold + FLOOD.rampOut],
        [0, 1, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      );
    },
    hitFrame,
  };
};
