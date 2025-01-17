import React, {
  FunctionComponent,
  PropsWithChildren,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePyodideResult } from "../../internal/pyodide/usePyodideResult";
import { useInView } from "react-intersection-observer";

const pyModules = import.meta.glob<{ default: string }>(
  "../../content/**/*.py",
  {
    query: "?raw",
    eager: true,
  },
);

// Create contents mapping by transforming the paths
const scriptContents: { [key: string]: string } = Object.fromEntries(
  Object.entries(pyModules).map(([path, content]) => [
    // Transform './content/folder1/test2.py' to 'folder1/test2.py'
    path.replace(/^\.\.\/\.\.\/content\//, ""),
    content.default,
  ]),
);

type PlotFromCodeProps = {
  code: string;
  codeElement: JSX.Element;
};

const additionalFiles: { [key: string]: string } = {};
for (const [path, content] of Object.entries(scriptContents)) {
  additionalFiles["/working/" + path] = content;
}

const PlotFromCode: FunctionComponent<PlotFromCodeProps> = ({
  code,
  codeElement,
}) => {
  const hasBeenVisible = useRef(false);
  const [useCache, setUseCache] = useState(true);
  const [recomputeCounter, setRecomputeCounter] = useState(0);
  const { ref, inView } = useInView({ trackVisibility: true, delay: 200 });
  const code2 = useMemo(() => {
    const preamble = `
import sys
sys.path.append('/working')
# Force recompute counter: ${recomputeCounter}
`;
    return preamble + code;
  }, [code, recomputeCounter]);
  const { images, status } = usePyodideResult(
    inView || hasBeenVisible.current ? code2 : null,
    {
      readCache: useCache,
      writeCache: true,
      additionalFiles,
    },
  );
  if (inView) hasBeenVisible.current = true;
  return (
    <div ref={ref}>
      {inView || hasBeenVisible ? (
        <>
          <ExpandableCode
            codeElement={codeElement}
            onRecompute={() => {
              setUseCache(false);
              setRecomputeCounter((c) => c + 1);
            }}
            hasResult={!!images}
          />
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
            <ImagesDiv>
              {images.map((img, i) => (
                <img key={i} src={"data:image/png;base64," + img} alt="plot" />
              ))}
            </ImagesDiv>
          )}
        </>
      ) : (
        <div style={{ position: "relative", height: "100px" }} />
      )}
    </div>
  );
};

const ImagesDiv: FunctionComponent<PropsWithChildren> = ({ children }) => {
  const style: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: "1em",
    justifyContent: "flex-start",
  };
  const childArray = React.Children.toArray(children);
  const showLabels = childArray.length > 1;

  return (
    <div style={style}>
      {childArray.map((child, index) => (
        <div key={index} style={{ position: "relative" }}>
          {showLabels && (
            <div
              style={{
                position: "absolute",
                top: "10px",
                left: "10px",
                background: "white",
                padding: "2px 6px",
                borderRadius: "3px",
                fontWeight: "bold",
                fontSize: "14px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }}
            >
              {String.fromCharCode(65 + index)}
            </div>
          )}
          {child}
        </div>
      ))}
    </div>
  );
};

const ExpandableCode: FunctionComponent<{
  codeElement: JSX.Element;
  onRecompute: () => void;
  hasResult: boolean;
}> = ({ codeElement, onRecompute, hasResult }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <button onClick={() => setExpanded(!expanded)}>
        {expanded ? "Hide code" : "Show code"}
      </button>
      {expanded && (
        <>
          {hasResult && (
            <button onClick={onRecompute} style={{ marginLeft: 10 }}>
              Recompute
            </button>
          )}
          {codeElement}
        </>
      )}
    </div>
  );
};

export default PlotFromCode;
