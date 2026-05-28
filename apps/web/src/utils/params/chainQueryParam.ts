import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainIdFromChainUrlParam, getChainUrlParam, isChainUrlParam } from '~/utils/params/chainParams'

export const CHAIN_SEARCH_PARAM = 'chain'

export function getChainFilterFromSearchParams(searchParams: URLSearchParams): {
  chainUrlParam?: string
  chainId?: UniverseChainId
} {
  const chainNameParam = searchParams.get(CHAIN_SEARCH_PARAM)
  const chainUrlParam = chainNameParam && isChainUrlParam(chainNameParam) ? chainNameParam : undefined
  const chainId = chainUrlParam ? getChainIdFromChainUrlParam(chainUrlParam) : undefined
  return { chainUrlParam, chainId }
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
