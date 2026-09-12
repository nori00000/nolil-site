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

  for (const path of ["/shared-farm.html", "/group.html"]) {
    const page = await request.get(path);
    expect(page.ok()).toBe(true);
    const html = await page.text();
    expect(html).not.toMatch(/<meta[^>]+name=["']robots["'][^>]*noindex/i);
    expect(html).not.toMatch(/<meta[^>]+content=["'][^"']*noindex/i);
  }
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
  await expect(declaration).toBeInViewport();
  await expect(page.locator("h1")).toBeInViewport();
  await expect(page.locator('.hero a[data-free-meeting]')).toBeInViewport();

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

test("group page reframes the offer as a shared farm while keeping the real line items", async ({ page }) => {
  await page.goto("/group.html", { waitUntil: "networkidle" });
  await expect(page.locator("h1")).toHaveText("구획 없는 농장에서, 하루를 함께 짓습니다");
  await expect(page.locator("#modules")).toContainText("그 절기의 농사에 손을 보태는 시간");
  await expect(page.locator("#modules")).toContainText("바베큐 · 캠프파이어");
  await expect(page.locator("#price")).toContainText("당일·숙박 포함 모두 1인 30,000원입니다.");
  await expect(page.locator("#price")).toContainText("카라반 최대 6명, 농막 최대 5명");
  await expect(page.locator("#price")).toContainText("기본 30,000원에 포함되는 것과 추가되는 것은 문의 시 표로 안내합니다.");
  await expect(page.locator("#price")).toContainText("예상 인원과 차량 대수를 알려주시면 수용 가능 여부를 확인해 드립니다.");
  // 첫 화면 첫 CTA는 전화 문의로 가는 링크(실제 tel: 링크는 #contact에 단 하나만 둔다 —
  // homepage.spec.mjs의 strict locator 계약)
  const heroCta = page.locator(".hero .cta-row a").first();
  await expect(heroCta).toBeInViewport();
  await expect(heroCta).toHaveText("전화로 문의하기");
  await expect(page.locator('a[href="tel:01022957100"]')).toHaveCount(1);
  await expect(page.locator("body")).not.toContainText("길드하우스");
  await expect(page.locator("body")).not.toContainText("7월 26일");
  const ld = await page.locator('script[type="application/ld+json"]').textContent();
  expect(JSON.parse(ld)["@type"]).toBe("WebPage");
});
