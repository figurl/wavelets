/* eslint-disable @typescript-eslint/no-explicit-any */

const baseObjectCheck = (x: any): boolean => {
  return (x ?? false) && typeof x === "object";
};

export type InterpreterStatus =
  | "idle"
  | "loading"
  | "installing"
  | "running"
  | "completed"
  | "failed";

export const isInterpreterStatus = (x: any): x is InterpreterStatus => {
  return [
    "idle",
    "loading",
    "installing",
    "running",
    "completed",
    "failed",
  ].includes(x);
};

export type PyodideRunSettings = Partial<{
  loadsDraws: boolean;
}>;

export type MessageToPyodideWorker = {
  type: "run";
  code: string;
};

export const isMessageToPyodideWorker = (
  x: any
): x is MessageToPyodideWorker => {
  if (!baseObjectCheck(x)) return false;
  if (x.type !== "run") return false;
  return true;
};

export type MessageFromPyodideWorker =
  | {
      type: "stdout" | "stderr";
      data: string;
    }
  | {
      type: "setStatus";
      status: InterpreterStatus;
    }
  | {
    type: "setResultJson";
    resultJson: string;
  }

export const isMessageFromPyodideWorker = (
  x: any
): x is MessageFromPyodideWorker => {
  if (!baseObjectCheck(x)) return false;
  if (x.type === "stdout") return x.data !== undefined;
  if (x.type === "stderr") return x.data !== undefined;
  if (x.type === "setStatus") return isInterpreterStatus(x.status);
  if (x.type === "setResultJson") return typeof x.resultJson === "string";
  return false;
};
