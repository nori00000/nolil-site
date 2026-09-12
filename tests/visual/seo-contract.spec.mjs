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

test("search landing page is discoverable and never blocked", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  const robotsText = await robots.text();
  expect(robotsText).not.toContain("Disallow: /shared-farm");

  const sitemap = await request.get("/sitemap.xml");
  const sitemapText = await sitemap.text();
  expect(sitemapText).toContain("https://playworkgrow.club/shared-farm.html");
});

test("shared farm landing declares no plots above the fold and owns its search terms", async ({ page }) => {
  await page.goto("/shared-farm.html", { waitUntil: "networkidle" });

  await expect(page).toHaveTitle(/일산 공유농장 놀일/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://playworkgrow.club/shared-farm.html");

  const description = await page.locator('meta[name="description"]').getAttribute("content");
  expect(description.length).toBeLessThanOrEqual(120);
  expect(description).toContain("일산");
  expect(description).toContain("공유농장");
  expect(description).toContain("주말농장");

  const declaration = page.locator(".declare");
  await expect(declaration).toBeVisible();
  await expect(declaration).toHaveText("구획을 나눠 드리지 않습니다.");
  expect(await declaration.boundingBox()).toBeTruthy();

  await expect(page.locator("h1")).toHaveText("일산의 공유농장, 놀일");
  await expect(page.locator("#compare h2")).toHaveText("주말농장을 찾으셨다면");
});

test("homepage keywords cover the shared farm search terms", async ({ page }) => {
  await page.goto("/index.html", { waitUntil: "domcontentloaded" });
  const keywords = await page.locator('meta[name="keywords"]').getAttribute("content");
  for (const term of ["일산 공유농장", "공유농장", "주말농장 일산", "퇴근 후 농장", "일산 텃밭", "놀일"]) {
    expect(keywords).toContain(term);
  }
});
