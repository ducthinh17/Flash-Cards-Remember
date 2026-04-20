/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Collections = lazy(() => import("./pages/Collections"));
const CollectionDetail = lazy(() => import("./pages/CollectionDetail"));
const Import = lazy(() => import("./pages/Import"));
const Study = lazy(() => import("./pages/Study"));
const Quiz = lazy(() => import("./pages/Quiz"));
const Review = lazy(() => import("./pages/Review"));
const ActiveRecall = lazy(() => import("./pages/ActiveRecall"));
const Games = lazy(() => import("./pages/Games"));
const MatchingGame = lazy(() => import("./pages/MatchingGame"));
const SpeedQuiz = lazy(() => import("./pages/SpeedQuiz"));
const Stats = lazy(() => import("./pages/Stats"));
const VocabDefender = lazy(() => import("./pages/VocabDefender"));
const DailyFocus = lazy(() => import("./pages/DailyFocus"));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Standalone pages without sidebar */}
          <Route path="/daily-focus" element={<DailyFocus />} />
          
          {/* Main App Layout */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="collections" element={<Collections />} />
            <Route path="collections/:id" element={<CollectionDetail />} />
            <Route path="import" element={<Import />} />
            <Route path="study/:collectionId/:lessonTitle?" element={<Study />} />
            <Route path="quiz/:collectionId/:lessonTitle?" element={<Quiz />} />
            <Route path="active-recall/:collectionId/:lessonTitle?" element={<ActiveRecall />} />
            <Route path="review" element={<Review />} />
            <Route path="games" element={<Games />} />
            <Route path="games/matching/:collectionId?" element={<MatchingGame />} />
            <Route path="games/speed/:collectionId?" element={<SpeedQuiz />} />
            <Route path="games/vocab-defender" element={<VocabDefender />} />
            <Route path="stats" element={<Stats />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
