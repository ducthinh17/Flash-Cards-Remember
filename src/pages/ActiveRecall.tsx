import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { ArrowLeft, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { VocabItem } from "../types";
import { cn } from "../lib/utils";

export default function ActiveRecall() {
  const { collectionId, lessonTitle } = useParams<{ collectionId: string, lessonTitle?: string }>();
  const navigate = useNavigate();
  const { collections, vocabItems, updateVocabProgress } = useStore();

  const [items, setItems] = useState<VocabItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const collection = collections.find(c => c.id === collectionId);

  useEffect(() => {
    const filtered = vocabItems.filter(v => 
      v.collectionId === collectionId && 
      (!lessonTitle || v.lessonTitle === decodeURIComponent(lessonTitle))
    );
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    setItems(shuffled);
  }, [collectionId, lessonTitle, vocabItems]);

  useEffect(() => {
    if (!isSubmitted && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, isSubmitted]);

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
  const isFinished = currentIndex >= items.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitted || !input.trim()) return;

    const normalizedInput = input.trim().toLowerCase();
    const normalizedAnswer = currentItem.term.trim().toLowerCase();
    
    // Allow small tolerance: ignore punctuation if needed, but simple exact match is safer for language learning.
    const correct = normalizedInput === normalizedAnswer;
    
    setIsCorrect(correct);
    setIsSubmitted(true);
    
    if (correct) {
      setScore(s => s + 1);
    }
    updateVocabProgress(currentItem.id, correct);
  };

  const handleNext = () => {
    setInput("");
    setIsSubmitted(false);
    setIsCorrect(false);
    setCurrentIndex(prev => prev + 1);
  };

  if (isFinished) {
    const percentage = Math.round((score / items.length) * 100);
    return (
      <div className="max-w-md mx-auto text-center py-20 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl font-bold">{percentage}%</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Active Recall Complete!</h2>
        <p className="text-gray-500 mb-8">You typed {score} out of {items.length} correctly.</p>
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => {
              setCurrentIndex(0);
              setScore(0);
              setItems([...items].sort(() => Math.random() - 0.5));
            }}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
          >
            Try Again
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
        <div className="text-sm font-medium text-gray-500">
          Word {currentIndex + 1} of {items.length}
        </div>
      </header>

      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div 
          className="bg-purple-600 h-1.5 rounded-full transition-all duration-300" 
          style={{ width: `${((currentIndex) / items.length) * 100}%` }}
        ></div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center min-h-[200px] flex flex-col justify-center">
        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium mb-4 mx-auto">
          {currentItem.type}
        </span>
        <h2 className="text-3xl md:text-4xl font-medium text-gray-900">{currentItem.meaning}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSubmitted}
            placeholder="Type the English word..."
            className={cn(
              "w-full text-center text-2xl p-6 rounded-2xl border-2 outline-none transition-colors",
              isSubmitted && isCorrect ? "bg-emerald-50 border-emerald-500 text-emerald-900" :
              isSubmitted && !isCorrect ? "bg-red-50 border-red-500 text-red-900" :
              "bg-white border-gray-200 focus:border-purple-500"
            )}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          {isSubmitted && isCorrect && <CheckCircle className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 text-emerald-500" />}
          {isSubmitted && !isCorrect && <XCircle className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 text-red-500" />}
        </div>

        {isSubmitted && !isCorrect && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center animate-in slide-in-from-top-2">
            <p className="text-sm text-blue-600 font-medium mb-1">Correct answer:</p>
            <p className="text-2xl font-bold text-blue-900">{currentItem.term}</p>
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
            Next Word
          </button>
        )}
      </form>
    </div>
  );
}
