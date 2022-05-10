import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { atomWithImmer } from 'jotai/immer'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { useCallback } from 'react'

import useBlockNumber from './useBlockNumber'

// The oldest block (per chain) to be considered valid.
const oldestBlockMapAtom = atomWithImmer<{ [chainId: number]: number }>({})

const DEFAULT_MAX_BLOCK_AGE = 10

export function useSetOldestValidBlock(): (block: number) => void {
  const { chainId } = useActiveWeb3React()
  const updateValidBlock = useUpdateAtom(oldestBlockMapAtom)
  return useCallback(
    (block: number) => {
      if (!chainId) return
      updateValidBlock((oldestBlockMap) => {
        oldestBlockMap[chainId] = Math.max(block, oldestBlockMap[chainId] || 0)
      })
    },
    [chainId, updateValidBlock]
  )
}

export function useGetIsValidBlock(maxBlockAge = DEFAULT_MAX_BLOCK_AGE): (block: number) => boolean {
  const { chainId } = useActiveWeb3React()
  const currentBlock = useBlockNumber()
  const oldestBlockMap = useAtomValue(oldestBlockMapAtom)
  const oldestBlock = chainId ? oldestBlockMap[chainId] : 0
  return useCallback(
    (block: number) => {
      if (!currentBlock) return false
      if (currentBlock - block > maxBlockAge) return false
      if (currentBlock < oldestBlock) return false
      return true
    },
    [currentBlock, maxBlockAge, oldestBlock]
  )
}

export default function useIsValidBlock(block: number): boolean {
  return useGetIsValidBlock()(block)
}
