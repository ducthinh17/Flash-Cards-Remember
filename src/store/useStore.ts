import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Collection, VocabItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  collections: Collection[];
  vocabItems: VocabItem[];
  
  addCollection: (name: string) => Collection;
  deleteCollection: (id: string) => void;
  updateCollection: (id: string, name: string) => void;
  
  addVocabItems: (items: Omit<VocabItem, 'id' | 'createdAt' | 'correctCount' | 'wrongCount' | 'easeFactor' | 'interval' | 'isHard' | 'nextReviewAt'>[]) => void;
  deleteVocabItem: (id: string) => void;
  
  updateVocabProgress: (id: string, isCorrect: boolean) => void;
  toggleHardWord: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      collections: [],
      vocabItems: [],
      
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
          // Filter out duplicates
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
      }
    }),
    {
      name: 'flashcard-storage',
    }
  )
);
