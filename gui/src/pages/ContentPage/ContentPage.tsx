import { FunctionComponent, useCallback } from "react";
import { useRoute } from "../../Route";
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
    <MarkdownWrapper width={width} height={height}>
      <Markdown
        source={source}
        onRelativeLinkClick={handleRelativeLinkClick}
        divHandler={divHandler}
      />
    </MarkdownWrapper>
  );
};

export default ContentPage;
