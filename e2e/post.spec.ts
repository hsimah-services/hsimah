import { test, expect } from './fixtures'

test.describe('Post page', () => {
  test('renders post title, date, and content', async ({ page }) => {
    await page.goto('/posts/hello-world')
    await expect(page.getByRole('heading', { level: 1, name: 'Hello World' })).toBeVisible()
    await expect(page.getByText('2026-03-21')).toBeVisible()
    await expect(page.getByText('I have owned hsimah.com for many years')).toBeVisible()
  })

  test('renders markdown as HTML', async ({ page }) => {
    await page.goto('/posts/hello-world')
    await expect(page.locator('.prose ul')).toBeVisible()
    await expect(page.locator('.prose a[href="https://hbla.ke"]')).toBeVisible()
  })

  test('shows not found for invalid slug', async ({ page }) => {
    await page.goto('/posts/does-not-exist')
    await expect(page.getByText('Post not found')).toBeVisible()
    await expect(page.getByText('Back to home')).toBeVisible()
  })
})
