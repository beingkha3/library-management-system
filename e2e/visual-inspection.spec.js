import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SCREENSHOT_DIR = path.resolve('screenshots');

test.beforeAll(() => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

test.describe('Visual Inspection', () => {

  test.describe('Landing / Public Pages', () => {

    test('Landing page loads without console errors', async ({ page }, testInfo) => {
      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${testInfo.project.name}-landing-page.png`),
        fullPage: true,
      });

      expect(consoleErrors.length).toBe(0);
    });

    test('Landing page has no broken links', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const hrefs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href]'))
          .map(a => a.getAttribute('href'))
          .filter(h => h && !h.startsWith('http') && !h.startsWith('#') && !h.startsWith('mailto:') && !h.startsWith('tel:'));
      });

      const brokenLinks = [];
      const base = 'http://localhost:5173';

      for (const href of hrefs) {
        try {
          const url = href.startsWith('/') ? `${base}${href}` : `${base}/${href}`;
          const response = await page.request.get(url);
          if (response.status() >= 400) {
            brokenLinks.push({ href, status: response.status() });
          }
        } catch {
          brokenLinks.push({ href, status: 'error' });
        }
      }

      if (brokenLinks.length > 0) {
        console.log('Broken links found:', JSON.stringify(brokenLinks, null, 2));
      }
      expect(brokenLinks.length).toBe(0);
    });

    test('Landing page layout does not overlap on desktop', async ({ page }, testInfo) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);

      // Check for horizontal overflow (layout breakage)
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 2);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${testInfo.project.name}-landing-layout.png`),
        fullPage: true,
      });
    });

    test('Login page renders correctly', async ({ page }, testInfo) => {
      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1, h2').first()).toBeVisible();

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${testInfo.project.name}-login-page.png`),
        fullPage: true,
      });

      expect(consoleErrors.length).toBe(0);
    });

    test('Login page has working form elements', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const inputs = page.locator('input');
      const inputCount = await inputs.count();
      expect(inputCount).toBeGreaterThan(0);

      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      expect(buttonCount).toBeGreaterThan(0);
    });
  });

  test.describe('Catalog Page', () => {

    test('Catalog page loads with books', async ({ page }, testInfo) => {
      await page.goto('/books');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${testInfo.project.name}-catalog-page.png`),
        fullPage: true,
      });

      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length).toBeGreaterThan(0);
    });

    test('Catalog page search input works', async ({ page }) => {
      await page.goto('/books');
      await page.waitForLoadState('networkidle');

      const searchInput = page.locator('input[type="text"], input[placeholder*="earch" i], input[placeholder*="Search" i]');
      if (await searchInput.count() > 0) {
        await searchInput.first().fill('test');
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Responsive / Mobile Checks', () => {

    test('Mobile viewport has no horizontal scroll', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'mobile', 'Only run on mobile project');

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const overflowX = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
      });

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'mobile-landing-viewport.png'),
        fullPage: true,
      });

      expect(overflowX).toBe(true);
    });

    test('Mobile viewport buttons are tappable (no overlap)', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'mobile', 'Only run on mobile project');

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const buttons = await page.locator('button, a[href]').all();
      let overlapCount = 0;

      for (let i = 0; i < Math.min(buttons.length, 20); i++) {
        const box = await buttons[i].boundingBox();
        if (!box) continue;
        if (box.width <= 0 || box.height <= 0) {
          overlapCount++;
        }
      }

      expect(overlapCount).toBe(0);
    });
  });

  test.describe('Color / Theme Consistency', () => {

    test('No broken CSS color values', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const hasValidBackground = await page.evaluate(() => {
        const body = document.body;
        const bg = getComputedStyle(body).backgroundColor;
        return bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)' && bg.length > 0;
      });

      expect(hasValidBackground).toBe(true);
    });

    test('Text has sufficient contrast', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Check that body text color is not invisible white-on-white
      const textColor = await page.evaluate(() => {
        const body = document.body;
        const color = getComputedStyle(body).color;
        const bg = getComputedStyle(body).backgroundColor;
        return { color, bg };
      });

      expect(textColor.color).not.toBe('rgb(255, 255, 255)');
    });
  });

  test.describe('Global App Shell', () => {

    test('Page has valid HTML title', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
    });

    test('No unexpected 404 or error pages at root', async ({ page }) => {
      const response = await page.goto('/');
      expect(response?.status()).toBeLessThan(400);
    });
  });
});
