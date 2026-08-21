import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

test("homepage has no automated WCAG violations", async ({ page }) => {
  await page.route("https://app.playworkgrow.club/**", (route) => route.abort());
  await page.goto("/index.html", { waitUntil: "networkidle" });
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("analytics stays fail-closed without consent", async ({ page }) => {
  const analyticsRequests = [];
  page.on("request", (request) => {
    if (/googletagmanager|clarity\.ms|wcs\.naver/.test(request.url())) analyticsRequests.push(request.url());
  });
  await page.addInitScript(() => localStorage.removeItem("nolil_analytics_consent"));
  await page.route("https://app.playworkgrow.club/**", (route) => route.abort());
  await page.goto("/index.html", { waitUntil: "networkidle" });
  expect(analyticsRequests).toEqual([]);
  expect(await page.evaluate(() => window.NOLIL_CONFIG.analytics.enabled)).toBe(false);
});
