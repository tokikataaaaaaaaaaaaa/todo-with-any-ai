import { describe, it, expect, vi } from 'vitest'

/**
 * Test that layout.tsx imports next/font/google fonts correctly.
 * Since next/font is a build-time feature, we verify the module structure
 * rather than rendering (which requires Next.js internals).
 */

// Mock next/font/google to capture what fonts are loaded
const mockNotoSerifJP = vi.fn().mockReturnValue({
  variable: '--font-display',
  className: 'mock-noto-serif-jp',
})
const mockNotoSansJP = vi.fn().mockReturnValue({
  variable: '--font-body',
  className: 'mock-noto-sans-jp',
})
const mockJetBrainsMono = vi.fn().mockReturnValue({
  variable: '--font-mono',
  className: 'mock-jetbrains-mono',
})

vi.mock('next/font/google', () => ({
  Noto_Serif_JP: mockNotoSerifJP,
  Noto_Sans_JP: mockNotoSansJP,
  JetBrains_Mono: mockJetBrainsMono,
}))

// We need to dynamically import after mocks are set up
describe('Font loading in layout.tsx', () => {
  it('should import Noto_Serif_JP with --font-display variable', async () => {
    // The import itself triggers the font constructor calls
    await import('@/app/layout')

    expect(mockNotoSerifJP).toHaveBeenCalledWith(
      expect.objectContaining({
        variable: '--font-display',
        display: 'swap',
      })
    )
  })

  it('should import Noto_Sans_JP with --font-body variable', async () => {
    expect(mockNotoSansJP).toHaveBeenCalledWith(
      expect.objectContaining({
        variable: '--font-body',
        display: 'swap',
      })
    )
  })

  it('should import JetBrains_Mono with --font-mono variable', async () => {
    expect(mockJetBrainsMono).toHaveBeenCalledWith(
      expect.objectContaining({
        variable: '--font-mono',
        display: 'swap',
      })
    )
  })
})
