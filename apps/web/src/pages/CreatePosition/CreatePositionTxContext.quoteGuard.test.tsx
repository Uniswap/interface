import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { CreatePositionResponse } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { USDT } from 'uniswap/src/constants/tokens'
import { useCreatePositionQuery } from 'uniswap/src/data/apiClients/liquidityService/useCreatePositionQuery'
import { LPTransactionSettingsStoreContextProvider } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/LPTransactionSettingsStoreContextProvider'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import {
  CreatePositionTxContextProvider,
  useCreatePositionTxContext,
} from '~/pages/CreatePosition/CreatePositionTxContext'
import { ETH_MAINNET } from '~/test-utils/constants'
import { render } from '~/test-utils/render'
import { PositionField } from '~/types/position'

// Network and form-state boundaries only; the provider's own quote handling is what's under test.
vi.mock('~/pages/CreatePosition/CreateLiquidityContextProvider', () => ({ useCreateLiquidityContext: vi.fn() }))
vi.mock('uniswap/src/data/apiClients/liquidityService/useCreatePositionQuery', () => ({
  useCreatePositionQuery: vi.fn(),
}))
vi.mock('uniswap/src/data/apiClients/liquidityService/useCheckLPApprovalQuery', () => ({
  useCheckLPApprovalQuery: () => ({
    approvalData: undefined,
    approvalError: undefined,
    approvalLoading: false,
    approvalRefetch: vi.fn(),
  }),
}))
vi.mock('~/features/Liquidity/hooks/useDependentAmountFallback', () => ({
  useCreatePositionDependentAmountFallback: () => undefined,
}))
vi.mock('~/pages/CreatePosition/hooks/useCreatePositionDepositInfo', () => ({
  useCreatePositionDepositInfo: () => ({
    currencyMaxAmounts: {},
    currencyAmounts: {
      [PositionField.TOKEN0]: CurrencyAmount.fromRawAmount(USDT, '1000000'),
      [PositionField.TOKEN1]: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000'),
    },
    inputError: undefined,
    formattedAmounts: {},
    currencyAmountsUSDValue: {},
    currencyBalances: {},
    preEstimatedGasFee: '1',
    invalidRange: false,
  }),
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

const mockedUseCreateLiquidityContext = vi.mocked(useCreateLiquidityContext)
const mockedUseCreatePositionQuery = vi.mocked(useCreatePositionQuery)

function mockQuotedDependentAmount(amount: string): void {
  mockedUseCreatePositionQuery.mockReturnValue({
    createCalldata: new CreatePositionResponse({
      create: { from: ZERO_ADDRESS, chainId: 1, to: ZERO_ADDRESS, value: '0', data: '0x' },
      token1: { tokenAddress: ZERO_ADDRESS, amount },
    }),
    createError: undefined,
    createRefetch: vi.fn(),
  } as unknown as ReturnType<typeof useCreatePositionQuery>)
}

function renderCreateTxContext(): { current: ReturnType<typeof useCreatePositionTxContext> | undefined } {
  const result: { current: ReturnType<typeof useCreatePositionTxContext> | undefined } = { current: undefined }
  function Probe(): null {
    result.current = useCreatePositionTxContext()
    return null
  }
  render(
    <LPTransactionSettingsStoreContextProvider>
      <CreatePositionTxContextProvider>
        <Probe />
      </CreatePositionTxContextProvider>
    </LPTransactionSettingsStoreContextProvider>,
  )
  return result
}

describe('CreatePositionTxContext quoted dependent amount guard', () => {
  beforeEach(() => {
    mockedUseCreateLiquidityContext.mockReturnValue({
      protocolVersion: ProtocolVersion.V3,
      currencies: { display: { TOKEN0: USDT, TOKEN1: ETH_MAINNET }, sdk: { TOKEN0: USDT, TOKEN1: ETH_MAINNET } },
      ticks: [-60, 60],
      poolOrPair: undefined,
      depositState: { exactField: PositionField.TOKEN0, exactAmounts: { [PositionField.TOKEN0]: '1' } },
      creatingPoolOrPair: false,
      poolId: undefined,
      currentTransactionStep: undefined,
      positionState: { fee: undefined, hook: undefined },
      setRefetch: vi.fn(),
    } as unknown as ReturnType<typeof useCreateLiquidityContext>)
  })

  it('builds the transaction from a real quote', () => {
    mockQuotedDependentAmount('1000000000000000')
    const result = renderCreateTxContext()

    expect(result.current?.dependentAmount).toBe('1000000000000000')
    expect(result.current?.txInfo?.txRequest).toBeDefined()
  })

  it('drops a quote past uint128 and builds no transaction from its calldata', () => {
    mockQuotedDependentAmount(((1n << 256n) - 2n).toString())
    const result = renderCreateTxContext()

    expect(result.current?.dependentAmount).toBeUndefined()
    expect(result.current?.txInfo).toBeUndefined()
  })
})
