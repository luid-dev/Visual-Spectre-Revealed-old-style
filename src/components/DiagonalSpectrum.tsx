import { random } from "remotion";
import type { AudioAnalysis } from "../audio/use-audio-analysis";
import { SPECTRUM_AXIS, VIDEO } from "../config";
import type { Palette } from "../lib/color";
import { type Point, axisEnvelope, axisFrame, toPoints } from "../lib/geometry";
import { GlowFilter } from "./GlowFilter";

// Three layers, as in the Revealed reference:
//  - a tight bundle of thin strands braided right on the line,
//  - sparse outline wires that rise into 45° peaks with the music,
//  - small saw teeth along the edge of the bundle where the sound is loud.
// Offsets are measured along the axis normal: negative = lit side.

const axis = axisFrame(SPECTRUM_AXIS);
const L = axis.length;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Distance from the middle of the axis: 0 at the center, 1 at both ends.
// Lows sit in the middle, highs toward the ends, mirrored.
const centerDistance = (u: number) => Math.abs(u - 0.5) * 2;
const binAt = (u: number) => Math.min(127, Math.round(2 + centerDistance(u) * 120));

// Average of a few neighbouring bins, so single noisy bins don't spike.
const levelAt = (spectrum: number[], u: number) => {
  const bin = binAt(u);
  let total = 0;
  let count = 0;
  for (let b = Math.max(0, bin - 2); b <= Math.min(127, bin + 2); b++) {
    total += spectrum[b];
    count++;
  }
  return Math.min(1.2, total / count);
};

// --- Bundle ---------------------------------------------------------------

const STRANDS = 8;
const BUNDLE_VERTICES = 34;

const strandPoints = (
  spectrum: number[],
  strand: number,
  frame: number,
  bass: number,
): Point[] => {
  const offset = (random(`bundle-off-${strand}`) - 0.5) * 10;
  const speed = 0.035 + random(`bundle-speed-${strand}`) * 0.03;
  return Array.from({ length: BUNDLE_VERTICES }, (_, i) => {
    const isEnd = i === 0 || i === BUNDLE_VERTICES - 1;
    const jitter = isEnd ? 0 : (random(`bundle-u-${strand}-${i}`) - 0.5) * 0.02;
    const u = i / (BUNDLE_VERTICES - 1) + jitter;
    // Slow drifting wave plus fixed roughness: the strands cross each other.
    const wobble =
      Math.sin(i * 1.9 + strand * 2.4 + frame * speed) * 0.6 +
      (random(`bundle-rough-${strand}-${i}`) - 0.5) * 0.8;
    const amp = 5 + levelAt(spectrum, u) * 14 + bass * 7;
    return axis.at(u * L, axisEnvelope(u, 0.25) * (offset + wobble * amp));
  });
};

// --- Wires ----------------------------------------------------------------

const WIRE_SPACING = 150;
const WIRE_VERTICES = Math.floor(L / WIRE_SPACING);
const PEAK_MAX = 220;

type Wire = {
  trail: number;
  gain: number;
  // Shift of the vertex grid, in spacings, so wires don't all peak together.
  shift: number;
  // Wires sharing a seed share their peak positions and sides (nested peaks).
  seed: string;
  litBias: number;
  // Mountains: flat on the line between 45° peaks. Otherwise a plain zigzag.
  mountains: boolean;
  width: number;
  opacity: number;
};

const WIRES: Wire[] = [
  { trail: 0, gain: 1, shift: 0.5, seed: "a", litBias: 0.65, mountains: true, width: 1.5, opacity: 0.9 },
  { trail: 2, gain: 0.6, shift: 0.5, seed: "a", litBias: 0.65, mountains: true, width: 1.1, opacity: 0.6 },
  { trail: 3, gain: 0.85, shift: 0, seed: "b", litBias: 0.5, mountains: false, width: 1.3, opacity: 0.75 },
  { trail: 5, gain: 0.6, shift: 0.3, seed: "c", litBias: 0.45, mountains: false, width: 1, opacity: 0.55 },
];

const wirePoints = (wire: Wire, spectrum: number[], bass: number): Point[] => {
  const points: Point[] = [axis.at(-40)];
  const scale = PEAK_MAX * wire.gain * (0.45 + bass * 0.75);
  for (let m = 0; m < WIRE_VERTICES; m++) {
    const r = (key: string) => random(`wire-${key}-${wire.seed}-${m}`);
    const s = (m + wire.shift) * WIRE_SPACING + (r("s") - 0.5) * 36;
    if (s <= 0 || s >= L) {
      continue;
    }
    const u = s / L;
    const level = levelAt(spectrum, u);
    const side = r("side") < wire.litBias ? -1 : 1;
    const envelope = axisEnvelope(u, 0.4);
    if (wire.mountains) {
      // Peaky response with a different threshold per site, so only one or
      // two peaks jump out at a time while the rest stay near the line.
      const threshold = 0.6 + r("threshold") * 0.4;
      const weight = 0.5 + r("weight") * 0.7;
      const peak = Math.pow(clamp01((level - threshold) / (1.25 - threshold)), 1.2) * weight;
      const h = Math.min(WIRE_SPACING * 1.3, peak * scale * 1.7) * envelope;
      // Uneven flanks and feet slightly off the line, so peaks read as
      // hand-drawn outlines rather than perfect triangles.
      const left = Math.min(h * (0.55 + r("left") * 0.8), WIRE_SPACING * 0.48);
      const right = Math.min(h * (0.55 + r("right") * 0.8), WIRE_SPACING * 0.48);
      const foot = (r("foot") - 0.5) * 14;
      points.push(
        axis.at(s - left, foot),
        axis.at(s, side * h),
        axis.at(s + right, -foot * 0.6),
      );
    } else {
      // Plain zigzag crossing the bundle: always slightly open, with long
      // sloped runs between vertices.
      const h = (0.12 + clamp01((level - 0.2) / 0.8) * 0.88) * (0.5 + r("weight") * 0.8) * scale * envelope;
      points.push(axis.at(s, side * h));
    }
  }
  points.push(axis.at(L + 40));
  return points;
};

