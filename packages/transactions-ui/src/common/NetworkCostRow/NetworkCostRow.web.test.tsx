// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { NetworkCostRow } from '@universe/transactions-ui/src/common/NetworkCostRow/NetworkCostRow'
import { describe, expect, it, vi } from 'vitest'

// Web DOM assertions (svg counts, test ids on icons, class names, keyboard): the native leg
// renders through react-native-web and does not produce them.
describe('NetworkCostRow (web DOM)', () => {
  it('renders the warning icon only with a warning', () => {
    const { rerender } = render(<NetworkCostRow hasWarning value="$1.24" />)
    expect(screen.getByTestId('network-cost-warning-icon')).toBeTruthy()
    rerender(<NetworkCostRow value="$1.24" />)
    expect(screen.queryByTestId('network-cost-warning-icon')).toBeNull()
  })

  it('reports presses and shows the chevron when pressable', () => {
    const onPress = vi.fn()
    const { container } = render(<NetworkCostRow value="$1.24" onPress={onPress} />)
    expect(container.querySelectorAll('svg')).toHaveLength(1)
    fireEvent.click(screen.getByText('$1.24'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
