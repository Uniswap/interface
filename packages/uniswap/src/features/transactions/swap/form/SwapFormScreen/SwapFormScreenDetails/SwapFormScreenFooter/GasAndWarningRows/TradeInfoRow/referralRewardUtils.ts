import type { Currency } from '@uniswap/sdk-core'
import { getWrappedNativeAddress } from 'uniswap/src/constants/addresses'

export const REFERRAL_WHITELIST_POOL_API_URL =
  process.env.REACT_APP_REFERRAL_WHITELIST_POOL_API_URL ??
  process.env.REFERRAL_WHITELIST_POOL_API_URL ??
  'https://ringlabs-admin-platform-production.up.railway.app/api/client/activity/whitelist-pools'

type RoutePool = {
  address?: string | null
  protocolVersion?: string | null
  feeTier?: number | string | null
  tokenIn?: {
    chainId?: number | string | null
  } | null
  tokenOut?: {
    chainId?: number | string | null
  } | null
}

export type TradeQuote =
  | {
      route?: RoutePool[][] | RoutePool[]
      quote?: {
        route?: RoutePool[][] | RoutePool[]
      }
    }
  | undefined

export type RoutePoolIdentifier = {
  address: string
  chainId?: number
  protocolVersion?: string
  feeTier?: number
}

type WhitelistPool = {
  poolKey?: string | null
  chainId?: number | string | null
  protocolVersion?: string | null
  feeTier?: number | string | null
  tokenInAddress?: string | null
  tokenOutAddress?: string | null
  token0Address?: string | null
  token1Address?: string | null
  tokenAAddress?: string | null
  tokenBAddress?: string | null
  tokenIn?: {
    address?: string | null
  } | null
  tokenOut?: {
    address?: string | null
  } | null
  token0?: {
    address?: string | null
  } | null
  token1?: {
    address?: string | null
  } | null
}

export type WhitelistPoolIdentifier = {
  address: string
  chainId?: number
  protocolVersion?: string
  feeTier?: number
}

export type WhitelistPairIdentifier = {
  chainId?: number
  tokenA: string
  tokenB: string
}

export type ReferralWhitelistResponse = {
  pools: WhitelistPoolIdentifier[]
  pairs: WhitelistPairIdentifier[]
  tradeReferralCoefficient?: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeAddress(address: string): string {
  return address.toLowerCase()
}

function normalizeOptionalAddress(address: unknown): string | undefined {
  if (typeof address !== 'string') {
    return undefined
  }

  const trimmedAddress = address.trim()
  return trimmedAddress ? normalizeAddress(trimmedAddress) : undefined
}

function normalizeProtocolVersion(protocolVersion: string | null | undefined): string | undefined {
  if (!protocolVersion) {
    return undefined
  }

  return protocolVersion.trim().toUpperCase()
}

function normalizeFeeTier(feeTier: number | string | null | undefined): number | undefined {
  if (typeof feeTier === 'number' && Number.isFinite(feeTier)) {
    return feeTier
  }

  if (typeof feeTier === 'string') {
    const parsedFeeTier = Number(feeTier)
    return Number.isFinite(parsedFeeTier) ? parsedFeeTier : undefined
  }

  return undefined
}

function normalizeNumberish(value: unknown): number | undefined {
  return typeof value === 'number' || typeof value === 'string' ? normalizeFeeTier(value) : undefined
}

function normalizeChainId(chainId: number | string | null | undefined): number | undefined {
  if (typeof chainId === 'number' && Number.isFinite(chainId)) {
    return chainId
  }

  if (typeof chainId === 'string') {
    const parsedChainId = Number(chainId)
    return Number.isFinite(parsedChainId) ? parsedChainId : undefined
  }

  return undefined
}

function extractAddress(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return normalizeOptionalAddress(value)
  }

  if (isRecord(value)) {
    return normalizeOptionalAddress(value.address)
  }

  return undefined
}

function extractWhitelistPair(item: WhitelistPool): WhitelistPairIdentifier | undefined {
  const directPairCandidates: Array<[unknown, unknown]> = [
    [item.tokenInAddress, item.tokenOutAddress],
    [item.token0Address, item.token1Address],
    [item.tokenAAddress, item.tokenBAddress],
    [item.tokenIn, item.tokenOut],
    [item.token0, item.token1],
  ]

  for (const [tokenA, tokenB] of directPairCandidates) {
    const parsedTokenA = extractAddress(tokenA)
    const parsedTokenB = extractAddress(tokenB)
    if (parsedTokenA && parsedTokenB) {
      return {
        tokenA: parsedTokenA,
        tokenB: parsedTokenB,
        chainId: normalizeChainId(item.chainId),
      }
    }
  }

  if (isRecord(item)) {
    const rawItem = item as unknown as Record<string, unknown>
    const nestedPairCandidates: Array<[unknown, unknown]> = [
      [rawItem.inputTokenAddress, rawItem.outputTokenAddress],
      [rawItem.inputToken, rawItem.outputToken],
      [rawItem.baseTokenAddress, rawItem.quoteTokenAddress],
      [rawItem.baseToken, rawItem.quoteToken],
    ]

    for (const [tokenA, tokenB] of nestedPairCandidates) {
      const parsedTokenA = extractAddress(tokenA)
      const parsedTokenB = extractAddress(tokenB)
      if (parsedTokenA && parsedTokenB) {
        return {
          tokenA: parsedTokenA,
          tokenB: parsedTokenB,
          chainId: normalizeChainId(item.chainId),
        }
      }
    }
  }

  return undefined
}

