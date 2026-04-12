import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Collection, VocabItem } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { isToday, isYesterday } from '../lib/utils';

interface AppState {
  collections: Collection[];
  vocabItems: VocabItem[];

  // Streak / habit tracking
  streak: number;
  longestStreak: number;
  lastStudiedDate: string | null;
  studyHistory: string[]; // ISO date strings of days studied (last 90 days)

  addCollection: (name: string) => Collection;
  deleteCollection: (id: string) => void;
  updateCollection: (id: string, name: string) => void;

  addVocabItems: (items: Omit<VocabItem, 'id' | 'createdAt' | 'correctCount' | 'wrongCount' | 'easeFactor' | 'interval' | 'isHard' | 'nextReviewAt'>[]) => void;
  deleteVocabItem: (id: string) => void;

  updateVocabProgress: (id: string, isCorrect: boolean) => void;
  toggleHardWord: (id: string) => void;

  /** Call after any study session completes at least 1 word */
  recordStudySession: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      collections: [],
      vocabItems: [],
      streak: 0,
      longestStreak: 0,
      lastStudiedDate: null,
      studyHistory: [],

      addCollection: (name: string) => {
        const newCollection: Collection = {
          id: uuidv4(),
          name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          collections: [...state.collections, newCollection],
        }));
        return newCollection;
      },

      deleteCollection: (id: string) => {
        set((state) => ({
          collections: state.collections.filter(c => c.id !== id),
          vocabItems: state.vocabItems.filter(v => v.collectionId !== id),
        }));
      },

      updateCollection: (id: string, name: string) => {
        set((state) => ({
          collections: state.collections.map(c =>
            c.id === id ? { ...c, name, updatedAt: new Date().toISOString() } : c
          ),
        }));
      },

      addVocabItems: (items) => {
        const newItems: VocabItem[] = items.map(item => ({
          ...item,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          correctCount: 0,
          wrongCount: 0,
          easeFactor: 2.5,
          interval: 0,
          nextReviewAt: new Date().toISOString(),
          isHard: false,
        }));

        set((state) => {
          const existingKeys = new Set(
            state.vocabItems.map(v => `${v.collectionId}-${v.lessonTitle}-${v.term}-${v.type}-${v.meaning}`)
          );

          const uniqueNewItems = newItems.filter(item => {
            const key = `${item.collectionId}-${item.lessonTitle}-${item.term}-${item.type}-${item.meaning}`;
            if (existingKeys.has(key)) return false;
            existingKeys.add(key);
            return true;
          });

          return {
            vocabItems: [...state.vocabItems, ...uniqueNewItems],
          };
        });
      },

      deleteVocabItem: (id: string) => {
        set((state) => ({
          vocabItems: state.vocabItems.filter(v => v.id !== id),
        }));
      },

      updateVocabProgress: (id: string, isCorrect: boolean) => {
        set((state) => ({
          vocabItems: state.vocabItems.map(v => {
            if (v.id === id) {
              let { easeFactor = 2.5, interval = 0 } = v;

              if (isCorrect) {
                if (interval === 0) interval = 1;
                else if (interval === 1) interval = 6;
                else interval = Math.round(interval * easeFactor);
                easeFactor = Math.max(1.3, easeFactor + 0.1);
              } else {
                interval = 1;
                easeFactor = Math.max(1.3, easeFactor - 0.2);
              }

              const nextReviewAt = new Date();
              nextReviewAt.setDate(nextReviewAt.getDate() + interval);

              return {
                ...v,
                correctCount: isCorrect ? v.correctCount + 1 : v.correctCount,
                wrongCount: !isCorrect ? v.wrongCount + 1 : v.wrongCount,
                lastReviewedAt: new Date().toISOString(),
                nextReviewAt: nextReviewAt.toISOString(),
                easeFactor,
                interval,
              };
            }
            return v;
          }),
        }));
      },

      toggleHardWord: (id: string) => {
        set((state) => ({
          vocabItems: state.vocabItems.map(v =>
            v.id === id ? { ...v, isHard: !v.isHard } : v
          )
        }));
      },

      recordStudySession: () => {
        set((state) => {
          const todayISO = new Date().toISOString();
          const todayStr = new Date().toDateString();

          // Already recorded today
          if (isToday(state.lastStudiedDate)) {
            return {};
          }

          let newStreak = state.streak;
          if (isYesterday(state.lastStudiedDate)) {
            // Consecutive day → increment streak
            newStreak = state.streak + 1;
          } else if (!state.lastStudiedDate) {
            newStreak = 1;
          } else {
            // Gap in study → reset streak
            newStreak = 1;
          }

          const longestStreak = Math.max(state.longestStreak, newStreak);

          // Keep last 90 days of study history (deduplicated by day)
          const history = state.studyHistory.filter(d => {
            const dt = new Date(d);
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 90);
            return dt >= cutoff;
          });

          if (!history.some(d => new Date(d).toDateString() === todayStr)) {
            history.push(todayISO);
          }

          return {
            streak: newStreak,
            longestStreak,
            lastStudiedDate: todayISO,
            studyHistory: history,
          };
        });
      },
    }),
    {
      name: 'flashcard-storage',
    }
  )
);
