import { render } from '@testing-library/react'
import { TradingApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import type { PropsWithChildren } from 'react'
import { ExpandableRows } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/ExpandableRows'

const { mockState } = vi.hoisted(() => ({ mockState: { routing: 'CLASSIC' as string } }))

function buildDerivedSwapInfo(routing: string): unknown {
  return {
    chainId: UniverseChainId.Base,
    currencyAmountsUSDValue: {},
    trade: {
      trade: {
        routing,
        quote: { routing, quote: { steps: [] } },
        inputAmount: { currency: { chainId: UniverseChainId.Base } },
        outputAmount: { currency: { chainId: UniverseChainId.Mainnet } },
        swapFee: undefined,
        indicative: false,
      },
    },
  }
}

vi.mock('uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore', () => ({
  useSwapFormStore: (selector: (s: unknown) => unknown): unknown =>
    selector({ derivedSwapInfo: buildDerivedSwapInfo(mockState.routing) }),
}))

vi.mock('uniswap/src/features/transactions/swap/stores/swapTxStore/useSwapTxStore', () => ({
  useSwapTxStore: (selector: (s: unknown) => unknown): unknown =>
    selector({ routing: mockState.routing, gasFee: { isLoading: false }, txRequests: undefined }),
}))

vi.mock(
  'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore',
  () => ({
    useTransactionSettingsStore: (selector: (s: unknown) => unknown): unknown => selector({}),
    useTransactionSettingsAutoSlippageToleranceStore: (selector: (s: unknown) => unknown): unknown => selector({}),
  }),
)

vi.mock('uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings', () => ({
  useParsedSwapWarnings: () => ({ priceImpactWarning: undefined }),
}))
vi.mock('uniswap/src/features/transactions/swap/hooks/useFeeOnTransferAmount', () => ({
  useFeeOnTransferAmounts: () => undefined,
}))
vi.mock('uniswap/src/features/transactions/swap/utils/getSwapFeeUsd', () => ({
  getSwapFeeUsdFromDerivedSwapInfo: () => undefined,
}))
vi.mock('uniswap/src/features/gas/hooks/useEnableCustomGasFeeEntry', () => ({
  useEnableCustomGasFeeEntry: () => false,
}))
vi.mock('uniswap/src/features/gas/hooks/useIsCustomGasFlowAvailable', () => ({
  useIsCustomGasFlowAvailable: () => false,
}))

vi.mock('@universe/mycelium/height-animator', () => ({
  HeightAnimator: ({ children }: PropsWithChildren): JSX.Element => <>{children}</>,
}))
vi.mock('uniswap/src/features/transactions/TransactionDetails/TransactionDetails', () => ({
  TransactionDetails: ({ children }: PropsWithChildren): JSX.Element => <>{children}</>,
}))
vi.mock('uniswap/src/features/transactions/swap/components/RoutingInfo/RoutingInfo', () => ({
  RoutingInfo: (): JSX.Element => <div data-testid="routing-info" />,
}))
vi.mock('uniswap/src/features/transactions/swap/components/MaxSlippageRow/MaxSlippageRow', () => ({
  MaxSlippageRow: (): JSX.Element => <div data-testid="max-slippage" />,
}))

describe(ExpandableRows, () => {
  it.each([
    { routing: TradingApi.Routing.BRIDGE, routingRow: true, slippageRow: false },
    { routing: TradingApi.Routing.CLASSIC, routingRow: true, slippageRow: true },
    { routing: TradingApi.Routing.CHAINED, routingRow: true, slippageRow: true },
    { routing: TradingApi.Routing.WRAP, routingRow: false, slippageRow: true },
  ])('$routing: routing row $routingRow, max slippage row $slippageRow', ({ routing, routingRow, slippageRow }) => {
    mockState.routing = routing

    const { queryByTestId } = render(<ExpandableRows expanded />)

    expect(Boolean(queryByTestId('routing-info'))).toBe(routingRow)
    expect(Boolean(queryByTestId('max-slippage'))).toBe(slippageRow)
  })

  it('renders no rows while collapsed', () => {
    mockState.routing = TradingApi.Routing.BRIDGE

    const { queryByTestId } = render(<ExpandableRows expanded={false} />)

    expect(queryByTestId('routing-info')).toBeNull()
  })
})
