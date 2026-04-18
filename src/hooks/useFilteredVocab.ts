import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { VocabItem } from '../types';

export type FilterMode = 'all' | 'review' | 'hard';

export function useFilteredVocab(collectionId: string, lessonTitle?: string, filterMode: FilterMode = 'all') {
  const vocabItems = useStore((state) => state.vocabItems);

  const filteredItems = useMemo(() => {
    return vocabItems.filter(v => {
      // 1. Filter by collection
      if (collectionId !== 'review' && collectionId !== 'hard' && v.collectionId !== collectionId) {
        return false;
      }
      // 2. Filter by lesson (if provided)
      if (lessonTitle && v.lessonTitle !== lessonTitle) {
        return false;
      }

      // 3. Global cross-collection filters
      if (collectionId === 'review' || filterMode === 'review') {
        const isDue = !v.nextReviewAt || new Date(v.nextReviewAt) <= new Date();
        if (!isDue) return false;
      }

      if (collectionId === 'hard' || filterMode === 'hard') {
        if (!v.isHard) return false;
      }

      return true;
    });
  }, [vocabItems, collectionId, lessonTitle, filterMode]);

  return filteredItems;
}
