/* eslint-disable @typescript-eslint/no-explicit-any */
import { PyodideInterface, loadPyodide } from "pyodide";
import {
  InterpreterStatus,
  MessageFromPyodideWorker,
} from "./pyodideWorkerTypes";
// import spDrawsScript from "./sp_load_draws.py?raw";

let pyodide: PyodideInterface | null = null;

// Custom fetch with caching
const fetchWithCache = async (originalFetch: any, url: string) => {
  // Try to get from memory cache first
  const cachedResponse = await caches.open('pyodide-cache').then(cache =>
    cache.match(url)
  );

  if (cachedResponse) {
    console.info(`Using cached response for ${url}`);
    return cachedResponse;
  }

  // If not in cache, fetch and cache
  const response = await originalFetch(url);
  if (response.ok) {
    const cache = await caches.open('pyodide-cache');
    // Clone the response since we can only use it once
    await cache.put(url, response.clone());
  }
  return response;
};

const loadPyodideInstance = async () => {
  if (pyodide === null) {
    console.info("Loading Pyodide");
    const timer = Date.now();
    // Override global fetch for Pyodide loading
    const originalFetch = self.fetch;
    self.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      // Only cache Pyodide-related files
      if (url.includes('cdn.jsdelivr.net/pyodide')) {
        return fetchWithCache(originalFetch, url);
      }
      return originalFetch(input, init);
    };

    try {
      pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full",
        stdout: (x: string) => {
          sendStdout(x);
        },
        stderr: (x: string) => {
          sendStderr(x);
        },
        packages: ["numpy", "micropip", "PyWavelets"],
      });
    } finally {
      // Restore original fetch
      self.fetch = originalFetch;
    }
    setStatus("installing");

    // pyodide.FS.writeFile("sp_load_draws.py", spDrawsScript, {
    //   encoding: "utf-8",
    // });
    // pyodide.FS.writeFile("sp_patch_matplotlib.py", spMPLScript, {
    //   encoding: "utf-8",
    // });

    console.info(`Pyodide loaded in ${(Date.now() - timer) / 1000} seconds`);

    return pyodide;
  } else {
    return pyodide;
  }
};

const sendMessageToMain = (message: MessageFromPyodideWorker) => {
  self.postMessage(message);
};

const sendStdout = (data: string) => {
  sendMessageToMain({ type: "stdout", data });
};

const sendStderr = (data: string) => {
  sendMessageToMain({ type: "stderr", data });
};

const setStatus = (status: InterpreterStatus) => {
  sendMessageToMain({ type: "setStatus", status });
};

const sendResult = (result: any) => {
  sendMessageToMain({ type: "setResultJson", resultJson: JSON.stringify(result) });
}

self.onmessage = async (e) => {
  // if (isMonacoWorkerNoise(e.data)) {
  //   return;
  // }
  const message = e.data;
  if (message.code) {
    await run(message.code);
  }
};

const run = async (
  code: string,
) => {
  setStatus("loading");
  try {
    const pyodide = await loadPyodideInstance();

    // const globalsJS: { [key: string]: any } = {
    //   //
    // };
    // const globals = pyodide.toPy(globalsJS);

    const script = code;

    let succeeded = false;
    try {
      const packageFutures = [];
      // const micropip = pyodide.pyimport("micropip");

      // packageFutures.push(micropip.install("stanio"));
      packageFutures.push(pyodide.loadPackagesFromImports(script));
      for (const f of packageFutures) {
        await f;
      }

      setStatus("running");
      const result = await pyodide.runPythonAsync(script, {
        globals: undefined,
        filename: "test.py",
      });
      succeeded = true;
      sendResult(result.toJs());
    } catch (e: any) {
      console.error(e);
      sendStderr(e.toString());
    } finally {
      // if (files) {
      //   for (const filename of Object.keys(files)) {
      //     await pyodide.FS.unlink(filename);
      //   }
      // }
    }

    setStatus(succeeded ? "completed" : "failed");
  } catch (e: any) {
    console.error(e);
    sendStderr("UNEXPECTED ERROR: " + e.toString());
    setStatus("failed");
  }
};
