import { zColor } from "@remotion/zod-types";
import { z } from "zod";

// Defaults live inline in Root.tsx.
export const visualizerSchema = z.object({
  // Brand color (magenta from the artwork): lit half, flood, title box,
  // corner badge and the glow of the spectrum.
  accentColor: zColor(),
  // Warm second stop for the lit-half gradient.
  secondaryColor: zColor(),
  // Dark half of the artwork and the catalog label.
  shadeColor: zColor(),
  // Card behind the loading logo in the intro.
  introColor: zColor(),
  // Off = let the title already printed in the background image do the talking.
  showTrackText: z.boolean(),
  artist: z.string(),
  title: z.string(),
  subtitle: z.string(),
  // Top-left catalog tag. Empty hides it.
  catalogLabel: z.string(),
});

export type VisualizerProps = z.infer<typeof visualizerSchema>;
