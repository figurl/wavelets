import { FunctionComponent, useMemo } from "react";
import LazyPlotlyPlot from "../../internal/Plotly/LazyPlotlyPlot";

type CompressionPlotlyPlotProps = {
  title: string;
  original: number[];
  compressed: number[];
  samplingFrequency: number;
  width: number;
  height: number;
};

export const CompressionPlotlyPlot: FunctionComponent<
  CompressionPlotlyPlotProps
> = ({ title, original, compressed, samplingFrequency, width, height }) => {
  const { data, layout } = useMemo(() => {
    const timestamps = timestampsForSignal(
      original.length,
      samplingFrequency,
    ).map((t) => t * 1000); // milliseconds

    const data = [];

    // original signal
    data.push({
      x: timestamps,
      y: original,
      type: "scatter",
      mode: "lines",
      name: "Original",
    });

    // compressed signal
    data.push({
      x: timestamps,
      y: compressed,
      type: "scatter",
      mode: "lines",
      name: "Compressed",
    });

    // residual
    data.push({
      x: timestamps,
      y: original.map((v, i) => v - compressed[i]),
      type: "scatter",
      mode: "lines",
      line: { color: "green" },
      name: "Residual",
      visible: "legendonly",
    });
    const layout = {
      width,
      height,
      title,
      margin: {
        l: 60,
        r: 100, // Increased right margin to accommodate legend
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
  }, [title, samplingFrequency, original, compressed, width, height]);

  return (
    <>
      <LazyPlotlyPlot data={data} layout={layout} />
    </>
  );
};

const timestampsForSignal = (numSamples: number, samplingFrequency: number) => {
  return Array.from({ length: numSamples }, (_, i) => i / samplingFrequency);
};

export default CompressionPlotlyPlot;
