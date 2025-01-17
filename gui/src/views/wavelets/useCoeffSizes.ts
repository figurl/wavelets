/* eslint-disable @typescript-eslint/no-explicit-any */
import { usePyodideResult } from "../../internal/pyodide/usePyodideResult";
import { removeMainSectionFromPy } from "../../internal/utils/removeMainSectionFromPy";
import wavelets_py from "./wavelets.py?raw";

export const useCoeffSizes = (
  wavelet: string,
  n: number,
): number[] | undefined => {
  const code = `
${removeMainSectionFromPy(wavelets_py)}
coeff_sizes = get_coeff_sizes(n=${n}, wavelet='${wavelet}')
{'coeff_sizes': coeff_sizes}
`;
  const { result: r } = usePyodideResult(code);
  return r ? r.coeff_sizes : undefined;
};
