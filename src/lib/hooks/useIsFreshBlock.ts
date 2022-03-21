import { atomWithImmer } from 'jotai/immer'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { useCallback } from 'react'

import useActiveWeb3React from './useActiveWeb3React'
import useBlockNumber from './useBlockNumber'

// The minimum block (per chain) to be considered fresh.
const minimumBlockMapAtom = atomWithImmer<{ [chainId: number]: number }>({})

const DEFAULT_MAX_BLOCK_AGE = 10

export function useSetMinimumFreshBlock(): (block: number) => void {
  const { chainId } = useActiveWeb3React()
  const updateFreshBlock = useUpdateAtom(minimumBlockMapAtom)
  return useCallback(
    (block: number) => {
      if (!chainId) return
      updateFreshBlock((minimumBlockMap) => {
        minimumBlockMap[chainId] = Math.max(block, minimumBlockMap[chainId] || 0)
      })
    },
    [chainId, updateFreshBlock]
  )
}

export function useGetIsFreshBlock(maxBlockAge = DEFAULT_MAX_BLOCK_AGE): (block: number) => boolean {
  const { chainId } = useActiveWeb3React()
  const currentBlock = useBlockNumber()
  const minimumBlockMap = useAtomValue(minimumBlockMapAtom)
  const minimumBlock = chainId ? minimumBlockMap[chainId] : 0
  return useCallback(
    (block: number) => {
      if (!currentBlock) return false
      if (currentBlock - block > maxBlockAge) return false
      if (currentBlock < minimumBlock) return false
      return true
    },
    [currentBlock, maxBlockAge, minimumBlock]
  )
}

export default function useIsFreshBlock(block: number): boolean {
  return useGetIsFreshBlock()(block)
}
