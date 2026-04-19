/**
 * VocabDefender — Tower Defense vocabulary game
 *
 * Monsters (Vietnamese meanings) descend from the top.
 * Player types the English translation to destroy them before they reach the base.
 *
 * Exposes window.render_game_to_text + window.advanceTime for Playwright testing.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useGamificationStore, XP_REWARDS, getStreakMultiplier } from '../store/useGamificationStore';
import styles from './VocabDefender.module.css';

// ── Types ────────────────────────────────────────────────────────────────────
interface Monster {
  id: string;
  term: string;        // answer (English)
  meaning: string;     // displayed (Vietnamese)
  emoji: string;
  x: number;           // 5–85 vw percent
  duration: number;    // seconds to reach base
  spawnTime: number;   // Date.now() at spawn
  dead: boolean;
  reached: boolean;
}

type GamePhase = 'collection-picker' | 'lesson-picker' | 'menu' | 'wave-announce' | 'playing' | 'game-over';
type InputMode = 'typing' | 'multiple-choice';

interface Difficulty {
  id: 'easy' | 'normal' | 'hard';
  emoji: string;
  name: string;
  desc: string;
  baseSpeed: number;    // seconds per wave cycle
  waveSize: number;     // monsters per wave
  speedStep: number;    // speed reduction per wave
}

const DIFFICULTIES: Difficulty[] = [
  { id: 'easy',   emoji: '🐣', name: 'Easy',   desc: '17s speed',  baseSpeed: 11,  waveSize: 3, speedStep: 0.3 },
  { id: 'normal', emoji: '👾', name: 'Normal',  desc: '12s speed',  baseSpeed: 9,  waveSize: 5, speedStep: 0.5 },
  { id: 'hard',   emoji: '💀', name: 'Hard',    desc: '7s speed',  baseSpeed: 7,  waveSize: 7, speedStep: 0.8 },
];

const MONSTER_EMOJIS = {
  easy:   ['🐣','🐱','🐶','🦊','🐸','🐧'],
  normal: ['👻','🧟','🦇','🕷️','🐺','🦑'],
  hard:   ['🐲','💀','👾','🔥','☠️','🌋'],
};

const MAX_LIVES = 3;

// ── Helpers ──────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 10); }

function normalize(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '');
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function VocabDefender() {
  const navigate = useNavigate();
  const { vocabItems, collections } = useStore();
  const gStore = useGamificationStore();

  // Collection / lesson picker
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string>('all');
  const [inputMode, setInputMode] = useState<InputMode>('typing');

  const [difficulty, setDifficulty] = useState<Difficulty>(DIFFICULTIES[1]);
  const [phase, setPhase] = useState<GamePhase>('collection-picker');
  const [wave, setWave] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [combo, setCombo] = useState(0);
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [input, setInput] = useState('');
  const [inputState, setInputState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [frozen, setFrozen] = useState(false);
  const [freezeTimer, setFreezeTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [powerUps, setPowerUps] = useState({ freeze: 2, bomb: 1 });
  const [xpPopups, setXpPopups] = useState<{ id: string; x: number; y: number; text: string }[]>([]);
  const [highScore, setHighScore] = useState(0);
  // Multiple choice options for current round
  const [mcOptions, setMcOptions] = useState<string[]>([]);
  const [mcTarget, setMcTarget] = useState<Monster | null>(null);
  const [mcResult, setMcResult] = useState<'idle' | 'correct' | 'wrong'>('idle');

  const inputRef = useRef<HTMLInputElement>(null);
  const arenaRef = useRef<HTMLDivElement>(null);
  const sessionScoreRef = useRef(0);
  const comboRef = useRef(0);
  const waveRef = useRef(wave);
  const diffRef = useRef(difficulty);
  const vocabPoolRef = useRef<{ term: string; meaning: string }[]>([]);

  // Keep refs in sync
  useEffect(() => { waveRef.current = wave; }, [wave]);
  useEffect(() => { diffRef.current = difficulty; }, [difficulty]);

  // Build vocab pool from selection
  useEffect(() => {
    let items = vocabItems.filter(v => v.term && v.meaning);
    if (selectedCollectionId) {
      items = items.filter(v => v.collectionId === selectedCollectionId);
    }
    if (selectedLesson !== 'all') {
      items = items.filter(v => v.lessonTitle === selectedLesson);
    }
    vocabPoolRef.current = items.map(v => ({ term: v.term, meaning: v.meaning }));
  }, [vocabItems, selectedCollectionId, selectedLesson]);

  // Derived: collections with enough vocab
  const playableCollections = collections.filter(c =>
    vocabItems.filter(v => v.collectionId === c.id).length >= 4
  );

  // Lessons in selected collection
  const lessonsInCollection: string[] = selectedCollectionId
    ? [...new Set(
        vocabItems
          .filter(v => v.collectionId === selectedCollectionId && v.lessonTitle)
          .map(v => v.lessonTitle as string)
      )]
    : [];

  const hasVocab = vocabPoolRef.current.length >= 4 || vocabItems.length >= 4;

  // Build MC options for a monster
  function buildMcOptions(target: Monster): string[] {
    const pool = vocabPoolRef.current;
    const wrong = pool
      .filter(v => v.term !== target.term)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(v => v.term);
    return [...wrong, target.term].sort(() => Math.random() - 0.5);
  }

  // ── Spawn logic ─────────────────────────────────────────────────────────────
  const spawnWave = useCallback((waveNum: number, diff: Difficulty) => {
    const pool = vocabPoolRef.current;
    if (pool.length === 0) return;

    const count = diff.waveSize + Math.floor(waveNum / 3); // grow with waves
    const speed = Math.max(2.5, diff.baseSpeed - waveNum * diff.speedStep);
    const emojiSet = MONSTER_EMOJIS[diff.id];
    const now = Date.now();

    const used = new Set<number>();
    const newMonsters: Monster[] = [];

    for (let i = 0; i < count; i++) {
      let idx: number;
      do { idx = Math.floor(Math.random() * pool.length); } while (used.has(idx) && used.size < pool.length);
      used.add(idx);
      const vocab = pool[idx];
      const x = 5 + Math.random() * 80;

      newMonsters.push({
        id: uid(),
        term: vocab.term,
        meaning: vocab.meaning,
        emoji: emojiSet[Math.floor(Math.random() * emojiSet.length)],
        x,
        duration: speed + Math.random() * 1.5,
        spawnTime: now + i * 800, // stagger spawns
        dead: false,
        reached: false,
      });
    }

    setMonsters(newMonsters);
  }, []);

  // ── Start game ──────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    setScore(0);
    setLives(MAX_LIVES);
    setCombo(0);
    setWave(1);
    setMonsters([]);
    setInput('');
    setPowerUps({ freeze: 2, bomb: 1 });
    sessionScoreRef.current = 0;
    comboRef.current = 0;
    setPhase('wave-announce');

    setTimeout(() => {
      setPhase('playing');
      spawnWave(1, diffRef.current);
      inputRef.current?.focus();
    }, 2000);
  }, [spawnWave]);

  // ── Check wave clear ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;
    if (monsters.length === 0) return;

    const allDone = monsters.every(m => m.dead || m.reached);
    if (!allDone) return;

    const newWave = waveRef.current + 1;
    setWave(newWave);
    setPhase('wave-announce');

    setTimeout(() => {
      setPhase('playing');
      spawnWave(newWave, diffRef.current);
    }, 2000);
  }, [monsters, phase, spawnWave]);

  // ── Monster reached base (lose a life) ─────────────────────────────────────
  const monsterReached = useCallback((id: string) => {
    setMonsters(prev => prev.map(m => m.id === id ? { ...m, reached: true } : m));
    setLives(prev => {
      const next = prev - 1;
      if (next <= 0) {
        setTimeout(() => setPhase('game-over'), 300);
      }
      return next;
    });
    setCombo(0);
    comboRef.current = 0;
  }, []);

  // ── Track monsters reaching base via animation end ──────────────────────────
  useEffect(() => {
    if (phase !== 'playing' || frozen) return;
    const now = Date.now();

    const timers = monsters
      .filter(m => !m.dead && !m.reached)
      .map(m => {
        const elapsed = (now - m.spawnTime) / 1000;
        const remaining = Math.max(0, m.duration - elapsed);
        if (remaining <= 0) {
          monsterReached(m.id);
          return null;
        }
        const t = setTimeout(() => monsterReached(m.id), remaining * 1000);
        return t;
      })
      .filter(Boolean);

    return () => timers.forEach(t => clearTimeout(t!));
  }, [monsters, phase, frozen, monsterReached]);

  // ── Game over: record stats ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'game-over') return;
    const finalScore = sessionScoreRef.current;
    gStore.recordGamePlayed('defender', finalScore);
    gStore.updateVocabDefenderScore(finalScore);
    gStore.recordStudySession();
    gStore.addXp(XP_REWARDS.GAME_WIN, getStreakMultiplier(gStore.streak));
    setHighScore(prev => Math.max(prev, finalScore));
  }, [phase]);

  // ── Input handling ──────────────────────────────────────────────────────────
  const handleInput = useCallback((value: string) => {
    setInput(value);
    const norm = normalize(value);
    if (!norm) return;

    const hit = monsters.find(m =>
      !m.dead && !m.reached && normalize(m.term) === norm
    );

    if (hit) {
      // Kill monster
      setMonsters(prev => prev.map(m => m.id === hit.id ? { ...m, dead: true } : m));
      setInput('');
      setInputState('correct');

      const newCombo = comboRef.current + 1;
      comboRef.current = newCombo;
      setCombo(newCombo);

      const basePoints = 100 + newCombo * 10;
      const points = Math.round(basePoints * (newCombo >= 5 ? 1.5 : 1));
      setScore(prev => {
        const next = prev + points;
        sessionScoreRef.current = next;
        return next;
      });

      // XP reward
      gStore.addXp(XP_REWARDS.QUIZ_CORRECT, getStreakMultiplier(gStore.streak));
      gStore.recordCorrectAnswer(true);

      // Floating XP popup
      if (arenaRef.current) {
        const arena = arenaRef.current.getBoundingClientRect();
        const monEl = document.getElementById(`monster-${hit.id}`);
        const monRect = monEl?.getBoundingClientRect();
        const px = monRect ? monRect.left - arena.left + 20 : 200;
        const py = monRect ? monRect.top - arena.top : 100;
        const popup = { id: uid(), x: px, y: py, text: `+${XP_REWARDS.QUIZ_CORRECT} XP` };
        setXpPopups(prev => [...prev, popup]);
        setTimeout(() => setXpPopups(prev => prev.filter(p => p.id !== popup.id)), 900);
      }

      // Unlock power-ups at combo milestones
      if (newCombo === 5)  setPowerUps(prev => ({ ...prev, freeze: prev.freeze + 1 }));
      if (newCombo === 10) setPowerUps(prev => ({ ...prev, bomb: prev.bomb + 1 }));

      setTimeout(() => setInputState('idle'), 400);
    }
  }, [monsters, gStore]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const norm = normalize(input);
      if (norm && !monsters.find(m => !m.dead && !m.reached && normalize(m.term) === norm)) {
        setInputState('wrong');
        setCombo(0);
        comboRef.current = 0;
        setTimeout(() => setInputState('idle'), 400);
        setInput('');
      }
    }
  }, [input, monsters]);

  // ── Multiple Choice handler ──────────────────────────────────────────────────
  const handleMcAnswer = useCallback((chosen: string) => {
    if (!mcTarget || mcResult !== 'idle') return;
    const correct = normalize(chosen) === normalize(mcTarget.term);

    if (correct) {
      setMcResult('correct');
      setMonsters(prev => prev.map(m => m.id === mcTarget.id ? { ...m, dead: true } : m));
      const newCombo = comboRef.current + 1;
      comboRef.current = newCombo;
      setCombo(newCombo);
      const points = Math.round((100 + newCombo * 10) * (newCombo >= 5 ? 1.5 : 1));
      setScore(prev => { const n = prev + points; sessionScoreRef.current = n; return n; });
      gStore.addXp(XP_REWARDS.QUIZ_CORRECT, getStreakMultiplier(gStore.streak));
      gStore.recordCorrectAnswer(true);
      setTimeout(() => { setMcResult('idle'); setMcTarget(null); setMcOptions([]); }, 300);
    } else {
      setMcResult('wrong');
      setCombo(0); comboRef.current = 0;
      gStore.recordCorrectAnswer(false);
      setTimeout(() => setMcResult('idle'), 300);
    }
  }, [mcTarget, mcResult, gStore]);

  // Auto-assign MC target when in MC mode
  useEffect(() => {
    if (inputMode !== 'multiple-choice' || phase !== 'playing') return;
    if (mcResult !== 'idle') return; // Wait for correct/wrong animation to finish
    if (mcTarget && !mcTarget.dead && !mcTarget.reached) return; // still valid
    const alive = monsters.filter(m => !m.dead && !m.reached);
    if (alive.length === 0) { setMcTarget(null); setMcOptions([]); return; }
    // Sort by which monster will hit the base first
    const next = alive.sort((a, b) => {
      const timeA = a.spawnTime + a.duration * 1000;
      const timeB = b.spawnTime + b.duration * 1000;
      return timeA - timeB;
    })[0];
    setMcTarget(next);
    setMcOptions(buildMcOptions(next));
  }, [monsters, inputMode, phase, mcResult, mcTarget]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Power-ups ───────────────────────────────────────────────────────────────
  const activateFreeze = useCallback(() => {
    if (powerUps.freeze <= 0) return;
    setPowerUps(prev => ({ ...prev, freeze: prev.freeze - 1 }));
    setFrozen(true);
    if (freezeTimer) clearTimeout(freezeTimer);
    const t = setTimeout(() => setFrozen(false), 4000);
    setFreezeTimer(t);
  }, [powerUps.freeze, freezeTimer]);

  const activateBomb = useCallback(() => {
    if (powerUps.bomb <= 0) return;
    setPowerUps(prev => ({ ...prev, bomb: prev.bomb - 1 }));
    const aliveCount = monsters.filter(m => !m.dead && !m.reached).length;
    setMonsters(prev => prev.map(m => ({ ...m, dead: true })));
    const bombPoints = aliveCount * 50;
    setScore(prev => {
      const next = prev + bombPoints;
      sessionScoreRef.current = next;
      return next;
    });
    setCombo(0);
    comboRef.current = 0;
  }, [powerUps.bomb, monsters]);

  // Keyboard shortcuts for power-ups
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'playing') return;
      if (e.key === 'F1') { e.preventDefault(); activateFreeze(); }
      if (e.key === 'F2') { e.preventDefault(); activateBomb(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, activateFreeze, activateBomb]);

  // ── Expose testing hooks (Playwright + render_game_to_text) ─────────────────
  useEffect(() => {
    (window as any).render_game_to_text = () => JSON.stringify({
      phase,
      wave,
      score,
      lives,
      combo,
      inputMode,
      monsters_alive: monsters.filter(m => !m.dead && !m.reached).length,
      monsters_total: monsters.length,
      input,
      powerUps,
      frozen,
      selectedCollectionId,
      selectedLesson,
    });

    (window as any).advanceTime = (ms: number) => {
      // Advance game clock — useful for Playwright deterministic testing
      console.log(`[VocabDefender] advanceTime(${ms}ms) called`);
    };

    return () => {
      delete (window as any).render_game_to_text;
      delete (window as any).advanceTime;
    };
  }, [phase, wave, score, lives, combo, monsters, input, powerUps, frozen]);

  // ── Render ──────────────────────────────────────────────────────────────────
  const now = Date.now();

  return (
    <div className={styles.gameRoot} id="vocab-defender-root">
      {/* Starfield */}
      <div className={styles.stars} />

      {/* ── COLLECTION PICKER ──────────────────────────────────────────────── */}
      {phase === 'collection-picker' && (
        <div className={styles.screen}>
          <button className={styles.backBtn} style={{ position: 'absolute', top: 16, left: 16 }} onClick={() => navigate('/games')}>
            ← Games
          </button>
          <div style={{ fontSize: 48 }}>📚</div>
          <div className={styles.screenTitle}>Choose Collection</div>
          <p className={styles.screenSubtitle}>Select a vocabulary collection to defend</p>

          <div className={styles.difficultyGrid} style={{ marginTop: 32 }}>
            {playableCollections.map(c => {
              const vocabCount = vocabItems.filter(v => v.collectionId === c.id).length;
              return (
                <div
                  key={c.id}
                  className={`${styles.difficultyCard} ${selectedCollectionId === c.id ? styles.selected : ''}`}
                  onClick={() => {
                    setSelectedCollectionId(c.id);
                    setSelectedLesson('all');
                    setTimeout(() => setPhase('lesson-picker'), 200);
                  }}
                >
                  <div className={styles.difficultyName}>{c.name}</div>
                  <div className={styles.difficultyDesc}>{vocabCount} words available</div>
                </div>
              );
            })}
          </div>

          {!playableCollections.length && (
            <div className={styles.emptyState}>
              <div className={styles.screenTitle} style={{ fontSize: 24 }}>No Vocabulary Yet</div>
              <p className={styles.screenSubtitle}>Import at least 4 words to play Vocab Defender.</p>
              <button className={styles.primaryBtn} onClick={() => navigate('/import')}>
                Add Vocabulary
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── LESSON PICKER ─────────────────────────────────────────────────── */}
      {phase === 'lesson-picker' && (
        <div className={styles.screen}>
          <button className={styles.backBtn} style={{ position: 'absolute', top: 16, left: 16 }} onClick={() => setPhase('collection-picker')}>
            ← Collections
          </button>
          <div style={{ fontSize: 48 }}>📖</div>
          <div className={styles.screenTitle}>Choose Lesson</div>
          
          <div className={styles.difficultyGrid} style={{ marginTop: 32 }}>
            <div
              className={`${styles.difficultyCard} ${selectedLesson === 'all' ? styles.selected : ''}`}
              onClick={() => {
                setSelectedLesson('all');
                setTimeout(() => setPhase('menu'), 200);
              }}
            >
              <div className={styles.difficultyName}>All Lessons</div>
              <div className={styles.difficultyDesc}>Mix all words</div>
            </div>
            
            {lessonsInCollection.map(lesson => (
              <div
                key={lesson}
                className={`${styles.difficultyCard} ${selectedLesson === lesson ? styles.selected : ''}`}
                onClick={() => {
                  setSelectedLesson(lesson);
                  setTimeout(() => setPhase('menu'), 200);
                }}
              >
                <div className={styles.difficultyName}>{lesson}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MENU SCREEN ─────────────────────────────────────────────────────── */}
      {phase === 'menu' && (
        <div className={styles.screen}>
          {!hasVocab ? (
            <div className={styles.emptyState}>
              <div style={{ fontSize: 64 }}>🎮</div>
              <div className={styles.screenTitle} style={{ fontSize: 24 }}>No Vocabulary Yet</div>
              <p className={styles.screenSubtitle}>Import at least 4 words to play Vocab Defender.</p>
              <button className={styles.primaryBtn} onClick={() => navigate('/import')}>
                Add Vocabulary
              </button>
              <button className={styles.secondaryBtn} onClick={() => navigate('/games')}>
                ← Back to Games
              </button>
            </div>
          ) : (
            <>
              <button className={styles.backBtn} style={{ position: 'absolute', top: 16, left: 16 }} onClick={() => setPhase('collection-picker')}>
                ← Collections
              </button>
              <div style={{ fontSize: 72, filter: 'drop-shadow(0 0 20px #6366f1)' }}>🛡️</div>
              <div className={styles.screenTitle}>Vocab Defender</div>
              <p className={styles.screenSubtitle}>
                Type the English word to destroy monsters before they reach your base!
                <br /><span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>F1 = Freeze • F2 = Bomb</span>
              </p>

              <div className={styles.difficultyGrid}>
                {DIFFICULTIES.map(d => (
                  <div
                    key={d.id}
                    id={`difficulty-${d.id}`}
                    className={`${styles.difficultyCard} ${difficulty.id === d.id ? styles.selected : ''}`}
                    onClick={() => setDifficulty(d)}
                  >
                    <div className={styles.difficultyEmoji}>{d.emoji}</div>
                    <div className={styles.difficultyName}>{d.name}</div>
                    <div className={styles.difficultyDesc}>{d.desc}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  className={`${styles.modeToggleBtn} ${inputMode === 'typing' ? styles.active : ''}`}
                  onClick={() => setInputMode('typing')}
                >
                  ⌨️ Type Answer
                </button>
                <button
                  className={`${styles.modeToggleBtn} ${inputMode === 'multiple-choice' ? styles.active : ''}`}
                  onClick={() => setInputMode('multiple-choice')}
                >
                  🖱️ Multiple Choice
                </button>
              </div>

              {highScore > 0 && (
                <div style={{ color: 'rgba(251,191,36,0.7)', fontSize: 13, fontWeight: 700 }}>
                  🏆 High Score: {highScore.toLocaleString()}
                </div>
              )}

              <button
                id="start-btn"
                className={styles.primaryBtn}
                onClick={startGame}
              >
                🎮 Start Game
              </button>
            </>
          )}
        </div>
      )}

      {/* ── WAVE ANNOUNCE ───────────────────────────────────────────────────── */}
      {phase === 'wave-announce' && (
        <>
          <div className={styles.header}>
            <span className={styles.gameTitle}>🛡️ Vocab Defender</span>
          </div>
          <div className={styles.screen}>
            <div className={styles.waveAnnounceText} id="wave-announce">
              Wave {wave}
            </div>
            <p className={styles.screenSubtitle}>Get ready!</p>
          </div>
        </>
      )}

      {/* ── PLAYING ─────────────────────────────────────────────────────────── */}
      {phase === 'playing' && (
        <>
          {/* Header */}
          <div className={styles.header}>
            <button className={styles.backBtn} onClick={() => navigate('/games')}>← Exit</button>
            <span className={styles.gameTitle}>🛡️ Vocab Defender</span>
            <div className={styles.scoreBoard}>
              <div className={styles.statPill}>
                <span className={styles.statLabel}>Score</span>
                <span className={`${styles.statValue} ${styles.scoreColor}`}>{score.toLocaleString()}</span>
              </div>
              <div className={styles.statPill}>
                <span className={styles.statLabel}>Wave</span>
                <span className={`${styles.statValue} ${styles.waveColor}`}>{wave}</span>
              </div>
              <div className={styles.statPill}>
                <span className={styles.statLabel}>Combo</span>
                <span className={`${styles.statValue} ${styles.comboColor}`}>×{combo}</span>
              </div>
              <div className={styles.livesDisplay}>
                {Array.from({ length: MAX_LIVES }, (_, i) => (
                  <span key={i} className={`${styles.lifeIcon} ${i >= lives ? styles.lost : ''}`}>❤️</span>
                ))}
              </div>
            </div>
          </div>

          {/* Arena */}
          <div className={styles.arena} ref={arenaRef}>
            {frozen && <div className={styles.freezeOverlay} />}

            {/* Monsters */}
            {monsters.filter(m => !m.dead && !m.reached).map(m => {
              const elapsed = (now - m.spawnTime) / 1000;
              if (elapsed < 0) return null; // not spawned yet
              const arenaEl = arenaRef.current;
              const arenaH = arenaEl ? arenaEl.clientHeight : 400;
              const travel = arenaH + 80;
              const remaining = frozen ? m.duration - elapsed : undefined;
              const isMcTarget = inputMode === 'multiple-choice' && mcTarget?.id === m.id;

              return (
                <div
                  key={m.id}
                  id={`monster-${m.id}`}
                  className={`${styles.monster} ${isMcTarget ? styles.mcTargeted : ''}`}
                  style={{
                    left: `${m.x}%`,
                    '--duration': `${m.duration}s`,
                    '--travel': `${travel}px`,
                    animationDelay: `${Math.max(0, (m.spawnTime - Date.now()) / 1000)}s`,
                    animationPlayState: frozen ? 'paused' : 'running',
                  } as React.CSSProperties}
                >
                  <div className={styles.monsterEmoji} style={{ '--emoji-size': '32px' } as React.CSSProperties}>
                    {m.emoji}
                  </div>
                  <div className={styles.monsterLabel}>{m.meaning}</div>
                </div>
              );
            })}

            {/* XP Popups */}
            {xpPopups.map(p => (
              <div
                key={p.id}
                className={styles.xpPopup}
                style={{ left: p.x, top: p.y }}
              >
                {p.text}
              </div>
            ))}

            {/* Base line */}
            <div className={styles.baseLine} />

            {/* Power-up bar */}
            <div className={styles.powerUpBar}>
              <button
                id="powerup-freeze"
                className={`${styles.powerUpBtn} ${powerUps.freeze === 0 ? styles.unavailable : ''}`}
                onClick={activateFreeze}
                title="Freeze (F1) — pause all monsters for 4s"
              >
                ❄️
                <span className={styles.powerUpCount}>{powerUps.freeze}</span>
              </button>
              <button
                id="powerup-bomb"
                className={`${styles.powerUpBtn} ${powerUps.bomb === 0 ? styles.unavailable : ''}`}
                onClick={activateBomb}
                title="Bomb (F2) — destroy all monsters"
              >
                💣
                <span className={styles.powerUpCount}>{powerUps.bomb}</span>
              </button>
            </div>
          </div>

          {/* Input Zone */}
          <div className={styles.inputZone}>
            {combo >= 2 && (
              <div className={`${styles.comboDisplay} ${styles.active}`}>
                🔥 {combo}× COMBO!
              </div>
            )}
            
            {inputMode === 'typing' ? (
              <>
                <input
                  id="word-input"
                  ref={inputRef}
                  className={`${styles.wordInput} ${inputState !== 'idle' ? styles[inputState] : ''} ${frozen ? styles.frozen : ''}`}
                  value={input}
                  onChange={e => handleInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type the English word…"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  disabled={phase !== 'playing'}
                />
                <div className={styles.inputHint}>
                  Press Enter to confirm • F1 Freeze • F2 Bomb
                </div>
              </>
            ) : (
              <div className={styles.mcGrid}>
                {mcTarget ? (
                  <>
                    <div className={styles.mcTargetLabel}>
                      Defend against: <strong>{mcTarget.meaning}</strong> {mcTarget.emoji}
                    </div>
                    <div className={styles.mcButtons}>
                      {mcOptions.map((opt, i) => (
                        <button
                          key={i}
                          className={`${styles.mcOptionBtn} ${mcResult === 'correct' && normalize(opt) === normalize(mcTarget.term) ? styles.correct : ''} ${mcResult === 'wrong' && normalize(opt) === normalize(input) ? styles.wrong : ''}`}
                          onClick={() => {
                            setInput(opt);
                            handleMcAnswer(opt);
                          }}
                          disabled={mcResult !== 'idle' || phase !== 'playing'}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className={styles.mcTargetLabel}>Waiting for target...</div>
                )}
                <div className={styles.inputHint}>
                  Click the correct English translation • F1 Freeze • F2 Bomb
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── GAME OVER ───────────────────────────────────────────────────────── */}
      {phase === 'game-over' && (
        <div className={styles.screen}>
          <div style={{ fontSize: 64 }}>💀</div>
          <div className={styles.screenTitle}>Game Over</div>
          <div className={styles.gameOverStats}>
            <div className={styles.gameOverStat}>
              <div className={styles.gameOverStatValue}>{score.toLocaleString()}</div>
              <div className={styles.gameOverStatLabel}>Score</div>
            </div>
            <div className={styles.gameOverStat}>
              <div className={styles.gameOverStatValue}>{wave}</div>
              <div className={styles.gameOverStatLabel}>Wave</div>
            </div>
            <div className={styles.gameOverStat}>
              <div className={styles.gameOverStatValue}>{highScore.toLocaleString()}</div>
              <div className={styles.gameOverStatLabel}>Best</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button id="play-again-btn" className={styles.primaryBtn} onClick={startGame}>
              🔄 Play Again
            </button>
            <button className={styles.secondaryBtn} onClick={() => navigate('/games')}>
              ← Back to Games
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
