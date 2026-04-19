/**
 * AchievementToast — Slide-in notification for newly unlocked achievements
 * Stacks multiple toasts, auto-dismisses after 4 seconds
 */
import { useEffect, useState } from 'react';
import { useGamificationStore } from '../../store/useGamificationStore';
import styles from './Gamification.module.css';

interface ToastItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  xpReward: number;
  exiting: boolean;
}

export function AchievementToast() {
  const { pendingAchievements, clearPendingAchievement } = useGamificationStore();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Sync new achievements into local toast state
  useEffect(() => {
    if (pendingAchievements.length === 0) return;

    const newToasts = pendingAchievements
      .filter(p => !toasts.find(t => t.id === p.achievement.id))
      .map(p => ({
        id: p.achievement.id,
        icon: p.achievement.icon,
        title: p.achievement.title,
        description: p.achievement.description,
        xpReward: p.achievement.xpReward,
        exiting: false,
      }));

    if (newToasts.length > 0) {
      setToasts(prev => [...prev, ...newToasts]);
    }
  }, [pendingAchievements]);

  // Auto-dismiss after 4s
  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts
      .filter(t => !t.exiting)
      .map(t => {
        const exitTimer = setTimeout(() => {
          setToasts(prev => prev.map(x => x.id === t.id ? { ...x, exiting: true } : x));
        }, 4000);

        const removeTimer = setTimeout(() => {
          clearPendingAchievement(t.id);
          setToasts(prev => prev.filter(x => x.id !== t.id));
        }, 4400);

        return [exitTimer, removeTimer];
      });

    return () => timers.flat().forEach(clearTimeout);
  }, [toasts.length]);

  if (toasts.length === 0) return null;

  return (
    <div className={styles.achievementToastWrapper}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`${styles.achievementToast} ${toast.exiting ? styles.toastSlideOut : ''}`}
          onClick={() => {
            clearPendingAchievement(toast.id);
            setToasts(prev => prev.filter(x => x.id !== toast.id));
          }}
        >
          <span className={styles.toastIcon}>{toast.icon}</span>
          <div className={styles.toastContent}>
            <div className={styles.toastLabel}>Achievement Unlocked!</div>
            <div className={styles.toastTitle}>{toast.title}</div>
            <div className={styles.toastDesc}>{toast.description}</div>
          </div>
          <span className={styles.toastXp}>+{toast.xpReward} XP</span>
        </div>
      ))}
    </div>
  );
}
