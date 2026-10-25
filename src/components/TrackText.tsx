import { Easing, interpolate } from "remotion";
import { INTRO, TRACK_TEXT } from "../config";
import { type Palette, withAlpha } from "../lib/color";
import { decodeText } from "../lib/decode-text";
import { oswald } from "../lib/fonts";

// Timeline, relative to the end of the solid intro screen.
const T0 = INTRO.solidEnd;
const TIMING = {
  artist: [T0 + 10, T0 + 55],
  box: [T0 + 16, T0 + 34],
  title: [T0 + 22, T0 + 60],
  subtitle: [T0 + 34, T0 + 78],
} as const;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Each char keeps the final glyph's width (hidden) so scrambling never
// shifts the centered layout.
const DecodedLine: React.FC<{
  text: string;
  frame: number;
  range: readonly [number, number];
  seed: string;
  scrambleColor: string;
}> = ({ text, frame, range, seed, scrambleColor }) => (
  <>
    {decodeText(text, frame, range[0], range[1], seed).map((c, i) => (
      <span key={i} style={{ position: "relative", display: "inline-block", whiteSpace: "pre" }}>
        <span style={{ visibility: c.revealed ? "visible" : "hidden" }}>{c.char}</span>
        {!c.revealed && c.shown ? (
          <span
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              textAlign: "center",
              color: scrambleColor,
            }}
          >
            {c.shown}
          </span>
        ) : null}
      </span>
    ))}
  </>
);

// Artist on top, title in a solid box, remix line under it; centered on the
// dark half like the reference.
export const TrackText: React.FC<{
  artist: string;
  title: string;
  subtitle: string;
  palette: Palette;
  bass: number;
  frame: number;
}> = ({ artist, title, subtitle, palette, bass, frame }) => {
  if (frame < TIMING.artist[0]) {
    return null;
  }
  const sweep = interpolate(frame, TIMING.box, [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.7, 0, 0.2, 1),
  });
  const artistIn = interpolate(frame, [TIMING.artist[0], TIMING.artist[0] + 12], [0, 1], clamp);
  const subtitleIn = interpolate(frame, [TIMING.subtitle[0], TIMING.subtitle[0] + 12], [0, 1], clamp);
  const scramble = withAlpha("#ffffff", 0.7);

  return (
    <div
      style={{
        position: "absolute",
        left: TRACK_TEXT.centerX,
        top: TRACK_TEXT.top,
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        color: "#ffffff",
        fontFamily: oswald,
        whiteSpace: "nowrap",
      }}
    >
      <div
        style={{
          fontWeight: 600,
          fontSize: 74,
          lineHeight: 1,
          letterSpacing: "0.01em",
          opacity: artistIn,
          transform: `translateY(${(1 - artistIn) * 16}px)`,
          textShadow: "0 3px 18px rgba(0, 0, 0, 0.35)",
        }}
      >
        <DecodedLine text={artist} frame={frame} range={TIMING.artist} seed="artist" scrambleColor={scramble} />
      </div>

      <div style={{ position: "relative", marginTop: 16, padding: "6px 20px 8px" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: palette.accent,
            transform: `scaleX(${sweep})`,
            transformOrigin: "0% 50%",
            // Neon halo that breathes with the kick.
            boxShadow: `0 0 ${22 + bass * 30}px ${withAlpha(palette.accent, 0.4 + bass * 0.2)}`,
          }}
        />
        <div
          style={{
            position: "relative",
            fontWeight: 400,
            fontSize: 58,
            lineHeight: 1.05,
            letterSpacing: "0.01em",
            clipPath: `inset(0 ${(1 - sweep) * 100}% 0 0)`,
          }}
        >
          <DecodedLine text={title} frame={frame} range={TIMING.title} seed="title" scrambleColor={scramble} />
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          fontWeight: 300,
          fontSize: 26,
          lineHeight: 1,
          letterSpacing: "0.22em",
          marginRight: "-0.22em",
          opacity: subtitleIn,
          textShadow: "0 2px 12px rgba(0, 0, 0, 0.35)",
        }}
      >
        <DecodedLine text={subtitle} frame={frame} range={TIMING.subtitle} seed="subtitle" scrambleColor={scramble} />
      </div>
    </div>
  );
};
