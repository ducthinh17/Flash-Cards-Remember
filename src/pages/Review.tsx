import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { BrainCircuit, Play, BookOpen, Star, Clock } from "lucide-react";

export default function Review() {
  const { vocabItems, collections } = useStore();
  const [filter, setFilter] = useState<'all' | 'hard' | 'due'>('all');

  const weakWords = useMemo(() => {
    let filtered = [...vocabItems];
    
    if (filter === 'hard') {
      filtered = filtered.filter(v => v.isHard);
    } else if (filter === 'due') {
      filtered = filtered.filter(v => !v.nextReviewAt || new Date(v.nextReviewAt) <= new Date());
    } else {
      filtered = filtered.filter(v => v.wrongCount > 0 || (v.correctCount === 0 && v.wrongCount === 0) || v.isHard);
    }

    return filtered
      .sort((a, b) => {
        if (a.isHard && !b.isHard) return -1;
        if (!a.isHard && b.isHard) return 1;
        const ratioA = a.wrongCount / (a.correctCount + a.wrongCount || 1);
        const ratioB = b.wrongCount / (b.correctCount + b.wrongCount || 1);
        return ratioB - ratioA;
      })
      .slice(0, 50); // Top 50 words
  }, [vocabItems, filter]);

  const hardCount = vocabItems.filter(v => v.isHard).length;
  const dueCount = vocabItems.filter(v => !v.nextReviewAt || new Date(v.nextReviewAt) <= new Date()).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 flex items-center gap-3">
          <BrainCircuit className="w-8 h-8 text-emerald-600" />
          Review Words
        </h1>
        <p className="text-gray-500 mt-2">
          Focus on words you've struggled with, marked as hard, or are due for review.
        </p>
      </header>

      <div className="flex gap-2 border-b border-gray-200 pb-4">
        <button 
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
        >
          All Weak Words
        </button>
        <button 
          onClick={() => setFilter('hard')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${filter === 'hard' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
        >
          <Star className="w-4 h-4" />
          Hard Words ({hardCount})
        </button>
        <button 
          onClick={() => setFilter('due')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${filter === 'due' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
        >
          <Clock className="w-4 h-4" />
          Due Review ({dueCount})
        </button>
      </div>

      {weakWords.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center max-w-lg mx-auto mt-12">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">You're all caught up!</h2>
          <p className="text-gray-500 mb-6">No words found for this filter. Keep studying your collections.</p>
          <Link 
            to="/collections"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Collections
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{weakWords.length} words need review</h2>
              <p className="text-sm text-gray-500 mt-1">Based on your past quiz and study performance.</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <Link 
                to="/study/review"
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                Study
              </Link>
              <Link 
                to="/quiz/review"
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-900 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                <Play className="w-5 h-5" />
                Quiz
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Term</th>
                    <th className="px-6 py-4">Meaning</th>
                    <th className="px-6 py-4">Collection</th>
                    <th className="px-6 py-4 text-right">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {weakWords.map(word => {
                    const collection = collections.find(c => c.id === word.collectionId);
                    const total = word.correctCount + word.wrongCount;
                    const accuracy = total === 0 ? 0 : Math.round((word.correctCount / total) * 100);
                    
                    return (
                      <tr key={word.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                          {word.isHard && <Star className="w-4 h-4 text-amber-500 fill-current" />}
                          {word.term}
                          <span className="ml-2 text-xs text-gray-400 font-normal px-1.5 py-0.5 bg-gray-100 rounded">{word.type}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{word.meaning}</td>
                        <td className="px-6 py-4 text-gray-500">{collection?.name || 'Unknown'}</td>
                        <td className="px-6 py-4 text-right">
                          {total === 0 ? (
                            <span className="text-gray-400">New</span>
                          ) : (
                            <span className={accuracy < 50 ? "text-red-600 font-medium" : "text-amber-600 font-medium"}>
                              {accuracy}%
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
