import path from "node:path";
import { test, expect, login } from "./fixtures.js";

const PHOTOS = path.join(import.meta.dirname, "..", "..", "backend", "seed-images");

async function openOwnProfile(page)
{
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "My Profile" }).first().click();
  await expect(page.getByText("Only you can see your email")).toBeVisible();
}

test("your profile shows your posts, friends and requests", async({ page }) =>
{
  await login(page, "test@test.com");
  await openOwnProfile(page);

  await expect(page.locator("main a[href^='/post/']")).toHaveCount(3);
  await expect(page.locator("#requests-heading")).toContainText("(2)");
  await expect(page.locator("#friends-heading")).toContainText("(3)");
});

test("accept and decline friend requests from your profile", async({ page }) =>
{
  await login(page, "test@test.com");
  await openOwnProfile(page);

  await page.getByRole("listitem").filter({ hasText: "Lerato" }).getByRole("button", { name: "Accept" }).click();
  await expect(page.locator("#friends-heading")).toContainText("(4)");

  await page.getByRole("listitem").filter({ hasText: "Naledi" }).getByRole("button", { name: "Decline" }).click();
  await expect(page.getByText("No pending requests.")).toBeVisible();
});

test("edit your profile and upload a picture", async({ page }) =>
{
  await login(page, "test@test.com");
  await openOwnProfile(page);

  await page.getByRole("button", { name: "Edit profile" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.locator("input[type=file]").setInputFiles(path.join(PHOTOS, "Birds2.jpg"));
  await dialog.getByLabel("Website or social link").fill("github.com/example");
  await dialog.getByLabel("Bio").fill("Bio written by the end-to-end test");
  await dialog.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByText("Bio written by the end-to-end test")).toBeVisible();
  await expect(page.getByRole("link", { name: /github\.com\/example/ })).toHaveAttribute("href", "https://github.com/example");
  await expect(page.getByRole("navigation", { name: "Main" }).getByAltText(/profile picture/)).toBeVisible();
});

test("people who aren't friends only see the name and picture", async({ page }) =>
{
  await login(page, "test@test.com");
  await page.goto("/search?q=tshili");
  await page.getByText("@tshili").click();

  await expect(page.getByText("This profile is only visible to friends")).toBeVisible();
  await expect(page.getByText("Street photography and travel diaries.")).toHaveCount(0);

  await page.getByRole("button", { name: "Add friend" }).click();
  await expect(page.getByRole("button", { name: "Cancel request" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel request" }).click();
  await expect(page.getByRole("button", { name: "Add friend" })).toBeVisible();
});

test("favourite a friend, then unfriend them", async({ page }) =>
{
  await login(page, "test@test.com");
  await page.goto("/search?q=kabelo");
  await page.getByText("@kabelo.drives").click();

  await expect(page.getByText("Cars, coffee and code.")).toBeVisible();
  await page.getByRole("button", { name: "Add to favourites" }).click();
  await expect(page.getByRole("button", { name: "★ Favourite" })).toBeVisible();

  await page.getByRole("button", { name: "Unfriend" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Unfriend" }).click();
  await expect(page.getByText("This profile is only visible to friends")).toBeVisible();
});

test("ask for verification when eligible", async({ page }) =>
{
  await login(page, "test@test.com");
  await openOwnProfile(page);

  await page.getByRole("button", { name: "Request verification" }).click();
  await expect(page.getByText("Request sent. An admin will review it soon.")).toBeVisible();
});
