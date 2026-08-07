// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Unitag } from '../Unitag'

describe('Unitag', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    document.documentElement.classList.remove('dark')
  })

  it('renders the light asset by default and flips on root dark class', async () => {
    const { container } = render(<Unitag size={16} />)
    // Decorative bitmap (alt=""), so it exposes no img role — query the node directly.
    const img = container.querySelector('img')
    expect(img?.getAttribute('src')).toContain('unitag-light-small')
    expect(img?.getAttribute('alt')).toBe('')

    document.documentElement.classList.add('dark')
    await vi.waitFor(() => {
      expect(container.querySelector('img')?.getAttribute('src')).toContain('unitag-dark-small')
    })
  })

  it('snapshot is safe when document is absent (off-DOM guard)', () => {
    // Different `size` on rerender busts memo, so React re-reads the store
    // snapshot with the stubbed-out document.
    const { rerender, container } = render(<Unitag size={16} />)
    vi.stubGlobal('document', undefined)
    expect(() => rerender(<Unitag size={17} />)).not.toThrow()
    expect(container.querySelector('img')?.getAttribute('src')).toContain('unitag-light-small')
  })
})
