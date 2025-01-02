import { FunctionComponent, useMemo, useState } from "react";
import { Filter, WaveletName, waveletNameChoices } from "../../ControlPanel";
import code1 from "./code1.py?raw";
import { usePyodideResult } from "../WaveletsPage/useCoeffSizes";
import LazyPlotlyPlot from "../../Plotly/LazyPlotlyPlot";
import Markdown from "../../Markdown/Markdown";
import compression_md from "./compression.md?raw";
import MarkdownWrapper from "../../Markdown/MarkdownWrapper";
import { removeMainSectionFromPy } from "../../utils/removeMainSectionFromPy";

type CompressionPageProps = {
  width: number;
  height: number;
};

const CompressionPage: FunctionComponent<CompressionPageProps> = ({ width, height }) => {
  return (
    <MarkdownWrapper width={width} height={height}>
      <Markdown source={compression_md}
        divHandler={({ className, props, children }) => {
          if (className === "main") {
            return <CompressionPageChild width={width} />;
          }
          return <div {...props}>{children}</div>;
        }}
      />
    </MarkdownWrapper>
  );
}

type CompressionPageChildProps = {
  width: number;
};

const CompressionPageChild: FunctionComponent<CompressionPageChildProps> = ({ width }) => {
  const [waveletName, setWaveletName] = useState<WaveletName>("db4");
  const [numSamples, setNumSamples] = useState(512);
  const [filter, setFilter] = useState<Filter>("none");
  const { filtLowcut, filtHighcut } = parseFilter(filter);
  const code = `
${removeMainSectionFromPy(code1)}
code1(
    wavelet_name='${waveletName}',
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
    <div>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <WaveletNameSelector waveletName={waveletName} setWaveletName={setWaveletName} includeFourier={true} />
        &nbsp;&nbsp;
        <NumSamplesSelector numSamples={numSamples} setNumSamples={setNumSamples} />
        &nbsp;&nbsp;
        <FilterSelector filter={filter} setFilter={setFilter} />
      </div>
      <hr />
      <CompressionRatioVsNRMSEPlot
        nrmses={result.compressed.map(({ nrmse }) => nrmse)}
        compressionRatios={result.compressed.map(
          ({ compression_ratio }) => compression_ratio
        )}
        width={Math.min(width, 600)}
        height={300}
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

const numSamplesChoices = [32, 64, 128, 256, 512, 1024];

type NumSamplesSelectorProps = {
  numSamples: number;
  setNumSamples: (numSamples: number) => void;
};

const NumSamplesSelector: FunctionComponent<NumSamplesSelectorProps> = ({ numSamples, setNumSamples }) => {
  return (
    <div>
      <label>Num samples:&nbsp;</label>
      <select value={numSamples} onChange={(e) => setNumSamples(parseInt(e.target.value))}>
        {numSamplesChoices.map((numSamples) => (
          <option key={numSamples} value={numSamples}>
            {numSamples}
          </option>
        ))}
      </select>
    </div>
  );
}

type WaveletNameSelectorProps = {
  waveletName: string;
  setWaveletName: (waveletName: WaveletName) => void;
  includeFourier?: boolean;
};

const WaveletNameSelector: FunctionComponent<WaveletNameSelectorProps> = ({ waveletName, setWaveletName, includeFourier }) => {
  return (
    <div>
      <label>Wavelet:&nbsp;</label>
      <select value={waveletName} onChange={(e) => setWaveletName(e.target.value as WaveletName)}>
        {waveletNameChoices.filter(c => includeFourier || (c !== "fourier")).map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}

const filterChoices: Filter[] = ["none", "300-6000 Hz", "300- Hz"];

type FilterSelectorProps = {
  filter: Filter;
  setFilter: (filter: Filter) => void;
};

const FilterSelector: FunctionComponent<FilterSelectorProps> = ({ filter, setFilter }) => {
  return (
    <div>
      <label>Filter:&nbsp;</label>
      <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
        {filterChoices.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default CompressionPage;
