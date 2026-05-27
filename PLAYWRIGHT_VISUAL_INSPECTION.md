# Playwright Visual Inspection Guide

This project uses **Playwright** for automated visual inspection of the frontend UI.

## Quick Start

```bash
# Start the app (frontend + backend)
npm run dev

# In another terminal, run the inspection suite:
npm run test:visual
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run test:e2e` | Run all Playwright tests (desktop + mobile) |
| `npm run test:visual` | Run only the visual inspection suite |
| `npm run inspect:ui` | Run Playwright in UI mode (interactive browser) |
| `npx playwright test --project=desktop` | Desktop-only tests |
| `npx playwright test --project=mobile` | Mobile-only tests |

## What the Inspection Checks

### 1. Console Error Detection
Captures all browser console errors (`console.error()`, uncaught exceptions) on every page. Asserts zero errors.

### 2. Broken Link Checks
Scrapes all `<a>` elements on a page, navigates to each internal link, and reports any that return HTTP 4xx/5xx.

### 3. Layout Overlap Detection
- **Desktop**: Checks that body scroll width does not exceed viewport width (horizontal overflow = broken layout).
- **Mobile**: Same check, specifically on 375x667 viewport.

### 4. Theme / Color Consistency
- Ensures body background is visible (not transparent).
- Checks text color is not invisible (e.g., white-on-white).
- Can be extended for brand color palette enforcement.

### 5. Form Element Validation
Verifies login/register pages have working input fields and buttons.

### 6. Responsive Breakpoints
Two projects are configured:
- **Desktop**: 1280x800
- **Mobile**: 375x667 (iPhone SE)

### 7. Screenshot Capture
Screenshots are saved to `screenshots/` for every major page on both viewports.

## Run Modes

### Headless (CI / automation)
```bash
npm run test:visual
```

### UI Mode (interactive debugging)
```bash
npm run inspect:ui
```
Opens the Playwright UI where you can step through each test, inspect the DOM, and see screenshots.

### Single file
```bash
npx playwright test e2e/visual-inspection.spec.js
```

## Screenshots

Screenshots are saved to `screenshots/` with naming convention:
- `{viewport}-{page-name}.png`

These are `.gitignore`d. To capture fresh screenshots before/after a UI fix:
```bash
npm run test:visual
```
Then compare the screenshots in the `screenshots/` folder.

## Playwright MCP (AI Agent Integration)

This project supports **Playwright MCP** for AI-driven browser inspection. The MCP server is configured in OpenCode's MCP settings.

To start the Playwright MCP server manually:
```bash
npx @playwright/mcp@latest --port 8933 --headless --allowed-hosts localhost
```

This allows AI coding agents to control the browser, navigate pages, take screenshots, and inspect the DOM programmatically during development.

## Adding New Tests

Add spec files in the `e2e/` directory:
```js
import { test, expect } from '@playwright/test';

test('my new check', async ({ page }) => {
  await page.goto('/my-page');
  await expect(page.locator('h1')).toContainText('Expected Title');
});
```

Run `npm run test:visual` to verify.

## CI Integration

To run in CI, add to your pipeline:
```bash
npx playwright install chromium
npm run test:visual
```

The HTML report is output to `playwright-report/`.
