/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent, useMemo } from "react";
import Markdown from "../../Markdown/Markdown";
import MarkdownWrapper from "../../Markdown/MarkdownWrapper";
import { WaveletBasisPlot } from "../WaveletsPage/WaveletBasisPlot";
import { useCoeffSizes } from "../WaveletsPage/useCoeffSizes";
import storyMd from "./story.md?raw";
import { CompressionPlot, useCompressionResult } from "../CompressionPage/CompressionPage";
import { WaveletName } from "../../ControlPanel";
import { SignalType } from "../CompressionPage/selectors";
import { useDocumentWidth } from "../../Markdown/DocumentWidthContext";

type Props = {
  width: number;
  height: number;
};

const StoryPage: FunctionComponent<Props> = ({ width, height }) => {
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
      if (className === "wavelet-basis-plot") {
        const waveletName = props.wavelet_name;
        const levels = props.levels.split(",").map((s: string) => parseInt(s));
        const numSamples = parseInt(props.num_samples);
        return (
          <WaveletBasisPlotWrapper waveletName={waveletName} levels={levels} numSamples={numSamples} />
        );
      }
      else if (className === "compression-plot") {
        const waveletName = props.wavelet_name;
        const numSamples = parseInt(props.num_samples);
        const filtLowcut = props.filt_lowcut ? parseFloat(props.filt_lowcut) : undefined;
        const filtHighcut = props.filt_highcut ? parseFloat(props.filt_highcut) : undefined;
        const signalType = props.signal_type;
        const nrmses = props.nrmses.split(",").map((s: string) => parseFloat(s));
        return (
          <CompressionPlotWrapper
            waveletName={waveletName}
            numSamples={numSamples}
            filtLowcut={filtLowcut}
            filtHighcut={filtHighcut}
            signalType={signalType}
            nrmses={nrmses}
          />
        )
      }
      return <div {...props}>{children}</div>;
    };
  }, []);
  return (
    <MarkdownWrapper width={width} height={height}>
      <Markdown source={storyMd} divHandler={divHandler} />
    </MarkdownWrapper>
  );
};

type WaveletBasisPlotWrapperProps = {
  waveletName: string;
  levels: number[];
  numSamples: number;
};

const WaveletBasisPlotWrapper: FunctionComponent<
  WaveletBasisPlotWrapperProps
> = ({ waveletName, levels, numSamples }) => {
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

type CompressionPlotWrapperProps = {
  waveletName: string;
  numSamples: number;
  filtLowcut?: number;
  filtHighcut?: number;
  signalType: string;
  nrmses: number[];
};


const CompressionPlotWrapper: FunctionComponent<CompressionPlotWrapperProps> = ({
  waveletName,
  numSamples,
  filtLowcut,
  filtHighcut,
  signalType,
  nrmses
}) => {
  const result = useCompressionResult({
    waveletName: waveletName as WaveletName,
    numSamples,
    filtLowcut,
    filtHighcut,
    signalType: signalType as SignalType,
    nrmses
  })

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
        title={`NRMSE: ${
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
  )
}

export default StoryPage;
