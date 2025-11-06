import {
  Hook,
  PairPosition,
  PoolPosition,
  PositionStatus,
  ProtocolVersion,
  Position as RestPosition,
  Token as RestToken,
  V4Position as RestV4Position,
} from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { ChainId, PoolInformation } from '@uniswap/client-trading/dist/trading/v1/api_pb'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { FeeAmount, TICK_SPACINGS, Pool as V3Pool, Position as V3Position } from '@uniswap/v3-sdk'
import { Pool as V4Pool, Position as V4Position } from '@uniswap/v4-sdk'
import { getSDKPoolFromPoolInformation, parseRestPosition } from 'components/Liquidity/utils/parseFromRest'
import { ETH_MAINNET } from 'test-utils/constants'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { DAI, USDT } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { WETH } from 'uniswap/src/test/fixtures/lib/sdk'
import { describe, expect, it } from 'vitest'

const token0Rest = {
  chainId: UniverseChainId.Mainnet,
  address: WETH.address,
  symbol: 'WETH',
  decimals: 18,
  name: 'Wrapped Ether',
} as RestToken
const token1Rest = {
  chainId: UniverseChainId.Mainnet,
  address: DAI.address,
  symbol: 'DAI',
  decimals: 18,
  name: 'Dai Stablecoin',
} as RestToken

class MockPoolPosition extends PoolPosition {
  tokenId = '955889'
  token0 = token0Rest
  token1 = token1Rest
  tickLower = '-80040'
  tickUpper = '-69060'
  liquidity = '319144036040717625'
  currentTick = '-79456'
  currentPrice = '1491492109227083417621276378'
  tickSpacing = '60'
  token0UncollectedFees = '43579015190865811'
  token1UncollectedFees = '16823042830636'
  amount0 = '6871326467140689901'
  amount1 = '173159597684065'
  poolId = '0xC2e9F25Be6257c210d7Adf0D4Cd6E3E881ba25f8'
  totalLiquidityUsd = '3040409.882234340097824045509354126'
  currentLiquidity = '99724783456148909569998'
  apr = 6.627231195792673
  owner = '0xe298932899e883372428bf9cc403d80061d66026'

  constructor(
    readonly protocolVersion: ProtocolVersion,
    readonly feeTier = '500',
  ) {
    super()
  }
}

describe('getSDKPoolFromPoolInformation', () => {
  const HOOK_ADDRESS = '0x09DEA99D714A3a19378e3D80D1ad22Ca46085080'
  const token0 = ETH_MAINNET.wrapped
  const token1 = USDT
  const hooks = { address: HOOK_ADDRESS } as Hook

  class MockPoolInformation extends PoolInformation {
    fee = FeeAmount.MEDIUM
    sqrtRatioX96 = '4054976535745954444738484'
    poolLiquidity = '7201247293608325509'
    currentTick = -197613
    tickSpacing = TICK_SPACINGS[FeeAmount.MEDIUM]
    poolReferenceIdentifier = '12345'
    tokenAddressA = token0.address
    tokenAddressB = token1.address
    chainId = ChainId.MAINNET
    token0Reserves = '1000000000000000000'
    token1Reserves = '2000000000000000000'
    hookAddress = hooks.address
    constructor(readonly protocolVersion: ProtocolVersion) {
      super()
    }
  }

  const MOCK_V3_POOL_INFORMATION = new MockPoolInformation(ProtocolVersion.V3)
  const MOCK_V4_POOL_INFORMATION = new MockPoolInformation(ProtocolVersion.V4)

  const V3_POOL = new V3Pool(
    token0,
    token1,
    MOCK_V3_POOL_INFORMATION.fee,
    MOCK_V3_POOL_INFORMATION.sqrtRatioX96,
    MOCK_V3_POOL_INFORMATION.poolLiquidity,
    MOCK_V3_POOL_INFORMATION.currentTick,
  )

  const V4_POOL = new V4Pool(
    token0,
    token1,
    MOCK_V4_POOL_INFORMATION.fee,
    MOCK_V4_POOL_INFORMATION.tickSpacing,
    MOCK_V4_POOL_INFORMATION.hookAddress,
    MOCK_V4_POOL_INFORMATION.sqrtRatioX96,
    MOCK_V4_POOL_INFORMATION.poolLiquidity,
    MOCK_V4_POOL_INFORMATION.currentTick,
  )

  it('returns undefined if poolOrPair, token0, or token1 is missing', () => {
    expect(
      getSDKPoolFromPoolInformation({ poolOrPair: undefined, token0, token1, protocolVersion: ProtocolVersion.V3 }),
    ).toBeUndefined()
    expect(
      getSDKPoolFromPoolInformation({
        poolOrPair: MOCK_V3_POOL_INFORMATION,
        token0: undefined,
        token1,
        protocolVersion: ProtocolVersion.V3,
      }),
    ).toBeUndefined()
    expect(
      getSDKPoolFromPoolInformation({
        poolOrPair: MOCK_V3_POOL_INFORMATION,
        token0,
        token1: undefined,
        protocolVersion: ProtocolVersion.V3,
      }),
    ).toBeUndefined()
  })

  it('returns V3Pool for ProtocolVersion.V3', () => {
    const result = getSDKPoolFromPoolInformation({
      poolOrPair: MOCK_V3_POOL_INFORMATION,
      token0,
      token1,
      protocolVersion: ProtocolVersion.V3,
    })
    expect(result).toEqual(V3_POOL)
  })

  it('returns V4Pool for ProtocolVersion.V4', () => {
    const result = getSDKPoolFromPoolInformation({
      poolOrPair: MOCK_V4_POOL_INFORMATION,
      token0,
      token1,
      protocolVersion: ProtocolVersion.V4,
      hooks: hooks.address,
    })
    expect(result).toEqual(V4_POOL)
  })
})

