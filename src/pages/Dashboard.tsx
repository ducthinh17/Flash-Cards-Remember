import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { BookOpen, Layers, PlusCircle, BrainCircuit, Clock, Flame, Target, BarChart2 } from "lucide-react";
import { cn } from "../lib/utils";

export default function Dashboard() {
  const { collections, vocabItems, streak, longestStreak, lastStudiedDate } = useStore();

  const totalCollections = collections.length;
  const totalWords = vocabItems.length;

  const uniqueLessons = new Set(vocabItems.map(v => `${v.collectionId}-${v.lessonTitle}`));
  const totalLessons = uniqueLessons.size;

  const todayISO = new Date().toISOString();

  const dueWords = useMemo(
    () => vocabItems.filter(v => !v.nextReviewAt || new Date(v.nextReviewAt) <= new Date()),
    [vocabItems]
  );

  // Daily plan: due words + new (not yet reviewed) — capped at 20
  const dailyPlan = useMemo(() => {
    const due = vocabItems
      .filter(v => v.nextReviewAt && new Date(v.nextReviewAt) <= new Date())
      .sort((a, b) => new Date(a.nextReviewAt!).getTime() - new Date(b.nextReviewAt!).getTime())
      .slice(0, 15);
    const dueIds = new Set(due.map(v => v.id));
    const newWords = vocabItems
      .filter(v => v.correctCount === 0 && v.wrongCount === 0 && !dueIds.has(v.id))
      .slice(0, 5);
    return [...due, ...newWords];
  }, [vocabItems]);

  const studiedToday = lastStudiedDate
    ? new Date(lastStudiedDate).toDateString() === new Date().toDateString()
    : false;

  const overallAccuracy = useMemo(() => {
    const total = vocabItems.reduce((s, v) => s + v.correctCount + v.wrongCount, 0);
    const correct = vocabItems.reduce((s, v) => s + v.correctCount, 0);
    return total === 0 ? 0 : Math.round((correct / total) * 100);
  }, [vocabItems]);

  const recentCollections = [...collections]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back. Here's your learning overview.</p>
        </div>

        {/* Streak Badge */}
        <div className={cn(
          "flex items-center gap-3 px-5 py-3 rounded-2xl border",
          studiedToday
            ? "bg-amber-50 border-amber-200"
            : "bg-white border-gray-200"
        )}>
          <Flame className={cn("w-6 h-6", studiedToday ? "text-amber-500" : "text-gray-300")} />
          <div>
            <p className="text-xl font-bold text-gray-900">{streak} day{streak !== 1 ? "s" : ""}</p>
            <p className="text-xs text-gray-500">
              {studiedToday ? "Studied today ✓" : "Study today to keep your streak!"}
              {longestStreak > 0 && ` · Best: ${longestStreak}`}
            </p>
          </div>
        </div>
      </header>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Accuracy</p>
            <p className="text-2xl font-semibold text-gray-900">{overallAccuracy}%</p>
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

      {/* Daily Plan */}
      {dailyPlan.length > 0 && (
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Today's Study Plan</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {dailyPlan.length} word{dailyPlan.length !== 1 ? "s" : ""} recommended for today
              </p>
            </div>
            <Link
              to="/review"
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm"
            >
              <BrainCircuit className="w-4 h-4" />
              Start Review
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {dailyPlan.slice(0, 12).map(v => (
              <span
                key={v.id}
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium border",
                  v.correctCount === 0 && v.wrongCount === 0
                    ? "bg-gray-50 text-gray-700 border-gray-200"
                    : "bg-blue-50 text-blue-700 border-blue-100"
                )}
              >
                {v.term}
              </span>
            ))}
            {dailyPlan.length > 12 && (
              <span className="px-3 py-1 rounded-full text-sm text-gray-400 border border-dashed border-gray-200">
                +{dailyPlan.length - 12} more
              </span>
            )}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Recent Collections */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Collections</h2>
            <Link to="/collections" className="text-sm text-blue-600 font-medium hover:underline">
              View all
            </Link>
          </div>
          {recentCollections.length > 0 ? (
            <div className="space-y-3">
              {recentCollections.map(collection => {
                const wordsInCollection = vocabItems.filter(v => v.collectionId === collection.id).length;
                const reviewed = vocabItems.filter(
                  v => v.collectionId === collection.id && v.correctCount + v.wrongCount > 0
                ).length;
                return (
                  <Link
                    key={collection.id}
                    to={`/collections/${collection.id}`}
                    className="block bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
                  >
                    <h3 className="font-medium text-gray-900">{collection.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {wordsInCollection} words · {reviewed} reviewed
                    </p>
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

        {/* Quick Actions */}
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
              {dueWords.length > 0 && (
                <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {dueWords.length} due
                </span>
              )}
            </Link>
            <Link
              to="/stats"
              className="flex items-center gap-3 bg-white text-gray-900 p-4 rounded-xl shadow-sm border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <BarChart2 className="w-5 h-5 text-purple-600" />
              <span className="font-medium">View Progress & Stats</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
