import { ChainId } from '@swapr/sdk'
import useParsedQueryString from './useParsedQueryString'

export function useTargetedChainIdFromUrl(): ChainId | undefined {
  const { chainId: targetedChainId } = useParsedQueryString()
  if (typeof targetedChainId === 'string') {
    const parsedTargetedChainId = parseInt(targetedChainId)
    return Object.values(ChainId).indexOf(parsedTargetedChainId) >= 0 ? parsedTargetedChainId : undefined
  }
  return undefined
}
