import { useMemo } from 'react'
import { useListRwasQuery } from 'uniswap/src/data/rest/listRwas'
import { getRwaTagCategory } from 'uniswap/src/data/rest/rwa/getRwaTagCategory'
import { resolveRwaIssuerDisplay } from 'uniswap/src/data/rest/rwa/resolveRwaIssuerDisplay'
import {
  PREFERRED_RWA_CHAIN_ID,
  type ListRwasAssetSource,
  type ListRwasTokenSource,
} from 'uniswap/src/data/rest/rwa/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { RWAAsset, RWAIssuer, RWAToken, RWAWhitelist } from 'uniswap/src/features/rwa/types'

const DEFAULT_RWA_WHITELIST: RWAWhitelist = []

function fromDataApiIssuer(issuer: string): RWAIssuer {
  const normalizedIssuer = String(issuer).trim().toLowerCase()
  return normalizedIssuer || 'unknown'
}

function toRWAToken({
  asset,
  token,
}: {
  asset: Pick<ListRwasAssetSource, 'symbol' | 'name' | 'logoUrl' | 'issuerData'>
  token: ListRwasTokenSource
}): RWAToken | undefined {
  if (!token.chainId || !token.address) {
    return undefined
  }

  const tokenData = resolveRwaIssuerDisplay({ asset, token })
  if (!tokenData) {
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
    const preferredToken =
      tokensForIssuer.find((issuerToken) => issuerToken.chainId === PREFERRED_RWA_CHAIN_ID) ?? tokensForIssuer[0]
    if (!preferredToken) {
      return []
    }

    return tokensForIssuer.length > 1 ? { ...preferredToken, networkCount: tokensForIssuer.length } : preferredToken
  })
}

function toRWAAssetFromDataApi(rwa: ListRwasAssetSource): RWAAsset | undefined {
  if (!rwa.symbol) {
    return undefined
  }

  const tokens = selectPreferredTokenPerIssuer(
    rwa.issuerTokens
      .map((token) => toRWAToken({ asset: rwa, token }))
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
    category: getRwaTagCategory({ categories: rwa.categories }),
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
