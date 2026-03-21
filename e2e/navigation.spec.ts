import { test, expect } from './fixtures'

test.describe('Navigation', () => {
  test('nav bar has home link', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'hblake', exact: true })).toBeVisible()
  })

  test('can navigate from post back to feed', async ({ page }) => {
    await page.goto('/posts/hello-world')
    await page.getByRole('link', { name: 'hblake', exact: true }).click()
    await expect(page).toHaveURL('/')
    await expect(page.getByText('Hello World')).toBeVisible()
  })

  test('back to home link works on 404 page', async ({ page }) => {
    await page.goto('/posts/nonexistent')
    await page.getByRole('link', { name: 'Back to home' }).click()
    await expect(page).toHaveURL('/')
  })
})
