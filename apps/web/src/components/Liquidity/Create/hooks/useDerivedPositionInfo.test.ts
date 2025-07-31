import { renderHook } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { FeeAmount, TICK_SPACINGS, TickMath, Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import {
  getSortedCurrenciesForProtocol,
  useDerivedPositionInfo,
} from 'components/Liquidity/Create/hooks/useDerivedPositionInfo'
import {
  CreateV2PositionInfo,
  CreateV3PositionInfo,
  CreateV4PositionInfo,
  PositionState,
} from 'components/Liquidity/Create/types'
import { PoolState } from 'hooks/usePools'
import { PairState } from 'hooks/useV2Pairs'
import JSBI from 'jsbi'
import { ETH_MAINNET } from 'test-utils/constants'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { DAI, USDT, nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockV3Pool = new V3Pool(
  ETH_MAINNET.wrapped,
  USDT,
  FeeAmount.MEDIUM,
  TickMath.getSqrtRatioAtTick(-196257),
  JSBI.BigInt(0),
  -196257,
)

const mockV4Pool = new V4Pool(
  ETH_MAINNET.wrapped,
  USDT,
  FeeAmount.MEDIUM,
  TICK_SPACINGS[FeeAmount.MEDIUM],
  ZERO_ADDRESS,
  TickMath.getSqrtRatioAtTick(-196257),
  JSBI.BigInt(0),
  -196257,
)

const mockUseGetPoolsByTokens = vi.fn()
const mockUseV2Pair = vi.fn()
const mockUsePool = vi.fn()
const mockUseDefaultInitialPrice = vi.fn()
const mockUseMultichainContext = vi.fn()
const mockGetPoolFromRest = vi.fn()

vi.mock('hooks/useV2Pairs', async (importOriginal) => ({
  ...(await importOriginal()),
  useV2Pair: () => mockUseV2Pair(),
}))

vi.mock('hooks/usePools', async (importOriginal) => ({
  ...(await importOriginal()),
  usePool: () => mockUsePool(),
}))

vi.mock('components/Liquidity/Create/hooks/useDefaultInitialPrice', () => ({
  useDefaultInitialPrice: () => mockUseDefaultInitialPrice(),
}))

vi.mock('state/multichain/useMultichainContext', () => ({
  useMultichainContext: () => mockUseMultichainContext(),
}))

vi.mock('uniswap/src/data/rest/getPools', () => ({
  useGetPoolsByTokens: () => mockUseGetPoolsByTokens(),
}))

vi.mock('components/Liquidity/utils/parseFromRest', () => ({
  getPoolFromRest: () => mockGetPoolFromRest(),
}))

const mockPair = new Pair(
  CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
  CurrencyAmount.fromRawAmount(USDT, '1000000'),
)

describe('useDerivedPositionInfo', () => {
  const defaultCurrencyInputs = {
    tokenA: ETH_MAINNET,
    tokenB: USDT,
  }

  const defaultPositionState: PositionState = {
    protocolVersion: ProtocolVersion.V4,
    fee: {
      feeAmount: FeeAmount.MEDIUM,
      tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
      isDynamic: false,
    },
    hook: undefined,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockUseMultichainContext.mockReturnValue({
      chainId: UniverseChainId.Mainnet,
    })

    mockUseGetPoolsByTokens.mockReturnValue({
      data: { pools: [mockV3Pool] },
      isLoading: false,
      isFetched: true,
      refetch: vi.fn(),
    })

    mockUseV2Pair.mockReturnValue([PairState.EXISTS, mockPair])
    mockUsePool.mockReturnValue([PoolState.EXISTS, mockV3Pool])

    mockUseDefaultInitialPrice.mockReturnValue({
      price: 1000,
      isLoading: false,
    })
  })

  describe('V4 Protocol', () => {
    mockGetPoolFromRest.mockReturnValue(mockV4Pool)

    it('should return V4 position info when protocol version is V4', () => {
      const { result } = renderHook(() => useDerivedPositionInfo(defaultCurrencyInputs, defaultPositionState))
      const v4Result = result.current as CreateV4PositionInfo

      expect(v4Result.protocolVersion).toBe(ProtocolVersion.V4)
      expect(v4Result.creatingPoolOrPair).toBe(false)
      expect(v4Result.currencies.sdk.TOKEN0).toBe(ETH_MAINNET)
      expect(v4Result.currencies.sdk.TOKEN1).toBe(USDT)
      expect(v4Result.currencies.display.TOKEN0).toBe(ETH_MAINNET)
      expect(v4Result.currencies.display.TOKEN1).toBe(USDT)
      expect(v4Result.pool).toBe(mockV4Pool)
    })

    it('should return V4 position info when tokens are unsorted', () => {
      const { result } = renderHook(() =>
        useDerivedPositionInfo({ tokenA: USDT, tokenB: ETH_MAINNET }, defaultPositionState),
      )
      const v4Result = result.current as CreateV4PositionInfo

      expect(v4Result.protocolVersion).toBe(ProtocolVersion.V4)
      expect(v4Result.creatingPoolOrPair).toBe(false)
      expect(v4Result.currencies.sdk.TOKEN0).toBe(ETH_MAINNET)
      expect(v4Result.currencies.sdk.TOKEN1).toBe(USDT)
      expect(v4Result.currencies.display.TOKEN0).toBe(ETH_MAINNET)
      expect(v4Result.currencies.display.TOKEN1).toBe(USDT)
      expect(v4Result.pool).toBe(mockV4Pool)
    })

    it('should indicate creating new pool when no pool exists', () => {
      mockUseGetPoolsByTokens.mockReturnValue({
        data: { pools: [] },
        isLoading: false,
        isFetched: true,
        refetch: vi.fn(),
      })

      const { result } = renderHook(() => useDerivedPositionInfo(defaultCurrencyInputs, defaultPositionState))

      expect(result.current.creatingPoolOrPair).toBe(true)
    })

    it('should handle loading state', () => {
      mockUseGetPoolsByTokens.mockReturnValue({
        data: undefined,
        isLoading: true,
        isFetched: false,
        refetch: vi.fn(),
      })

      const { result } = renderHook(() => useDerivedPositionInfo(defaultCurrencyInputs, defaultPositionState))

      expect(result.current.poolOrPairLoading).toBe(true)
    })
  })

  describe('V3 Protocol', () => {
    const v3PositionState: PositionState = {
      ...defaultPositionState,
      protocolVersion: ProtocolVersion.V3,
    }

    it('should return V3 position info when protocol version is V3', () => {
      const { result } = renderHook(() => useDerivedPositionInfo(defaultCurrencyInputs, v3PositionState))
      const v3Result = result.current as CreateV3PositionInfo

      expect(v3Result.protocolVersion).toBe(ProtocolVersion.V3)
      expect(v3Result.pool).toBe(mockV3Pool)
      expect(v3Result.currencies.sdk.TOKEN0).toBe(ETH_MAINNET.wrapped)
      expect(v3Result.currencies.sdk.TOKEN1).toBe(USDT)
      expect(v3Result.currencies.display.TOKEN0).toBe(ETH_MAINNET)
      expect(v3Result.currencies.display.TOKEN1).toBe(USDT)
    })

    it('should return V3 position info when tokens are unsorted', () => {
      const { result } = renderHook(() =>
        useDerivedPositionInfo({ tokenA: USDT, tokenB: ETH_MAINNET }, v3PositionState),
      )
      const v3Result = result.current as CreateV3PositionInfo

      expect(v3Result.protocolVersion).toBe(ProtocolVersion.V3)
      expect(v3Result.pool).toBe(mockV3Pool)
      expect(v3Result.currencies.sdk.TOKEN0).toBe(ETH_MAINNET.wrapped)
      expect(v3Result.currencies.sdk.TOKEN1).toBe(USDT)
      expect(v3Result.currencies.display.TOKEN0).toBe(ETH_MAINNET)
      expect(v3Result.currencies.display.TOKEN1).toBe(USDT)
    })

    it('should indicate creating new pool when V3 pool does not exist', () => {
      mockUsePool.mockReturnValue([PoolState.NOT_EXISTS, null])

      const { result } = renderHook(() => useDerivedPositionInfo(defaultCurrencyInputs, v3PositionState))

      expect(result.current.creatingPoolOrPair).toBe(true)
    })
  })

  describe('V2 Protocol', () => {
    const v2PositionState: PositionState = {
      ...defaultPositionState,
      protocolVersion: ProtocolVersion.V2,
    }

    it('should return V2 position info when protocol version is V2', () => {
      const { result } = renderHook(() => useDerivedPositionInfo(defaultCurrencyInputs, v2PositionState))
      const v2Result = result.current as CreateV2PositionInfo

      expect(v2Result.protocolVersion).toBe(ProtocolVersion.V2)
      expect(v2Result.pair).toBe(mockPair)
      expect(v2Result.currencies.sdk.TOKEN0).toBe(ETH_MAINNET.wrapped)
      expect(v2Result.currencies.sdk.TOKEN1).toBe(USDT)
      expect(v2Result.currencies.display.TOKEN0).toBe(ETH_MAINNET)
      expect(v2Result.currencies.display.TOKEN1).toBe(USDT)
    })

    it('should return V2 position info when tokens are unsorted', () => {
      const { result } = renderHook(() =>
        useDerivedPositionInfo({ tokenA: USDT, tokenB: ETH_MAINNET }, v2PositionState),
      )
      const v2Result = result.current as CreateV2PositionInfo

      expect(v2Result.protocolVersion).toBe(ProtocolVersion.V2)
      expect(v2Result.pair).toBe(mockPair)
      expect(v2Result.currencies.sdk.TOKEN0).toBe(ETH_MAINNET.wrapped)
      expect(v2Result.currencies.sdk.TOKEN1).toBe(USDT)
      expect(v2Result.currencies.display.TOKEN0).toBe(ETH_MAINNET)
      expect(v2Result.currencies.display.TOKEN1).toBe(USDT)
    })

    it('should indicate creating new pair when V2 pair does not exist', () => {
      mockUseV2Pair.mockReturnValue([PairState.NOT_EXISTS, null])

      const { result } = renderHook(() => useDerivedPositionInfo(defaultCurrencyInputs, v2PositionState))

      expect(result.current.creatingPoolOrPair).toBe(true)
    })

    it('should handle pair loading state', () => {
      mockUseV2Pair.mockReturnValue([PairState.LOADING, null])

      const { result } = renderHook(() => useDerivedPositionInfo(defaultCurrencyInputs, v2PositionState))

      expect(result.current.poolOrPairLoading).toBe(true)
    })
  })

  describe('Unspecified Protocol', () => {
    const unspecifiedPositionState: PositionState = {
      ...defaultPositionState,
      protocolVersion: ProtocolVersion.UNSPECIFIED,
    }

    it('should return default info when protocol version is unspecified', () => {
      const { result } = renderHook(() => useDerivedPositionInfo(defaultCurrencyInputs, unspecifiedPositionState))

      expect(result.current.protocolVersion).toBe(ProtocolVersion.V4)
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing currencies gracefully', () => {
      const { result } = renderHook(() =>
        useDerivedPositionInfo({ tokenA: undefined, tokenB: undefined }, defaultPositionState),
      )

      expect(result.current.currencies.display.TOKEN0).toBeUndefined()
      expect(result.current.currencies.display.TOKEN1).toBeUndefined()
    })

    it('should handle fee tier filtering', () => {
      const poolWithDifferentFee = {
        ...mockV3Pool,
        fee: 10000,
      }

      mockUseGetPoolsByTokens.mockReturnValue({
        data: { pools: [poolWithDifferentFee] },
        isLoading: false,
        isFetched: true,
        refetch: vi.fn(),
      })

      const { result } = renderHook(() => useDerivedPositionInfo(defaultCurrencyInputs, defaultPositionState))

      expect(result.current.creatingPoolOrPair).toBe(true)
    })
  })

  describe('Refetch Functionality', () => {
    it('should provide refetch function', () => {
      const mockRefetch = vi.fn()
      mockUseGetPoolsByTokens.mockReturnValue({
        data: { pools: [mockV3Pool] },
        isLoading: false,
        isFetched: true,
        refetch: mockRefetch,
      })

      const { result } = renderHook(() => useDerivedPositionInfo(defaultCurrencyInputs, defaultPositionState))

      result.current.refetchPoolData()
      expect(mockRefetch).toHaveBeenCalled()
    })
  })
})

describe('getSortedCurrenciesForProtocol', () => {
  const nativeCurrency = nativeOnChain(UniverseChainId.Mainnet)

  it('sorts tokens when they are undefined', () => {
    expect(getSortedCurrenciesForProtocol({ a: undefined, b: undefined, protocolVersion: ProtocolVersion.V2 })).toEqual(
      { TOKEN0: undefined, TOKEN1: undefined },
    )
    expect(getSortedCurrenciesForProtocol({ a: undefined, b: undefined, protocolVersion: ProtocolVersion.V3 })).toEqual(
      { TOKEN0: undefined, TOKEN1: undefined },
    )
    expect(getSortedCurrenciesForProtocol({ a: undefined, b: undefined, protocolVersion: ProtocolVersion.V4 })).toEqual(
      { TOKEN0: undefined, TOKEN1: undefined },
    )

    expect(getSortedCurrenciesForProtocol({ a: USDT, b: undefined, protocolVersion: ProtocolVersion.V2 })).toEqual({
      TOKEN0: USDT,
      TOKEN1: undefined,
    })
    expect(getSortedCurrenciesForProtocol({ a: USDT, b: undefined, protocolVersion: ProtocolVersion.V3 })).toEqual({
      TOKEN0: USDT,
      TOKEN1: undefined,
    })
    expect(getSortedCurrenciesForProtocol({ a: USDT, b: undefined, protocolVersion: ProtocolVersion.V4 })).toEqual({
      TOKEN0: USDT,
      TOKEN1: undefined,
    })

    expect(getSortedCurrenciesForProtocol({ a: undefined, b: USDT, protocolVersion: ProtocolVersion.V2 })).toEqual({
      TOKEN0: undefined,
      TOKEN1: USDT,
    })
    expect(getSortedCurrenciesForProtocol({ a: undefined, b: USDT, protocolVersion: ProtocolVersion.V3 })).toEqual({
      TOKEN0: undefined,
      TOKEN1: USDT,
    })
    expect(getSortedCurrenciesForProtocol({ a: undefined, b: USDT, protocolVersion: ProtocolVersion.V4 })).toEqual({
      TOKEN0: undefined,
      TOKEN1: USDT,
    })
  })

  it('sorts 2 tokens correctly', () => {
    expect(getSortedCurrenciesForProtocol({ a: DAI, b: USDT, protocolVersion: ProtocolVersion.V2 })).toEqual({
      TOKEN0: DAI,
      TOKEN1: USDT,
    })
    expect(getSortedCurrenciesForProtocol({ a: USDT, b: DAI, protocolVersion: ProtocolVersion.V2 })).toEqual({
      TOKEN0: DAI,
      TOKEN1: USDT,
    })

    expect(getSortedCurrenciesForProtocol({ a: DAI, b: USDT, protocolVersion: ProtocolVersion.V3 })).toEqual({
      TOKEN0: DAI,
      TOKEN1: USDT,
    })
    expect(getSortedCurrenciesForProtocol({ a: USDT, b: DAI, protocolVersion: ProtocolVersion.V3 })).toEqual({
      TOKEN0: DAI,
      TOKEN1: USDT,
    })

    expect(getSortedCurrenciesForProtocol({ a: DAI, b: USDT, protocolVersion: ProtocolVersion.V4 })).toEqual({
      TOKEN0: DAI,
      TOKEN1: USDT,
    })
    expect(getSortedCurrenciesForProtocol({ a: USDT, b: DAI, protocolVersion: ProtocolVersion.V4 })).toEqual({
      TOKEN0: DAI,
      TOKEN1: USDT,
    })
  })

  it('sorts 2 tokens correctly with nativeCurrency', () => {
    expect(getSortedCurrenciesForProtocol({ a: DAI, b: nativeCurrency, protocolVersion: ProtocolVersion.V2 })).toEqual({
      TOKEN0: DAI,
      TOKEN1: nativeCurrency,
    })
    expect(getSortedCurrenciesForProtocol({ a: nativeCurrency, b: DAI, protocolVersion: ProtocolVersion.V2 })).toEqual({
      TOKEN0: DAI,
      TOKEN1: nativeCurrency,
    })
    expect(getSortedCurrenciesForProtocol({ a: USDT, b: nativeCurrency, protocolVersion: ProtocolVersion.V2 })).toEqual(
      {
        TOKEN0: nativeCurrency,
        TOKEN1: USDT,
      },
    )
    expect(getSortedCurrenciesForProtocol({ a: nativeCurrency, b: USDT, protocolVersion: ProtocolVersion.V2 })).toEqual(
      {
        TOKEN0: nativeCurrency,
        TOKEN1: USDT,
      },
    )

    expect(getSortedCurrenciesForProtocol({ a: DAI, b: nativeCurrency, protocolVersion: ProtocolVersion.V3 })).toEqual({
      TOKEN0: DAI,
      TOKEN1: nativeCurrency,
    })
    expect(getSortedCurrenciesForProtocol({ a: nativeCurrency, b: DAI, protocolVersion: ProtocolVersion.V3 })).toEqual({
      TOKEN0: DAI,
      TOKEN1: nativeCurrency,
    })
    expect(getSortedCurrenciesForProtocol({ a: USDT, b: nativeCurrency, protocolVersion: ProtocolVersion.V3 })).toEqual(
      {
        TOKEN0: nativeCurrency,
        TOKEN1: USDT,
      },
    )
    expect(getSortedCurrenciesForProtocol({ a: nativeCurrency, b: USDT, protocolVersion: ProtocolVersion.V3 })).toEqual(
      {
        TOKEN0: nativeCurrency,
        TOKEN1: USDT,
      },
    )

    expect(getSortedCurrenciesForProtocol({ a: DAI, b: nativeCurrency, protocolVersion: ProtocolVersion.V4 })).toEqual({
      TOKEN0: nativeCurrency,
      TOKEN1: DAI,
    })
    expect(getSortedCurrenciesForProtocol({ a: nativeCurrency, b: DAI, protocolVersion: ProtocolVersion.V4 })).toEqual({
      TOKEN0: nativeCurrency,
      TOKEN1: DAI,
    })
    expect(getSortedCurrenciesForProtocol({ a: USDT, b: nativeCurrency, protocolVersion: ProtocolVersion.V4 })).toEqual(
      {
        TOKEN0: nativeCurrency,
        TOKEN1: USDT,
      },
    )
    expect(getSortedCurrenciesForProtocol({ a: nativeCurrency, b: USDT, protocolVersion: ProtocolVersion.V4 })).toEqual(
      {
        TOKEN0: nativeCurrency,
        TOKEN1: USDT,
      },
    )
  })
})
