import type { Axis } from "../config";

export type Point = { x: number; y: number };

export type AxisFrame = {
  length: number;
  // Unit tangent along the axis.
  tx: number;
  ty: number;
  // Unit normal, pointing to the upper-right side of the diagonal.
  nx: number;
  ny: number;
  // Point at distance `s` along the axis, displaced `d` along the normal.
  at: (s: number, d?: number) => Point;
};

export const axisFrame = (axis: Axis): AxisFrame => {
  const dx = axis.x2 - axis.x1;
  const dy = axis.y2 - axis.y1;
  const length = Math.hypot(dx, dy);
  const tx = dx / length;
  const ty = dy / length;
  const nx = ty;
  const ny = -tx;
  return {
    length,
    tx,
    ty,
    nx,
    ny,
    at: (s, d = 0) => ({
      x: axis.x1 + tx * s + nx * d,
      y: axis.y1 + ty * s + ny * d,
    }),
  };
};

export const toPoints = (points: Point[]) =>
  points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

// Half-planes on each side of an axis, extended far past the frame so camera
// moves never expose an edge.
export const splitPolygons = (axis: Axis, reach = 2600) => {
  const f = axisFrame(axis);
  const start = f.at(-reach);
  const end = f.at(f.length + reach);
  const shift = (p: Point, d: number) => ({
    x: p.x + f.nx * d,
    y: p.y + f.ny * d,
  });
  return {
    upperRight: [start, end, shift(end, reach), shift(start, reach)],
    lowerLeft: [start, end, shift(end, -reach), shift(start, -reach)],
  };
};

// Stop (in %) at which a CSS linear-gradient, angled along the axis normal,
// crosses the axis inside the given box. Lets a mask cut exactly on the line.
export const axisGradient = (
  axis: Axis,
  box: { left: number; top: number; width: number; height: number },
) => {
  const f = axisFrame(axis);
  const angleRad = Math.atan2(f.nx, -f.ny);
  const gradientLength =
    Math.abs(box.width * Math.sin(angleRad)) +
    Math.abs(box.height * Math.cos(angleRad));
  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;
  const centerDistance = (cx - axis.x1) * f.nx + (cy - axis.y1) * f.ny;
  return {
    angleDeg: (angleRad * 180) / Math.PI,
    stopPercent: (0.5 - centerDistance / gradientLength) * 100,
  };
};

// 0 at both ends of the axis, 1 in the middle.
export const axisEnvelope = (u: number, exponent = 0.7) =>
  Math.pow(Math.max(0, Math.sin(Math.PI * u)), exponent);
