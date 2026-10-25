import { createContext, useContext } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

type CameraOffset = { x: number; y: number };

const CameraContext = createContext<CameraOffset>({ x: 0, y: 0 });

export const useCameraOffset = () => useContext(CameraContext);

// Slow 2.5D drift with a soft kick pump, kept subtle like the Revealed
// reference (no shake). Layers inside read the offset through <ParallaxLayer>
// and scale it by their depth.
export const Camera: React.FC<{ bass: number; children: React.ReactNode }> = ({
  bass,
  children,
}) => {
  const frame = useCurrentFrame();

  const driftX = Math.sin(frame / 70) * 8;
  const driftY = Math.cos(frame / 90) * 6;
  const rotation = Math.sin(frame / 120) * 0.2;
  // Overscan so drift and rotation never reveal an edge.
  const scale = 1.04 + bass * 0.02;

  return (
    <CameraContext.Provider value={{ x: driftX, y: driftY }}>
      <AbsoluteFill
        style={{
          transform: `scale(${scale}) rotate(${rotation}deg)`,
          transformOrigin: "50% 50%",
        }}
      >
        {children}
      </AbsoluteFill>
    </CameraContext.Provider>
  );
};

export const ParallaxLayer: React.FC<{
  factor: number;
  blendMode?: React.CSSProperties["mixBlendMode"];
  children: React.ReactNode;
}> = ({ factor, blendMode, children }) => {
  const { x, y } = useCameraOffset();
  return (
    <AbsoluteFill
      style={{
        transform: `translate3d(${x * factor}px, ${y * factor}px, 0)`,
        mixBlendMode: blendMode,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
