import useActiveWeb3React from 'hooks/useActiveWeb3React'
import useIsWindowVisible from 'hooks/useIsWindowVisible'
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'

interface ChainBlock {
  chainId?: number
  block?: number
}

const ChainBlockContext = createContext<{
  blockNumber?: number
  fastForward(block: number): void
}>({ fastForward: () => void 0 })

export function BlockNumberProvider({ children }: { children: ReactNode }) {
  const [{ chainId, block }, setChainBlock] = useState<ChainBlock>({})
  const { chainId: activeChainId, library } = useActiveWeb3React()

  const onBlock = useCallback(
    (block: number) => {
      setChainBlock((chainBlock) => {
        if (chainBlock.chainId === activeChainId) {
          if (!chainBlock.block || chainBlock.block < block) {
            return { chainId: activeChainId, block }
          }
        }
        return chainBlock
      })
    },
    [activeChainId, setChainBlock]
  )

  const windowVisible = useIsWindowVisible()
  useEffect(() => {
    if (library && activeChainId && windowVisible) {
      // If chainId hasn't changed, don't clear the block. This prevents re-fetching still valid data.
      setChainBlock((chainBlock) => (chainBlock.chainId === activeChainId ? chainBlock : { chainId: activeChainId }))

      library
        .getBlockNumber()
        .then(onBlock)
        .catch((error) => {
          console.error(`Failed to get block number for chainId ${activeChainId}`, error)
        })

      library.on('block', onBlock)
      return () => {
        library.removeListener('block', onBlock)
      }
    }
    return undefined
  }, [activeChainId, library, onBlock, setChainBlock, windowVisible])

  const value = useMemo(
    () => ({
      blockNumber: chainId === activeChainId ? block : undefined,
      fastForward: (block: number) => setChainBlock({ chainId: activeChainId, block }),
    }),
    [activeChainId, block, chainId]
  )
  return <ChainBlockContext.Provider value={value}>{children}</ChainBlockContext.Provider>
}

/** Requires that BlockUpdater be installed in the DOM tree. */
export default function useBlockNumber(): number | undefined {
  return useContext(ChainBlockContext).blockNumber
}

export function useFastForwardBlockNumber(): (block: number) => void {
  return useContext(ChainBlockContext).fastForward
}
