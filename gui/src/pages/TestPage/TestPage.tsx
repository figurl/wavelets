import { FunctionComponent, useCallback } from "react";
import Markdown from "../../internal/Markdown/Markdown";
import MarkdownWrapper from "../../internal/Markdown/MarkdownWrapper";
import testMd from "./test.md?raw";
import { pyodideRun } from "../../internal/pyodide/pyodideRun";
import test_py from "./test.py?raw";
import RemoteFile_py from "./RemoteFile.py?raw";

type Props = {
  width: number;
  height: number;
};

const TestPage: FunctionComponent<Props> = ({ width, height }) => {
  const handleTest = useCallback(async () => {
    const x = await pyodideRun(
      test_py,
      {
        onStdout(data) {
          console.log(data);
        },
        onStderr(data) {
          console.error(data);
        },
        onStatus(status) {
          console.log("status", status);
        },
      },
      {
        "RemoteFile.py": RemoteFile_py,
      },
    );
    console.log("--- x", x);
  }, []);
  return (
    <MarkdownWrapper width={Math.min(800, width)} height={height}>
      <Markdown source={testMd} />
      <div>
        <button onClick={handleTest}>Test</button>
      </div>
    </MarkdownWrapper>
  );
};

export default TestPage;
