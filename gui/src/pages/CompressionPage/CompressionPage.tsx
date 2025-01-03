import { FunctionComponent, useEffect, useMemo, useState } from "react";
import { Filter, WaveletName, waveletNameChoices } from "../../ControlPanel";
import Markdown from "../../Markdown/Markdown";
import MarkdownWrapper from "../../Markdown/MarkdownWrapper";
import LazyPlotlyPlot from "../../Plotly/LazyPlotlyPlot";
import { removeMainSectionFromPy } from "../../utils/removeMainSectionFromPy";
import { usePyodideResult } from "../WaveletsPage/useCoeffSizes";
import compression_md from "./compression.md?raw";
import compression_py from "./compression.py?raw";
import { RemoteH5File } from "../../remote-h5-file";

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

type SignalType = 'gaussian_noise' | 'real_ephys_1';

const CompressionPageChild: FunctionComponent<CompressionPageChildProps> = ({ width }) => {
  const [waveletName, setWaveletName] = useState<WaveletName>("db4");
  const [numSamples, setNumSamples] = useState(1024);
  const [filter, setFilter] = useState<Filter>("none");
  const [signalType, setSignalType] = useState<SignalType>("gaussian_noise");
  const { filtLowcut, filtHighcut } = parseFilter(filter);
  const code = `
${removeMainSectionFromPy(compression_py)}
test_compression(
    wavelet_name='${waveletName}',
    num_samples=${numSamples},
    nrmses=[0.1, 0.2, 0.4, 0.6, 0.8],
    filt_lowcut=${filtLowcut ? filtLowcut : "None"},
    filt_highcut=${filtHighcut ? filtHighcut : "None"},
    signal_type='${signalType}'
)
`;
  const signalFile: ArrayBuffer | null | undefined = useSignalFile(signalType, numSamples);
  const additionalFiles = useMemo(() => {
    if (signalFile === undefined) return undefined;
    if (signalFile == null) return {};
    return {
      'traces.dat': {
        base64: arrayBufferToBase64(signalFile),
      }
    } as {[filename: string]: string | {base64: string}};
  }, [signalFile]);
  const result: {
        sampling_frequency: number;
        original: number[];
        compressed: {
          quant_scale_factor: number;
          nrmse_target: number;
          nrmse: number;
          compressed: number[];
          compression_ratio: number;
        }[];
      }
    | undefined = usePyodideResult(additionalFiles !== undefined ? code : null, {
      additionalFiles
    });

  if (result === null) {
    return <div>Loading signal file...</div>;
  }

  if (!result) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <SignalTypeSelector signalType={signalType} setSignalType={setSignalType} />
        &nbsp;&nbsp;
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
            samplingFrequency={result.sampling_frequency}
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

const useSignalFile = (signalType: SignalType, numSamples: number): ArrayBuffer | null | undefined => {
  const [signalFile, setSignalFile] = useState<ArrayBuffer | null | undefined>(undefined);
  useEffect(() => {
    let canceled = false;
    const load = async () => {
      setSignalFile(undefined);
      if (signalType === "gaussian_noise") {
        setSignalFile(null);
        return;
      }
      else if (signalType === "real_ephys_1") {
        // https://neurosift.app/?p=/nwb&url=https://api.dandiarchive.org/api/assets/c04f6b30-82bf-40e1-9210-34f0bcd8be24/download/&dandisetId=000409&dandisetVersion=draft
        const nwbUrl = "https://api.dandiarchive.org/api/assets/c04f6b30-82bf-40e1-9210-34f0bcd8be24/download/"
        const r = new RemoteH5File(nwbUrl, {});
        const ds = await r.getDataset("/acquisition/ElectricalSeriesAp/data");
        if (!ds) {
          throw new Error("Dataset not found");
        }
        if (canceled) return;
        const x = await r.getDatasetData(ds.path, {slice: [[1000, 1000 + Math.max(numSamples, 30000)], [101, 102]]})
        if (!x) {
          throw new Error("Data not found");
        }
        if (canceled) return;
        setSignalFile(x.buffer);
      }
      else {
        throw new Error(`Invalid signal type: ${signalType}`);
      }
    };
    load();
    return () => {
      canceled = true;
    }
  }, [signalType, numSamples]);
  return signalFile;
}

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const parseFilter = (filter: Filter) => {
  if (filter === "none") {
    return { filtLowcut: undefined, filtHighcut: undefined };
  }
  else if (filter === "bandpass 300-6000 Hz") {
    return { filtLowcut: 300, filtHighcut: 6000 };
  }
  else if (filter === "highpass 300 Hz") {
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
  original: number[];
  compressed: number[];
  samplingFrequency: number;
  width: number;
  height: number;
};

const CompressionPlot: FunctionComponent<CompressionPlotProps> = ({
  title,
  original,
  compressed,
  samplingFrequency,
  width,
  height,
}) => {
  const { data, layout } = useMemo(() => {
    const data = [
      {
        x: timestampsForSignal(original.length, samplingFrequency).map(t => t * 1000), // milliseconds
        y: original,
        type: "scatter",
        mode: "lines",
        name: "Original",
      },
      {
        x: timestampsForSignal(compressed.length, samplingFrequency).map(t => t * 1000), // milliseconds
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
  }, [title, samplingFrequency, original, compressed, width, height]);
  return <LazyPlotlyPlot data={data} layout={layout} />;
};

const timestampsForSignal = (numSamples: number, samplingFrequency: number) => {
  return Array.from({ length: numSamples }, (_, i) => i / samplingFrequency);
}

const numSamplesChoices = [32, 64, 128, 256, 512, 1024, 2048];

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

const filterChoices: Filter[] = ["none", "bandpass 300-6000 Hz", "highpass 300 Hz"];

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

const signalTypeChoices: SignalType[] = ["gaussian_noise", "real_ephys_1"];

type SignalTypeSelectorProps = {
  signalType: SignalType;
  setSignalType: (signalType: SignalType) => void;
};

const SignalTypeSelector: FunctionComponent<SignalTypeSelectorProps> = ({ signalType, setSignalType }) => {
  return (
    <div>
      <label>Signal type:&nbsp;</label>
      <select value={signalType} onChange={(e) => setSignalType(e.target.value as SignalType)}>
        {signalTypeChoices.map((name) => (
          <option key={name} value={name}>
            {name === "gaussian_noise" ? "Gaussian noise" : "Real ephys data 1"}
          </option>
        ))}
      </select>
    </div>
  );
}

export default CompressionPage;
