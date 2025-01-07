// To test wavelib, uncomment the following after putting wavelib/index.js and wavelib/index.d.ts
// import { init, wavedec, Wavelet } from "./wavelib";

// otherwise use this as empty placeholder
const init = async () => {};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const wavedec = (data: Float64Array, wavelet: Wavelet) => {
    return [];
}
type Wavelet = 'placeholder';

const doWavelibBenchmark = async (o: {
  numSamples: number;
  waveletNames: string[];
}) => {
  await init();
  const { numSamples, waveletNames } = o;
  // note to BW: adjust numTrials
  const numTrials = 10;
  const signal = new Float64Array(numSamples);
  const retLines: string[] = [];
  for (const waveletName of waveletNames) {
    const timer = Date.now();
    for (let i = 0; i < numTrials; i++) {
      wavedec(signal, waveletName as Wavelet);
    }
    const elapsed = Date.now() - timer;
    const timeMsec = elapsed / numTrials;
    retLines.push(`Wavelet: ${waveletName}: ${timeMsec.toFixed(2)} ms`);
    // Note to BW: to do more than one wavelet, remove the break
    break;
  }
  return retLines.join("\n");
};

export default doWavelibBenchmark;
