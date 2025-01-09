/* eslint-disable @typescript-eslint/no-explicit-any */
import { PyodideInterface, loadPyodide } from "pyodide";
import {
  InterpreterStatus,
  MessageFromPyodideWorker,
} from "./pyodideWorkerTypes";
// import spDrawsScript from "./sp_load_draws.py?raw";
import spMPLScript from "./sp_patch_matplotlib.py?raw";

let pyodide: PyodideInterface | null = null;

// Custom fetch with caching
const fetchWithCache = async (originalFetch: any, url: string) => {
  // Try to get from memory cache first
  const cachedResponse = await caches
    .open("pyodide-cache")
    .then((cache) => cache.match(url));

  if (cachedResponse) {
    console.info(`Using cached response for ${url}`);
    return cachedResponse;
  }

  // If not in cache, fetch and cache
  const response = await originalFetch(url);
  if (response.ok) {
    const cache = await caches.open("pyodide-cache");
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
      if (url.includes("cdn.jsdelivr.net/pyodide")) {
        return fetchWithCache(originalFetch, url);
      }
      return originalFetch(input, init);
    };

    try {
      pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.0/full",
        stdout: (x: string) => {
          sendStdout(x);
        },
        stderr: (x: string) => {
          sendStderr(x);
        },
        packages: ["numpy", "requests", "h5py", "micropip", "PyWavelets", "zstandard", "lzma"],
      });
    } finally {
      // Restore original fetch
      self.fetch = originalFetch;
    }
    setStatus("installing");

    // pyodide.FS.writeFile("sp_load_draws.py", spDrawsScript, {
    //   encoding: "utf-8",
    // });
    pyodide.FS.writeFile("sp_patch_matplotlib.py", spMPLScript, {
      // encoding: "utf-8",
    });

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
  sendMessageToMain({
    type: "setResultJson",
    resultJson: JSON.stringify(result ?? null),
  });
};

const addImage = (image: any) => {
  sendMessageToMain({ type: "addImage", image });
};

self.onmessage = async (e) => {
  // if (isMonacoWorkerNoise(e.data)) {
  //   return;
  // }
  const message = e.data;
  if (message.code) {
    await run(message.code, message.additionalFiles);
  }
};

const run = async (
  code: string,
  additionalFiles?: { [filename: string]: string | { base64: string } },
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
      const micropip = pyodide.pyimport("micropip");
      packageFutures.push(micropip.install("pyodide-http"));
      packageFutures.push(pyodide.loadPackage("matplotlib"));
      // packageFutures.push(micropip.install("stanio"));
      packageFutures.push(pyodide.loadPackagesFromImports(script));
      for (const f of packageFutures) {
        await f;
      }

      setStatus("running");
      // Write any additional Python files to the filesystem
      if (additionalFiles) {
        try {
          const dirsCreated = new Set<string>();
          for (const [filename, content] of Object.entries(additionalFiles)) {
            // make sure directory exists
            if (filename.includes("/")) {
              const dirname = filename.split("/").slice(0, -1).join("/");
              if (!dirsCreated.has(dirname)) {
                pyodide.FS.mkdirTree(dirname);
              }
              dirsCreated.add(dirname);
            }
            if (typeof content === "string") {
              pyodide.FS.writeFile(filename, content);
            } else {
              const b64 = content.base64;
              const binary = atob(b64);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
              }
              pyodide.FS.writeFile(filename, bytes);
            }
          }
        } catch (e) {
          console.error('Error writing additional files');
          throw e;
        }
      }

      const scriptPreamble = `
from sp_patch_matplotlib import patch_matplotlib
patch_matplotlib(_SP_ADD_IMAGE)
`;
      const globalsJS: { [key: string]: any } = {};
      globalsJS._SP_ADD_IMAGE = addImage;
      const globals = pyodide.toPy(globalsJS);

      const script2 = scriptPreamble + "\n" + script;

      let result = await pyodide.runPythonAsync(script2, {
        globals,
        filename: "_script.py",
      });
      succeeded = true;
      if (typeof result === "object") {
        result = result.toJs();
      }
      sendResult(result);
    } catch (e: any) {
      console.error(e);
      sendStderr(e.toString());
    } finally {
      // Clean up any additional files
      if (additionalFiles) {
        for (const filename of Object.keys(additionalFiles)) {
          try {
            pyodide.FS.unlink(filename);
          } catch (e) {
            console.warn(`Failed to clean up file ${filename}:`, e);
          }
        }
      }
    }

    setStatus(succeeded ? "completed" : "failed");
  } catch (e: any) {
    console.error(e);
    sendStderr("UNEXPECTED ERROR: " + e.toString());
    setStatus("failed");
  }
};
