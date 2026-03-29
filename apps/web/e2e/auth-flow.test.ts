import { test, expect } from '@playwright/test'

test('ログイン画面の初期状態を確認', async ({ page }) => {
  await page.goto('/')

  // スクリーンショット
  await page.screenshot({ path: 'e2e/screenshots/login-page.png' })

  // ボタンの存在確認
  const githubBtn = page.getByRole('button', { name: /github/i })
  const googleBtn = page.getByRole('button', { name: /google/i })
  await expect(githubBtn).toBeVisible()
  await expect(googleBtn).toBeVisible()

  // ページ内容を出力
  const bodyText = await page.textContent('body')
  console.log('Page body text:', bodyText)
})

test('ログイン後のリダイレクトを確認', async ({ page }) => {
  await page.goto('/')

  // Loading状態を確認
  const loadingEl = page.locator('[data-testid="login-loading"]')
  const isLoading = await loadingEl.isVisible({ timeout: 2000 }).catch(() => false)
  console.log('Loading visible:', isLoading)

  // ログインページのスクリーンショット
  await page.screenshot({ path: 'e2e/screenshots/before-login.png' })

  // 現在のURL
  console.log('Current URL:', page.url())
})

test('/todos に直接アクセスした場合の動作', async ({ page }) => {
  await page.goto('/todos')
  await page.waitForLoadState('networkidle')

  await page.screenshot({ path: 'e2e/screenshots/todos-direct.png' })
  console.log('URL after /todos access:', page.url())

  const bodyText = await page.textContent('body')
  console.log('/todos body text:', bodyText)
})

test('本番環境のログイン画面を確認', async ({ page }) => {
  await page.goto('https://todo-with-any-ai.web.app/')
  await page.waitForLoadState('networkidle')

  await page.screenshot({ path: 'e2e/screenshots/prod-login.png' })
  console.log('Prod URL:', page.url())

  const bodyText = await page.textContent('body')
  console.log('Prod body text:', bodyText)

  // JS エラーを監視
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })

  // 少し待ってエラーを収集
  await page.waitForTimeout(3000)
  console.log('Console errors:', errors)
})
