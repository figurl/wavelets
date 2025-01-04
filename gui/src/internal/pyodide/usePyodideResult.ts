/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { getCachedValue, setCachedValue } from "../utils/indexedDbCache";
import { pyodideRun } from "./pyodideRun";

const CACHE_VERSION = 1;
const CACHE_KEY_PREFIX = "pyodideResult";

const codeHash = (code: string) => {
  let hash = 0;
  if (code.length === 0) return hash;
  for (let i = 0; i < code.length; i++) {
    const char = code.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};

export const usePyodideResult = (
  code: string | null,
  o: {
    readCache?: boolean;
    writeCache?: boolean;
    additionalFiles?: { [key: string]: string | { base64: string } };
  } = {
    readCache: undefined,
    writeCache: undefined,
    additionalFiles: undefined,
  },
) => {
  const [result, setResult] = useState<any>(undefined);
  const additionalFilesJson = o.additionalFiles
    ? JSON.stringify(o.additionalFiles)
    : undefined;
  useEffect(() => {
    let canceled = false;
    const run = async () => {
      if (code === null) {
        setResult(null);
        return;
      }
      setResult(undefined);
      const key = `${CACHE_KEY_PREFIX}/${CACHE_VERSION}/${codeHash(JSON.stringify({ code, additionalFilesJson }))}`;
      if (o.readCache ?? true) {
        const x = await getCachedValue(key);
        if (x) {
          setResult(x);
          return;
        }
      }
      const result = await pyodideRun(
        code,
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
        additionalFilesJson ? JSON.parse(additionalFilesJson) : undefined,
      );
      if (canceled) return;
      if (o.writeCache ?? true) {
        await setCachedValue(key, result);
      }
      if (canceled) return;
      setResult(result);
    };
    run();
    return () => {
      canceled = true;
    };
  }, [code, o.readCache, o.writeCache, additionalFilesJson]);
  return result;
};
