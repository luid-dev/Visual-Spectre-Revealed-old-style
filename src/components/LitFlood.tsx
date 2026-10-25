import { SPECTRUM_AXIS, VIDEO } from "../config";
import { type Palette, mix, withAlpha } from "../lib/color";
import { axisFrame, toPoints } from "../lib/geometry";

const axis = axisFrame(SPECTRUM_AXIS);
const REACH = 2600;

// Bands parallel to the diagonal on the lit side, nearest first. The first is
// a thin darker edge hugging the line.
const EDGE = 36;
const BAND_COUNT = 6;
const BAND_WIDTH = 160;
const bands = [0, EDGE, ...Array.from({ length: BAND_COUNT }, (_, k) => EDGE + (k + 1) * BAND_WIDTH)];

const bandPolygon = (from: number, to: number) =>
  toPoints([
    axis.at(-REACH, -from),
    axis.at(axis.length + REACH, -from),
    axis.at(axis.length + REACH, -to),
    axis.at(-REACH, -to),
  ]);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const mid = axis.at(axis.length / 2);
const far = axis.at(axis.length / 2, -900);

// Peak opacity of the flood. It is screened over the artwork, so it reads as
// neon light on the lit half rather than a flat block of paint.
const STRENGTH = 0.45;

// Color flood of the lit half. It sweeps in as stripes from the diagonal
// outwards when a drop starts, holds, and retreats the same way.
export const LitFlood: React.FC<{
  palette: Palette;
  flood: number;
  kick: number;
}> = ({ palette, flood, kick }) => {
  const bandVisible = (k: number) => clamp01((flood - (k / bands.length) * 0.65) / 0.35);
  // Once every band is in, one polygon takes over so no seams show between
  // neighbouring stripes.
  const solid = clamp01((flood - 0.9) / 0.1);
  return (
    <svg
      width={VIDEO.width}
      height={VIDEO.height}
      style={{ position: "absolute", inset: 0, overflow: "visible" }}
    >
      <defs>
        {/* Brightest at the line, fading toward the corner, like neon glow. */}
        <linearGradient id="flood-neon" gradientUnits="userSpaceOnUse" x1={mid.x} y1={mid.y} x2={far.x} y2={far.y}>
          <stop offset="0" stopColor={mix(palette.accent, "#ffffff", 0.1)} />
          <stop offset="0.45" stopColor={withAlpha(mix(palette.accent, palette.secondary, 0.15), 0.75)} />
          <stop offset="1" stopColor={withAlpha(palette.accent, 0.35)} />
        </linearGradient>
      </defs>
      {bandVisible(0) > 0 ? (
        <polygon points={bandPolygon(0, EDGE)} fill={palette.glow} opacity={bandVisible(0) * 0.35} />
      ) : null}
      {solid < 1
        ? bands.slice(1, -1).map((from, i) => {
            const k = i + 1;
            const visible = bandVisible(k) * (1 - solid);
            if (visible <= 0) {
              return null;
            }
            const to = k === bands.length - 2 ? REACH : bands[k + 1];
            return (
              <polygon key={k} points={bandPolygon(from, to)} fill="url(#flood-neon)" opacity={visible * STRENGTH} />
            );
          })
        : null}
      {solid > 0 ? (
        <polygon points={bandPolygon(EDGE, REACH)} fill="url(#flood-neon)" opacity={solid * STRENGTH} />
      ) : null}
      {/* Soft pulse on each kick, outside the flood too. */}
      <polygon
        points={bandPolygon(0, REACH)}
        fill="url(#flood-neon)"
        opacity={kick * 0.16 * (1 - flood)}
      />
    </svg>
  );
};
