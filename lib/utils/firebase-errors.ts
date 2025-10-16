import { FirebaseError } from "firebase/app";

export interface AppError {
  type: "firebase" | "network" | "validation" | "unknown";
  code: string;
  message: string;
  userMessage: string;
  action?: string;
}

export function handleFirebaseError(error: unknown): AppError {
  // Handle Firebase-specific errors
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "permission-denied":
        return {
          type: "firebase",
          code: error.code,
          message: error.message,
          userMessage:
            "You don't have permission to access this resource. Please sign in or check your access rights.",
          action: "retry-auth",
        };

      case "not-found":
        return {
          type: "firebase",
          code: error.code,
          message: error.message,
          userMessage:
            "The requested resource was not found. It may have been deleted or moved.",
          action: "navigate-home",
        };

      case "unauthenticated":
        return {
          type: "firebase",
          code: error.code,
          message: error.message,
          userMessage: "Please sign in to continue.",
          action: "sign-in",
        };

      case "unavailable":
        return {
          type: "firebase",
          code: error.code,
          message: error.message,
          userMessage:
            "Service is temporarily unavailable. Please try again in a moment.",
          action: "retry",
        };

      case "deadline-exceeded":
        return {
          type: "firebase",
          code: error.code,
          message: error.message,
          userMessage:
            "Request timed out. Please check your connection and try again.",
          action: "retry",
        };

      case "resource-exhausted":
        return {
          type: "firebase",
          code: error.code,
          message: error.message,
          userMessage: "Too many requests. Please wait a moment and try again.",
          action: "retry",
        };

      default:
        return {
          type: "firebase",
          code: error.code,
          message: error.message,
          userMessage: `Firebase error: ${error.code}. Please try again or contact support if the problem persists.`,
          action: "retry",
        };
    }
  }

  // Handle network errors
  if (error instanceof Error) {
    if (error.message.includes("network") || error.message.includes("fetch")) {
      return {
        type: "network",
        code: "network-error",
        message: error.message,
        userMessage:
          "Network connection issue. Please check your internet connection and try again.",
        action: "retry",
      };
    }

    // Generic JavaScript errors
    return {
      type: "unknown",
      code: "javascript-error",
      message: error.message,
      userMessage: "An unexpected error occurred. Please try again.",
      action: "retry",
    };
  }

  // Fallback for unknown error types
  return {
    type: "unknown",
    code: "unknown-error",
    message: String(error),
    userMessage: "An unexpected error occurred. Please try again.",
    action: "retry",
  };
}

export function logError(error: AppError, context?: string) {
  console.error(
    `[${error.type.toUpperCase()}] ${context ? `${context}: ` : ""}${error.code}`,
    {
      message: error.message,
      userMessage: error.userMessage,
      action: error.action,
    },
  );
}
