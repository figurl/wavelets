/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { pyodideRun } from "../../pyodide/pyodideRun";
import { getCachedValue, setCachedValue } from "../../utils/indexedDbCache";

const CACHE_VERSION = 1;
const CACHE_KEY_PREFIX = "pyodideResult";

const codeHash = (code: string) => {
  let hash = 0;
  if (code.length === 0) return hash;
  for (let i = 0; i < code.length; i++) {
    const char = code.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

export const usePyodideResult = (code: string) => {
  const [result, setResult] = useState<any>(undefined);
  useEffect(() => {
    let canceled = false;
    const run = async () => {
      setResult(undefined);
      const key = `${CACHE_KEY_PREFIX}/${CACHE_VERSION}/${codeHash(code)}`;
      const x = await getCachedValue(key);
      if (x) {
        setResult(x);
        return;
      }
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
        await setCachedValue(key, result);
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
