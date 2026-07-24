import { TokenType } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import {
  ChainTokenRankStats,
  MultichainToken,
  RankedMultichainToken,
  TokenPriceData,
  TokenProject,
  TokenRankStats,
  TokenSafety,
} from '@uniswap/client-data-api/dist/data/v2/types_pb'

interface RankedMultichainTokenOverrides
  extends
    Pick<MultichainToken, 'multichainId' | 'name' | 'symbol' | 'decimals' | 'addresses'>,
    Pick<TokenSafety, 'isSpam' | 'isVerified' | 'isBlocked'>,
    Pick<TokenProject, 'logoUrl'>,
    Pick<ChainTokenRankStats, 'chainId'>,
    Pick<
      TokenRankStats,
      'volume1h' | 'volume1d' | 'volume7d' | 'volume30d' | 'volume1y' | 'volumeAll' | 'tvl' | 'fdv'
    > {
  address: string
  price: number
  priceChange1h: number
  priceChange1d: number
  chainStats: ChainTokenRankStats[]
}

function buildAddresses(o: Partial<RankedMultichainTokenOverrides>): Record<string, string> {
  return o.addresses ?? { [String(o.chainId ?? 1)]: o.address ?? '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' }
}

function buildChainStats(o: Partial<RankedMultichainTokenOverrides>): ChainTokenRankStats[] {
  if (o.chainStats) {
    return o.chainStats
  }
  return [
    new ChainTokenRankStats({
      chainId: o.chainId ?? 1,
      stats: new TokenRankStats({
        volume1h: o.volume1h,
        volume1d: o.volume1d,
        volume7d: o.volume7d,
        volume30d: o.volume30d,
        volume1y: o.volume1y,
        volumeAll: o.volumeAll,
        tvl: o.tvl,
      }),
    }),
  ]
}

function buildPrice(o: Partial<RankedMultichainTokenOverrides>): TokenPriceData | undefined {
  if (o.price === undefined && o.priceChange1h === undefined && o.priceChange1d === undefined) {
    return undefined
  }
  return new TokenPriceData({ spotUsd: o.price, percentChange1h: o.priceChange1h, percentChange1d: o.priceChange1d })
}

function buildStats(o: Partial<RankedMultichainTokenOverrides>): TokenRankStats | undefined {
  const hasAny = [o.volume1h, o.volume1d, o.volume7d, o.volume30d, o.volume1y, o.volumeAll, o.tvl, o.fdv].some(
    (v) => v !== undefined,
  )
  if (!hasAny) {
    return undefined
  }
  return new TokenRankStats({
    volume1h: o.volume1h,
    volume1d: o.volume1d,
    volume7d: o.volume7d,
    volume30d: o.volume30d,
    volume1y: o.volume1y,
    volumeAll: o.volumeAll,
    tvl: o.tvl,
    fdv: o.fdv,
  })
}

/**
 * Shared factory for creating `data.v2.RankedMultichainToken` test fixtures (client-data-api).
 * For the v1 `data.v1.MultichainToken` shape (still used by non-Explore consumers), see
 * `createDataApiMultichainToken` in `./multichainToken.ts`.
 */
export function createRankedMultichainToken(
  overrides: Partial<RankedMultichainTokenOverrides> = {},
): RankedMultichainToken {
  const price = buildPrice(overrides)
  const stats = buildStats(overrides)

  return new RankedMultichainToken({
    multichainToken: new MultichainToken({
      multichainId: overrides.multichainId ?? 'mc:1_0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: overrides.symbol ?? 'USDC',
      name: overrides.name ?? 'USD Coin',
      decimals: overrides.decimals ?? 6,
      type: TokenType.ERC20,
      addresses: buildAddresses(overrides),
      ...(price && { price }),
      safety: new TokenSafety({
        isSpam: overrides.isSpam ?? false,
        isVerified: overrides.isVerified ?? false,
        isBlocked: overrides.isBlocked ?? false,
      }),
      project: new TokenProject({ logoUrl: overrides.logoUrl ?? 'https://example.com/usdc.png' }),
    }),
    ...(stats && { stats }),
    chainStats: buildChainStats(overrides),
  })
}
