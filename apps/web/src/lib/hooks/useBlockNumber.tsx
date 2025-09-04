/* eslint-disable import/no-unused-modules */
// TODO(WEB-4448): for multichain, refactored our custom useBlockNumber in favor of wagmi's hook. Remove this provider
import { RPC_PROVIDERS } from 'constants/providers'
import { useAccount } from 'hooks/useAccount'
import { useEthersProvider } from 'hooks/useEthersProvider'
import useIsWindowVisible from 'hooks/useIsWindowVisible'
import { atom } from 'jotai'
import { useAtomValue } from 'jotai/utils'
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

// MulticallUpdater is outside of the SwapAndLimitContext but we still want to use the swap context chainId for swap-related multicalls
export const multicallUpdaterSwapChainIdAtom = atom<UniverseChainId | undefined>(undefined)

const MISSING_PROVIDER = Symbol()

export const BlockNumberContext = createContext<
  | {
      fastForward(block: number): void
      block?: number
      mainnetBlock?: number
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
export function useFastForwardBlockNumber(): (block: number) => void {
  return useBlockNumberContext().fastForward
}
/** Requires that BlockUpdater be installed in the DOM tree. */
export default function useBlockNumber(): number | undefined {
  return useBlockNumberContext().block
}
export function useMainnetBlockNumber(): number | undefined {
  return useBlockNumberContext().mainnetBlock
}
export function BlockNumberProvider({ children }: PropsWithChildren) {
  const account = useAccount()
  const multicallUpdaterSwapChainId = useAtomValue(multicallUpdaterSwapChainIdAtom)
  const multicallChainId = multicallUpdaterSwapChainId ?? account.chainId
  const provider = useEthersProvider({ chainId: multicallChainId })
  const [{ chainId, block, mainnetBlock }, setChainBlock] = useState<{
    chainId?: number
    block?: number
    mainnetBlock?: number
  }>({})
  const activeBlock = chainId === multicallChainId ? block : undefined
  const onChainBlock = useCallback((chainId: number | undefined, block: number) => {
    setChainBlock((chainBlock) => {
      if (chainBlock.chainId === chainId) {
        if (!chainBlock.block || chainBlock.block < block) {
          const mainnetBlock = chainId === UniverseChainId.Mainnet ? block : chainBlock.mainnetBlock
          return { chainId, block, mainnetBlock }
        }
      } else if (chainId === UniverseChainId.Mainnet) {
        if (!chainBlock.mainnetBlock || chainBlock.mainnetBlock < block) {
          return { ...chainBlock, mainnetBlock: block }
        }
      }
      return chainBlock
    })
  }, [])
  // Poll for block number on the active provider.
  const windowVisible = useIsWindowVisible()
  useEffect(() => {
    if (provider && multicallChainId && windowVisible) {
      setChainBlock((chainBlock) => {
        if (chainBlock.chainId !== multicallChainId) {
          return { chainId: multicallChainId, mainnetBlock: chainBlock.mainnetBlock }
        }
        // If chainId hasn't changed, don't invalidate the reference, as it will trigger re-fetching of still-valid data.
        return chainBlock
      })
      const onBlock = (block: number) => onChainBlock(multicallChainId, block)
      provider.on('block', onBlock)
      return () => {
        provider.removeListener('block', onBlock)
      }
    }
    return undefined
  }, [provider, windowVisible, onChainBlock, multicallChainId])
  // Poll once for the mainnet block number using the network provider.
  useEffect(() => {
    RPC_PROVIDERS[UniverseChainId.Mainnet]
      .getBlockNumber()
      .then((block) => onChainBlock(UniverseChainId.Mainnet, block))
      // swallow errors - it's ok if this fails, as we'll try again if we activate mainnet
      .catch(() => undefined)
  }, [onChainBlock])
  const value = useMemo(
    () => ({
      fastForward: (update: number) => {
        if (multicallChainId) {
          onChainBlock(multicallChainId, update)
        }
      },
      block: activeBlock,
      mainnetBlock,
    }),
    [activeBlock, mainnetBlock, multicallChainId, onChainBlock],
  )
  return <BlockNumberContext.Provider value={value}>{children}</BlockNumberContext.Provider>
}
