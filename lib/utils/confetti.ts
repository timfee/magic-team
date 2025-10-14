"use client";

import confetti from "canvas-confetti";

export function celebrateStageComplete() {
  const duration = 3000;
  const animationEnd = Date.now() + duration;

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    void confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#3b82f6", "#8b5cf6", "#ec4899"],
    });

    void confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#3b82f6", "#8b5cf6", "#ec4899"],
    });
  }, 50);
}

export function celebrateSessionComplete() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    colors: ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"],
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    void confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, { spread: 26, startVelocity: 55 });

  fire(0.2, { spread: 60 });

  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });

  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });

  fire(0.1, { spread: 120, startVelocity: 45 });
}

export function celebrateVotingComplete() {
  void confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#ef4444", "#f87171", "#fca5a5"],
  });
}
