import { test } from '@playwright/test'

test('GitHubログインフロー全体を追跡', async ({ page }) => {
  const allLogs: string[] = []
  page.on('console', msg => allLogs.push(`[${msg.type()}] ${msg.text()}`))
  page.on('pageerror', err => allLogs.push(`[PAGEERROR] ${err.message}`))

  // Step 1: ログイン画面
  await page.goto('http://localhost:3000/')
  await page.waitForLoadState('networkidle')
  console.log('Step 1 URL:', page.url())

  // Step 2: GitHubボタンクリック
  const btn = page.getByRole('button', { name: /github/i })
  await btn.click()

  // ポップアップまたはリダイレクトを待つ
  await page.waitForTimeout(10000)

  console.log('Step 2 URL:', page.url())
  console.log('Step 2 logs:', allLogs)
  await page.screenshot({ path: 'e2e/screenshots/login-flow-step2.png', fullPage: true })
})
