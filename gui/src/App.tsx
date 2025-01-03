import { useWindowDimensions } from "@fi-sci/misc";
import "./App.css";

import { FunctionComponent, useState } from "react";
import { PageProvider } from "./contexts/PageContext";
import ControlPanel, { Page } from "./ControlPanel";
import WaveletsPage from "./pages/WaveletsPage/WaveletsPage";
import CompressionPage from "./pages/CompressionPage/CompressionPage";
import ComputeTimePage from "./pages/ComputeTimePage/ComputeTimePage";
import TestPage from "./pages/TestPage/TestPage";
import StoryPage from "./pages/StoryPage/StoryPage";

function App() {
  const { width, height } = useWindowDimensions();
  const [okayToViewSmallScreen, setOkayToViewSmallScreen] = useState(false);
  if (width < 800 && !okayToViewSmallScreen) {
    return <SmallScreenMessage onOkay={() => setOkayToViewSmallScreen(true)} />;
  }
  return <MainWindow width={width} height={height} />;
}

const SmallScreenMessage: FunctionComponent<{ onOkay: () => void }> = ({
  onOkay,
}) => {
  return (
    <div style={{ padding: 20 }}>
      <p>
        This page is not optimized for small screens or mobile devices. Please
        use a larger screen or expand your browser window width.
      </p>
      <p>
        <button onClick={onOkay}>Continue anyway</button>
      </p>
    </div>
  );
};

type MainWindowProps = {
  width: number;
  height: number;
};

const MainWindow: FunctionComponent<MainWindowProps> = ({ width, height }) => {
  const [page, setPage] = useState<Page>("story");
  const controlPanelWidth = 200;
  return (
    <PageProvider value={{ page, setPage }}>
      <div
        className="app-container"
        style={{ width, height, overflow: "hidden" }}
      >
        <div
          className="control-panel"
          style={{
            position: "absolute",
            width: controlPanelWidth,
            height,
            backgroundColor: "#f0f4ff",
          }}
        >
          <ControlPanel page={page} setPage={setPage} />
        </div>
        <div
          className="main-content"
          style={{
            position: "absolute",
            left: controlPanelWidth,
            width: width - controlPanelWidth,
            height,
            overflowY: "hidden",
          }}
        >
          <MainWindow2 width={width - 250} height={height} page={page} />
        </div>
      </div>
    </PageProvider>
  );
};

type MainWindow2Props = {
  width: number;
  height: number;
  page: Page;
};

const MainWindow2: FunctionComponent<MainWindow2Props> = ({
  width,
  height,
  page,
}) => {
  if (page === "wavelets") {
    return <WaveletsPage width={width} height={height} />;
  } else if (page === "compression") {
    return <CompressionPage width={width} height={height} />;
  } else if (page === "compute_time") {
    return <ComputeTimePage width={width} height={height} />;
  } else if (page === "test") {
    return <TestPage width={width} height={height} />;
  } else if (page === "story") {
    return <StoryPage width={width} height={height} />;
  } else {
    return <div>Unknown page: {page}</div>;
  }
};

export default App;
