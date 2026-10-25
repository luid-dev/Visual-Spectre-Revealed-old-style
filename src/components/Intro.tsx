import { AbsoluteFill, Easing, Img, interpolate, staticFile } from "remotion";
import { ASSETS, INTRO, LOGO_ASPECT, SPECTRUM_AXIS, VIDEO } from "../config";
import { type Palette, mix } from "../lib/color";
import { oswald } from "../lib/fonts";
import { type Point, axisFrame, splitPolygons } from "../lib/geometry";

const axis = axisFrame(SPECTRUM_AXIS);
const halves = splitPolygons(SPECTRUM_AXIS);
const OPEN_DISTANCE = 1500;

const LOGO_WIDTH = 520;
const LOGO_HEIGHT = LOGO_WIDTH / LOGO_ASPECT;
const LOGO_CENTER = { x: VIDEO.width / 2, y: 500 };
const LOADER_WIDTH = 300;
const LOADER_TOP = LOGO_CENTER.y + LOGO_HEIGHT / 2 + 64;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const clipPolygon = (points: Point[]) =>
  `polygon(${points.map((p) => `${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`).join(", ")})`;

// Frames 0–90: solid intro-color card with the logo cutting in on the first kick.
// Frames 90–140: the card splits along the spectrum diagonal and flies apart.
export const Intro: React.FC<{
  palette: Palette;
  bass: number;
  hitFrame: number;
  frame: number;
}> = ({ palette, bass, hitFrame, frame }) => {
  if (frame >= INTRO.wipeEnd) {
    return null;
  }
  const { intro } = palette;

  const open = interpolate(frame, [INTRO.solidEnd, INTRO.wipeEnd], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.75, 0, 0.15, 1),
  });
  const away = open * OPEN_DISTANCE;

  const sinceHit = frame - hitFrame;
  const logoVisible = sinceHit >= 0;
  const punch = interpolate(sinceHit, [0, 10], [1.18, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const hitFlash = logoVisible ? interpolate(sinceHit, [0, 8], [0.45, 0], clamp) : 0;
  const progress = interpolate(frame, [0, INTRO.solidEnd - 4], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });

  // Guide line drawn along the diagonal before the split, then flashed.
  const guide = interpolate(frame, [hitFrame, INTRO.solidEnd], [0, 1], clamp);
  const seamFlash = interpolate(frame, [INTRO.solidEnd - 2, INTRO.solidEnd + 2, INTRO.solidEnd + 16], [0, 1, 0], clamp);
  const guideEnd = axis.at(axis.length * guide);

  const card: React.CSSProperties = {
    background: `radial-gradient(ellipse at 50% 45%, ${mix(intro, "#ffffff", 0.12)} 0%, ${intro} 45%, ${mix(
      intro,
      "#ffffff",
      0.03,
    )} 100%)`,
  };

  // Until the split, one unclipped card (two clipped halves leave a hairline).
  const split = frame >= INTRO.solidEnd;

  return (
    <AbsoluteFill>
      {split ? (
        <AbsoluteFill
          style={{
            ...card,
            clipPath: clipPolygon(halves.lowerLeft),
            transform: `translate(${-axis.nx * away}px, ${-axis.ny * away}px)`,
          }}
        />
      ) : null}
      <AbsoluteFill
        style={{
          ...card,
          clipPath: split ? clipPolygon(halves.upperRight) : undefined,
          transform: `translate(${axis.nx * away}px, ${axis.ny * away}px)`,
        }}
      >
        <Img
          src={staticFile(ASSETS.logoWhite)}
          style={{
            position: "absolute",
            left: LOGO_CENTER.x - LOGO_WIDTH / 2,
            top: LOGO_CENTER.y - LOGO_HEIGHT / 2,
            width: LOGO_WIDTH,
            height: LOGO_HEIGHT,
            // Ghosted while "loading", hard cut to full on the first kick.
            opacity: logoVisible ? 1 : 0.14,
            transform: `scale(${logoVisible ? punch + bass * 0.05 : 0.96})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: LOGO_CENTER.x - LOADER_WIDTH / 2,
            top: LOADER_TOP,
            width: LOADER_WIDTH,
            height: 2,
            backgroundColor: "rgba(255, 255, 255, 0.28)",
          }}
        >
          <div
            style={{
              width: `${progress * 100}%`,
              height: "100%",
              backgroundColor: "#ffffff",
              boxShadow: "0 0 10px rgba(255, 255, 255, 0.9)",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: LOGO_CENTER.x - LOADER_WIDTH / 2,
            top: LOADER_TOP + 14,
            width: LOADER_WIDTH,
            display: "flex",
            justifyContent: "space-between",
            fontFamily: oswald,
            fontWeight: 500,
            fontSize: 13,
            letterSpacing: "0.35em",
            color: "rgba(255, 255, 255, 0.8)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span>LOADING</span>
          <span>{String(Math.round(progress * 100)).padStart(3, "0")}</span>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ backgroundColor: "#ffffff", opacity: hitFlash }} />

      <svg
        width={VIDEO.width}
        height={VIDEO.height}
        style={{
          position: "absolute",
          inset: 0,
          filter: `drop-shadow(0 0 ${6 + seamFlash * 18}px #ffffff)`,
        }}
      >
        <line
          x1={SPECTRUM_AXIS.x1}
          y1={SPECTRUM_AXIS.y1}
          x2={guideEnd.x}
          y2={guideEnd.y}
          stroke="#ffffff"
          strokeWidth={1.5 + seamFlash * 4}
          opacity={frame < INTRO.solidEnd ? 0.35 : seamFlash}
        />
      </svg>
    </AbsoluteFill>
  );
};
