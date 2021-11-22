import { useMemo } from 'react'
import { useActiveWeb3React } from '.'
import { getChainPair } from '../utils/arbitrum'

export const useChains = () => {
  const { chainId } = useActiveWeb3React()
  return useMemo(() => getChainPair(chainId), [chainId])
}
