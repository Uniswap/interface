import type { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { DYNAMIC_FEE_AMOUNT } from 'uniswap/src/constants/pools'
import { DAI, USDC_BASE, USDC_MAINNET, USDC_OPTIMISM, USDT, WBTC } from 'uniswap/src/constants/tokens'
import type { PoolStat, TokenStat } from '~/types/explore'

interface PoolFixtureInput {
  pair: readonly [TokenStat, TokenStat]
  tvl?: number
  volume1d?: number
  volume30d?: number
  apr?: number
  totalApr?: number
  dynamic?: boolean
  fee?: number
}

interface HookPoolsFixture {
  chainId: UniverseChainId
  hookAddress: string
  total: number
  pools: readonly PoolStat[]
}

function tokenStat(token: Token): TokenStat {
  return {
    chainId: token.chainId,
    address: token.address,
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
  }
}

function ether(chainId: UniverseChainId): TokenStat {
  return {
    chainId,
    address: getNativeAddress(chainId),
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18,
    isNative: true,
  }
}

function createPoolFixtures({
  chainId,
  hookAddress,
  inputs,
  count = inputs.length,
}: {
  chainId: UniverseChainId
  hookAddress: string
  inputs: readonly [PoolFixtureInput, ...PoolFixtureInput[]]
  count?: number
}): PoolStat[] {
  return Array.from({ length: count }, (_, index) => {
    const {
      pair,
      tvl,
      volume1d,
      volume30d,
      apr,
      totalApr = apr,
      dynamic = false,
      fee = 500,
    } = inputs[index % inputs.length]!
    const variation = Math.floor(index / inputs.length) + 1
    return {
      id: `hooks-preview-${chainId}-${hookAddress}-${String(index + 1).padStart(3, '0')}`,
      chainId,
      hookAddress,
      protocolVersion: 'v4',
      token0: pair[0],
      token1: pair[1],
      feeTier: { feeAmount: dynamic ? DYNAMIC_FEE_AMOUNT : fee, tickSpacing: 10 * variation, isDynamic: dynamic },
      totalLiquidity: tvl === undefined ? undefined : { value: tvl / variation },
      volume1Day: volume1d === undefined ? undefined : { value: volume1d / variation },
      volume30Day: volume30d === undefined ? undefined : { value: volume30d / variation },
      volOverTvl: tvl !== undefined && tvl > 0 && volume1d !== undefined ? volume1d / tvl : undefined,
      apr,
      totalApr,
      rewards: [],
    }
  })
}

const ETH = ether(UniverseChainId.Mainnet)
const BASE_ETH = ether(UniverseChainId.Base)
const USDC = tokenStat(USDC_MAINNET)
const BASE_USDC = tokenStat(USDC_BASE)
const USDT_TOKEN = tokenStat(USDT)
const DAI_TOKEN = tokenStat(DAI)
const BTC = tokenStat(WBTC)

// TODO(CONS-3941): Remove authored pool previews when hook details use live deployment data.
export const HOOK_POOL_FIXTURES: readonly HookPoolsFixture[] = [
  {
    chainId: UniverseChainId.Mainnet,
    hookAddress: '0x1111111111111111111111111111111111111111',
    total: 24,
    pools: createPoolFixtures({
      chainId: UniverseChainId.Mainnet,
      hookAddress: '0x1111111111111111111111111111111111111111',
      inputs: [
        { pair: [ETH, USDC], tvl: 12_000_000, volume1d: 5_200_000, volume30d: 128_000_000, apr: 7.91, dynamic: true },
        { pair: [ETH, BTC], tvl: 8_000_000, volume1d: 2_800_000, volume30d: 76_000_000, apr: 6.38 },
        { pair: [USDC, USDT_TOKEN], tvl: 5_000_000, volume1d: 1_200_000, volume30d: 36_000_000, apr: 4.38, fee: 100 },
        { pair: [ETH, DAI_TOKEN], tvl: 2_000_000, volume1d: 700_000, volume30d: 7_100_000, apr: 12.77, fee: 3000 },
        { pair: [BTC, USDC], tvl: 1_000_000, volume1d: 200_000, volume30d: 2_000_000, apr: 3.65, dynamic: true },
        { pair: [DAI_TOKEN, USDC], tvl: 0, volume1d: 0, volume30d: 0, apr: 0, fee: 100 },
        { pair: [ETH, USDT_TOKEN], tvl: 0, volume1d: 0, volume30d: 50_000, apr: 0 },
        { pair: [BTC, USDT_TOKEN] },
      ],
      count: 24,
    }),
  },
  {
    chainId: UniverseChainId.Base,
    hookAddress: '0x2222222222222222222222222222222222222222',
    total: 12,
    pools: createPoolFixtures({
      chainId: UniverseChainId.Base,
      hookAddress: '0x2222222222222222222222222222222222222222',
      inputs: [
        { pair: [BASE_ETH, BASE_USDC], tvl: 10_500_000, volume1d: 4_100_000, volume30d: 102_300_000, apr: 7.13 },
      ],
      count: 12,
    }),
  },
  {
    chainId: UniverseChainId.ArbitrumOne,
    hookAddress: '0x1111111111111111111111111111111111111111',
    total: 0,
    pools: [],
  },
  {
    chainId: UniverseChainId.Base,
    hookAddress: '0x4444444444444444444444444444444444444444',
    total: 1,
    pools: createPoolFixtures({
      chainId: UniverseChainId.Base,
      hookAddress: '0x4444444444444444444444444444444444444444',
      inputs: [{ pair: [BASE_ETH, BASE_USDC], dynamic: true }],
    }),
  },
  {
    chainId: UniverseChainId.Mainnet,
    hookAddress: '0x3333333333333333333333333333333333333333',
    total: 18,
    pools: createPoolFixtures({
      chainId: UniverseChainId.Mainnet,
      hookAddress: '0x3333333333333333333333333333333333333333',
      inputs: [{ pair: [ETH, USDC], tvl: 3_600_000, dynamic: true }],
      count: 18,
    }),
  },
  {
    chainId: UniverseChainId.Mainnet,
    hookAddress: '0x5555555555555555555555555555555555555555',
    total: 9,
    pools: createPoolFixtures({
      chainId: UniverseChainId.Mainnet,
      hookAddress: '0x5555555555555555555555555555555555555555',
      inputs: [
        {
          pair: [ETH, BTC],
          tvl: 567_800_000,
          volume1d: 123_400_000,
          volume30d: 1_500_000_000,
          apr: 1.52,
          dynamic: true,
        },
        { pair: [USDC, USDT_TOKEN], tvl: 345_600_000, volume1d: 67_800_000, volume30d: 897_600_000, apr: 0.89 },
        { pair: [ETH, USDC], tvl: 78_900_000, volume1d: 10_100_000, volume30d: 345_600_000, apr: 0.52 },
      ],
      count: 9,
    }),
  },
  {
    chainId: UniverseChainId.Base,
    hookAddress: '0x6666666666666666666666666666666666666666',
    total: 2,
    pools: createPoolFixtures({
      chainId: UniverseChainId.Base,
      hookAddress: '0x6666666666666666666666666666666666666666',
      inputs: [
        { pair: [BASE_ETH, BASE_USDC], tvl: 420_000, volume1d: 0, volume30d: 152_000, apr: 0 },
        { pair: [BASE_ETH, BASE_USDC], tvl: 0, volume1d: 0, volume30d: 0, apr: 0, dynamic: true },
      ],
    }),
  },
  {
    chainId: UniverseChainId.Optimism,
    hookAddress: '0xabcdef123456789012345678901234567890abcd',
    total: 4,
    pools: createPoolFixtures({
      chainId: UniverseChainId.Optimism,
      hookAddress: '0xabcdef123456789012345678901234567890abcd',
      inputs: [
        {
          pair: [ether(UniverseChainId.Optimism), tokenStat(USDC_OPTIMISM)],
          tvl: 1_240_000,
          volume1d: 1_800,
          apr: 0.05,
        },
      ],
      count: 4,
    }),
  },
]
