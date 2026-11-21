import { test, expect, login } from "./fixtures.js";

test("logged out visitors only see the landing page", async({ page }) =>
{
  await page.goto("/home");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Every picture holds a memory." })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
});

test("landing page scroll effects follow the scroll position", async({ page }) =>
{
  await page.goto("/");
  await page.mouse.wheel(0, 1200);
  await expect.poll(() => page.evaluate(() => Number(getComputedStyle(document.documentElement).getPropertyValue("--scroll-y")))).toBeGreaterThan(500);
});

test("labels focus their inputs", async({ page }) =>
{
  await page.goto("/");
  await page.locator("label[for=auth-email]").click();
  await expect(page.locator("#auth-email")).toBeFocused();
});

test("a wrong password shows a clear message", async({ page }) =>
{
  await page.goto("/");
  await page.getByLabel("Email").fill("test@test.com");
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await page.locator("form").getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("alert")).toContainText("don't match");
});

test("the session survives a refresh, uses an httpOnly cookie and ends on log out", async({ page, context }) =>
{
  await login(page, "test@test.com");

  const cookie = (await context.cookies()).find((c) => c.name === "pm_session");
  expect(cookie?.httpOnly).toBe(true);

  await page.reload();
  await expect(page).toHaveURL(/\/home/);
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL("/");
  await page.goto("/home");
  await expect(page).toHaveURL("/");
});

test("signing up checks the form and logs you straight in", async({ page }) =>
{
  await page.goto("/");
  await page.locator("form").getByRole("button", { name: "Create an account" }).click();
  await page.getByLabel("Display name").fill("Amo");
  await page.getByLabel("Username").fill("amo_k");
  await page.getByLabel("Email").fill("amo@test.com");
  await page.getByLabel("Password", { exact: true }).fill("secret12");
  await page.getByLabel("Confirm password").fill("different");
  await page.locator("form").getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("alert")).toContainText("don't match");

  await page.getByLabel("Confirm password").fill("secret12");
  await page.locator("form").getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/home/);
  await expect(page.getByText("Your friends haven't shared anything yet.")).toBeVisible();
});
