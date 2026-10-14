import type { PlainMessage } from '@bufbuild/protobuf'
import type {
  ChainDeployment as ChainDeploymentMessage,
  ChainTokenRankStats,
  MultichainToken as MultichainTokenMessage,
  RankedMultichainToken,
} from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { SpamCode } from '@universe/api'
import { chainIdToPlatform } from '@universe/chains'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import {
  CurrencyInfo,
  MultichainSearchResult,
  SafetyInfo,
  SearchMultichainParent,
  SearchTokenStats,
} from 'uniswap/src/features/dataApi/types'
import { buildCurrency, buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import {
  fractionToBpsString,
  getRestCurrencySafetyInfoV2,
  getRestTokenSafetyInfoV2,
} from 'uniswap/src/features/dataApi/utils/getCurrencySafetyInfo'
import { mapTokenIssuerInfo } from 'uniswap/src/features/rwa/issuers'
import type { CurrencyId } from 'uniswap/src/types/currency'
import { currencyId, isDefaultNativeAddress } from 'uniswap/src/utils/currencyId'

type ChainDeployment = PlainMessage<ChainDeploymentMessage>

/**
 * Field-level view so both protobuf class instances (RankedMultichainToken) and toPlainMessage
 * output (GetTokensMultiChain query data) are accepted. `deployments` is optional because rows
 * persisted by clients before data-api served it have no such key at all.
 */
export type DataApiMultichainToken = Omit<PlainMessage<MultichainTokenMessage>, 'deployments'> & {
  deployments?: Record<string, ChainDeployment>
}
type MultichainToken = DataApiMultichainToken

/**
 * Data-api endpoints serve native tokens under three formats: the literal 'ETH' string, the legacy
 * 0xeee… placeholder, and (since the v2 migration) the zero address. None of these is ever a real
 * deployed token, so all three normalize unconditionally to the chain's canonical native address —
 * including on chains like Polygon/Celo whose canonical native address is a real contract address,
 * where `isNativeCurrencyAddress` alone would reject the placeholders.
 */
export function normalizeBackendNativeAddress({ chainId, address }: { chainId: number; address: string }): string {
  if (address === 'ETH' || isDefaultNativeAddress({ address, platform: chainIdToPlatform(chainId) })) {
    return getNativeAddress(chainId)
  }
  return address
}

/** One chain deployment of a v2 MultichainToken. `address` is normalized for the app; `rawAddress` is as served. */
export type MultichainDeployment = { chainId: number; address: string; rawAddress: string; decimals: number }

/**
 * Decimals come from `deployments` only, never from the parent `decimals`: that value is the
 * canonical chain's and is wrong for tokens whose decimals differ by chain (USDT is 6 on Ethereum,
 * 18 on BNB). The deprecated `addresses` map is never read for decimals, so a row persisted before
 * data-api served `deployments` yields no deployments until refetched.
 */
function toMultichainDeployment(chainKey: string, deployment: ChainDeployment): MultichainDeployment {
  const chainId = Number(chainKey)
  return {
    chainId,
    address: normalizeBackendNativeAddress({ chainId, address: deployment.address }),
    rawAddress: deployment.address,
    decimals: deployment.decimals,
  }
}

/** The token's deployment on `chainId`, or undefined when it has none there. */
export function getMultichainDeployment({
  multichainToken,
  chainId,
}: {
  multichainToken: MultichainToken
  chainId: number
}): MultichainDeployment | undefined {
  const chainKey = String(chainId)
  const deployment = multichainToken.deployments?.[chainKey]
  return deployment && toMultichainDeployment(chainKey, deployment)
}

export function listMultichainDeployments(multichainToken: MultichainToken): MultichainDeployment[] {
  return Object.entries(multichainToken.deployments ?? {}).map(([chainKey, deployment]) =>
    toMultichainDeployment(chainKey, deployment),
  )
}

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

/** Converts one chain deployment of a v2 MultichainToken into a CurrencyInfo. */
function dataApiChainAddressToCurrencyInfo({
  deployment,
  parent,
  parentSafetyInfo,
}: {
  deployment: MultichainDeployment
  parent: MultichainToken
  parentSafetyInfo: ParentSafetyInfo
}): CurrencyInfo | null {
  const currency = buildCurrency({
    chainId: deployment.chainId,
    address: deployment.address,
    decimals: deployment.decimals,
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
    categoryIds: parent.categoryIds,
    ...(parent.issuer?.id && { issuer: mapTokenIssuerInfo(parent.issuer) }),
  })
}

/**
 * Expands a v2 MultichainToken into one CurrencyInfo per chain deployment — the v2 counterpart of
 * the GraphQL TokenProject → tokens fan-out. Deployments that can't be built (unsupported chain,
 * bad address) are dropped.
 */
export function dataApiMultichainTokenToCurrencyInfos(multichainToken: MultichainToken): CurrencyInfo[] {
  const parentSafetyInfo = deriveParentSafetyInfo(multichainToken.safety, multichainToken.fees)

  return listMultichainDeployments(multichainToken)
    .map((deployment) => dataApiChainAddressToCurrencyInfo({ deployment, parent: multichainToken, parentSafetyInfo }))
    .filter((c): c is CurrencyInfo => c !== null)
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
 * FDV falls back to the token-level field because Search v2 serves it only there (ListTokens serves both).
 * Returns undefined when none are present.
 */
function buildSearchTokenStats(
  rankedToken: RankedMultichainToken | PlainMessage<RankedMultichainToken>,
): SearchTokenStats | undefined {
  const price = rankedToken.multichainToken?.price
  const stats: SearchTokenStats = {
    priceUsd: price?.spotUsd,
    pricePercentChange1d: price?.percentChange1d,
    fdvUsd: rankedToken.stats?.fdv ?? rankedToken.multichainToken?.fdv,
    volume1dUsd: rankedToken.stats?.volume1d,
  }
  // Object.values drops `undefined` from optional props, so re-widen or the check looks always-true
  const hasAny = Object.values(stats).some((value: number | undefined) => value !== undefined)
  return hasAny ? stats : undefined
}

/**
 * Per-chain variant of the parent stats: price and FDV stay parent-level (per-chain prices are
 * effectively identical, and FDV is a token-level metric), but 1d volume is replaced with this chain's own when the response
 * carries per-chain stats — a chain-filtered row should show that chain's volume, not the
 * cross-chain aggregate.
 */
function buildChainSearchStats({
  parentStats,
  chainVolume1d,
}: {
  parentStats: SearchTokenStats | undefined
  chainVolume1d: number | undefined
}): SearchTokenStats | undefined {
  if (!parentStats && chainVolume1d === undefined) {
    return undefined
  }
  return { ...parentStats, volume1dUsd: chainVolume1d ?? parentStats?.volume1dUsd }
}

/**
 * Converts a v2 RankedMultichainToken (from ListTokens or Search) into the shared
 * MultichainSearchResult type used by the search modal UI. Returns undefined when no valid chain
 * tokens can be built. Pass `isSuppressed` for tokens from the v2 search suppressed bucket — the
 * flag is stamped on the result and the shared `searchMultichainParent` so chain-filtered paths keep it.
 * Accepts the plain shape too, so persisted ListTokens query data converts as-is.
 */
export function dataApiMultichainTokenToSearchResult(
  rankedToken: RankedMultichainToken | PlainMessage<RankedMultichainToken>,
  { isSuppressed = false }: { isSuppressed?: boolean } = {},
): MultichainSearchResult | undefined {
  const multichainToken = rankedToken.multichainToken
  if (!multichainToken) {
    return undefined
  }

  const parentSafetyInfo = deriveParentSafetyInfo(multichainToken.safety, multichainToken.fees)
  const tokens = dataApiMultichainTokenToCurrencyInfos(multichainToken)

  if (tokens.length === 0) {
    return undefined
  }

  const searchMultichainParent: SearchMultichainParent = {
    id: multichainToken.multichainId,
    tokenCurrencyIds: tokens.map((t) => t.currencyId) as CurrencyId[],
    isSuppressed,
  }

  const parentStats = buildSearchTokenStats(rankedToken)
  const chainVolume1dByChainId = new Map(
    rankedToken.chainStats.map((chainStat) => [chainStat.chainId, chainStat.stats?.volume1d]),
  )

  return {
    id: multichainToken.multichainId,
    name: multichainToken.name,
    symbol: multichainToken.symbol,
    logoUrl: multichainToken.project?.logoUrl || undefined,
    safetyInfo: parentSafetyInfo.safetyInfo,
    isSuppressed,
    ...(parentStats && { stats: parentStats }),
    tokens: tokens.map((t) => {
      const searchStats = buildChainSearchStats({
        parentStats,
        chainVolume1d: chainVolume1dByChainId.get(t.currency.chainId),
      })
      return {
        ...t,
        searchMultichainParent,
        ...(searchStats && { searchStats }),
      }
    }),
  }
}
