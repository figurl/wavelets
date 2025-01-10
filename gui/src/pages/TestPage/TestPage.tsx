import { FunctionComponent, useCallback } from "react";
import Markdown from "../../internal/Markdown/Markdown";
import MarkdownWrapper from "../../internal/Markdown/MarkdownWrapper";
import testMd from "./test.md?raw";
import { pyodideRun } from "../../internal/pyodide/pyodideRun";
import test_py from "./test.py?raw";
import test_async_py from "./test_async.py?raw";
import RemoteFile_py from "./RemoteFile.py?raw";

type Props = {
  width: number;
  height: number;
};

const TestPage: FunctionComponent<Props> = ({ width, height }) => {
  const handleTest = useCallback(async () => {
    await pyodideRun(
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
  }, []);

  const handleTestAsync = useCallback(async () => {
    await pyodideRun(
      test_async_py,
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
        asyncFunctions: {
          fetchRandomNumber: async () => {
            // Simulate an async operation
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return Math.random();
          },
        },
      },
      {},
    );
  }, []);
  return (
    <MarkdownWrapper width={Math.min(800, width)} height={height}>
      <Markdown source={testMd} />
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={handleTest}>Test</button>
        <button onClick={handleTestAsync}>Test Async Bridge</button>
      </div>
    </MarkdownWrapper>
  );
};

export default TestPage;
