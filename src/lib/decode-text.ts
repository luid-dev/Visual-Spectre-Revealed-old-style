import { random } from "remotion";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/<>_+";

export type DecodedChar = {
  char: string;
  // What to draw right now: the final char, a scrambled glyph, or nothing.
  shown: string;
  revealed: boolean;
};

// Letter-by-letter "decoding": each char appears scrambled, cycles glyphs,
// then locks into place. Fully deterministic per frame.
export const decodeText = (
  text: string,
  frame: number,
  start: number,
  end: number,
  seed: string,
): DecodedChar[] => {
  const chars = [...text];
  const count = Math.max(1, chars.length - 1);
  const span = end - start;
  return chars.map((char, i) => {
    if (char === " ") {
      return { char, shown: " ", revealed: true };
    }
    const appearAt = start + (i / count) * span * 0.45;
    const lockAt = start + span * 0.3 + (i / count) * span * 0.7;
    if (frame >= lockAt) {
      return { char, shown: char, revealed: true };
    }
    if (frame < appearAt) {
      return { char, shown: "", revealed: false };
    }
    const tick = Math.floor(frame / 2);
    const glyph =
      GLYPHS[Math.floor(random(`${seed}-${i}-${tick}`) * GLYPHS.length)];
    return { char, shown: glyph, revealed: false };
  });
};