describe('parseRestPosition', () => {
  const liquidityTokenRest = {
    chainId: UniverseChainId.Mainnet,
    address: '0xb2839134B8151964f19f6f3c7D59C70ae52852F5',
    symbol: 'UNI-V2',
    decimals: 18,
    name: 'Uniswap V2',
  }
  const liquidityToken = new Token(
    liquidityTokenRest.chainId,
    liquidityTokenRest.address,
    liquidityTokenRest.decimals,
    liquidityTokenRest.symbol,
    liquidityTokenRest.name,
  )

  const v2PairPosition = {
    token0: token0Rest,
    token1: token1Rest,
    liquidityToken: liquidityTokenRest,
    reserve0: '13392148139097083',
    reserve1: '37200514537113167549',
    liquidity: '32497819144873367',
    liquidity0: '1287406081895533',
    liquidity1: '3576137910609435726',
    totalSupply: '338056200220005713',
  } as PairPosition

  const MOCK_REST_V2_POSITION: RestPosition = {
    chainId: UniverseChainId.Mainnet,
    protocolVersion: ProtocolVersion.V2,
    position: {
      case: 'v2Pair',
      value: v2PairPosition,
    },
    status: PositionStatus.IN_RANGE,
    isHidden: false,
  } as RestPosition

  const mockV3Position: PoolPosition = new MockPoolPosition(ProtocolVersion.V3)

  const MOCK_REST_V3_POSITION: RestPosition = {
    chainId: UniverseChainId.Mainnet,
    protocolVersion: ProtocolVersion.V3,
    position: {
      case: 'v3Position',
      value: mockV3Position,
    },
    status: PositionStatus.IN_RANGE,
    isHidden: false,
  } as RestPosition

  const mockV4PoolPosition: PoolPosition = new MockPoolPosition(ProtocolVersion.V4, '3000')
  const v4Position: RestV4Position = {
    poolPosition: mockV4PoolPosition,
    hooks: [{ address: ZERO_ADDRESS } as Hook],
  } as RestV4Position

  const MOCK_REST_V4_POSITION: RestPosition = {
    chainId: UniverseChainId.Mainnet,
    protocolVersion: ProtocolVersion.V4,
    position: {
      case: 'v4Position',
      value: v4Position,
    },
    status: PositionStatus.IN_RANGE,
    isHidden: false,
  } as RestPosition

  it('returns undefined if position is undefined', () => {
    expect(parseRestPosition(undefined)).toBeUndefined()
  })

  it('parses v2Pair position', () => {
    const result = parseRestPosition(MOCK_REST_V2_POSITION)
    expect(result).toEqual({
      status: PositionStatus.IN_RANGE,
      version: ProtocolVersion.V2,
      poolOrPair: expect.any(Pair),
      liquidityToken,
      chainId: UniverseChainId.Mainnet,
      poolId: liquidityToken.address,
      currency0Amount: CurrencyAmount.fromRawAmount(WETH, v2PairPosition.liquidity0),
      currency1Amount: CurrencyAmount.fromRawAmount(DAI, v2PairPosition.liquidity1),
      totalSupply: CurrencyAmount.fromRawAmount(liquidityToken, v2PairPosition.totalSupply),
      liquidityAmount: CurrencyAmount.fromRawAmount(liquidityToken, v2PairPosition.liquidity),
      apr: v2PairPosition.apr,
      v4hook: undefined,
      feeTier: undefined,
      owner: undefined,
      isHidden: false,
    })
  })

  it('returns undefined if v2Pair tokens are missing', () => {
    const position = {
      ...MOCK_REST_V2_POSITION,
      position: {
        ...MOCK_REST_V2_POSITION.position,
        value: {
          ...MOCK_REST_V2_POSITION.position.value,
          token0: undefined,
          token1: undefined,
        },
      },
    } as RestPosition
    expect(parseRestPosition(position)).toBeUndefined()
  })

  it('parses v3Position', () => {
    const result = parseRestPosition(MOCK_REST_V3_POSITION)
    expect(result).toEqual({
      status: PositionStatus.IN_RANGE,
      version: ProtocolVersion.V3,
      chainId: UniverseChainId.Mainnet,
      poolId: mockV3Position.poolId,
      tickLower: Number(mockV3Position.tickLower),
      tickUpper: Number(mockV3Position.tickUpper),
      tickSpacing: Number(mockV3Position.tickSpacing),
      liquidity: mockV3Position.liquidity,
      tokenId: mockV3Position.tokenId,
      token0UncollectedFees: mockV3Position.token0UncollectedFees,
      token1UncollectedFees: mockV3Position.token1UncollectedFees,
      fee0Amount: CurrencyAmount.fromRawAmount(WETH, mockV3Position.token0UncollectedFees),
      fee1Amount: CurrencyAmount.fromRawAmount(DAI, mockV3Position.token1UncollectedFees),
      currency0Amount: CurrencyAmount.fromRawAmount(WETH, mockV3Position.amount0),
      currency1Amount: CurrencyAmount.fromRawAmount(DAI, mockV3Position.amount1),
      apr: mockV3Position.apr,
      v4hook: undefined,
      owner: mockV3Position.owner,
      isHidden: false,
      feeTier: {
        feeAmount: Number(mockV3Position.feeTier),
        tickSpacing: Number(mockV3Position.tickSpacing),
        isDynamic: false,
      },
      poolOrPair: expect.any(V3Pool),
      position: expect.any(V3Position),
    })
  })

  it('returns undefined if v3Position tokens are missing', () => {
    const position = {
      ...MOCK_REST_V3_POSITION,
      position: {
        ...MOCK_REST_V3_POSITION.position,
        value: {
          ...MOCK_REST_V3_POSITION.position.value,
          token0: undefined,
          token1: undefined,
        },
      },
    } as RestPosition
    expect(parseRestPosition(position)).toBeUndefined()
  })

  it('parses v4Position', () => {
    const result = parseRestPosition(MOCK_REST_V4_POSITION)
    expect(result).toEqual({
      poolId: V4Pool.getPoolId(
        WETH,
        DAI,
        Number(mockV4PoolPosition.feeTier),
        Number(mockV4PoolPosition.tickSpacing),
        ZERO_ADDRESS,
      ),
      feeTier: {
        feeAmount: Number(mockV4PoolPosition.feeTier),
        tickSpacing: Number(mockV4PoolPosition.tickSpacing),
        isDynamic: false,
      },
      status: PositionStatus.IN_RANGE,
      version: ProtocolVersion.V4,
      chainId: UniverseChainId.Mainnet,
      v4hook: ZERO_ADDRESS,
      tokenId: mockV4PoolPosition.tokenId,
      tickLower: Number(mockV4PoolPosition.tickLower),
      tickUpper: Number(mockV4PoolPosition.tickUpper),
      tickSpacing: Number(mockV4PoolPosition.tickSpacing),
      liquidity: mockV4PoolPosition.liquidity,
      token0UncollectedFees: mockV4PoolPosition.token0UncollectedFees,
      token1UncollectedFees: mockV4PoolPosition.token1UncollectedFees,
      fee0Amount: CurrencyAmount.fromRawAmount(WETH, mockV4PoolPosition.token0UncollectedFees),
      fee1Amount: CurrencyAmount.fromRawAmount(DAI, mockV4PoolPosition.token1UncollectedFees),
      currency0Amount: CurrencyAmount.fromRawAmount(WETH, mockV4PoolPosition.amount0),
      currency1Amount: CurrencyAmount.fromRawAmount(DAI, mockV4PoolPosition.amount1),
      apr: mockV4PoolPosition.apr,
      totalApr: mockV4PoolPosition.totalApr,
      unclaimedRewardsAmountUni: mockV4PoolPosition.unclaimedRewardsAmountUni,
      owner: mockV4PoolPosition.owner,
      isHidden: false,
      boostedApr: mockV4PoolPosition.boostedApr,
      poolOrPair: expect.any(V4Pool),
      position: expect.any(V4Position),
    })
  })

  it('returns undefined if v4Position or tokens are missing', () => {
    const position = {
      ...MOCK_REST_V4_POSITION,
      position: {
        ...MOCK_REST_V4_POSITION.position,
        value: {
          ...MOCK_REST_V4_POSITION.position.value,
          poolPosition: undefined,
        },
      },
    } as RestPosition
    expect(parseRestPosition(position)).toBeUndefined()
  })
})
