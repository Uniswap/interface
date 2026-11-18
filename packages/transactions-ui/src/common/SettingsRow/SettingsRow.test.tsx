// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { SettingsRow, SettingsRowList } from '@universe/transactions-ui/src/common/SettingsRow/SettingsRow'
import { WarningLine } from '@universe/transactions-ui/src/common/WarningLine/WarningLine'
import { describe, expect, it, vi } from 'vitest'

describe('SettingsRow', () => {
  it('renders the label, description and a string value', () => {
    render(<SettingsRow description="Ethereum Network" label="Swap deadline" value="30 minutes" />)
    expect(screen.getByText('Swap deadline')).toBeTruthy()
    expect(screen.getByText('Ethereum Network')).toBeTruthy()
    expect(screen.getByText('30 minutes')).toBeTruthy()
  })

  it('renders a node value and the info tooltip slot', () => {
    render(<SettingsRow infoTooltip={<span>info</span>} label="Max slippage" value={<span>editor</span>} />)
    expect(screen.getByText('editor')).toBeTruthy()
    expect(screen.getByText('info')).toBeTruthy()
  })

  it('reports presses on the value side and on the label side', () => {
    const onPress = vi.fn()
    const onPressInfo = vi.fn()
    render(<SettingsRow label="Trade options" value="Default" onPress={onPress} onPressInfo={onPressInfo} />)
    fireEvent.click(screen.getByText('Default'))
    expect(onPress).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByText('Trade options'))
    expect(onPressInfo).toHaveBeenCalledTimes(1)
  })

  it('renders the description and warning slots', () => {
    render(
      <SettingsRow
        description={<span>Unavailable on Base</span>}
        label="Max slippage"
        value="25%"
        warning={<WarningLine level="critical" message="Very high slippage" />}
      />,
    )
    expect(screen.getByText('Unavailable on Base')).toBeTruthy()
    expect(screen.getByText('Very high slippage')).toBeTruthy()
  })
})

describe('SettingsRowList', () => {
  it('renders its rows', () => {
    render(
      <SettingsRowList>
        <SettingsRow label="Swap deadline" value="30 minutes" />
        <SettingsRow label="Trade options" value="Default" />
      </SettingsRowList>,
    )
    expect(screen.getByText('Swap deadline')).toBeTruthy()
    expect(screen.getByText('Trade options')).toBeTruthy()
  })
})
