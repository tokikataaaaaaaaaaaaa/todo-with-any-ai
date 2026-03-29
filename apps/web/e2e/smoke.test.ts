import { test, expect } from '@playwright/test'

test('ログイン画面が表示される', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/todo-with-any-ai/)
})

test('GitHubログインボタンが存在する', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: /github/i })).toBeVisible()
})

test('Googleログインボタンが存在する', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
})
