export type Collection = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type VocabItem = {
  id: string;
  term: string;
  type: string;
  meaning: string;
  lessonTitle: string;
  collectionId: string;
  createdAt: string;
  correctCount: number;
  wrongCount: number;
  lastReviewedAt?: string;
  nextReviewAt?: string;
  easeFactor: number;
  interval: number;
  isHard?: boolean;
};

export type LessonGroup = {
  title: string;
  collectionId: string;
  items: VocabItem[];
  total: number;
};
