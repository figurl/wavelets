import { FunctionComponent, PropsWithChildren } from "react";
import { ProvideDocumentWidth } from "./DocumentWidthContext";

type MarkdownWrapperProps = {
  width: number;
  height: number;
};

const MarkdownWrapper: FunctionComponent<
  PropsWithChildren<MarkdownWrapperProps>
> = ({ children, width, height }) => {
  return (
    <ProvideDocumentWidth width={width}>
      <div style={{ position: "absolute", width, height, overflowY: "auto" }}>
        <div style={{ padding: 10 }}>{children}</div>
      </div>
    </ProvideDocumentWidth>
  );
};

export default MarkdownWrapper;
