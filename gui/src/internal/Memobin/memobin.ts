let apiKey: string | undefined =
  localStorage.getItem("MEMOBIN_API_KEY") || undefined;

type ActivityType = "none" | "upload" | "download";
let currentActivity: ActivityType = "none";
let activityTimeout: ReturnType<typeof setTimeout> | null = null;

export const getCurrentActivity = () => currentActivity;

const setActivity = (activity: ActivityType) => {
  currentActivity = activity;
  if (activityTimeout) {
    clearTimeout(activityTimeout);
  }
  if (activity !== "none") {
    activityTimeout = setTimeout(() => {
      currentActivity = "none";
      activityTimeout = null;
      // Notify listeners if we add them later
    }, 1500); // Activity lingers for 3 seconds
  }
};

export const setMemobinApiKey = (key: string) => {
  apiKey = key;
  localStorage.setItem("MEMOBIN_API_KEY", key);
};

export const saveMemobinMemo = async (
  key: string,
  value: string,
): Promise<void> => {
  if (!apiKey) {
    throw new Error("Memobin API key not set");
  }

  setActivity("upload");

  const url = `https://tempory.net/f/memobin/wavelets/${key}`;
  const uploadUrl = await createSignedUploadUrl({
    url,
    size: value.length,
    userId: "wavelets",
    memobinApiKey: apiKey,
  });
  console.log("Uploading memo for key:", key);
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: value,
  });
  if (!response.ok) {
    throw new Error("Failed to upload memo");
  }
};

export const loadMemobinMemo = async (key: string): Promise<string | null> => {
  const url = `https://tempory.net/f/memobin/wavelets/${key}`;
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error("Failed to load memo");
  }
  setActivity("download");
  return response.text();
};

export const memobinApiKeyHasBeenSet = () => apiKey !== undefined;

const createSignedUploadUrl = async (o: {
  url: string;
  size: number;
  userId: string;
  memobinApiKey: string;
}) => {
  const { url, size, userId, memobinApiKey } = o;
  const prefix = `https://tempory.net/f/memobin/`;
  if (!url.startsWith(prefix)) {
    throw Error("Invalid url. Does not have proper prefix");
  }
  const filePath = url.slice(prefix.length);
  const temporyApiUrl = "https://hub.tempory.net/api/uploadFile";
  const response = await fetch(temporyApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${memobinApiKey}`,
    },
    body: JSON.stringify({
      appName: "memobin",
      filePath,
      size,
      userId,
    }),
  });
  if (!response.ok) {
    throw Error("Failed to get signed url");
  }
  const result = await response.json();
  const { uploadUrl, downloadUrl } = result;
  if (downloadUrl !== url) {
    throw Error("Mismatch between download url and url");
  }
  return uploadUrl;
};
