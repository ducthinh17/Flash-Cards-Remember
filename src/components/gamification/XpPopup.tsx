import { useEffect, useState } from 'react';
import styles from './XpPopup.module.css';

interface XpPopupProps {
  xp: number;
  show: boolean;
  onDone?: () => void;
}

/**
 * Floating "+X XP" popup — animates up and fades out.
 * Mount/unmount externally via `show` prop.
 */
export function XpPopup({ xp, show, onDone }: XpPopupProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 1100);
    return () => clearTimeout(t);
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null;

  return (
    <div className={styles.popup} aria-live="polite">
      +{xp} XP ✨
    </div>
  );
}
