import { test } from '@playwright/test'

test('ローカル: /todos のJavaScript実行を確認', async ({ page }) => {
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', err => errors.push(`PageError: ${err.message}`))

  await page.goto('http://localhost:3000/todos')
  await page.waitForTimeout(5000)

  console.log('=== LOCAL /todos ===')
  console.log('URL:', page.url())
  const text = await page.evaluate(() => document.body.innerText)
  console.log('Body text:', text.substring(0, 300))
  console.log('Errors:', errors)
  await page.screenshot({ path: 'e2e/screenshots/local-todos.png', fullPage: true })
})

test('本番: /todos のJavaScript実行とエラーを確認', async ({ page }) => {
  const errors: string[] = []
  const logs: string[] = []
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`)
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', err => errors.push(`PageError: ${err.message}`))

  await page.goto('https://todo-with-any-ai.web.app/todos')
  await page.waitForTimeout(5000)

  console.log('=== PROD /todos ===')
  console.log('URL:', page.url())
  const text = await page.evaluate(() => document.body.innerText)
  console.log('Body text:', text.substring(0, 300))
  console.log('All logs:', logs)
  console.log('Errors:', errors)
  await page.screenshot({ path: 'e2e/screenshots/prod-todos-debug2.png', fullPage: true })
})

test('本番: トップページでGitHubログインボタンをクリック', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', err => errors.push(`PageError: ${err.message}`))

  await page.goto('https://todo-with-any-ai.web.app/')
  await page.waitForLoadState('networkidle')

  // GitHubボタンをクリック
  const btn = page.getByRole('button', { name: /github/i })
  await btn.click()

  // 何が起きるか確認
  await page.waitForTimeout(5000)
  console.log('After click URL:', page.url())
  console.log('Errors:', errors)
  await page.screenshot({ path: 'e2e/screenshots/after-github-click.png', fullPage: true })
})
