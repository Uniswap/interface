import { fireEvent } from '@testing-library/react-native'
import { NetworkCostRow } from 'uniswap/src/features/gas/components/NetworkCostRow'
import { renderWithProviders } from 'uniswap/src/test/render'

vi.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => {
      const translations: Record<string, string> = {
        'common.auto': 'Auto',
        'gas.override.title': 'Network cost',
        'swap.warning.networkFee.includesDelegation': 'Includes smart wallet activation',
        'swap.warning.networkFee.includesSmartWalletUpdate': 'Includes smart wallet update',
      }
      return translations[key] ?? key
    },
  }),
}))

describe('NetworkCostRow', () => {
  it('shows Auto pill when custom entry is enabled but no overrides are saved', () => {
    const { getByText } = renderWithProviders(
      <NetworkCostRow
        gasFeeUsd="$1.54"
        enableCustomGasFeeEntry
        hasOverrides={false}
        hasWarning={false}
        onPress={vi.fn()}
      />,
    )
    expect(getByText(/Auto/i)).toBeTruthy()
  })

  it('hides Auto pill when custom entry is disabled', () => {
    const { queryByText } = renderWithProviders(
      <NetworkCostRow
        gasFeeUsd="$1.54"
        enableCustomGasFeeEntry={false}
        hasOverrides={false}
        hasWarning={false}
        onPress={vi.fn()}
      />,
    )
    expect(queryByText(/Auto/i)).toBeNull()
  })

  it('shows amber alert icon when custom overrides have a warning', () => {
    const { queryByText, getByTestId } = renderWithProviders(
      <NetworkCostRow gasFeeUsd="$1.54" enableCustomGasFeeEntry hasOverrides hasWarning onPress={vi.fn()} />,
    )
    expect(queryByText(/Auto/i)).toBeNull()
    expect(getByTestId('network-cost-warning-icon')).toBeTruthy()
  })

  it('hides warning icon when custom overrides have no warning', () => {
    const { queryByTestId } = renderWithProviders(
      <NetworkCostRow gasFeeUsd="$1.54" enableCustomGasFeeEntry hasOverrides hasWarning={false} onPress={vi.fn()} />,
    )
    expect(queryByTestId('network-cost-warning-icon')).toBeNull()
  })

  it('calls onPress when tapped', () => {
    const onPress = vi.fn()
    const { getByText } = renderWithProviders(
      <NetworkCostRow
        gasFeeUsd="$1.54"
        enableCustomGasFeeEntry
        hasOverrides={false}
        hasWarning={false}
        onPress={onPress}
      />,
    )
    fireEvent.press(getByText('$1.54'))
    expect(onPress).toHaveBeenCalled()
  })

  it('does not call onPress and hides the chevron when pressable=false', () => {
    const onPress = vi.fn()
    const { getByText } = renderWithProviders(
      <NetworkCostRow
        gasFeeUsd="$1.54"
        enableCustomGasFeeEntry
        hasOverrides={false}
        hasWarning={false}
        pressable={false}
        onPress={onPress}
      />,
    )
    // The value is still rendered; tapping it on a non-pressable row is a no-op
    // (no TouchableArea wraps it).
    fireEvent.press(getByText('$1.54'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('renders the smart wallet activation subtitle when includesDelegation is true', () => {
    const { getByText } = renderWithProviders(
      <NetworkCostRow
        gasFeeUsd="$1.54"
        enableCustomGasFeeEntry
        hasOverrides={false}
        hasWarning={false}
        includesDelegation
        pressable={false}
        onPress={vi.fn()}
      />,
    )
    expect(getByText('Includes smart wallet activation')).toBeTruthy()
  })

  it('renders the smart wallet update subtitle when the delegation is an upgrade', () => {
    const { getByText, queryByText } = renderWithProviders(
      <NetworkCostRow
        gasFeeUsd="$1.54"
        enableCustomGasFeeEntry
        hasOverrides={false}
        hasWarning={false}
        includesDelegation
        includesDelegationUpgrade
        pressable={false}
        onPress={vi.fn()}
      />,
    )
    expect(getByText('Includes smart wallet update')).toBeTruthy()
    expect(queryByText('Includes smart wallet activation')).toBeNull()
  })

  it('ignores includesDelegationUpgrade when includesDelegation is false', () => {
    const { queryByText } = renderWithProviders(
      <NetworkCostRow
        gasFeeUsd="$1.54"
        enableCustomGasFeeEntry
        hasOverrides={false}
        hasWarning={false}
        includesDelegationUpgrade
        pressable={false}
        onPress={vi.fn()}
      />,
    )
    expect(queryByText('Includes smart wallet update')).toBeNull()
    expect(queryByText('Includes smart wallet activation')).toBeNull()
  })

  it('hides the smart wallet activation subtitle when includesDelegation is omitted', () => {
    const { queryByText } = renderWithProviders(
      <NetworkCostRow
        gasFeeUsd="$1.54"
        enableCustomGasFeeEntry
        hasOverrides={false}
        hasWarning={false}
        onPress={vi.fn()}
      />,
    )
    expect(queryByText('Includes smart wallet activation')).toBeNull()
  })

  it('renders both the amber warning icon and the delegation subtitle together', () => {
    const { getByTestId, getByText } = renderWithProviders(
      <NetworkCostRow
        gasFeeUsd="$1.54"
        enableCustomGasFeeEntry
        hasOverrides
        hasWarning
        includesDelegation
        pressable={false}
        onPress={vi.fn()}
      />,
    )
    expect(getByTestId('network-cost-warning-icon')).toBeTruthy()
    expect(getByText('Includes smart wallet activation')).toBeTruthy()
  })
})
