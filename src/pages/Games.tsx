import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { Gamepad2, Zap, LayoutGrid } from "lucide-react";

export default function Games() {
  const { collections, vocabItems } = useStore();
  const [selectedCollection, setSelectedCollection] = useState<string>("");

  const hasVocab = vocabItems.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 flex items-center gap-3">
          <Gamepad2 className="w-8 h-8 text-indigo-600" />
          Mini Games
        </h1>
        <p className="text-gray-500 mt-2">
          Learn vocabulary faster with fun, interactive mini games.
        </p>
      </header>

      {!hasVocab ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center max-w-lg mx-auto mt-12">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gamepad2 className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">No vocabulary found</h2>
          <p className="text-gray-500 mb-6">You need to import some vocabulary before you can play games.</p>
          <Link 
            to="/import"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Add Vocabulary
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Collection to Play</label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
            >
              <option value="">All Collections</option>
              {collections.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matching Game Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="p-8 flex-1 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 transform -rotate-6">
                  <LayoutGrid className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Matching</h2>
                <p className="text-gray-500 mb-6">Match English words with their Vietnamese meanings to clear the board.</p>
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <Link 
                  to={`/games/matching${selectedCollection ? `/${selectedCollection}` : ''}`}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Gamepad2 className="w-5 h-5" />
                  Play Matching
                </Link>
              </div>
            </div>

            {/* Speed Quiz Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="p-8 flex-1 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 transform rotate-6">
                  <Zap className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Speed Quiz</h2>
                <p className="text-gray-500 mb-6">Race against the clock! You have 5 seconds per question.</p>
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <Link 
                  to={`/games/speed${selectedCollection ? `/${selectedCollection}` : ''}`}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600 transition-colors"
                >
                  <Zap className="w-5 h-5" />
                  Play Speed Quiz
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
