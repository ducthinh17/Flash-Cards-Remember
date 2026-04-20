import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { getReviewItems } from "../lib/utils";
import { ArrowLeft, Play, Award, BrainCircuit } from "lucide-react";
import { XPBar, StreakBadge } from "../components/gamification";

export default function DailyFocus() {
  const navigate = useNavigate();
  const { vocabItems, theme } = useStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Aggregate due words and hard words
  const dueItems = getReviewItems(vocabItems, 'due');
  const hardItems = getReviewItems(vocabItems, 'hard');
  const totalItems = Array.from(new Set([...dueItems, ...hardItems].map(i => i.id)));

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#111827] flex flex-col transition-colors duration-300">
      <header className="p-6 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>
        <div className="flex items-center gap-4">
          <StreakBadge className="bg-white dark:bg-gray-800 shadow-sm" showLabel />
          <XPBar compact className="bg-white dark:bg-gray-800 shadow-sm px-4 py-2 rounded-xl" />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 p-10 max-w-lg w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
          
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
            <BrainCircuit className="w-10 h-10" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Daily Focus</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Complete your daily review to maintain your streak and maximize retention.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{dueItems.length}</div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Due Reviews</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{hardItems.length}</div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Hard Words</div>
            </div>
          </div>

          <button
            onClick={() => navigate('/study/review?filter=all')}
            disabled={totalItems.length === 0}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {totalItems.length > 0 ? (
              <>
                <Play className="w-5 h-5 fill-current" />
                Start Focus Session
              </>
            ) : (
              <>
                <Award className="w-5 h-5" />
                All Caught Up!
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
