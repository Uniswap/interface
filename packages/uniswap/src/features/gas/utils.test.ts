import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import type { GasFeeResult, GasStrategy } from '@universe/api'
import { DynamicConfigs, type GasStrategies, getStatsigClient } from '@universe/gating'
import { DAI } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DEFAULT_GAS_STRATEGY } from 'uniswap/src/features/gas/consts'
import {
  applyNativeTokenPercentageBuffer,
  getActiveGasStrategy,
  hasGasEstimationFailed,
  hasGasOverrides,
  hasSufficientFundsIncludingGas,
  hasSufficientGasBalance,
} from 'uniswap/src/features/gas/utils'
import { MAINNET_CURRENCY } from 'uniswap/src/test/fixtures'

vi.mock('@universe/gating', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/gating')>()
  return {
    ...actual,
    getStatsigClient: vi.fn(() => ({
      loadingStatus: 'Ready',
      getDynamicConfig: vi.fn(() => ({ value: {} })),
    })),
  }
})

const ZERO_ETH = CurrencyAmount.fromRawAmount(MAINNET_CURRENCY, 0)
const ONE_ETH = CurrencyAmount.fromRawAmount(MAINNET_CURRENCY, 1e18)
const TEN_ETH = ONE_ETH.multiply(10)

describe(applyNativeTokenPercentageBuffer, () => {
  it('returns undefined if no currency amount is provided', () => {
    expect(applyNativeTokenPercentageBuffer(undefined, 10)).toBeUndefined()
  })

  it('takes a percentage and returns the remaining amount', () => {
    expect(applyNativeTokenPercentageBuffer(ONE_ETH, 10)?.quotient.toString()).toEqual('900000000000000000')
  })

  it('handles decimal based percentage buffers', () => {
    expect(applyNativeTokenPercentageBuffer(ONE_ETH, 1.5)?.quotient.toString()).toEqual('985000000000000000')
  })

  it('returns the original amount if no percentage is provided', () => {
    expect(applyNativeTokenPercentageBuffer(ONE_ETH, 0)?.quotient.toString()).toEqual('1000000000000000000')
  })

  it('returns the original amount if the currency is not native', () => {
    expect(
      applyNativeTokenPercentageBuffer(CurrencyAmount.fromRawAmount(DAI, '100000000'), 10)?.quotient.toString(),
    ).toEqual('100000000')
  })
})

describe(hasSufficientFundsIncludingGas, () => {
  it('correctly returns when there is enough for gas with no tx value', () => {
    const mockParams = {
      transactionAmount: undefined,
      gasFee: '1000',
      nativeCurrencyBalance: ONE_ETH,
    }

    expect(hasSufficientFundsIncludingGas(mockParams)).toBe(true)
  })

  it('correctly returns when there is enough for gas even with tx value', () => {
    const mockParams = {
      transactionAmount: ONE_ETH,
      gasFee: '1000',
      nativeCurrencyBalance: TEN_ETH,
    }

    expect(hasSufficientFundsIncludingGas(mockParams)).toBe(true)
  })

  it('correctly returns when there is not enough gas with no tx value', () => {
    const mockParams = {
      transactionAmount: undefined,
      gasFee: '1000',
      nativeCurrencyBalance: ZERO_ETH,
    }

    expect(hasSufficientFundsIncludingGas(mockParams)).toBe(false)
  })

  it('correctly returns when there is not enough gas with a tx value', () => {
    const mockParams = {
      transactionAmount: ONE_ETH,
      gasFee: '1000',
      nativeCurrencyBalance: ZERO_ETH,
    }

    expect(hasSufficientFundsIncludingGas(mockParams)).toBe(false)
  })
})

const PATH_USD = new Token(UniverseChainId.Tempo, '0x20c0000000000000000000000000000000000000', 6, 'pathUSD', 'pathUSD')

function pathUsdBalance(raw: string): CurrencyAmount<Token> {
  return CurrencyAmount.fromRawAmount(PATH_USD, raw)
}

describe(hasSufficientGasBalance, () => {
  it('delegates to hasSufficientFundsIncludingGas for non-Tempo chains', () => {
    expect(
      hasSufficientGasBalance({
        chainId: UniverseChainId.Mainnet,
        gasBalance: ONE_ETH,
        gasFee: '1000',
      }),
    ).toBe(true)
  })

  it('returns false for non-Tempo chain with insufficient balance', () => {
    expect(
      hasSufficientGasBalance({
        chainId: UniverseChainId.Mainnet,
        gasBalance: ZERO_ETH,
        gasFee: '1000',
      }),
    ).toBe(false)
  })

  it('delegates to the shifted-gas-token path for Tempo', () => {
    expect(
      hasSufficientGasBalance({
        chainId: UniverseChainId.Tempo,
        gasBalance: pathUsdBalance('1000000'),
        gasFee: '1000000000000000000',
      }),
    ).toBe(true)
  })

  it('returns false for Tempo with insufficient pathUSD', () => {
    expect(
      hasSufficientGasBalance({
        chainId: UniverseChainId.Tempo,
        gasBalance: pathUsdBalance('0'),
        gasFee: '1000000000000000000',
      }),
    ).toBe(false)
  })
})

