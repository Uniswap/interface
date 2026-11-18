// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { SettingsTrigger } from '@universe/transactions-ui/src/common/SettingsTrigger/SettingsTrigger'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@universe/mycelium/icons/Settings', () => ({ Settings: (): JSX.Element => <span data-testid="gear" /> }))
vi.mock('@universe/mycelium/icons/SettingsWarning', () => ({
  SettingsWarning: (): JSX.Element => <span data-testid="warning-gear" />,
}))

describe('SettingsTrigger', () => {
  it('renders the gear alone while auto, and reports the press', () => {
    const onPress = vi.fn()
    const { container } = render(<SettingsTrigger testID="settings" onPress={onPress} />)
    expect(container.textContent).toBe('')
    fireEvent.click(screen.getByTestId('settings'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('shows the custom value in front of the gear', () => {
    render(<SettingsTrigger isCustom customValue="0.75%" onPress={vi.fn()} />)
    expect(screen.getByText('0.75%')).toBeTruthy()
  })

  it('keeps the value and press with a warning tooltip', () => {
    const onPress = vi.fn()
    render(
      <SettingsTrigger
        isCustom
        customValue="25%"
        testID="settings"
        tooltip="Try lowering your slippage setting."
        warningLevel="critical"
        onPress={onPress}
      />,
    )
    expect(screen.getByText('25%')).toBeTruthy()
    fireEvent.click(screen.getByTestId('settings'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('swaps in the warning gear for critical only', () => {
    const { rerender } = render(<SettingsTrigger isCustom warningLevel="critical" onPress={vi.fn()} />)
    expect(screen.getByTestId('warning-gear')).toBeTruthy()
    rerender(<SettingsTrigger isCustom warningLevel="warning" onPress={vi.fn()} />)
    expect(screen.getByTestId('gear')).toBeTruthy()
    expect(screen.queryByTestId('warning-gear')).toBeNull()
  })
})
