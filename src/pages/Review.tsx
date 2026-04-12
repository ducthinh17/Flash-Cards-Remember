import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { BrainCircuit, Play, BookOpen, Star, Clock, Brain } from "lucide-react";
import { cn } from "../lib/utils";

type FilterMode = "all" | "hard" | "due";

export default function Review() {
  const { vocabItems, collections } = useStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterMode>("all");

  const weakWords = useMemo(() => {
    let filtered = [...vocabItems];

    if (filter === "hard") {
      filtered = filtered.filter(v => v.isHard);
    } else if (filter === "due") {
      filtered = filtered.filter(v => !v.nextReviewAt || new Date(v.nextReviewAt) <= new Date());
    } else {
      // "all" = weak: never studied OR has wrong answers OR marked hard
      filtered = filtered.filter(
        v => v.wrongCount > 0 || (v.correctCount === 0 && v.wrongCount === 0) || v.isHard
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
  }, [vocabItems, filter]);

  const hardCount = vocabItems.filter(v => v.isHard).length;
  const dueCount = vocabItems.filter(
    v => !v.nextReviewAt || new Date(v.nextReviewAt) <= new Date()
  ).length;

  // Navigate to study/quiz with the current filter encoded in the URL
  const handleStudy = () =>
    navigate(`/study/review?filter=${filter}`);
  const handleQuiz = () =>
    navigate(`/quiz/review?filter=${filter}`);
  const handleActiveRecall = () =>
    navigate(`/active-recall/review?filter=${filter}`);

  const filters: { key: FilterMode; label: string; count: number; icon?: React.ReactNode }[] = [
    { key: "all", label: "All Weak Words", count: 0 },
    { key: "hard", label: "Hard Words", count: hardCount, icon: <Star className="w-4 h-4" /> },
    { key: "due", label: "Due Review", count: dueCount, icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 flex items-center gap-3">
          <BrainCircuit className="w-8 h-8 text-emerald-600" />
          Review Words
        </h1>
        <p className="text-gray-500 mt-2">
          Focus on words you've struggled with, marked as hard, or are due for review.
        </p>
      </header>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap border-b border-gray-200 pb-4">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
              filter === f.key
                ? f.key === "hard"
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : f.key === "due"
                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                  : "bg-gray-900 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            )}
          >
            {f.icon}
            {f.key === "all" ? f.label : `${f.label} (${f.count})`}
          </button>
        ))}
      </div>

      {weakWords.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center max-w-lg mx-auto mt-12">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">You're all caught up!</h2>
          <p className="text-gray-500 mb-6">
            No words found for this filter. Keep studying your collections.
          </p>
          <Link
            to="/collections"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Collections
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary + Actions */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {weakWords.length} word{weakWords.length !== 1 ? "s" : ""} to review
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {filter === "hard"
                    ? "Words you've marked as ⭐ hard."
                    : filter === "due"
                    ? "Words whose review interval has passed."
                    : "Based on your past quiz and study performance."}
                </p>
              </div>

              {/* Study / Quiz / Active Recall buttons — use FILTERED list */}
              <div className="flex gap-3 flex-wrap md:flex-nowrap w-full md:w-auto">
                <button
                  onClick={handleStudy}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  <BookOpen className="w-5 h-5" />
                  Study
                </button>
                <button
                  onClick={handleQuiz}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-900 px-5 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Quiz
                </button>
                <button
                  onClick={handleActiveRecall}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-900 px-5 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  <Brain className="w-5 h-5" />
                  Active Recall
                </button>
              </div>
            </div>
          </div>

          {/* Word list table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Term</th>
                    <th className="px-6 py-4">Meaning</th>
                    <th className="px-6 py-4">Collection</th>
                    <th className="px-6 py-4 text-right">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {weakWords.map(word => {
                    const collection = collections.find(c => c.id === word.collectionId);
                    const total = word.correctCount + word.wrongCount;
                    const accuracy = total === 0 ? 0 : Math.round((word.correctCount / total) * 100);
                    return (
                      <tr key={word.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            {word.isHard && <Star className="w-4 h-4 text-amber-500 fill-current shrink-0" />}
                            <span>{word.term}</span>
                            <span className="text-xs text-gray-400 font-normal px-1.5 py-0.5 bg-gray-100 rounded">
                              {word.type}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{word.meaning}</td>
                        <td className="px-6 py-4 text-gray-500">{collection?.name ?? "—"}</td>
                        <td className="px-6 py-4 text-right">
                          {total === 0 ? (
                            <span className="text-gray-400 text-xs bg-gray-100 px-2 py-0.5 rounded-full">New</span>
                          ) : (
                            <span
                              className={cn(
                                "font-semibold",
                                accuracy < 50 ? "text-red-600" : "text-amber-600"
                              )}
                            >
                              {accuracy}%
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
