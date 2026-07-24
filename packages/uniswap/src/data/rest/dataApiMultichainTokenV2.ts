import type { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { SpamCode } from '@universe/api'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import {
  CurrencyInfo,
  MultichainSearchResult,
  SafetyInfo,
  SearchMultichainParent,
} from 'uniswap/src/features/dataApi/types'
import { buildCurrency, buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import {
  fractionToBpsString,
  getRestCurrencySafetyInfoV2,
  getRestTokenSafetyInfoV2,
} from 'uniswap/src/features/dataApi/utils/getCurrencySafetyInfo'
import type { CurrencyId } from 'uniswap/src/types/currency'
import { currencyId } from 'uniswap/src/utils/currencyId'

type MultichainTokenV2 = NonNullable<RankedMultichainToken['multichainToken']>

type ParentSafetyInfo = {
  safetyInfo: SafetyInfo
  isSpam: boolean
  spamCode: SpamCode
}

function deriveParentSafetyInfo(
  safety: MultichainTokenV2['safety'],
  fees: MultichainTokenV2['fees'],
): ParentSafetyInfo {
  const { isSpam } = getRestTokenSafetyInfoV2(safety)
  return {
    safetyInfo: getRestCurrencySafetyInfoV2(safety, fees),
    isSpam,
    spamCode: isSpam ? SpamCode.HIGH : SpamCode.LOW,
  }
}

/**
 * Converts one chain deployment (from a v2 MultichainToken's `addresses` map) into a
 * CurrencyInfo. Unlike v1's `chainTokens: ChainToken[]`, v2 has no per-chain decimals/isBridged
 * — every deployment shares the parent's single top-level `decimals`.
 */
function dataApiChainAddressToCurrencyInfo({
  chainId,
  address,
  parent,
  parentSafetyInfo,
}: {
  chainId: number
  address: string
  parent: MultichainTokenV2
  parentSafetyInfo: ParentSafetyInfo
}): CurrencyInfo | null {
  const currency = buildCurrency({
    chainId,
    address: address === 'ETH' ? getNativeAddress(chainId) : address,
    decimals: parent.decimals,
    symbol: parent.symbol,
    name: parent.name,
    buyFeeBps: fractionToBpsString(parent.fees?.buyFee),
    sellFeeBps: fractionToBpsString(parent.fees?.sellFee),
  })

  if (!currency) {
    return null
  }

  return buildCurrencyInfo({
    currency,
    currencyId: currencyId(currency),
    logoUrl: parent.project?.logoUrl || undefined,
    safetyInfo: parentSafetyInfo.safetyInfo,
    isSpam: parentSafetyInfo.isSpam,
    spamCode: parentSafetyInfo.spamCode,
  })
}

/**
 * Converts a v2 RankedMultichainToken (from ListTokens) into the shared MultichainSearchResult
 * type used by the search modal UI. Returns undefined when no valid chain tokens can be built.
 */
export function dataApiMultichainTokenV2ToSearchResult(
  rankedToken: RankedMultichainToken,
): MultichainSearchResult | undefined {
  const multichainToken = rankedToken.multichainToken
  if (!multichainToken) {
    return undefined
  }

  const parentSafetyInfo = deriveParentSafetyInfo(multichainToken.safety, multichainToken.fees)

  const tokens = Object.entries(multichainToken.addresses)
    .map(([chainIdKey, address]) =>
      dataApiChainAddressToCurrencyInfo({
        chainId: Number(chainIdKey),
        address,
        parent: multichainToken,
        parentSafetyInfo,
      }),
    )
    .filter((c): c is CurrencyInfo => c !== null)

  if (tokens.length === 0) {
    return undefined
  }

  const searchMultichainParent: SearchMultichainParent = {
    id: multichainToken.multichainId,
    tokenCurrencyIds: tokens.map((t) => t.currencyId) as CurrencyId[],
  }

  return {
    id: multichainToken.multichainId,
    name: multichainToken.name,
    symbol: multichainToken.symbol,
    logoUrl: multichainToken.project?.logoUrl || undefined,
    safetyInfo: parentSafetyInfo.safetyInfo,
    tokens: tokens.map((t) => ({ ...t, searchMultichainParent })),
  }
}
