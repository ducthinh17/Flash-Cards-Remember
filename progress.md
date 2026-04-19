# Vocab Defender — Game Progress

Original prompt: Build VocabDefender tower defense game với XP integration, Playwright tested

## Status: ✅ Phase 1 Complete

### Features Implemented
- [x] Full tower-defense gameplay loop (menu → wave announce → playing → game over)
- [x] Monster spawn system with staggered timing and lane assignment
- [x] Real-time typing input with auto-match detection
- [x] 3 difficulty levels (Easy 8s / Normal 6s / Hard 4s)
- [x] Score system: 100 base + 10×combo per correct answer
- [x] Combo multiplier system (×1.5 at combo 5+)
- [x] ❄️ Freeze power-up (pauses all monsters 4s)
- [x] 💣 Bomb power-up (destroys all monsters, +50 per)
- [x] Power-ups awarded at combo milestones (5 = freeze, 10 = bomb)
- [x] Lives system (3 hearts, game over at 0)
- [x] Wave progression (waves get faster + bigger each round)
- [x] XP integration with useGamificationStore
- [x] window.render_game_to_text() for Playwright testing
- [x] window.advanceTime(ms) hook
- [x] Floating XP popups on kill
- [x] Starfield background with twinkling CSS animation
- [x] Castle 🏰 base line
- [x] Freeze overlay (blue border + bg pulse)

### Test Results (Playwright)
- ✅ Menu screen: phase=menu, 3 difficulty cards visible, Start Game button
- ✅ Wave announce: phase=wave-announce → transitions to playing after 2s
- ✅ Playing: monsters_alive=3, score accumulates correctly
- ✅ Correct answer: score +110, combo +1, monster destroyed
- ✅ Wrong answer: combo resets to 0
- ✅ Freeze power-up: frozen=true, freeze count 2→1
- ✅ Bomb: all monsters cleared, score +100 (2×50), wave 1→2

### Files Created
- `src/pages/VocabDefender.tsx` — main game
- `src/pages/VocabDefender.module.css` — space theme styles
- `src/components/gamification/XPBar.tsx`
- `src/components/gamification/StreakBadge.tsx`
- `src/components/gamification/LevelUpModal.tsx`
- `src/components/gamification/AchievementToast.tsx`
- `src/components/gamification/Gamification.module.css`
- `src/components/gamification/index.tsx`
- `src/store/useGamificationStore.ts`
- `src/vite-env.d.ts`

### TODOs & Next Steps
- [x] Integrate Global XP (Study, Quiz, Active Recall)
- [x] Floating +XP Popups
- [x] Collection and Lesson Picker UI for Vocab Defender
- [x] Multiple Choice (MC) Mode added to Vocab Defender
- [ ] Add `vocabDefenderHighScore` field to useGamificationStore (currently undefined)
- [ ] Animate monster death with CSS class `.exploding`
- [ ] Add sound effects (Web Audio API, no external libs)
- [ ] Add difficulty scaling beyond wave 10 (boss waves)
- [ ] **Word Chain game** (Phase 3)
- [ ] Achievement integration: "First Win", "Combo King", "Wave 10 Survivor"
- [ ] Leaderboard / score persistence beyond session

### Known Gotchas
- Zustand persist key for main store is `flashcard-storage` (not `flashcard-store`)
- CSS Modules need `src/vite-env.d.ts` with `declare module '*.module.css'`
- Monster timing uses CSS animation + setTimeout, so freeze works by `animationPlayState: paused`
- `addInitScript` must inject to `flashcard-storage` key for vocab to appear
