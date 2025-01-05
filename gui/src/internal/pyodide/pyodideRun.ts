/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * This module provides a non-React implementation for running Python code in a Pyodide worker.
 * It maintains a single worker instance and implements a queue system to handle multiple
 * execution requests sequentially.
 */

import pyodideWorkerURL from "./pyodideWorker?worker&url";
import {
  MessageToPyodideWorker,
  isMessageFromPyodideWorker,
  InterpreterStatus,
} from "./pyodideWorkerTypes";

/**
 * Callback functions for handling worker output and status updates
 */
type PyodideCallbacks = {
  onStdout: (data: string) => void;
  onStderr: (data: string) => void;
  onStatus: (status: InterpreterStatus) => void;
  onImage?: (image: any) => void;
};

/**
 * Represents a queued Python execution task
 */
type QueuedTask = {
  code: string;
  additionalFiles?: { [filename: string]: string | { base64: string } };
  callbacks: PyodideCallbacks;
  resolve: (result: any) => void;
  reject: (error: Error) => void;
};

/**
 * Manages a single Pyodide worker instance and handles task queuing.
 * Implements the singleton pattern to ensure only one worker exists.
 */
class PyodideWorkerManager {
  private static instance: PyodideWorkerManager | undefined;
  private worker: Worker;
  private isRunning = false;
  private taskQueue: QueuedTask[] = [];
  private currentCallbacks: PyodideCallbacks | undefined;
  private currentResult: any | undefined;

  /**
   * Private constructor to enforce singleton pattern.
   * Initializes the worker and sets up message handling.
   */
  private constructor() {
    this.worker = this.initializeWorker();
  }

  /**
   * Creates and configures a new Web Worker instance.
   * Sets up message handling for worker communication.
   */
  private initializeWorker() {
    const worker = new Worker(pyodideWorkerURL, {
      name: "pyodideWorker",
      type: "module",
    });

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data;
      if (!isMessageFromPyodideWorker(msg)) {
        console.error("invalid message from worker", msg);
        return;
      }

      if (this.currentCallbacks) {
        if (msg.type === "setStatus") {
          this.currentCallbacks.onStatus(msg.status);
          if (msg.status === "completed" || msg.status === "failed") {
            this.completeCurrentTask(msg.status === "failed");
          }
        } else if (msg.type === "stdout") {
          this.currentCallbacks.onStdout(msg.data);
        } else if (msg.type === "stderr") {
          this.currentCallbacks.onStderr(msg.data);
        } else if (msg.type === "addImage") {
          if (this.currentCallbacks.onImage) {
            this.currentCallbacks.onImage(msg.image);
          }
        }
      }
      if (msg.type === "setResultJson") {
        this.currentResult = msg.resultJson
          ? JSON.parse(msg.resultJson)
          : msg.resultJson;
      }
    };

    return worker;
  }

  /**
   * Completes the current task and processes the next one in queue.
   * @param failed Whether the task failed or completed successfully
   */
  private completeCurrentTask(failed: boolean) {
    const currentTask = this.taskQueue[0];
    if (currentTask) {
      this.taskQueue.shift();
      this.isRunning = false;
      const result = this.currentResult;
      this.currentCallbacks = undefined;
      this.currentResult = undefined;
      if (failed) {
        currentTask.reject(new Error("Python execution failed"));
      } else {
        currentTask.resolve(result);
      }
      this.processNextTask();
    }
  }

  /**
   * Processes the next task in the queue if the worker is not busy.
   * Sends the Python code to the worker and sets up callback handling.
   */
  private processNextTask() {
    if (this.isRunning || this.taskQueue.length === 0) return;

    const nextTask = this.taskQueue[0];
    this.isRunning = true;
    this.currentCallbacks = nextTask.callbacks;
    this.currentResult = undefined;

    const msg: MessageToPyodideWorker = {
      type: "run",
      code: nextTask.code,
      additionalFiles: nextTask.additionalFiles,
    };
    this.worker.postMessage(msg);
  }

  /**
   * Gets the singleton instance of the PyodideWorkerManager.
   * Creates the instance if it doesn't exist.
   */
  public static getInstance(): PyodideWorkerManager {
    if (!PyodideWorkerManager.instance) {
      PyodideWorkerManager.instance = new PyodideWorkerManager();
    }
    return PyodideWorkerManager.instance;
  }

  /**
   * Queues a Python execution task and returns a Promise.
   * @param code The Python code to execute
   * @param callbacks Callbacks for handling output and status
   * @returns Promise that resolves when execution completes
   */
  public queueTask(
    code: string,
    callbacks: PyodideCallbacks,
    additionalFiles?: { [filename: string]: string | { base64: string } },
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({
        code,
        additionalFiles,
        callbacks,
        resolve,
        reject,
      });
      this.processNextTask();
    });
  }
}

/**
 * Executes Python code in a Pyodide worker.
 * If the worker is busy, the code will be queued and executed when the worker is available.
 * @param code The Python code to execute
 * @param callbacks Callbacks for handling output and status
 * @returns Promise that resolves when execution completes
 */
export const pyodideRun = async (
  code: string,
  callbacks: PyodideCallbacks,
  additionalFiles?: { [filename: string]: string | { base64: string } },
): Promise<void> => {
  const manager = PyodideWorkerManager.getInstance();
  return manager.queueTask(code, callbacks, additionalFiles);
};
