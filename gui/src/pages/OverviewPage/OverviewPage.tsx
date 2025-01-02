import { FunctionComponent } from "react";
import Markdown from "../../Markdown/Markdown";
import MarkdownWrapper from "../../Markdown/MarkdownWrapper";
import overviewMd from "./overview.md?raw";

type Props = {
  width: number;
  height: number;
};

const OverviewPage: FunctionComponent<Props> = ({ width, height }) => {
  return (
    <MarkdownWrapper width={Math.min(800, width)} height={height}>
      <Markdown source={overviewMd} />
    </MarkdownWrapper>
  );
};

export default OverviewPage;
