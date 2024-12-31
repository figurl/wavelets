import { FunctionComponent, useMemo } from "react";
import { ControlPanelState, Filter } from "../../ControlPanel";
import code1 from "./code1.py?raw";
import { usePyodideResult } from "../ShowBasisWaveletsPage/useCoeffSizes";
import LazyPlotlyPlot from "../../Plotly/LazyPlotlyPlot";

type CompressionPageProps = {
  width: number;
  height: number;
  controlPanelState: ControlPanelState;
};

const CompressionPage: FunctionComponent<CompressionPageProps> = ({
  width,
  height,
  controlPanelState,
}) => {
  if (controlPanelState.page !== "compression") {
    throw new Error("Invalid page");
  }
  const wavelet = controlPanelState.waveletName;
  const numSamples = controlPanelState.numSamples;
  const { filtLowcut, filtHighcut } = parseFilter(controlPanelState.filter);
  const code = `
${removeEverythingAfter(code1, "if __name__ == '__main__':")}
code1(
    wavelet_name='${wavelet}',
    num_samples=5000,
    nrmses=[0.1, 0.2, 0.4, 0.6, 0.8],
    sampling_frequency=30000,
    filt_lowcut=${filtLowcut ? filtLowcut : "None"},
    filt_highcut=${filtHighcut ? filtHighcut : "None"},
)
`;
  const result:
    | {
        timestamps: number[];
        original: number[];
        compressed: {
          quant_scale_factor: number;
          nrmse_target: number;
          nrmse: number;
          compressed: number[];
          compression_ratio: number;
        }[];
      }
    | undefined = usePyodideResult(code);

  if (!result) {
    return <div>Loading...</div>;
  }

  const stdevOriginal = Math.sqrt(
    result.original.reduce((acc, x) => acc + x * x, 0) / result.original.length
  );
  console.log("stdevOriginal", stdevOriginal);

  return (
    <div
      className="CompressionPage"
      style={{ position: "absolute", width, height, overflowY: "auto" }}
    >
      <CompressionRatioVsNRMSEPlot
        nrmses={result.compressed.map(({ nrmse }) => nrmse)}
        compressionRatios={result.compressed.map(
          ({ compression_ratio }) => compression_ratio
        )}
        width={Math.min(width, 600)}
        height={500}
      />
      {result.compressed.map(
        ({ nrmse, compressed, compression_ratio }, i) => (
          <CompressionPlot
            key={i}
            title={`NRMSE: ${Math.round(
              nrmse * 100
            ) / 100}; Compression ratio: ${compression_ratio.toFixed(2)}`}
            timestamps={result.timestamps.slice(0, numSamples)}
            original={result.original.slice(0, numSamples)}
            compressed={compressed.slice(0, numSamples)}
            width={width - 30} // leave room for scrollbar
            height={400}
          />
        )
      )}
    </div>
  );
};

const parseFilter = (filter: Filter) => {
  if (filter === "none") {
    return { filtLowcut: undefined, filtHighcut: undefined };
  }
  else if (filter === "300-6000 Hz") {
    return { filtLowcut: 300, filtHighcut: 6000 };
  }
  else if (filter === "300- Hz") {
    return { filtLowcut: 300, filtHighcut: undefined };
  }
  else {
    throw new Error(`Invalid filter: ${filter}`);
  }
}

const removeEverythingAfter = (s: string, substr: string) => {
  const i = s.indexOf(substr);
  if (i === -1) {
    return s;
  }
  return s.slice(0, i);
};

type CompressionRatioVsNRMSEPlotProps = {
  nrmses: number[];
  compressionRatios: number[];
  width: number;
  height: number;
};

const CompressionRatioVsNRMSEPlot: FunctionComponent<
  CompressionRatioVsNRMSEPlotProps
> = ({ nrmses, compressionRatios, width, height }) => {
  const { data, layout } = useMemo(() => {
    const data = [
      {
        x: nrmses,
        y: compressionRatios,
        type: "scatter",
        mode: "markers+lines",
      },
    ];
    const layout = {
      width,
      height,
      title: ``,
      margin: {
        l: 60,
        r: 20,
        t: 70,
        b: 60,
        pad: 0,
      },
      xaxis: {
        title: "NRMSE",
        automargin: false,
      },
      yaxis: {
        title: "Compression ratio",
        automargin: false,
        tickpadding: 5,
        ticklen: 4,
      },
    };
    return { data, layout };
  }, [nrmses, compressionRatios, width, height]);
  return <LazyPlotlyPlot data={data} layout={layout} />;
};

type CompressionPlotProps = {
  title: string;
  timestamps: number[];
  original: number[];
  compressed: number[];
  width: number;
  height: number;
};

const CompressionPlot: FunctionComponent<CompressionPlotProps> = ({
  title,
  timestamps,
  original,
  compressed,
  width,
  height,
}) => {
  const { data, layout } = useMemo(() => {
    const data = [
      {
        x: timestamps.map((x) => x * 1000), // milliseconds
        y: original,
        type: "scatter",
        mode: "lines",
        name: "Original",
      },
      {
        x: timestamps.map((x) => x * 1000), // milliseconds
        y: compressed,
        type: "scatter",
        mode: "lines",
        name: "Compressed",
      },
    ];
    const layout = {
      width,
      height,
      title,
      margin: {
        l: 60,
        r: 20,
        t: 70,
        b: 60,
        pad: 0,
      },
      xaxis: {
        title: "Time (ms)",
        automargin: false,
      },
      yaxis: {
        title: "Signal",
        automargin: false,
        tickpadding: 5,
        ticklen: 4,
      },
      showlegend: true,
    };
    return { data, layout };
  }, [title, timestamps, original, compressed, width, height]);
  return <LazyPlotlyPlot data={data} layout={layout} />;
};

export default CompressionPage;
