import { test, expect, login } from "./fixtures.js";

function tab(page, name)
{
  return page.getByRole("tab", { name: new RegExp(`^${name}`) });
}

test("regular users can't open the admin page", async({ page }) =>
{
  await login(page, "test@test.com");
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/home/);
});

test("admins review reported posts", async({ page }) =>
{
  await login(page, "admin@test.com");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Admin" }).first().click();

  const spam = page.getByRole("listitem").filter({ hasText: "Selling rides" });
  await expect(spam.getByText("Spam or misleading ×3")).toBeVisible();

  //keep one post, delete the other
  const paris = page.getByRole("listitem").filter({ hasText: "Rainy afternoon" });
  await paris.getByRole("button", { name: "Keep post" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Keep post" }).click();
  await expect(paris).toHaveCount(0);

  await spam.getByRole("button", { name: "Delete post" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete post" }).click();
  await expect(page.getByText("No reported posts.")).toBeVisible();
});

test("admins approve verification requests", async({ page }) =>
{
  await login(page, "admin@test.com");
  await page.goto("/admin?tab=verifications");
  await page.getByRole("listitem").filter({ hasText: "Ditshegofatso" }).getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("ditshego is now verified")).toBeVisible();
});

test("admins see flagged report abusers and can pause their reporting", async({ page }) =>
{
  await login(page, "admin@test.com");
  await page.goto("/admin?tab=users");

  await page.getByRole("button", { name: /Flagged/ }).click();
  const sipho = page.locator("main ul > li");
  await expect(sipho).toHaveCount(1);
  await expect(sipho).toContainText("Sipho");

  await sipho.getByRole("button", { name: "Pause reporting" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Pause reporting" }).click();
  await expect(sipho.getByText("Reporting paused")).toBeVisible();
});

test("admins edit and delete any post, album or account", async({ page }) =>
{
  await login(page, "admin@test.com");

  await page.goto("/admin?tab=posts");
  const castle = page.getByRole("listitem").filter({ hasText: "Castle day" });
  await castle.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("dialog").getByLabel("Caption").fill("Castle day! Edited by admin.");
  await page.getByRole("dialog").getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Edited by admin.")).toBeVisible();
  await castle.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete post" }).click();
  await expect(castle).toHaveCount(0);

  await tab(page, "Albums").click();
  const hikes = page.getByRole("listitem").filter({ hasText: "Mountain Hikes" });
  await hikes.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete album" }).click();
  await expect(hikes).toHaveCount(0);

  await tab(page, "Users").click();
  const naledi = page.getByRole("listitem").filter({ hasText: "naledi@test.com" });
  await naledi.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete account" }).click();
  await expect(naledi).toHaveCount(0);
});

test("admins add report reasons", async({ page }) =>
{
  await login(page, "admin@test.com");
  await page.goto("/admin?tab=reasons");
  await page.getByLabel("Reason", { exact: true }).fill("Violence or threats");
  await page.getByRole("button", { name: "Add reason" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Violence or threats" })).toBeVisible();
});

test("the owner is told when a moderator removes their post", async({ page }) =>
{
  await login(page, "kabelo@test.com");
  await page.getByRole("button", { name: /^Notifications/ }).click();
  await expect(page.getByText("An admin removed your post")).toBeVisible();
});
