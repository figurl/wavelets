/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent, useMemo, useState } from "react";
import { WaveletName, waveletNameChoices } from "../../ControlPanel";
import Markdown from "../../Markdown/Markdown";
import wavelets_md from "./wavelets.md?raw";
import { useCoeffSizes } from "./useCoeffSizes";
import { WaveletBasisPlot } from "./WaveletBasisPlot";
import MarkdownWrapper from "../../Markdown/MarkdownWrapper";

type WaveletsPageProps = {
  width: number;
  height: number;
};

const WaveletsPage: FunctionComponent<WaveletsPageProps> = ({
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
        return <WaveletsPageChild />;
      }
      return <div {...props}>{children}</div>;
    };
  }, []);
  return (
    <MarkdownWrapper width={width} height={height}>
      <Markdown source={wavelets_md} divHandler={divHandler} />
    </MarkdownWrapper>
  );
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type WaveletsPageChildProps = {
  //
};

const WaveletsPageChild: FunctionComponent<WaveletsPageChildProps> = () => {
  const [waveletName, setWaveletName] = useState<WaveletName>("db4");
  const [numSamples, setNumSamples] = useState(512);
  const coeffSizes = useCoeffSizes(waveletName, numSamples);
  const levelChoices = useMemo(() => {
    if (!coeffSizes) {
      return undefined;
    }
    return coeffSizes.map((_size: number, i: number) => i);
  }, [coeffSizes]);
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <WaveletNameSelector
          waveletName={waveletName}
          setWaveletName={setWaveletName}
        />
        &nbsp;&nbsp;
        <NumSamplesSelector
          numSamples={numSamples}
          setNumSamples={setNumSamples}
        />
      </div>
      <hr />
      {coeffSizes && levelChoices ? (
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {levelChoices.map((level: number) => (
            <WaveletBasisPlot
              key={level}
              wavelet={waveletName}
              coeffSizes={coeffSizes}
              level={level}
            />
          ))}
        </div>
      ) : (
        <div>Computing...</div>
      )}
    </div>
  );
};

type WaveletNameSelectorProps = {
  waveletName: string;
  setWaveletName: (waveletName: WaveletName) => void;
  includeFourier?: boolean;
};

const WaveletNameSelector: FunctionComponent<WaveletNameSelectorProps> = ({
  waveletName,
  setWaveletName,
  includeFourier,
}) => {
  return (
    <div>
      <label>Wavelet:&nbsp;</label>
      <select
        value={waveletName}
        onChange={(e) => setWaveletName(e.target.value as any)}
      >
        {waveletNameChoices
          .filter((c) => includeFourier || c !== "fourier")
          .map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
      </select>
    </div>
  );
};

const numSamplesChoices = [32, 64, 128, 256, 512, 1024];

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
            {numSamples}
          </option>
        ))}
      </select>
    </div>
  );
};

export default WaveletsPage;
