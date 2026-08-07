import type { ChainTokenRankStats, RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
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

type MultichainToken = NonNullable<RankedMultichainToken['multichainToken']>

type ParentSafetyInfo = {
  safetyInfo: SafetyInfo
  isSpam: boolean
  spamCode: SpamCode
}

function deriveParentSafetyInfo(safety: MultichainToken['safety'], fees: MultichainToken['fees']): ParentSafetyInfo {
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
  parent: MultichainToken
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
 * Picks the (chainId, address) deployment to display for a multichain token: `chainId` when set,
 * else the highest-1d-volume deployment, else the first `addresses` entry.
 */
export function pickPrimaryDeployment({
  addresses,
  chainId,
  chainStats = [],
}: {
  addresses: Record<string, string>
  chainId: number | undefined
  chainStats?: readonly ChainTokenRankStats[]
}): { chainId: number; address: string } | undefined {
  const entries = Object.entries(addresses)
  if (entries.length === 0) {
    return undefined
  }

  if (chainId !== undefined) {
    const match = entries.find(([chainIdStr]) => Number(chainIdStr) === chainId)
    return match ? { chainId: Number(match[0]), address: match[1] } : undefined
  }

  const byVolume = [...chainStats]
    .filter((chainStat) => addresses[String(chainStat.chainId)])
    .sort((a, b) => (b.stats?.volume1d ?? 0) - (a.stats?.volume1d ?? 0))[0]
  const byVolumeAddress = byVolume && addresses[String(byVolume.chainId)]
  if (byVolume && byVolumeAddress) {
    return { chainId: byVolume.chainId, address: byVolumeAddress }
  }

  const [chainIdStr, address] = entries[0] ?? []
  return chainIdStr && address ? { chainId: Number(chainIdStr), address } : undefined
}

/**
 * Converts a v2 RankedMultichainToken (from ListTokens) into the shared MultichainSearchResult
 * type used by the search modal UI. Returns undefined when no valid chain tokens can be built.
 */
export function dataApiMultichainTokenToSearchResult(
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
