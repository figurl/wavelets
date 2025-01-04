import { FunctionComponent, useCallback, FC } from "react";
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
  currentPath: string;
};

const TopBar: FC<TopBarProps> = ({ setRoute, currentPath }) => {
  const isHome = currentPath === "index.md";
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '40px',
      backgroundColor: '#f5f5f5',
      borderBottom: '1px solid #ddd',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      zIndex: 1000
    }}>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          if (!isHome) {
            setRoute({ type: "content", d: "index.md" });
          }
        }}
        style={{
          ...(!isHome ? {
            cursor: 'pointer',
          } : {
            cursor: 'default',
            opacity: 0.5,
            pointerEvents: isHome ? 'none' : 'auto',
          }),
          color: '#333',
          textDecoration: 'none',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginTop: '1px' }}>
          <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Home</span>
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
    <div style={{ position: 'relative', height }}>
      <TopBar setRoute={setRoute} currentPath={d} />
      <div style={{ paddingTop: '40px', height: '100%' }}>
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
