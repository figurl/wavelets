import { FunctionComponent } from "react";
import { useCoeffSizes } from "./useCoeffSizes";
import { WaveletBasisPlot } from "./WaveletBasisPlot";
import { useDocumentWidth } from "../../internal/Markdown/DocumentWidthContext";

type DivWaveletBasisPlotProps = {
  wavelet_name: string; // raw prop name from markdown
  levels: string; // comes as comma-separated string from markdown
  num_samples: string; // comes as string from markdown
};

const DivWaveletBasisPlot: FunctionComponent<DivWaveletBasisPlotProps> = (
  props,
) => {
  // Parse raw props
  const waveletName = props.wavelet_name;
  const levels = props.levels.split(",").map((s) => parseInt(s));
  const numSamples = parseInt(props.num_samples);

  const width = useDocumentWidth();
  // determine what width we are going to use for each plot
  let maxWidth = 400;
  if (width < 200) {
    maxWidth = 200;
  } else if (width < 800) {
    maxWidth = width;
  } else if (width < 1200) {
    maxWidth = width / 2 - 50; // fit two plots in a row
  }

  const coeffSizes = useCoeffSizes(waveletName, numSamples);
  if (!coeffSizes) {
    return <div>Loading coeff sizes...</div>;
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      {levels.map((level: number) => (
        <WaveletBasisPlot
          key={level}
          wavelet={waveletName}
          coeffSizes={coeffSizes}
          level={level}
          maxWidth={maxWidth}
        />
      ))}
    </div>
  );
};

export default DivWaveletBasisPlot;
