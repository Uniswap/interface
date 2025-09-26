import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import {
  useCreatePositionDependentAmountFallback,
  useIncreasePositionDependentAmountFallback,
  useUpdatedAmountsFromDependentAmount,
} from 'components/Liquidity/hooks/useDependentAmountFallback'
import JSBI from 'jsbi'
import { TEST_TOKEN_1, TEST_TOKEN_2 } from 'test-utils/constants'
import { renderHook } from 'test-utils/render'
import { PositionField } from 'types/position'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { useCreateLpPositionCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useCreateLpPositionCalldataQuery'
import { useIncreaseLpPositionCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useIncreaseLpPositionCalldataQuery'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { vi } from 'vitest'

vi.mock('uniswap/src/data/apiClients/tradingApi/useIncreaseLpPositionCalldataQuery', () => ({
  useIncreaseLpPositionCalldataQuery: vi.fn(),
}))
const useIncreaseLpPositionCalldataQueryMock = vi.mocked(useIncreaseLpPositionCalldataQuery)

vi.mock('uniswap/src/data/apiClients/tradingApi/useCreateLpPositionCalldataQuery', () => ({
  useCreateLpPositionCalldataQuery: vi.fn(),
}))
const useCreateLpPositionCalldataQueryMock = vi.mocked(useCreateLpPositionCalldataQuery)

vi.mock('uniswap/src/features/transactions/hooks/useUSDCPrice', () => ({
  useUSDCValue: (currencyAmount: CurrencyAmount<Currency> | undefined | null) => {
    if (!currencyAmount) {
      return null
    }
    return CurrencyAmount.fromRawAmount(USDC_MAINNET, JSBI.multiply(currencyAmount.numerator, JSBI.BigInt(100)))
  },
}))

const refetchInterval = 5 * ONE_SECOND_MS
const BASE_PARAMS: TradingApi.CreateLPPositionRequest | TradingApi.IncreaseLPPositionRequest = {
  simulateTransaction: true,
  protocol: TradingApi.ProtocolItems.V3,
  walletAddress: '0x123',
  chainId: TradingApi.ChainId._1,
  independentAmount: '1000',
  independentToken: TradingApi.IndependentToken.TOKEN_0,
  position: {
    pool: {
      token0: TEST_TOKEN_1.address,
      token1: TEST_TOKEN_2.address,
    },
  },
  slippageTolerance: 50,
}

const BASE_PARAMS_NO_SIMULATE = {
  ...BASE_PARAMS,
  simulateTransaction: false,
}

describe('useIncreasePositionDependentAmountFallback', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns dependentAmount on success', async () => {
    useIncreaseLpPositionCalldataQueryMock.mockReturnValue({
      data: { dependentAmount: '123' },
      error: null,
    } as any)

    const { result } = renderHook(() => useIncreasePositionDependentAmountFallback(BASE_PARAMS, true))
    expect(useIncreaseLpPositionCalldataQueryMock).toHaveBeenCalledWith({
      params: BASE_PARAMS_NO_SIMULATE,
      refetchInterval,
      retry: false,
      enabled: true,
    })
    expect(result.current).toBe('123')
  })

  it('only enables query if simulateTransaction is true', () => {
    renderHook(() => useIncreasePositionDependentAmountFallback(BASE_PARAMS_NO_SIMULATE, true))
    expect(useIncreaseLpPositionCalldataQueryMock).toHaveBeenCalledWith({
      params: BASE_PARAMS_NO_SIMULATE,
      refetchInterval,
      retry: false,
      enabled: false,
    })
  })

  it('returns undefined if no data', () => {
    useIncreaseLpPositionCalldataQueryMock.mockReturnValue({
      data: undefined,
      error: null,
    } as any)
    const { result } = renderHook(() => useIncreasePositionDependentAmountFallback(BASE_PARAMS, true))
    expect(result.current).toBe(undefined)
  })

  it('updates hasErrorResponse when error changes and stops refetching', () => {
    useIncreaseLpPositionCalldataQueryMock.mockReturnValue({
      data: undefined,
      error: null,
    } as any)

    const { result, rerender } = renderHook(() => useIncreasePositionDependentAmountFallback(BASE_PARAMS, true))

    expect(result.current).toBe(undefined)
    expect(useIncreaseLpPositionCalldataQueryMock).toHaveBeenCalledWith({
      params: BASE_PARAMS_NO_SIMULATE,
      refetchInterval,
      retry: false,
      enabled: true,
    })

    useIncreaseLpPositionCalldataQueryMock.mockReturnValue({
      data: undefined,
      error: new Error('fail'),
    } as any)

    rerender()
    expect(useIncreaseLpPositionCalldataQueryMock).toHaveBeenCalledWith({
      params: BASE_PARAMS_NO_SIMULATE,
      refetchInterval: false, // ensure it stops refetching
      retry: false,
      enabled: true,
    })
  })
})

describe('useCreatePositionDependentAmountFallback', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns dependentAmount on success', async () => {
    useCreateLpPositionCalldataQueryMock.mockReturnValue({
      data: { dependentAmount: '123' },
      error: null,
    } as any)

    const { result } = renderHook(() => useCreatePositionDependentAmountFallback(BASE_PARAMS, true))
    expect(useCreateLpPositionCalldataQueryMock).toHaveBeenCalledWith({
      params: BASE_PARAMS_NO_SIMULATE,
      refetchInterval,
      retry: false,
      enabled: true,
    })
    expect(result.current).toBe('123')
  })

  it('only enables query if simulateTransaction is true', () => {
    renderHook(() => useCreatePositionDependentAmountFallback(BASE_PARAMS_NO_SIMULATE, true))
    expect(useCreateLpPositionCalldataQueryMock).toHaveBeenCalledWith({
      params: BASE_PARAMS_NO_SIMULATE,
      refetchInterval,
      retry: false,
      enabled: false,
    })
  })

  it('returns undefined if no data', () => {
    useCreateLpPositionCalldataQueryMock.mockReturnValue({
      data: undefined,
      error: null,
    } as any)
    const { result } = renderHook(() => useCreatePositionDependentAmountFallback(BASE_PARAMS, true))
    expect(result.current).toBe(undefined)
  })

  it('updates hasErrorResponse when error changes and stops refetching', () => {
    useCreateLpPositionCalldataQueryMock.mockReturnValue({
      data: undefined,
      error: null,
    } as any)

    const { result, rerender } = renderHook(() => useCreatePositionDependentAmountFallback(BASE_PARAMS, true))

    expect(result.current).toBe(undefined)
    expect(useCreateLpPositionCalldataQueryMock).toHaveBeenCalledWith({
      params: BASE_PARAMS_NO_SIMULATE,
      refetchInterval,
      retry: false,
      enabled: true,
    })

    useCreateLpPositionCalldataQueryMock.mockReturnValue({
      data: undefined,
      error: new Error('fail'),
    } as any)

    rerender()
    expect(useCreateLpPositionCalldataQueryMock).toHaveBeenCalledWith({
      params: BASE_PARAMS_NO_SIMULATE,
      refetchInterval: false, // ensure it stops refetching
      retry: false,
      enabled: true,
    })
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
