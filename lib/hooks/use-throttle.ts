import { useEffect, useRef, useState } from "react";

/**
 * Throttles a value by limiting updates to once per specified interval
 * @param value The value to throttle
 * @param interval The interval in milliseconds (default: 200ms)
 * @returns The throttled value
 */
export function useThrottle<T>(value: T, interval = 200): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecuted.current;

    // Always use setTimeout to avoid synchronous state updates in effects
    const delay =
      timeSinceLastExecution >= interval ? 0 : (
        interval - timeSinceLastExecution
      );

    const timerId = setTimeout(() => {
      lastExecuted.current = Date.now();
      setThrottledValue(value);
    }, delay);

    return () => clearTimeout(timerId);
  }, [value, interval]);

  return throttledValue;
}

/**
 * Creates a throttled callback function
 * @param callback The callback function to throttle
 * @param interval The interval in milliseconds (default: 200ms)
 * @returns The throttled callback function
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  interval = 200,
): (...args: Parameters<T>) => void {
  const lastRan = useRef<number>(0);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, []);

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now >= lastRan.current + interval) {
      lastRan.current = now;
      callback(...args);
    } else {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }

      timeoutId.current = setTimeout(
        () => {
          lastRan.current = Date.now();
          callback(...args);
        },
        interval - (now - lastRan.current),
      );
    }
  };
}
