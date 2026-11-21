import { test as base, expect } from "@playwright/test";

//every test fails if the page throws a JavaScript error or logs a console error
export const test = base.extend({
  page: async({ page }, use) =>
  {
    const problems = [];

    page.on("pageerror", (err) => problems.push(`page error: ${err.message}`));
    page.on("console", (msg) =>
    {
      if(msg.type() !== "error") return;
      const text = msg.text();
      //failed requests (e.g. a 401 for a wrong password) are checked by the tests themselves
      if(text.startsWith("Failed to load resource")) return;
      problems.push(`console error: ${text}`);
    });

    await use(page);
    expect(problems, "the browser console should stay clean").toEqual([]);
  },
});

export { expect };

export async function login(page, email, password = "test1234")
{
  await page.context().clearCookies();
  await page.goto("/");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.locator("form").getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/home/);
}

//the page should never scroll sideways
export async function expectNoSideScroll(page)
{
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}
