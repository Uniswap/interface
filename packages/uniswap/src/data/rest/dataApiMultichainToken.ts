import { type DataApiChainToken, type DataApiMultichainToken } from '@universe/api'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { CurrencyInfo, MultichainSearchResult, SafetyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import {
  getRestCurrencySafetyInfo,
  getRestTokenSafetyInfo,
} from 'uniswap/src/features/dataApi/utils/getCurrencySafetyInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'

function deriveParentSafetyInfo(parent: DataApiMultichainToken): SafetyInfo {
  const { mappedSafetyLevel } = getRestTokenSafetyInfo({
    spamCode: parent.spamCode,
    safetyLevel: parent.safetyLevel,
  })
  return getRestCurrencySafetyInfo(mappedSafetyLevel, parent.protectionInfo)
}

/**
 * Converts a data API ChainToken into a CurrencyInfo using shared metadata
 * from the parent MultichainToken. Per-chain fields are limited to chainId,
 * address, decimals, and isBridged; safety/fee info comes from the parent.
 */
export function dataApiChainTokenToCurrencyInfo({
  chainToken,
  parent,
  safetyInfo,
}: {
  chainToken: DataApiChainToken
  parent: DataApiMultichainToken
  safetyInfo?: SafetyInfo
}): CurrencyInfo | null {
  const currency = buildCurrency({
    chainId: chainToken.chainId,
    address: chainToken.address === 'ETH' ? getNativeAddress(chainToken.chainId) : chainToken.address,
    decimals: chainToken.decimals,
    symbol: parent.symbol,
    name: parent.name,
    buyFeeBps: parent.feeData?.feeDetector?.buyFeeBps,
    sellFeeBps: parent.feeData?.feeDetector?.sellFeeBps,
  })

  if (!currency) {
    return null
  }

  return buildCurrencyInfo({
    currency,
    currencyId: currencyId(currency),
    logoUrl: parent.logoUrl || undefined,
    safetyInfo: safetyInfo ?? deriveParentSafetyInfo(parent),
  })
}

/**
 * Converts a data API MultichainToken (from ListTokens) into the shared
 * MultichainSearchResult type used by the search modal UI.
 * Returns undefined when no valid chain tokens can be constructed.
 */
export function dataApiMultichainTokenToSearchResult(
  multichainToken: DataApiMultichainToken,
): MultichainSearchResult | undefined {
  const safetyInfo = deriveParentSafetyInfo(multichainToken)

  const tokens = multichainToken.chainTokens
    .map((ct) => dataApiChainTokenToCurrencyInfo({ chainToken: ct, parent: multichainToken, safetyInfo }))
    .filter((c): c is CurrencyInfo => c !== null)

  if (tokens.length === 0) {
    return undefined
  }

  return {
    id: multichainToken.multichainId,
    name: multichainToken.name,
    symbol: multichainToken.symbol,
    logoUrl: multichainToken.logoUrl || undefined,
    safetyInfo,
    tokens,
  }
}
