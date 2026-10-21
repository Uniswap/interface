import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { IncreasePositionResponse } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { USDT } from 'uniswap/src/constants/tokens'
import { LPTransactionSettingsStoreContextProvider } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/LPTransactionSettingsStoreContextProvider'
import { useIncreaseLiquidityContext } from '~/pages/IncreaseLiquidity/IncreaseLiquidityContext'
import {
  IncreaseLiquidityTxContextProvider,
  useIncreaseLiquidityTxContext,
} from '~/pages/IncreaseLiquidity/IncreaseLiquidityTxContext'
import { ETH_MAINNET } from '~/test-utils/constants'
import { render } from '~/test-utils/render'
import { PositionField } from '~/types/position'

const quote = vi.hoisted(() => ({ dependentAmount: '0' }))

// Network and form-state boundaries only; the provider's own quote handling is what's under test.
vi.mock('~/pages/IncreaseLiquidity/IncreaseLiquidityContext', () => ({ useIncreaseLiquidityContext: vi.fn() }))
vi.mock('~/hooks/useModalInitialState', () => ({
  useModalInitialState: () => ({
    version: ProtocolVersion.V3,
    chainId: 1,
    tokenId: '1',
    currency0Amount: { currency: { chainId: 1, isNative: false, address: USDT.address } },
    currency1Amount: { currency: { chainId: 1, isNative: true } },
    liquidityToken: undefined,
  }),
}))
vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({ useCurrencyInfo: () => undefined }))
vi.mock('uniswap/src/data/apiClients/liquidityService/useCheckLPApprovalQuery', () => ({
  useCheckLPApprovalQuery: () => ({
    approvalData: undefined,
    approvalError: undefined,
    approvalLoading: false,
    approvalRefetch: vi.fn(),
  }),
}))
// Served as already-cached data so the provider renders straight from the quote with no fetch in flight.
vi.mock('uniswap/src/data/apiClients/liquidityService/liquidityQueries', () => ({
  liquidityQueries: {
    increasePosition: () => ({
      queryKey: ['increase-position-quote-guard', quote.dependentAmount],
      initialData: new IncreasePositionResponse({
        increase: { from: ZERO_ADDRESS, chainId: 1, to: ZERO_ADDRESS, value: '0', data: '0x' },
        token1: { tokenAddress: ZERO_ADDRESS, amount: quote.dependentAmount },
      }),
      queryFn: () => Promise.reject(new Error('the quote is served from initialData')),
      enabled: false,
    }),
  },
}))
vi.mock('~/features/Liquidity/hooks/useDependentAmountFallback', () => ({
  useIncreasePositionDependentAmountFallback: () => undefined,
}))
vi.mock('uniswap/src/features/accounts/store/hooks', async (importOriginal) => ({
  ...(await importOriginal()),
  useActiveAddress: () => '0x0000000000000000000000000000000000000001',
}))
vi.mock('uniswap/src/features/gas/hooks', async (importOriginal) => ({
  ...(await importOriginal()),
  useTransactionGasFee: () => ({ displayValue: undefined }),
  useUSDCurrencyAmountOfGasFee: () => undefined,
}))

const mockedUseIncreaseLiquidityContext = vi.mocked(useIncreaseLiquidityContext)

function renderIncreaseTxContext(): { current: ReturnType<typeof useIncreaseLiquidityTxContext> | undefined } {
  const result: { current: ReturnType<typeof useIncreaseLiquidityTxContext> | undefined } = { current: undefined }
  function Probe(): null {
    result.current = useIncreaseLiquidityTxContext()
    return null
  }
  render(
    <LPTransactionSettingsStoreContextProvider>
      <IncreaseLiquidityTxContextProvider>
        <Probe />
      </IncreaseLiquidityTxContextProvider>
    </LPTransactionSettingsStoreContextProvider>,
  )
  return result
}

describe('IncreaseLiquidityTxContext quoted dependent amount guard', () => {
  beforeEach(() => {
    mockedUseIncreaseLiquidityContext.mockReturnValue({
      derivedIncreaseLiquidityInfo: {
        currencyAmounts: {
          [PositionField.TOKEN0]: CurrencyAmount.fromRawAmount(USDT, '1000000'),
          [PositionField.TOKEN1]: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000'),
        },
        currencyMaxAmounts: {},
        error: undefined,
      },
      increaseLiquidityState: { exactField: PositionField.TOKEN0 },
      currentTransactionStep: undefined,
      preEstimatedGasFee: '1',
    } as unknown as ReturnType<typeof useIncreaseLiquidityContext>)
  })

  it('builds the transaction from a real quote', () => {
    quote.dependentAmount = '1000000000000000'
    const result = renderIncreaseTxContext()

    expect(result.current?.dependentAmount).toBe('1000000000000000')
    expect(result.current?.txInfo?.txRequest).toBeDefined()
  })

  it('drops a quote past uint128 and builds no transaction from its calldata', () => {
    quote.dependentAmount = ((1n << 256n) - 2n).toString()
    const result = renderIncreaseTxContext()

    expect(result.current?.dependentAmount).toBeUndefined()
    expect(result.current?.txInfo).toBeUndefined()
  })
})
