import { test, expect } from '@playwright/test'

test.describe('D&D on test page (no auth needed)', () => {
  test('Child C can be promoted to root level by dropping on Parent B', async ({ page }) => {
    await page.goto('http://localhost:3000/test-dnd')
    await page.waitForTimeout(1000)

    // Verify initial state
    const childC = page.locator('text=Child C (of A)')
    await expect(childC).toBeVisible()
    
    // Get Parent B element
    const parentB = page.locator('text=Parent B').first()
    await expect(parentB).toBeVisible()

    const boxB = await parentB.boundingBox()
    const boxC = await childC.boundingBox()
    
    console.log('Parent B box:', boxB)
    console.log('Child C box:', boxC)

    if (boxB && boxC) {
      // Drag Child C to the TOP of Parent B (before position)
      await page.mouse.move(boxC.x + boxC.width / 2, boxC.y + boxC.height / 2)
      await page.mouse.down()
      // Move slowly to trigger dragover
      for (let i = 0; i < 20; i++) {
        const progress = i / 19
        const x = boxC.x + (boxB.x - boxC.x) * progress + boxB.width / 2
        const y = boxC.y + (boxB.y - boxC.y) * progress + 5 // top of parent B
        await page.mouse.move(x, y)
        await page.waitForTimeout(50)
      }
      await page.mouse.up()
      await page.waitForTimeout(500)
    }

    // Check logs
    const logs = page.locator('text=DROP:')
    const logCount = await logs.count()
    console.log(`Drop logs count: ${logCount}`)
    
    if (logCount > 0) {
      const logText = await logs.first().textContent()
      console.log('First log:', logText)
    }

    await page.screenshot({ path: 'e2e/screenshots/dnd-test-result.png', fullPage: true })
  })

  test('Child D can be reordered within parent A', async ({ page }) => {
    await page.goto('http://localhost:3000/test-dnd')
    await page.waitForTimeout(1000)

    const childC = page.locator('text=Child C (of A)')
    const childD = page.locator('text=Child D (of A)')
    
    const boxC = await childC.boundingBox()
    const boxD = await childD.boundingBox()
    
    console.log('Child C box:', boxC)
    console.log('Child D box:', boxD)

    if (boxC && boxD) {
      // Drag Child D to before Child C
      await page.mouse.move(boxD.x + boxD.width / 2, boxD.y + boxD.height / 2)
      await page.mouse.down()
      for (let i = 0; i < 20; i++) {
        const progress = i / 19
        const x = boxD.x + (boxC.x - boxD.x) * progress + boxC.width / 2
        const y = boxD.y + (boxC.y - boxD.y) * progress + 5
        await page.mouse.move(x, y)
        await page.waitForTimeout(50)
      }
      await page.mouse.up()
      await page.waitForTimeout(500)
    }

    const logs = page.locator('text=DROP:')
    const logCount = await logs.count()
    console.log(`Drop logs count: ${logCount}`)
    
    if (logCount > 0) {
      const logText = await logs.first().textContent()
      console.log('First log:', logText)
    }

    await page.screenshot({ path: 'e2e/screenshots/dnd-child-reorder.png', fullPage: true })
  })
})
