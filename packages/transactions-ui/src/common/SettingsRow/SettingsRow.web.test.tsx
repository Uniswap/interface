// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { SettingsRow, SettingsRowList } from '@universe/transactions-ui/src/common/SettingsRow/SettingsRow'
import { describe, expect, it, vi } from 'vitest'

// Web DOM assertions (svg counts, test ids on icons, class names, keyboard): the native leg
// renders through react-native-web and does not produce them.
describe('SettingsRow (web DOM)', () => {
  it('reports the next switch state and leaves the state to the caller', () => {
    const onCheckedChange = vi.fn()
    render(<SettingsRow label="Swap protection" toggle={{ checked: false, onCheckedChange }} />)
    fireEvent.click(screen.getByRole('switch'))
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it('stops a press on the value side even without a page to open', () => {
    const onClickParent = vi.fn()
    render(
      <div onClick={onClickParent}>
        <SettingsRow label="Max slippage" value="0.5%" />
      </div>,
    )
    fireEvent.click(screen.getByText('0.5%'))
    expect(onClickParent).not.toHaveBeenCalled()
  })
})
