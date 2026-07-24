import type { ReactNode } from 'react'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { WithdrawAmountView } from '~/features/earn/WithdrawAmountView'
import { fireEvent, render, screen } from '~/test-utils/render'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  getDynamicConfigValue: ({ defaultValue }: { defaultValue: unknown }) => defaultValue,
}))

vi.mock('uniswap/src/components/CurrencyLogo/TokenLogo', () => ({ TokenLogo: () => null }))

vi.mock('uniswap/src/components/network/NetworkFilterV2/useNetworkSelectorOptions', () => ({
  useNetworkSelectorOptions: () => ({ otherNetworks: [], withBalances: [] }),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: () => ({ chains: [1, 11155111, 1301], isTestnetModeEnabled: true }),
}))

vi.mock('uniswap/src/features/fiatCurrency/hooks', () => ({
  useAppFiatCurrency: () => 'USD',
  useFiatCurrencyComponents: () => ({ symbol: '$' }),
}))

vi.mock('uniswap/src/features/language/LocalizationContext', () => ({
  useLocalizationContext: () => ({
    convertFiatAmount: (value: number) => ({ amount: value }),
    convertFiatAmountFormatted: (value: number) => `$${value.toFixed(2)}`,
    formatPercent: (value: number) => `${value}%`,
  }),
}))

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({ useCurrencyInfo: () => undefined }))

vi.mock('uniswap/src/features/transactions/hooks/useFiatTokenConversion', () => ({
  useFiatTokenConversion: () => ({ fiatToToken: () => null, tokenToFiat: () => null }),
}))

vi.mock('use-resize-observer', () => ({ default: () => ({ ref: vi.fn(), width: 0 }) }))

vi.mock('utilities/src/time/timing', async (importOriginal) => ({
  ...(await importOriginal<typeof import('utilities/src/time/timing')>()),
  useDebounce: (value: unknown) => value,
}))

vi.mock('~/components/AlternateCurrencyDisplay/AlternateCurrencyDisplay', () => ({
  AlternateCurrencyDisplay: () => null,
}))

vi.mock('~/components/NetworkFilter/NetworkFilter', () => ({
  NetworkFilter: ({ customTrigger }: { customTrigger: ReactNode }) => customTrigger,
}))

vi.mock('~/components/NumericalInput/LargeAmountInput', async () => {
  const React = await import('react')
  return {
    NumericalInputMimic: React.forwardRef(({ children }: { children: ReactNode }, _ref) => children),
    NumericalInputSymbolContainer: ({ children }: { children: ReactNode }) => children,
    NumericalInputWrapper: ({ children }: { children: ReactNode }) => children,
    StyledNumericalInput: React.forwardRef(({ value }: { value: string }, _ref) => (
      <input aria-label="withdraw amount" readOnly value={value} />
    )),
  }
})

vi.mock('~/features/accounts/store/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/accounts/store/hooks')>()),
  useActiveAddresses: () => ({}),
}))

vi.mock('~/features/earn/EarnAmountViewHeader', () => ({ EarnAmountViewHeader: () => null }))

const mainnetUsdt = getChainInfo(UniverseChainId.Mainnet).tokens.USDT
if (!mainnetUsdt) {
  throw new Error('Expected Mainnet USDT to be configured')
}

const vault: EarnVaultInfo = {
  id: 'mainnet-usdt-vault',
  currencyId: buildCurrencyId(UniverseChainId.Mainnet, mainnetUsdt.address),
  displayCurrencyId: buildCurrencyId(UniverseChainId.Mainnet, mainnetUsdt.address),
  vaultAddress: '0x0000000000000000000000000000000000000002',
  chainId: UniverseChainId.Mainnet,
  apyPercent: 5,
  exposureCurrencyIds: [],
  exposures: [],
  totalDepositsUsd: 1_000,
  liquidityRaw: '1000000000',
  liquidityUsd: 1_000,
  curator: { name: 'Gauntlet' },
}

const position: EarnPositionInfo = {
  vaultId: vault.id,
  depositedUsd: 100,
  depositedRaw: '100000000',
  apyPercent: 5,
  sharesRaw: '100000000',
}

describe(WithdrawAmountView, () => {
  it('renders an unavailable destination and keeps review disabled when filtering returns no chains', () => {
    const onReview = vi.fn()

    render(
      <WithdrawAmountView
        vault={vault}
        position={position}
        initialAmount="1"
        initialChainId={UniverseChainId.Mainnet}
        onBack={vi.fn()}
        onClose={vi.fn()}
        onReview={onReview}
      />,
    )

    expect(screen.getAllByText('Unavailable')).toHaveLength(2)
    expect(screen.queryByText('USD Coin')).not.toBeInTheDocument()

    const reviewButton = screen.getByRole('button', { name: 'Review' })
    expect(reviewButton).toBeDisabled()
    fireEvent.click(reviewButton)
    expect(onReview).not.toHaveBeenCalled()
  })
})
