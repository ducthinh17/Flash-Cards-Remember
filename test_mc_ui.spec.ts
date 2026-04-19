import { test, expect } from '@playwright/test';

test('Vocab Defender MC Mode UI Test', async ({ page }) => {
  // Inject mock state
  await page.addInitScript(() => {
    localStorage.setItem('flashcard-gamification', JSON.stringify({
      state: { xp: 120, level: 3, streak: 5 },
      version: 0
    }));
    localStorage.setItem('flashcard-storage', JSON.stringify({
      state: {
        collections: [{ id: 'col1', name: 'Test Col 1', createdAt: 0 }],
        vocab: [
          { id: 'v1', collectionId: 'col1', term: 'apple', meaning: 'qua tao', lessonTitle: 'L1' },
          { id: 'v2', collectionId: 'col1', term: 'banana', meaning: 'qua chuoi', lessonTitle: 'L1' },
          { id: 'v3', collectionId: 'col1', term: 'cherry', meaning: 'qua anh dao', lessonTitle: 'L1' },
          { id: 'v4', collectionId: 'col1', term: 'date', meaning: 'qua cha la', lessonTitle: 'L1' },
          { id: 'v5', collectionId: 'col1', term: 'elderberry', meaning: 'qua com chay', lessonTitle: 'L1' },
        ],
      },
      version: 0
    }));
  });

  await page.goto('http://localhost:3001/games/defender');
  
  // Wait for React to mount
  await page.waitForTimeout(500);

  console.log('Collection Picker Phase:');
  const collectionsState = await page.evaluate(() => (window as any).render_game_to_text?.());
  console.log(collectionsState);
  await page.screenshot({ path: '/Users/thinhpld0/.gemini/antigravity/brain/62f82155-3f17-4fb8-bcd0-48efe1924aef/browser/vocab_mc_1_collection.webp' });

  // Click the first collection
  await page.click('text=Test Col 1');
  await page.waitForTimeout(500);

  console.log('Lesson Picker Phase:');
  const lessonState = await page.evaluate(() => (window as any).render_game_to_text?.());
  console.log(lessonState);
  await page.screenshot({ path: '/Users/thinhpld0/.gemini/antigravity/brain/62f82155-3f17-4fb8-bcd0-48efe1924aef/browser/vocab_mc_2_lesson.webp' });

  // Click 'All Lessons'
  await page.click('text=All Lessons');
  await page.waitForTimeout(500);

  console.log('Menu Phase:');
  const menuState = await page.evaluate(() => (window as any).render_game_to_text?.());
  console.log(menuState);
  await page.screenshot({ path: '/Users/thinhpld0/.gemini/antigravity/brain/62f82155-3f17-4fb8-bcd0-48efe1924aef/browser/vocab_mc_3_menu.webp' });

  // Click Multiple Choice mode
  await page.click('text=🖱️ Multiple Choice');
  await page.waitForTimeout(200);

  // Start game
  await page.click('text=🎮 Start Game');
  await page.waitForTimeout(1000); // Wait for wave to start
  await page.waitForTimeout(1000); // Wait for monsters to spawn
  await page.waitForTimeout(1000);

  console.log('Playing Phase (MC):');
  const playingState = await page.evaluate(() => (window as any).render_game_to_text?.());
  console.log(playingState);
  await page.screenshot({ path: '/Users/thinhpld0/.gemini/antigravity/brain/62f82155-3f17-4fb8-bcd0-48efe1924aef/browser/vocab_mc_4_playing.webp' });

  // Try to click an option
  // Note: we don't know the exact text, so let's just click the first button in mcButtons
  const buttons = await page.$$('.VocabDefender_mcOptionBtn__\\w+'); // The class is hashed by CSS modules, we might need to use exact text or a more generic selector.
  if (buttons.length > 0) {
     await buttons[0].click();
     await page.waitForTimeout(300);
     await page.screenshot({ path: '/Users/thinhpld0/.gemini/antigravity/brain/62f82155-3f17-4fb8-bcd0-48efe1924aef/browser/vocab_mc_5_clicked.webp' });
  }

});
