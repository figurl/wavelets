import { FunctionComponent, useMemo } from "react";

type FileTreeNode = {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileTreeNode[];
};

type FileTreeProps = {
  width: number;
  height: number;
  files: { [key: string]: string };
  currentPath: string;
  onFileClick: (path: string) => void;
};

const FileTree: FunctionComponent<FileTreeProps> = ({
  width,
  height,
  files,
  currentPath,
  onFileClick,
}) => {
  const tree = useMemo(() => {
    const root: FileTreeNode = {
      name: "root",
      path: "",
      type: "directory",
      children: [],
    };

    // Sort files to ensure consistent ordering
    const sortedPaths = Object.keys(files).sort();

    for (const path of sortedPaths) {
      const parts = path.split("/");
      let current = root;
      let currentPath = "";

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const isFile = i === parts.length - 1;

        let child = current.children?.find((c) => c.name === part);
        if (!child) {
          child = {
            name: part,
            path: currentPath,
            type: isFile ? "file" : "directory",
            children: isFile ? undefined : [],
          };
          current.children = current.children || [];
          current.children.push(child);
          // Sort children with directories first
          current.children.sort((a, b) => {
            if (a.type === b.type) {
              return a.name.localeCompare(b.name);
            }
            return a.type === "directory" ? -1 : 1;
          });
        }
        current = child;
      }
    }

    return root;
  }, [files]);

  const renderNode = (node: FileTreeNode, level: number) => {
    const isSelected = node.path === currentPath;
    const style: React.CSSProperties = {
      cursor: "pointer",
      backgroundColor: isSelected ? "#e0e0e0" : "transparent",
      padding: "4px 8px 4px",
      paddingLeft: `${(level + 1) * 20}px`,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    };

    return (
      <div key={node.path}>
        <div
          style={style}
          onClick={() => node.type === "file" && onFileClick(node.path)}
        >
          {node.type === "directory" ? "📁 " : "📄 "}
          {node.name}
        </div>
        {node.children?.map((child) => renderNode(child, level + 1))}
      </div>
    );
  };

  return (
    <div
      style={{
        width,
        height,
        overflowY: "auto",
        borderRight: "1px solid #ccc",
        backgroundColor: "#f5f5f5",
      }}
    >
      {tree.children?.map((child) => renderNode(child, 0))}
    </div>
  );
};

export default FileTree;
