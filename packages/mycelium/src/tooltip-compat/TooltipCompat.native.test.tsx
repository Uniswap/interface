import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TooltipCompat } from './TooltipCompat.native'

// Mycelium has no native-runtime test lane: the native leg is a
// zero-dependency pass-through/null compound, so jsdom exercises it as-is.
describe('TooltipCompat native leg — the legacy Tamagui native contract (pass-through/null compound)', () => {
  it('Root and Trigger render children unchanged; Content and Arrow render nothing', () => {
    const { container } = render(
      <TooltipCompat delay={{ close: 500 }} placement="top" open>
        <TooltipCompat.Trigger flex={1}>
          <span data-testid="native-trigger-child">live mobile UI</span>
        </TooltipCompat.Trigger>
        <TooltipCompat.Content>
          <TooltipCompat.Arrow />
          <div data-testid="native-content-child">must never mount</div>
        </TooltipCompat.Content>
      </TooltipCompat>,
    )
    expect(screen.getByTestId('native-trigger-child').textContent).toBe('live mobile UI')
    // No wrapper element: the child sits directly in the RTL container.
    expect(screen.getByTestId('native-trigger-child').parentElement).toBe(container)
    expect(screen.queryByTestId('native-content-child')).toBeNull()
    expect(document.querySelector('[data-slot^="tooltip-compat"]')).toBeNull()
  })
})
