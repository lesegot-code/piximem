import { test, expect, login } from "./fixtures.js";

test.beforeEach(async({ page }) =>
{
  await login(page, "test@test.com");
});

test("the feed shows posts and album activity, favourites first", async({ page }) =>
{
  const items = page.locator("main article");
  await expect(items.first()).toBeVisible();
  await expect(items.first()).toContainText("Favourite");
  await expect(page.getByText("created the album").first()).toBeVisible();

  //every photo in the feed actually loads
  const broken = await page.locator("main article img").evaluateAll((imgs) => imgs.filter((i) => i.complete && i.naturalWidth === 0).length);
  expect(broken).toBe(0);
});

test("feed filters combine and live in the url", async({ page }) =>
{
  await page.getByRole("button", { name: "Everyone" }).click();
  await page.getByLabel("Sort the feed").selectOption("commented");
  await page.getByLabel("Time range").selectOption("week");
  await page.getByRole("complementary").getByRole("button", { name: /#wildlife/ }).click();

  await expect(page).toHaveURL(/feed=global/);
  await expect(page).toHaveURL(/sort=commented/);
  await expect(page).toHaveURL(/range=week/);
  await expect(page).toHaveURL(/tag=%23wildlife/);
  await expect(page.locator("main article").first()).toBeVisible();

  await page.getByRole("button", { name: "Stop filtering by #wildlife" }).click();
  await expect(page).not.toHaveURL(/tag=/);
});

test("posts reported 3 times are hidden but can be shown", async({ page }) =>
{
  await page.goto("/home?feed=global");
  await expect(page.locator("main article").first()).toBeVisible();
  const more = page.getByRole("button", { name: "Load more" });
  if(await more.isVisible()) await more.click();

  await expect(page.getByText("This post is hidden")).toBeVisible();
  await page.getByRole("button", { name: "Show it anyway" }).click();
  await expect(page.getByText("Selling rides")).toBeVisible();
});

test("autocomplete suggests as you type, enter opens all results", async({ page }) =>
{
  const box = page.getByRole("combobox").first();
  await box.fill("elefa");
  await expect(page.getByRole("option").first()).toBeVisible();

  await box.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=elefa/);
  await expect(page.locator("main a[href^='/post/']").first()).toBeVisible();
});

test("search finds people by misspelled name, by email, and albums", async({ page }) =>
{
  await page.goto("/search?q=kableo");
  await expect(page.getByText("@kabelo.drives")).toBeVisible();

  await page.goto("/search?q=tshilidzi@test.com");
  await expect(page.getByText("@tshili")).toBeVisible();

  await page.goto("/search?q=weekend%20drives");
  await expect(page.getByRole("link", { name: "Open album Weekend Drives" })).toBeVisible();
});

test("clicking a hashtag searches for it", async({ page }) =>
{
  await page.locator("main article a.hashtag-text").first().click();
  await expect(page).toHaveURL(/\/search\?q=%23/);
  await expect(page.locator("main a[href^='/post/']").first()).toBeVisible();
});
