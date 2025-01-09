import React, { useCallback, useContext, useState } from "react";
import { MemobinContext } from "./MemobinContext";
import { clearCache } from "../utils/indexedDbCache";

const getStatusColor = (
  hasApiKey: boolean,
  activity: "none" | "upload" | "download",
) => {
  switch (activity) {
    case "upload":
      return "#8e8";
    case "download":
      return "#88e";
    default:
      return hasApiKey ? "#888" : "#444";
  }
};

export const MemobinStatusIndicator: React.FC = () => {
  const context = useContext(MemobinContext);
  const [isSettingKey, setIsSettingKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState("");
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(() => {
    setIsSettingKey(true);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (context?.setApiKey) {
        context.setApiKey(newApiKey);
        setNewApiKey("");
        setIsSettingKey(false);
      }
    },
    [context, newApiKey],
  );

  const handleClearApiKey = useCallback(() => {
    if (context?.setApiKey) {
      context.setApiKey("");
      setIsSettingKey(false);
    }
  }, [context]);

  const handleClearCache = useCallback(async () => {
    try {
      await clearCache();
      alert("Cache cleared successfully");
      setIsSettingKey(false);
    } catch (error) {
      console.error("Failed to clear cache:", error);
      alert("Failed to clear cache");
    }
  }, []);

  if (!context) return null;

  const statusColor = getStatusColor(!!context.apiKey, context.activity);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 1000,
      }}
    >
      {isSettingKey ? (
        <div
          style={{
            backgroundColor: "white",
            padding: "15px",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            border: "1px solid #ddd",
          }}
        >
          {context.apiKey ? (
            <div>
              <div style={{ marginBottom: "15px" }}>Memobin API Key is set</div>
              <div
                style={{ display: "flex", gap: "8px", marginBottom: "10px" }}
              >
                <button
                  onClick={handleClearApiKey}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    flex: 1,
                  }}
                >
                  Clear API Key
                </button>
                <button
                  onClick={() => setIsSettingKey(false)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#f5f5f5",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder="Enter Memobin API Key"
                style={{
                  padding: "8px",
                  marginRight: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsSettingKey(false)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f5f5f5",
                  border: "none",
                  borderRadius: "4px",
                  marginLeft: "8px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </form>
          )}
          <button
            onClick={handleClearCache}
            style={{
              padding: "8px 16px",
              backgroundColor: "#dc8686",
              color: "white",
              border: "none",
              borderRadius: "4px",
              marginTop: "10px",
              cursor: "pointer",
              width: "100%",
            }}
          >
            Purge Local Cache
          </button>
        </div>
      ) : (
        <div
          onClick={handleClick}
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            border: `2px solid ${statusColor}`,
            backgroundColor:
              context.activity !== "none" ? statusColor : "transparent",
            cursor: "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
            boxShadow: isHovered
              ? "0 2px 5px rgba(0,0,0,0.3)"
              : "0 1px 3px rgba(0,0,0,0.2)",
            transform: isHovered ? "scale(1.1)" : "scale(1)",
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          title={`Memobin API Key: ${context.apiKey ? "Set" : "Not Set"}`}
        />
      )}
    </div>
  );
};
