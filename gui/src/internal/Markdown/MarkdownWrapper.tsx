import { FunctionComponent, PropsWithChildren, useEffect, useRef } from "react";
import { ProvideDocumentWidth } from "./DocumentWidthContext";

type MarkdownWrapperProps = {
  width: number;
  height: number;
  source?: string;
};

const MarkdownWrapper: FunctionComponent<
  PropsWithChildren<MarkdownWrapperProps>
> = ({ children, width, height, source }) => {
  // Create ref for the scrollable div
  const scrollableRef = useRef<HTMLDivElement>(null);

  // Effect to scroll to top when source changes
  useEffect(() => {
    if (scrollableRef.current) {
      scrollableRef.current.scrollTop = 0;
    }
  }, [source]);

  return (
    // The figures are offset from the left, so we need to give some room
    // TODO: figure out how to do this better
    <ProvideDocumentWidth width={width - 50}>
      <div
        ref={scrollableRef}
        className="MarkdownWrapper"
        style={{ position: "absolute", width, height, overflowY: "auto" }}
      >
        <div style={{ padding: 10 }}>{children}</div>
      </div>
    </ProvideDocumentWidth>
  );
};

export default MarkdownWrapper;
