import { FC, useState } from "react";
import { Route } from "../../Route";

type TopBarProps = {
  setRoute: (route: Route) => void;
  currentMarkdown: string;
};

const parseMarkdownTitle = (markdown: string): string => {
  const lines = markdown.split("\n");
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    if (firstLine.startsWith("#")) {
      return firstLine.replace(/^#+\s*/, "").trim();
    }
  }
  return "";
};

const TopBar: FC<TopBarProps> = ({ setRoute, currentMarkdown }) => {
  const [isLogoHovered, setIsLogoHovered] = useState(false);
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
      <span
        style={{
          fontSize: "18px",
          fontWeight: 500,
          color: "#333",
        }}
      >
        {parseMarkdownTitle(currentMarkdown)}
      </span>
    </div>
  );
};

export default TopBar;
