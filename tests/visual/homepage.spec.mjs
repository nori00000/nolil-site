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

const jsonBody = (body, status = 200) => ({
  status,
  contentType: "application/json; charset=utf-8",
  body: JSON.stringify(body),
});

const jsonRoute = (body, status = 200) => (route) => route.fulfill(jsonBody(body, status));

const meetingsWithSlots = (slots) => ({
  generated_at: "2026-09-12T10:00:00+09:00",
  meetings: slots.map((slot, index) => ({
    id: index + 1,
    title: `${slot} 회차 ${index + 1}`,
    summary: null,
    category: "community",
    starts_at: "2026-09-26T10:00:00+09:00",
    ends_at: "2026-09-26T12:00:00+09:00",
    slot,
    price: 5000,
    capacity: 8,
    remaining: 3,
    status: "open",
    url: `https://app.playworkgrow.club/meetings/${index + 1}`,
  })),
});

test.describe("open rounds", () => {
  // 브라우저 로캘·타임존이 한국이 아니어도 카드는 KST·한국어로 찍혀야 한다.
  test.use({ timezoneId: "UTC", locale: "en-US" });

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
    await expect(first).toContainText("오전");
    await expect(first).toContainText("10:00"); // +09:00 원문이 KST 그대로 보인다(UTC 브라우저에서도)
    await expect(first).toContainText("10,000원");
    await expect(first).toContainText("남은 자리 5석");
    await expect(first).toHaveAttribute("href", "https://app.playworkgrow.club/meetings/123");
    await expect(first.locator(".next")).toContainText("신청하기");

    const second = cards.nth(1);
    await expect(second.locator('[data-testid="round-slot"]')).toHaveText("퇴근 후");
    await expect(second).toContainText("9월 24일");
    await expect(second).toContainText("07:00"); // 19:00 KST
    await expect(second).toContainText("무료");
    await expect(second).toContainText("마감");
    await expect(second).toHaveAttribute("href", "https://app.playworkgrow.club/meetings/124");

    // crop/crop_outcome이 없는 계약 fixture → 작물 배지는 달리지 않는다.
    await expect(page.locator('[data-testid="round-crop"]')).toHaveCount(0);
  });

  test("open rounds badges the crop only when the contract carries one", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const base = {
      summary: null,
      category: "community",
      slot: "weekend",
      capacity: 8,
      remaining: 3,
      price: 5000,
      status: "open",
      starts_at: "2026-09-26T10:00:00+09:00",
      ends_at: "2026-09-26T12:00:00+09:00",
    };
    await prepareWithMeetings(
      page,
      jsonRoute({
        generated_at: "2026-09-12T10:00:00+09:00",
        meetings: [
          { ...base, id: 1, title: "마늘 심기", crop: "마늘", url: "https://app.playworkgrow.club/meetings/1" },
          { ...base, id: 2, title: "흑마늘 만들기", crop: "마늘", crop_outcome: "흑마늘", url: "https://app.playworkgrow.club/meetings/2" },
          // 문자열이 아닌 작물 필드는 그 필드만 무시한다(카드는 남는다).
          { ...base, id: 3, title: "타입 깨진 회차", crop: 42, crop_outcome: {}, url: "https://app.playworkgrow.club/meetings/3" },
        ],
      }),
    );
    await scrollToSelector(page, "#open-rounds");

    const cards = page.locator('[data-testid="open-rounds-list"] .week-card');
    await expect(cards).toHaveCount(3);
    await expect(cards.nth(0).locator('[data-testid="round-crop"]')).toHaveText("작물: 마늘");
    await expect(cards.nth(1).locator('[data-testid="round-crop"]')).toHaveText("작물: 마늘 → 흑마늘");
    await expect(cards.nth(2)).toContainText("타입 깨진 회차");
    await expect(cards.nth(2).locator('[data-testid="round-crop"]')).toHaveCount(0);
  });

  test("open rounds offers time-slot chips once four rounds are open", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await prepareWithMeetings(page, jsonRoute(meetingsWithSlots(["weekend", "morning", "evening", "weekend", "day"])));
    await scrollToSelector(page, "#open-rounds");

    const filter = page.locator('[data-testid="round-filter"]');
    await expect(filter).toBeVisible();

    const cards = page.locator('[data-testid="open-rounds-list"] .week-card');
    await expect(cards).toHaveCount(5);

    await filter.getByRole("button", { name: "주말" }).click();
    await expect(filter.getByRole("button", { name: "주말" })).toHaveAttribute("aria-pressed", "true");
    await expect(filter.getByRole("button", { name: "전체" })).toHaveAttribute("aria-pressed", "false");

    // 카드는 DOM에 남고 hidden만 토글된다.
    await expect(cards).toHaveCount(5);
    const visible = page.locator('[data-testid="open-rounds-list"] .week-card:visible');
    await expect(visible).toHaveCount(2);
    await expect(visible.nth(0).locator('[data-testid="round-slot"]')).toHaveText("주말");
    await expect(visible.nth(1).locator('[data-testid="round-slot"]')).toHaveText("주말");

    await filter.getByRole("button", { name: "전체" }).click();
    await expect(page.locator('[data-testid="open-rounds-list"] .week-card:visible')).toHaveCount(5);
  });

  test("open rounds explains an empty time-slot instead of showing a blank grid", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await prepareWithMeetings(page, jsonRoute(meetingsWithSlots(["weekend", "day", "weekend", "day"])));
    await scrollToSelector(page, "#open-rounds");

    const filter = page.locator('[data-testid="round-filter"]');
    const notice = page.locator('[data-testid="round-filter-empty"]');
    await expect(filter).toBeVisible();
    await expect(notice).toBeHidden();

    await filter.getByRole("button", { name: "출근 전" }).click();
    await expect(page.locator('[data-testid="open-rounds-list"] .week-card:visible')).toHaveCount(0);
    await expect(notice).toBeVisible();
    await expect(notice).toHaveAttribute("role", "status");
    await expect(notice).toContainText("이 시간대에 열린 회차가 없습니다");

    await notice.getByRole("button", { name: "전체 보기" }).click();
    await expect(page.locator('[data-testid="open-rounds-list"] .week-card:visible')).toHaveCount(4);
    await expect(notice).toBeHidden();
    await expect(filter.getByRole("button", { name: "전체" })).toHaveAttribute("aria-pressed", "true");
  });

  test("open rounds hides the chips when three or fewer rounds are open", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await prepareWithMeetings(page, jsonRoute(meetingsWithSlots(["weekend", "morning", "evening"])));
    await scrollToSelector(page, "#open-rounds");

    await expect(page.locator('[data-testid="open-rounds-list"] .week-card')).toHaveCount(3);
    await expect(page.locator('[data-testid="round-filter"]')).toBeHidden();
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

  test("open rounds keeps the fallback when the API is slower than the 3s timeout", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await prepareWithMeetings(page, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3600));
      try {
        await route.fulfill(jsonBody(contractMeetings));
      } catch {
        // 클라이언트가 3초에 abort한 뒤라 fulfill이 실패하는 것이 정상이다.
      }
    });
    await scrollToSelector(page, "#open-rounds");

    const cards = page.locator('[data-testid="open-rounds-list"] .week-card');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText("앱에서 열린 모임 보기");
    await expect(cards.first()).toHaveAttribute("href", "https://app.playworkgrow.club/meetings");
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

  test("open rounds drops contract-violating meetings and keeps the valid one", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const base = {
      summary: null,
      category: "community",
      ends_at: "2026-09-26T12:00:00+09:00",
      slot: "weekend",
      capacity: 8,
      remaining: 3,
      status: "open",
    };
    await prepareWithMeetings(
      page,
      jsonRoute({
        generated_at: "2026-09-12T10:00:00+09:00",
        meetings: [
          // 취소 회차는 계약상 인덱스에 오면 안 된다 → 버린다
          { ...base, id: 1, title: "취소된 회차", starts_at: "2026-09-26T10:00:00+09:00", price: 5000, status: "cancelled", url: "https://app.playworkgrow.club/meetings/1" },
          // 앱 origin이 아니거나 https가 아닌 링크 → 버린다
          { ...base, id: 2, title: "남의 도메인 회차", starts_at: "2026-09-26T10:00:00+09:00", price: 5000, url: "http://app.playworkgrow.club/meetings/2" },
          // 음수 가격 → 버린다
          { ...base, id: 3, title: "음수 가격 회차", starts_at: "2026-09-26T10:00:00+09:00", price: -1, url: "https://app.playworkgrow.club/meetings/3" },
          { ...base, id: 4, title: "정상 회차", starts_at: "2026-09-26T10:00:00+09:00", price: 5000, url: "https://app.playworkgrow.club/meetings/4" },
        ],
      }),
    );
    await scrollToSelector(page, "#open-rounds");

    const cards = page.locator('[data-testid="open-rounds-list"] .week-card');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText("정상 회차");
    await expect(cards.first()).toHaveAttribute("href", "https://app.playworkgrow.club/meetings/4");
  });
});

