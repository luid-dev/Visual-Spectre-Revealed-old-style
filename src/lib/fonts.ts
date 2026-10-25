import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";

export const { fontFamily: oswald } = loadOswald("normal", {
  weights: ["300", "400", "500", "600"],
  subsets: ["latin"],
});
