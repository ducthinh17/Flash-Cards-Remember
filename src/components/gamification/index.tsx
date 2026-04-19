/**
 * GamificationOverlay — Mounts LevelUpModal + AchievementToast at app root
 * Import once in AppLayout
 */
import { LevelUpModal } from './LevelUpModal';
import { AchievementToast } from './AchievementToast';

export { LevelUpModal } from './LevelUpModal';
export { AchievementToast } from './AchievementToast';
export { XPBar } from './XPBar';
export { StreakBadge } from './StreakBadge';
export { XpPopup } from './XpPopup';

export function GamificationOverlay() {
  return (
    <>
      <LevelUpModal />
      <AchievementToast />
    </>
  );
}
