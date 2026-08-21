import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

const ANALYTICS_PATTERN = /googletagmanager|clarity\.ms|wcs\.naver/;
const CONSENT_KEY = "nolil_analytics_consent";
const REAL_CONFIG = await readFile(new URL("../../config.js", import.meta.url), "utf8");
const FAKE_ANALYTICS_CONFIG = REAL_CONFIG.replace(
  /enabled: (?:true|false),\n\t\tga4: \"[^\"]*\",\n\t\tclarity: \"[^\"]*\",\n\t\tnaverVerify: \"[^\"]*\",\n\t\tnaverWcs: \"[^\"]*\",/,
  "enabled: true,\n\t\tga4: \"G-TEST12345\",\n\t\tclarity: \"claritytest\",\n\t\tnaverVerify: \"naververifytest\",\n\t\tnaverWcs: \"naverwcstest\",",
);

const captureAnalyticsRequests = (page) => {
  const analyticsRequests = [];
  page.on("request", (request) => {
    if (ANALYTICS_PATTERN.test(request.url())) analyticsRequests.push(request.url());
  });
  return analyticsRequests;
};

const useFakeAnalyticsConfig = async (page) => {
  await page.route("**/config.js", (route) => route.fulfill({
    contentType: "text/javascript",
    body: FAKE_ANALYTICS_CONFIG,
  }));
  await page.route(/googletagmanager|clarity\.ms|wcs\.naver/, (route) => route.abort());
};

test("homepage has no automated WCAG violations", async ({ page }) => {
  await page.route("https://app.playworkgrow.club/**", (route) => route.abort());
  await page.goto("/index.html", { waitUntil: "networkidle" });
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("analytics stays fail-closed without consent", async ({ page }) => {
  // Given: the visitor has not made an analytics choice.
  const analyticsRequests = captureAnalyticsRequests(page);
  await page.addInitScript((key) => localStorage.removeItem(key), CONSENT_KEY);
  await page.route("https://app.playworkgrow.club/**", (route) => route.abort());

  // When: the homepage loads with production analytics configured.
  await page.goto("/index.html", { waitUntil: "networkidle" });

  // Then: no analytics provider is contacted and the banner is available.
  expect(analyticsRequests).toEqual([]);
  expect(await page.evaluate(() => window.NOLIL_ANALYTICS.isEnabled())).toBe(false);
  await expect(page.getByRole("button", { name: "동의" })).toBeVisible();
});

test("Naver ownership verification is available without analytics consent", async ({ page }) => {
  await page.addInitScript((key) => localStorage.removeItem(key), CONSENT_KEY);
  await page.route("https://app.playworkgrow.club/**", (route) => route.abort());
  await page.goto("/index.html", { waitUntil: "networkidle" });

  const verification = page.locator('meta[name="naver-site-verification"]');
  await expect(verification).toHaveAttribute("content", "39ad44e87fb5281b7a3fed3e76f5d54efb1519a7");
});

test("analytics does not load before consent even when IDs are configured", async ({ page }) => {
  // Given: analytics IDs exist but the visitor has not consented.
  const analyticsRequests = captureAnalyticsRequests(page);
  await page.addInitScript((key) => localStorage.removeItem(key), CONSENT_KEY);
  await useFakeAnalyticsConfig(page);
  await page.route("https://app.playworkgrow.club/**", (route) => route.abort());

  // When: the homepage loads.
  await page.goto("/index.html", { waitUntil: "networkidle" });

  // Then: configured analytics remains blocked behind the consent banner.
  expect(analyticsRequests).toEqual([]);
  await expect(page.getByRole("button", { name: "동의" })).toBeVisible();
});

test("analytics denial persists and keeps providers blocked", async ({ page }) => {
  // Given: analytics IDs exist and the visitor previously rejected analytics.
  const analyticsRequests = captureAnalyticsRequests(page);
  await page.addInitScript((key) => localStorage.setItem(key, "denied"), CONSENT_KEY);
  await useFakeAnalyticsConfig(page);
  await page.route("https://app.playworkgrow.club/**", (route) => route.abort());

  // When: the homepage loads.
  await page.goto("/index.html", { waitUntil: "networkidle" });

  // Then: providers are not contacted and settings can be reopened.
  expect(analyticsRequests).toEqual([]);
  await expect(page.getByRole("button", { name: "동의" })).toBeHidden();
  await page.getByRole("button", { name: "분석 설정" }).click();
  await expect(page.getByRole("button", { name: "거부" })).toBeFocused();
});

test("analytics loads configured providers after granted consent", async ({ page }) => {
  // Given: analytics IDs exist and the visitor has granted consent.
  const analyticsRequests = captureAnalyticsRequests(page);
  await page.addInitScript((key) => localStorage.setItem(key, "granted"), CONSENT_KEY);
  await useFakeAnalyticsConfig(page);
  await page.route("https://app.playworkgrow.club/**", (route) => route.abort());

  // When: the homepage loads.
  await page.goto("/index.html", { waitUntil: "networkidle" });

  // Then: all configured analytics providers are requested.
  expect(analyticsRequests).toEqual(expect.arrayContaining([
    expect.stringContaining("googletagmanager.com/gtag/js?id=G-TEST12345"),
    expect.stringContaining("clarity.ms/tag/claritytest"),
    expect.stringContaining("wcs.naver.net/wcslog.js"),
  ]));
});

test("analytics withdrawal reloads and blocks later provider requests", async ({ page }) => {
  // Given: analytics loaded from a previous granted choice.
  const analyticsRequests = captureAnalyticsRequests(page);
  await page.addInitScript((key) => {
    if (localStorage.getItem(key) === null) localStorage.setItem(key, "granted");
  }, CONSENT_KEY);
  await useFakeAnalyticsConfig(page);
  await page.route("https://app.playworkgrow.club/**", (route) => route.abort());
  await page.goto("/index.html", { waitUntil: "networkidle" });
  expect(analyticsRequests.length).toBeGreaterThan(0);
  analyticsRequests.length = 0;

  // When: the visitor reopens settings and rejects analytics.
  await page.getByRole("button", { name: "분석 설정" }).click();
  await page.getByRole("button", { name: "거부" }).click();
  await page.waitForLoadState("networkidle");

  // Then: the denied choice persists and providers are not requested again.
  expect(await page.evaluate((key) => localStorage.getItem(key), CONSENT_KEY)).toBe("denied");
  expect(analyticsRequests).toEqual([]);
});

test("homepage analytics events use a PII-safe allowlist", async ({ page }) => {
  // Given: the homepage analytics event contract is loaded.
  await page.addInitScript((key) => localStorage.setItem(key, "granted"), CONSENT_KEY);
  await useFakeAnalyticsConfig(page);
  await page.route("https://app.playworkgrow.club/**", (route) => route.abort());
  await page.goto("/index.html", { waitUntil: "networkidle" });

  // When: the public event allowlist is inspected.
  const events = await page.evaluate(() => window.NOLIL_ANALYTICS_EVENTS);

  // Then: only homepage funnel events are available, with no personal fields.
  expect(events).toEqual([
    "homepage_view",
    "free_meeting_click",
    "group_inquiry_click",
    "tel_click",
    "paid_path_click",
    "return_path_click",
  ]);
  expect(events.join(" ")).not.toMatch(/name|phone|email|memo|contact|message/i);
});
