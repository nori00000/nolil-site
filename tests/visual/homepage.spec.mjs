import { test, expect } from "@playwright/test";

const viewports = [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-412", width: 412, height: 915 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1440", width: 1440, height: 900 },
];

async function prepare(page) {
  await page.route("https://app.playworkgrow.club/**", (route) => route.abort());
  await page.goto("/index.html", { waitUntil: "networkidle" });
  await page.addStyleTag({
    content: "* { animation: none !important; transition: none !important; }",
  });
  await page.evaluate(() => document.fonts?.ready);
}

for (const viewport of viewports) {
  test(`homepage layout contract: ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await prepare(page);

    const contract = await page.evaluate(() => {
      const hero = document.querySelector(".hero");
      const heroImage = document.querySelector(".hero-photo");
      const heroCta = document.querySelector("#ctaHero");
      const ctaRect = heroCta?.getBoundingClientRect();
      const heroRect = hero?.getBoundingClientRect();
      const imageRect = heroImage?.getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        heroHeight: heroRect?.height ?? 0,
        heroImageHeight: imageRect?.height ?? 0,
        ctaVisible: Boolean(ctaRect && ctaRect.bottom > 0 && ctaRect.top < window.innerHeight),
        phoneHref: document.querySelector("#officialPhone")?.getAttribute("href"),
        freeHref: document.querySelector("#ctaHero")?.getAttribute("href"),
      };
    });

    expect(contract.overflow).toBe(false);
    expect(contract.ctaVisible).toBe(true);
    expect(contract.phoneHref).toBe("tel:01022957100");
    expect(contract.freeHref).toContain("price=free");
    expect(contract.heroImageHeight).toBeGreaterThan(0);
    expect(contract.heroImageHeight).toBeLessThanOrEqual(contract.heroHeight);

  });

  test(`homepage visual baseline: ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await prepare(page);
    await expect(page.locator(".hero")).toHaveScreenshot(`${viewport.name}-hero.png`);
  });
}

test("group inquiry remains a distinct secondary path", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/group.html", { waitUntil: "networkidle" });
  const phone = page.locator('a[href="tel:01022957100"]');
  await expect(phone).toBeVisible();
  await expect(phone).toContainText("010-2295-7100");
  await expect(page.locator('a[href="index.html"]')).toHaveCount(0);
});

test("homepage makes accommodation and its pricing rule explicit", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/index.html", { waitUntil: "networkidle" });
  const stay = page.locator('[data-testid="stay-note"]');
  await expect(stay).toBeVisible();
  await expect(stay).toContainText("숙박 포함 요금제");
  await expect(stay).toContainText("당일·숙박 포함 모두 1인 30,000원");
  await expect(stay).toContainText("카라반 최대 6명");
  await expect(stay).toContainText("농막 최대 5명");
  await expect(stay).toContainText("캠핑사이트 최대 10곳");
  await expect(stay).toContainText("실내 교육장 약 30평");
  await expect(page.locator('img[alt*="숙박 공간"]')).toHaveCount(1);
});

test("homepage exposes a truthful post-free path without replacing the primary CTA", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/index.html", { waitUntil: "networkidle" });
  await expect(page.locator("#ctaHero")).toHaveAttribute("href", /meetings\?price=free/);
  await expect(page.locator('[data-funnel="paid-path"]')).toHaveAttribute("href", "rules.html");
  await expect(page.locator('[data-funnel="return-path"]')).toHaveAttribute("href", "letter/");
  await expect(page.locator('[data-funnel="paid-path"]')).toContainText("요금 구조");
});

test("free-meeting landing defers volatile schedule claims to the app", async ({ page }) => {
  await page.goto("/moim/index.html", { waitUntil: "networkidle" });
  await expect(page.locator(".hero")).toContainText("신청 페이지에서 최신 내용으로 확인합니다");
  await expect(page.locator(".badges")).not.toContainText("회당 10명");
  await expect(page.locator(".next-step a[href='../rules.html']")).toBeVisible();
  await expect(page.locator(".next-step a[href='../letter/']")).toBeVisible();
});

test("first-meeting story does not promise volatile capacity or fixed weekdays", async ({ page }) => {
  await page.goto("/stories/first-free-meeting.html", { waitUntil: "networkidle" });
  const body = await page.locator("body").innerText();
  expect(body).not.toContain("화요일엔");
  expect(body).not.toContain("목요일엔");
  expect(body).not.toContain("열 자리뿐");
  await expect(page.locator(".cta-band")).toContainText("신청 가능한 날짜와 잔여석");
});
