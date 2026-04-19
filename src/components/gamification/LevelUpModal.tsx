/**
 * LevelUpModal — Celebration modal shown when player levels up
 * Uses canvas-confetti for particle burst
 */
import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useGamificationStore } from '../../store/useGamificationStore';
import styles from './Gamification.module.css';

function getLevelTitle(level: number): string {
  if (level >= 50) return '🌋 Legendary Scholar';
  if (level >= 25) return '💎 Diamond Mind';
  if (level >= 10) return '🌟 Knowledge Knight';
  if (level >= 5)  return '⭐ Rising Star';
  if (level >= 2)  return '🥈 Word Apprentice';
  return '🥉 Fresh Learner';
}

export function LevelUpModal() {
  const { pendingLevelUp, clearPendingLevelUp } = useGamificationStore();
  const fired = useRef(false);

  useEffect(() => {
    if (pendingLevelUp && !fired.current) {
      fired.current = true;
      // Confetti burst
      const end = Date.now() + 1500;
      const colors = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#fbbf24'];

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
          zIndex: 10000,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
          zIndex: 10000,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
    return () => { fired.current = false; };
  }, [pendingLevelUp]);

  if (!pendingLevelUp) return null;

  const { newLevel } = pendingLevelUp;

  return (
    <div className={styles.levelUpOverlay} onClick={clearPendingLevelUp}>
      <div className={styles.levelUpCard} onClick={e => e.stopPropagation()}>
        <div className={styles.levelUpStars}>⭐</div>
        <div className={styles.levelUpTitle}>Level Up!</div>
        <div className={styles.levelUpNumber}>{newLevel}</div>
        <div className={styles.levelUpSubtitle}>
          {getLevelTitle(newLevel)}
        </div>
        <button className={styles.levelUpBtn} onClick={clearPendingLevelUp}>
          Keep Learning! 🚀
        </button>
      </div>
    </div>
  );
}
