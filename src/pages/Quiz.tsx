import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../store/useStore";
import { ArrowLeft, CheckCircle, XCircle, Volume2 } from "lucide-react";
import { VocabItem } from "../types";
import { cn } from "../lib/utils";
import { speakTerm } from "../lib/speech";

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildOptions(current: VocabItem, allItems: VocabItem[]): string[] {
  const correctMeaning = current.meaning;

  // Collect unique wrong meanings
  const uniqueWrong = new Set<string>();
  const pool = shuffle(allItems);
  for (const item of pool) {
    if (item.meaning !== correctMeaning) {
      uniqueWrong.add(item.meaning);
    }
    if (uniqueWrong.size >= 3) break;
  }

  const options = [...uniqueWrong].slice(0, 3);
  options.push(correctMeaning);

  return shuffle(options);
}

export default function Quiz() {
  const { collectionId, lessonTitle } = useParams<{ collectionId: string; lessonTitle?: string }>();
  const navigate   = useNavigate();
  const [searchParams] = useSearchParams();
  const { collections, vocabItems, updateVocabProgress, recordStudySession } = useStore();
  const filterMode = searchParams.get("filter") ?? "all";

  // ── State ──────────────────────────────────────────────────────────────────
  const [items,          setItems]          = useState<VocabItem[]>([]);
  const [currentIndex,   setCurrentIndex]   = useState(0);
  const [options,        setOptions]        = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect,      setIsCorrect]      = useState<boolean | null>(null);
  const [score,          setScore]          = useState(0);

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
    }
  }, [isFinished, recordStudySession]);

  // ── Load / filter items ───────────────────────────────────────────────────
  const initGame = useCallback(() => {
    sessionRecorded.current = false;
    let filtered: typeof vocabItems = [];
    if (collectionId === "review") {
      if (filterMode === "hard") {
        filtered = vocabItems.filter(v => v.isHard);
      } else if (filterMode === "due") {
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
    
    vocabSnapshotRef.current = [...vocabItems]; // Snapshot whole pool for generating options
    
    setItems(shuffle(filtered));
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
      setOptions(buildOptions(currentItem, vocabSnapshotRef.current));
      setSelectedAnswer(null);
      setIsCorrect(null);
    }
  }, [currentIndex, items]);

  // ── Loading / empty guard ─────────────────────────────────────────────────
  const collectionName =
    collectionId === "review"
      ? "Review"
      : collections.find(c => c.id === collectionId)?.name;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-gray-500 text-lg">
          {collectionName ? "No vocabulary found for this filter." : "Collection not found."}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:underline text-sm"
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
        <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl font-bold">{percentage}%</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
        <p className="text-gray-500 mb-8">
          You scored {score} out of {items.length}.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={initGame}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
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
    const correct = answer === currentItem.meaning;
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);
    updateVocabProgress(currentItem.id, correct);
    setTimeout(() => setCurrentIndex(prev => prev + 1), 1500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
      <header className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quit Quiz
        </button>
        <div className="text-sm font-medium text-gray-500">
          Question {currentIndex + 1} of {items.length}
        </div>
      </header>

      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${(currentIndex / items.length) * 100}%` }}
        />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center min-h-[200px] flex flex-col justify-center">
        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium mb-4 mx-auto">
          {currentItem.type}
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{currentItem.term}</h2>
        <button
          onClick={() => speakTerm(currentItem.term)}
          className="mt-4 mx-auto flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-600 transition-colors"
          title="Pronounce"
        >
          <Volume2 className="w-4 h-4" />
          Pronounce
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {options.map((option) => {
          const isSelected        = selectedAnswer === option;
          const isActuallyCorrect = option === currentItem.meaning;
          let btnClass = "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50";
          if (selectedAnswer) {
            if (isActuallyCorrect) {
              btnClass = "bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500 ring-offset-2";
            } else if (isSelected) {
              btnClass = "bg-red-50 border-red-500 text-red-700 ring-2 ring-red-500 ring-offset-2";
            } else {
              btnClass = "bg-gray-50 border-gray-200 text-gray-400 opacity-50";
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
              {selectedAnswer && isActuallyCorrect && <CheckCircle className="w-5 h-5 text-emerald-600" />}
              {selectedAnswer && isSelected && !isActuallyCorrect && <XCircle className="w-5 h-5 text-red-600" />}
            </button>
          );
        })}
      </div>

      {selectedAnswer && (
        <div
          className={cn(
            "text-center p-4 rounded-2xl animate-in slide-in-from-top-2 duration-300",
            isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
          )}
        >
          <p className="text-lg font-bold">{isCorrect ? "Correct!" : "Incorrect"}</p>
          {!isCorrect && (
           <p className="text-sm mt-1">
             Correct answer:{" "}
             <span className="font-bold underline">{currentItem.meaning}</span>
           </p>
          )}
        </div>
      )}
    </div>
  );
}
