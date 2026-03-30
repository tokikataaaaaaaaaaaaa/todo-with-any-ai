import { test, expect } from '@playwright/test'

test('D&D with dragTo API', async ({ page }) => {
  await page.goto('http://localhost:3000/test-dnd')
  await page.waitForTimeout(1000)

  // Find the DraggableTodo wrappers
  const draggableC = page.locator('[data-testid="draggable-todo-c"]')
  const draggableB = page.locator('[data-testid="draggable-todo-b"]')
  
  await expect(draggableC).toBeVisible()
  await expect(draggableB).toBeVisible()

  const boxB = await draggableB.boundingBox()
  console.log('DraggableB box:', boxB)

  // Use Playwright's dragTo which properly triggers HTML5 D&D events
  await draggableC.dragTo(draggableB, {
    targetPosition: { x: 50, y: 5 } // top of Parent B = "before" position
  })

  await page.waitForTimeout(1000)

  // Check logs
  const logsContainer = page.locator('text=DROP:')
  const logCount = await logsContainer.count()
  console.log(`Drop logs: ${logCount}`)
  
  for (let i = 0; i < logCount; i++) {
    const text = await logsContainer.nth(i).textContent()
    console.log(`  Log ${i}: ${text}`)
  }

  await page.screenshot({ path: 'e2e/screenshots/dnd-dragto.png', fullPage: true })
  
  expect(logCount).toBeGreaterThan(0)
})

test('Child D reorder with dragTo', async ({ page }) => {
  await page.goto('http://localhost:3000/test-dnd')
  await page.waitForTimeout(1000)

  const draggableD = page.locator('[data-testid="draggable-todo-d"]')
  const draggableC = page.locator('[data-testid="draggable-todo-c"]')

  await draggableD.dragTo(draggableC, {
    targetPosition: { x: 50, y: 5 }
  })

  await page.waitForTimeout(1000)

  const logsContainer = page.locator('text=DROP:')
  const logCount = await logsContainer.count()
  console.log(`Drop logs: ${logCount}`)
  
  for (let i = 0; i < logCount; i++) {
    const text = await logsContainer.nth(i).textContent()
    console.log(`  Log ${i}: ${text}`)
  }

  expect(logCount).toBeGreaterThan(0)
})
