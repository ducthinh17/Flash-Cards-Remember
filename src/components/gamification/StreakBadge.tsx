/**
 * StreakBadge — Shows daily streak with fire animation
 */
import { useGamificationStore } from '../../store/useGamificationStore';
import styles from './Gamification.module.css';
import { cn } from '../../lib/utils';

interface StreakBadgeProps {
  className?: string;
  showLabel?: boolean;
}

function getStreakEmoji(streak: number): string {
  if (streak >= 30) return '🌋';  // volcano — legendary
  if (streak >= 14) return '⚡';  // lightning — electric
  if (streak >= 7)  return '🔥';  // fire — hot streak
  if (streak >= 3)  return '🔥';  // small fire
  return '✨';                    // sparkle — starting
}

export function StreakBadge({ className, showLabel = true }: StreakBadgeProps) {
  const { streak, lastStudiedDate } = useGamificationStore();
  const isActive = streak > 0;
  const isOnFire = streak >= 3;

  return (
    <div
      className={cn(
        styles.streakBadge,
        isActive ? styles.streakActive : styles.streakInactive,
        className
      )}
      title={`${streak}-day streak${streak === 0 ? ' — study today to start!' : ''}`}
    >
      <span className={cn(styles.streakEmoji, isOnFire && styles.animateFire)}>
        {getStreakEmoji(streak)}
      </span>
      <span className={styles.streakCount}>{streak}</span>
      {showLabel && (
        <span className={styles.streakLabel}>day{streak !== 1 ? 's' : ''}</span>
      )}
    </div>
  );
}
