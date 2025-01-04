import { useWindowDimensions } from "@fi-sci/misc";
import "./App.css";

import { FunctionComponent, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { useRoute } from "./Route";
import RouteProvider from "./RouteProvider";
import ContentPage from "./pages/ContentPage/ContentPage";
import TestPage from "./pages/TestPage/TestPage";

function App() {
  const { width, height } = useWindowDimensions();
  const [okayToViewSmallScreen, setOkayToViewSmallScreen] = useState(false);
  if (width < 800 && !okayToViewSmallScreen) {
    return <SmallScreenMessage onOkay={() => setOkayToViewSmallScreen(true)} />;
  }
  return (
    <BrowserRouter>
      <RouteProvider>
        {/* <MainWindow width={width} height={height} /> */}
        <Main width={width} height={height} />
      </RouteProvider>
    </BrowserRouter>
  );
}

type MainProps = {
  width: number;
  height: number;
};

const Main: FunctionComponent<MainProps> = ({ width, height }) => {
  const { route } = useRoute();
  if (route.type === "content") {
    return <ContentPage width={width} height={height} />;
  } else if (route.type === "test") {
    return <TestPage width={width} height={height} />;
  } else {
    return <div>Unknown route type: {route["type"]}</div>;
  }
};

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

export default App;
