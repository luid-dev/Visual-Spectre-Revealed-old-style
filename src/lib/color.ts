import { interpolateColors } from "remotion";

type Rgba = { r: number; g: number; b: number; a: number };

// Accepts any CSS color Remotion understands (hex, rgb[a], hsl, named).
export const parseColor = (color: string): Rgba => {
  const normalized = interpolateColors(0, [0, 1], [color, color]);
  const match = normalized.match(/rgba?\(([^)]+)\)/);
  if (!match) {
    return { r: 255, g: 255, b: 255, a: 1 };
  }
  const [r, g, b, a = 1] = match[1].split(",").map((v) => Number(v.trim()));
  return { r, g, b, a };
};

export const withAlpha = (color: string, alpha: number) => {
  const { r, g, b } = parseColor(color);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const mix = (from: string, to: string, t: number) =>
  interpolateColors(t, [0, 1], [from, to]);

// WCAG relative luminance, 0 (black) → 1 (white).
export const luminance = (color: string) => {
  const { r, g, b } = parseColor(color);
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

export type Palette = {
  // Brand color: lit half, flood, title box, corner badge, glows.
  accent: string;
  // Warm second stop for gradients on the lit half and the intro.
  secondary: string;
  // Dark half of the artwork and the catalog label.
  shade: string;
  // Intro card behind the loading logo.
  intro: string;
  // Glow around the spectrum strands, wireframes and light streaks.
  glow: string;
  // Light tint for the thin outline strokes.
  line: string;
  // Near-white core of the strands.
  core: string;
  // Tint of the giant logo window, and its dark copy behind it.
  logoTint: string;
  logoShadow: string;
  // Logo to put on top of a solid accent fill.
  logoOnAccent: "white" | "black";
};

export const buildPalette = (
  accent: string,
  secondary: string,
  shade: string,
  intro: string,
): Palette => {
  // A dark brand color can't glow: lift it so the strands stay bright.
  const glow = luminance(accent) < 0.12 ? mix(accent, "#dfe9ff", 0.78) : accent;
  return {
    accent,
    secondary,
    shade,
    intro,
    glow,
    line: mix("#ffffff", glow, 0.35),
    core: mix("#ffffff", glow, 0.12),
    logoTint: mix(glow, "#ffffff", 0.55),
    logoShadow: mix(accent, "#000000", 0.6),
    logoOnAccent: luminance(accent) > 0.55 ? "black" : "white",
  };
};
