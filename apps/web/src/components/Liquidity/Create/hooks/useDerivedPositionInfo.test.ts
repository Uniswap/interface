import { renderHook } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { ChainId, PoolInformation } from '@uniswap/client-trading/dist/trading/v1/api_pb'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { FeeAmount, TICK_SPACINGS, Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import { getFeatureFlag } from '@universe/gating'
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
import { ETH_MAINNET } from 'test-utils/constants'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { DAI, nativeOnChain, USDT } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

class MockPoolInformation extends PoolInformation {
  fee = FeeAmount.MEDIUM
  sqrtRatioX96 = '4054976535745954444738484'
  poolLiquidity = '7201247293608325509'
  currentTick = -197613
  tickSpacing = TICK_SPACINGS[FeeAmount.MEDIUM]
  poolReferenceIdentifier = '12345'
  tokenAddressA = ETH_MAINNET.wrapped.address
  tokenAddressB = USDT.address
  chainId = ChainId.MAINNET
  token0Reserves = '1000000000000000000'
  token1Reserves = '2000000000000000000'
  hookAddress = ZERO_ADDRESS

  constructor(readonly protocolVersion: ProtocolVersion) {
    super()
  }
}

const mockV4PoolInformation = new MockPoolInformation(ProtocolVersion.V4)
const mockV3PoolInformation = new MockPoolInformation(ProtocolVersion.V3)
const mockV2PairInformation = new MockPoolInformation(ProtocolVersion.V2)

const mockV3Pool = new V3Pool(
  ETH_MAINNET.wrapped,
  USDT,
  mockV3PoolInformation.fee,
  mockV3PoolInformation.sqrtRatioX96,
  mockV3PoolInformation.poolLiquidity,
  mockV3PoolInformation.currentTick,
)

const mockV4Pool = new V4Pool(
  ETH_MAINNET,
  USDT,
  mockV4PoolInformation.fee,
  mockV4PoolInformation.tickSpacing,
  mockV4PoolInformation.hookAddress,
  mockV4PoolInformation.sqrtRatioX96,
  mockV4PoolInformation.poolLiquidity,
  mockV4PoolInformation.currentTick,
)

const mockPair = new Pair(
  CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, mockV2PairInformation.token0Reserves),
  CurrencyAmount.fromRawAmount(USDT, mockV2PairInformation.token1Reserves),
)

// remove the following mocks once the PoolInfoEndpoint is fully rolled out
const mockUseMultichainContext = vi.fn()
const mockUseGetPoolsByTokens = vi.fn()
const mockGetFeatureFlag = vi.mocked(getFeatureFlag)
const mockUseV2Pair = vi.fn()
const mockUsePool = vi.fn()

const mockUsePoolInfoQuery = vi.fn()
const mockUseDefaultInitialPrice = vi.fn()

vi.mock('state/multichain/useMultichainContext', () => ({
  useMultichainContext: () => mockUseMultichainContext(),
}))

vi.mock('uniswap/src/data/rest/getPools', () => ({
  useGetPoolsByTokens: () => mockUseGetPoolsByTokens(),
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal()),
  getFeatureFlag: vi.fn(),
}))

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

