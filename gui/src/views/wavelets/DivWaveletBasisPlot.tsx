import { FunctionComponent } from "react";
import { useCoeffSizes } from "./useCoeffSizes";
import { WaveletBasisPlot } from "./WaveletBasisPlot";

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
        />
      ))}
    </div>
  );
};

export default DivWaveletBasisPlot;
