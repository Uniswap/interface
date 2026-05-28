import {
  type ChainToken as ExploreChainToken,
  type TokenRankingsStat,
} from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { parseProtectionInfo, parseSafetyLevel } from '@universe/api'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { CurrencyInfo, MultichainSearchResult, SafetyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { getCurrencySafetyInfo } from 'uniswap/src/features/dataApi/utils/getCurrencySafetyInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'

function exploreChainTokenToCurrencyInfo({
  chainToken,
  parent,
  safetyInfo,
}: {
  chainToken: ExploreChainToken
  parent: TokenRankingsStat
  safetyInfo: SafetyInfo
}): CurrencyInfo | null {
  const currency = buildCurrency({
    chainId: chainToken.chainId,
    address: chainToken.address === 'ETH' ? getNativeAddress(chainToken.chainId) : chainToken.address,
    decimals: chainToken.decimals,
    symbol: parent.symbol,
    name: parent.name,
    buyFeeBps: parent.feeData?.buyFeeBps,
    sellFeeBps: parent.feeData?.sellFeeBps,
  })

  if (!currency) {
    return null
  }

  return buildCurrencyInfo({
    currency,
    currencyId: currencyId(currency),
    logoUrl: parent.logo || undefined,
    safetyInfo,
  })
}

/**
 * Converts a TokenRankingsStat (from the explore service with multichain: true)
 * into a MultichainSearchResult for the search modal UI.
 * Returns undefined when no valid chain tokens can be constructed.
 */
export function tokenRankingsStatToSearchResult(stat: TokenRankingsStat): MultichainSearchResult | undefined {
  const safetyLevel = parseSafetyLevel(stat.safetyLevel)
  const protectionInfo = parseProtectionInfo(stat.protectionInfo)
  const safetyInfo = getCurrencySafetyInfo(safetyLevel, protectionInfo)

  const tokens = stat.chainTokens
    .map((ct) => exploreChainTokenToCurrencyInfo({ chainToken: ct, parent: stat, safetyInfo }))
    .filter((c): c is CurrencyInfo => c !== null)

  if (tokens.length === 0) {
    return undefined
  }

  return {
    id: `${stat.chain}_${stat.address}`,
    name: stat.name ?? '',
    symbol: stat.symbol ?? '',
    logoUrl: stat.logo || undefined,
    safetyInfo,
    tokens,
  }
}
