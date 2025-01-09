import React, { createContext, useState, useEffect } from "react";
import { setMemobinApiKey, getCurrentActivity } from "./memobin";

interface MemobinContextType {
  apiKey: string | undefined;
  setApiKey: (key: string) => void;
  activity: "none" | "upload" | "download";
}

// eslint-disable-next-line react-refresh/only-export-components
export const MemobinContext = createContext<MemobinContextType | undefined>(
  undefined,
);

export const MemobinProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [apiKey, setApiKeyState] = useState<string | undefined>(
    localStorage.getItem("MEMOBIN_API_KEY") || undefined,
  );
  const [activity, setActivity] = useState<"none" | "upload" | "download">(
    "none",
  );

  useEffect(() => {
    // Poll for activity changes every 100ms
    const interval = setInterval(() => {
      const currentActivity = getCurrentActivity();
      setActivity(currentActivity);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const setApiKey = (key: string) => {
    setMemobinApiKey(key);
    setApiKeyState(key);
  };

  return (
    <MemobinContext.Provider value={{ apiKey, setApiKey, activity }}>
      {children}
    </MemobinContext.Provider>
  );
};
