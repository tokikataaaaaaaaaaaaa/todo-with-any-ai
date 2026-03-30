import { test, expect } from '@playwright/test'

test('D&D debug: 本番で子要素のドラッグイベントを検証', async ({ page }) => {
  const logs: string[] = []
  page.on('console', msg => {
    if (msg.text().includes('[D&D]')) {
      logs.push(msg.text())
    }
  })

  await page.goto('https://todo-with-any-ai.web.app/todos')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(3000)

  // スクリーンショット
  await page.screenshot({ path: 'e2e/screenshots/dd-debug-1.png', fullPage: true })

  // 全てのtodo-rowを取得
  const rows = page.locator('[data-testid="todo-row"]')
  const count = await rows.count()
  console.log(`Found ${count} todo rows`)

  // 展開ボタンがあれば押す
  const expandButtons = page.locator('[data-testid="toggle-expand"]')
  const expandCount = await expandButtons.count()
  console.log(`Found ${expandCount} expand buttons`)
  
  if (expandCount > 0) {
    await expandButtons.first().click()
    await page.waitForTimeout(500)
  }

  // 再取得
  const allRows = page.locator('[data-testid="todo-row"]')
  const allCount = await allRows.count()
  console.log(`After expand: ${allCount} todo rows`)

  // ドラッグハンドルを取得
  const handles = page.locator('[data-drag-handle]')
  const handleCount = await handles.count()
  console.log(`Found ${handleCount} drag handles`)

  if (allCount >= 2 && handleCount >= 2) {
    // 2番目のハンドルを1番目の位置にドラッグ
    const handle1 = handles.nth(0)
    const handle2 = handles.nth(1)
    
    const box1 = await handle1.boundingBox()
    const box2 = await handle2.boundingBox()
    console.log('Handle 1 box:', box1)
    console.log('Handle 2 box:', box2)

    if (box1 && box2) {
      // handle2をドラッグしてhandle1の上にドロップ
      await handle2.hover()
      await page.mouse.down()
      await page.waitForTimeout(100)
      await page.mouse.move(box1.x + box1.width / 2, box1.y + 5, { steps: 10 })
      await page.waitForTimeout(100)
      await page.mouse.up()

      await page.waitForTimeout(1000)
    }
  }

  console.log('=== D&D Logs ===')
  logs.forEach(l => console.log(l))
  console.log(`Total D&D logs: ${logs.length}`)

  await page.screenshot({ path: 'e2e/screenshots/dd-debug-2.png', fullPage: true })
})
