import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../store/useStore";
import { ArrowLeft, CheckCircle, RotateCcw, Volume2, Lightbulb } from "lucide-react";
import { VocabItem } from "../types";
import { cn } from "../lib/utils";
import { speakTerm } from "../lib/speech";

export default function ActiveRecall() {
  const { collectionId, lessonTitle } = useParams<{ collectionId: string; lessonTitle?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { collections, vocabItems, updateVocabProgress, recordStudySession } = useStore();
  const filterMode = searchParams.get("filter") ?? "all";

  const [items, setItems] = useState<VocabItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  // isMatched = when the input fully correctly matches the target term
  const [isMatched, setIsMatched] = useState(false);
  const [score, setScore] = useState(0);
  const [shake, setShake] = useState(false);

  const sessionRecorded = useRef(false);
  const [sessionDone, setSessionDone] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars

  /** reviewAgainSet: IDs queued for re-review — max once per word */
  const [reviewAgainSet, setReviewAgainSet] = useState<Set<string>>(new Set());
  const [missedWordIds, setMissedWordIds] = useState<string[]>([]);
  const hasUsedHintForCurrent = useRef(false);

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
  }, [collectionId, lessonTitle, filterMode, vocabItems]);

  // Focus and auto-play on word change
  useEffect(() => {
    if (items.length > 0 && currentIndex < items.length) {
      if (inputRef.current) inputRef.current.focus();
      // Reset hint flag for new term
      hasUsedHintForCurrent.current = false;
      // Play audio automatically
      speakTerm(items[currentIndex].term);
    }
  }, [currentIndex, items]);

  const isFinished = currentIndex > 0 && currentIndex >= items.length;

  // Define termAnswer before early return to use in useEffect
  const currentItem = items[currentIndex];
  const termAnswer = currentItem ? currentItem.term : "";

  // Check if what the user typed is perfectly equal to answer
  useEffect(() => { // eslint-disable-next-line react-hooks/exhaustive-deps
    if (termAnswer && input.trim().toLowerCase() === termAnswer.trim().toLowerCase()) {
      setIsMatched(true);
    } else {
      setIsMatched(false);
    }
  }, [input, termAnswer]);

  useEffect(() => {
    if (isFinished && !sessionRecorded.current) {
      sessionRecorded.current = true;
      setSessionDone(true);
      recordStudySession();
    }
  }, [isFinished, recordStudySession]);

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

  // Safe cast since sometimes React effects fire midway
  const isReviewAgainCard = currentItem && reviewAgainSet.has(currentItem?.id);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isMatched) return; // Prevent changing if already matched
    setInput(e.target.value);
  };

  const handleNext = () => {
    // Only proceed if exactly matched
    if (!isMatched) {
      // shake logic
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    const wasCorrectOriginally = !hasUsedHintForCurrent.current;

    if (wasCorrectOriginally) {
       setScore(s => s + 1);
       if (currentItem) updateVocabProgress(currentItem.id, true);
    }

    if (currentItem && !wasCorrectOriginally && !reviewAgainSet.has(currentItem.id)) {
      setReviewAgainSet(prev => new Set(prev).add(currentItem.id));
      setMissedWordIds(prev => [...prev.filter(id => id !== currentItem.id), currentItem.id]);
      setItems(prev => [...prev, { ...currentItem }]);
      updateVocabProgress(currentItem.id, false);
    } else if (currentItem && !wasCorrectOriginally) {
      setMissedWordIds(prev =>
        prev.includes(currentItem.id) ? prev : [...prev, currentItem.id]
      );
      updateVocabProgress(currentItem.id, false);
    }

    // Go next
    setInput("");
    setIsMatched(false);
    setCurrentIndex(prev => prev + 1);
  };

  const handleHint = () => {
    hasUsedHintForCurrent.current = true;
    const answer = currentItem.term;
    
    // Find the first mismatch to correct it, or append if missing
    let nextInput = input;
    let foundMismatch = false;
    for (let i = 0; i < input.length; i++) {
        if (input[i].toLowerCase() !== answer[i]?.toLowerCase()) {
            // Correct the mismatched portion
            nextInput = input.substring(0, i) + answer[i];
            foundMismatch = true;
            break;
        }
    }
    
    if (!foundMismatch && input.length < answer.length) {
        // Just append the next char
        nextInput = input + answer[input.length];
    } else if (!foundMismatch && input.length >= answer.length) {
        // They typed too much? Trim to answer.
        nextInput = answer;
    }

    setInput(nextInput);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMatched) {
      handleNext();
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      if (inputRef.current) inputRef.current.focus();
    }
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
    setIsMatched(false);
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
    setIsMatched(false);
    setReviewAgainSet(new Set());
    setMissedWordIds([]);
    setSessionDone(false);
    sessionRecorded.current = false;
  };

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
          You typed {score} out of {items.length} correctly on first try.
        </p>

        <div className="flex flex-col gap-3">
          {reviewCount > 0 && (
            <button
              type="button"
              onClick={handleReviewMissed}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Review {reviewCount} Missed Word{reviewCount > 1 ? "s" : ""}
            </button>
          )}
          <button
            type="button"
            onClick={handleRestart}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
          >
            Try Again (All)
          </button>
          <button
            type="button"
            onClick={() => navigate(`/collections/${collectionId}`)}
            className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Back to Collection
          </button>
        </div>
      </div>
    );
  }

  // Visual text renderer function
  const renderStyledInput = () => {
    const chars = [];
    for (let i = 0; i < input.length; i++) {
       const inpChar = input[i];
       const ansChar = termAnswer[i];
       if (inpChar.toLowerCase() === ansChar?.toLowerCase()) {
           chars.push(<span key={i} className="text-emerald-500 font-medium">{inpChar}</span>);
       } else {
           chars.push(<span key={i} className="text-red-500 font-medium underline decoration-red-300 underline-offset-4 bg-red-50">{inpChar}</span>);
       }
    }
    return chars;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">
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

      <div className="w-full bg-gray-200 rounded-full h-1.5 shadow-inner">
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
          "rounded-3xl shadow-sm border p-8 text-center min-h-[200px] flex flex-col justify-center relative",
          isReviewAgainCard ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100"
        )}
      >
        <div className="absolute top-4 right-4 pb-2">
           <button 
             type="button"
             onClick={() => currentItem && speakTerm(currentItem.term)}
             className="p-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full transition-colors active:scale-95 shadow-sm"
             aria-label="Hear pronunciation"
           >
              <Volume2 className="w-5 h-5" />
           </button>
        </div>
        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium mb-4 mx-auto mt-2">
          {currentItem?.type}
        </span>
        <h2 className="text-3xl md:text-4xl font-medium text-gray-900 px-4">
          {currentItem?.meaning}
        </h2>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div className="flex gap-2 relative">
          
          <div 
             onClick={() => inputRef.current?.focus()}
             className={cn(
            "relative flex-1 rounded-2xl border-2 transition-colors duration-200 bg-white cursor-text overflow-hidden",
            isMatched ? "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "border-gray-200 focus-within:border-purple-500",
            shake ? "animate-[shake_0.5s_ease-in-out]" : "" // custom inline shake or tailwind animation
          )}>
            
            <style>
            {`
              @keyframes shake {
                0%, 100% { transform: translateX(0); }
                20%, 60% { transform: translateX(-5px); }
                40%, 80% { transform: translateX(5px); }
              }
              .animate-\\[shake_0\\.5s_ease-in-out\\] {
                animation: shake 0.5s ease-in-out;
              }
            `}
            </style>

            {/* Default Invisible Actual Input */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full p-6 sm:py-8 text-2xl opacity-0 cursor-text -z-10 focus:z-10 bg-transparent text-transparent caret-transparent"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              autoCapitalize="none"
              autoFocus
            />

            {/* Visual rendering overlay */}
            <div 
               className="w-full h-full flex items-center justify-center p-6 text-3xl sm:text-4xl pointer-events-none whitespace-pre"
            >
               <div className="flex items-center max-w-full overflow-hidden">
                 {input.length === 0 && (
                    <span className="text-gray-300 font-light text-2xl tracking-wide absolute shrink-0 truncate max-w-full italic px-4">
                      Type the word...
                    </span>
                 )}
                 <div className="font-mono tracking-tighter sm:tracking-tight flex overflow-x-auto no-scrollbar items-center justify-center w-full">
                    {renderStyledInput()}
                 </div>
                 {/* Mock Caret when not matched and input is active focus */}
                 {!isMatched && (
                   <span className="inline-block w-[3px] h-8 sm:h-10 ml-0.5 bg-gray-800 animate-pulse rounded-full opacity-80 shrink-0" />
                 )}
               </div>
            </div>

            {isMatched && (
              <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 text-emerald-500 animate-in zoom-in duration-300" />
            )}
            
          </div>

          {!isMatched && (
            <button
              type="button"
              onClick={handleHint}
              onMouseDown={(e) => e.preventDefault() /* prevent input blur */}
              className="flex items-center justify-center px-4 sm:px-6 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-2xl transition-colors shrink-0 font-medium border-2 border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
              title="Get a hint (Marks word for review)"
            >
              <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 sm:mr-1 mb-0.5" /> <span className="hidden sm:inline">Hint</span>
            </button>
          )}

        </div>

        {isMatched && (
           <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center animate-in slide-in-from-top-2 shadow-sm mt-6">
            <p className="text-sm text-emerald-700 font-medium mb-1">Excellent!</p>
            <p className="text-3xl font-bold text-emerald-900 mb-4">{currentItem.term}</p>
            <button
              type="submit"
              autoFocus
              className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-md text-lg"
            >
              Next Word → (Enter)
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
