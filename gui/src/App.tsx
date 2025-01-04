/* eslint-disable @typescript-eslint/no-explicit-any */
import { useWindowDimensions } from "@fi-sci/misc";
import "./App.css";

import { FunctionComponent, useCallback, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import divHandler from "./divHandler/divHandler";
import Markdown from "./Markdown/Markdown";
import MarkdownWrapper from "./Markdown/MarkdownWrapper";
import { useRoute } from "./Route";
import RouteProvider from "./RouteProvider";

// Import all markdown files from content directory
const mdModules = import.meta.glob<{ default: string }>("./content/**/*.md", {
  query: "?raw",
  eager: true,
});

// Create contents mapping by transforming the paths
const contents: { [key: string]: string } = Object.fromEntries(
  Object.entries(mdModules).map(([path, content]) => [
    // Transform './content/folder1/test2.md' to 'folder1/test2.md'
    path.replace(/^\.\/content\//, ""),
    content.default,
  ]),
);

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
  } else {
    return <div>Unknown route type: {route.type}</div>;
  }
};

type ContentPageProps = {
  width: number;
  height: number;
};

const ContentPage: FunctionComponent<ContentPageProps> = ({
  width,
  height,
}) => {
  const { route, setRoute } = useRoute();
  if (route.type !== "content") throw new Error("Invalid route type");
  const { p } = route;
  const source = contents[p];
  const handleRelativeLinkClick = useCallback(
    (link: string) => {
      setRoute({ type: "content", p: resolvePath(p || "index.md", link) });
    },
    [p, setRoute],
  );

  if (!source) {
    return <div>Content not found: {p}</div>;
  }
  return (
    <MarkdownWrapper width={width} height={height}>
      <Markdown
        source={source}
        onRelativeLinkClick={handleRelativeLinkClick}
        divHandler={divHandler}
      />
    </MarkdownWrapper>
  );
};

const resolvePath = (currentPath: string, relativePath: string) => {
  // relativePath is like ./foo or ../foo/bar
  const currentParts = currentPath.split("/");
  const relativeParts = relativePath.split("/");
  const parts = currentParts.slice(0, -1);
  for (const part of relativeParts) {
    if (part === ".") {
      // pass
    } else if (part === "..") {
      parts.pop();
    } else {
      parts.push(part);
    }
  }
  return parts.join("/");
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
