import { FunctionComponent, useState } from "react";
import { usePyodideResult } from "../../internal/pyodide/usePyodideResult";

type PlotFromCodeProps = {
  code: string;
  codeElement: JSX.Element;
};

const PlotFromCode: FunctionComponent<PlotFromCodeProps> = ({
  code,
  codeElement,
}) => {
  const { images, status } = usePyodideResult(code);
  return (
    <div>
      <ExpandableCode codeElement={codeElement} />
      {!images ? (
        status === undefined ? (
          <div>Waiting for plot...</div>
        ) : status === "running" ? (
          <div>Computing...</div>
        ) : status === "failed" ? (
          <div>Error computing plot</div>
        ) : status === "completed" ? (
          <div>No plot generated</div>
        ) : (
          <div>{status}</div>
        )
      ) : (
        images.map((img, i) => (
          <img key={i} src={"data:image/png;base64," + img} alt="plot" />
        ))
      )}
    </div>
  );
};

const ExpandableCode: FunctionComponent<{ codeElement: JSX.Element }> = ({
  codeElement,
}) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <button onClick={() => setExpanded(!expanded)}>
        {expanded ? "Hide code" : "Show code"}
      </button>
      {expanded && codeElement}
    </div>
  );
};

export default PlotFromCode;
