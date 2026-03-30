import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Motion animation CSS', () => {
  const css = readFileSync(
    resolve(__dirname, '../app/globals.css'),
    'utf-8'
  )

  it('should define fade-up keyframes', () => {
    expect(css).toContain('@keyframes fade-up')
  })

  it('should define check-pop keyframes', () => {
    expect(css).toContain('@keyframes check-pop')
  })

  it('should have stagger animation rule for [data-stagger] children', () => {
    expect(css).toContain('[data-stagger]')
    expect(css).toContain('fade-up')
  })

  it('should respect prefers-reduced-motion', () => {
    expect(css).toContain('prefers-reduced-motion')
  })
})

describe('Todos page data-stagger attribute', () => {
  it('should include data-stagger in the todos page source', () => {
    const source = readFileSync(
      resolve(__dirname, '../app/(app)/todos/page.tsx'),
      'utf-8'
    )
    expect(source).toContain('data-stagger')
  })
})
