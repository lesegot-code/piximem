import path from "node:path";
import { test, expect, login } from "./fixtures.js";

const PHOTOS = path.join(import.meta.dirname, "..", "..", "backend", "seed-images");

test.beforeEach(async({ page }) =>
{
  await login(page, "test@test.com");
});

test("share a post, edit it, comment, save it to an album and delete it", async({ page }) =>
{
  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Share a Memory" }).click();
  const dialog = page.getByRole("dialog");

  //a photo is required
  await dialog.getByRole("button", { name: "Share" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Add a photo first");

  await dialog.locator("input[type=file]").setInputFiles(path.join(PHOTOS, "Lion1.jpg"));
  await dialog.getByLabel("Caption").fill("Lion at Kruger, early morning drive.");
  await dialog.locator("#post-tags").fill("wildlife Kruger");
  await expect(dialog.getByRole("button", { name: "Remove #kruger" })).toBeVisible();
  await dialog.getByRole("button", { name: "Share" }).click();

  const card = page.locator("main article").filter({ hasText: "Lion at Kruger" });
  await expect(card).toBeVisible();
  await card.getByRole("link", { name: "Open post" }).click();

  //owner options, no report button on your own post
  await expect(page.getByRole("button", { name: "Report" })).toHaveCount(0);
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("dialog").getByLabel("Caption").fill("Lion at Kruger, edited.");
  await page.getByRole("dialog").getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Lion at Kruger, edited.")).toBeVisible();

  await page.getByLabel("Add a comment").fill("A comment from the test");
  await page.getByRole("button", { name: "Post comment" }).click();
  await expect(page.getByText("A comment from the test")).toBeVisible();

  await page.getByRole("button", { name: "Save to album" }).click();
  await page.getByLabel("New album").fill("Big cats");
  await page.getByRole("dialog").getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("link", { name: /Big cats/ })).toBeVisible();

  //it's the only photo in "Big cats", so that album goes too
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete post" }).click();
  await expect(page.getByText("along with 1 empty album")).toBeVisible();
  await expect(page).toHaveURL(/\/profile\//);
});

test("make an album with suggested hashtags, then edit, add to and remove from it", async({ page }) =>
{
  await page.goto("/home");
  await page.getByRole("link", { name: "My albums" }).click();
  await page.getByRole("button", { name: "+ New album" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Album name").fill("Test trip");
  const photos = dialog.locator("fieldset label");
  await photos.nth(0).click();
  await photos.nth(2).click();

  //hashtags from the chosen photos are suggested, most used first
  const first = dialog.getByRole("button", { name: /^\+ #/ }).first();
  await expect(first).toContainText("#nature");
  await first.click();
  await dialog.getByRole("button", { name: "Create album" }).click();

  await expect(page.getByRole("heading", { name: "Test trip" })).toBeVisible();
  await expect(page.locator("main ul a[href^='/post/']")).toHaveCount(2);

  await page.getByRole("button", { name: "Edit details" }).click();
  await page.getByRole("dialog").getByLabel("Description").fill("Edited description");
  await page.getByRole("dialog").getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Edited description")).toBeVisible();

  await page.getByRole("button", { name: "+ Add photos" }).click();
  await page.getByRole("dialog").locator("fieldset label").first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Add 1 photo" }).click();
  await expect(page.locator("main ul a[href^='/post/']")).toHaveCount(3);

  await page.locator("main ul").getByRole("button", { name: /^Remove/ }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Remove" }).click();
  await expect(page.locator("main ul a[href^='/post/']")).toHaveCount(2);

  //new albums show up in the feed
  await page.goto("/home");
  await expect(page.locator("main article").filter({ hasText: "created the album" }).getByRole("link", { name: "Test trip" })).toBeVisible();
});

test("report someone else's post with a reason", async({ page }) =>
{
  await page.goto("/search?q=%23paris");
  await page.locator("main a[href^='/post/']").first().click();
  await expect(page.getByRole("link", { name: /City Walks/ })).toBeVisible();

  await page.getByRole("button", { name: "Report" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("radio")).toHaveCount(5);

  await dialog.getByRole("button", { name: "Send report" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Choose a reason");

  await dialog.getByText("Spam or misleading").click();
  await dialog.getByRole("button", { name: "Send report" }).click();
  await expect(page.getByRole("button", { name: "Reported" })).toBeDisabled();
});

test("notifications open from the bell", async({ page }) =>
{
  await page.getByRole("button", { name: /^Notifications/ }).click();
  await expect(page.getByText("sent you a friend request").first()).toBeVisible();
  await page.getByRole("button", { name: "Mark all as read" }).click();
  await expect(page.getByRole("button", { name: "Notifications" })).toBeVisible();
});

test("the theme switch changes and remembers the theme", async({ page }) =>
{
  const before = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.getByRole("button", { name: /^Switch to/ }).click();
  const after = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(after).not.toBe(before);

  await page.reload();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(after);
});
