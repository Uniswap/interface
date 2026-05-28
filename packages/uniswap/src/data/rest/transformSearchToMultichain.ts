import { SearchTokensResponse } from '@uniswap/client-data-api/dist/data/v1/search_pb'
import {
  MultichainToken,
  ChainToken,
  type Token as SearchToken,
} from '@uniswap/client-data-api/dist/data/v1/searchTypes_pb'

/**
 * Transforms a SearchTokens response that uses the legacy flat `tokens[]`
 * shape into the new `multichainTokens[]` shape.
 *
 * Each legacy Token lives on a single chain, so it becomes one MultichainToken
 * with exactly one ChainToken. Shared metadata (name, symbol, logoUrl, etc.)
 * hoists to the MultichainToken level; chain-specific data (chainId, address,
 * decimals, per-chain safety/fee info) goes into the single ChainToken.
 */
export function transformSearchToMultichain(response: SearchTokensResponse): SearchTokensResponse
export function transformSearchToMultichain(
  response: SearchTokensResponse | undefined,
): SearchTokensResponse | undefined
export function transformSearchToMultichain(
  response: SearchTokensResponse | undefined,
): SearchTokensResponse | undefined {
  if (!response || !shouldTransformSearchToMultichain(response)) {
    return response
  }

  const multichainTokens = response.tokens.map(tokenToMultichainToken)

  return new SearchTokensResponse({
    tokens: [],
    pools: response.pools,
    multichainTokens,
  })
}

function tokenToMultichainToken(token: SearchToken): MultichainToken {
  const chainToken = new ChainToken({
    chainId: token.chainId,
    address: token.address,
    decimals: token.decimals,
    safetyLevel: token.safetyLevel,
    spamCode: token.spamCode,
    isSpam: token.isSpam,
    feeData: token.feeData,
    protectionInfo: token.protectionInfo,
  })

  return new MultichainToken({
    multichainId: token.tokenId,
    symbol: token.symbol,
    name: token.name,
    standard: token.standard,
    projectName: token.projectName,
    logoUrl: token.logoUrl,
    safetyLevel: token.safetyLevel,
    spamCode: token.spamCode,
    isSpam: token.isSpam,
    feeData: token.feeData,
    protectionInfo: token.protectionInfo,
    chainTokens: [chainToken],
  })
}

/**
 * Returns true when the search response uses the legacy tokens shape and
 * should be transformed to multichainTokens.
 */
export function shouldTransformSearchToMultichain(response: SearchTokensResponse | undefined): boolean {
  if (!response) {
    return false
  }
  return response.tokens.length > 0 && response.multichainTokens.length === 0
}
