import { ChainId } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { RPC_PROVIDERS } from 'constants/providers'
import useIsWindowVisible from 'hooks/useIsWindowVisible'
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const MISSING_PROVIDER = Symbol()
const BlockNumberContext = createContext<
  | {
      value?: number
      fastForward(block: number): void
      mainnetValue?: number
    }
  | typeof MISSING_PROVIDER
>(MISSING_PROVIDER)

function useBlockNumberContext() {
  const blockNumber = useContext(BlockNumberContext)
  if (blockNumber === MISSING_PROVIDER) {
    throw new Error('BlockNumber hooks must be wrapped in a <BlockNumberProvider>')
  }
  return blockNumber
}

/** Requires that BlockUpdater be installed in the DOM tree. */
export default function useBlockNumber(): number | undefined {
  return useBlockNumberContext().value
}

export function useFastForwardBlockNumber(): (block: number) => void {
  return useBlockNumberContext().fastForward
}

export function useMainnetBlockNumber(): number | undefined {
  return useBlockNumberContext().mainnetValue
}

export function BlockNumberProvider({ children }: { children: ReactNode }) {
  const { chainId: activeChainId, provider } = useWeb3React()
  const [{ chainId, block, mainnetBlock }, setChainBlock] = useState<{
    chainId?: number
    block?: number
    mainnetBlock?: number
  }>({
    chainId: activeChainId,
  })

  const onChainBlock = useCallback((chainId: number, block: number) => {
    setChainBlock((chainBlock) => {
      if (chainBlock.chainId === chainId) {
        if (!chainBlock.block || chainBlock.block < block) {
          return { chainId, block, mainnetBlock: chainId === ChainId.MAINNET ? block : chainBlock.mainnetBlock }
        }
      } else if (chainId === ChainId.MAINNET) {
        if (!chainBlock.mainnetBlock || chainBlock.mainnetBlock < block) {
          return { ...chainBlock, mainnetBlock: block }
        }
      }
      return chainBlock
    })
  }, [])

  const windowVisible = useIsWindowVisible()
  useEffect(() => {
    let stale = false

    if (provider && activeChainId && windowVisible) {
      // If chainId hasn't changed, don't clear the block. This prevents re-fetching still valid data.
      setChainBlock((chainBlock) =>
        chainBlock.chainId === activeChainId
          ? chainBlock
          : { chainId: activeChainId, mainnetBlock: chainBlock.mainnetBlock }
      )

      provider
        .getBlockNumber()
        .then((block) => {
          if (!stale) onChainBlock(activeChainId, block)
        })
        .catch((error) => {
          console.error(`Failed to get block number for chainId ${activeChainId}`, error)
        })

      const onBlock = (block: number) => onChainBlock(activeChainId, block)
      provider.on('block', onBlock)
      return () => {
        stale = true
        provider.removeListener('block', onBlock)
      }
    }

    return void 0
  }, [activeChainId, provider, windowVisible, onChainBlock])

  useEffect(() => {
    if (mainnetBlock === undefined) {
      RPC_PROVIDERS[ChainId.MAINNET]
        .getBlockNumber()
        .then((block) => {
          onChainBlock(ChainId.MAINNET, block)
        })
        // swallow errors - it's ok if this fails, as we'll try again if we activate mainnet
        .catch(() => undefined)
    }
  }, [mainnetBlock, onChainBlock])

  const value = useMemo(
    () => ({
      value: chainId === activeChainId ? block : undefined,
      fastForward: (update: number) => {
        if (block && update > block) {
          setChainBlock({ chainId: activeChainId, block: update })
        }
      },
      mainnetValue: mainnetBlock,
    }),
    [activeChainId, block, chainId, mainnetBlock]
  )
  return <BlockNumberContext.Provider value={value}>{children}</BlockNumberContext.Provider>
}
