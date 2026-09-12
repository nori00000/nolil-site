import { test, expect } from "@playwright/test";

const viewports = [
  { name: "mobile-360", width: 360, height: 800 },
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

async function scrollToSelector(page, selector) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
}

// prepare()가 app.playworkgrow.club/** 를 abort 하므로, 공개 모임 API만 나중에 덮어쓰고
// 다시 로드한다(나중에 등록된 route가 우선).
async function prepareWithMeetings(page, handler) {
  await prepare(page);
  await page.route("**/api/public/meetings", handler);
  await page.reload({ waitUntil: "networkidle" });
}

const contractMeetings = {
  generated_at: "2026-09-12T10:00:00+09:00",
  meetings: [
    {
      id: 123,
      title: "마늘 밭 만들기",
      summary: null,
      category: "community",
      starts_at: "2026-09-19T10:00:00+09:00",
      ends_at: "2026-09-19T12:00:00+09:00",
      slot: "weekend",
      price: 10000,
      capacity: 8,
      remaining: 5,
      status: "open",
      url: "https://app.playworkgrow.club/meetings/123",
    },
    {
      id: 124,
      title: "흑마늘 첫 시험",
      summary: null,
      category: "community",
      starts_at: "2026-09-24T19:00:00+09:00",
      ends_at: "2026-09-24T21:00:00+09:00",
      slot: "evening",
      price: 0,
      capacity: 6,
      remaining: 0,
      status: "full",
      url: "https://app.playworkgrow.club/meetings/124",
    },
  ],
};

const jsonRoute = (body, status = 200) => (route) =>
  route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(body),
  });

test("open rounds renders the public meetings contract as cards", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepareWithMeetings(page, jsonRoute(contractMeetings));
  await scrollToSelector(page, "#open-rounds");

  const cards = page.locator('[data-testid="open-rounds-list"] .week-card');
  await expect(cards).toHaveCount(2);

  const first = cards.nth(0);
  await expect(first.locator('[data-testid="round-slot"]')).toHaveText("주말");
  await expect(first).toContainText("마늘 밭 만들기");
  await expect(first).toContainText("9월 19일");
  await expect(first).toContainText("10,000원");
  await expect(first).toContainText("남은 자리 5석");
  await expect(first).toHaveAttribute("href", "https://app.playworkgrow.club/meetings/123");
  await expect(first.locator(".next")).toContainText("신청하기");

  const second = cards.nth(1);
  await expect(second.locator('[data-testid="round-slot"]')).toHaveText("퇴근 후");
  await expect(second).toContainText("무료");
  await expect(second).toContainText("마감");
  await expect(second).toHaveAttribute("href", "https://app.playworkgrow.club/meetings/124");
});

test("open rounds keeps the app-link fallback when the API fails", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepareWithMeetings(page, (route) =>
    route.fulfill({ status: 500, contentType: "text/plain", body: "boom" }),
  );
  await scrollToSelector(page, "#open-rounds");

  const cards = page.locator('[data-testid="open-rounds-list"] .week-card');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toHaveAttribute("href", "https://app.playworkgrow.club/meetings");
  await expect(cards.first()).toContainText("앱에서 열린 모임 보기");
});

test("open rounds states the empty case instead of a blank section", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepareWithMeetings(page, jsonRoute({ generated_at: "2026-09-12T10:00:00+09:00", meetings: [] }));
  await scrollToSelector(page, "#open-rounds");

  const cards = page.locator('[data-testid="open-rounds-list"] .week-card');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("지금 열린 회차가 없습니다");
  await expect(cards.first()).toHaveAttribute("href", "https://app.playworkgrow.club/meetings");
});

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

  test(`homepage post-hero viewport evidence: ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await prepare(page);
    await scrollToSelector(page, "#weekly");
    await expect(page).toHaveScreenshot(`${viewport.name}-weekly-viewport.png`);
  });
}

test("homepage key conversion sections remain visible on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page);

  await scrollToSelector(page, "#weekly");
  await expect(page.locator("#weekly")).toContainText("가까운 무료 모임에서 먼저 만나세요");
  await expect(page.locator('#weekly a[href*="meetings?price=free"]')).toBeVisible();

  await scrollToSelector(page, "#group-inquiry");
  await expect(page.locator("#group-inquiry")).toContainText("단체 대관은 개인 무료 모임과 분리");
  await expect(page.locator('#group-inquiry a[href="group.html"]')).toBeVisible();
  await expect(page.locator('#group-inquiry [data-testid="stay-note"]')).toBeVisible();
  await expect(page).toHaveScreenshot("mobile-390-group-inquiry-viewport.png");
});

test("required homepage images load with accessible names", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page);
  await page.evaluate(async () => {
    for (const y of [0, 600, 1200, 1800, 2400, 3200, document.body.scrollHeight]) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    await Promise.all(
      Array.from(document.querySelectorAll("main img, .hero-photo"), async (img) => {
        if (typeof img.decode === "function") {
          try {
            await img.decode();
          } catch {
            // Broken images are caught by naturalWidth/naturalHeight assertions below.
          }
        }
      }),
    );
  });

  const images = await page.locator("main img, .hero-photo").evaluateAll((elements) =>
    elements.map((img) => ({
      alt: img.getAttribute("alt") || "",
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    })),
  );

  expect(images.length).toBeGreaterThan(0);
  for (const image of images) {
    expect(image.alt.trim().length).toBeGreaterThan(8);
    expect(image.complete).toBe(true);
    expect(image.naturalWidth).toBeGreaterThan(0);
    expect(image.naturalHeight).toBeGreaterThan(0);
  }
});

test("group inquiry remains a distinct secondary path", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/group.html", { waitUntil: "networkidle" });
  const phone = page.locator('a[href="tel:01022957100"]');
  await expect(phone).toBeVisible();
  await expect(phone).toContainText("010-2295-7100");
  await expect(page.locator('a[href="index.html"]')).toHaveCount(0);
});

test("group page visual baseline", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/group.html", { waitUntil: "networkidle" });
  await expect(page.locator(".hero")).toHaveScreenshot("mobile-390-group-hero.png");
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
