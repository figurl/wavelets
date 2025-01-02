import { FunctionComponent, PropsWithChildren } from "react";

type MarkdownWrapperProps = {
  width: number;
  height: number;
};

const MarkdownWrapper: FunctionComponent<
  PropsWithChildren<MarkdownWrapperProps>
> = ({ children, width, height }) => {
  return (
    <div style={{ position: "absolute", width, height, overflowY: "auto" }}>
      <div style={{ padding: 10 }}>{children}</div>
    </div>
  );
};

export default MarkdownWrapper;
