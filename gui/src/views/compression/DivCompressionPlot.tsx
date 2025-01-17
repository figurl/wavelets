import { FunctionComponent, useEffect, useMemo, useState } from "react";
import { WaveletName } from "../../common";
import { useDocumentWidth } from "../../internal/Markdown/DocumentWidthContext";
import { usePyodideResult } from "../../internal/pyodide/usePyodideResult";
import { RemoteH5File } from "../../internal/remote-h5-file";
import { removeMainSectionFromPy } from "../../internal/utils/removeMainSectionFromPy";
import compression_py from "./compression.py?raw";
import CompressionPlotlyPlot from "./CompressionPlotlyPlot";
import { SignalType } from "./selectors";

type DivCompressionPlotProps = {
  wavelet_name: string; // raw prop name from markdown
  num_samples: string; // comes as string from markdown
  filt_lowcut?: string;
  filt_highcut?: string;
  signal_type: string;
  nrmses: string; // comes as comma-separated string from markdown
};

const DivCompressionPlot: FunctionComponent<DivCompressionPlotProps> = (
  props,
) => {
  // Parse raw props
  const waveletName = props.wavelet_name;
  const numSamples = parseInt(props.num_samples);
  const filtLowcut = props.filt_lowcut
    ? parseFloat(props.filt_lowcut)
    : undefined;
  const filtHighcut = props.filt_highcut
    ? parseFloat(props.filt_highcut)
    : undefined;
  const signalType = props.signal_type;
  const nrmses = props.nrmses.split(",").map((s) => parseFloat(s));

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

  const titlePart0 =
    waveletName === "time-domain"
      ? "QTC"
      : waveletName === "fourier"
        ? "QFC"
        : `QWC (${waveletName})`;

  return (
    <>
      {result.compressed.map(({ nrmse, compressed, compression_ratio }, i) => (
        <CompressionPlotlyPlot
          key={i}
          title={`${titlePart0}; NRMSE: ${
            Math.round(nrmse * 100) / 100
          }; Compression ratio: ${compression_ratio.toFixed(2)}`}
          samplingFrequency={result.sampling_frequency}
          original={result.original.slice(0, numSamples)}
          compressed={compressed.slice(0, numSamples)}
          width={width - 30} // leave room for scrollbar
          height={400}
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
}):
  | {
      sampling_frequency: number;
      original: number[];
      compressed: {
        quant_scale_factor: number;
        nrmse_target: number;
        nrmse: number;
        compressed: number[];
        compression_ratio: number;
        theoretical_compression_ratio: number;
      }[];
    }
  | undefined => {
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
  const { result } = usePyodideResult(
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

export default DivCompressionPlot;
