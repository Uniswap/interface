import { useMemo } from 'react'
import { useListRwasQuery } from 'uniswap/src/data/rest/listRwas'
import {
  PREFERRED_RWA_CHAIN_ID,
  type ListRwasAssetSource,
  type ListRwasIssuerData,
  type ListRwasTokenSource,
} from 'uniswap/src/data/rest/rwa/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { RWAAsset, RWAIssuer, RWAToken, RWAWhitelist } from 'uniswap/src/features/rwa/types'
import { logger } from 'utilities/src/logger/logger'

const DEFAULT_RWA_WHITELIST: RWAWhitelist = []

function fromDataApiIssuer(issuer: string): RWAIssuer {
  const normalizedIssuer = String(issuer).trim().toLowerCase()
  return normalizedIssuer || 'unknown'
}

function toRWAToken({
  token,
  issuerData,
}: {
  token: ListRwasTokenSource
  issuerData: Record<string, ListRwasIssuerData>
}): RWAToken | undefined {
  if (!token.chainId || !token.address) {
    return undefined
  }

  // `issuerData` is keyed by the raw issuer string from the data-api response — the same value
  // carried on each issuer token — so look it up before normalizing the issuer for the domain model.
  const tokenData = issuerData[token.issuer]
  if (!tokenData) {
    // Should never happen: the data-api contract guarantees an `issuerData` entry for every issuer
    // present in `issuerTokens`. If one is missing we can't render the token, so report it and drop it.
    logger.error(new Error('RWA issuer token is missing its issuerData entry'), {
      tags: { file: 'useRWAWhitelist.ts', function: 'toRWAToken' },
      extra: { issuer: token.issuer, chainId: token.chainId, address: token.address },
    })
    return undefined
  }

  return {
    chainId: token.chainId,
    address: token.address,
    issuer: fromDataApiIssuer(token.issuer),
    name: tokenData.name,
    symbol: tokenData.symbol,
    logoUrl: tokenData.logoUrl,
  }
}

function selectPreferredTokenPerIssuer(tokens: RWAToken[]): RWAToken[] {
  const tokensByIssuer = new Map<RWAIssuer, RWAToken[]>()
  tokens.forEach((token) => {
    tokensByIssuer.set(token.issuer, [...(tokensByIssuer.get(token.issuer) ?? []), token])
  })

  // Backend can return the same issuer on multiple chains. Store one canonical token per issuer for matching:
  // prefer Ethereum mainnet, and fall back to the first chain the backend returned when mainnet is unavailable.
  return Array.from(tokensByIssuer.values()).flatMap((tokensForIssuer) => {
    return tokensForIssuer.find((token) => token.chainId === PREFERRED_RWA_CHAIN_ID) ?? tokensForIssuer[0] ?? []
  })
}

function toRWAAssetFromDataApi(rwa: ListRwasAssetSource): RWAAsset | undefined {
  if (!rwa.symbol) {
    return undefined
  }

  const tokens = selectPreferredTokenPerIssuer(
    rwa.issuerTokens
      .map((token) => toRWAToken({ token, issuerData: rwa.issuerData }))
      .filter((token): token is RWAToken => token !== undefined),
  )
  if (!tokens.length) {
    return undefined
  }

  return {
    symbol: rwa.symbol,
    name: rwa.name,
    icon: rwa.logoUrl,
    tokens,
  }
}

export function toRWAWhitelistFromDataApi(rwas: ListRwasAssetSource[]): RWAWhitelist {
  return rwas.map(toRWAAssetFromDataApi).filter((asset): asset is RWAAsset => asset !== undefined)
}

export function useRWAWhitelist(enabled = true): RWAWhitelist {
  const { chains: chainIds } = useEnabledChains({ includeTestnets: true })
  const { data } = useListRwasQuery({
    chainIds,
    enabled,
  })

  return useMemo(() => {
    return data?.rwas ? toRWAWhitelistFromDataApi(data.rwas) : DEFAULT_RWA_WHITELIST
  }, [data?.rwas])
}
