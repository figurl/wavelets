import { useWindowDimensions } from "@fi-sci/misc";
import "./App.css";

import { FunctionComponent, useState } from "react";
import ControlPanel, { Page } from "./ControlPanel";
import Splitter from "./components/Splitter";
import WaveletsPage from "./pages/WaveletsPage/WaveletsPage";
import CompressionPage from "./pages/CompressionPage/CompressionPage";
import OverviewPage from "./pages/OverviewPage/OverviewPage";
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
  const initialControlPanelWidth = Math.min(250, width / 2);
  const [page, setPage] = useState<Page>("overview");
  return (
    <Splitter
      width={width}
      height={height}
      initialPosition={initialControlPanelWidth}
      direction="horizontal"
    >
      <ControlPanel width={0} height={0} page={page} setPage={setPage} />
      <MainWindow2 width={0} height={0} page={page} />
    </Splitter>
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
  if (page === "overview") {
    return <OverviewPage width={width} height={height} />;
  } else if (page === "wavelets") {
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
