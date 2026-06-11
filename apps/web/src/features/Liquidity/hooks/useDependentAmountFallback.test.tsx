import { useQuery } from '@tanstack/react-query'
import { Protocols } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import {
  CreatePositionRequest,
  CreatePositionResponse,
  IncreasePositionRequest,
  IncreasePositionResponse,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { CreateToken, LPToken, PositionTickBounds } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { vi } from 'vitest'
import {
  useCreatePositionDependentAmountFallback,
  useIncreasePositionDependentAmountFallback,
  useUpdatedAmountsFromDependentAmount,
} from '~/features/Liquidity/hooks/useDependentAmountFallback'
import { TEST_TOKEN_1, TEST_TOKEN_2 } from '~/test-utils/constants'
import { renderHook } from '~/test-utils/render'
import { PositionField } from '~/types/position'

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: vi.fn(),
  }
})
const useQueryMock = vi.mocked(useQuery)

vi.mock('uniswap/src/features/transactions/hooks/useUSDCPrice', () => ({
  useUSDCValue: (currencyAmount: CurrencyAmount<Currency> | undefined | null) => {
    if (!currencyAmount) {
      return null
    }
    return CurrencyAmount.fromRawAmount(USDC_MAINNET, JSBI.multiply(currencyAmount.numerator, JSBI.BigInt(100)))
  },
}))

const refetchInterval = 5 * ONE_SECOND_MS

const BASE_CREATE_PARAMS = new CreatePositionRequest({
  walletAddress: '0x123',
  chainId: 1,
  protocol: Protocols.V3,
  independentToken: new CreateToken({ tokenAddress: TEST_TOKEN_1.address, amount: '1000' }),
  slippageTolerance: 0.5,
  deadline: Date.now() + 1000000,
  simulateTransaction: true,
  pool: {
    case: 'existingPool',
    value: { token0Address: TEST_TOKEN_1.address, token1Address: TEST_TOKEN_2.address, poolReference: 'test-pool-id' },
  },
  tickPrice: {
    case: 'tickBounds',
    value: new PositionTickBounds({ tickLower: -887272, tickUpper: 887272 }),
  },
})

const BASE_CREATE_PARAMS_NO_SIMULATE = new CreatePositionRequest({
  walletAddress: '0x123',
  chainId: 1,
  protocol: Protocols.V3,
  independentToken: new CreateToken({ tokenAddress: TEST_TOKEN_1.address, amount: '1000' }),
  slippageTolerance: 0.5,
  deadline: Date.now() + 1000000,
  simulateTransaction: false,
  pool: {
    case: 'existingPool',
    value: { token0Address: TEST_TOKEN_1.address, token1Address: TEST_TOKEN_2.address, poolReference: 'test-pool-id' },
  },
  tickPrice: {
    case: 'tickBounds',
    value: new PositionTickBounds({ tickLower: -887272, tickUpper: 887272 }),
  },
})

const BASE_INCREASE_PARAMS = new IncreasePositionRequest({
  walletAddress: '0x123',
  chainId: 1,
  protocol: Protocols.V3,
  token0Address: TEST_TOKEN_1.address,
  token1Address: TEST_TOKEN_2.address,
  independentToken: new LPToken({ tokenAddress: TEST_TOKEN_1.address, amount: '1000' }),
  slippageTolerance: 0.5,
  deadline: Date.now() + 1000000,
  simulateTransaction: true,
})

const BASE_INCREASE_PARAMS_NO_SIMULATE = new IncreasePositionRequest({
  walletAddress: '0x123',
  chainId: 1,
  protocol: Protocols.V3,
  token0Address: TEST_TOKEN_1.address,
  token1Address: TEST_TOKEN_2.address,
  independentToken: new LPToken({ tokenAddress: TEST_TOKEN_1.address, amount: '1000' }),
  slippageTolerance: 0.5,
  deadline: Date.now() + 1000000,
  simulateTransaction: false,
})

