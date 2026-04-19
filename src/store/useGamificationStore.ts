/**
 * Gamification Store — XP, Level, Streak, Achievements
 * Persisted to localStorage via Zustand persist middleware
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── XP per activity ──────────────────────────────────────────────────────────
export const XP_REWARDS = {
  STUDY_CARD:       10,
  QUIZ_CORRECT:     15,
  ACTIVE_RECALL:    20,
  GAME_WIN:         50,
  GAME_PLAY:        25,
  SPEED_BONUS:       5,   // per second remaining
  STREAK_BONUS:     30,   // bonus for maintaining streak
  PERFECT_ROUND:    40,   // 100% correct in a session
} as const;

// ── Level thresholds (XP needed to reach that level) ────────────────────────
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  // Exponential curve: level 2=100, 3=250, 5=700, 10=2200, 20=7500, 50=35000
  return Math.floor(100 * Math.pow(level - 1, 1.6));
}

export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

export function getLevelFromTotalXp(totalXp: number): number {
  let level = 1;
  while (totalXp >= totalXpForLevel(level + 1)) {
    level++;
    if (level >= 100) break;
  }
  return level;
}

// ── Streak multiplier ────────────────────────────────────────────────────────
export function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 3.0;
  if (streak >= 14) return 2.0;
  if (streak >= 7)  return 1.5;
  if (streak >= 3)  return 1.25;
  return 1.0;
}

// ── Achievement definitions ──────────────────────────────────────────────────
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;       // emoji
  xpReward: number;
  unlockedAt?: string;
  condition: (stats: GamificationStats) => boolean;
}

export interface GamificationStats {
  totalXp: number;
  level: number;
  streak: number;
  longestStreak: number;
  totalWordsLearned: number;
  totalGamesPlayed: number;
  totalCorrectAnswers: number;
  perfectRounds: number;
  vocabDefenderHighScore: number;
  wordChainBestLength: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Streak achievements
  { id: 'streak_3',    title: 'On a Roll!',      description: '3-day streak',         icon: '🔥', xpReward: 50,  condition: s => s.streak >= 3 },
  { id: 'streak_7',    title: 'Week Warrior',     description: '7-day streak',         icon: '⚡', xpReward: 100, condition: s => s.streak >= 7 },
  { id: 'streak_14',   title: 'Committed',        description: '14-day streak',        icon: '💪', xpReward: 200, condition: s => s.streak >= 14 },
  { id: 'streak_30',   title: 'Unstoppable',      description: '30-day streak',        icon: '🏆', xpReward: 500, condition: s => s.streak >= 30 },
  // Level achievements
  { id: 'level_5',     title: 'Rising Star',      description: 'Reach level 5',        icon: '⭐', xpReward: 75,  condition: s => s.level >= 5 },
  { id: 'level_10',    title: 'Dedicated Learner',description: 'Reach level 10',       icon: '🌟', xpReward: 150, condition: s => s.level >= 10 },
  { id: 'level_25',    title: 'Knowledge Seeker', description: 'Reach level 25',       icon: '💎', xpReward: 300, condition: s => s.level >= 25 },
  { id: 'level_50',    title: 'Vocabulary Master', description: 'Reach level 50',      icon: '👑', xpReward: 750, condition: s => s.level >= 50 },
  // Word count
  { id: 'words_10',    title: 'First Steps',      description: 'Learn 10 words',       icon: '📖', xpReward: 25,  condition: s => s.totalWordsLearned >= 10 },
  { id: 'words_50',    title: 'Word Collector',   description: 'Learn 50 words',       icon: '📚', xpReward: 75,  condition: s => s.totalWordsLearned >= 50 },
  { id: 'words_100',   title: 'Century Club',     description: 'Learn 100 words',      icon: '🎯', xpReward: 150, condition: s => s.totalWordsLearned >= 100 },
  { id: 'words_500',   title: 'Lexicon Lord',     description: 'Learn 500 words',      icon: '🔮', xpReward: 400, condition: s => s.totalWordsLearned >= 500 },
  // Games
  { id: 'game_first',  title: 'Game On!',         description: 'Play your first game', icon: '🎮', xpReward: 30,  condition: s => s.totalGamesPlayed >= 1 },
  { id: 'game_10',     title: 'Gamer',            description: 'Play 10 games',        icon: '🕹️', xpReward: 100, condition: s => s.totalGamesPlayed >= 10 },
  { id: 'perfect_1',   title: 'Flawless',         description: 'First perfect round',  icon: '✨', xpReward: 50,  condition: s => s.perfectRounds >= 1 },
  { id: 'perfect_5',   title: 'Perfectionist',    description: '5 perfect rounds',     icon: '🌈', xpReward: 150, condition: s => s.perfectRounds >= 5 },
  // Defender
  { id: 'defender_1k', title: 'Defender',         description: 'Score 1000 in Vocab Defender', icon: '🛡️', xpReward: 100, condition: s => s.vocabDefenderHighScore >= 1000 },
  { id: 'defender_5k', title: 'Elite Defender',   description: 'Score 5000 in Vocab Defender', icon: '⚔️', xpReward: 300, condition: s => s.vocabDefenderHighScore >= 5000 },
  // Chain
  { id: 'chain_5',     title: 'Chain Starter',    description: 'Word chain of 5+',    icon: '⛓️', xpReward: 50,  condition: s => s.wordChainBestLength >= 5 },
  { id: 'chain_10',    title: 'Chain Master',     description: 'Word chain of 10+',   icon: '🌊', xpReward: 150, condition: s => s.wordChainBestLength >= 10 },
];

// ── Store types ───────────────────────────────────────────────────────────────
export interface PendingLevelUp {
  oldLevel: number;
  newLevel: number;
}

export interface PendingAchievement {
  achievement: Achievement;
}

interface GamificationState {
  totalXp: number;
  level: number;
  streak: number;
  longestStreak: number;
  lastStudiedDate: string | null;
  studyHistory: string[];
  totalWordsLearned: number;
  totalGamesPlayed: number;
  totalCorrectAnswers: number;
  perfectRounds: number;
  vocabDefenderHighScore: number;
  wordChainBestLength: number;
  unlockedAchievements: string[];  // achievement IDs

  // Transient UI state (not persisted)
  pendingLevelUp: PendingLevelUp | null;
  pendingAchievements: PendingAchievement[];

  // Actions
  addXp: (amount: number, multiplier?: number) => void;
  recordStudySession: () => void;
  recordCorrectAnswer: (isCorrect: boolean) => void;
  recordPerfectRound: () => void;
  recordGamePlayed: (game: 'defender' | 'chain' | 'matching' | 'speed', score?: number) => void;
  updateVocabDefenderScore: (score: number) => void;
  updateWordChainScore: (length: number) => void;
  clearPendingLevelUp: () => void;
  clearPendingAchievement: (id: string) => void;
  getStats: () => GamificationStats;
  checkAchievements: () => void;
}

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

function isYesterday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return new Date(dateStr).toDateString() === yesterday.toDateString();
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      totalXp: 0,
      level: 1,
      streak: 0,
      longestStreak: 0,
      lastStudiedDate: null,
      studyHistory: [],
      totalWordsLearned: 0,
      totalGamesPlayed: 0,
      totalCorrectAnswers: 0,
      perfectRounds: 0,
      vocabDefenderHighScore: 0,
      wordChainBestLength: 0,
      unlockedAchievements: [],

      // Transient — not persisted
      pendingLevelUp: null,
      pendingAchievements: [],

      addXp: (amount, multiplier = 1) => {
        const earned = Math.round(amount * multiplier);
        set(state => {
          const newTotalXp = state.totalXp + earned;
          const newLevel = getLevelFromTotalXp(newTotalXp);
          const leveledUp = newLevel > state.level;

          return {
            totalXp: newTotalXp,
            level: newLevel,
            pendingLevelUp: leveledUp
              ? { oldLevel: state.level, newLevel }
              : state.pendingLevelUp,
          };
        });
        // Check achievements after XP update
        setTimeout(() => get().checkAchievements(), 0);
      },

      recordStudySession: () => {
        set(state => {
          if (isToday(state.lastStudiedDate)) return {};

          let newStreak: number;
          if (!state.lastStudiedDate) {
            newStreak = 1;
          } else if (isYesterday(state.lastStudiedDate)) {
            newStreak = state.streak + 1;
          } else {
            newStreak = 1;
          }

          const longestStreak = Math.max(state.longestStreak, newStreak);
          const todayISO = new Date().toISOString();
          const todayStr = new Date().toDateString();

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
        // Streak bonus XP
        const { streak } = get();
        if (streak > 1) {
          get().addXp(XP_REWARDS.STREAK_BONUS, getStreakMultiplier(streak));
        }
        get().checkAchievements();
      },

      recordCorrectAnswer: (isCorrect) => {
        if (isCorrect) {
          set(s => ({ totalCorrectAnswers: s.totalCorrectAnswers + 1, totalWordsLearned: s.totalWordsLearned + 1 }));
        }
      },

      recordPerfectRound: () => {
        set(s => ({ perfectRounds: s.perfectRounds + 1 }));
        get().addXp(XP_REWARDS.PERFECT_ROUND);
        get().checkAchievements();
      },

      recordGamePlayed: (game, score) => {
        set(s => ({
          totalGamesPlayed: s.totalGamesPlayed + 1,
          vocabDefenderHighScore: game === 'defender' && score && score > s.vocabDefenderHighScore
            ? score : s.vocabDefenderHighScore,
          wordChainBestLength: game === 'chain' && score && score > s.wordChainBestLength
            ? score : s.wordChainBestLength,
        }));
        get().addXp(XP_REWARDS.GAME_PLAY);
        get().checkAchievements();
      },

      updateVocabDefenderScore: (score) => {
        set(s => ({ vocabDefenderHighScore: Math.max(s.vocabDefenderHighScore, score) }));
        get().checkAchievements();
      },

      updateWordChainScore: (length) => {
        set(s => ({ wordChainBestLength: Math.max(s.wordChainBestLength, length) }));
        get().checkAchievements();
      },

      clearPendingLevelUp: () => set({ pendingLevelUp: null }),

      clearPendingAchievement: (id) => {
        set(s => ({ pendingAchievements: s.pendingAchievements.filter(a => a.achievement.id !== id) }));
      },

      getStats: (): GamificationStats => {
        const s = get();
        return {
          totalXp: s.totalXp,
          level: s.level,
          streak: s.streak,
          longestStreak: s.longestStreak,
          totalWordsLearned: s.totalWordsLearned,
          totalGamesPlayed: s.totalGamesPlayed,
          totalCorrectAnswers: s.totalCorrectAnswers,
          perfectRounds: s.perfectRounds,
          vocabDefenderHighScore: s.vocabDefenderHighScore,
          wordChainBestLength: s.wordChainBestLength,
        };
      },

      checkAchievements: () => {
        const state = get();
        const stats = state.getStats();
        const newlyUnlocked: Achievement[] = [];

        for (const ach of ACHIEVEMENTS) {
          if (state.unlockedAchievements.includes(ach.id)) continue;
          if (ach.condition(stats)) {
            newlyUnlocked.push(ach);
          }
        }

        if (newlyUnlocked.length > 0) {
          const newIds = newlyUnlocked.map(a => a.id);
          const newPending = newlyUnlocked.map(a => ({ achievement: a }));
          let bonusXp = newlyUnlocked.reduce((sum, a) => sum + a.xpReward, 0);

          set(s => ({
            unlockedAchievements: [...s.unlockedAchievements, ...newIds],
            pendingAchievements: [...s.pendingAchievements, ...newPending],
            totalXp: s.totalXp + bonusXp,
            level: getLevelFromTotalXp(s.totalXp + bonusXp),
          }));
        }
      },
    }),
    {
      name: 'flashcard-gamification',
      partialize: (state) => ({
        // Only persist these fields — exclude transient UI state
        totalXp: state.totalXp,
        level: state.level,
        streak: state.streak,
        longestStreak: state.longestStreak,
        lastStudiedDate: state.lastStudiedDate,
        studyHistory: state.studyHistory,
        totalWordsLearned: state.totalWordsLearned,
        totalGamesPlayed: state.totalGamesPlayed,
        totalCorrectAnswers: state.totalCorrectAnswers,
        perfectRounds: state.perfectRounds,
        vocabDefenderHighScore: state.vocabDefenderHighScore,
        wordChainBestLength: state.wordChainBestLength,
        unlockedAchievements: state.unlockedAchievements,
      }),
    }
  )
);
