/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  FunctionComponent,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { useInView } from "react-intersection-observer";

const Plot = React.lazy(() => import("react-plotly.js") as any);

type Props = {
  data: any;
  layout: any;
};

export const LazyPlotlyPlotContext = React.createContext<{
  showPlotEvenWhenNotVisible?: boolean;
  showPlotWhenHasBeenVisible?: boolean;
}>({});

const LazyPlotlyPlot: FunctionComponent<Props> = ({ data, layout }) => {
  // It's important to only show the plot when visible because otherwise, for
  // tab Widgets, the mouse mode of the plotly plot interferes with the other
  // tabs
  const { showPlotEvenWhenNotVisible, showPlotWhenHasBeenVisible } =
    React.useContext(LazyPlotlyPlotContext);
  const hasBeenVisible = useRef(false);
  const { ref, inView } = useInView({ trackVisibility: true, delay: 200 });
  if (inView) hasBeenVisible.current = true;
  return (
    <div ref={ref}>
      {inView ||
      showPlotEvenWhenNotVisible ||
      (hasBeenVisible && showPlotWhenHasBeenVisible) ? (
        <div
          style={{
            position: "relative",
            height: layout.height,
            width: layout.width,
            overflow: "hidden",
          }}
        >
          <Suspense fallback={<div>Loading plotly</div>}>
            <Plot data={data} layout={layout} />
          </Suspense>
        </div>
      ) : (
        <div
          style={{
            position: "relative",
            height: layout.height,
            width: layout.width,
            overflow: "hidden",
          }}
        ></div>
      )}
    </div>
  );
};

export const PlotlyPlotFromUrl: FunctionComponent<{ url: string }> = ({
  url,
}) => {
  const x = useDataFromUrl(url);
  if (x === undefined) {
    return <div>Loading data for plotly plot</div>;
  } else if (x === null) {
    return <div>Error loading data for plotly plot</div>;
  } else {
    return <LazyPlotlyPlot data={x.data} layout={x.layout} />;
  }
};

const useDataFromUrl = (url: string) => {
  const [data, setData] = useState<{ data: any; layout: any } | undefined>(
    undefined,
  );
  const [error, setError] = useState<string | undefined>(undefined);
  useEffect(() => {
    let canceled = false;
    const load = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Error loading data from url: ${url}`);
        }
        const x = await response.json();
        if (canceled) return;
        setData(x);
      } catch (err: any) {
        if (canceled) return;
        setError(err.message);
      }
    };
    load();
    return () => {
      canceled = true;
    };
  }, [url]);

  if (error) {
    return null;
  }

  return data;
};

export default LazyPlotlyPlot;
