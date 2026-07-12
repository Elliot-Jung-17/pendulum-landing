// Ad-hoc design-review screenshots (not part of CI): hero, scrolled nav,
// capabilities and validation sections. Usage: node scripts/landing-screens.mjs
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const base = process.argv[2] ?? 'http://127.0.0.1:4177';
const out = 'reports/design-screens';
await mkdir(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(base, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
await page.screenshot({ path: `${out}/hero.png` });

await page.evaluate(() => document.getElementById('capabilities')?.scrollIntoView());
await page.waitForTimeout(1400);
await page.screenshot({ path: `${out}/capabilities.png` });

await page.evaluate(() => document.getElementById('validation')?.scrollIntoView());
await page.waitForTimeout(1400);
await page.screenshot({ path: `${out}/validation.png` });

await page.evaluate(() => document.getElementById('guide')?.scrollIntoView());
await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/guide.png` });

await browser.close();
console.log('written', out);
