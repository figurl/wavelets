import { FunctionComponent, useCallback, FC, useState } from "react";
import { useRoute, Route } from "../../Route";
import Markdown from "../../Markdown/Markdown";
import MarkdownWrapper from "../../Markdown/MarkdownWrapper";
import divHandler from "../../divHandler/divHandler";

// Import all markdown files from content directory
const mdModules = import.meta.glob<{ default: string }>(
  "../../content/**/*.md",
  {
    query: "?raw",
    eager: true,
  },
);

// Create contents mapping by transforming the paths
const contents: { [key: string]: string } = Object.fromEntries(
  Object.entries(mdModules).map(([path, content]) => [
    // Transform './content/folder1/test2.md' to 'folder1/test2.md'
    path.replace(/^\.\.\/\.\.\/content\//, ""),
    content.default,
  ]),
);

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

type ContentPageProps = {
  width: number;
  height: number;
};

type TopBarProps = {
  setRoute: (route: Route) => void;
};

const TopBar: FC<TopBarProps> = ({ setRoute }) => {
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [isTitleHovered, setIsTitleHovered] = useState(false);
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "40px",
        backgroundColor: "#f5f5f5",
        borderBottom: "1px solid #ddd",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        zIndex: 1000,
        gap: "16px",
      }}
    >
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setRoute({ type: "content", d: "index.md" });
        }}
        onMouseEnter={() => setIsLogoHovered(true)}
        onMouseLeave={() => setIsLogoHovered(false)}
        style={{
          cursor: "pointer",
          transition: "all 0.2s ease-in-out",
          transform: isLogoHovered ? "scale(1.1)" : "scale(1)",
          filter: isLogoHovered ? "brightness(1.2)" : "brightness(1)",
        }}
        title="Go to home"
      >
        <img
          src="icon.svg"
          alt="Wavelets Logo"
          style={{
            height: "28px",
            width: "28px",
          }}
        />
      </a>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setRoute({ type: "content", d: "index.md" });
        }}
        onMouseEnter={() => setIsTitleHovered(true)}
        onMouseLeave={() => setIsTitleHovered(false)}
        style={{
          fontSize: "18px",
          fontWeight: 500,
          color: isTitleHovered ? "#007bff" : "#333",
          textDecoration: "none",
          cursor: "pointer",
          transition: "color 0.2s ease-in-out",
        }}
        title="Go to home"
      >
        Lossy Time Series Compression for Electrophysiology
      </a>
    </div>
  );
};

const ContentPage: FunctionComponent<ContentPageProps> = ({
  width,
  height,
}) => {
  const { route, setRoute } = useRoute();
  if (route.type !== "content") throw new Error("Invalid route type");
  const { d } = route;
  const source = contents[d];
  const handleRelativeLinkClick = useCallback(
    (link: string) => {
      setRoute({ type: "content", d: resolvePath(d || "index.md", link) });
    },
    [d, setRoute],
  );

  if (!source) {
    return <div>Content not found: {d}</div>;
  }
  return (
    <div style={{ position: "relative", height }}>
      <TopBar setRoute={setRoute} />
      <div style={{ paddingTop: "40px", height: "100%" }}>
        <MarkdownWrapper width={width} height={height - 40}>
          <Markdown
            source={source}
            onRelativeLinkClick={handleRelativeLinkClick}
            divHandler={divHandler}
          />
        </MarkdownWrapper>
      </div>
    </div>
  );
};

export default ContentPage;
