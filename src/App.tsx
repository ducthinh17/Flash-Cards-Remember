/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Collections from "./pages/Collections";
import CollectionDetail from "./pages/CollectionDetail";
import Import from "./pages/Import";
import Study from "./pages/Study";
import Quiz from "./pages/Quiz";
import Review from "./pages/Review";
import ActiveRecall from "./pages/ActiveRecall";
import Games from "./pages/Games";
import MatchingGame from "./pages/MatchingGame";
import SpeedQuiz from "./pages/SpeedQuiz";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
