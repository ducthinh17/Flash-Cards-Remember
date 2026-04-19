/**
 * XPBar — Shows current level, XP progress, and optional multiplier
 * Compound component: XPBar + XPBar.Compact (sidebar variant)
 */
import { useMemo } from 'react';
import { useGamificationStore, xpForLevel, totalXpForLevel } from '../../store/useGamificationStore';
import styles from './Gamification.module.css';
import { cn } from '../../lib/utils';

function getLevelTier(level: number): string {
  if (level >= 50) return 'legend';
  if (level >= 25) return 'master';
  if (level >= 10) return 'diamond';
  if (level >= 5)  return 'gold';
  if (level >= 2)  return 'silver';
  return 'bronze';
}

interface XPBarProps {
  className?: string;
  showMultiplier?: boolean;
  compact?: boolean;
}

export function XPBar({ className, showMultiplier = true, compact = false }: XPBarProps) {
  const { totalXp, level } = useGamificationStore();

  const { currentLevelXp, neededXp, percent } = useMemo(() => {
    const levelStart = totalXpForLevel(level);
    const levelEnd = totalXpForLevel(level + 1);
    const currentLevelXp = totalXp - levelStart;
    const neededXp = levelEnd - levelStart;
    const percent = Math.min(100, Math.round((currentLevelXp / neededXp) * 100));
    return { currentLevelXp, neededXp, percent };
  }, [totalXp, level]);

  const tier = getLevelTier(level);

  if (compact) {
    return (
      <div className={cn(styles.xpBarRoot, className)} title={`Level ${level} — ${currentLevelXp}/${neededXp} XP`}>
        <div className={cn(styles.levelBadge, styles[`tier-${tier}`])}>
          {level}
        </div>
        <div className={styles.xpTrack}>
          <div className={styles.xpFill} style={{ width: `${percent}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(styles.xpBarRoot, className)} title={`${currentLevelXp} / ${neededXp} XP to Level ${level + 1}`}>
      <div className={cn(styles.levelBadge, styles[`tier-${tier}`])} title={`Level ${level}`}>
        {level}
      </div>
      <div className={styles.xpTrack}>
        <div className={styles.xpFill} style={{ width: `${percent}%` }} />
      </div>
      <span className={styles.xpText}>{currentLevelXp.toLocaleString()} XP</span>
      {showMultiplier && (
        <span className={styles.multiplierBadge} title="XP Multiplier">×1</span>
      )}
    </div>
  );
}
