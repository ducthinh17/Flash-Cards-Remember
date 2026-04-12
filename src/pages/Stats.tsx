import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import {
  BarChart2,
  TrendingUp,
  Star,
  Target,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { cn } from "../lib/utils";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = "blue",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color?: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", colors[color])}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/** Simple horizontal bar */
function AccuracyBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
      <div
        className={cn(
          "h-2 rounded-full transition-all duration-500",
          value >= 70 ? "bg-emerald-500" : value >= 40 ? "bg-amber-400" : "bg-red-500"
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

/** Mini calendar heatmap for last 28 days */
function StudyHeatmap({ history }: { history: string[] }) {
  const days = useMemo(() => {
    const result = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toDateString();
      const studied = history.some(h => new Date(h).toDateString() === dayStr);
      result.push({ date: d, studied });
    }
    return result;
  }, [history]);

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-3">Study Activity — Last 28 Days</p>
      <div className="grid grid-cols-14 gap-1.5" style={{ gridTemplateColumns: "repeat(14, minmax(0,1fr))" }}>
        {days.map((day, i) => (
          <div
            key={i}
            title={day.date.toDateString()}
            className={cn(
              "aspect-square rounded-sm",
              day.studied ? "bg-emerald-400" : "bg-gray-100"
            )}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
        <span className="w-3 h-3 rounded-sm bg-gray-100 inline-block" /> No study
        <span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block ml-2" /> Studied
      </div>
    </div>
  );
}

export default function Stats() {
  const { vocabItems, collections, streak, longestStreak, studyHistory } = useStore();

  const totalWords = vocabItems.length;
  const totalReviewed = vocabItems.filter(v => v.correctCount + v.wrongCount > 0).length;
  const totalMastered = vocabItems.filter(v => {
    const total = v.correctCount + v.wrongCount;
    return total > 0 && v.correctCount / total >= 0.8 && v.interval >= 6;
  }).length;
  const hardWords = vocabItems.filter(v => v.isHard).length;
  const dueToday = vocabItems.filter(
    v => !v.nextReviewAt || new Date(v.nextReviewAt) <= new Date()
  ).length;

  const overallAccuracy = useMemo(() => {
    const total = vocabItems.reduce((s, v) => s + v.correctCount + v.wrongCount, 0);
    const correct = vocabItems.reduce((s, v) => s + v.correctCount, 0);
    return total === 0 ? 0 : Math.round((correct / total) * 100);
  }, [vocabItems]);

  // Top 10 hardest words
  const hardestWords = useMemo(
    () =>
      [...vocabItems]
        .filter(v => v.correctCount + v.wrongCount > 0)
        .sort((a, b) => {
          const rA = a.wrongCount / (a.correctCount + a.wrongCount);
          const rB = b.wrongCount / (b.correctCount + b.wrongCount);
          return rB - rA;
        })
        .slice(0, 10),
    [vocabItems]
  );

  // Per-collection stats
  const collectionStats = useMemo(
    () =>
      collections.map(c => {
        const items = vocabItems.filter(v => v.collectionId === c.id);
        const total = items.reduce((s, v) => s + v.correctCount + v.wrongCount, 0);
        const correct = items.reduce((s, v) => s + v.correctCount, 0);
        return {
          ...c,
          wordCount: items.length,
          accuracy: total === 0 ? 0 : Math.round((correct / total) * 100),
          reviewed: items.filter(v => v.correctCount + v.wrongCount > 0).length,
        };
      }),
    [collections, vocabItems]
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 flex items-center gap-3">
          <BarChart2 className="w-8 h-8 text-purple-600" />
          Progress & Statistics
        </h1>
        <p className="text-gray-500 mt-1">
          Track your learning journey and identify areas for improvement.
        </p>
      </header>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard icon={Target} label="Overall Accuracy" value={`${overallAccuracy}%`} color="blue" />
        <StatCard icon={CheckCircle} label="Mastered Words" value={totalMastered} sub={`of ${totalWords} total`} color="emerald" />
        <StatCard icon={TrendingUp} label="Current Streak" value={`${streak} day${streak !== 1 ? "s" : ""}`} sub={`Best: ${longestStreak} days`} color="amber" />
        <StatCard icon={Clock} label="Due Today" value={dueToday} sub="words to review" color="red" />
        <StatCard icon={BookOpen} label="Total Words" value={totalWords} color="indigo" />
        <StatCard icon={BarChart2} label="Words Reviewed" value={totalReviewed} sub={`${totalWords - totalReviewed} not yet started`} color="purple" />
        <StatCard icon={Star} label="Hard Words" value={hardWords} color="amber" />
        <StatCard icon={XCircle} label="Need Review" value={vocabItems.filter(v => v.wrongCount > v.correctCount).length} sub="more wrong than right" color="red" />
      </div>

      {/* Study Heatmap */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <StudyHeatmap history={studyHistory} />
      </div>

      {/* Collection Breakdown */}
      {collectionStats.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">By Collection</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Collection</th>
                    <th className="px-6 py-4">Words</th>
                    <th className="px-6 py-4">Reviewed</th>
                    <th className="px-6 py-4 min-w-[160px]">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {collectionStats.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        <Link to={`/collections/${c.id}`} className="hover:text-blue-600 hover:underline">
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{c.wordCount}</td>
                      <td className="px-6 py-4 text-gray-600">{c.reviewed}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "font-medium",
                          c.accuracy >= 70 ? "text-emerald-600" : c.accuracy >= 40 ? "text-amber-600" : "text-red-600"
                        )}>
                          {c.reviewed === 0 ? "—" : `${c.accuracy}%`}
                        </span>
                        {c.reviewed > 0 && <AccuracyBar value={c.accuracy} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Hardest Words */}
      {hardestWords.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Top {hardestWords.length} Hardest Words
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Word</th>
                    <th className="px-6 py-4">Meaning</th>
                    <th className="px-6 py-4 text-right">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {hardestWords.map((w, idx) => {
                    const total = w.correctCount + w.wrongCount;
                    const acc = Math.round((w.correctCount / total) * 100);
                    return (
                      <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-400 font-mono">{idx + 1}</td>
                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                          {w.isHard && <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />}
                          {w.term}
                          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{w.type}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{w.meaning}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={cn(
                            "font-semibold",
                            acc < 40 ? "text-red-600" : acc < 70 ? "text-amber-600" : "text-emerald-600"
                          )}>
                            {acc}%
                          </span>
                          <p className="text-xs text-gray-400">
                            {w.correctCount}✓ {w.wrongCount}✗
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {totalWords === 0 && (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
          <BarChart2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">No data yet</h2>
          <p className="text-gray-500 mb-6">Import vocabulary and start studying to see your stats here.</p>
          <Link
            to="/import"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Add Vocabulary
          </Link>
        </div>
      )}
    </div>
  );
}
