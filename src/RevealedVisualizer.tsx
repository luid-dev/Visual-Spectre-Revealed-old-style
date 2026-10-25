import { useMemo } from "react";
import { AbsoluteFill, Html5Audio, staticFile, useCurrentFrame } from "remotion";
import { useAudioAnalysis } from "./audio/use-audio-analysis";
import { Background } from "./components/Background";
import { Camera, ParallaxLayer } from "./components/Camera";
import { CatalogLabel } from "./components/CatalogLabel";
import { CornerBadge } from "./components/CornerBadge";
import { DiagonalSpectrum } from "./components/DiagonalSpectrum";
import { GiantLogo } from "./components/GiantLogo";
import { HudOverlays } from "./components/HudOverlays";
import { Intro } from "./components/Intro";
import { LitFlood } from "./components/LitFlood";
import { ParticleField } from "./components/ParticleField";
import { TrackText } from "./components/TrackText";
import { ASSETS, PARALLAX } from "./config";
import { buildPalette } from "./lib/color";
import type { VisualizerProps } from "./schema";

export const RevealedVisualizer: React.FC<VisualizerProps> = ({
  accentColor,
  secondaryColor,
  shadeColor,
  introColor,
  showTrackText,
  artist,
  title,
  subtitle,
  catalogLabel,
}) => {
  const frame = useCurrentFrame();
  const audio = useAudioAnalysis();
  const palette = useMemo(
    () => buildPalette(accentColor, secondaryColor, shadeColor, introColor),
    [accentColor, secondaryColor, shadeColor, introColor],
  );
  const kick = Number.isFinite(audio.beat.age)
    ? Math.exp(-audio.beat.age / 8) * audio.beat.level
    : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#05070c", overflow: "hidden" }}>
      <Html5Audio src={staticFile(ASSETS.audio)} />

      <Camera bass={audio.bass}>
        <ParallaxLayer factor={PARALLAX.background}>
          <Background palette={palette} bass={audio.bass} />
        </ParallaxLayer>
        <ParallaxLayer factor={PARALLAX.logo}>
          <GiantLogo palette={palette} bass={audio.bass} />
        </ParallaxLayer>
        {/* Same depth as the spectrum so the stripes start right at the line;
            screened so the flood glows over the artwork instead of hiding it. */}
        <ParallaxLayer factor={PARALLAX.spectrum} blendMode="screen">
          <LitFlood palette={palette} flood={audio.flood} kick={kick} />
        </ParallaxLayer>
        <ParallaxLayer factor={PARALLAX.spectrum} blendMode="screen">
          <HudOverlays audio={audio} palette={palette} frame={frame} />
          <DiagonalSpectrum audio={audio} palette={palette} frame={frame} />
        </ParallaxLayer>
        <ParallaxLayer factor={PARALLAX.particles} blendMode="screen">
          <ParticleField
            count={90}
            palette={palette}
            bass={audio.bass}
            bassAccum={audio.bassAccum}
            frame={frame}
          />
        </ParallaxLayer>
      </Camera>

      {/* Lens vignette, outside the camera so it never moves. */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(0, 0, 0, 0) 60%, rgba(0, 3, 10, 0.35) 100%)",
        }}
      />

      <CatalogLabel label={catalogLabel} palette={palette} frame={frame} />
      <CornerBadge palette={palette} frame={frame} flood={audio.flood} bass={audio.bass} />
      {showTrackText ? (
        <TrackText
          artist={artist}
          title={title}
          subtitle={subtitle}
          palette={palette}
          bass={audio.bass}
          frame={frame}
        />
      ) : null}

      <Intro palette={palette} bass={audio.bass} hitFrame={audio.hitFrame} frame={frame} />
    </AbsoluteFill>
  );
};
