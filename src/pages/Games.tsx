import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { useGamificationStore } from "../store/useGamificationStore";
import { Gamepad2, Zap, LayoutGrid, Shield, Settings2, Trophy } from "lucide-react";
import { cn } from "../lib/utils";

// ── Options ───────────────────────────────────────────────────────────────────
const SPEED_COUNTS  = [5, 10,15,20,25,30,35,40,45,50] as const;
const MATCH_PAIRS   = [8, 12, 16, 20,30,40,50,60,70,80,100]   as const;

export default function Games() {
  const { collections, vocabItems } = useStore();
  const { vocabDefenderHighScore } = useGamificationStore();
  const navigate = useNavigate();

  const [selectedCollection, setSelectedCollection] = useState("");
  const [speedCount,  setSpeedCount]  = useState<number>(20);
  const [matchPairs,  setMatchPairs]  = useState<number>(6);

  const hasVocab = vocabItems.length > 0;

  // Available vocab in selected collection
  const availableCount = selectedCollection
    ? vocabItems.filter(v => v.collectionId === selectedCollection).length
    : vocabItems.length;

  const speedUrl = `/games/speed${selectedCollection ? `/${selectedCollection}` : ""}?count=${speedCount}`;
  const matchUrl = `/games/matching${selectedCollection ? `/${selectedCollection}` : ""}?count=${matchPairs}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <Gamepad2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          Mini Games
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Learn vocabulary faster with fun, interactive mini games.
        </p>
      </header>

      {!hasVocab ? (
        <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-12 text-center max-w-lg mx-auto mt-12 transition-colors">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
            <Gamepad2 className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No vocabulary found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Import some vocabulary before playing games.</p>
          <Link
            to="/import"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Add Vocabulary
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── Settings panel ─────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Game Settings</span>
              <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                {availableCount} words available
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Collection */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Collection</label>
                <select
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white transition-colors"
                  value={selectedCollection}
                  onChange={e => setSelectedCollection(e.target.value)}
                >
                  <option value="">All Collections</option>
                  {collections.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Speed Quiz count */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Speed Quiz — Questions
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {SPEED_COUNTS.map(n => (
                    <button
                      key={n}
                      onClick={() => setSpeedCount(n)}
                      disabled={n > availableCount}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                        speedCount === n
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30",
                        n > availableCount && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Matching pairs count */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Matching — Pairs
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {MATCH_PAIRS.map(n => (
                    <button
                      key={n}
                      onClick={() => setMatchPairs(n)}
                      disabled={n > availableCount}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                        matchPairs === n
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30",
                        n > availableCount && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Game cards ─────────────────────────────────────────────────── */}
          {/* Vocab Defender — Featured card (full width) */}
          <div className="bg-gradient-to-br from-indigo-950 via-violet-950 to-indigo-950 dark:from-indigo-950 dark:via-violet-950 dark:to-indigo-950 rounded-3xl border border-indigo-500/30 overflow-hidden flex flex-col md:flex-row hover:shadow-2xl hover:shadow-indigo-500/20 transition-all group relative">
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-violet-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="p-8 flex-1 flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform">
                  🛡️
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold text-white">Vocab Defender</h2>
                    <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold rounded-full">NEW</span>
                  </div>
                  <p className="text-indigo-200/60 text-sm">
                    Type English words to destroy descending monsters. Power-ups, combos, waves — learn under pressure!
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 rounded-full text-xs font-semibold">
                  <Zap className="w-3 h-3" /> Active Recall
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-violet-500/15 border border-violet-500/25 text-violet-300 rounded-full text-xs font-semibold">
                  <Trophy className="w-3 h-3" /> High Score: {vocabDefenderHighScore > 0 ? vocabDefenderHighScore.toLocaleString() : '—'}
                </div>
              </div>
            </div>
            <div className="p-6 flex items-center justify-center border-t md:border-t-0 md:border-l border-indigo-500/20">
              <button
                id="play-vocab-defender"
                onClick={() => navigate('/games/vocab-defender')}
                disabled={!hasVocab}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-8 py-4 rounded-2xl font-bold text-base transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              >
                <Shield className="w-5 h-5" />
                Play Now
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matching Game */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col hover:shadow-md transition-all">
              <div className="p-8 flex-1 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 transform -rotate-6 transition-colors">
                  <LayoutGrid className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Matching</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-3">
                  Match English words with their meanings to clear the board.
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium transition-colors">
                  <LayoutGrid className="w-3.5 h-3.5" />
                  {matchPairs} pairs · {matchPairs * 2} cards
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 transition-colors">
                <button
                  onClick={() => navigate(matchUrl)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Gamepad2 className="w-5 h-5" />
                  Play Matching
                </button>
              </div>
            </div>

            {/* Speed Quiz */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col hover:shadow-md transition-all">
              <div className="p-8 flex-1 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-6 transform rotate-6 transition-colors">
                  <Zap className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Speed Quiz</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-3">
                  Race against the clock! You have 5 seconds per question.
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-sm font-medium transition-colors">
                  <Zap className="w-3.5 h-3.5" />
                  {speedCount} questions · 5s each
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 transition-colors">
                <button
                  onClick={() => navigate(speedUrl)}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600 transition-colors"
                >
                  <Zap className="w-5 h-5" />
                  Play Speed Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
