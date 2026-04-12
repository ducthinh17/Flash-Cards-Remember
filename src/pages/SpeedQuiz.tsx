import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../store/useStore";
import { ArrowLeft, Zap } from "lucide-react";
import { VocabItem } from "../types";
import { cn } from "../lib/utils";

const TIME_LIMIT = 5; // seconds per question

export default function SpeedQuiz() {
  const { collectionId } = useParams<{ collectionId?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { vocabItems, updateVocabProgress, recordStudySession } = useStore();
  const questionCount = Math.max(5, parseInt(searchParams.get("count") ?? "20", 10));

  const [items, setItems] = useState<VocabItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [isGameOver, setIsGameOver] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    initGame();
  }, [collectionId, vocabItems]);

  const initGame = () => {
    let pool = collectionId 
      ? vocabItems.filter(v => v.collectionId === collectionId)
      : vocabItems;
      
    if (pool.length === 0) return;

    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, questionCount);
    setItems(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setIsGameOver(false);
    setSelectedAnswer(null);
  };

  useEffect(() => {
    if (items.length > 0 && currentIndex < items.length && !isGameOver) {
      generateOptions();
      setTimeLeft(TIME_LIMIT);
      startTimer();
    }
  }, [currentIndex, items, isGameOver]);

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeOut = () => {
    // Timed out = wrong answer — update SRS
    updateVocabProgress(items[currentIndex].id, false);
    setSelectedAnswer("TIMEOUT");
    setTimeout(() => {
      if (currentIndex + 1 >= items.length) {
        setIsGameOver(true);
        recordStudySession();
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    }, 1000);
  };

  const generateOptions = () => {
    const currentItem = items[currentIndex];
    const allMeanings = vocabItems.map(v => v.meaning);
    const wrongOptions = allMeanings
      .filter(m => m !== currentItem.meaning)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    const newOptions = [...wrongOptions, currentItem.meaning].sort(() => Math.random() - 0.5);
    setOptions(newOptions);
    setSelectedAnswer(null);
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;
    clearInterval(timerRef.current);

    setSelectedAnswer(answer);
    const isCorrect = answer === items[currentIndex].meaning;

    if (isCorrect) setScore(s => s + 1);
    updateVocabProgress(items[currentIndex].id, isCorrect);

    setTimeout(() => {
      if (currentIndex + 1 >= items.length) {
        setIsGameOver(true);
        recordStudySession();
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    }, 1000);
  };

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-900">Not enough vocabulary found</h2>
        <button onClick={() => navigate(-1)} className="text-blue-600 mt-4 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  if (isGameOver) {
    return (
      <div className="max-w-md mx-auto text-center py-20 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Zap className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Game Over!</h2>
        <p className="text-gray-500 mb-8">You scored {score} out of {items.length}.</p>
        <div className="flex flex-col gap-3">
          <button 
            onClick={initGame}
            className="w-full py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors"
          >
            Play Again
          </button>
          <button 
            onClick={() => navigate('/games')}
            className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  const currentItem = items[currentIndex];

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
      <header className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/games')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quit
        </button>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-gray-500">
            {currentIndex + 1} / {items.length}
          </div>
          <div className="text-lg font-bold text-amber-600 w-8 text-center">
            {timeLeft}s
          </div>
        </div>
      </header>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={cn(
            "h-2 rounded-full transition-all duration-1000 linear",
            timeLeft > 2 ? "bg-amber-500" : "bg-red-500"
          )}
          style={{ width: `${(timeLeft / TIME_LIMIT) * 100}%` }}
        ></div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center min-h-[200px] flex flex-col justify-center">
        <h2 className="text-4xl font-bold text-gray-900">{currentItem.term}</h2>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {options.map((option, idx) => {
          const isSelected = selectedAnswer === option;
          const isActuallyCorrect = option === currentItem.meaning;
          
          let btnClass = "bg-white border-gray-200 text-gray-700 hover:border-amber-300 hover:bg-amber-50";
          
          if (selectedAnswer) {
            if (isActuallyCorrect) {
              btnClass = "bg-emerald-50 border-emerald-500 text-emerald-700";
            } else if (isSelected) {
              btnClass = "bg-red-50 border-red-500 text-red-700";
            } else {
              btnClass = "bg-gray-50 border-gray-200 text-gray-400 opacity-50";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(option)}
              disabled={!!selectedAnswer}
              className={cn(
                "p-4 rounded-xl border-2 text-left font-medium transition-all duration-200",
                btnClass
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
