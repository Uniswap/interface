import useActiveWeb3React from 'hooks/useActiveWeb3React'
import useIsWindowVisible from 'hooks/useIsWindowVisible'
import { atom } from 'jotai'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { useCallback, useEffect } from 'react'

interface ChainBlock {
  chainId?: number
  block?: number
}
const chainBlockAtom = atom<ChainBlock>({})

function useUpdateChainBlock() {
  const { chainId, library } = useActiveWeb3React()
  const windowVisible = useIsWindowVisible()
  const setChainBlock = useUpdateAtom(chainBlockAtom)

  const onBlock = useCallback(
    (block: number) => {
      setChainBlock((chainBlock) => {
        if (chainBlock.chainId === chainId) {
          if (chainBlock.block === block) return chainBlock
          if (typeof chainBlock.block !== 'number') return { chainId, block }
          return { chainId, block: Math.max(block, chainBlock.block) }
        }
        return chainBlock
      })
    },
    [chainId, setChainBlock]
  )

  useEffect(() => {
    if (library && chainId && windowVisible) {
      // If chainId hasn't changed, don't clear the block. This prevents re-fetching still valid data.
      setChainBlock((chainBlock) => (chainBlock.chainId === chainId ? chainBlock : { chainId }))

      library
        .getBlockNumber()
        .then(onBlock)
        .catch((error) => {
          console.error(`Failed to get block number for chainId ${chainId}`, error)
        })

      library.on('block', onBlock)
      return () => {
        library.removeListener('block', onBlock)
      }
    }
    return undefined
  }, [chainId, library, onBlock, setChainBlock, windowVisible])
}

export function BlockUpdater() {
  useUpdateChainBlock()
  return null
}

/** Requires that BlockUpdater be installed in the DOM tree. */
export default function useBlockNumber(): number | undefined {
  const { chainId: activeChainId } = useActiveWeb3React()
  const { chainId, block } = useAtomValue(chainBlockAtom)
  return activeChainId === chainId ? block : undefined
}

export function useFastForwardBlockNumber(): (block: number) => void {
  const { chainId } = useActiveWeb3React()
  const setChainBlock = useUpdateAtom(chainBlockAtom)
  return useCallback((block: number) => setChainBlock({ chainId, block }), [chainId, setChainBlock])
}
