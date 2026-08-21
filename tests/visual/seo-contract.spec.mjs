import { test, expect } from "@playwright/test";

test("public crawler surfaces stay available and point to the canonical sitemap", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  const robotsText = await robots.text();
  expect(robotsText).toContain("User-agent: OAI-SearchBot");
  expect(robotsText).toContain("Sitemap: https://playworkgrow.club/sitemap.xml");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  const sitemapText = await sitemap.text();
  expect(sitemapText).toContain("https://playworkgrow.club/rules.html");
  expect(sitemapText).toContain("https://playworkgrow.club/stories/first-free-meeting.html");
});

test("rules page exposes a unique search description and self canonical", async ({ page }) => {
  await page.goto("/rules.html", { waitUntil: "networkidle" });
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://playworkgrow.club/rules.html");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /단계별 요금/);
});
