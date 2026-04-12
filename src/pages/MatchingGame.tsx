import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../store/useStore";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { speakTerm } from "../lib/speech";

type Card = {
  id: string;
  text: string;
  type: 'term' | 'meaning';
  matchId: string;
  isMatched: boolean;
  isSelected: boolean;
};

export default function MatchingGame() {
  const { collectionId } = useParams<{ collectionId?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { vocabItems, updateVocabProgress, recordStudySession } = useStore();
  const pairCount = Math.max(4, parseInt(searchParams.get("count") ?? "6", 10));

  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [isWon, setIsWon] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    initGame();
  }, [collectionId, vocabItems]);

  useEffect(() => {
    let interval: any;
    if (startTime && !isWon) {
      interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime, isWon]);

  const initGame = () => {
    let pool = collectionId 
      ? vocabItems.filter(v => v.collectionId === collectionId)
      : vocabItems;
      
    if (pool.length === 0) return;

    // Pick N random pairs
    const selectedItems = [...pool].sort(() => Math.random() - 0.5).slice(0, pairCount);
    
    const newCards: Card[] = [];
    selectedItems.forEach(item => {
      newCards.push({
        id: `term-${item.id}`,
        text: item.term,
        type: 'term',
        matchId: item.id,
        isMatched: false,
        isSelected: false,
      });
      newCards.push({
        id: `meaning-${item.id}`,
        text: item.meaning,
        type: 'meaning',
        matchId: item.id,
        isMatched: false,
        isSelected: false,
      });
    });

    setCards(newCards.sort(() => Math.random() - 0.5));
    setSelectedCards([]);
    setIsWon(false);
    setMistakes(0);
    setStartTime(Date.now());
    setTimeElapsed(0);
  };

  const handleCardClick = (card: Card) => {
    if (card.isMatched || card.isSelected || selectedCards.length >= 2) return;

    const newSelected = [...selectedCards, card];
    
    setCards(cards.map(c => c.id === card.id ? { ...c, isSelected: true } : c));
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      const [first, second] = newSelected;

      if (first.matchId === second.matchId && first.type !== second.type) {
        // Correct match — update SRS progress and speak the term
        updateVocabProgress(first.matchId, true);
        const matched = vocabItems.find(v => v.id === first.matchId);
        if (matched) speakTerm(matched.term);

        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.matchId === first.matchId ? { ...c, isMatched: true, isSelected: false } : c
          ));
          setSelectedCards([]);
        }, 500);
      } else {
        // Wrong match
        setMistakes(m => m + 1);
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === first.id || c.id === second.id ? { ...c, isSelected: false } : c
          ));
          setSelectedCards([]);
        }, 800);
      }
    }
  };

  useEffect(() => {
    if (cards.length > 0 && cards.every(c => c.isMatched)) {
      setIsWon(true);
      recordStudySession();
    }
  }, [cards]);

  if (cards.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-900">Not enough vocabulary found</h2>
        <button onClick={() => navigate(-1)} className="text-blue-600 mt-4 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  if (isWon) {
    return (
      <div className="max-w-md mx-auto text-center py-20 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">You Won! 🎉</h2>
        <div className="flex gap-4 justify-center mb-6">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-5 py-3">
            <p className="text-2xl font-bold text-emerald-700">{timeElapsed}s</p>
            <p className="text-xs text-emerald-600 mt-0.5">Time</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-3">
            <p className="text-2xl font-bold text-red-700">{mistakes}</p>
            <p className="text-xs text-red-600 mt-0.5">Mistakes</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <button 
            onClick={initGame}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <header className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/games')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quit Game
        </button>
        <div className="text-lg font-mono font-medium text-gray-600 bg-white px-4 py-1 rounded-full shadow-sm border border-gray-100">
          {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card)}
            disabled={card.isMatched}
            className={cn(
              "aspect-[3/2] p-4 rounded-2xl border-2 font-medium text-center transition-all duration-300 flex items-center justify-center text-sm md:text-base",
              card.isMatched ? "bg-emerald-50 border-emerald-200 text-emerald-700 opacity-50 scale-95" :
              card.isSelected ? "bg-blue-50 border-blue-500 text-blue-700 scale-105 shadow-md" :
              "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-sm"
            )}
          >
            {card.text}
          </button>
        ))}
      </div>
    </div>
  );
}
