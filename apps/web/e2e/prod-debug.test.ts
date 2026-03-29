import { test, expect } from '@playwright/test'

test('本番環境のJS動作確認', async ({ page }) => {
  // コンソールメッセージを全て収集
  const logs: string[] = []
  const errors: string[] = []

  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`
    logs.push(text)
    if (msg.type() === 'error') errors.push(msg.text())
  })

  page.on('pageerror', err => {
    errors.push(`PageError: ${err.message}`)
  })

  await page.goto('https://todo-with-any-ai.web.app/')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(5000)

  console.log('=== ALL CONSOLE LOGS ===')
  logs.forEach(l => console.log(l))
  console.log('=== ERRORS ===')
  errors.forEach(e => console.log(e))

  // ページのHTMLを確認
  const html = await page.content()
  console.log('=== PAGE HTML (first 2000 chars) ===')
  console.log(html.substring(0, 2000))

  // Loading状態かどうか確認
  const loadingEl = page.locator('[data-testid="login-loading"]')
  const isLoading = await loadingEl.isVisible().catch(() => false)
  console.log('Loading visible:', isLoading)

  // ボタンが見えるか
  const githubBtn = page.getByRole('button', { name: /github/i })
  const isGithubVisible = await githubBtn.isVisible().catch(() => false)
  console.log('GitHub button visible:', isGithubVisible)

  await page.screenshot({ path: 'e2e/screenshots/prod-debug.png', fullPage: true })
})
