import { test } from '@playwright/test'

test('本番: ページロード時のJS実行を完全追跡', async ({ page, context }) => {
  const logs: string[] = []
  const errors: string[] = []
  const requests: string[] = []
  const responses: string[] = []

  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`))
  page.on('pageerror', err => errors.push(err.message))
  page.on('request', req => {
    if (req.url().includes('firebase') || req.url().includes('google') || req.url().includes('identitytoolkit')) {
      requests.push(`${req.method()} ${req.url().substring(0, 150)}`)
    }
  })
  page.on('response', res => {
    if (res.url().includes('firebase') || res.url().includes('google') || res.url().includes('identitytoolkit')) {
      responses.push(`${res.status()} ${res.url().substring(0, 150)}`)
    }
  })

  await page.goto('https://todo-with-any-ai.web.app/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(5000)

  // Evaluate in browser context to check Firebase state
  const debugInfo = await page.evaluate(() => {
    const result: Record<string, unknown> = {}

    // Check if Firebase app exists
    try {
      // @ts-ignore
      const firebase = window.firebase
      result.firebaseGlobal = !!firebase
    } catch { result.firebaseGlobal = false }

    // Check IndexedDB for auth persistence
    result.indexedDBNames = []
    try {
      // @ts-ignore
      indexedDB.databases().then(dbs => {
        // @ts-ignore
        result.indexedDBNames = dbs.map(d => d.name)
      })
    } catch { /* */ }

    // Check localStorage
    result.localStorageKeys = Object.keys(localStorage)

    // Check sessionStorage
    result.sessionStorageKeys = Object.keys(sessionStorage)

    // Check all script tags
    const scripts = Array.from(document.querySelectorAll('script[src]'))
    result.scriptSources = scripts.map(s => (s as HTMLScriptElement).src).filter(s => s.includes('firebase') || s.includes('auth'))

    // Check DOM state
    result.bodyText = document.body.innerText.substring(0, 200)
    result.hasLoadingTestId = !!document.querySelector('[data-testid="login-loading"]')
    result.hasSnackbar = !!document.querySelector('[data-testid="snackbar-container"]')
    result.buttonCount = document.querySelectorAll('button').length
    result.buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent)

    return result
  })

  console.log('=== DEBUG INFO ===')
  console.log(JSON.stringify(debugInfo, null, 2))
  console.log('=== CONSOLE LOGS ===')
  logs.forEach(l => console.log(l))
  console.log('=== PAGE ERRORS ===')
  errors.forEach(e => console.log(e))
  console.log('=== FIREBASE REQUESTS ===')
  requests.forEach(r => console.log(r))
  console.log('=== FIREBASE RESPONSES ===')
  responses.forEach(r => console.log(r))

  await page.screenshot({ path: 'e2e/screenshots/full-debug-1.png', fullPage: true })
})

test('本番: GitHubボタンクリックしてポップアップを追跡', async ({ page, context }) => {
  const logs: string[] = []
  const errors: string[] = []

  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`))
  page.on('pageerror', err => errors.push(err.message))

  await page.goto('https://todo-with-any-ai.web.app/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  // Listen for new pages (popup)
  const popupPromise = context.waitForEvent('page', { timeout: 15000 }).catch(() => null)

  // Click GitHub button
  const btn = page.getByRole('button', { name: /github/i })
  console.log('Button found:', await btn.isVisible())
  await btn.click()
  console.log('Button clicked, waiting for popup or redirect...')

  // Check if popup opened
  const popup = await popupPromise
  if (popup) {
    console.log('Popup opened! URL:', popup.url())
    await popup.waitForLoadState('networkidle').catch(() => {})
    console.log('Popup final URL:', popup.url())
    await popup.screenshot({ path: 'e2e/screenshots/popup.png', fullPage: true })
  } else {
    console.log('No popup detected')
  }

  // Check main page state after click
  await page.waitForTimeout(5000)
  console.log('Main page URL after click:', page.url())

  const postClickState = await page.evaluate(() => ({
    url: window.location.href,
    bodyText: document.body.innerText.substring(0, 200),
    buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent),
  }))
  console.log('Post-click state:', JSON.stringify(postClickState, null, 2))

  console.log('=== LOGS ===')
  logs.forEach(l => console.log(l))
  console.log('=== ERRORS ===')
  errors.forEach(e => console.log(e))

  await page.screenshot({ path: 'e2e/screenshots/full-debug-2.png', fullPage: true })
})

test('本番: ローカルストレージにauth tokenを手動設定して/todosの動作確認', async ({ page }) => {
  // まず/todosに直接アクセスして、JSの実行を確認
  const logs: string[] = []
  const errors: string[] = []
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`))
  page.on('pageerror', err => errors.push(err.message))

  await page.goto('https://todo-with-any-ai.web.app/todos', { waitUntil: 'networkidle' })
  await page.waitForTimeout(8000) // 1.5秒のdelayを待つ

  console.log('=== /todos page ===')
  console.log('Final URL:', page.url())
  const state = await page.evaluate(() => ({
    url: window.location.href,
    bodyText: document.body.innerText.substring(0, 300),
    hasAppLoading: !!document.querySelector('[data-testid="app-loading"]'),
    hasSnackbar: !!document.querySelector('[data-testid="snackbar-container"]'),
  }))
  console.log('State:', JSON.stringify(state, null, 2))
  console.log('=== LOGS ===')
  logs.forEach(l => console.log(l))
  console.log('=== ERRORS ===')
  errors.forEach(e => console.log(e))

  await page.screenshot({ path: 'e2e/screenshots/full-debug-3-todos.png', fullPage: true })
})
