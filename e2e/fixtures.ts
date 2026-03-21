import { test as base, expect } from '@playwright/test'

export const test = base.extend<{ waitForApp: void }>({
  waitForApp: [async ({ page }, use) => {
    await page.goto('/')
    await expect(page.locator('header')).toBeVisible()
    await use()
  }, { auto: false }],
})

export { expect }
