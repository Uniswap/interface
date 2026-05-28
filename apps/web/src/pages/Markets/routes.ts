import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const MARKETS_BROWSE_PATH = '/lending'
const VAULTS_BROWSE_PATH = '/vaults'

function toSearchString(params: URLSearchParams): string {
  const value = params.toString()
  return value ? `?${value}` : ''
}

export function getMarketsBrowseURL(query?: string): string {
  const params = new URLSearchParams()

  const normalizedQuery = query?.trim()
  if (normalizedQuery) {
    params.set('q', normalizedQuery)
  }

  return `${MARKETS_BROWSE_PATH}${toSearchString(params)}`
}

export function getVaultsBrowseURL(query?: string): string {
  const params = new URLSearchParams()

  const normalizedQuery = query?.trim()
  if (normalizedQuery) {
    params.set('q', normalizedQuery)
  }

  return `${VAULTS_BROWSE_PATH}${toSearchString(params)}`
}

function getLendingChainUrlParam(chainId: UniverseChainId): string {
  return getChainInfo(chainId).urlParam
}

export function getLendingMarketDetailsURL(chainId: UniverseChainId, marketId: string): string {
  return `/lending/${getLendingChainUrlParam(chainId)}/${marketId}`
}

export function getLendingVaultDetailsURL(chainId: UniverseChainId, vaultId: string): string {
  return `/vaults/${getLendingChainUrlParam(chainId)}/${vaultId}`
}
