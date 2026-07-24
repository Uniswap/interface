import type { ReactNode } from 'react'
import { EarnDepositAmountContent } from 'src/components/earn/EarnDepositAmountContent'
import { fireEvent, render, screen } from 'src/test/test-utils'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EarnAction, type EarnPositionInfo, type EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

const UNICHAIN_USDT0_ADDRESS = '0x9151434b16b9763660705744891fA906F660EcC5'
const setInputFontSizeMock = vi.hoisted(() => vi.fn())

vi.mock('src/components/earn/EarnDepositAmountControls', () => ({
  AmountEntrySection: () => null,
  EarnHelpIconButton: () => null,
  getFormattedAlternateAmount: () => '',
}))

vi.mock('src/components/earn/EarnDepositAmountSections', () => ({
  EarnDepositLookupState: ({ children }: { children: ReactNode }) => children,
  EarnDepositSourceSection: () => null,
  EarnProjectedEarningsRow: () => null,
  EarnWithdrawDestinationSection: () => null,
}))

vi.mock('src/components/earn/earnDepositAmountUiState', () => ({
  getEarnDepositAmountUiState: () => ({ ctaLabel: 'Review', inlineError: undefined, isReviewDisabled: false }),
  getHasRequiredSelection: () => true,
  getIsEarnAmountConversionPending: () => false,
}))

vi.mock('src/components/earn/useEarnDepositAmountInlineErrors', () => ({
  useEarnDepositAmountInlineErrors: () => ({
    debouncedIsOverWithdrawableLiquidity: false,
    isBelowMinimumDeposit: false,
    showMinimumDepositInlineError: false,
  }),
}))

vi.mock('src/components/layout/Screen', () => ({
  Screen: ({ children }: { children: ReactNode }) => children,
}))

vi.mock('ui/src/components/layout/AnimatedFlex', () => ({
  AnimatedFlex: ({ children }: { children: ReactNode }) => children,
}))

vi.mock('ui/src/hooks/useDynamicFontSizing', () => ({
  useDynamicFontSizing: () => ({
    fontSize: 48,
    onExtraElementLayout: vi.fn(),
    onLayout: vi.fn(),
    onSetFontSize: setInputFontSizeMock,
  }),
}))

vi.mock('uniswap/src/components/modals/BottomSheetContext', () => ({
  useBottomSheetContext: () => ({ isSheetReady: true }),
}))

vi.mock('uniswap/src/components/modals/HandleBar', () => ({ HandleBar: () => null }))
vi.mock('uniswap/src/components/pill/PillMultiToggle', () => ({ PillMultiToggle: () => null }))

vi.mock('uniswap/src/features/earn/config', () => ({ useEarnMinDepositUsd: () => 1 }))

vi.mock('uniswap/src/features/earn/hooks/useEarnAmountEntryMobile', () => ({
  useEarnAmountEntryMobile: () => ({
    value: '10',
    exactValueRef: { current: '10' },
    exactAmountFiat: '10',
    exactAmountToken: '10',
    isFiatInput: false,
    maxDecimals: 2,
    parsedAmount: 10,
    hasInputAmount: true,
    tokenComparisonAmount: 10,
    localFiatComparisonAmount: 10,
    isMaxSelected: false,
    setActiveAmount: vi.fn(),
    handlePercentPress: vi.fn(),
    handleToggleInputMode: vi.fn(),
    resetAmounts: vi.fn(),
  }),
}))

vi.mock('uniswap/src/features/earn/hooks/useEarnDepositCurrencyContext', () => ({
  useEarnDepositCurrencyContext: () => ({
    currencyInfo: { currency: { symbol: 'USDC' } },
    symbol: 'USDC',
    walletBalance: 0,
    withdrawableBalanceUsd: 100,
    availableBalance: 100,
    isWithdrawLiquidityLimited: false,
    destinationCurrencyId: 'context-destination',
  }),
}))

vi.mock('uniswap/src/features/earn/hooks/useEarnDepositSources', () => ({
  useEarnDepositSources: () => ({
    balanceLookupErrored: false,
    balanceLookupHasData: true,
    balanceLookupSettled: true,
    depositSourceOptions: [],
    refetchBalanceLookup: vi.fn(),
  }),
}))

vi.mock('uniswap/src/features/earn/utils', async () => ({
  ...(await vi.importActual('uniswap/src/features/earn/utils')),
  hasConfirmedEarnPositionRawBalance: () => true,
}))

vi.mock('uniswap/src/features/fiatCurrency/hooks', () => ({
  useAppFiatCurrencyInfo: () => ({ code: 'USD', symbol: '$' }),
}))

vi.mock('uniswap/src/features/language/LocalizationContext', () => ({
  useLocalizationContext: () => ({
    convertFiatAmount: (value: number) => ({ amount: value }),
    formatNumberOrString: ({ value }: { value: number }) => String(value),
    formatPercent: (value: number) => String(value),
  }),
}))

