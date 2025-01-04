import { useWindowDimensions } from "@fi-sci/misc";
import "./App.css";

import { FunctionComponent } from "react";
import { BrowserRouter } from "react-router-dom";
import { useRoute } from "./Route";
import RouteProvider from "./RouteProvider";
import ContentPage from "./pages/ContentPage/ContentPage";
import TestPage from "./pages/TestPage/TestPage";

function App() {
  const { width, height } = useWindowDimensions();
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

export default App;
