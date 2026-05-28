import { useSearchParams } from 'react-router'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useEvent } from 'utilities/src/react/hooks'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { withChainSearchParam } from '~/utils/params/chainQueryParam'

export function useTDPSelectedMultichainChain(): {
  selectedMultichainChainId: UniverseChainId | undefined
  setSelectedMultichainChainId: (chainId: UniverseChainId | undefined) => void
} {
  const [, setSearchParams] = useSearchParams()
  const selectedMultichainChainId = useTDPStore((s) => s.selectedMultichainChainId)

  const setSelectedMultichainChainId = useEvent((chainId: UniverseChainId | undefined) => {
    setSearchParams((prev) => withChainSearchParam(prev, chainId), { replace: true })
  })

  return { selectedMultichainChainId, setSelectedMultichainChainId }
}
