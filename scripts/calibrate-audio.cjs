// Measures a track and prints the BAND_RANGE / BIN_REFERENCE values for
// src/config.ts, so the visualizer reacts well to a new song.
//
//   node scripts/calibrate-audio.cjs "public/my track.wav"
//
// Supports 16-bit PCM WAV.
const fs = require("fs");
const path = require("path");
const { visualizeAudio } = require("@remotion/media-utils");

const FPS = 60;
const BINS = 128;
const BANDS = { bass: [0, 10], mids: [11, 50], highs: [51, 127] };
const REFERENCE_BINS = [0, 1, 2, 5, 10, 20, 30, 50, 80, 100, 127];

const file =
  process.argv[2] ??
  path.join(
    __dirname,
    "../public/I Could Be The One [Avicii vs Nicky Romero] Jet Zeith Edit previuw wav.wav",
  );

const readWav = (buffer) => {
  let offset = 12;
  let format;
  while (offset < buffer.length) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    if (id === "fmt ") {
      format = {
        channels: buffer.readUInt16LE(offset + 10),
        sampleRate: buffer.readUInt32LE(offset + 12),
        bits: buffer.readUInt16LE(offset + 22),
      };
    }
    if (id === "data") {
      if (!format || format.bits !== 16) {
        throw new Error("Only 16-bit PCM WAV is supported");
      }
      const frames = Math.floor(size / (2 * format.channels));
      const channelWaveforms = Array.from(
        { length: format.channels },
        () => new Float32Array(frames),
      );
      for (let i = 0; i < frames; i++) {
        for (let c = 0; c < format.channels; c++) {
          channelWaveforms[c][i] =
            buffer.readInt16LE(offset + 8 + (i * format.channels + c) * 2) / 32768;
        }
      }
      return {
        channelWaveforms,
        sampleRate: format.sampleRate,
        durationInSeconds: frames / format.sampleRate,
        numberOfChannels: format.channels,
        resultId: "calibration",
        isRemote: false,
      };
    }
    offset += 8 + size + (size % 2);
  }
  throw new Error("No data chunk found");
};

const percentile = (values, p) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(p * (sorted.length - 1))];
};

const mean = (values, [from, to]) => {
  let total = 0;
  for (let i = from; i <= to; i++) total += values[i];
  return total / (to - from + 1);
};

const audioData = readWav(fs.readFileSync(file));
const totalFrames = Math.floor(audioData.durationInSeconds * FPS);
const bands = { bass: [], mids: [], highs: [] };
const perBin = Array.from({ length: BINS }, () => []);

for (let frame = 0; frame < totalFrames; frame++) {
  const values = visualizeAudio({
    audioData,
    fps: FPS,
    frame,
    numberOfSamples: BINS,
    smoothing: false,
  });
  for (const band of Object.keys(BANDS)) bands[band].push(mean(values, BANDS[band]));
  if (frame % 4 === 0) values.forEach((v, i) => perBin[i].push(v));
}

const fmt = (v) => Number(v.toPrecision(3));
console.log(`Duration: ${audioData.durationInSeconds.toFixed(2)}s (${totalFrames} frames)\n`);
console.log("export const BAND_RANGE = {");
for (const band of Object.keys(BANDS)) {
  console.log(
    `  ${band}: { floor: ${fmt(percentile(bands[band], 0.1))}, ceil: ${fmt(percentile(bands[band], 0.99))} },`,
  );
}
console.log("} as const;\n");
console.log("export const BIN_REFERENCE: ReadonlyArray<readonly [number, number]> = [");
for (const bin of REFERENCE_BINS) console.log(`  [${bin}, ${fmt(percentile(perBin[bin], 0.95))}],`);
console.log("];");
