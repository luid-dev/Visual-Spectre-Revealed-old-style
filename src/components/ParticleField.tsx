import { useMemo } from "react";
import { AbsoluteFill, random } from "remotion";
import { SPECTRUM_AXIS, VIDEO } from "../config";
import type { Palette } from "../lib/color";
import { axisFrame } from "../lib/geometry";

const axis = axisFrame(SPECTRUM_AXIS);

// Every particle travels this far before wrapping back.
const CYCLE = 1400;

type Kind = "dot" | "dash" | "triangle";

type Particle = {
  kind: Kind;
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  speed: number;
  bassBoost: number;
  phase: number;
  size: number;
  baseOpacity: number;
  twinklePeriod: number;
  spin: number;
};

const r = (seed: string) => random(seed);

const spawnPoint = (i: number, nearLine: boolean) => {
  if (nearLine) {
    const s = r(`p-s-${i}`) * axis.length;
    const d = -220 + r(`p-d-${i}`) * 480;
    return axis.at(s, d);
  }
  // Dark side: upper-right of the diagonal (x > y).
  for (let attempt = 0; attempt < 12; attempt++) {
    const x = r(`p-x-${i}-${attempt}`) * (VIDEO.width + 200);
    const y = r(`p-y-${i}-${attempt}`) * (VIDEO.height + 200) - 100;
    if (x - y > 40) {
      return { x, y };
    }
  }
  return { x: VIDEO.width * 0.8, y: VIDEO.height * 0.3 };
};

const buildParticles = (count: number): Particle[] =>
  Array.from({ length: count }, (_, i) => {
    const roll = r(`p-kind-${i}`);
    const kind: Kind = roll < 0.78 ? "dot" : roll < 0.9 ? "dash" : "triangle";
    // Slow drift up and to the right, ±12°.
    const angle = ((-45 + (r(`p-angle-${i}`) - 0.5) * 24) * Math.PI) / 180;
    const { x, y } = spawnPoint(i, i % 2 === 0);
    return {
      kind,
      x,
      y,
      dirX: Math.cos(angle),
      dirY: Math.sin(angle),
      speed: 0.12 + r(`p-speed-${i}`) * 0.3,
      bassBoost: 0.15 + r(`p-boost-${i}`) * 0.35,
      phase: r(`p-phase-${i}`),
      size:
        kind === "dot"
          ? 1.2 + r(`p-size-${i}`) * 1.8
          : kind === "dash"
            ? 8 + r(`p-size-${i}`) * 10
            : 10 + r(`p-size-${i}`) * 26,
      baseOpacity:
        kind === "triangle" ? 0.25 + r(`p-op-${i}`) * 0.25 : 0.55 + r(`p-op-${i}`) * 0.45,
      twinklePeriod: 16 + r(`p-tw-${i}`) * 34,
      spin: (r(`p-spin-${i}`) - 0.5) * 0.6,
    };
  });

// Tiny light dust (dots and dashes) plus a few floating triangles.
export const ParticleField: React.FC<{
  count?: number;
  palette: Palette;
  bass: number;
  bassAccum: number;
  frame: number;
}> = ({ count = 90, palette, bass, bassAccum, frame }) => {
  const particles = useMemo(() => buildParticles(count), [count]);

  return (
    <AbsoluteFill>
      {particles.map((p, i) => {
        const travel = frame * p.speed + bassAccum * p.bassBoost;
        const t = (travel + p.phase * CYCLE) % CYCLE;
        const along = t - CYCLE / 2;
        const x = p.x + p.dirX * along;
        const y = p.y + p.dirY * along;
        const lifeFade = Math.sin((Math.PI * t) / CYCLE);
        const twinkle = 0.5 + 0.5 * Math.sin(frame / p.twinklePeriod + p.phase * 6.28);
        const opacity =
          p.baseOpacity * lifeFade * (p.kind === "triangle" ? 1 : twinkle) * (0.8 + bass * 0.4);

        if (p.kind === "triangle") {
          const h = p.size * 0.866;
          return (
            <svg
              key={i}
              width={p.size}
              height={h}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                opacity,
                overflow: "visible",
                transform: `translate(${x}px, ${y}px) rotate(${frame * p.spin + p.phase * 360}deg)`,
              }}
            >
              <polygon points={`0,${h} ${p.size / 2},0 ${p.size},${h}`} fill={palette.accent} />
            </svg>
          );
        }

        const isDash = p.kind === "dash";
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: p.size,
              height: isDash ? 1.4 : p.size,
              borderRadius: isDash ? 1 : "50%",
              backgroundColor: "#ffffff",
              opacity,
              transform: `translate(${x - p.size / 2}px, ${y - p.size / 2}px)`,
              boxShadow: `0 0 6px ${palette.glow}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
