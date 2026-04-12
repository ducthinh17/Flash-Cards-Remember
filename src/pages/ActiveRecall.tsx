import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../store/useStore";
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Volume2 } from "lucide-react";
import { VocabItem } from "../types";
import { cn, levenshteinDistance } from "../lib/utils";
import { speakTerm } from "../lib/speech";

/** Evaluate answer leniency based on word length */
function checkAnswer(input: string, answer: string): "correct" | "close" | "wrong" {
  const a = input.trim().toLowerCase();
  const b = answer.trim().toLowerCase();
  if (a === b) return "correct";
  const dist = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  // Allow 1 typo for words ≤8 chars, 2 typos for longer
  const tolerance = maxLen <= 8 ? 1 : 2;
  if (dist <= tolerance) return "close";
  return "wrong";
}

export default function ActiveRecall() {
  const { collectionId, lessonTitle } = useParams<{ collectionId: string; lessonTitle?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { collections, vocabItems, updateVocabProgress, recordStudySession } = useStore();
  const filterMode = searchParams.get("filter") ?? "all";

  const [items, setItems] = useState<VocabItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [answerResult, setAnswerResult] = useState<"correct" | "close" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const sessionRecorded = useRef(false);
  const [sessionDone, setSessionDone] = useState(false);

  /** reviewAgainSet: IDs queued for re-review — max once per word */
  const [reviewAgainSet, setReviewAgainSet] = useState<Set<string>>(new Set());
  const [missedWordIds, setMissedWordIds] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const collection = collections.find(c => c.id === collectionId);

  useEffect(() => {
    let filtered: typeof vocabItems = [];
    if (collectionId === 'review') {
      if (filterMode === 'hard') {
        filtered = vocabItems.filter(v => v.isHard);
      } else if (filterMode === 'due') {
        filtered = vocabItems.filter(v => !v.nextReviewAt || new Date(v.nextReviewAt) <= new Date());
      } else {
        filtered = vocabItems.filter(
          v => v.wrongCount > 0 || (v.correctCount === 0 && v.wrongCount === 0) || v.isHard
        );
      }
      filtered = [...filtered]
        .sort((a, b) => {
          if (a.isHard && !b.isHard) return -1;
          if (!a.isHard && b.isHard) return 1;
          const rA = a.wrongCount / (a.correctCount + a.wrongCount || 1);
          const rB = b.wrongCount / (b.correctCount + b.wrongCount || 1);
          return rB - rA;
        })
        .slice(0, 50);
    } else {
      filtered = vocabItems.filter(
        v =>
          v.collectionId === collectionId &&
          (!lessonTitle || v.lessonTitle === decodeURIComponent(lessonTitle))
      );
    }
    setItems([...filtered].sort(() => Math.random() - 0.5));
  }, [collectionId, lessonTitle, filterMode]);

  useEffect(() => {
    if (!isSubmitted && inputRef.current) inputRef.current.focus();
  }, [currentIndex, isSubmitted]);

  const isFinished = currentIndex > 0 && currentIndex >= items.length;

  // ── Session recording — MUST be before any early return (Rules of Hooks) ──
  useEffect(() => {
    if (isFinished && !sessionRecorded.current) {
      sessionRecorded.current = true;
      setSessionDone(true);
      recordStudySession();
    }
  }, [isFinished]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!collection || items.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-900">No vocabulary found</h2>
        <button onClick={() => navigate(-1)} className="text-blue-600 mt-4 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const currentItem = items[currentIndex];
  const isReviewAgainCard = currentItem && reviewAgainSet.has(currentItem.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitted || !input.trim()) return;

    const result = checkAnswer(input, currentItem.term);
    setAnswerResult(result);
    setIsSubmitted(true);

    const isCorrect = result === "correct" || result === "close";

    if (isCorrect) {
      setScore(s => s + 1);
    } else {
      // Play correct pronunciation on wrong answer
      speakTerm(currentItem.term);
    }

    updateVocabProgress(currentItem.id, isCorrect);
  };

  const handleNext = () => {
    const isCorrect = answerResult === "correct" || answerResult === "close";

    if (!isCorrect && !reviewAgainSet.has(currentItem.id)) {
      setReviewAgainSet(prev => new Set(prev).add(currentItem.id));
      setMissedWordIds(prev => [...prev.filter(id => id !== currentItem.id), currentItem.id]);
      setItems(prev => [...prev, { ...currentItem }]);
    } else if (!isCorrect) {
      setMissedWordIds(prev =>
        prev.includes(currentItem.id) ? prev : [...prev, currentItem.id]
      );
    }

    setInput("");
    setIsSubmitted(false);
    setAnswerResult(null);
    setCurrentIndex(prev => prev + 1);
  };

  const handleRestart = () => {
    const filtered = vocabItems.filter(
      v =>
        v.collectionId === collectionId &&
        (!lessonTitle || v.lessonTitle === decodeURIComponent(lessonTitle))
    );
    setItems([...filtered].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setScore(0);
    setInput("");
    setIsSubmitted(false);
    setAnswerResult(null);
    setReviewAgainSet(new Set());
    setMissedWordIds([]);
    setSessionDone(false);
    sessionRecorded.current = false;
  };

  const handleReviewMissed = () => {
    const seen = new Map<string, VocabItem>();
    items.forEach(item => seen.set(item.id, item));
    const unique = missedWordIds
      .map(id => seen.get(id))
      .filter(Boolean)
      .filter((item, idx, arr) => arr.findIndex(x => x!.id === item!.id) === idx) as VocabItem[];
    if (unique.length === 0) return;
    setItems(unique);
    setCurrentIndex(0);
    setScore(0);
    setInput("");
    setIsSubmitted(false);
    setAnswerResult(null);
    setReviewAgainSet(new Set());
    setMissedWordIds([]);
    setSessionDone(false);
    sessionRecorded.current = false;
  };

  // ── Finish Screen ─────────────────────────────────────────────────────────
  if (isFinished) {
    const gotItCount = items.length - missedWordIds.length;
    const reviewCount = missedWordIds.length;
    const percentage = Math.round((gotItCount / items.length) * 100);

    return (
      <div className="max-w-md mx-auto text-center py-20 animate-in fade-in zoom-in duration-500">
        <div
          className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6",
            percentage >= 80
              ? "bg-purple-50 text-purple-600"
              : percentage >= 50
              ? "bg-amber-50 text-amber-600"
              : "bg-red-50 text-red-600"
          )}
        >
          <span className="text-3xl font-bold">{percentage}%</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Active Recall Complete!</h2>

        <div className="flex gap-4 justify-center mb-6">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-5 py-3">
            <p className="text-2xl font-bold text-emerald-700">{gotItCount}</p>
            <p className="text-xs text-emerald-600 mt-0.5">Correct ✓</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-3">
            <p className="text-2xl font-bold text-red-700">{reviewCount}</p>
            <p className="text-xs text-red-600 mt-0.5">Missed ✗</p>
          </div>
        </div>

        <p className="text-gray-500 mb-8">
          You typed {score} out of {items.length} correctly.
        </p>

        <div className="flex flex-col gap-3">
          {reviewCount > 0 && (
            <button
              onClick={handleReviewMissed}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Review {reviewCount} Missed Word{reviewCount > 1 ? "s" : ""}
            </button>
          )}
          <button
            onClick={handleRestart}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
          >
            Try Again (All)
          </button>
          <button
            onClick={() => navigate(`/collections/${collectionId}`)}
            className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Back to Collection
          </button>
        </div>
      </div>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
      <header className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/collections/${collectionId}`)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quit
        </button>
        <div className="flex items-center gap-3">
          {reviewAgainSet.size > 0 && (
            <span className="flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded-full">
              <RotateCcw className="w-3 h-3" />
              {reviewAgainSet.size} to review
            </span>
          )}
          <div className="text-sm font-medium text-gray-500">
            Word {currentIndex + 1} of {items.length}
          </div>
        </div>
      </header>

      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${(currentIndex / items.length) * 100}%` }}
        />
      </div>

      {isReviewAgainCard && (
        <div className="flex items-center justify-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl py-2 animate-in slide-in-from-top-2">
          <RotateCcw className="w-4 h-4" />
          Review card — needs more practice
        </div>
      )}

      <div
        className={cn(
          "rounded-3xl shadow-sm border p-8 text-center min-h-[200px] flex flex-col justify-center",
          isReviewAgainCard ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100"
        )}
      >
        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium mb-4 mx-auto">
          {currentItem.type}
        </span>
        <h2 className="text-3xl md:text-4xl font-medium text-gray-900">{currentItem.meaning}</h2>
        <p className="text-xs text-gray-400 mt-3">Type the corresponding word below</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isSubmitted}
            placeholder="Type the word..."
            className={cn(
              "w-full text-center text-2xl p-6 rounded-2xl border-2 outline-none transition-colors",
              isSubmitted && answerResult === "correct"
                ? "bg-emerald-50 border-emerald-500 text-emerald-900"
                : isSubmitted && answerResult === "close"
                ? "bg-amber-50 border-amber-400 text-amber-900"
                : isSubmitted && answerResult === "wrong"
                ? "bg-red-50 border-red-500 text-red-900"
                : "bg-white border-gray-200 focus:border-purple-500"
            )}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {isSubmitted && answerResult === "correct" && (
            <CheckCircle className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 text-emerald-500" />
          )}
          {isSubmitted && answerResult === "close" && (
            <CheckCircle className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 text-amber-400" />
          )}
          {isSubmitted && answerResult === "wrong" && (
            <XCircle className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 text-red-500" />
          )}
        </div>

        {isSubmitted && answerResult === "close" && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center animate-in slide-in-from-top-2">
            <p className="text-sm text-amber-700 font-medium mb-1">Almost! The correct spelling is:</p>
            <p className="text-2xl font-bold text-amber-900">{currentItem.term}</p>
            <button
              type="button"
              onClick={() => speakTerm(currentItem.term)}
              className="mt-2 text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1 mx-auto"
            >
              <Volume2 className="w-3.5 h-3.5" /> Hear pronunciation
            </button>
          </div>
        )}

        {isSubmitted && answerResult === "wrong" && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center animate-in slide-in-from-top-2">
            <p className="text-sm text-blue-600 font-medium mb-1">Correct answer:</p>
            <p className="text-2xl font-bold text-blue-900">{currentItem.term}</p>
            <button
              type="button"
              onClick={() => speakTerm(currentItem.term)}
              className="mt-2 text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 mx-auto"
            >
              <Volume2 className="w-3.5 h-3.5" /> Hear pronunciation
            </button>
          </div>
        )}

        {!isSubmitted ? (
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-full py-4 bg-purple-600 text-white rounded-2xl font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            Check Answer
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-semibold hover:bg-gray-800 transition-colors shadow-sm"
          >
            Next Word →
          </button>
        )}
      </form>
    </div>
  );
}
