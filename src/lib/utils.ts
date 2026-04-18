import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Levenshtein edit distance between two strings */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/** Check if a date string is today */
export function isToday(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/** Check if a date string was yesterday */
export function isYesterday(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  );
}

/** Format seconds as mm:ss */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Fisher-Yates shuffle array */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

import type { VocabItem } from "../types";

/** Extract common review filter logic shared between Study, Quiz, and ActiveRecall */
export function getReviewItems(vocabItems: VocabItem[], filterMode: string): VocabItem[] {
  let filtered = [...vocabItems];
  if (filterMode === "hard") {
    filtered = filtered.filter((v) => v.isHard);
  } else if (filterMode === "due") {
    filtered = filtered.filter(
      (v) => !v.nextReviewAt || new Date(v.nextReviewAt) <= new Date()
    );
  } else {
    filtered = filtered.filter(
      (v) => v.wrongCount > 0 || (v.correctCount === 0 && v.wrongCount === 0) || v.isHard
    );
  }
  return filtered
    .sort((a, b) => {
      if (a.isHard && !b.isHard) return -1;
      if (!a.isHard && b.isHard) return 1;
      const ratioA = a.wrongCount / (a.correctCount + a.wrongCount || 1);
      const ratioB = b.wrongCount / (b.correctCount + b.wrongCount || 1);
      return ratioB - ratioA;
    })
    .slice(0, 50);
}
