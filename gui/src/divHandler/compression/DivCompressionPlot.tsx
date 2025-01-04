import { FunctionComponent, useEffect, useMemo, useState } from "react";
import { WaveletName } from "../../common";
import { useDocumentWidth } from "../../Markdown/DocumentWidthContext";
import LazyPlotlyPlot from "../../Plotly/LazyPlotlyPlot";
import { CompressionPlotMode, SignalType } from "./selectors";
import { RemoteH5File } from "../../remote-h5-file";
import { removeMainSectionFromPy } from "../../utils/removeMainSectionFromPy";
import compression_py from "./compression.py?raw";
import { usePyodideResult } from "../../pyodide/usePyodideResult";

type DivCompressionPlotProps = {
  waveletName: string;
  numSamples: number;
  filtLowcut?: number;
  filtHighcut?: number;
  signalType: string;
  nrmses: number[];
};

export const DivCompressionPlot: FunctionComponent<DivCompressionPlotProps> = ({
  waveletName,
  numSamples,
  filtLowcut,
  filtHighcut,
  signalType,
  nrmses,
}) => {
  const result = useCompressionResult({
    waveletName: waveletName as WaveletName,
    numSamples,
    filtLowcut,
    filtHighcut,
    signalType: signalType as SignalType,
    nrmses,
  });

  const width = useDocumentWidth();

  if (result === null) {
    return <div>Loading signal file...</div>;
  }

  if (!result) {
    return <div>Computing...</div>;
  }

  const plotMode = "default";

  return (
    <>
      {result.compressed.map(({ nrmse, compressed, compression_ratio }, i) => (
        <CompressionPlot
          key={i}
          title={`Wavelet: ${waveletName}; NRMSE: ${
            Math.round(nrmse * 100) / 100
          }; Compression ratio: ${compression_ratio.toFixed(2)}`}
          samplingFrequency={result.sampling_frequency}
          original={result.original.slice(0, numSamples)}
          compressed={compressed.slice(0, numSamples)}
          width={width - 30} // leave room for scrollbar
          height={400}
          mode={plotMode}
        />
      ))}
    </>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCompressionResult = (o: {
  waveletName: WaveletName;
  numSamples: number;
  filtLowcut?: number;
  filtHighcut?: number;
  signalType: SignalType;
  nrmses: number[];
}) => {
  const {
    waveletName,
    numSamples,
    filtLowcut,
    filtHighcut,
    signalType,
    nrmses,
  } = o;
  const code = `${removeMainSectionFromPy(compression_py)}
test_compression(
    wavelet_name='${waveletName}',
    num_samples=${numSamples},
    nrmses=${JSON.stringify(nrmses)},
    filt_lowcut=${filtLowcut ? filtLowcut : "None"},
    filt_highcut=${filtHighcut ? filtHighcut : "None"},
    signal_type='${signalType}'
)
  `;
  const signalFile: ArrayBuffer | null | undefined = useSignalFile(
    signalType,
    numSamples,
  );
  const additionalFiles = useMemo(() => {
    if (signalFile === undefined) return undefined;
    if (signalFile == null) return {};
    return {
      "traces.dat": {
        base64: arrayBufferToBase64(signalFile),
      },
    } as { [filename: string]: string | { base64: string } };
  }, [signalFile]);
  const result:
    | {
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
    | undefined = usePyodideResult(
    additionalFiles !== undefined ? code : null,
    {
      additionalFiles,
    },
  );
  return result;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const useSignalFile = (
  signalType: SignalType,
  numSamples: number,
): ArrayBuffer | null | undefined => {
  const [signalFile, setSignalFile] = useState<ArrayBuffer | null | undefined>(
    undefined,
  );
  useEffect(() => {
    let canceled = false;
    const load = async () => {
      setSignalFile(undefined);
      if (signalType === "gaussian_noise") {
        setSignalFile(null);
        return;
      } else if (signalType === "real_ephys_1") {
        // https://neurosift.app/?p=/nwb&url=https://api.dandiarchive.org/api/assets/c04f6b30-82bf-40e1-9210-34f0bcd8be24/download/&dandisetId=000409&dandisetVersion=draft
        const nwbUrl =
          "https://api.dandiarchive.org/api/assets/c04f6b30-82bf-40e1-9210-34f0bcd8be24/download/";
        const r = new RemoteH5File(nwbUrl, {});
        const ds = await r.getDataset("/acquisition/ElectricalSeriesAp/data");
        if (!ds) {
          throw new Error("Dataset not found");
        }
        if (canceled) return;
        const x = await r.getDatasetData(ds.path, {
          slice: [
            [1000, 1000 + Math.max(numSamples, 30000)],
            [101, 102],
          ],
        });
        if (!x) {
          throw new Error("Data not found");
        }
        if (canceled) return;
        setSignalFile(x.buffer);
      } else {
        throw new Error(`Invalid signal type: ${signalType}`);
      }
    };
    load();
    return () => {
      canceled = true;
    };
  }, [signalType, numSamples]);
  return signalFile;
};

type CompressionPlotProps = {
  title: string;
  original: number[];
  compressed: number[];
  samplingFrequency: number;
  width: number;
  height: number;
  mode?: CompressionPlotMode;
};

export const CompressionPlot: FunctionComponent<CompressionPlotProps> = ({
  title,
  original,
  compressed,
  samplingFrequency,
  width,
  height,
  mode = "default",
}) => {
  const { data, layout } = useMemo(() => {
    const timestamps = timestampsForSignal(
      original.length,
      samplingFrequency,
    ).map((t) => t * 1000); // milliseconds

    const data =
      mode === "default"
        ? [
            {
              x: timestamps,
              y: original,
              type: "scatter",
              mode: "lines",
              name: "Original",
            },
            {
              x: timestamps,
              y: compressed,
              type: "scatter",
              mode: "lines",
              name: "Compressed",
            },
          ]
        : [
            {
              x: timestamps,
              y: original.map((v, i) => v - compressed[i]),
              type: "scatter",
              mode: "lines",
              line: { color: "green" },
              name: "Residual",
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
        title: mode === "default" ? "Signal" : "Residual",
        automargin: false,
        tickpadding: 5,
        ticklen: 4,
      },
      showlegend: true,
    };
    return { data, layout };
  }, [title, samplingFrequency, original, compressed, width, height, mode]);
  return <LazyPlotlyPlot data={data} layout={layout} />;
};

const timestampsForSignal = (numSamples: number, samplingFrequency: number) => {
  return Array.from({ length: numSamples }, (_, i) => i / samplingFrequency);
};
