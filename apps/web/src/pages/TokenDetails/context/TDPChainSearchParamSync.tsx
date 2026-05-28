import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useMultichainTokenEntries } from '~/pages/TokenDetails/hooks/useMultichainTokenEntries'
import { getChainIdFromChainUrlParam } from '~/utils/params/chainParams'
import { CHAIN_SEARCH_PARAM, withChainSearchParam } from '~/utils/params/chainQueryParam'

/**
 * Syncs `?chain=` ↔ `selectedMultichainChainId` for multi-deployment TDP.
 * With multichain UX on but a single-chain token, strips `?chain=` (no selector) and clears selection.
 * While `multiChainMap` is still empty (cold load), does not strip `?chain=` so deep links work once entries load.
 * Must render under TDPStoreContextProvider.
 */
export function TDPChainSearchParamSync(): null {
  const [searchParams, setSearchParams] = useSearchParams()
  const multichainTokenUxEnabled = useFeatureFlag(FeatureFlags.MultichainTokenUx)
  const multiChainMap = useTDPStore((s) => s.multiChainMap)
  const selectedMultichainChainId = useTDPStore((s) => s.selectedMultichainChainId)
  const setSelectedMultichainChainId = useTDPStore((s) => s.actions.setSelectedMultichainChainId)

  const multichainEntries = useMultichainTokenEntries(multiChainMap)
  const multichainChainIds = useMemo(() => multichainEntries.map((e) => e.chainId), [multichainEntries])
  const isMultiChainAsset = multichainEntries.length > 1

  /** Raw `chain` query value; `null` when the key is absent (stable across unrelated param changes). */
  const chainQueryValue = useMemo(() => searchParams.get(CHAIN_SEARCH_PARAM), [searchParams])

  const chainFromUrl = useMemo((): UniverseChainId | undefined => {
    if (chainQueryValue === null) {
      return undefined
    }
    return getChainIdFromChainUrlParam(chainQueryValue)
  }, [chainQueryValue])

  useEffect(() => {
    if (multichainTokenUxEnabled) {
      return
    }
    if (chainQueryValue !== null) {
      setSearchParams((prev) => withChainSearchParam(prev, undefined), { replace: true })
    }
  }, [chainQueryValue, multichainTokenUxEnabled, setSearchParams])

  useEffect(() => {
    if (!multichainTokenUxEnabled) {
      return
    }
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

    const allowed = new Set(multichainChainIds)

    if (chainFromUrl !== undefined) {
      if (allowed.has(chainFromUrl)) {
        if (selectedMultichainChainId !== chainFromUrl) {
          setSelectedMultichainChainId(chainFromUrl)
        }
      } else {
        setSearchParams((prev) => withChainSearchParam(prev, undefined), { replace: true })
      }
    } else {
      // No valid chain in URL: either missing `?chain=` or garbage / unknown param value (fails isChainUrlParam).
      if (chainQueryValue !== null) {
        setSearchParams((prev) => withChainSearchParam(prev, undefined), { replace: true })
      }
      if (selectedMultichainChainId !== undefined) {
        setSelectedMultichainChainId(undefined)
      }
    }
  }, [
    chainQueryValue,
    chainFromUrl,
    multichainTokenUxEnabled,
    isMultiChainAsset,
    multichainEntries.length,
    multichainChainIds,
    selectedMultichainChainId,
    setSearchParams,
    setSelectedMultichainChainId,
  ])

  return null
}
