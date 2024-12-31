import { useWindowDimensions } from "@fi-sci/misc";
import "./App.css";

import { FunctionComponent, useState } from "react";
import ControlPanel, {
  ControlPanelState,
  defaultControlPanelState,
} from "./ControlPanel";
import Splitter from "./components/Splitter";
import ShowBasisWaveletsPage from "./pages/ShowBasisWaveletsPage/ShowBasisWaveletsPage";
import CompressionPage from "./pages/CompressionPage/CompressionPage";

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
  const [controlPanelState, setControlPanelState] = useState<ControlPanelState>(
    defaultControlPanelState
  );
  return (
    <Splitter
      width={width}
      height={height}
      initialPosition={initialControlPanelWidth}
      direction="horizontal"
    >
      <ControlPanel
        width={0}
        height={0}
        controlPanelState={controlPanelState}
        setControlPanelState={setControlPanelState}
      />
      <MainWindow2 width={0} height={0} controlPanelState={controlPanelState} />
    </Splitter>
  );
};

type MainWindow2Props = {
  width: number;
  height: number;
  controlPanelState: ControlPanelState;
};

const MainWindow2: FunctionComponent<MainWindow2Props> = ({
  width,
  height,
  controlPanelState,
}) => {
  if (controlPanelState.page === "show-basis-wavelets") {
    return (
      <ShowBasisWaveletsPage
        width={width}
        height={height}
        controlPanelState={controlPanelState}
      />
    );
  } else if (controlPanelState.page === "compression") {
    return (
      <CompressionPage
        width={width}
        height={height}
        controlPanelState={controlPanelState}
      />
    );
  } else {
    return <div>Unknown page: {controlPanelState["page"]}</div>;
  }
};

export default App;
