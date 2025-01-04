import { FunctionComponent } from "react";
import { useCoeffSizes } from "./useCoeffSizes";
import { WaveletBasisPlot } from "./WaveletBasisPlot";

type DivWaveletBasisPlotProps = {
  waveletName: string;
  levels: number[];
  numSamples: number;
};

const DivWaveletBasisPlot: FunctionComponent<DivWaveletBasisPlotProps> = ({
  waveletName,
  levels,
  numSamples,
}) => {
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
