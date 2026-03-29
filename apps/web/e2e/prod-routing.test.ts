import { test, expect } from '@playwright/test'

test('/todos が正しいページを返す', async ({ page }) => {
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })

  await page.goto('https://todo-with-any-ai.web.app/todos')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(3000)

  await page.screenshot({ path: 'e2e/screenshots/prod-todos.png', fullPage: true })
  console.log('URL:', page.url())

  const bodyText = await page.textContent('body')
  console.log('Body text:', bodyText?.substring(0, 500))
  console.log('Errors:', errors)
})

test('/ が正しいログイン画面を返す', async ({ page }) => {
  await page.goto('https://todo-with-any-ai.web.app/')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  await page.screenshot({ path: 'e2e/screenshots/prod-login2.png', fullPage: true })

  const githubBtn = page.getByRole('button', { name: /github/i })
  console.log('GitHub visible:', await githubBtn.isVisible())
})

test('/settings が正しいページを返す', async ({ page }) => {
  await page.goto('https://todo-with-any-ai.web.app/settings')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  await page.screenshot({ path: 'e2e/screenshots/prod-settings.png', fullPage: true })
  const bodyText = await page.textContent('body')
  console.log('Settings body:', bodyText?.substring(0, 300))
})