describe(getActiveGasStrategy, () => {
  const mockGetStatsigClient = vi.mocked(getStatsigClient)

  function mockStatsig({
    loadingStatus = 'Ready' as string,
    strategies = [] as GasStrategies['strategies'],
  } = {}): void {
    mockGetStatsigClient.mockReturnValue({
      loadingStatus,
      getDynamicConfig: vi.fn((config: string) => {
        if (config === DynamicConfigs.GasStrategies) {
          return { value: { strategies } }
        }
        return { value: {} }
      }),
    } as unknown as ReturnType<typeof getStatsigClient>)
  }

  beforeEach(() => {
    mockStatsig()
  })

  it('returns DEFAULT_GAS_STRATEGY when Statsig has no config and no chain override', () => {
    const result = getActiveGasStrategy({ chainId: 1, type: 'swap' })
    expect(result).toEqual(DEFAULT_GAS_STRATEGY)
  })

  it('returns DEFAULT_GAS_STRATEGY with overrides for Arbitrum', () => {
    const result = getActiveGasStrategy({ chainId: 42161, type: 'swap' })
    expect(result).toEqual({
      ...DEFAULT_GAS_STRATEGY,
      minPriorityFeeGwei: 0,
      maxPriorityFeeGwei: 0,
    })
  })

  it('merges chain overrides on top of Statsig strategy', () => {
    const statsigStrategy: GasStrategy = {
      limitInflationFactor: 1.2,
      displayLimitInflationFactor: 1,
      priceInflationFactor: 1.3,
      percentileThresholdFor1559Fee: 80,
      thresholdToInflateLastBlockBaseFee: 0.7,
      baseFeeMultiplier: 1.1,
      baseFeeHistoryWindow: 25,
      minPriorityFeeRatioOfBaseFee: 0.25,
      minPriorityFeeGwei: 3,
      maxPriorityFeeGwei: 12,
    }

    mockStatsig({
      strategies: [
        {
          strategy: statsigStrategy,
          conditions: { name: 'test', chainId: 42161, types: 'swap', isActive: true },
        },
      ],
    })

    const result = getActiveGasStrategy({ chainId: 42161, type: 'swap' })
    expect(result).toEqual({
      ...statsigStrategy,
      minPriorityFeeGwei: 0,
      maxPriorityFeeGwei: 0,
    })
  })

  it('returns Statsig strategy unchanged when no chain override exists', () => {
    const statsigStrategy: GasStrategy = {
      limitInflationFactor: 1.2,
      displayLimitInflationFactor: 1,
      priceInflationFactor: 1.3,
      percentileThresholdFor1559Fee: 80,
      thresholdToInflateLastBlockBaseFee: 0.7,
      baseFeeMultiplier: 1.1,
      baseFeeHistoryWindow: 25,
      minPriorityFeeRatioOfBaseFee: 0.25,
      minPriorityFeeGwei: 3,
      maxPriorityFeeGwei: 12,
    }

    mockStatsig({
      strategies: [
        {
          strategy: statsigStrategy,
          conditions: { name: 'test', chainId: 1, types: 'swap', isActive: true },
        },
      ],
    })

    const result = getActiveGasStrategy({ chainId: 1, type: 'swap' })
    expect(result).toEqual(statsigStrategy)
  })

  it('returns DEFAULT_GAS_STRATEGY without overrides when chainId is undefined', () => {
    const result = getActiveGasStrategy({ chainId: undefined, type: 'swap' })
    expect(result).toEqual(DEFAULT_GAS_STRATEGY)
  })

  it('returns DEFAULT_GAS_STRATEGY when isStatsigReady is false', () => {
    const result = getActiveGasStrategy({ chainId: 42161, type: 'swap', isStatsigReady: false })
    expect(result).toEqual({
      ...DEFAULT_GAS_STRATEGY,
      minPriorityFeeGwei: 0,
      maxPriorityFeeGwei: 0,
    })
  })
})

describe(hasGasEstimationFailed, () => {
  const idleSkippedResult: GasFeeResult = { isLoading: false, error: null }
  const loadingResult: GasFeeResult = { isLoading: true, error: null }
  const successResult: GasFeeResult = { value: '21000', displayValue: '21000', isLoading: false, error: null }
  const erroredResult: GasFeeResult = { isLoading: false, error: new Error('estimation failed') }

  it('returns false when the request is not a transaction type', () => {
    expect(hasGasEstimationFailed(false, erroredResult)).toBe(false)
  })

  it('returns false when the gas fee result is undefined', () => {
    expect(hasGasEstimationFailed(true, undefined)).toBe(false)
  })

  it('returns false while the query is loading', () => {
    expect(hasGasEstimationFailed(true, loadingResult)).toBe(false)
  })

  // Regression test: prevents the transient error flash while the query is still
  // waiting for async inputs (e.g. chainId) and React Query is reporting the
  // skipped state as `{ isLoading: false, error: null, value: undefined }`.
  it('returns false when the query is skipped or has not started yet', () => {
    expect(hasGasEstimationFailed(true, idleSkippedResult)).toBe(false)
  })

  it('returns false when estimation succeeded', () => {
    expect(hasGasEstimationFailed(true, successResult)).toBe(false)
  })

  it('returns true when the query settled with an error', () => {
    expect(hasGasEstimationFailed(true, erroredResult)).toBe(true)
  })
})

describe(hasGasOverrides, () => {
  it('returns false when no overrides are saved', () => {
    expect(hasGasOverrides(undefined)).toBe(false)
    expect(hasGasOverrides({})).toBe(false)
  })

  it('returns true when any override field is set', () => {
    expect(hasGasOverrides({ maxBaseFeeGwei: '10' })).toBe(true)
    expect(hasGasOverrides({ priorityFeeGwei: '1' })).toBe(true)
    expect(hasGasOverrides({ gasLimit: '21000' })).toBe(true)
  })
})
