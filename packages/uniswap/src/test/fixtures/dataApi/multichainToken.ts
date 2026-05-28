import type { SafetyLevel, SpamCode } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { ChainToken, MultichainToken, TokenStats, TokenType } from '@uniswap/client-data-api/dist/data/v1/types_pb'

interface MultichainTokenOverrides {
  multichainId: string
  name: string
  symbol: string
  projectName: string
  logoUrl: string
  safetyLevel: SafetyLevel | number
  spamCode: SpamCode | number
  chainId: number
  address: string
  decimals: number
  price: number
  fdv: number
  priceChange1h: number
  priceChange1d: number
  volume1d: number
  chainTokens: ChainToken[]
  stats: TokenStats
  feeData: MultichainToken['feeData']
}

function buildChainTokens(o: Partial<MultichainTokenOverrides>): ChainToken[] {
  return (
    o.chainTokens ?? [
      new ChainToken({
        chainId: o.chainId ?? 1,
        address: o.address ?? '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        decimals: o.decimals ?? 6,
        isBridged: false,
      }),
    ]
  )
}

function buildStats(o: Partial<MultichainTokenOverrides>): TokenStats | undefined {
  if (o.stats) {
    return o.stats
  }
  if (
    o.price === undefined &&
    o.fdv === undefined &&
    o.priceChange1h === undefined &&
    o.priceChange1d === undefined &&
    o.volume1d === undefined
  ) {
    return undefined
  }
  return new TokenStats({
    price: o.price,
    volume1d: o.volume1d ?? 0,
    ...(o.fdv !== undefined && { fdv: o.fdv }),
    ...(o.priceChange1h !== undefined && { priceChange1h: o.priceChange1h }),
    ...(o.priceChange1d !== undefined && { priceChange1d: o.priceChange1d }),
  })
}

/**
 * Shared factory for creating `MultichainToken` test fixtures (client-data-api).
 */
export function createDataApiMultichainToken(overrides: Partial<MultichainTokenOverrides> = {}): MultichainToken {
  const stats = buildStats(overrides)

  return new MultichainToken({
    multichainId: overrides.multichainId ?? 'mc:1_0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: overrides.symbol ?? 'USDC',
    name: overrides.name ?? 'USD Coin',
    type: TokenType.ERC20,
    projectName: overrides.projectName ?? 'Circle',
    logoUrl: overrides.logoUrl ?? 'https://example.com/usdc.png',
    safetyLevel: overrides.safetyLevel ?? 0,
    spamCode: overrides.spamCode ?? 0,
    chainTokens: buildChainTokens(overrides),
    ...(stats && { stats }),
    ...(overrides.feeData && { feeData: overrides.feeData }),
  })
}
