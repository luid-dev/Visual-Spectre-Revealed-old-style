import { interpolate } from "remotion";
import { INTRO } from "../config";
import { type Palette, mix, withAlpha } from "../lib/color";
import { oswald } from "../lib/fonts";

// Small catalog tag in the top-left corner.
export const CatalogLabel: React.FC<{
  label: string;
  palette: Palette;
  frame: number;
}> = ({ label, palette, frame }) => {
  if (!label) {
    return null;
  }
  const enter = interpolate(frame, [INTRO.wipeEnd - 10, INTRO.wipeEnd + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        top: 70,
        padding: "5px 12px 6px",
        backgroundColor: withAlpha(mix(palette.shade, "#000000", 0.3), 0.78),
        color: "#ffffff",
        fontFamily: oswald,
        fontWeight: 400,
        fontSize: 26,
        lineHeight: 1.1,
        letterSpacing: "0.02em",
        opacity: enter,
      }}
    >
      {label}
    </div>
  );
};
