import { screen } from '@testing-library/react'
import { TestID } from '@universe/test'
import type { ReactNode } from 'react'
import type { MarginActivePosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MARGIN_CHAIN_ID } from '~/constants/margin'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { MarginActionModals } from '~/pages/Swap/Margin/components/MarginActionModals'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'
import { render } from '~/test-utils/render'

const MARKET = getDefaultMarginMarket()

const { SWAPPER, SUB_ID, mockUseMarginQuote } = vi.hoisted(() => ({
  SWAPPER: '0x00000000000000000000000000000000000000A1',
  SUB_ID: '7',
  mockUseMarginQuote: vi.fn(),
}))

vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children }: { children: ReactNode }) => children,
}))

vi.mock('uniswap/src/components/AmountInput/AmountInput', () => ({
  AmountInput: (props: Record<string, unknown>) => <input aria-label={props['aria-label'] as string | undefined} />,
}))

vi.mock('~/pages/Swap/Margin/components/MarginPaymentTokenSelector', () => ({
  MarginPaymentTokenSelector: () => null,
}))

vi.mock('~/pages/Swap/Margin/components/shared/MarginLeverageSlider', () => ({
  MarginLeverageSlider: () => null,
}))

vi.mock('~/hooks/useAccount', () => ({ useAccount: () => ({ address: SWAPPER }) }))

vi.mock('~/pages/Swap/Margin/hooks/useExecuteMarginPlan', () => ({
  useExecuteMarginPlan: () => ({ executePlan: vi.fn() }),
}))

vi.mock('~/pages/Swap/Margin/hooks/useIsPlanInFlight', () => ({ useIsPlanInFlight: () => false }))

vi.mock('~/pages/Swap/Margin/hooks/useMarginCurrencyInfos', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/pages/Swap/Margin/hooks/useMarginCurrencyInfos')>()),
  useMarginCurrencyInfos: () => new Map(),
}))

vi.mock('~/pages/Swap/Margin/hooks/useMarginPaymentTokenBalance', () => ({
  useMarginPaymentTokenBalance: () => ({ spendableBalanceRaw: '1000000000000000000', portfolioLoaded: true }),
}))

// Spreads the original: the controller also imports marginQuoteKey from this module. One mock now
// covers the close path too — the adjust modals and the close modal share this hook.
vi.mock('~/pages/Swap/Margin/hooks/useMarginQuote', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/pages/Swap/Margin/hooks/useMarginQuote')>()),
  useMarginQuote: mockUseMarginQuote,
}))

vi.mock('uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore', () => ({
  useMarginFormStore: (selector: (s: { slippageToleranceBps: number; excludedVenues: string[] }) => unknown) =>
    selector({ slippageToleranceBps: 50, excludedVenues: [] }),
}))

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfo: () => undefined,
  useCurrencyInfos: () => [],
}))

const ACCOUNT = '0x000000000000000000000000000000000000000A'

const POSITION: MarginActivePosition = {
  positionId: SUB_ID,
  status: 'ACTIVE',
  direction: MarginDirection.LONG,
  exposureToken: { address: MARKET.collateral.address, chainId: MARGIN_CHAIN_ID, decimals: MARKET.collateral.decimals },
  counterToken: { address: MARKET.debt.address, chainId: MARGIN_CHAIN_ID, decimals: MARKET.debt.decimals },
  size: '2000000000000000000', // 2 WETH
  entryPrice: '1850000000000000000000',
  openedAt: '1753000000',
  legs: [{ venue: 'MORPHO', subId: SUB_ID, account: ACCOUNT, debt: '2000000000' }],
  isTradable: true,
  equity: '2000000000', // 2000 USDC
  leverage: '2',
  oraclePrice: '2000000000000000000000', // $2000/ETH
  liquidationPrice: '1162790697674418604651',
  buffer: '400000000000000000',
  healthFactor: '1720000000000000000',
  maxWithdrawable: '500000000000000000',
}

describe('MarginActionModals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseMarginQuote.mockReturnValue({
      quote: undefined,
      quoteError: null,
      isQuoteLoading: false,
      isFetching: false,
      isDebouncing: false,
      isPlaceholderData: false,
      debouncedKey: 'none:::0x0000000000000000000000000000000000000000:1',
    })
  })

  // Before this dispatch became a switch, the function ended in a bare `return <MarginCloseModal>` —
  // so add/withdraw/leverage would all have opened the CLOSE modal. Destructive, and silent.
  it.each([
    ['add', 'Add margin'],
    ['withdraw', 'Withdraw margin'],
    ['leverage', 'Change leverage'],
    ['adjust', 'Adjust position'],
    ['close', 'Close position'],
  ] as const)('routes %s to its own modal', (action, expectedTitle) => {
    render(
      <MarginActionModals
        request={{ action, positionId: SUB_ID }}
        positions={[POSITION]}
        resolveMarket={() => MARKET}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByTestId(TestID.MarginModalTitle)).toHaveTextContent(expectedTitle)
  })

  it('renders nothing without a request', () => {
    render(<MarginActionModals request={null} positions={[POSITION]} resolveMarket={() => MARKET} onClose={vi.fn()} />)
    expect(screen.queryByTestId(TestID.MarginModalTitle)).not.toBeInTheDocument()
  })

  it('self-closes when the market cannot be resolved', () => {
    const onClose = vi.fn()
    render(
      <MarginActionModals
        request={{ action: 'add', positionId: SUB_ID }}
        positions={[POSITION]}
        resolveMarket={() => undefined}
        onClose={onClose}
      />,
    )
    expect(onClose).toHaveBeenCalled()
  })

  // The other half of the same branch: positions LOADED but the requested id absent — the position was
  // closed elsewhere while its menu was open. Closing silently would read as the button doing nothing,
  // so the branch also toasts; only the market-missing case was covered.
  it('toasts and self-closes when the requested position is gone', () => {
    const addPopup = vi.spyOn(popupRegistry, 'addPopup')
    const onClose = vi.fn()
    render(
      <MarginActionModals
        request={{ action: 'add', positionId: 'no-such-position' }}
        positions={[POSITION]}
        resolveMarket={() => MARKET}
        onClose={onClose}
      />,
    )
    expect(onClose).toHaveBeenCalled()
    expect(addPopup).toHaveBeenCalledWith(
      expect.objectContaining({ type: PopupType.Error }),
      'margin-action-unavailable-no-such-position',
    )
    addPopup.mockRestore()
  })

  // Positions still LOADING is not the same fact as a missing position: closing there would tear down a
  // modal the user just opened, before the query has said anything.
  it('waits rather than closing while positions are still loading', () => {
    const onClose = vi.fn()
    render(
      <MarginActionModals
        request={{ action: 'add', positionId: SUB_ID }}
        positions={undefined}
        resolveMarket={() => MARKET}
        onClose={onClose}
      />,
    )
    expect(onClose).not.toHaveBeenCalled()
  })
})
