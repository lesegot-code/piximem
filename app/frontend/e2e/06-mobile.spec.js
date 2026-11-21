import { test, expect, login, expectNoSideScroll } from "./fixtures.js";

//runs in the "mobile" project (Pixel 7 size)
test("the landing page fits a phone screen", async({ page }) =>
{
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Every picture holds a memory." })).toBeVisible();
  await expectNoSideScroll(page);
});

test("every main page fits a phone screen", async({ page }) =>
{
  await login(page, "test@test.com");

  for(const url of ["/home", "/search?q=%23wildlife", "/home?feed=global"])
  {
    await page.goto(url);
    await expect(page.locator("main")).toBeVisible();
    await expectNoSideScroll(page);
  }

  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "My Profile" }).last().click();
  await expect(page.getByText("Only you can see your email")).toBeVisible();
  await expectNoSideScroll(page);

  await page.getByRole("button", { name: "Share a Memory" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expectNoSideScroll(page);
});
