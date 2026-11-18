// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { DetailRow } from '@universe/transactions-ui/src/common/DetailRow/DetailRow'
import { describe, expect, it, vi } from 'vitest'

// Web DOM assertions (svg counts, test ids on icons, class names, keyboard): the native leg
// renders through react-native-web and does not produce them.
describe('DetailRow (web DOM)', () => {
  it('presses as a whole with a chevron when onPress is set', () => {
    const onPress = vi.fn()
    const { container } = render(
      <DetailRow caption="Includes activation" label="Network cost" testID="row" value="$1.24" onPress={onPress} />,
    )
    expect(container.querySelectorAll('svg')).toHaveLength(1)
    fireEvent.click(screen.getByText('Includes activation'))
    expect(onPress).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByTestId('row'))
    expect(onPress).toHaveBeenCalledTimes(2)
  })
})
