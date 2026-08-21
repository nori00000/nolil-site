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
  test(`homepage layout contract and visual baseline: ${viewport.name}`, async ({ page }) => {
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
