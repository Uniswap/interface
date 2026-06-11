import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TDP_MULTICHAIN_CHAIN_QUERY_VALUE } from 'uniswap/src/utils/linking'
import { getChainIdFromChainUrlParam, getChainUrlParam, isChainUrlParam } from '~/utils/params/chainParams'

export const CHAIN_SEARCH_PARAM = 'chain'
export { TDP_MULTICHAIN_CHAIN_QUERY_VALUE }

export type TDPChainSearchParam =
  | { type: 'absent' }
  | { type: 'multichain' }
  | { type: 'chain'; chainId: UniverseChainId }
  | { type: 'invalid' }

export function getChainFilterFromSearchParams(searchParams: URLSearchParams): {
  chainUrlParam?: string
  chainId?: UniverseChainId
} {
  const chainNameParam = searchParams.get(CHAIN_SEARCH_PARAM)
  const chainUrlParam = chainNameParam && isChainUrlParam(chainNameParam) ? chainNameParam : undefined
  const chainId = chainUrlParam ? getChainIdFromChainUrlParam(chainUrlParam) : undefined
  return { chainUrlParam, chainId }
}

export function getTDPChainSearchParam(searchParams: URLSearchParams): TDPChainSearchParam {
  const chainNameParam = searchParams.get(CHAIN_SEARCH_PARAM)
  if (chainNameParam === null) {
    return { type: 'absent' }
  }
  if (chainNameParam === TDP_MULTICHAIN_CHAIN_QUERY_VALUE) {
    return { type: 'multichain' }
  }
  const chainId = isChainUrlParam(chainNameParam) ? getChainIdFromChainUrlParam(chainNameParam) : undefined
  return chainId === undefined ? { type: 'invalid' } : { type: 'chain', chainId }
}

/** Clone search params and set or remove the chain filter key. */
export function withChainSearchParam(
  searchParams: URLSearchParams,
  chainId: UniverseChainId | undefined,
): URLSearchParams {
  const next = new URLSearchParams(searchParams)
  if (chainId === undefined) {
    next.delete(CHAIN_SEARCH_PARAM)
  } else {
    next.set(CHAIN_SEARCH_PARAM, getChainUrlParam(chainId))
  }
  return next
}

export function withoutChainSearchParam(searchParams: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(searchParams)
  next.delete(CHAIN_SEARCH_PARAM)
  return next
}

export function withTDPMultichainSearchParam(searchParams: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(searchParams)
  next.set(CHAIN_SEARCH_PARAM, TDP_MULTICHAIN_CHAIN_QUERY_VALUE)
  return next
}