test.describe("records", () => {
  // 날짜만 있는 값이므로 브라우저 타임존이 UTC여도 KST여도 같은 날짜가 찍혀야 한다.
  test.use({ timezoneId: "UTC" });

  async function prepareWithRecords(page, handler) {
    await prepare(page);
    await page.route("**/records/records.json", handler);
    await page.reload({ waitUntil: "networkidle" });
  }

  test("records renders member activity cards newest first", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await prepareWithRecords(
      page,
      jsonRoute({
        records: [
          { meeting_id: 123, date: "2026-09-19", title: "마늘 밭 만들기", crop: "마늘", summary: "여섯 명이 이랑을 세우고 마늘 200쪽을 심었습니다." },
          { meeting_id: 124, date: "2026-10-04", title: "흑마늘 첫 시험", crop: "마늘", summary: "숙성기 온도를 맞추며 흑마늘 첫 판을 걸었습니다." },
        ],
      }),
    );
    await scrollToSelector(page, "#records");

    const cards = page.locator('[data-testid="records-list"] .week-card');
    await expect(cards).toHaveCount(2);

    const first = cards.nth(0);
    await expect(first).toContainText("흑마늘 첫 시험");
    await expect(first.locator('[data-testid="record-date"]')).toContainText("10월 4일");
    await expect(first.locator('[data-testid="record-crop"]')).toHaveText("작물: 마늘");
    await expect(first).toContainText("숙성기 온도를 맞추며");
    // url이 없으면 원천 회차 링크가 기본값이다.
    await expect(first).toHaveAttribute("href", "https://app.playworkgrow.club/meetings/124");

    await expect(cards.nth(1)).toContainText("마늘 밭 만들기");
    await expect(cards.nth(1).locator('[data-testid="record-date"]')).toContainText("9월 19일");
    await expect(cards.nth(1)).toHaveAttribute("href", "https://app.playworkgrow.club/meetings/123");
  });

  test("records requires a source meeting id and a real calendar date", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await prepareWithRecords(
      page,
      jsonRoute({
        records: [
          { date: "2026-09-19", title: "원천 회차 없는 기록" },
          { meeting_id: "7", date: "2026-09-19", title: "id가 문자열인 기록" },
          { meeting_id: 0, date: "2026-09-19", title: "id가 0인 기록" },
          { meeting_id: 8, date: "2026-02-30", title: "존재하지 않는 날짜" },
          { meeting_id: 9, date: "2026-09", title: "날짜가 아닌 값" },
          { meeting_id: 10, date: "2026-09-19T10:00:00+09:00", title: "datetime 문자열" },
          { meeting_id: 11, date: "2026-09-19", title: "정상 기록" },
        ],
      }),
    );
    await scrollToSelector(page, "#records");

    const cards = page.locator('[data-testid="records-list"] .week-card');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText("정상 기록");
    await expect(cards.first()).toHaveAttribute("href", "https://app.playworkgrow.club/meetings/11");
  });

  test("records keeps only the newest entry per source meeting", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await prepareWithRecords(
      page,
      jsonRoute({
        records: [
          { meeting_id: 55, date: "2026-09-19", title: "옛 기록" },
          { meeting_id: 55, date: "2026-10-04", title: "고쳐 쓴 기록" },
          { meeting_id: 56, date: "2026-09-01", title: "다른 회차 기록" },
        ],
      }),
    );
    await scrollToSelector(page, "#records");

    const cards = page.locator('[data-testid="records-list"] .week-card');
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(0)).toContainText("고쳐 쓴 기록");
    await expect(cards.nth(1)).toContainText("다른 회차 기록");
    await expect(page.locator('[data-testid="records-list"]')).not.toContainText("옛 기록");
  });

  test("records drops images that escape the records image folder", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await prepareWithRecords(
      page,
      jsonRoute({
        records: [
          { meeting_id: 1, date: "2026-09-19", title: "경로 탈출 사진", image: "images/records/%2e%2e/%2e%2e/config.js" },
          { meeting_id: 2, date: "2026-09-18", title: "외부 도메인 사진", image: "https://evil.example.com/images/records/x.webp" },
          { meeting_id: 3, date: "2026-09-17", title: "상대 경로 탈출 사진", image: "images/records/../../config.js" },
        ],
      }),
    );
    await scrollToSelector(page, "#records");

    const cards = page.locator('[data-testid="records-list"] .week-card');
    await expect(cards).toHaveCount(3);
    await expect(page.locator('[data-testid="records-list"] img')).toHaveCount(0);
  });

  test("records keeps the empty-state card when there is nothing recorded yet", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await prepareWithRecords(page, jsonRoute({ records: [] }));
    await scrollToSelector(page, "#records");

    const cards = page.locator('[data-testid="records-list"] .week-card');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText("첫 회차가 열리면 첫 기록이 여기 올라옵니다");
    await expect(cards.first()).toHaveAttribute("href", "#open-rounds");
  });

  test("records keeps the empty-state card when the data file fails", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await prepareWithRecords(page, (route) =>
      route.fulfill({ status: 500, contentType: "text/plain", body: "boom" }),
    );
    await scrollToSelector(page, "#records");

    const cards = page.locator('[data-testid="records-list"] .week-card');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText("첫 회차가 열리면 첫 기록이 여기 올라옵니다");
    await expect(cards.first()).toHaveAttribute("href", "#open-rounds");
  });
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
