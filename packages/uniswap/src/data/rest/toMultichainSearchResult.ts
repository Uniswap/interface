import { MultichainToken } from '@uniswap/client-data-api/dist/data/v1/searchTypes_pb'
import { parseProtectionInfo, parseSafetyLevel } from '@universe/api'
import { chainTokenToCurrencyInfo } from 'uniswap/src/data/rest/searchTokensAndPools'
import {
  type CurrencyInfo,
  type MultichainSearchResult,
  type SearchMultichainParent,
} from 'uniswap/src/features/dataApi/types'
import { getCurrencySafetyInfo } from 'uniswap/src/features/dataApi/utils/getCurrencySafetyInfo'
import type { CurrencyId } from 'uniswap/src/types/currency'

/**
 * Converts an API MultichainToken (with chainTokens[]) to an app-layer MultichainSearchResult.
 * Each ChainToken becomes a CurrencyInfo via the shared chainTokenToCurrencyInfo helper.
 * Returns undefined when no valid chain tokens can be constructed.
 */
export function toMultichainSearchResult(multichainToken: MultichainToken): MultichainSearchResult | undefined {
  const tokens: CurrencyInfo[] = []

  for (const chainToken of multichainToken.chainTokens) {
    const currencyInfo = chainTokenToCurrencyInfo(chainToken, multichainToken)
    if (currencyInfo) {
      tokens.push(currencyInfo)
    }
  }

  if (tokens.length === 0) {
    return undefined
  }

  const parentSafetyLevel = parseSafetyLevel(multichainToken.safetyLevel)
  const parentProtectionInfo = parseProtectionInfo(multichainToken.protectionInfo)

  const searchMultichainParent: SearchMultichainParent = {
    id: multichainToken.multichainId,
    tokenCurrencyIds: tokens.map((t) => t.currencyId) as CurrencyId[],
  }

  return {
    id: multichainToken.multichainId,
    name: multichainToken.name,
    symbol: multichainToken.symbol,
    logoUrl: multichainToken.logoUrl || undefined,
    safetyInfo: getCurrencySafetyInfo(parentSafetyLevel, parentProtectionInfo),
    tokens: tokens.map((t) => ({ ...t, searchMultichainParent })),
  }
}
