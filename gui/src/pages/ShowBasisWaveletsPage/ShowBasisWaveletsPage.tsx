import { FunctionComponent, useMemo } from "react";
import { useCoeffSizes } from "./useCoeffSizes";
import { WaveletBasisPlot } from "./WaveletBasisPlot";
import { ControlPanelState } from "../../ControlPanel";

type ShowBasisWaveletsPageProps = {
  width: number;
  height: number;
  controlPanelState: ControlPanelState;
};

const ShowBasisWaveletsPage: FunctionComponent<ShowBasisWaveletsPageProps> = ({ width, height, controlPanelState }) => {
  if (controlPanelState.page !== "show-basis-wavelets") {
    throw new Error("Invalid page");
  }
  if (controlPanelState.waveletName === "fourier") {
    return (
      <div>
        Cannot show basis wavelets for fourier
      </div>
    )
  }
  return (
    <ShowBasisWaveletsPageChild width={width} height={height} controlPanelState={controlPanelState} />
  );
}

const ShowBasisWaveletsPageChild: FunctionComponent<ShowBasisWaveletsPageProps> = ({ width, height, controlPanelState }) => {
  if (controlPanelState.page !== "show-basis-wavelets") {
    throw new Error("Invalid page");
  }
  const wavelet = controlPanelState.waveletName;
  const numSamples = controlPanelState.numSamples;
  const coeffSizes = useCoeffSizes(wavelet, numSamples);
  const levelChoices = useMemo(() => {
    if (!coeffSizes) {
      return undefined;
    }
    return coeffSizes.map((_size: number, i: number) => i);
  }, [coeffSizes]);
  if (!coeffSizes || !levelChoices) {
    return <div>Loading...</div>;
  }
  return (
    <div style={{
      position: "absolute",
      width,
      height,
      overflowY: "auto",
      display: "flex",
      flexWrap: "wrap",
      gap: 0,
      padding: 0
    }}>
      {levelChoices.map((level: number) => (
        <WaveletBasisPlot key={level} wavelet={wavelet} coeffSizes={coeffSizes} level={level} />
      ))}
    </div>
  );
};

export default ShowBasisWaveletsPage;