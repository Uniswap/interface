import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { runAxe } from '../testing/axe'
import { MyceliumThemeTestWrapper } from '../testing/MyceliumThemeTestWrapper'
import { SeparatorCompat } from './SeparatorCompat.web'

afterEach(() => {
  cleanup()
})

describe('SeparatorCompat semantics', () => {
  it('is hidden from assistive tech by default', () => {
    render(<SeparatorCompat testID="divider" />, { wrapper: MyceliumThemeTestWrapper })
    expect(screen.queryByRole('separator')).toBeNull()
    expect(screen.getByTestId('divider').getAttribute('aria-hidden')).toBe('true')
  })

  it('is a horizontal separator when not decorative', async () => {
    const { container } = render(<SeparatorCompat decorative={false} />, { wrapper: MyceliumThemeTestWrapper })
    const separator = screen.getByRole('separator')
    expect(separator.hasAttribute('aria-orientation')).toBe(false)
    expect(await runAxe(container)).toHaveNoAxeViolations()
  })

  it('declares a vertical orientation', async () => {
    const { container } = render(<SeparatorCompat vertical decorative={false} />, { wrapper: MyceliumThemeTestWrapper })
    expect(screen.getByRole('separator').getAttribute('aria-orientation')).toBe('vertical')
    expect(await runAxe(container)).toHaveNoAxeViolations()
  })
})
