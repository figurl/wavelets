import { FunctionComponent, useMemo } from "react";
import LazyPlotlyPlot from "../../Plotly/LazyPlotlyPlot";
import { usePyodideResult } from "./useCoeffSizes";

type WaveletBasisPlotProps = {
  wavelet: string;
  coeffSizes: number[];
  level: number;
};

export const WaveletBasisPlot: FunctionComponent<WaveletBasisPlotProps> = ({
  wavelet,
  coeffSizes,
  level,
}) => {
  const code = `
import pywt
import numpy as np

coeff_sizes = ${JSON.stringify(coeffSizes)}
wavelet_extension_mode = 'symmetric'

basis_functions = []
for offset in range(${coeffSizes[level]}):
  coeffs = [];
  for i in range(len(coeff_sizes)):
    coeffs.append(np.zeros(coeff_sizes[i]))
  coeffs[${level}][offset] = 1
  y = pywt.waverec(coeffs, '${wavelet}', mode=wavelet_extension_mode)
  basis_functions.append(y.tolist())
{'basis_functions': basis_functions}
`;
  const r = usePyodideResult(code);
  if (!r?.basis_functions) {
    return <div>Loading...</div>;
  }
  return (
    <div style={{ width: 400 }}>
      <WaveletBasisPlotChild level={level} basisFunctions={r.basis_functions} />
    </div>
  );
};

type WaveletBasisPlotChildProps = {
  level: number;
  basisFunctions: number[][];
};

const WaveletBasisPlotChild: FunctionComponent<WaveletBasisPlotChildProps> = ({
  basisFunctions,
  level,
}) => {
  const width = 400;
  const height = 300;
  const { data, layout } = useMemo(() => {
    const centerIndex = Math.floor(basisFunctions.length / 2);
    const data = [
      ...basisFunctions.map((y) => {
        return {
          x: y.map((_, j) => j),
          y,
          type: "scatter",
          mode: "lines",
          line: {
            color: "lightgray",
            width: 1,
          },
        };
      }),
      {
        x: basisFunctions[centerIndex].map((_, j) => j),
        y: basisFunctions[centerIndex],
        type: "scatter",
        mode: "lines",
        line: {
          color: "black",
          width: 2,
        },
      },
    ];
    const layout = {
      width,
      height,
      title: `Basis wavelets at level ${level}`,
      margin: {
        l: 60,
        r: 20,
        t: 70,
        b: 60,
        pad: 0
      },
      xaxis: {
        automargin: false
      },
      yaxis: {
        automargin: false,
        tickpadding: 5,
        ticklen: 4
      },
      // no legend
      showlegend: false,
    };
    return { data, layout };
  }, [basisFunctions, level]);
  return <LazyPlotlyPlot data={data} layout={layout} />;
};
