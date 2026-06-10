import {
  type IssuerToken as DataApiRWAToken,
  type Rwa as DataApiRWA,
} from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useMemo } from 'react'
import { useListRwasQuery } from 'uniswap/src/data/rest/listRwas'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { RWAAsset, RWAIssuer, RWAToken, RWAWhitelist } from 'uniswap/src/features/rwa/types'

type RWADataToken = Pick<DataApiRWAToken, 'address' | 'chainId' | 'issuer'>

type RWADataAsset = {
  symbol: DataApiRWA['symbol']
  logoUrl: DataApiRWA['logoUrl']
  issuerTokens: RWADataToken[]
}

const PREFERRED_RWA_CHAIN_ID = 1
const DEFAULT_RWA_WHITELIST: RWAWhitelist = []

function fromDataApiIssuer(issuer: DataApiRWAToken['issuer']): RWAIssuer {
  const normalizedIssuer = String(issuer).trim().toLowerCase()
  return normalizedIssuer || 'unknown'
}

function toRWAToken(token: RWADataToken): RWAToken | undefined {
  if (!token.chainId || !token.address) {
    return undefined
  }

  return {
    chainId: token.chainId,
    address: token.address,
    issuer: fromDataApiIssuer(token.issuer),
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

function toRWAAssetFromDataApi(rwa: RWADataAsset): RWAAsset | undefined {
  if (!rwa.symbol) {
    return undefined
  }

  const tokens = selectPreferredTokenPerIssuer(
    rwa.issuerTokens.map(toRWAToken).filter((token): token is RWAToken => token !== undefined),
  )
  if (!tokens.length) {
    return undefined
  }

  return {
    symbol: rwa.symbol,
    icon: rwa.logoUrl,
    tokens,
  }
}

export function useRWAWhitelist(enabled = true): RWAWhitelist {
  const { chains: chainIds } = useEnabledChains({ includeTestnets: true })
  const { data } = useListRwasQuery({
    chainIds,
    enabled,
  })

  return useMemo(() => {
    return (
      data?.rwas.map(toRWAAssetFromDataApi).filter((asset): asset is RWAAsset => asset !== undefined) ??
      DEFAULT_RWA_WHITELIST
    )
  }, [data?.rwas])
}
