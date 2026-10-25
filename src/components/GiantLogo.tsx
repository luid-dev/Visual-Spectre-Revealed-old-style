import { AbsoluteFill, Img, staticFile } from "remotion";
import { ASSETS, GIANT_LOGO, LOGO_ASPECT, PARALLAX, VIDEO } from "../config";
import type { Palette } from "../lib/color";
import { usePreloadedImage } from "../lib/use-preloaded-image";
import { BACKGROUND_FILTER } from "./Background";
import { useCameraOffset } from "./Camera";

const width = GIANT_LOGO.width;
const height = width / LOGO_ASPECT;
const left = GIANT_LOGO.centerX - width / 2;
const top = GIANT_LOGO.centerY - height / 2;

const logoMask = (src: string): React.CSSProperties => ({
  maskImage: `url("${src}")`,
  maskSize: "100% 100%",
  WebkitMaskImage: `url("${src}")`,
  WebkitMaskSize: "100% 100%",
});

// The isotype as a tinted window onto the full-color artwork, with a dark
// copy behind it, like the big logo in Revealed visualizers.
export const GiantLogo: React.FC<{ palette: Palette; bass: number }> = ({
  palette,
  bass,
}) => {
  const camera = useCameraOffset();
  const logoSrc = staticFile(ASSETS.logoWhite);
  usePreloadedImage(logoSrc);

  // Counter the parallax difference so the artwork seen through the window
  // lines up with the background behind it.
  const align = PARALLAX.background - PARALLAX.logo;
  const scale = 1 + bass * 0.015;

  const box: React.CSSProperties = {
    position: "absolute",
    left,
    top,
    width,
    height,
    transform: `scale(${scale})`,
  };

  return (
    <AbsoluteFill>
      <div
        style={{
          ...box,
          ...logoMask(logoSrc),
          left: left + GIANT_LOGO.shadowOffset.x,
          top: top + GIANT_LOGO.shadowOffset.y,
          backgroundColor: palette.logoShadow,
          opacity: 0.6,
        }}
      />
      <div style={{ ...box, ...logoMask(logoSrc), overflow: "hidden" }}>
        <Img
          src={staticFile(ASSETS.background)}
          style={{
            position: "absolute",
            left: -left + camera.x * align,
            top: -top + camera.y * align,
            width: VIDEO.width,
            height: VIDEO.height,
            objectFit: "cover",
            filter: BACKGROUND_FILTER,
          }}
        />
        <AbsoluteFill style={{ backgroundColor: palette.logoTint, opacity: 0.58 + bass * 0.08 }} />
      </div>
    </AbsoluteFill>
  );
};
