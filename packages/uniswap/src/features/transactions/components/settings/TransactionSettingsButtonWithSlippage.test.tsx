import { fireEvent, screen } from '@testing-library/react-native'
import { TransactionSettingsButtonWithSlippage } from 'uniswap/src/features/transactions/components/settings/TransactionSettingsButtonWithSlippage'
import { renderWithProviders } from 'uniswap/src/test/render'

const mocks = vi.hoisted(() => ({
  customSlippageTolerance: undefined as number | undefined,
  isSettingsOpen: false,
}))

vi.mock('@universe/mycelium/icons/Settings', async () => {
  const { View } = await import('react-native')
  return { Settings: (): JSX.Element => <View testID="gear" /> }
})

vi.mock('@universe/mycelium/icons/SettingsWarning', async () => {
  const { View } = await import('react-native')
  return { SettingsWarning: (): JSX.Element => <View testID="warning-gear" /> }
})

vi.mock(
  'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore',
  () => ({
    useTransactionSettingsStore: (selector: (s: { customSlippageTolerance?: number }) => unknown): unknown =>
      selector({ customSlippageTolerance: mocks.customSlippageTolerance }),
  }),
)

vi.mock(
  'uniswap/src/features/transactions/components/settings/stores/TransactionSettingsModalStore/useTransactionSettingsModalStore',
  () => ({ useModalVisibility: (): boolean => mocks.isSettingsOpen }),
)

function renderButton(customSlippageTolerance: number | undefined): { onPress: () => void } {
  mocks.customSlippageTolerance = customSlippageTolerance
  const onPress = vi.fn()
  renderWithProviders(
    <TransactionSettingsButtonWithSlippage autoSlippageTolerance={0.5} testID="settings" onPress={onPress} />,
  )
  return { onPress }
}

describe('TransactionSettingsButtonWithSlippage', () => {
  it('shows the plain gear while auto, and reports the press', () => {
    const { onPress } = renderButton(undefined)
    expect(screen.getByTestId('gear')).toBeTruthy()
    fireEvent.press(screen.getByTestId('settings'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('keeps the plain gear just under 20%', () => {
    renderButton(19.99)
    expect(screen.getByTestId('gear')).toBeTruthy()
    expect(screen.queryByTestId('warning-gear')).toBeNull()
  })

  // The one intended change: the gear used to swap only above 20%, while the tint was already critical at 20%.
  it('swaps to the warning gear at exactly 20%', () => {
    renderButton(20)
    expect(screen.getByTestId('warning-gear')).toBeTruthy()
    expect(screen.queryByTestId('gear')).toBeNull()
  })

  it('shows the custom value in front of the gear', () => {
    renderButton(0.75)
    expect(screen.getByText('0.75%')).toBeTruthy()
  })
})