describe('useIncreasePositionDependentAmountFallback', () => {
  beforeEach(() => {
    useQueryMock.mockReturnValue({
      data: undefined,
      error: null,
    } as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns dependent token amount when exactField is TOKEN0', () => {
    const response = new IncreasePositionResponse({
      token0: new LPToken({ tokenAddress: TEST_TOKEN_1.address, amount: '500' }),
      token1: new LPToken({ tokenAddress: TEST_TOKEN_2.address, amount: '750' }),
    })
    useQueryMock.mockReturnValue({
      data: response,
      error: null,
    } as any)

    const { result } = renderHook(() =>
      useIncreasePositionDependentAmountFallback({
        queryParams: BASE_INCREASE_PARAMS,
        isQueryEnabled: true,
        exactField: PositionField.TOKEN0,
      }),
    )

    expect(result.current).toBe('750')
  })

  it('returns dependent token amount when exactField is TOKEN1', () => {
    const response = new IncreasePositionResponse({
      token0: new LPToken({ tokenAddress: TEST_TOKEN_1.address, amount: '500' }),
      token1: new LPToken({ tokenAddress: TEST_TOKEN_2.address, amount: '750' }),
    })
    useQueryMock.mockReturnValue({
      data: response,
      error: null,
    } as any)

    const { result } = renderHook(() =>
      useIncreasePositionDependentAmountFallback({
        queryParams: BASE_INCREASE_PARAMS,
        isQueryEnabled: true,
        exactField: PositionField.TOKEN1,
      }),
    )

    expect(result.current).toBe('500')
  })

  it('only enables query if simulateTransaction is true', () => {
    renderHook(() =>
      useIncreasePositionDependentAmountFallback({
        queryParams: BASE_INCREASE_PARAMS_NO_SIMULATE,
        isQueryEnabled: true,
        exactField: PositionField.TOKEN0,
      }),
    )

    expect(useQueryMock).toHaveBeenCalledTimes(1)
    const callArgs = useQueryMock.mock.calls[0][0]
    expect(callArgs.queryKey[0]).toBe(ReactQueryCacheKey.LiquidityService)
    expect(callArgs.queryKey[1]).toBe('increasePosition')

    const params = callArgs.queryKey[2] as IncreasePositionRequest
    expect(params).toBeDefined()
    expect(params.simulateTransaction).toBe(false)

    expect(callArgs.enabled).toBe(false)
    expect(callArgs.retry).toBe(false)
    expect(callArgs.refetchInterval).toBe(refetchInterval)
  })

  it('returns undefined if no data', () => {
    const { result } = renderHook(() =>
      useIncreasePositionDependentAmountFallback({
        queryParams: BASE_INCREASE_PARAMS,
        isQueryEnabled: true,
        exactField: PositionField.TOKEN0,
      }),
    )

    expect(useQueryMock).toHaveBeenCalledTimes(1)
    const callArgs = useQueryMock.mock.calls[0][0]
    expect(callArgs.queryKey[0]).toBe(ReactQueryCacheKey.LiquidityService)
    expect(callArgs.queryKey[1]).toBe('increasePosition')

    expect(result.current).toBe(undefined)
  })

  it('updates hasErrorResponse when error changes and stops refetching', () => {
    const { result, rerender } = renderHook(() =>
      useIncreasePositionDependentAmountFallback({
        queryParams: BASE_INCREASE_PARAMS,
        isQueryEnabled: true,
        exactField: PositionField.TOKEN0,
      }),
    )

    expect(result.current).toBe(undefined)

    expect(useQueryMock).toHaveBeenCalledTimes(1)
    const firstCallArgs = useQueryMock.mock.calls[0][0]
    expect(firstCallArgs.queryKey[0]).toBe(ReactQueryCacheKey.LiquidityService)
    expect(firstCallArgs.queryKey[1]).toBe('increasePosition')

    const firstParams = firstCallArgs.queryKey[2] as IncreasePositionRequest
    expect(firstParams).toBeDefined()
    expect(firstParams.simulateTransaction).toBe(false)

    expect(firstCallArgs.enabled).toBe(true)
    expect(firstCallArgs.retry).toBe(false)
    expect(firstCallArgs.refetchInterval).toBe(refetchInterval)

    useQueryMock.mockReturnValue({
      data: undefined,
      error: new Error('fail'),
    } as any)

    rerender()

    // 1 call per render × 3 renders (initial + rerender + useEffect state update) = 3
    expect(useQueryMock).toHaveBeenCalledTimes(3)
    const lastCallArgs = useQueryMock.mock.calls[2][0]
    expect(lastCallArgs.queryKey[0]).toBe(ReactQueryCacheKey.LiquidityService)
    expect(lastCallArgs.queryKey[1]).toBe('increasePosition')

    const lastParams = lastCallArgs.queryKey[2] as IncreasePositionRequest
    expect(lastParams).toBeDefined()
    expect(lastParams.simulateTransaction).toBe(false)

    expect(lastCallArgs.enabled).toBe(false)
    expect(lastCallArgs.retry).toBe(false)
    expect(lastCallArgs.refetchInterval).toBe(false)
  })
})

describe('useCreatePositionDependentAmountFallback', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns dependentAmount on success', async () => {
    useQueryMock.mockReturnValue({
      data: new CreatePositionResponse({
        token0: new LPToken({ tokenAddress: TEST_TOKEN_1.address, amount: '500' }),
        token1: new LPToken({ tokenAddress: TEST_TOKEN_2.address, amount: '123' }),
      }),
      error: null,
    } as any)

    const { result } = renderHook(() =>
      useCreatePositionDependentAmountFallback({
        queryParams: BASE_CREATE_PARAMS,
        isQueryEnabled: true,
        exactField: PositionField.TOKEN0,
      }),
    )

    // Two useQuery calls (classic + v2) — the V2 path is active for CreatePositionRequest
    expect(useQueryMock).toHaveBeenCalledTimes(2)
    // The second call is the createPosition query (v2 path)
    const callArgs = useQueryMock.mock.calls[1][0]
    expect(callArgs.queryKey[0]).toBe(ReactQueryCacheKey.LiquidityService)
    expect(callArgs.queryKey[1]).toBe('createPosition')

    const params = callArgs.queryKey[2] as CreatePositionRequest
    expect(params).toBeDefined()
    expect(params.simulateTransaction).toBe(false)
    expect(params.walletAddress).toBe('0x123')
    expect(params.chainId).toBe(1)

    expect(callArgs.enabled).toBe(true)
    expect(callArgs.retry).toBe(false)
    expect(callArgs.refetchInterval).toBe(refetchInterval)

    expect(result.current).toBe('123')
  })

  it('only enables query if simulateTransaction is true', () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      error: null,
    } as any)

    renderHook(() =>
      useCreatePositionDependentAmountFallback({
        queryParams: BASE_CREATE_PARAMS_NO_SIMULATE,
        isQueryEnabled: true,
        exactField: PositionField.TOKEN0,
      }),
    )

    expect(useQueryMock).toHaveBeenCalledTimes(2)
    const callArgs = useQueryMock.mock.calls[1][0]
    expect(callArgs.queryKey[0]).toBe(ReactQueryCacheKey.LiquidityService)
    expect(callArgs.queryKey[1]).toBe('createPosition')

    const params = callArgs.queryKey[2] as CreatePositionRequest
    expect(params).toBeDefined()
    expect(params.simulateTransaction).toBe(false)

    expect(callArgs.enabled).toBe(false)
    expect(callArgs.retry).toBe(false)
    expect(callArgs.refetchInterval).toBe(refetchInterval)
  })

  it('returns undefined if no data', () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      error: null,
    } as any)
    const { result } = renderHook(() =>
      useCreatePositionDependentAmountFallback({
        queryParams: BASE_CREATE_PARAMS,
        isQueryEnabled: true,
        exactField: PositionField.TOKEN0,
      }),
    )

    expect(useQueryMock).toHaveBeenCalledTimes(2)
    const callArgs = useQueryMock.mock.calls[1][0]
    expect(callArgs.queryKey[0]).toBe(ReactQueryCacheKey.LiquidityService)
    expect(callArgs.queryKey[1]).toBe('createPosition')

    expect(result.current).toBe(undefined)
  })

  it('updates hasErrorResponse when error changes and stops refetching', () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      error: null,
    } as any)

    const { result, rerender } = renderHook(() =>
      useCreatePositionDependentAmountFallback({
        queryParams: BASE_CREATE_PARAMS,
        isQueryEnabled: true,
        exactField: PositionField.TOKEN0,
      }),
    )

    expect(result.current).toBe(undefined)

    // Two useQuery calls per render (classic + v2)
    expect(useQueryMock).toHaveBeenCalledTimes(2)
    const firstCallArgs = useQueryMock.mock.calls[1][0]
    expect(firstCallArgs.queryKey[0]).toBe(ReactQueryCacheKey.LiquidityService)
    expect(firstCallArgs.queryKey[1]).toBe('createPosition')

    const firstParams = firstCallArgs.queryKey[2] as CreatePositionRequest
    expect(firstParams).toBeDefined()
    expect(firstParams.simulateTransaction).toBe(false)

    expect(firstCallArgs.enabled).toBe(true)
    expect(firstCallArgs.retry).toBe(false)
    expect(firstCallArgs.refetchInterval).toBe(refetchInterval)

    useQueryMock.mockReturnValue({
      data: undefined,
      error: new Error('fallback fail'),
    } as any)

    rerender()

    // 2 calls per render × 3 renders (initial + rerender + useEffect state update) = 6
    expect(useQueryMock).toHaveBeenCalledTimes(6)
    // Last v2 call is at index 5 (3rd render, second useQuery call)
    const lastCallArgs = useQueryMock.mock.calls[5][0]
    expect(lastCallArgs.queryKey[0]).toBe(ReactQueryCacheKey.LiquidityService)
    expect(lastCallArgs.queryKey[1]).toBe('createPosition')

    const lastParams = lastCallArgs.queryKey[2] as CreatePositionRequest
    expect(lastParams).toBeDefined()
    expect(lastParams.simulateTransaction).toBe(false)

    expect(lastCallArgs.enabled).toBe(true)
    expect(lastCallArgs.retry).toBe(false)
    expect(lastCallArgs.refetchInterval).toBe(false)
  })
})

