import { test, expect } from './fixtures'

test.describe('Feed page', () => {
  test('loads and displays post cards', async ({ page }) => {
    await page.goto('/')
    const postCards = page.getByRole('heading', { level: 3 })
    await expect(postCards).not.toHaveCount(0)
    await expect(page.getByText('Hello World')).toBeVisible()
  })

  test('shows post description', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('My first blog post')).toBeVisible()
  })

  test('clicking a post navigates to the post page', async ({ page }) => {
    await page.goto('/')
    await page.getByText('Hello World').click()
    await expect(page).toHaveURL('/posts/hello-world')
  })
})
