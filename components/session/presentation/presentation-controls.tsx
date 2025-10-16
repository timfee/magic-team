"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface PresentationControlsProps {
  isFinalizationStage?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  onPauseToggle?: () => void;
  isPaused?: boolean;
  currentIndex?: number;
  totalItems?: number;
}

/**
 * Floating control bar for presentation mode
 * Toggle visibility with 'c' key
 */
export function PresentationControls({
  isFinalizationStage = false,
  onPrevious,
  onNext,
  onPauseToggle,
  isPaused = false,
  currentIndex = 0,
  totalItems = 0,
}: PresentationControlsProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Toggle controls visibility with 'c' key
      if (e.key === "c" || e.key === "C") {
        setIsVisible((prev) => !prev);
      }

      // Navigation shortcuts when controls are visible
      if (isVisible && isFinalizationStage) {
        if (e.key === "ArrowLeft" && onPrevious) {
          e.preventDefault();
          onPrevious();
        } else if (e.key === "ArrowRight" && onNext) {
          e.preventDefault();
          onNext();
        } else if (e.key === " " && onPauseToggle) {
          e.preventDefault();
          onPauseToggle();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isVisible, isFinalizationStage, onPrevious, onNext, onPauseToggle]);

  return (
    <>
      {/* Hint to show controls */}
      <AnimatePresence>
        {!isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed right-4 bottom-4 rounded-lg bg-zinc-800/80 px-4 py-2 text-sm text-zinc-300 backdrop-blur">
            Press{" "}
            <kbd className="rounded bg-zinc-700 px-2 py-1 font-mono">C</kbd> for
            controls
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Bar */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 rounded-xl border border-zinc-700 bg-zinc-900/95 p-4 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-4">
              {/* Close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                aria-label="Hide controls"
                className="text-zinc-400 hover:text-zinc-100">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>

              {/* Divider */}
              <div className="h-8 w-px bg-zinc-700" />

              {/* Finalization controls */}
              {isFinalizationStage && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onPrevious}
                    disabled={currentIndex === 0}
                    aria-label="Previous item"
                    className="text-zinc-200 hover:text-white">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onPauseToggle}
                    aria-label={isPaused ? "Resume" : "Pause"}
                    className="text-zinc-200 hover:text-white">
                    {isPaused ?
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    : <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    }
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onNext}
                    disabled={currentIndex >= totalItems - 1}
                    aria-label="Next item"
                    className="text-zinc-200 hover:text-white">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Button>

                  {/* Progress indicator */}
                  <div className="ml-2 text-sm text-zinc-400">
                    {currentIndex + 1} / {totalItems}
                  </div>
                </>
              )}

              {/* Info text */}
              <div className="ml-4 text-sm text-zinc-400">
                <div>
                  Shortcuts:{" "}
                  <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs">
                    ←
                  </kbd>{" "}
                  <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs">
                    →
                  </kbd>{" "}
                  <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs">
                    Space
                  </kbd>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
