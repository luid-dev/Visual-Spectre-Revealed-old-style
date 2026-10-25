import { interpolate, random } from "remotion";
import type { AudioAnalysis } from "../audio/use-audio-analysis";
import { SPECTRUM_AXIS, VIDEO } from "../config";
import type { Palette } from "../lib/color";
import { type Point, axisFrame, toPoints } from "../lib/geometry";
import { GlowFilter } from "./GlowFilter";

const axis = axisFrame(SPECTRUM_AXIS);
const L = axis.length;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Repeating on/off visibility with soft edges.
const pulse = (frame: number, period: number, phase: number, duty: number, fade = 18) => {
  const t = (((frame + phase) % period) + period) % period;
  const on = duty * period;
  return interpolate(t, [0, fade, on - fade, on], [0, 1, 1, 0], clamp);
};

type Segment = { a: Point; b: Point; opacity: number; width?: number };

const SHOOT_LIFETIME = 26;

// Thin light streaks around the scene: verticals on the lit side, long
// lines parallel / perpendicular to the diagonal on the dark side, a
// diamond outline and quick shooting streaks on kicks.
export const HudOverlays: React.FC<{
  audio: AudioAnalysis;
  palette: Palette;
  frame: number;
}> = ({ audio, palette, frame }) => {
  const { bass, flood, beat } = audio;
  const segments: Segment[] = [];

  // Right edge vertical, shows while the flood is up (under the flipped badge).
  segments.push({ a: { x: 1785, y: 150 }, b: { x: 1785, y: VIDEO.height + 40 }, opacity: 0.55 * flood });

  // Verticals inside the lit half.
  segments.push({ a: { x: 151, y: 170 }, b: { x: 151, y: 925 }, opacity: 0.4 * pulse(frame, 300, 0, 0.55) });
  segments.push({ a: { x: 323, y: 360 }, b: { x: 323, y: 1010 }, opacity: 0.35 * pulse(frame, 360, 140, 0.5) });

  // Long lines parallel to the diagonal on the dark side, sliding along it.
  [
    { d: 300, length: 520, speed: 0.6, phase: 0, period: 420 },
    { d: 540, length: 380, speed: -0.45, phase: 200, period: 380 },
  ].forEach((l, i) => {
    const travel = (((frame * l.speed + l.phase * 3) % (L + l.length)) + L + l.length) % (L + l.length);
    const s = travel - l.length;
    segments.push({
      a: axis.at(s, l.d),
      b: axis.at(s + l.length, l.d),
      opacity: 0.45 * pulse(frame, l.period, l.phase + i * 50, 0.7),
    });
  });

  // Perpendicular lines crossing the dark side.
  [
    { s: 1000, from: 110, to: 640, slide: 120, period: 330, phase: 60 },
    { s: 560, from: 140, to: 520, slide: 90, period: 280, phase: 210 },
  ].forEach((l) => {
    const s = l.s + Math.sin((frame + l.phase) / 160) * l.slide;
    segments.push({
      a: axis.at(s, l.from),
      b: axis.at(s, l.to),
      opacity: 0.4 * pulse(frame, l.period, l.phase, 0.6),
    });
  });

  // Diamond outline (edges parallel / perpendicular to the diagonal).
  const diamondVisible = pulse(frame, 480, 90, 0.5, 24);
  const half = 110 + bass * 12;
  const c = axis.at(1024, 284);
  const diamond = [
    { x: c.x + axis.tx * half, y: c.y + axis.ty * half },
    { x: c.x + axis.nx * half, y: c.y + axis.ny * half },
    { x: c.x - axis.tx * half, y: c.y - axis.ty * half },
    { x: c.x - axis.nx * half, y: c.y - axis.ny * half },
  ];

  // Shooting streaks on some kicks.
  const shots = [
    { hit: beat.index, age: beat.age },
    { hit: beat.index - 1, age: beat.prevAge },
  ].filter((h) => h.hit >= 0 && h.age < SHOOT_LIFETIME && random(`shoot-${h.hit}`) < 0.5);

  return (
    <svg
      width={VIDEO.width}
      height={VIDEO.height}
      style={{ position: "absolute", inset: 0, overflow: "visible" }}
    >
      <defs>
        <GlowFilter id="hud-glow" layers={[{ color: palette.glow, blur: 6 }]} />
      </defs>
      <g filter="url(#hud-glow)" fill="none" stroke={palette.line}>
        {segments.map((seg, i) =>
          seg.opacity > 0.01 ? (
            <line
              key={i}
              x1={seg.a.x}
              y1={seg.a.y}
              x2={seg.b.x}
              y2={seg.b.y}
              strokeWidth={seg.width ?? 1}
              opacity={seg.opacity}
            />
          ) : null,
        )}
        {diamondVisible > 0.01 ? (
          <polygon points={toPoints(diamond)} strokeWidth={1} opacity={0.5 * diamondVisible} />
        ) : null}
        {shots.map(({ hit, age }) => {
          const d = 180 + random(`shoot-d-${hit}`) * 560;
          const s0 = random(`shoot-s-${hit}`) * (L * 0.8);
          const s = s0 + interpolate(age, [0, SHOOT_LIFETIME], [0, 420]);
          const a = axis.at(s, d);
          const b = axis.at(s + 90, d);
          return (
            <line
              key={hit}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#ffffff"
              strokeWidth={1.6}
              opacity={interpolate(age, [0, 4, SHOOT_LIFETIME], [0, 0.9, 0], clamp)}
            />
          );
        })}
      </g>
    </svg>
  );
};
