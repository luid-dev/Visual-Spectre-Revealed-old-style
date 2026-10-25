import { AbsoluteFill, Img, staticFile } from "remotion";
import { ASSETS, PARALLAX, SPECTRUM_AXIS, VIDEO } from "../config";
import { type Palette, mix, withAlpha } from "../lib/color";
import { axisFrame, splitPolygons, toPoints } from "../lib/geometry";
import { useCameraOffset } from "./Camera";

const axis = axisFrame(SPECTRUM_AXIS);
const halves = splitPolygons(SPECTRUM_AXIS);
const mid = axis.at(axis.length / 2);
const litEnd = axis.at(axis.length / 2, -1000);

export const BACKGROUND_FILTER = "saturate(1.1) contrast(1.04)";

// Lit half: the artwork with an accent haze screened over it. Dark half: the
// same artwork pushed down under the shade color.
export const Background: React.FC<{ palette: Palette; bass: number }> = ({
  palette,
  bass,
}) => {
  const camera = useCameraOffset();
  // The photo sits deep (parallax 0.5) but the split must stay locked to the
  // spectrum line, which lives on the spectrum layer.
  const lock = PARALLAX.spectrum - PARALLAX.background;
  const lockX = camera.x * lock;
  const lockY = camera.y * lock;
  const darkClip = `polygon(${halves.upperRight
    .map((p) => `${(p.x + lockX).toFixed(1)}px ${(p.y + lockY).toFixed(1)}px`)
    .join(", ")})`;

  const image: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  };

  return (
    <AbsoluteFill>
      <Img src={staticFile(ASSETS.background)} style={{ ...image, filter: BACKGROUND_FILTER }} />

      <svg
        width={VIDEO.width}
        height={VIDEO.height}
        style={{
          position: "absolute",
          inset: 0,
          overflow: "visible",
          mixBlendMode: "screen",
          transform: `translate(${lockX}px, ${lockY}px)`,
        }}
      >
        <defs>
          <linearGradient
            id="bg-lit"
            gradientUnits="userSpaceOnUse"
            x1={mid.x}
            y1={mid.y}
            x2={litEnd.x}
            y2={litEnd.y}
          >
            <stop offset="0" stopColor={palette.accent} />
            <stop offset="0.35" stopColor={withAlpha(mix(palette.accent, palette.secondary, 0.3), 0.7)} />
            <stop offset="1" stopColor={withAlpha(palette.secondary, 0.1)} />
          </linearGradient>
        </defs>
        <polygon
          points={toPoints(halves.lowerLeft)}
          fill="url(#bg-lit)"
          opacity={0.32 + bass * 0.3}
        />
      </svg>

      <AbsoluteFill style={{ clipPath: darkClip }}>
        <Img
          src={staticFile(ASSETS.background)}
          style={{ ...image, filter: "saturate(0.7) brightness(0.85)" }}
        />
        <AbsoluteFill style={{ backgroundColor: palette.shade, opacity: 0.62 }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
