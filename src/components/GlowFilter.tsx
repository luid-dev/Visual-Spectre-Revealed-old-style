import { Fragment } from "react";
import { VIDEO } from "../config";

type GlowLayer = { color: string; blur: number; strength?: number };

// SVG equivalent of stacked CSS drop-shadow(0 0 Npx color): each layer is
// the shape's alpha, blurred and flooded with a color. `blur` is the CSS
// drop-shadow radius (stdDeviation = radius / 2).
export const GlowFilter: React.FC<{ id: string; layers: GlowLayer[] }> = ({
  id,
  layers,
}) => (
  <filter
    id={id}
    filterUnits="userSpaceOnUse"
    x={-300}
    y={-300}
    width={VIDEO.width + 600}
    height={VIDEO.height + 600}
    colorInterpolationFilters="sRGB"
  >
    {layers.map((layer, i) => (
      <Fragment key={i}>
        <feGaussianBlur
          in="SourceAlpha"
          stdDeviation={layer.blur / 2}
          result={`${id}-blur-${i}`}
        />
        <feFlood floodColor={layer.color} result={`${id}-color-${i}`} />
        <feComposite
          in={`${id}-color-${i}`}
          in2={`${id}-blur-${i}`}
          operator="in"
          result={`${id}-glow-${i}`}
        />
      </Fragment>
    ))}
    <feMerge>
      {layers.flatMap((layer, i) =>
        Array.from({ length: layer.strength ?? 1 }, (_, n) => (
          <feMergeNode key={`${i}-${n}`} in={`${id}-glow-${i}`} />
        )),
      )}
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>
);
