import type { PlainMessage } from '@bufbuild/protobuf'
import { TokenType } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import type { MultichainToken, Token } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { GraphQLApi } from '@universe/api'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { nativeAddressForRest } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'

/**
 * Legacy GraphQL → V2 data-api shape adapters for the TDP store.
 *
 * V2 is the canonical shape (see restV2TokenToCurrencyInfo): when FeatureFlags.V2EndpointsTokens
 * is off, the GraphQL responses are adapted onto `PlainMessage<Token>` / `PlainMessage<MultichainToken>`
 * so consumers only ever read V2 access patterns. Deleting GraphQL later deletes this file and
 * nothing else moves.
 */

type LegacyMetadataToken = NonNullable<GraphQLApi.TokenProjectWebQuery['token']>
type LegacyMarketToken = NonNullable<GraphQLApi.TokenWebQuery['token']>

function toTokenType(token: LegacyMetadataToken): TokenType {
  switch (token.standard) {
    case GraphQLApi.TokenStandard.Erc20:
      return TokenType.ERC20
    case GraphQLApi.TokenStandard.Native:
      return TokenType.NATIVE
    default:
      // GraphQL leaves `standard` null for some native assets
      return token.address ? TokenType.UNKNOWN : TokenType.NATIVE
  }
}

/**
 * Adapts legacy GraphQL token data onto the V2 `Token` shape (what GetToken returns).
 * Metadata comes from the fast TokenProjectWeb query; price is overlaid from the heavier
 * TokenWeb market query once it resolves, mirroring how the two GraphQL queries race today.
 */
export function adaptLegacyTokenToV2Token({
  metadataToken,
  marketToken,
  chainId,
}: {
  metadataToken: GraphQLApi.TokenProjectWebQuery['token'] | undefined
  marketToken: GraphQLApi.TokenWebQuery['token'] | undefined
  chainId: UniverseChainId
}): PlainMessage<Token> | undefined {
  if (!metadataToken) {
    return undefined
  }

  const tokenChainId = fromGraphQLChain(metadataToken.chain) ?? chainId
  const spotUsd = marketToken?.market?.price?.value ?? undefined
  const percentChange1d = marketToken?.project?.markets?.[0]?.pricePercentChange24h?.value ?? undefined

  return {
    chainId: tokenChainId,
    address: metadataToken.address ?? nativeAddressForRest(tokenChainId),
    symbol: metadataToken.symbol ?? '',
    decimals: metadataToken.decimals ?? 0,
    name: metadataToken.name ?? '',
    type: toTokenType(metadataToken),
    price: spotUsd !== undefined || percentChange1d !== undefined ? { spotUsd, percentChange1d } : undefined,
    safety: {
      isSpam: metadataToken.project?.isSpam ?? false,
      // no legacy equivalents; GetToken-only signals
      isVerified: false,
      isBlocked: false,
      features: [],
    },
    fees: undefined,
    project: {
      description: metadataToken.project?.description ?? undefined,
      homepageUrl: metadataToken.project?.homepageUrl ?? undefined,
      twitterName: metadataToken.project?.twitterName ?? undefined,
      logoUrl: metadataToken.project?.logoUrl ?? undefined,
      descriptionTranslations: {},
    },
    multichain: undefined,
  }
}

/**
 * Adapts a legacy GraphQL token's cross-chain deployments (the `project.tokens` field) onto the
 * V2 `MultichainToken` shape (what GetTokenMultiChain returns). Native deployments (null GraphQL
 * address) map to the REST-indexed native address so the V2 invariant — `addresses` values are
 * real indexed addresses — holds; rows on unsupported chains are dropped.
 */
export function adaptLegacyTokenToV2MultichainToken(
  metadataToken: GraphQLApi.TokenProjectWebQuery['token'] | undefined,
): PlainMessage<MultichainToken> | undefined {
  const multichainTokenList = metadataToken?.project?.tokens
  if (!metadataToken || !multichainTokenList) {
    return undefined
  }

  const addresses: Record<string, string> = {}
  for (const row of multichainTokenList) {
    const rowChainId = fromGraphQLChain(row.chain)
    if (!rowChainId) {
      continue
    }
    addresses[String(rowChainId)] = row.address ?? nativeAddressForRest(rowChainId)
  }

  return {
    // GraphQL's opaque project id, not a V2 multichain UUID — only usable as a stable grouping key
    multichainId: metadataToken.project?.id ?? '',
    addresses,
    symbol: metadataToken.symbol ?? '',
    decimals: metadataToken.decimals ?? 0,
    name: metadataToken.name ?? '',
    type: toTokenType(metadataToken),
    price: undefined,
    safety: undefined,
    fees: undefined,
    project: undefined,
  }
}

export type { LegacyMarketToken, LegacyMetadataToken }
