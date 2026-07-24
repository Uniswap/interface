import { useLocation, useSearchParams } from 'react-router'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useEvent } from 'utilities/src/react/hooks'
import { getTokenDetailsURLForMultichainEntry } from '~/pages/TokenDetails/context/tdpUrlUtils'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useMultichainTokenEntries } from '~/pages/TokenDetails/hooks/useMultichainTokenEntries'
import { withChainSearchParam, withTDPMultichainSearchParam } from '~/utils/params/chainQueryParam'

function shallowReplaceUrl(url: string): void {
  window.history.replaceState(window.history.state, '', url)
}

function getCurrentTDPPathname(routerPathname: string): string {
  return window.location.pathname.startsWith('/explore/tokens/') ? window.location.pathname : routerPathname
}

export function useTDPSelectedMultichainChain(): {
  selectedMultichainChainId: UniverseChainId | undefined
  setSelectedMultichainChainId: (chainId: UniverseChainId | undefined) => void
} {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { multiChainMap, selectedMultichainChainId, setSelectedMultichainChainIdInStore } = useTDPStore((s) => ({
    multiChainMap: s.multiChainMap,
    selectedMultichainChainId: s.selectedMultichainChainId,
    setSelectedMultichainChainIdInStore: s.actions.setSelectedMultichainChainId,
  }))
  const multichainEntries = useMultichainTokenEntries(multiChainMap)

  const setSelectedMultichainChainId = useEvent((chainId: UniverseChainId | undefined) => {
    if (chainId === undefined) {
      setSelectedMultichainChainIdInStore(undefined)
      const params = withTDPMultichainSearchParam(searchParams)
      shallowReplaceUrl(`${getCurrentTDPPathname(location.pathname)}?${params.toString()}`)
      return
    }

    const entry = multichainEntries.find((candidate) => candidate.chainId === chainId)
    if (entry) {
      setSelectedMultichainChainIdInStore(chainId)
      shallowReplaceUrl(getTokenDetailsURLForMultichainEntry({ entry, searchParams }))
      return
    }

    setSearchParams((prev) => withChainSearchParam(prev, chainId), { replace: true })
  })

  return { selectedMultichainChainId, setSelectedMultichainChainId }
}
