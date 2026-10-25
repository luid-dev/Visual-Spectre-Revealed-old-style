import { ALL_FORMATS, Input, UrlSource } from "mediabunny";
import { type CalculateMetadataFunction, Composition, staticFile } from "remotion";
import { ASSETS, FALLBACK_DURATION_SECONDS, VIDEO } from "./config";
import { RevealedVisualizer } from "./RevealedVisualizer";
import { type VisualizerProps, visualizerSchema } from "./schema";

// Match the composition length to the audio file.
const calculateMetadata: CalculateMetadataFunction<VisualizerProps> = async () => {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new UrlSource(staticFile(ASSETS.audio)),
  });
  try {
    const seconds = await input.computeDuration();
    return { durationInFrames: Math.ceil(seconds * VIDEO.fps) };
  } finally {
    input.dispose();
  }
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="RevealedVisualizer"
      component={RevealedVisualizer}
      durationInFrames={Math.ceil(FALLBACK_DURATION_SECONDS * VIDEO.fps)}
      fps={VIDEO.fps}
      width={VIDEO.width}
      height={VIDEO.height}
      schema={visualizerSchema}
      // Inline so the Studio props panel can save edits back to this file.
      defaultProps={{
        accentColor: "#ec1c84",
        secondaryColor: "#f5923e",
        shadeColor: "#121519",
        introColor: "#121519",
        showTrackText: true,
        artist: "AVICII VS NICKY ROMERO",
        title: "I COULD BE THE ONE",
        subtitle: "(JET ZEITH TRANCE EDIT)",
        catalogLabel: "",
      }}
      calculateMetadata={calculateMetadata}
    />
  );
};