vi.mock('uniswap/src/features/transactions/components/DecimalPadInput/DecimalPadInput', async () => {
  const React = await vi.importActual<typeof import('react')>('react')
  return {
    DecimalPadCalculatedSpaceId: { EarnDeposit: 'EarnDeposit' },
    DecimalPadCalculateSpace: () => null,
    DecimalPadInput: React.forwardRef(() => null),
  }
})

vi.mock('wallet/src/features/wallet/hooks', () => ({
  useActiveAccountAddress: () => '0x0000000000000000000000000000000000000001',
}))

function getStablecoinCurrencyId(chainId: UniverseChainId, symbol: 'USDC' | 'USDT'): string {
  const token = getChainInfo(chainId).tokens[symbol]
  if (!token) {
    throw new Error(`Expected ${symbol} to be configured on chain ${chainId}`)
  }
  return buildCurrencyId(chainId, token.address)
}

function createVault(symbol: 'USDC' | 'USDT'): EarnVaultInfo {
  const currencyId = getStablecoinCurrencyId(UniverseChainId.Mainnet, symbol)
  return {
    chainId: UniverseChainId.Mainnet,
    currencyId,
    displayCurrencyId: currencyId,
    apyPercent: 5,
  } as EarnVaultInfo
}

const position = {} as EarnPositionInfo

function renderWithdrawContent({
  initialChainId,
  vault,
  onReview,
}: {
  initialChainId: UniverseChainId
  vault: EarnVaultInfo
  onReview: ReturnType<typeof vi.fn>
}): void {
  render(
    <EarnDepositAmountContent
      initialAction={EarnAction.Withdraw}
      initialChainId={initialChainId}
      position={position}
      vault={vault}
      onOpenDepositSourceSelector={vi.fn()}
      onOpenNetworkSelector={vi.fn()}
      onOpenVaultDetails={vi.fn()}
      onReview={onReview}
    />,
  )
  fireEvent.press(screen.getByText('Review'))
}

describe(EarnDepositAmountContent, () => {
  beforeEach((): void => {
    setInputFontSizeMock.mockClear()
  })

  it('sizes the amount input using its full token display value', (): void => {
    render(
      <EarnDepositAmountContent
        initialAction={EarnAction.Deposit}
        position={position}
        vault={createVault('USDC')}
        onOpenDepositSourceSelector={vi.fn()}
        onOpenNetworkSelector={vi.fn()}
        onOpenVaultDetails={vi.fn()}
        onReview={vi.fn()}
      />,
    )
    expect(setInputFontSizeMock).toHaveBeenCalledWith('10 USDC')
  })

  it('reviews a deposit when the vault has no eligible withdraw destination', () => {
    const onReview = vi.fn()
    const currencyId = buildCurrencyId(UniverseChainId.Polygon, '0x0000000000000000000000000000000000000002')
    const vault = {
      chainId: UniverseChainId.Polygon,
      currencyId,
      displayCurrencyId: currencyId,
      apyPercent: 5,
    } as EarnVaultInfo

    render(
      <EarnDepositAmountContent
        initialAction={EarnAction.Deposit}
        position={position}
        vault={vault}
        onOpenDepositSourceSelector={vi.fn()}
        onOpenNetworkSelector={vi.fn()}
        onOpenVaultDetails={vi.fn()}
        onReview={onReview}
      />,
    )
    fireEvent.press(screen.getByText('Review'))

    expect(onReview).toHaveBeenCalledWith(
      expect.objectContaining({
        action: EarnAction.Deposit,
        chainId: UniverseChainId.Polygon,
        destinationCurrencyId: 'context-destination',
      }),
    )
  })

  it('reviews USDT/Unichain input with the Unichain USDT0 destination', () => {
    const onReview = vi.fn()
    const vault = createVault('USDT')

    renderWithdrawContent({ initialChainId: UniverseChainId.Unichain, vault, onReview })

    expect(onReview).toHaveBeenCalledWith(
      expect.objectContaining({
        action: EarnAction.Withdraw,
        chainId: UniverseChainId.Unichain,
        destinationCurrencyId: buildCurrencyId(UniverseChainId.Unichain, UNICHAIN_USDT0_ADDRESS),
      }),
    )
  })

  it('reviews valid USDC/Unichain input with the Unichain USDC destination', () => {
    const onReview = vi.fn()
    const vault = createVault('USDC')

    renderWithdrawContent({ initialChainId: UniverseChainId.Unichain, vault, onReview })

    expect(onReview).toHaveBeenCalledWith(
      expect.objectContaining({
        action: EarnAction.Withdraw,
        chainId: UniverseChainId.Unichain,
        destinationCurrencyId: getStablecoinCurrencyId(UniverseChainId.Unichain, 'USDC'),
      }),
    )
  })

  it('falls back from an ineligible requested chain before reviewing', () => {
    const onReview = vi.fn()
    const vault = createVault('USDC')

    renderWithdrawContent({ initialChainId: UniverseChainId.Polygon, vault, onReview })

    expect(onReview).toHaveBeenCalledWith(
      expect.objectContaining({
        action: EarnAction.Withdraw,
        chainId: UniverseChainId.Mainnet,
        destinationCurrencyId: vault.currencyId,
      }),
    )
  })
})
