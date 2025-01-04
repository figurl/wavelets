/* eslint-disable @typescript-eslint/no-explicit-any */
import { DivCompressionPlot } from "../views/compression/DivCompressionPlot";
import DivExploreCompression from "../views/compression/DivExploreCompression";
import DivExploreComputeTime from "../views/compute_time/DivExploreComputeTime";
import DivExploreWavelets from "../views/wavelets/DivExploreWavelets";
import DivWaveletBasisPlot from "../views/wavelets/DivWaveletBasisPlot";

const divHandler = ({
  className,
  props,
  children,
}: {
  className: string | undefined;
  props: any;
  children: any;
}) => {
  if (className === "wavelet-basis-plot") {
    const waveletName = props.wavelet_name;
    const levels = props.levels.split(",").map((s: string) => parseInt(s));
    const numSamples = parseInt(props.num_samples);
    return (
      <DivWaveletBasisPlot
        waveletName={waveletName}
        levels={levels}
        numSamples={numSamples}
      />
    );
  } else if (className === "compression-plot") {
    const waveletName = props.wavelet_name;
    const numSamples = parseInt(props.num_samples);
    const filtLowcut = props.filt_lowcut
      ? parseFloat(props.filt_lowcut)
      : undefined;
    const filtHighcut = props.filt_highcut
      ? parseFloat(props.filt_highcut)
      : undefined;
    const signalType = props.signal_type;
    const nrmses = props.nrmses.split(",").map((s: string) => parseFloat(s));
    return (
      <DivCompressionPlot
        waveletName={waveletName}
        numSamples={numSamples}
        filtLowcut={filtLowcut}
        filtHighcut={filtHighcut}
        signalType={signalType}
        nrmses={nrmses}
      />
    );
  } else if (className === "explore-compute-time") {
    return <DivExploreComputeTime />;
  } else if (className === "explore-compression") {
    return <DivExploreCompression />;
  } else if (className === "explore-wavelets") {
    return <DivExploreWavelets />;
  }
  return <div {...props}>{children}</div>;
};

export default divHandler;
