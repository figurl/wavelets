import PlotFromCode from "./PlotFromCode";

const codeHandler = ({
  code,
  codeElement,
}: {
  code: string;
  codeElement: JSX.Element;
}) => {
  const lines = code.split("\n");
  const generatePlot = lines.find((line) => line.startsWith("# generate-plot"));
  if (generatePlot) {
    return <PlotFromCode code={code} codeElement={codeElement} />;
  } else {
    return codeElement;
  }
};

export default codeHandler;
