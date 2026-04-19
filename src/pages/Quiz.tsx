import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../store/useStore";
import { ArrowLeft, CheckCircle, XCircle, Volume2 } from "lucide-react";
import confetti from "canvas-confetti";
import { VocabItem } from "../types";
import { cn, shuffleArray, getReviewItems } from "../lib/utils";
import { speakTerm } from "../lib/speech";
import { useGamificationStore, XP_REWARDS } from "../store/useGamificationStore";
import { XpPopup } from "../components/gamification";

function buildOptions(current: VocabItem, allItems: VocabItem[], isReverse: boolean): string[] {
  const correctOption = isReverse ? current.term : current.meaning;

  // Collect unique wrong answers
  const uniqueWrong = new Set<string>();
  const pool = shuffleArray(allItems);
  for (const item of pool) {
    const wrongOption = isReverse ? item.term : item.meaning;
    if (wrongOption !== correctOption) {
      uniqueWrong.add(wrongOption);
    }
    if (uniqueWrong.size >= 3) break;
  }

  const options = [...uniqueWrong].slice(0, 3);
  options.push(correctOption);

  return shuffleArray(options);
}

export default function Quiz() {
  const { collectionId, lessonTitle } = useParams<{ collectionId: string; lessonTitle?: string }>();
  const navigate   = useNavigate();
  const [searchParams] = useSearchParams();
  const { collections, vocabItems, updateVocabProgress, recordStudySession } = useStore();
  const { addXp, recordCorrectAnswer, recordPerfectRound } = useGamificationStore();
  const filterMode = searchParams.get("filter") ?? "all";

  // ── State ──────────────────────────────────────────────────────────────────
  const [items,          setItems]          = useState<VocabItem[]>([]);
  const [currentIndex,   setCurrentIndex]   = useState(0);
  const [options,        setOptions]        = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect,      setIsCorrect]      = useState<boolean | null>(null);
  const [score,          setScore]          = useState(0);
  const [isReverse,      setIsReverse]      = useState(false);
  const [showXpPopup,    setShowXpPopup]    = useState(false);
  const [xpTick,         setXpTick]         = useState(0);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const vocabSnapshotRef = useRef<VocabItem[]>([]);
  const sessionRecorded = useRef(false);

  // ── Derived ────────────────────────────────────────────────────────────────
  const isFinished = currentIndex > 0 && currentIndex >= items.length;

  // ── Session recording ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isFinished && !sessionRecorded.current) {
      sessionRecorded.current = true;
      recordStudySession();
      // Perfect round bonus
      if (score === items.length && items.length > 0) {
        recordPerfectRound();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    }
  }, [isFinished, recordStudySession, score, items.length, recordPerfectRound]);

  // ── Load / filter items ───────────────────────────────────────────────────
  const initGame = useCallback(() => {
    sessionRecorded.current = false;
    let filtered: typeof vocabItems = [];
    if (collectionId === "review") {
      filtered = getReviewItems(vocabItems, filterMode);
    } else {
      filtered = vocabItems.filter(
        v =>
          v.collectionId === collectionId &&
          (!lessonTitle || v.lessonTitle === decodeURIComponent(lessonTitle))
      );
    }
    
    vocabSnapshotRef.current = [...vocabItems]; // Snapshot whole pool for generating options
    
    setItems(shuffleArray(filtered));
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
  }, [collectionId, lessonTitle, filterMode]); // exclude vocabItems

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { initGame(); }, [collectionId, lessonTitle, filterMode]);

  // ── Setup Current Question ────────────────────────────────────────────────
  useEffect(() => {
    if (items.length > 0 && currentIndex < items.length) {
      const currentItem = items[currentIndex];
      setOptions(buildOptions(currentItem, vocabSnapshotRef.current, isReverse));
      setSelectedAnswer(null);
      setIsCorrect(null);
    }
  }, [currentIndex, items, isReverse]);

  // ── Loading / empty guard ─────────────────────────────────────────────────
  const collectionName =
    collectionId === "review"
      ? "Review"
      : collections.find(c => c.id === collectionId)?.name;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          {collectionName ? "No vocabulary found for this filter." : "Collection not found."}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
        >
          ← Go back
        </button>
      </div>
    );
  }

  // ── Finish screen ─────────────────────────────────────────────────────────
  if (isFinished) {
    const percentage = Math.round((score / items.length) * 100);
    return (
      <div className="max-w-md mx-auto text-center py-20 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl font-bold">{percentage}%</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Quiz Complete!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          You scored {score} out of {items.length}.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={initGame}
            className="w-full py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ── Quiz screen ───────────────────────────────────────────────────────────
  const currentItem = items[currentIndex];

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    const correctOption = isReverse ? currentItem.term : currentItem.meaning;
    const correct = answer === correctOption;
    setIsCorrect(correct);
    if (correct) {
      setScore(s => s + 1);
      addXp(XP_REWARDS.QUIZ_CORRECT);
      recordCorrectAnswer(true);
      setXpTick(k => k + 1);
      setShowXpPopup(true);
    } else {
      recordCorrectAnswer(false);
    }
    updateVocabProgress(currentItem.id, correct);
    setTimeout(() => setCurrentIndex(prev => prev + 1), 1500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
      {showXpPopup && (
        <span key={xpTick}>
          <XpPopup xp={XP_REWARDS.QUIZ_CORRECT} show={showXpPopup} onDone={() => setShowXpPopup(false)} />
        </span>
      )}
      <header className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quit Quiz
        </button>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={isReverse}
                onChange={() => setIsReverse(!isReverse)}
              />
              <div className={`block w-10 h-6 rounded-full transition-colors ${isReverse ? 'bg-purple-500 dark:bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
              <div className={`dot absolute left-1 top-1 w-4 h-4 rounded-full transition-transform ${isReverse ? 'transform translate-x-4 bg-white' : 'bg-white dark:bg-gray-200'}`}></div>
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Reverse</span>
          </label>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Question {currentIndex + 1} of {items.length}
          </div>
        </div>
      </header>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 shadow-inner">
        <div
          className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${(currentIndex / items.length) * 100}%` }}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center min-h-[200px] flex flex-col justify-center transition-colors">
        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium mb-4 mx-auto">
          {currentItem.type}
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          {isReverse ? currentItem.meaning : currentItem.term}
        </h2>
        {!isReverse && (
          <button
            onClick={() => speakTerm(currentItem.term)}
            className="mt-4 mx-auto flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Pronounce"
          >
            <Volume2 className="w-4 h-4" />
            Pronounce
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {options.map((option) => {
          const isSelected        = selectedAnswer === option;
          const isActuallyCorrect = option === (isReverse ? currentItem.term : currentItem.meaning);
          let btnClass = "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30";
          if (selectedAnswer) {
            if (isActuallyCorrect) {
              btnClass = "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-gray-900";
            } else if (isSelected) {
              btnClass = "bg-red-50 dark:bg-red-900/30 border-red-500 dark:border-red-500 text-red-700 dark:text-red-400 ring-2 ring-red-500 ring-offset-2 dark:ring-offset-gray-900";
            } else {
              btnClass = "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 opacity-50";
            }
          }
          return (
            <button
              key={`${currentIndex}-${option}`}
              onClick={() => handleAnswer(option)}
              disabled={!!selectedAnswer}
              className={cn(
                "p-4 rounded-xl border-2 text-left font-medium transition-all duration-200 flex justify-between items-center",
                btnClass
              )}
            >
              <span>{option}</span>
              {selectedAnswer && isActuallyCorrect && <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-500 shrink-0" />}
              {selectedAnswer && isSelected && !isActuallyCorrect && <XCircle className="w-5 h-5 text-red-600 dark:text-red-500 shrink-0" />}
            </button>
          );
        })}
      </div>

      {selectedAnswer && (
        <div
          className={cn(
            "text-center p-4 rounded-2xl animate-in slide-in-from-top-2 duration-300",
            isCorrect ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400" : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
          )}
        >
          <p className="text-lg font-bold">{isCorrect ? "Correct!" : "Incorrect"}</p>
          {!isCorrect && (
           <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">
             Correct answer:{" "}
             <span className="font-bold underline text-gray-900 dark:text-white">{isReverse ? currentItem.term : currentItem.meaning}</span>
           </p>
          )}
        </div>
      )}
    </div>
  );
}
