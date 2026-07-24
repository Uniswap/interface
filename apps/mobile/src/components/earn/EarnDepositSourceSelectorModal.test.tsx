import type { ReactNode } from 'react'
import { EarnDepositSourceSelectorModal } from 'src/components/earn/EarnDepositSourceSelectorModal'
import { render, screen } from 'src/test/test-utils'
import { useEarnDepositSources } from 'uniswap/src/features/earn/hooks/useEarnDepositSources'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'

const useEarnDepositSourcesMock = vi.mocked(useEarnDepositSources)
const useCurrencyInfoMock = vi.mocked(useCurrencyInfo)

vi.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetScrollView: ({ children }: { children: ReactNode }) => children,
}))

vi.mock('src/app/navigation/types', () => ({
  useAppStackNavigation: () => ({ popTo: vi.fn() }),
}))

vi.mock('src/components/earn/EarnDepositAmountControls', async () => {
  const { Text } = await vi.importActual<typeof import('react-native')>('react-native')
  return {
    DepositSourceMenuItem: ({
      canonicalTokenName,
      option,
    }: {
      canonicalTokenName?: string
      option: { id: string }
    }) => <Text>{`${canonicalTokenName}|${option.id}`}</Text>,
  }
})

vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children }: { children: ReactNode }) => children,
}))

vi.mock('uniswap/src/features/earn/hooks/useEarnDepositSources', () => ({
  useEarnDepositSources: vi.fn(),
}))

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfo: vi.fn(),
}))

vi.mock('wallet/src/features/wallet/hooks', () => ({
  useActiveAccountAddress: () => '0x0000000000000000000000000000000000000001',
}))

describe(EarnDepositSourceSelectorModal, (): void => {
  it('uses the display currency name as the primary label for every source network', (): void => {
    useCurrencyInfoMock.mockReturnValue({ currency: { name: 'USD Coin' } } as ReturnType<typeof useCurrencyInfo>)
    useEarnDepositSourcesMock.mockReturnValue({
      depositSourceOptions: [
        {
          id: 'base-usdc',
          currencyInfo: { currencyId: '8453-source-address' },
        },
      ],
    } as ReturnType<typeof useEarnDepositSources>)

    render(
      <EarnDepositSourceSelectorModal
        isOpen
        vaultCurrencyId="1-vault-address"
        vaultDisplayCurrencyId="1-display-address"
        onClose={vi.fn()}
      />,
    )

    expect(useCurrencyInfoMock).toHaveBeenCalledWith('1-display-address')
    expect(screen.getByText('USD Coin|base-usdc')).toBeTruthy()
  })
})