describe('useUpdatedAmountsFromDependentAmount', () => {
  const token0CurrencyAmount = CurrencyAmount.fromRawAmount(TEST_TOKEN_1, JSBI.BigInt(500000000))
  const token1CurrencyAmount = CurrencyAmount.fromRawAmount(TEST_TOKEN_2, JSBI.BigInt(750000000))
  const token0USDValue = CurrencyAmount.fromRawAmount(USDC_MAINNET, JSBI.BigInt(100))
  const token1USDValue = CurrencyAmount.fromRawAmount(USDC_MAINNET, JSBI.BigInt(200))
  const token0FormattedAmount = '0.5'
  const token1FormattedAmount = '0.75'
  const updatedDependentAmount = '300000000000000000'
  const updatedDependentAmountUSDValue = CurrencyAmount.fromRawAmount(
    USDC_MAINNET,
    JSBI.multiply(JSBI.BigInt(updatedDependentAmount), JSBI.BigInt(100)),
  )

  const baseProps = {
    token0: TEST_TOKEN_1,
    token1: TEST_TOKEN_2,
    currencyAmounts: {
      [PositionField.TOKEN0]: token0CurrencyAmount,
      [PositionField.TOKEN1]: token1CurrencyAmount,
    },
    currencyAmountsUSDValue: {
      [PositionField.TOKEN0]: token0USDValue,
      [PositionField.TOKEN1]: token1USDValue,
    },
    formattedAmounts: {
      [PositionField.TOKEN0]: token0FormattedAmount,
      [PositionField.TOKEN1]: token1FormattedAmount,
    },
    deposit0Disabled: false,
    deposit1Disabled: false,
  }

  it('returns updated values for dependentAmount0 (exactField TOKEN1)', () => {
    const { result } = renderHook(() =>
      useUpdatedAmountsFromDependentAmount({
        ...baseProps,
        dependentAmount: updatedDependentAmount,
        exactField: PositionField.TOKEN1,
      }),
    )
    expect(result.current).toEqual({
      updatedFormattedAmounts: {
        [PositionField.TOKEN0]: '0.3',
        [PositionField.TOKEN1]: token1FormattedAmount,
      },
      updatedUSDAmounts: {
        [PositionField.TOKEN0]: updatedDependentAmountUSDValue,
        [PositionField.TOKEN1]: token1USDValue,
      },
      updatedCurrencyAmounts: {
        [PositionField.TOKEN0]: CurrencyAmount.fromRawAmount(TEST_TOKEN_1, JSBI.BigInt(updatedDependentAmount)),
        [PositionField.TOKEN1]: token1CurrencyAmount,
      },
      updatedDeposit0Disabled: false,
      updatedDeposit1Disabled: false,
    })
  })

  it('returns updated values for dependentAmount1 (exactField TOKEN0)', () => {
    const { result } = renderHook(() =>
      useUpdatedAmountsFromDependentAmount({
        ...baseProps,
        dependentAmount: updatedDependentAmount,
        exactField: PositionField.TOKEN0,
      }),
    )
    expect(result.current).toEqual({
      updatedFormattedAmounts: {
        [PositionField.TOKEN0]: token0FormattedAmount,
        [PositionField.TOKEN1]: '0.3',
      },
      updatedUSDAmounts: {
        [PositionField.TOKEN0]: token0USDValue,
        [PositionField.TOKEN1]: updatedDependentAmountUSDValue,
      },
      updatedCurrencyAmounts: {
        [PositionField.TOKEN0]: token0CurrencyAmount,
        [PositionField.TOKEN1]: CurrencyAmount.fromRawAmount(TEST_TOKEN_2, JSBI.BigInt(updatedDependentAmount)),
      },
      updatedDeposit0Disabled: false,
      updatedDeposit1Disabled: false,
    })
  })

  it('returns original values if neither dependentAmount0 nor dependentAmount1 is set', () => {
    const { result } = renderHook(() =>
      useUpdatedAmountsFromDependentAmount({
        ...baseProps,
        dependentAmount: undefined,
        exactField: PositionField.TOKEN0,
      }),
    )
    expect(result.current).toEqual({
      updatedFormattedAmounts: {
        [PositionField.TOKEN0]: token0FormattedAmount,
        [PositionField.TOKEN1]: token1FormattedAmount,
      },
      updatedUSDAmounts: {
        [PositionField.TOKEN0]: token0USDValue,
        [PositionField.TOKEN1]: token1USDValue,
      },
      updatedCurrencyAmounts: {
        [PositionField.TOKEN0]: token0CurrencyAmount,
        [PositionField.TOKEN1]: token1CurrencyAmount,
      },
      updatedDeposit0Disabled: false,
      updatedDeposit1Disabled: false,
    })
  })

  it('disables deposit0 if dependentAmount0 is not greater than 0', () => {
    const { result } = renderHook(() =>
      useUpdatedAmountsFromDependentAmount({
        ...baseProps,
        dependentAmount: '0',
        exactField: PositionField.TOKEN1,
      }),
    )
    expect(result.current.updatedDeposit0Disabled).toBe(true)
    expect(result.current.updatedDeposit1Disabled).toBe(false)
  })

  it('disables deposit1 if dependentAmount1 is not greater than 0', () => {
    const { result } = renderHook(() =>
      useUpdatedAmountsFromDependentAmount({
        ...baseProps,
        dependentAmount: '0',
        exactField: PositionField.TOKEN0,
      }),
    )
    expect(result.current.updatedDeposit0Disabled).toBe(false)
    expect(result.current.updatedDeposit1Disabled).toBe(true)
  })

  it('enables deposit1 if dependentAmount1 is greater than 0', () => {
    const { result } = renderHook(() =>
      useUpdatedAmountsFromDependentAmount({
        ...baseProps,
        deposit0Disabled: true,
        deposit1Disabled: true,
        dependentAmount: '1',
        exactField: PositionField.TOKEN0,
      }),
    )
    expect(result.current.updatedDeposit0Disabled).toBe(true)
    expect(result.current.updatedDeposit1Disabled).toBe(false)
  })

  it('respects deposit0Disabled and deposit1Disabled props in fallback', () => {
    const { result } = renderHook(() =>
      useUpdatedAmountsFromDependentAmount({
        ...baseProps,
        deposit0Disabled: true,
        deposit1Disabled: true,
        dependentAmount: undefined,
        exactField: PositionField.TOKEN0,
      }),
    )
    expect(result.current.updatedDeposit0Disabled).toBe(true)
    expect(result.current.updatedDeposit1Disabled).toBe(true)
  })
})
