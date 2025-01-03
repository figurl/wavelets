/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent, useCallback, useMemo, useState } from "react";
import code1 from "./compute_time.py?raw";
import { usePyodideResult } from "../WaveletsPage/useCoeffSizes";
import LazyPlotlyPlot from "../../Plotly/LazyPlotlyPlot";
import Markdown from "../../Markdown/Markdown";
import compute_time_md from "./compute_time.md?raw";
import MarkdownWrapper from "../../Markdown/MarkdownWrapper";
import { removeMainSectionFromPy } from "../../utils/removeMainSectionFromPy";
import { useDocumentWidth } from "../../Markdown/DocumentWidthContext";

type ComputeTimePageProps = {
  width: number;
  height: number;
};

const ComputeTimePage: FunctionComponent<ComputeTimePageProps> = ({
  width,
  height,
}) => {
  const divHandler = useMemo(() => {
    return ({
      className,
      props,
      children,
    }: {
      className: string | undefined;
      props: any;
      children: any;
    }) => {
      if (className === "main") {
        return <ComputeTimePageChild />;
      }
      return <div {...props}>{children}</div>;
    };
  }, []);
  return (
    <MarkdownWrapper width={width} height={height}>
      <Markdown source={compute_time_md} divHandler={divHandler} />
    </MarkdownWrapper>
  );
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type ComputeTimePageChildProps = {
  //
};

const waveletOptions = {
  option0: ["fourier"],
  option1: ["db4"],
  option2: ["db2", "db4", "db6", "db8"],
  option3: ["db4", "db8", "db12", "db16"],
  option4: ["coif1", "coif2", "coif3", "coif4"],
  option5: ["coif4", "coif8", "coif12", "coif16"],
  option6: ["sym2", "sym3", "sym4", "sym5"],
  option7: ["sym4", "sym8", "sym12", "sym16"],
};

const ComputeTimePageChild: FunctionComponent<
  ComputeTimePageChildProps
> = () => {
  const [numSamples, setNumSamples] = useState(1e6);
  const [selectedWavelets, setSelectedWavelets] =
    useState<keyof typeof waveletOptions>("option2");
  const [readCache, setReadCache] = useState(true);
  const width = useDocumentWidth();

  const toggleCache = useCallback(() => {
    setReadCache((prev) => !prev);
  }, []);

  const pythonCode = useMemo(
    () => `
${removeMainSectionFromPy(code1)}
results = [
  benchmark_compute_time(
    wavelet_name=wavelet_name,
    num_samples=${numSamples}
  )
  for wavelet_name in ${JSON.stringify(waveletOptions[selectedWavelets])}
]
results
`,
    [numSamples, selectedWavelets],
  );

  const pythonCodeForDisplay = useMemo(
    () => `
${removeMainSectionFromPy(code1)}
results = [
  benchmark_compute_time(
    wavelet_name=wavelet_name,
    num_samples=${numSamples}
  )
  for wavelet_name in ${JSON.stringify(waveletOptions[selectedWavelets])}
]

# Plot the results
import matplotlib.pyplot as plt
import numpy as np

wavelet_names = [r['wavelet_name'] for r in results]
x = np.arange(len(wavelet_names))
width = 0.35

plt.bar(x - width/2, [r['dec_computation_time_msec'] for r in results], width, label='Decomposition')
plt.bar(x + width/2, [r['rec_computation_time_msec'] for r in results], width, label='Reconstruction')

plt.xlabel('Wavelet Name')
plt.ylabel('Time (ms)')
plt.title('Computation Time Comparison')
plt.xticks(x, wavelet_names)
plt.legend()
plt.show()
`,
    [numSamples, selectedWavelets],
  );

  const results = usePyodideResult(pythonCode, { readCache, writeCache: true });

  if (!results) {
    return <div>Computing...</div>;
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          alignItems: "center",
        }}
      >
        <NumSamplesSelector
          numSamples={numSamples}
          setNumSamples={setNumSamples}
        />
        <div>
          <label>Wavelets:&nbsp;</label>
          <select
            value={selectedWavelets}
            onChange={(e) =>
              setSelectedWavelets(e.target.value as keyof typeof waveletOptions)
            }
          >
            {Object.entries(waveletOptions).map(([key, value]) => (
              <option key={key} value={key}>
                {value.join(", ")}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={toggleCache}
          style={{ padding: "4px 8px" }}
          title={readCache ? "Click to disable cache" : "Click to enable cache"}
        >
          {readCache ? "Using cache" : "Not using cache"}
        </button>
      </div>
      <hr />
      <ComputationTimePlot
        results={results}
        width={Math.min(width, 600)}
        height={300}
      />
      <hr />
      <div>
        <details>
          <summary>Python code</summary>
          <Markdown source={`\`\`\`python${pythonCodeForDisplay}\`\`\``} />
        </details>
      </div>
    </div>
  );
};

type ComputationTimePlotProps = {
  results: Array<{
    dec_computation_time_msec: number;
    rec_computation_time_msec: number;
    num_samples: number;
    wavelet_name: string;
  }>;
  width: number;
  height: number;
};

const ComputationTimePlot: FunctionComponent<ComputationTimePlotProps> = ({
  results,
  width,
  height,
}) => {
  const { data, layout } = useMemo(() => {
    const data = [
      {
        x: results.map((r) => r.wavelet_name),
        y: results.map((r) => r.dec_computation_time_msec),
        type: "bar",
        name: "Decomposition",
      },
      {
        x: results.map((r) => r.wavelet_name),
        y: results.map((r) => r.rec_computation_time_msec),
        type: "bar",
        name: "Reconstruction",
      },
    ];
    const layout = {
      width,
      height,
      title: `Computation Time Comparison`,
      margin: {
        l: 60,
        r: 20,
        t: 70,
        b: 60,
        pad: 0,
      },
      xaxis: {
        title: "Wavelet Type",
        automargin: false,
      },
      yaxis: {
        title: "Time (ms)",
        automargin: false,
        tickpadding: 5,
        ticklen: 4,
      },
      barmode: "group",
    };
    return { data, layout };
  }, [results, width, height]);
  return <LazyPlotlyPlot data={data} layout={layout} />;
};

const numSamplesChoices = [1e6, 2e6, 5e6, 1e7];

type NumSamplesSelectorProps = {
  numSamples: number;
  setNumSamples: (numSamples: number) => void;
};

const NumSamplesSelector: FunctionComponent<NumSamplesSelectorProps> = ({
  numSamples,
  setNumSamples,
}) => {
  return (
    <div>
      <label>Num samples:&nbsp;</label>
      <select
        value={numSamples}
        onChange={(e) => setNumSamples(parseInt(e.target.value))}
      >
        {numSamplesChoices.map((numSamples) => (
          <option key={numSamples} value={numSamples}>
            {toScientific(numSamples)}
          </option>
        ))}
      </select>
    </div>
  );
};

const toScientific = (num: number) => {
  return num.toExponential(1);
};

export default ComputeTimePage;