vi.mock('uniswap/src/data/apiClients/tradingApi/usePoolInfoQuery', () => ({
  usePoolInfoQuery: () => mockUsePoolInfoQuery(),
}))

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

    mockGetFeatureFlag.mockReturnValue(true)

    mockUseMultichainContext.mockReturnValue({
      chainId: UniverseChainId.Mainnet,
    })

    mockUseGetPoolsByTokens.mockReturnValue({
      data: undefined,
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
    beforeEach(() => {
      mockUsePoolInfoQuery.mockReturnValue({
        data: { pools: [mockV4PoolInformation] },
        isLoading: false,
        isFetched: true,
        refetch: vi.fn(),
      })
    })

    it('should return V4 position info when protocol version is V4', () => {
      const { result } = renderHook(() => useDerivedPositionInfo(defaultCurrencyInputs, defaultPositionState))
      const v4Result = result.current as CreateV4PositionInfo

      expect(v4Result.protocolVersion).toBe(ProtocolVersion.V4)
      expect(v4Result.creatingPoolOrPair).toBe(false)
      expect(v4Result.currencies.sdk.TOKEN0).toBe(ETH_MAINNET)
      expect(v4Result.currencies.sdk.TOKEN1).toBe(USDT)
      expect(v4Result.currencies.display.TOKEN0).toBe(ETH_MAINNET)
      expect(v4Result.currencies.display.TOKEN1).toBe(USDT)
      expect(v4Result.pool).toEqual(mockV4Pool)
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
      expect(v4Result.pool).toEqual(mockV4Pool)
    })

    it('should indicate creating new pool when no pool exists', () => {
      mockUsePoolInfoQuery.mockReturnValue({
        data: { pools: [] },
        isLoading: false,
        isFetched: true,
        refetch: vi.fn(),
      })

      const { result } = renderHook(() => useDerivedPositionInfo(defaultCurrencyInputs, defaultPositionState))

      expect(result.current.creatingPoolOrPair).toBe(true)
    })

    it('should handle loading state', () => {
      mockUsePoolInfoQuery.mockReturnValue({
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

    beforeEach(() => {
      mockUsePoolInfoQuery.mockReturnValue({
        data: { pools: [mockV3PoolInformation] },
        isLoading: false,
        isFetched: true,
        refetch: vi.fn(),
      })
    })

    it('should return V3 position info when protocol version is V3', () => {
      const { result } = renderHook(() => useDerivedPositionInfo(defaultCurrencyInputs, v3PositionState))
      const v3Result = result.current as CreateV3PositionInfo

      expect(v3Result.protocolVersion).toBe(ProtocolVersion.V3)
      expect(v3Result.pool).toEqual(mockV3Pool)
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
      expect(v3Result.pool).toEqual(mockV3Pool)
      expect(v3Result.currencies.sdk.TOKEN0).toBe(ETH_MAINNET.wrapped)
      expect(v3Result.currencies.sdk.TOKEN1).toBe(USDT)
      expect(v3Result.currencies.display.TOKEN0).toBe(ETH_MAINNET)
      expect(v3Result.currencies.display.TOKEN1).toBe(USDT)
    })

    it('should indicate creating new pool when V3 pool does not exist', () => {
      mockUsePoolInfoQuery.mockReturnValue({
        data: { pools: [] },
        isLoading: false,
        isFetched: true,
        refetch: vi.fn(),
      })

      const { result } = renderHook(() => useDerivedPositionInfo(defaultCurrencyInputs, v3PositionState))

      expect(result.current.creatingPoolOrPair).toBe(true)
    })
  })

  describe('V2 Protocol', () => {
    const v2PositionState: PositionState = {
      ...defaultPositionState,
      protocolVersion: ProtocolVersion.V2,
    }

    beforeEach(() => {
      mockUsePoolInfoQuery.mockReturnValue({
        data: { pools: [mockV2PairInformation] },
        isLoading: false,
        isFetched: true,
        refetch: vi.fn(),
      })
    })

    it('should return V2 position info when protocol version is V2', () => {
      const { result } = renderHook(() => useDerivedPositionInfo(defaultCurrencyInputs, v2PositionState))
      const v2Result = result.current as CreateV2PositionInfo

      expect(v2Result.protocolVersion).toBe(ProtocolVersion.V2)
      expect(v2Result.pair).toEqual(mockPair)
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
      expect(v2Result.pair).toEqual(mockPair)
      expect(v2Result.currencies.sdk.TOKEN0).toBe(ETH_MAINNET.wrapped)
      expect(v2Result.currencies.sdk.TOKEN1).toBe(USDT)
      expect(v2Result.currencies.display.TOKEN0).toBe(ETH_MAINNET)
      expect(v2Result.currencies.display.TOKEN1).toBe(USDT)
    })

    it('should indicate creating new pair when V2 pair does not exist', () => {
      mockUsePoolInfoQuery.mockReturnValue({
        data: { pools: [] },
        isLoading: false,
        isFetched: true,
        refetch: vi.fn(),
      })

      const { result } = renderHook(() => useDerivedPositionInfo(defaultCurrencyInputs, v2PositionState))

      expect(result.current.creatingPoolOrPair).toBe(true)
    })

    it('should handle pair loading state', () => {
      mockUsePoolInfoQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        isFetched: false,
        refetch: vi.fn(),
      })

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
      // When pools exist but none match the required fee, should indicate creating new pool
      mockUsePoolInfoQuery.mockReturnValue({
        data: { pools: [] },
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
      mockUsePoolInfoQuery.mockReturnValue({
        data: { pools: [mockV4PoolInformation] },
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
