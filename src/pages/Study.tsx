import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../store/useStore";
import { speakTerm, speakTermMultipleTimes, stopSpeaking, isChinese } from "../lib/speech";
import { ArrowLeft, Volume2, CheckCircle, XCircle, Star, Repeat, RotateCcw, Keyboard } from "lucide-react";
import confetti from "canvas-confetti";
import { cn, getReviewItems } from "../lib/utils";
import { VocabItem } from "../types";
import { useGamificationStore, XP_REWARDS } from "../store/useGamificationStore";
import { XpPopup } from "../components/gamification";


function ChineseHint({ text }: { text: string }) {
  if (!isChinese(text)) return null;
  return (
    <p className="text-xs text-blue-400 mt-1">
      🔊 Click the speaker to hear Chinese pronunciation
    </p>
  );
}

export default function Study() {
  const { collectionId, lessonTitle } = useParams<{ collectionId: string; lessonTitle?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { collections, vocabItems, updateVocabProgressWithRating, toggleHardWord, recordStudySession } = useStore();
  const { addXp, recordCorrectAnswer, recordPerfectRound } = useGamificationStore();

  const filterMode = searchParams.get("filter") ?? "all"; // "all" | "hard" | "due"

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showXpPopup, setShowXpPopup] = useState(false);
  const [xpTick, setXpTick] = useState(0);

  const [items, setItems] = useState<VocabItem[]>(() => {
    if (collectionId === "review") {
      return getReviewItems(vocabItems, filterMode);
    }
    return vocabItems.filter(
      v =>
        v.collectionId === collectionId &&
        (!lessonTitle || v.lessonTitle === decodeURIComponent(lessonTitle))
    );
  });


  /** reviewAgainSet: IDs queued for re-review — max once per word */
  const [reviewAgainSet, setReviewAgainSet] = useState<Set<string>>(new Set());
  const [missedWordIds, setMissedWordIds] = useState<string[]>([]);
  const sessionRecorded = useRef(false);
  const [sessionDone, setSessionDone] = useState(false);

  const collectionName =
    collectionId === "review"
      ? "Review Weak Words"
      : collections.find(c => c.id === collectionId)?.name;

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  const handleRate = useCallback((rating: 'again' | 'hard' | 'good' | 'easy') => {
    const currentItem = items[currentIndex];
    if (!currentItem || currentIndex >= items.length) return;
    
    updateVocabProgressWithRating(currentItem.id, rating);
    const isCorrect = rating !== 'again';
    recordCorrectAnswer(isCorrect);
    
    if (isCorrect) {
      addXp(XP_REWARDS.STUDY_CARD);
      setXpTick(k => k + 1);
      setShowXpPopup(true);
    }
    
    setIsFlipped(false);
    
    if (rating === 'again' || rating === 'hard') {
      if (!reviewAgainSet.has(currentItem.id)) {
        setReviewAgainSet(prev => new Set(prev).add(currentItem.id));
        setMissedWordIds(prev => [
          ...prev.filter(id => id !== currentItem.id),
          currentItem.id,
        ]);
        setItems(prev => [...prev, { ...currentItem }]);
      } else {
        setMissedWordIds(prev =>
          prev.includes(currentItem.id) ? prev : [...prev, currentItem.id]
        );
      }
    }
    
    setCurrentIndex(prev => prev + 1);
  }, [currentIndex, items, reviewAgainSet, updateVocabProgressWithRating, addXp, recordCorrectAnswer]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (currentIndex >= items.length) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          setIsFlipped(f => !f);
          break;
        case "1":
          if (isFlipped) handleRate('again');
          break;
        case "2":
          if (isFlipped) handleRate('hard');
          break;
        case "3":
          if (isFlipped) handleRate('good');
          break;
        case "4":
          if (isFlipped) handleRate('easy');
          break;
        case "s":
        case "S":
          speakTerm(items[currentIndex]?.term ?? "");
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isFlipped, currentIndex, items, handleRate]);

  const isFinished = currentIndex > 0 && currentIndex >= items.length;

  // ── Session recording — MUST be before any early return (Rules of Hooks) ──
  useEffect(() => {
    if (isFinished && !sessionRecorded.current) {
      sessionRecorded.current = true;
      setSessionDone(true);
      recordStudySession();
      
      const percentage = items.length > 0 ? Math.round(((items.length - missedWordIds.length) / items.length) * 100) : 0;
      if (percentage >= 80 && items.length > 0) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
      // Perfect round bonus
      if (missedWordIds.length === 0 && items.length > 0) {
        recordPerfectRound();
      }
    }
  }, [isFinished]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!collectionName || items.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">No vocabulary found to study</h2>
        <button onClick={() => navigate(-1)} className="text-blue-600 dark:text-blue-400 mt-4 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const currentItem = items[currentIndex];

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setReviewAgainSet(new Set());
    setMissedWordIds([]);
    setSessionDone(false);
    sessionRecorded.current = false;
  };

  const handleReviewMissed = () => {
    const missed = missedWordIds
      .map(id => {
        const seen = new Map<string, VocabItem>();
        items.forEach(item => seen.set(item.id, item));
        return seen.get(id);
      })
      .filter(Boolean) as VocabItem[];
    const unique = missed.filter((item, idx, arr) => arr.findIndex(x => x.id === item.id) === idx);
    if (unique.length === 0) return;
    setItems(unique);
    setCurrentIndex(0);
    setIsFlipped(false);
    setReviewAgainSet(new Set());
    setMissedWordIds([]);
    setSessionDone(false);
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
            "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6",
            percentage >= 80
              ? "bg-emerald-100 text-emerald-600"
              : percentage >= 50
              ? "bg-amber-100 text-amber-600"
              : "bg-red-100 text-red-600"
          )}
        >
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Session Complete!</h2>

        <div className="flex gap-4 justify-center mb-6">
          <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-xl px-5 py-3">
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{gotItCount}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">Got It ✓</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-xl px-5 py-3">
            <p className="text-2xl font-bold text-red-700 dark:text-red-400">{reviewCount}</p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">Review Again ✗</p>
          </div>
        </div>

        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Accuracy:{" "}
          <span className="font-semibold text-gray-900 dark:text-white">{percentage}%</span> across{" "}
          {items.length} flashcards shown.
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
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Study All Again
          </button>
          <button
            onClick={() =>
              navigate(
                collectionId === "review" ? "/review" : `/collections/${collectionId}`
              )
            }
            className="w-full py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Back to Collection
          </button>
        </div>
      </div>
    );
  }

  const isReviewAgainCard = reviewAgainSet.has(currentItem.id);

  // ── Main Study UI ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* XP popup — re-mounts on each correct answer via xpTick */}
      {showXpPopup && (
        <span key={xpTick}>
          <XpPopup xp={XP_REWARDS.STUDY_CARD} show={showXpPopup} onDone={() => setShowXpPopup(false)} />
        </span>
      )}
      <header className="flex items-center justify-between">
        <button
          onClick={() =>
            navigate(
              collectionId === "review" ? "/review" : `/collections/${collectionId}`
            )
          }
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-3">
          {reviewAgainSet.size > 0 && (
            <span className="flex items-center gap-1 text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800 px-2.5 py-1 rounded-full font-medium">
              <RotateCcw className="w-3 h-3" />
              {reviewAgainSet.size} to review
            </span>
          )}
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {currentIndex + 1} / {items.length}
          </div>
        </div>
      </header>

      {/* Keyboard hint */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
        <Keyboard className="w-3.5 h-3.5" />
        <span>Space = flip &nbsp;·&nbsp; 1=Again, 2=Hard, 3=Good, 4=Easy &nbsp;·&nbsp; S = speak</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div
          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${(currentIndex / items.length) * 100}%` }}
        />
      </div>

      {/* Review Again badge */}
      {isReviewAgainCard && (
        <div className="flex items-center justify-center gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 rounded-xl py-2 animate-in slide-in-from-top-2">
          <RotateCcw className="w-4 h-4" />
          Review card — needs more practice
        </div>
      )}

      {/* Flashcard */}
      <div
        className="relative w-full aspect-[4/3] md:aspect-[16/9] perspective-1000 cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={cn(
            "w-full h-full transition-all duration-500 preserve-3d relative",
            isFlipped ? "rotate-y-180" : ""
          )}
        >
          {/* Front */}
          <div
            className={cn(
              "absolute inset-0 backface-hidden rounded-3xl shadow-sm border flex flex-col items-center justify-center p-8 text-center group-hover:shadow-md transition-shadow",
              isReviewAgainCard ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800" : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700"
            )}
          >
            <div className="absolute top-6 right-6 flex gap-2">
              <button
                onClick={e => {
                  e.stopPropagation();
                  speakTermMultipleTimes(currentItem.term, 3, 1000);
                }}
                className="p-3 rounded-full text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                title="Repeat 3x"
              >
                <Repeat className="w-6 h-6" />
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  speakTerm(currentItem.term);
                }}
                className="p-3 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="Pronounce (S)"
              >
                <Volume2 className="w-6 h-6" />
              </button>
            </div>

            <button
              onClick={e => {
                e.stopPropagation();
                toggleHardWord(currentItem.id);
                setItems(items.map(item =>
                  item.id === currentItem.id ? { ...item, isHard: !item.isHard } : item
                ));
              }}
              className={cn(
                "absolute top-6 left-6 p-3 rounded-full transition-colors",
                currentItem.isHard
                  ? "text-amber-500 bg-amber-50"
                  : "text-gray-300 hover:text-amber-500 hover:bg-amber-50"
              )}
              title={currentItem.isHard ? "Remove from Hard Words" : "Mark as Hard"}
            >
              <Star className={cn("w-6 h-6", currentItem.isHard && "fill-current")} />
            </button>

            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3">
              {currentItem.term}
            </h2>
            <ChineseHint text={currentItem.term} />
            <p className="text-sm text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-4">
              Space to flip
            </p>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center p-8 text-center">
            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium mb-6">
              {currentItem.type}
            </span>
            <h2 className="text-3xl md:text-4xl font-medium text-gray-900 dark:text-white mb-4">
              {currentItem.meaning}
            </h2>
            {currentItem.example && (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic border-t border-gray-100 dark:border-gray-700 pt-4 mt-2 max-w-sm">
                "{currentItem.example}"
              </p>
            )}
            <div className="text-sm text-gray-400 dark:text-gray-500 mt-4">Lesson: {currentItem.lessonTitle}</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div
        className={cn(
          "grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 transition-all duration-300",
          isFlipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <button onClick={() => handleRate('again')} className="py-3 border-2 border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 rounded-2xl font-semibold hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
          <div className="text-sm">Again</div>
          <div className="text-xs font-normal opacity-70">1</div>
        </button>
        <button onClick={() => handleRate('hard')} className="py-3 border-2 border-amber-100 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 bg-white dark:bg-gray-800 rounded-2xl font-semibold hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors">
          <div className="text-sm">Hard</div>
          <div className="text-xs font-normal opacity-70">2</div>
        </button>
        <button onClick={() => handleRate('good')} className="py-3 border-2 border-blue-100 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 rounded-2xl font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
          <div className="text-sm">Good</div>
          <div className="text-xs font-normal opacity-70">3</div>
        </button>
        <button onClick={() => handleRate('easy')} className="py-3 border-2 border-emerald-100 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-gray-800 rounded-2xl font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors">
          <div className="text-sm">Easy</div>
          <div className="text-xs font-normal opacity-70">4</div>
        </button>
      </div>
    </div>
  );
}
