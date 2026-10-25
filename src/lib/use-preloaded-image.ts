import { useEffect, useState } from "react";
import { useDelayRender } from "remotion";

// For images used through CSS (mask-image), which <Img> cannot wait for.
// Holds the render until the file is decoded so no frame shows it missing.
export const usePreloadedImage = (src: string) => {
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() => delayRender(`Preloading ${src}`));

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.src = src;
    img
      .decode()
      .then(() => {
        if (!cancelled) {
          continueRender(handle);
        }
      })
      .catch((err) => cancelRender(err));
    return () => {
      cancelled = true;
      continueRender(handle);
    };
  }, [src, handle, continueRender, cancelRender]);
};