export function getPoolsFromQuote(quote: TradeQuote): RoutePoolIdentifier[] {
  const route = quote?.route ?? quote?.quote?.route

  if (!route) {
    return []
  }

  const uniquePools = new Map<string, RoutePoolIdentifier>()

  route.forEach((poolRow) => {
    const pools = Array.isArray(poolRow) ? poolRow : [poolRow]
    pools.forEach((pool) => {
      if (pool.address) {
        const address = normalizeAddress(pool.address)
        const chainId = normalizeChainId(pool.tokenIn?.chainId ?? pool.tokenOut?.chainId)
        const protocolVersion = normalizeProtocolVersion(pool.protocolVersion)
        const feeTier = normalizeFeeTier(pool.feeTier)
        const key = `${chainId ?? 'unknown'}:${address}`
        uniquePools.set(key, {
          address,
          chainId,
          protocolVersion,
          feeTier: Number.isFinite(feeTier) ? feeTier : undefined,
        })
      }
    })
  })

  return [...uniquePools.values()]
}

function extractWhitelistResponse(payload: unknown): ReferralWhitelistResponse {
  const list = Array.isArray(payload)
    ? payload
    : isRecord(payload)
      ? payload.data ?? payload.pools ?? payload.poolList
      : undefined

  const pools = Array.isArray(list)
    ? list.flatMap((item): WhitelistPoolIdentifier[] => {
        if (!isRecord(item)) {
          return []
        }

        const whitelistPool = item as WhitelistPool
        const poolKey = whitelistPool.poolKey
        if (typeof poolKey !== 'string') {
          return []
        }

        return [
          {
            address: normalizeAddress(poolKey),
            chainId: normalizeChainId(whitelistPool.chainId),
            protocolVersion: normalizeProtocolVersion(whitelistPool.protocolVersion),
            feeTier: normalizeFeeTier(whitelistPool.feeTier),
          },
        ]
      })
    : []

  const pairs = Array.isArray(list)
    ? list.flatMap((item): WhitelistPairIdentifier[] => {
        if (!isRecord(item)) {
          return []
        }

        const pair = extractWhitelistPair(item as WhitelistPool)
        return pair ? [pair] : []
      })
    : []

  const currentActivity = isRecord(payload) && isRecord(payload.currentActivity) ? payload.currentActivity : undefined

  return {
    pools,
    pairs,
    tradeReferralCoefficient: currentActivity ? normalizeNumberish(currentActivity.swapRewardBps) : undefined,
  }
}

export async function fetchReferralWhitelistData(): Promise<ReferralWhitelistResponse> {
  const response = await fetch(REFERRAL_WHITELIST_POOL_API_URL)

  if (!response.ok) {
    throw new Error(`Failed to fetch referral whitelist pools: ${response.status}`)
  }

  return extractWhitelistResponse(await response.json())
}

export function formatPoints(points: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: points >= 100 ? 0 : 2 }).format(points)
}

export function getPoolFeeRate(pool: RoutePoolIdentifier | undefined): number | undefined {
  if (!pool?.feeTier) {
    return undefined
  }

  if (pool.protocolVersion === 'V2' || pool.protocolVersion === 'FEW-V2' || pool.protocolVersion === 'FEWV2') {
    return pool.feeTier / 10_000
  }

  return pool.feeTier / 1_000_000
}

function getPoolKey(pool: Pick<RoutePoolIdentifier, 'address' | 'chainId'>): string {
  return `${pool.chainId ?? 'unknown'}:${pool.address}`
}

export function getComparableCurrencyAddress(currency: Currency | undefined): string | undefined {
  if (!currency) {
    return undefined
  }

  if (currency.isNative) {
    return normalizeAddress(getWrappedNativeAddress(currency.chainId))
  }

  return normalizeAddress(currency.address)
}

export function isWhitelistedTradePair({
  chainId,
  inputAddress,
  outputAddress,
  whitelistPairs,
}: {
  chainId?: number
  inputAddress?: string
  outputAddress?: string
  whitelistPairs: WhitelistPairIdentifier[]
}): boolean {
  if (!inputAddress || !outputAddress || whitelistPairs.length === 0) {
    return false
  }

  return whitelistPairs.some((pair) => {
    if (typeof pair.chainId === 'number' && typeof chainId === 'number' && pair.chainId !== chainId) {
      return false
    }

    return (
      (pair.tokenA === inputAddress && pair.tokenB === outputAddress) ||
      (pair.tokenA === outputAddress && pair.tokenB === inputAddress)
    )
  })
}

export function getReferralContext(
  pools: RoutePoolIdentifier[],
  whitelistPools: WhitelistPoolIdentifier[],
): {
  matchedPool?: RoutePoolIdentifier
  matchedWhitelistPool?: WhitelistPoolIdentifier
  canEarnReferralReward: boolean
} {
  const whitelistPoolMap = new Map<string, WhitelistPoolIdentifier[]>()

  whitelistPools.forEach((whitelistPool) => {
    const poolKey = getPoolKey(whitelistPool)
    const existingPools = whitelistPoolMap.get(poolKey) ?? []
    existingPools.push(whitelistPool)
    whitelistPoolMap.set(poolKey, existingPools)
  })

  const matchedPool = pools.find((pool) => whitelistPoolMap.has(getPoolKey(pool)))

  if (!matchedPool) {
    return { canEarnReferralReward: false }
  }

  const matchedWhitelistPool = whitelistPoolMap.get(getPoolKey(matchedPool))?.[0]

  return {
    matchedPool,
    matchedWhitelistPool,
    canEarnReferralReward: true,
  }
}
