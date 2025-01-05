import { FunctionComponent, useCallback, useMemo } from "react";
import { useRoute } from "../../Route";
import Markdown from "../../internal/Markdown/Markdown";
import MarkdownWrapper from "../../internal/Markdown/MarkdownWrapper";
import divHandler from "./divHandler";
import TopBar from "./TopBar";
import Splitter from "../../internal/components/Splitter";
import FileTree from "./FileTree";
import codeHandler from "./codeHandler";

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

const ContentPage: FunctionComponent<ContentPageProps> = ({
  width,
  height,
}) => {
  const { route, setRoute } = useRoute();
  if (route.type !== "content") throw new Error("Invalid route type");
  const { d } = route;
  const source = contents[d];

  // Get content without the title line for rendering
  const contentWithoutTitle = useMemo(() => {
    // const lines = source?.split('\n') || [];
    // if (lines.length > 0 && lines[0].trim().startsWith('#')) {
    //   return lines.slice(1).join('\n').trim();
    // }
    return source || "";
  }, [source]);

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
      <TopBar setRoute={setRoute} currentMarkdown={source} />
      <div style={{ paddingTop: "40px", height: "100%" }}>
        <Splitter
          width={width}
          height={height - 40}
          initialPosition={300}
          adjustable={true}
          hideFirstChild={width < 900}
        >
          <FileTree
            width={0}
            height={0}
            files={contents}
            currentPath={d}
            onFileClick={(path) => setRoute({ type: "content", d: path })}
          />
          <MarkdownWrapper width={0} height={0}>
            <Markdown
              source={contentWithoutTitle}
              onRelativeLinkClick={handleRelativeLinkClick}
              divHandler={divHandler}
              codeHandler={codeHandler}
            />
          </MarkdownWrapper>
        </Splitter>
      </div>
    </div>
  );
};

export default ContentPage;
