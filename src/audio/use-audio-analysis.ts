import { useAudioData } from "@remotion/media-utils";
import { useMemo } from "react";
import { staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ASSETS, BINS, INTRO, STRAND_DELAYS } from "../config";
import {
  type Bands,
  bandsFromSpectrum,
  flattenSpectrum,
  smoothedSpectrum,
} from "./bands";
import { buildTrackCurve } from "./track-curve";

export type AudioAnalysis = Bands & {
  // 128 bins, smoothed and flattened (≈0–1.3 per bin).
  spectrum: number[];
  // Same, at each of STRAND_DELAYS frames ago (index 0 = now).
  trail: number[][];
  // Running sum of bass up to this frame, drives particle travel.
  bassAccum: number;
  // Last kick: its index (-1 before the first), frames since it, its level,
  // and frames since the kick before it.
  beat: { index: number; age: number; level: number; prevAge: number };
  // 0–1 color flood of the lit half, raised when a drop starts.
  flood: number;
  // Frame of the first kick, for the intro cut.
  hitFrame: number;
};

const SILENT_SPECTRUM: number[] = new Array(BINS).fill(0);

const SILENCE: AudioAnalysis = {
  bass: 0,
  mids: 0,
  highs: 0,
  spectrum: SILENT_SPECTRUM,
  trail: STRAND_DELAYS.map(() => SILENT_SPECTRUM),
  bassAccum: 0,
  beat: { index: -1, age: Infinity, level: 0, prevAge: Infinity },
  flood: 0,
  hitFrame: INTRO.fallbackHitFrame,
};

export const useAudioAnalysis = (): AudioAnalysis => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioData = useAudioData(staticFile(ASSETS.audio));

  const curve = useMemo(
    () => (audioData ? buildTrackCurve(audioData, fps) : null),
    [audioData, fps],
  );

  return useMemo(() => {
    if (!audioData || !curve) {
      return SILENCE;
    }
    const trail = STRAND_DELAYS.map((delay) =>
      smoothedSpectrum(audioData, frame - delay, fps),
    );
    const onset = curve.lastOnset(frame);
    return {
      ...bandsFromSpectrum(trail[0]),
      spectrum: flattenSpectrum(trail[0]),
      trail: trail.map(flattenSpectrum),
      bassAccum: curve.accumAt(frame),
      beat: {
        index: onset.index,
        age: frame - onset.frame,
        level: curve.onsetLevel(onset.index),
        prevAge: frame - curve.onsetFrame(onset.index - 1),
      },
      flood: curve.floodAt(frame),
      hitFrame: curve.hitFrame,
    };
  }, [audioData, curve, frame, fps]);
};
