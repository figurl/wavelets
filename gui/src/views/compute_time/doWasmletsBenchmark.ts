/* eslint-disable @typescript-eslint/no-explicit-any */
import { wavedec, waverec, init, Wavelet } from "wasmlets";

const doWasmletsBenchmark = async (o: {
  numSamples: number;
  waveletNames: string[];
}) => {
  const { numSamples, waveletNames } = o;

  const results: Array<{
    dec_computation_time_msec: number;
    rec_computation_time_msec: number;
    num_samples: number;
    wavelet_name: string;
  }> = [];

  await init();

  // note to BW: adjust numTrials
  const numTrials = 100;
  const signal = new Float64Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    signal[i] = Math.random();
  }
  for (const waveletName of waveletNames) {
    let coeffs: Float64Array[] = [];
    const timerDec = Date.now();
    for (let i = 0; i < numTrials; i++) {
      coeffs = wavedec(signal, waveletName as Wavelet);
    }
    const elapsedDec = Date.now() - timerDec;
    const timeMsecDec = elapsedDec / numTrials;

    const timerRec = Date.now();
    for (let i = 0; i < numTrials; i++) {
      waverec(coeffs, waveletName as Wavelet, signal.length);
    }
    const elapsedRec = Date.now() - timerRec;
    const timeMsecRec = elapsedRec / numTrials;

    results.push({
      dec_computation_time_msec: timeMsecDec,
      rec_computation_time_msec: timeMsecRec,
      num_samples: numSamples,
      wavelet_name: waveletName,
    });
  }
  return results;
};

export default doWasmletsBenchmark;
