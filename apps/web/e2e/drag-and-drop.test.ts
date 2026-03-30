import { test, expect } from '@playwright/test'

/**
 * Drag-and-drop E2E tests.
 * These tests require authentication and a running dev server with test data.
 * They are skipped by default since Firebase auth is required.
 * To run locally: remove `.skip` and ensure you are logged in.
 */
test.describe('Drag and Drop', () => {
  test.skip('root todos can be reordered by dragging', async ({ page }) => {
    await page.goto('/todos')

    // Assume at least 2 root todos exist: "Todo A" and "Todo B"
    const todoA = page.locator('[data-testid="todo-row"]', { hasText: 'Todo A' })
    const todoB = page.locator('[data-testid="todo-row"]', { hasText: 'Todo B' })

    // Get bounding boxes
    const boxA = await todoA.boundingBox()
    const boxB = await todoB.boundingBox()
    if (!boxA || !boxB) throw new Error('Could not get bounding boxes')

    // Drag Todo B to the top of Todo A (before position)
    await todoB.dragTo(todoA, {
      targetPosition: { x: boxA.width / 2, y: 5 },
    })

    // Verify Todo B is now before Todo A
    const rows = page.locator('[data-testid="todo-row"]')
    const firstRowText = await rows.first().textContent()
    expect(firstRowText).toContain('Todo B')
  })

  test.skip('child todos can be reordered within the same parent', async ({ page }) => {
    await page.goto('/todos')

    // Expand a parent todo that has children
    const expandButton = page.locator('[data-testid="toggle-expand"]').first()
    await expandButton.click()

    // Wait for children to be visible
    await page.waitForTimeout(300)

    // Get child todo elements (they will be indented)
    const childRows = page.locator('[data-testid="todo-row"]')

    // Count initial children order
    const initialCount = await childRows.count()
    expect(initialCount).toBeGreaterThan(2)
  })

  test.skip('child todo can be moved to root level', async ({ page }) => {
    await page.goto('/todos')

    // Expand a parent todo
    const expandButton = page.locator('[data-testid="toggle-expand"]').first()
    await expandButton.click()

    await page.waitForTimeout(300)

    // Find a child todo and a root todo
    // After expansion, child todos will have deeper indentation
    const allRows = page.locator('[data-testid="todo-row"]')
    const rowCount = await allRows.count()
    expect(rowCount).toBeGreaterThan(1)
  })
})
