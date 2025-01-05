import { FunctionComponent, useMemo } from "react";
import LazyPlotlyPlot from "../../internal/Plotly/LazyPlotlyPlot";
import wavelets_py from "./wavelets.py?raw";
import { removeMainSectionFromPy } from "../../internal/utils/removeMainSectionFromPy";
import { usePyodideResult } from "../../internal/pyodide/usePyodideResult";

type WaveletBasisPlotProps = {
  wavelet: string;
  coeffSizes: number[];
  level: number;
  maxWidth?: number;
};

export const WaveletBasisPlot: FunctionComponent<WaveletBasisPlotProps> = ({
  wavelet,
  coeffSizes,
  level,
  maxWidth,
}) => {
  const code = `
${removeMainSectionFromPy(wavelets_py)}
basis_wavelets = get_basis_wavelets(
  coeff_sizes=${JSON.stringify(coeffSizes)},
  level=${level},
  wavelet='${wavelet}'
)
{'basis_wavelets': basis_wavelets}
`;
  const { result: r } = usePyodideResult(code);
  if (!r?.basis_wavelets) {
    return <div>Computing...</div>;
  }
  return (
    <div style={{ width: 400 }}>
      <WaveletBasisPlotChild
        level={level}
        basisWavelets={r.basis_wavelets}
        waveletName={wavelet}
        maxWidth={maxWidth}
      />
    </div>
  );
};

type WaveletBasisPlotChildProps = {
  waveletName: string;
  level: number;
  basisWavelets: number[][];
  maxWidth?: number;
};

const WaveletBasisPlotChild: FunctionComponent<WaveletBasisPlotChildProps> = ({
  waveletName,
  basisWavelets,
  level,
  maxWidth,
}) => {
  const width = Math.max(400, maxWidth || 0);
  const height = 300;
  const { data, layout } = useMemo(() => {
    const centerIndex = Math.floor(basisWavelets.length / 2);
    const data = [
      ...basisWavelets.map((y) => {
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
        x: basisWavelets[centerIndex].map((_, j) => j),
        y: basisWavelets[centerIndex],
        type: "scatter",
        mode: "lines",
        line: {
          color: "black",
          width: 2,
        },
      },
    ];
    const layout = {
      width: width - 50,
      height,
      title: `Basis ${waveletName} wavelets at level ${level}`,
      margin: {
        l: 60,
        r: 20,
        t: 70,
        b: 60,
        pad: 0,
      },
      xaxis: {
        automargin: false,
      },
      yaxis: {
        automargin: false,
        tickpadding: 5,
        ticklen: 4,
      },
      // no legend
      showlegend: false,
    };
    return { data, layout };
  }, [basisWavelets, level, waveletName, width, height]);
  return <LazyPlotlyPlot data={data} layout={layout} />;
};
