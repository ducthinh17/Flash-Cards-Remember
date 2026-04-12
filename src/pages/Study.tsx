import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { speakEnglish, stopSpeaking, speakMultipleTimes } from "../lib/speech";
import { ArrowLeft, Volume2, CheckCircle, XCircle, Star, Repeat } from "lucide-react";
import { cn } from "../lib/utils";

export default function Study() {
  const { collectionId, lessonTitle } = useParams<{ collectionId: string, lessonTitle?: string }>();
  const navigate = useNavigate();
  const { collections, vocabItems, updateVocabProgress, toggleHardWord } = useStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [items, setItems] = useState(() => {
    if (collectionId === 'review') {
      return [...vocabItems]
        .filter(v => v.wrongCount > 0 || (v.correctCount === 0 && v.wrongCount === 0) || v.isHard)
        .sort((a, b) => {
          if (a.isHard && !b.isHard) return -1;
          if (!a.isHard && b.isHard) return 1;
          const ratioA = a.wrongCount / (a.correctCount + a.wrongCount || 1);
          const ratioB = b.wrongCount / (b.correctCount + b.wrongCount || 1);
          return ratioB - ratioA;
        })
        .slice(0, 50);
    }
    return vocabItems.filter(v => 
      v.collectionId === collectionId && 
      (!lessonTitle || v.lessonTitle === decodeURIComponent(lessonTitle))
    );
  });

  const collectionName = collectionId === 'review' ? 'Review Weak Words' : collections.find(c => c.id === collectionId)?.name;

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  if (!collectionName || items.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-900">No vocabulary found to study</h2>
        <button onClick={() => navigate(-1)} className="text-blue-600 mt-4 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const currentItem = items[currentIndex];
  const isFinished = currentIndex >= items.length;

  const handleNext = (known: boolean) => {
    updateVocabProgress(currentItem.id, known);
    setIsFlipped(false);
    setCurrentIndex(prev => prev + 1);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  if (isFinished) {
    return (
      <div className="max-w-md mx-auto text-center py-20 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Great job!</h2>
        <p className="text-gray-500 mb-8">You've reviewed all {items.length} words in this session.</p>
        <div className="flex flex-col gap-3">
          <button 
            onClick={handleRestart}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Study Again
          </button>
          <button 
            onClick={() => navigate(collectionId === 'review' ? '/review' : `/collections/${collectionId}`)}
            className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Back to Collection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <header className="flex items-center justify-between">
        <button 
          onClick={() => navigate(collectionId === 'review' ? '/review' : `/collections/${collectionId}`)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="text-sm font-medium text-gray-500">
          {currentIndex + 1} / {items.length}
        </div>
      </header>

      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-8">
        <div 
          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
          style={{ width: `${((currentIndex) / items.length) * 100}%` }}
        ></div>
      </div>

      {/* Flashcard */}
      <div 
        className="relative w-full aspect-[4/3] md:aspect-[16/9] perspective-1000 cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={cn(
          "w-full h-full transition-all duration-500 preserve-3d relative",
          isFlipped ? "rotate-y-180" : ""
        )}>
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center p-8 text-center group-hover:shadow-md transition-shadow">
            <div className="absolute top-6 right-6 flex gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); speakMultipleTimes(currentItem.term, 3, 1000); }}
                className="p-3 rounded-full text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                title="Repeat Listening (3x)"
              >
                <Repeat className="w-6 h-6" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); speakEnglish(currentItem.term); }}
                className="p-3 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="Play Pronunciation"
              >
                <Volume2 className="w-6 h-6" />
              </button>
            </div>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                toggleHardWord(currentItem.id);
                // Update local state to reflect immediately
                setItems(items.map(item => item.id === currentItem.id ? { ...item, isHard: !item.isHard } : item));
              }}
              className={cn(
                "absolute top-6 left-6 p-3 rounded-full transition-colors",
                currentItem.isHard ? "text-amber-500 bg-amber-50" : "text-gray-300 hover:text-amber-500 hover:bg-amber-50"
              )}
              title={currentItem.isHard ? "Remove from Hard Words" : "Mark as Hard"}
            >
              <Star className={cn("w-6 h-6", currentItem.isHard && "fill-current")} />
            </button>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{currentItem.term}</h2>
            <p className="text-sm text-gray-400 uppercase tracking-widest">Tap to flip</p>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center p-8 text-center">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6">
              {currentItem.type}
            </span>
            <h2 className="text-3xl md:text-4xl font-medium text-gray-900 mb-4">{currentItem.meaning}</h2>
            <div className="text-sm text-gray-400 mt-4">
              Lesson: {currentItem.lessonTitle}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={cn(
        "flex gap-4 transition-all duration-300",
        isFlipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        <button 
          onClick={() => handleNext(false)}
          className="flex-1 flex items-center justify-center gap-2 py-4 bg-white border-2 border-red-100 text-red-600 rounded-2xl font-semibold hover:bg-red-50 hover:border-red-200 transition-colors"
        >
          <XCircle className="w-5 h-5" />
          Review Again
        </button>
        <button 
          onClick={() => handleNext(true)}
          className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <CheckCircle className="w-5 h-5" />
          Got It
        </button>
      </div>
    </div>
  );
}
