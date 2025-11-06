import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { FeeAmount, nearestUsableTick, TICK_SPACINGS, TickMath, Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import { useDynamicConfigValue } from '@universe/gating'
import { useDepositInfo } from 'components/Liquidity/Create/hooks/useDepositInfo'
import { useNativeTokenPercentageBufferExperiment } from 'components/Liquidity/Create/hooks/useNativeTokenPercentageBufferExperiment'
import JSBI from 'jsbi'
import { ETH_MAINNET } from 'test-utils/constants'
import { renderHook } from 'test-utils/render'
import { PositionField } from 'types/position'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { USDC, USDT } from 'uniswap/src/constants/tokens'
import { useMaxAmountSpend } from 'uniswap/src/features/gas/hooks/useMaxAmountSpend'
import { useOnChainCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'

vi.mock('components/Liquidity/Create/hooks/useNativeTokenPercentageBufferExperiment', async (importOriginal) => ({
  ...(await importOriginal()),
  useNativeTokenPercentageBufferExperiment: vi.fn(),
}))

vi.mock('uniswap/src/features/portfolio/api', async (importOriginal) => ({
  ...(await importOriginal()),
  useOnChainCurrencyBalance: vi.fn(),
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal()),
  useDynamicConfigValue: vi.fn(),
}))

vi.mock('uniswap/src/features/gas/hooks/useMaxAmountSpend', async (importOriginal) => ({
  ...(await importOriginal()),
  useMaxAmountSpend: vi.fn(),
}))

vi.mock('uniswap/src/features/transactions/hooks/useUSDCPrice', async (importOriginal) => ({
  ...(await importOriginal()),
  useUSDCValue: vi.fn(),
}))

const useDynamicConfigValueMock = vi.mocked(useDynamicConfigValue)

const useNativeTokenPercentageBufferExperimentMock = vi.mocked(useNativeTokenPercentageBufferExperiment)
const useOnChainCurrencyBalanceMock = vi.mocked(useOnChainCurrencyBalance)
const useMaxAmountSpendMock = vi.mocked(useMaxAmountSpend)
const useUSDCValueMock = vi.mocked(useUSDCValue)

describe('useDepositInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    useOnChainCurrencyBalanceMock.mockImplementation((currency) => {
      if (currency?.equals(USDC) || currency?.equals(USDT)) {
        return {
          balance: CurrencyAmount.fromRawAmount(currency, JSBI.BigInt(1000 * 10 ** currency.decimals)),
          isLoading: false,
          error: null,
        }
      } else if (currency?.equals(ETH_MAINNET) || currency?.equals(ETH_MAINNET.wrapped)) {
        return {
          balance: CurrencyAmount.fromRawAmount(currency, JSBI.BigInt(5 * 10 ** currency.decimals)),
          isLoading: false,
          error: null,
        }
      }
      return {
        balance: undefined,
        isLoading: false,
        error: null,
      }
    })

    useMaxAmountSpendMock.mockImplementation(({ currencyAmount }) => {
      if (currencyAmount) {
        return CurrencyAmount.fromRawAmount(
          currencyAmount.currency,
          JSBI.multiply(currencyAmount.quotient, JSBI.BigInt(95)), // 95% of balance
        )
      }
      return undefined
    })

    useDynamicConfigValueMock.mockReturnValue(1)
    useUSDCValueMock.mockImplementation((amount) => {
      if (!amount) {
        return null
      }

      if (amount.currency.equals(USDC) || amount.currency.equals(USDT)) {
        // 1 USD per USDC/USDT
        return CurrencyAmount.fromRawAmount(amount.currency, amount.quotient)
      } else if (amount.currency.equals(ETH_MAINNET) || amount.currency.equals(ETH_MAINNET.wrapped)) {
        // 3000 USD per ETH_MAINNET
        return CurrencyAmount.fromRawAmount(amount.currency, JSBI.multiply(amount.quotient, JSBI.BigInt(3000)))
      }
      return null
    })

    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  describe('V2', () => {
    const pair = new Pair(
      CurrencyAmount.fromRawAmount(USDC.wrapped, '1000000000000000000'),
      CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '10000000000000000000000000000'),
    )

    it('should return correct deposit info - token0', () => {
      useNativeTokenPercentageBufferExperimentMock.mockReturnValue(1)

      const { result } = renderHook(() =>
        useDepositInfo({
          protocolVersion: ProtocolVersion.V2,
          address: '0x123',
          token0: USDC,
          token1: ETH_MAINNET.wrapped,
          exactField: PositionField.TOKEN0,
          exactAmounts: {
            [PositionField.TOKEN0]: '100',
            [PositionField.TOKEN1]: '',
          },
          poolOrPair: pair,
        }),
      )

      expect(result.current.currencyBalances?.[PositionField.TOKEN0]?.toExact()).toBe('1000')
      expect(result.current.currencyBalances?.[PositionField.TOKEN1]?.toExact()).toBe('5')
      expect(result.current.currencyAmounts?.[PositionField.TOKEN0]?.toExact()).toBe('100')
      expect(result.current.currencyAmounts?.[PositionField.TOKEN1]?.toExact()).toBe('1')
      expect(result.current.currencyAmountsUSDValue?.[PositionField.TOKEN0]?.toExact()).toBe('100')
      expect(result.current.currencyAmountsUSDValue?.[PositionField.TOKEN1]?.toExact()).toBe('3000')
      expect(result.current.error).toBeUndefined()
    })

    it('should return correct deposit info - token1', () => {
      useNativeTokenPercentageBufferExperimentMock.mockReturnValue(1)

      const { result } = renderHook(() =>
        useDepositInfo({
          protocolVersion: ProtocolVersion.V2,
          address: '0x123',
          token0: USDC,
          token1: ETH_MAINNET.wrapped,
          exactField: PositionField.TOKEN1,
          exactAmounts: {
            [PositionField.TOKEN0]: '',
            [PositionField.TOKEN1]: '5',
          },
          poolOrPair: pair,
        }),
      )

      expect(result.current.currencyBalances?.[PositionField.TOKEN0]?.toExact()).toBe('1000')
      expect(result.current.currencyBalances?.[PositionField.TOKEN1]?.toExact()).toBe('5')
      expect(result.current.currencyAmounts?.[PositionField.TOKEN0]?.toExact()).toBe('500')
      expect(result.current.currencyAmounts?.[PositionField.TOKEN1]?.toExact()).toBe('5')
      expect(result.current.currencyAmountsUSDValue?.[PositionField.TOKEN0]?.toExact()).toBe('500')
      expect(result.current.currencyAmountsUSDValue?.[PositionField.TOKEN1]?.toExact()).toBe('15000')
      expect(result.current.error).toBeUndefined()
    })
  })

  describe('V3', () => {
    const pool = new V3Pool(
      ETH_MAINNET.wrapped,
      USDT,
      FeeAmount.MEDIUM,
      '4054976535745954444738484',
      '7201247293608325509',
      -197613,
    )

    it('should return correct deposit info - token0', () => {
      useNativeTokenPercentageBufferExperimentMock.mockReturnValue(1)

      const { result } = renderHook(() =>
        useDepositInfo({
          protocolVersion: ProtocolVersion.V3,
          address: '0x123',
          token0: USDT,
          token1: ETH_MAINNET.wrapped,
          exactField: PositionField.TOKEN0,
          exactAmounts: {
            [PositionField.TOKEN0]: '100',
            [PositionField.TOKEN1]: '',
          },
          poolOrPair: pool,
          tickLower: nearestUsableTick(TickMath.MIN_TICK, pool.tickSpacing),
          tickUpper: nearestUsableTick(TickMath.MAX_TICK, pool.tickSpacing),
        }),
      )

      expect(result.current.currencyBalances?.[PositionField.TOKEN0]?.toExact()).toBe('1000')
      expect(result.current.currencyBalances?.[PositionField.TOKEN1]?.toExact()).toBe('5')
      expect(result.current.currencyAmounts?.[PositionField.TOKEN0]?.toExact()).toBe('100')
      expect(result.current.currencyAmounts?.[PositionField.TOKEN1]?.toExact()).toBe('0.038175301569531354')
      expect(result.current.currencyAmountsUSDValue?.[PositionField.TOKEN0]?.toExact()).toBe('100')
      expect(result.current.currencyAmountsUSDValue?.[PositionField.TOKEN1]?.toExact()).toBe('114.525904708594062')
      expect(result.current.error).toBeUndefined()
    })

    it('should return correct deposit info - token1', () => {
      useNativeTokenPercentageBufferExperimentMock.mockReturnValue(1)

      const { result } = renderHook(() =>
        useDepositInfo({
          protocolVersion: ProtocolVersion.V3,
          address: '0x123',
          token0: USDT,
          token1: ETH_MAINNET.wrapped,
          exactField: PositionField.TOKEN1,
          exactAmounts: {
            [PositionField.TOKEN0]: '',
            [PositionField.TOKEN1]: '0.038175301569531354',
          },
          poolOrPair: pool,
          tickLower: nearestUsableTick(TickMath.MIN_TICK, pool.tickSpacing),
          tickUpper: nearestUsableTick(TickMath.MAX_TICK, pool.tickSpacing),
        }),
      )

      expect(result.current.currencyBalances?.[PositionField.TOKEN0]?.toExact()).toBe('1000')
      expect(result.current.currencyBalances?.[PositionField.TOKEN1]?.toExact()).toBe('5')
      expect(result.current.currencyAmounts?.[PositionField.TOKEN0]?.toExact()).toBe('99.999999')
      expect(result.current.currencyAmounts?.[PositionField.TOKEN1]?.toExact()).toBe('0.038175301569531354')
      expect(result.current.currencyAmountsUSDValue?.[PositionField.TOKEN0]?.toExact()).toBe('99.999999')
      expect(result.current.currencyAmountsUSDValue?.[PositionField.TOKEN1]?.toExact()).toBe('114.525904708594062')
      expect(result.current.error).toBeUndefined()
    })
  })

  describe('V4', () => {
    const pool = new V4Pool(
      ETH_MAINNET,
      USDT,
      FeeAmount.MEDIUM,
      TICK_SPACINGS[FeeAmount.MEDIUM],
      ZERO_ADDRESS,
      '4054976535745954444738484',
      '7201247293608325509',
      -197613,
    )

    it('should return correct deposit info - token0', () => {
      useNativeTokenPercentageBufferExperimentMock.mockReturnValue(1)

      const { result } = renderHook(() =>
        useDepositInfo({
          protocolVersion: ProtocolVersion.V4,
          address: '0x123',
          token0: ETH_MAINNET,
          token1: USDT,
          exactField: PositionField.TOKEN0,
          exactAmounts: {
            [PositionField.TOKEN0]: '0.038175301569531354',
            [PositionField.TOKEN1]: '',
          },
          poolOrPair: pool,
          tickLower: nearestUsableTick(TickMath.MIN_TICK, pool.tickSpacing),
          tickUpper: nearestUsableTick(TickMath.MAX_TICK, pool.tickSpacing),
        }),
      )

      expect(result.current.currencyBalances?.[PositionField.TOKEN0]?.toExact()).toBe('5')
      expect(result.current.currencyBalances?.[PositionField.TOKEN1]?.toExact()).toBe('1000')
      expect(result.current.currencyAmounts?.[PositionField.TOKEN0]?.toExact()).toBe('0.038175301569531354')
      expect(result.current.currencyAmounts?.[PositionField.TOKEN1]?.toExact()).toBe('99.999999')
      expect(result.current.currencyAmountsUSDValue?.[PositionField.TOKEN0]?.toExact()).toBe('114.525904708594062')
      expect(result.current.currencyAmountsUSDValue?.[PositionField.TOKEN1]?.toExact()).toBe('99.999999')
      expect(result.current.error).toBeUndefined()
    })

    it('should return correct deposit info - token1', () => {
      useNativeTokenPercentageBufferExperimentMock.mockReturnValue(1)

      const { result } = renderHook(() =>
        useDepositInfo({
          protocolVersion: ProtocolVersion.V4,
          address: '0x123',
          token0: ETH_MAINNET,
          token1: USDT,
          exactField: PositionField.TOKEN1,
          exactAmounts: {
            [PositionField.TOKEN0]: '',
            [PositionField.TOKEN1]: '99.999999',
          },
          poolOrPair: pool,
          tickLower: nearestUsableTick(TickMath.MIN_TICK, pool.tickSpacing),
          tickUpper: nearestUsableTick(TickMath.MAX_TICK, pool.tickSpacing),
        }),
      )

      expect(result.current.currencyBalances?.[PositionField.TOKEN0]?.toExact()).toBe('5')
      expect(result.current.currencyBalances?.[PositionField.TOKEN1]?.toExact()).toBe('1000')
      expect(result.current.currencyAmounts?.[PositionField.TOKEN0]?.toExact()).toBe('0.038175301187768586')
      expect(result.current.currencyAmounts?.[PositionField.TOKEN1]?.toExact()).toBe('99.999999')
      expect(result.current.currencyAmountsUSDValue?.[PositionField.TOKEN0]?.toExact()).toBe('114.525903563305758')
      expect(result.current.currencyAmountsUSDValue?.[PositionField.TOKEN1]?.toExact()).toBe('99.999999')
      expect(result.current.error).toBeUndefined()
    })
  })
})
