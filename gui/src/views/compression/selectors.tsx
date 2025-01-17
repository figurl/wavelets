/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent } from "react";
import { Filter, WaveletName, waveletNameChoices } from "../../common";

export type CompressionMethod = "QWC" | "QFC" | "QTC";

const methodChoices: CompressionMethod[] = ["QWC", "QFC", "QTC"];

type MethodSelectorProps = {
  method: CompressionMethod;
  setMethod: (method: CompressionMethod) => void;
};

export const MethodSelector: FunctionComponent<MethodSelectorProps> = ({
  method,
  setMethod,
}) => {
  return (
    <div>
      <label>Method:&nbsp;</label>
      <select
        value={method}
        onChange={(e) => setMethod(e.target.value as CompressionMethod)}
      >
        {methodChoices.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
};

const numSamplesChoices = [32, 64, 128, 256, 512, 1024, 2048];

type NumSamplesSelectorProps = {
  numSamples: number;
  setNumSamples: (numSamples: number) => void;
};

export const NumSamplesSelector: FunctionComponent<NumSamplesSelectorProps> = ({
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

type WaveletNameSelectorProps = {
  waveletName: string;
  setWaveletName: (waveletName: WaveletName) => void;
  includeFourier?: boolean;
};

export const WaveletNameSelector: FunctionComponent<
  WaveletNameSelectorProps
> = ({ waveletName, setWaveletName, includeFourier }) => {
  return (
    <>
      <label>Wavelet:&nbsp;</label>
      <select
        value={waveletName}
        onChange={(e) => setWaveletName(e.target.value as WaveletName)}
      >
        {waveletNameChoices
          .filter((c) => includeFourier || c !== "fourier")
          .map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
      </select>
    </>
  );
};

const filterChoices: Filter[] = [
  "none",
  "bandpass 300-6000 Hz",
  "highpass 300 Hz",
];

type FilterSelectorProps = {
  filter: Filter;
  setFilter: (filter: Filter) => void;
};

export const FilterSelector: FunctionComponent<FilterSelectorProps> = ({
  filter,
  setFilter,
}) => {
  return (
    <div>
      <label>Filter:&nbsp;</label>
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value as Filter)}
      >
        {filterChoices.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
};

export type SignalType = "gaussian_noise" | "real_ephys_1";

const signalTypeChoices: SignalType[] = ["gaussian_noise", "real_ephys_1"];

type SignalTypeSelectorProps = {
  signalType: SignalType;
  setSignalType: (signalType: SignalType) => void;
};

export const SignalTypeSelector: FunctionComponent<SignalTypeSelectorProps> = ({
  signalType,
  setSignalType,
}) => {
  return (
    <div>
      <label>Signal type:&nbsp;</label>
      <select
        value={signalType}
        onChange={(e) => setSignalType(e.target.value as SignalType)}
      >
        {signalTypeChoices.map((name) => (
          <option key={name} value={name}>
            {name === "gaussian_noise" ? "Gaussian noise" : "Real ephys data 1"}
          </option>
        ))}
      </select>
    </div>
  );
};
