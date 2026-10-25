import { Easing, Img, interpolate, staticFile } from "remotion";
import { ASSETS, INTRO, LOGO_ASPECT } from "../config";
import { type Palette, withAlpha } from "../lib/color";

const SIZE = 150;
const LOGO_WIDTH = 64;
const LOGO_HEIGHT = LOGO_WIDTH / LOGO_ASPECT;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Triangle in the top-right corner. Normally the lower-left half of the
// corner square with the isotype; during a flood it flips to the upper-right
// half, like the reference.
export const CornerBadge: React.FC<{
  palette: Palette;
  frame: number;
  flood: number;
  bass: number;
}> = ({ palette, frame, flood, bass }) => {
  const enter = interpolate(frame, [INTRO.wipeEnd - 24, INTRO.wipeEnd + 6], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const flip = interpolate(flood, [0.35, 0.75], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  // Third vertex travels from bottom-left to top-right; the triangle collapses
  // onto the diagonal halfway, which reads as a flip.
  const vx = SIZE * flip;
  const vy = SIZE * (1 - flip);
  const logo = palette.logoOnAccent === "black" ? ASSETS.logoBlack : ASSETS.logoWhite;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: SIZE,
        height: SIZE,
        transform: `translate(${(1 - enter) * SIZE}px, ${-(1 - enter) * SIZE}px)`,
        // Neon halo around the clipped triangle.
        filter: `drop-shadow(0 0 ${12 + bass * 14}px ${withAlpha(palette.accent, 0.55)})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: `polygon(0px 0px, ${vx}px ${vy}px, ${SIZE}px ${SIZE}px)`,
          backgroundColor: palette.accent,
        }}
      />
      <Img
        src={staticFile(logo)}
        style={{
          position: "absolute",
          left: 14,
          top: SIZE - 18 - LOGO_HEIGHT,
          width: LOGO_WIDTH,
          height: LOGO_HEIGHT,
          opacity: interpolate(flip, [0, 0.4], [1, 0], clamp),
        }}
      />
    </div>
  );
};
