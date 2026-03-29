import { test, expect } from '@playwright/test'

test('本番: Firebase初期化とauth状態を完全デバッグ', async ({ page }) => {
  const allLogs: string[] = []
  const allErrors: string[] = []

  page.on('console', msg => {
    allLogs.push(`[${msg.type()}] ${msg.text()}`)
  })
  page.on('pageerror', err => {
    allErrors.push(`[PageError] ${err.message}`)
  })

  // Step 1: トップページにアクセス
  await page.goto('https://todo-with-any-ai.web.app/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)

  console.log('=== Step 1: Initial page load ===')
  console.log('URL:', page.url())
  await page.screenshot({ path: 'e2e/screenshots/debug-step1.png', fullPage: true })

  // Step 2: Firebase authの状態をブラウザ内で確認
  const firebaseState = await page.evaluate(async () => {
    try {
      // @ts-ignore
      const apps = window.__FIREBASE_APPS__ || []

      // IndexedDBにFirebase auth stateが保存されているか確認
      const dbs = await window.indexedDB.databases()
      const firebaseDBs = dbs.filter(db => db.name && db.name.includes('firebase'))

      return {
        appsCount: apps.length,
        indexedDBs: firebaseDBs.map(db => db.name),
        localStorage: Object.keys(localStorage).filter(k => k.includes('firebase')),
        hasAuth: typeof document !== 'undefined',
      }
    } catch (e) {
      return { error: String(e) }
    }
  })
  console.log('Firebase state:', JSON.stringify(firebaseState, null, 2))

  // Step 3: Zustand storeの状態を確認
  const zustandState = await page.evaluate(() => {
    try {
      // Zustand stores are not directly accessible, but we can check DOM
      const loadingEl = document.querySelector('[data-testid="login-loading"]')
      const githubBtn = document.querySelector('button')
      const bodyText = document.body.innerText

      return {
        hasLoadingEl: !!loadingEl,
        firstButtonText: githubBtn?.textContent || 'no button',
        bodyTextPreview: bodyText.substring(0, 300),
      }
    } catch (e) {
      return { error: String(e) }
    }
  })
  console.log('Zustand/DOM state:', JSON.stringify(zustandState, null, 2))

  // Step 4: /todos に直接アクセス
  await page.goto('https://todo-with-any-ai.web.app/todos', { waitUntil: 'networkidle' })
  await page.waitForTimeout(5000)

  console.log('=== Step 4: /todos direct access ===')
  console.log('Final URL:', page.url())
  await page.screenshot({ path: 'e2e/screenshots/debug-step4-todos.png', fullPage: true })

  const todosState = await page.evaluate(() => {
    return {
      url: window.location.href,
      bodyText: document.body.innerText.substring(0, 500),
      hasAppLoading: !!document.querySelector('[data-testid="app-loading"]'),
    }
  })
  console.log('Todos state:', JSON.stringify(todosState, null, 2))

  // Step 5: ログを全出力
  console.log('=== ALL LOGS ===')
  allLogs.forEach(l => console.log(l))
  console.log('=== ALL ERRORS ===')
  allErrors.forEach(e => console.log(e))
})

test('本番: /todos.html が正しいHTMLを返すか', async ({ page }) => {
  // Next.jsの静的エクスポートで生成されたHTMLを直接確認
  const response = await page.goto('https://todo-with-any-ai.web.app/todos.html')
  console.log('Response status:', response?.status())
  console.log('Response URL:', response?.url())

  await page.waitForTimeout(2000)
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500))
  console.log('Body text:', bodyText)

  await page.screenshot({ path: 'e2e/screenshots/debug-todos-html.png', fullPage: true })
})
