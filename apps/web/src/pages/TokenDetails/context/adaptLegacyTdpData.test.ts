import { TokenType } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import type { GraphQLApi } from '@universe/api'
import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/features/chains/evm/rpc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  adaptLegacyTokenToV2MultichainToken,
  adaptLegacyTokenToV2Token,
} from '~/pages/TokenDetails/context/adaptLegacyTdpData'

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDC_BASE_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

function buildMetadataToken(
  overrides: Partial<Record<string, unknown>> = {},
): NonNullable<GraphQLApi.TokenProjectWebQuery['token']> {
  return {
    id: 'token-id',
    decimals: 6,
    name: 'USD Coin',
    chain: 'ETHEREUM',
    address: USDC_ADDRESS,
    symbol: 'USDC',
    standard: 'ERC20',
    project: {
      id: 'project-id',
      description: 'A stablecoin',
      homepageUrl: 'https://www.circle.com/en/usdc',
      twitterName: 'circle',
      logoUrl: 'https://example.com/logo.png',
      isSpam: false,
      tokens: [
        { id: 'row-1', chain: 'ETHEREUM', address: USDC_ADDRESS },
        { id: 'row-2', chain: 'BASE', address: USDC_BASE_ADDRESS },
      ],
    },
    ...overrides,
  } as unknown as NonNullable<GraphQLApi.TokenProjectWebQuery['token']>
}

function buildMarketToken(
  overrides: Partial<Record<string, unknown>> = {},
): NonNullable<GraphQLApi.TokenWebQuery['token']> {
  return {
    ...buildMetadataToken(),
    market: { id: 'market-id', price: { id: 'price-id', value: 1.0001, currency: 'USD' } },
    project: {
      ...buildMetadataToken().project,
      markets: [{ id: 'pm-id', pricePercentChange24h: { id: 'pc-id', value: 0.42 } }],
    },
    ...overrides,
  } as unknown as NonNullable<GraphQLApi.TokenWebQuery['token']>
}

describe('adaptLegacyTokenToV2Token', () => {
  it('returns undefined without a metadata token', () => {
    expect(
      adaptLegacyTokenToV2Token({ metadataToken: undefined, marketToken: undefined, chainId: UniverseChainId.Mainnet }),
    ).toBeUndefined()
  })

  it('adapts metadata fields onto the V2 Token shape', () => {
    const token = adaptLegacyTokenToV2Token({
      metadataToken: buildMetadataToken(),
      marketToken: undefined,
      chainId: UniverseChainId.Mainnet,
    })

    expect(token).toMatchObject({
      chainId: UniverseChainId.Mainnet,
      address: USDC_ADDRESS,
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin',
      type: TokenType.ERC20,
      safety: { isSpam: false },
      project: {
        description: 'A stablecoin',
        homepageUrl: 'https://www.circle.com/en/usdc',
        twitterName: 'circle',
        logoUrl: 'https://example.com/logo.png',
      },
    })
    expect(token?.price).toBeUndefined()
  })

  it('overlays price from the market token once it resolves', () => {
    const token = adaptLegacyTokenToV2Token({
      metadataToken: buildMetadataToken(),
      marketToken: buildMarketToken(),
      chainId: UniverseChainId.Mainnet,
    })

    expect(token?.price).toEqual({ spotUsd: 1.0001, percentChange1d: 0.42 })
  })

  it('maps native tokens (null address) to the REST-indexed native address and NATIVE type', () => {
    const token = adaptLegacyTokenToV2Token({
      metadataToken: buildMetadataToken({ address: null, standard: 'NATIVE', name: 'Ethereum', symbol: 'ETH' }),
      marketToken: undefined,
      chainId: UniverseChainId.Mainnet,
    })

    expect(token).toMatchObject({ address: DEFAULT_NATIVE_ADDRESS, type: TokenType.NATIVE })
  })
})

describe('adaptLegacyTokenToV2MultichainToken', () => {
  it('returns undefined until the multichain token list resolves', () => {
    expect(adaptLegacyTokenToV2MultichainToken(undefined)).toBeUndefined()
    expect(adaptLegacyTokenToV2MultichainToken(buildMetadataToken({ project: undefined }))).toBeUndefined()
  })

  it('keys addresses by chainId string', () => {
    const multichainToken = adaptLegacyTokenToV2MultichainToken(buildMetadataToken())

    expect(multichainToken?.addresses).toEqual({
      [String(UniverseChainId.Mainnet)]: USDC_ADDRESS,
      [String(UniverseChainId.Base)]: USDC_BASE_ADDRESS,
    })
    expect(multichainToken?.multichainId).toBe('project-id')
  })

  it('drops rows on unknown chains and maps native rows to the REST-indexed native address', () => {
    const metadataToken = buildMetadataToken()
    const withRows = {
      ...metadataToken,
      project: {
        ...metadataToken.project,
        tokens: [
          { id: 'row-1', chain: 'ETHEREUM', address: null },
          { id: 'row-2', chain: 'NOT_A_CHAIN', address: USDC_ADDRESS },
        ],
      },
    } as unknown as NonNullable<GraphQLApi.TokenProjectWebQuery['token']>

    const multichainToken = adaptLegacyTokenToV2MultichainToken(withRows)

    expect(multichainToken?.addresses).toEqual({
      [String(UniverseChainId.Mainnet)]: DEFAULT_NATIVE_ADDRESS,
    })
  })
})
