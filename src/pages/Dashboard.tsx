import { Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { BookOpen, Layers, PlusCircle, BrainCircuit, Clock } from "lucide-react";

export default function Dashboard() {
  const { collections, vocabItems } = useStore();

  const totalCollections = collections.length;
  const totalWords = vocabItems.length;
  
  // Calculate total lessons
  const uniqueLessons = new Set(vocabItems.map(v => `${v.collectionId}-${v.lessonTitle}`));
  const totalLessons = uniqueLessons.size;

  const dueWords = vocabItems.filter(v => !v.nextReviewAt || new Date(v.nextReviewAt) <= new Date());

  const recentCollections = [...collections]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back. Here's your learning overview.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Collections</p>
            <p className="text-2xl font-semibold text-gray-900">{totalCollections}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Lessons</p>
            <p className="text-2xl font-semibold text-gray-900">{totalLessons}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Words</p>
            <p className="text-2xl font-semibold text-gray-900">{totalWords}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Due Review</p>
            <p className="text-2xl font-semibold text-amber-600">{dueWords.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Collections</h2>
            <Link to="/collections" className="text-sm text-blue-600 font-medium hover:underline">View all</Link>
          </div>
          {recentCollections.length > 0 ? (
            <div className="space-y-3">
              {recentCollections.map(collection => {
                const wordsInCollection = vocabItems.filter(v => v.collectionId === collection.id).length;
                return (
                  <Link 
                    key={collection.id} 
                    to={`/collections/${collection.id}`}
                    className="block bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
                  >
                    <h3 className="font-medium text-gray-900">{collection.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{wordsInCollection} words</p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-8 text-center">
              <p className="text-gray-500 text-sm">No collections yet.</p>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link 
              to="/import"
              className="flex items-center gap-3 bg-blue-600 text-white p-4 rounded-xl shadow-sm hover:bg-blue-700 transition-colors"
            >
              <PlusCircle className="w-5 h-5" />
              <span className="font-medium">Add New Vocabulary</span>
            </Link>
            <Link 
              to="/review"
              className="flex items-center gap-3 bg-white text-gray-900 p-4 rounded-xl shadow-sm border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <BrainCircuit className="w-5 h-5 text-emerald-600" />
              <span className="font-medium">Review Weak Words</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
