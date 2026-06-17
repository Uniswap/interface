import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getTokenDetailsURLForMultichainEntry } from '~/pages/TokenDetails/context/tdpUrlUtils'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useMultichainTokenEntries } from '~/pages/TokenDetails/hooks/useMultichainTokenEntries'
import { getChainIdFromChainUrlParam } from '~/utils/params/chainParams'
import {
  CHAIN_SEARCH_PARAM,
  getTDPChainSearchParam,
  withChainSearchParam,
  withoutChainSearchParam,
} from '~/utils/params/chainQueryParam'

function getTDPPathChainId(pathname: string): UniverseChainId | undefined {
  const [, explore, tokens, chainName] = pathname.split('/')
  return explore === 'explore' && tokens === 'tokens' ? getChainIdFromChainUrlParam(chainName) : undefined
}

function getCurrentTDPUrlState({
  routerPathname,
  routerSearchParams,
}: {
  routerPathname: string
  routerSearchParams: URLSearchParams
}): { pathname: string; searchParams: URLSearchParams } {
  if (window.location.pathname.startsWith('/explore/tokens/')) {
    return {
      pathname: window.location.pathname,
      searchParams: new URLSearchParams(window.location.search),
    }
  }
  return { pathname: routerPathname, searchParams: routerSearchParams }
}

/**
 * Syncs `?chain=` ↔ `selectedMultichainChainId` for multi-deployment TDP.
 * With multichain UX on but a single-chain token, strips `?chain=` (no selector) and clears selection.
 * While `multiChainMap` is still empty (cold load), does not strip `?chain=` so deep links work once entries load.
 * Must render under TDPStoreContextProvider.
 */
export function TDPChainSearchParamSync(): null {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { currencyChainId, multiChainMap, selectedMultichainChainId } = useTDPStore((s) => ({
    currencyChainId: s.currencyChainId,
    multiChainMap: s.multiChainMap,
    selectedMultichainChainId: s.selectedMultichainChainId,
  }))
  const setSelectedMultichainChainId = useTDPStore((s) => s.actions.setSelectedMultichainChainId)

  const multichainEntries = useMultichainTokenEntries(multiChainMap)
  const multichainChainIds = useMemo(() => multichainEntries.map((e) => e.chainId), [multichainEntries])
  const isMultiChainAsset = multichainEntries.length > 1

  const currentTDPUrlState = getCurrentTDPUrlState({
    routerPathname: location.pathname,
    routerSearchParams: searchParams,
  })
  /** Raw `chain` query value; `null` when the key is absent (stable across unrelated param changes). */
  const chainQueryValue = currentTDPUrlState.searchParams.get(CHAIN_SEARCH_PARAM)
  const tdpChainSearchParam = useMemo(
    () => getTDPChainSearchParam(currentTDPUrlState.searchParams),
    // `chainQueryValue` is the only input the parse depends on; keying on the primitive keeps the
    // result referentially stable (avoids redundant effect runs). The fresh `URLSearchParams` per
    // render makes exhaustive-deps a false positive here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chainQueryValue],
  )
  const pathChainId = getTDPPathChainId(currentTDPUrlState.pathname) ?? currencyChainId

  useEffect(() => {
    // Single-chain page has no network selector; drop stale `?chain=` (e.g. from Portfolio / shared links).
    if (!isMultiChainAsset) {
      // While `multiChainMap` is still empty (cold load), does not strip `?chain=` so deep links work once entries load.
      if (multichainEntries.length === 0) {
        return
      }
      if (chainQueryValue !== null) {
        setSearchParams((prev) => withChainSearchParam(prev, undefined), { replace: true })
      }
      if (selectedMultichainChainId !== undefined) {
        setSelectedMultichainChainId(undefined)
      }
      return
    }

    const allowedChainIds = new Set(multichainChainIds)
    const pathChainSelection = allowedChainIds.has(pathChainId) ? pathChainId : undefined

    if (tdpChainSearchParam.type === 'multichain') {
      if (selectedMultichainChainId !== undefined) {
        setSelectedMultichainChainId(undefined)
      }
      return
    }

    if (tdpChainSearchParam.type === 'chain') {
      if (allowedChainIds.has(tdpChainSearchParam.chainId)) {
        const chainSelection = tdpChainSearchParam.chainId
        const selectedEntry = multichainEntries.find((entry) => entry.chainId === chainSelection)
        if (chainSelection !== pathChainId && selectedEntry) {
          navigate(getTokenDetailsURLForMultichainEntry({ entry: selectedEntry, searchParams }), { replace: true })
        } else if (chainQueryValue !== null) {
          setSearchParams((prev) => withoutChainSearchParam(prev), { replace: true })
        }
        if (selectedMultichainChainId !== chainSelection) {
          setSelectedMultichainChainId(chainSelection)
        }
      } else {
        setSearchParams((prev) => withoutChainSearchParam(prev), { replace: true })
        if (selectedMultichainChainId !== pathChainSelection) {
          setSelectedMultichainChainId(pathChainSelection)
        }
      }
      return
    }

    if (tdpChainSearchParam.type === 'invalid') {
      if (chainQueryValue !== null) {
        setSearchParams((prev) => withoutChainSearchParam(prev), { replace: true })
      }
    }

    if (selectedMultichainChainId !== pathChainSelection) {
      setSelectedMultichainChainId(pathChainSelection)
    }
  }, [
    chainQueryValue,
    tdpChainSearchParam,
    currencyChainId,
    pathChainId,
    isMultiChainAsset,
    multichainEntries.length,
    multichainEntries,
    multichainChainIds,
    navigate,
    searchParams,
    selectedMultichainChainId,
    setSearchParams,
    setSelectedMultichainChainId,
  ])

  return null
}
