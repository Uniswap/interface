import { useUpdateAtom } from 'jotai/utils'
import { multicallUpdaterSwapChainIdAtom } from 'lib/hooks/useBlockNumber'
import { PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react'
import { MultichainContext } from 'state/multichain/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export function MultichainContextProvider({
  children,
  initialChainId,
}: PropsWithChildren<{
  initialChainId?: UniverseChainId
}>) {
  const [selectedChainId, setSelectedChainId] = useState<UniverseChainId | undefined | null>(initialChainId)
  const [isUserSelectedToken, setIsUserSelectedToken] = useState<boolean>(false)

  const setMulticallUpdaterChainId = useUpdateAtom(multicallUpdaterSwapChainIdAtom)
  useEffect(() => {
    const chainId = selectedChainId ?? undefined
    setMulticallUpdaterChainId(chainId)
  }, [selectedChainId, setMulticallUpdaterChainId])

  const reset = useCallback(() => {
    setSelectedChainId(initialChainId)
    setIsUserSelectedToken(false)
  }, [initialChainId])

  const value = useMemo(() => {
    return {
      reset,
      setSelectedChainId,
      initialChainId,
      chainId: selectedChainId ?? undefined,
      isMultichainContext: true,
      isUserSelectedToken,
      setIsUserSelectedToken,
    }
  }, [initialChainId, selectedChainId, isUserSelectedToken, reset])
  return <MultichainContext.Provider value={value}>{children}</MultichainContext.Provider>
}
