import { PartialMessage } from '@bufbuild/protobuf'
import { RankedRwa } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export function makeRankedRwa(overrides?: PartialMessage<RankedRwa>): RankedRwa {
  return new RankedRwa({
    symbol: 'TSLA',
    name: 'Tesla',
    logoUrl: 'https://example.com/tsla.png',
    priceUsd: 248.42,
    volume24hUsd: 12_400_000,
    marketCapUsd: 44_200_000,
    priceChange1hPct: 0.12,
    priceChange24hPct: 1.31,
    sparkline1d: {
      points: [
        { timestampS: BigInt(1_700_000_000), value: 245 },
        { timestampS: BigInt(1_700_003_600), value: 248.42 },
      ],
    },
    issuerTokens: [
      {
        symbol: 'TSLAON',
        name: 'Tesla (Ondo)',
        logoUrl: 'https://example.com/tslaon.png',
        issuer: 'ondo',
        priceUsd: 248.42,
        volume24hUsd: 8_000_000,
        marketCapUsd: 22_000_000,
        chainTokens: [{ chainId: UniverseChainId.Mainnet, address: '0xondo1' }],
      },
    ],
    ...overrides,
  })
}
