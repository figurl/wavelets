import { useState, useEffect } from "react";
import { pyodideRun } from "../../pyodide/pyodideRun";

export const usePyodideResult = (code: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(undefined);
  useEffect(() => {
    let canceled = false;
    const run = async () => {
      const result = await pyodideRun(code, {
        onStdout(data) {
          console.log(data);
        },
        onStderr(data) {
          console.error(data);
        },
        onStatus(status) {
          console.log("status", status);
        },
      });
      if (!canceled) {
        setResult(result);
      }
    };
    run();
    return () => {
      canceled = true;
    };
  }, [code]);
  return result;
};

export const useCoeffSizes = (wavelet: string, n: number): number[] | undefined => {
  const code = `
import pywt
import numpy as np
import random
wavelet_extension_mode = 'symmetric'
# Create a signal
x = np.random.randn(${n})
# Perform the decomposition
coeffs = pywt.wavedec(x, '${wavelet}', mode=wavelet_extension_mode)
coeff_sizes = [len(x) for x in coeffs]
{'coeff_sizes': coeff_sizes}
`;
console.log(code);
  const r = usePyodideResult(code);
  return r ? r.coeff_sizes : undefined;
};