// --- Teeth ----------------------------------------------------------------

const TEETH = 150;
const TOOTH_SEGMENTS = 9;

const teethPath = (spectrum: number[]) => {
  const w = L / TEETH;
  let path = "";
  for (let i = 0; i < TEETH; i++) {
    const u = (i + 0.5) / TEETH;
    const h = clamp01((levelAt(spectrum, u) - 0.6) / 0.4) * 13 * axisEnvelope(u, 0.6);
    if (h < 1) {
      continue;
    }
    // Patches alternate between the lit and the dark edge of the bundle.
    const segment = Math.floor(u * TOOTH_SEGMENTS);
    const side = random(`tooth-side-${segment}`) < 0.6 ? -1 : 1;
    const a = axis.at(i * w, side * 5);
    const apex = axis.at(i * w + w / 2, side * (5 + h));
    const b = axis.at((i + 1) * w, side * 5);
    path += `M${a.x.toFixed(1)},${a.y.toFixed(1)}L${apex.x.toFixed(1)},${apex.y.toFixed(1)}L${b.x.toFixed(1)},${b.y.toFixed(1)}Z`;
  }
  return path;
};

// --- Sparks ---------------------------------------------------------------

const SPARKS = 5;

export const DiagonalSpectrum: React.FC<{
  audio: AudioAnalysis;
  palette: Palette;
  frame: number;
}> = ({ audio, palette, frame }) => {
  const { trail, bass } = audio;
  const lineStart = axis.at(-60);
  const lineEnd = axis.at(L + 60);

  return (
    <svg
      width={VIDEO.width}
      height={VIDEO.height}
      style={{ position: "absolute", inset: 0, overflow: "visible" }}
    >
      <defs>
        <GlowFilter
          id="spec-bundle-glow"
          layers={[
            { color: "#ffffff", blur: 2 },
            { color: palette.glow, blur: 8, strength: 2 },
            { color: palette.glow, blur: 22 },
          ]}
        />
        <GlowFilter
          id="spec-wire-glow"
          layers={[
            { color: palette.glow, blur: 5 },
            { color: palette.accent, blur: 12 },
          ]}
        />
      </defs>

      <path d={teethPath(audio.spectrum)} fill={palette.accent} opacity={0.85} />

      <g filter="url(#spec-wire-glow)" fill="none" stroke={palette.line} strokeLinejoin="miter" strokeMiterlimit={10}>
        {WIRES.map((wire, k) => (
          <polyline
            key={k}
            points={toPoints(wirePoints(wire, trail[wire.trail] ?? audio.spectrum, bass))}
            strokeWidth={wire.width}
            opacity={wire.opacity}
          />
        ))}
      </g>

      <g filter="url(#spec-bundle-glow)" fill="none" strokeLinejoin="round">
        <line
          x1={lineStart.x}
          y1={lineStart.y}
          x2={lineEnd.x}
          y2={lineEnd.y}
          stroke={palette.core}
          strokeWidth={1}
          opacity={0.5}
        />
        {Array.from({ length: STRANDS }, (_, k) => (
          <polyline
            key={k}
            points={toPoints(strandPoints(trail[k % trail.length] ?? audio.spectrum, k, frame, bass))}
            stroke={k === 0 ? "#ffffff" : palette.core}
            strokeWidth={k === 0 ? 1.6 : 1.1}
            opacity={k === 0 ? 0.95 : 0.85 - (k / STRANDS) * 0.35}
          />
        ))}
      </g>

      {/* Sparks riding the bundle. */}
      <g fill="#ffffff" filter="url(#spec-wire-glow)">
        {Array.from({ length: SPARKS }, (_, i) => {
          const speed = 1.2 + random(`spark-speed-${i}`) * 2.4;
          const s = (frame * speed + random(`spark-phase-${i}`) * L) % L;
          const d = Math.sin(frame / 9 + i * 2) * 6;
          const p = axis.at(s, d);
          const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(frame / (7 + i) + i));
          return <circle key={i} cx={p.x} cy={p.y} r={1.7} opacity={twinkle * axisEnvelope(s / L, 0.5)} />;
        })}
      </g>
    </svg>
  );
};
