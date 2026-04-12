import { useParams, Link, useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { groupItemsByLesson } from "../lib/parser";
import { ArrowLeft, Play, BrainCircuit, BookOpen } from "lucide-react";

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { collections, vocabItems } = useStore();

  const collection = collections.find(c => c.id === id);
  const collectionItems = vocabItems.filter(v => v.collectionId === id);
  const lessonGroups = groupItemsByLesson(collectionItems);

  if (!collection) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-900">Collection not found</h2>
        <button onClick={() => navigate('/collections')} className="text-blue-600 mt-4 hover:underline">
          Go back to collections
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <button 
          onClick={() => navigate('/collections')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Collections
        </button>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">{collection.name}</h1>
            <p className="text-gray-500 mt-1">
              {lessonGroups.length} lessons • {collectionItems.length} words
            </p>
          </div>
          <div className="flex gap-2">
            <Link 
              to={`/study/${collection.id}`}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Study All
            </Link>
            <Link 
              to={`/quiz/${collection.id}`}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <Play className="w-4 h-4" />
              Quiz All
            </Link>
          </div>
        </div>
      </header>

      {lessonGroups.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center max-w-lg mx-auto mt-12">
          <p className="text-gray-500 mb-6">This collection is empty.</p>
          <Link 
            to="/import"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Add Vocabulary
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lessonGroups.map((group, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">{group.title}</h3>
                <p className="text-sm text-gray-500">{group.total} words</p>
              </div>
              <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-100">
                <Link 
                  to={`/study/${collection.id}/${encodeURIComponent(group.title)}`}
                  className="flex-1 min-w-[80px] flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Study
                </Link>
                <Link 
                  to={`/quiz/${collection.id}/${encodeURIComponent(group.title)}`}
                  className="flex-1 min-w-[80px] flex items-center justify-center gap-2 bg-gray-50 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Quiz
                </Link>
                <Link 
                  to={`/active-recall/${collection.id}/${encodeURIComponent(group.title)}`}
                  className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-purple-50 text-purple-700 py-2 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"
                >
                  <BrainCircuit className="w-4 h-4" />
                  Recall
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
